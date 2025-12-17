'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Content } from '@google/generative-ai';
import type {
  ChatState,
  ChatStatus,
  Message,
  UserExperience,
  Field,
} from '@/types';
import { generateWithTools, sendFunctionResults, SYSTEM_PROMPT } from '@/features/ai/gemini/client';
import { executeToolCalls } from '@/features/ai/gemini/toolHandlers';
import type { AnalyzeIdeaPlanParams } from '@/features/ai/gemini/tools';

// Initial messages from გიორგი
const INTRO_MESSAGES = [
  {
    content: 'გამარჯობა! 👋 მე ვარ გიორგი, შენი AI ბიზნეს მენტორი.',
    delay: 0,
  },
  {
    content: 'დღეს ერთად შევქმნით შენი იდეის პასპორტს - დოკუმენტს, რომელიც დაგეხმარება ბიზნეს გეგმის ჩამოყალიბებაში.',
    delay: 1500,
  },
  {
    content: 'მოკლედ აღწერე შენი ბიზნეს იდეა. რა პრობლემას წყვეტ და როგორ?',
    delay: 3000,
  },
];

// Analyzing message
const ANALYZING_MESSAGE = 'მადლობა იდეისთვის! 🎉 ახლა იდეას ვაანალიზებ და საუბარს დავიწყებ.';

interface UseChatReturn {
  // State
  state: ChatState;
  isTyping: boolean;

  // Actions
  startSession: (sessionId: string) => void;
  submitIdea: (idea: string) => void;
  submitExperience: (experience: UserExperience) => void;
  submitAnswer: (answer: string) => void;

  // Helpers
  addBotMessage: (content: string, metadata?: Message['metadata']) => void;
  addUserMessage: (content: string) => void;
  setStatus: (status: ChatStatus) => void;
  setIsTyping: (typing: boolean) => void;
}

const initialState: ChatState = {
  status: 'intro',
  userExperience: null,
  currentFieldIndex: 0,
  currentQuestionIndex: 0,
  reaskCount: 0,
  fields: [],
  messages: [],
  currentFieldQuestionCount: 3,
  sessionMemory: null,
  isLoading: false,
  loadingMessage: '',
};

export function useChat(): UseChatReturn {
  const [state, setState] = useState<ChatState>(initialState);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ideaDescription, setIdeaDescription] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Content[]>([]);
  const [conversationPlan, setConversationPlan] = useState<AnalyzeIdeaPlanParams | null>(null);

  // Add a bot message
  const addBotMessage = useCallback((content: string, metadata?: Message['metadata']) => {
    const message: Message = {
      id: uuidv4(),
      session_id: sessionId || '',
      type: 'bot',
      content,
      metadata,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));

    return message;
  }, [sessionId]);

  // Add a user message
  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: uuidv4(),
      session_id: sessionId || '',
      type: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));

    return message;
  }, [sessionId]);

  // Set chat status
  const setStatus = useCallback((status: ChatStatus) => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  // Start a new session - show intro messages
  const startSession = useCallback(async (newSessionId: string) => {
    setSessionId(newSessionId);
    setState({ ...initialState, status: 'intro' });

    // Show intro messages with typing animation
    for (const intro of INTRO_MESSAGES) {
      // Wait for delay
      await new Promise((resolve) => setTimeout(resolve, intro.delay));

      // Show typing indicator
      setIsTyping(true);
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));
      setIsTyping(false);

      // Add message
      addBotMessage(intro.content);
    }
  }, [addBotMessage]);

  // Submit idea description
  const submitIdea = useCallback(async (idea: string) => {
    // Add user message
    addUserMessage(idea);
    setIdeaDescription(idea);

    // Transition to analyzing
    setStatus('analyzing');

    // Show typing indicator
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsTyping(false);

    // Show analyzing message
    addBotMessage(ANALYZING_MESSAGE);

    // Start AI conversation immediately (without experience form)
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTyping(false);

    try {
      await analyzeIdeaAndStartConversation(idea, null);
    } catch (error) {
      console.error('Error analyzing idea:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        loadingMessage: '',
      }));
      addBotMessage('სამწუხაროდ, შეცდომა მოხდა. გთხოვ, თავიდან სცადე. 😔');
    }
  }, [addUserMessage, addBotMessage, setStatus]);

  // Submit experience selection (DEPRECATED - keeping for backwards compatibility)
  const submitExperience = useCallback(async (experience: UserExperience) => {
    // This function is no longer used - experience is now gathered through conversation
    console.warn('submitExperience is deprecated - experience is now gathered through AI conversation');
  }, []);

  // Submit answer to current question
  const submitAnswer = useCallback(async (answer: string) => {
    addUserMessage(answer);

    // Show typing indicator while AI processes
    setIsTyping(true);

    try {
      await processAnswerWithAI(answer);
    } catch (error) {
      console.error('Error processing answer:', error);
      setIsTyping(false);
      addBotMessage('სამწუხაროდ, შეცდომა მოხდა. გთხოვ, თავიდან სცადე. 😔');
    }

  }, [addUserMessage, addBotMessage]);

  // Helper: Analyze idea and start AI-driven conversation
  const analyzeIdeaAndStartConversation = useCallback(async (
    idea: string,
    experience: UserExperience | null
  ) => {
    // Build conversation history with system prompt
    const history: Content[] = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'გამარჯობა! მზად ვარ დაგეხმარო შენი ბიზნეს იდეის განვითარებაში.' }],
      },
      {
        role: 'user',
        parts: [{
          text: `User's business idea: ${idea}\n\nIMPORTANT: You don't know the user's experience level yet. You should ask about their experience (role, business background, startup knowledge, idea stage) as part of your conversation. Include these as topics in your conversation strategy.\n\nAnalyze this idea and create a personalized conversation strategy. Start by asking about their experience first, then proceed to explore the business idea. Call the analyze_idea_and_plan_conversation tool.`,
        }],
      },
    ];

    setConversationHistory(history);

    // Call AI with tools
    const response = await generateWithTools(history);

    // Process function calls
    if (response.functionCalls) {
      const { results, stateUpdates } = await executeToolCalls(
        response.functionCalls,
        {
          sessionId: sessionId || '',
          fields: state.fields,
          sessionMemory: state.sessionMemory,
        }
      );

      // Update conversation history with function results
      const updatedHistory: Content[] = [
        ...history,
        {
          role: 'model',
          parts: response.functionCalls.map((fc) => ({
            functionCall: fc,
          })),
        },
        {
          role: 'user',
          parts: results.map((result) => ({
            functionResponse: {
              name: result.name,
              response: result.response,
            },
          })),
        },
      ];

      setConversationHistory(updatedHistory);

      // Store conversation plan
      if (stateUpdates.conversationPlan) {
        setConversationPlan(stateUpdates.conversationPlan);
      }

      // Ask AI to generate first question
      const followUpHistory = [
        ...updatedHistory,
        {
          role: 'user',
          parts: [{ text: 'Now generate the first question to ask the user. Call the generate_next_question tool.' }],
        },
      ];

      const questionResponse = await generateWithTools(followUpHistory);

      // Process question generation
      if (questionResponse.functionCalls) {
        const questionData = questionResponse.functionCalls[0].args as { question_text: string, examples?: string[] };

        // Update conversation history
        const finalHistory = [
          ...followUpHistory,
          {
            role: 'model',
            parts: questionResponse.functionCalls.map((fc) => ({ functionCall: fc })),
          },
        ];
        setConversationHistory(finalHistory);

        // Update state
        setState((prev) => ({
          ...prev,
          status: 'in-progress',
          isLoading: false,
          loadingMessage: '',
          fields: stateUpdates.newFields || prev.fields,
        }));

        // Show the question
        setIsTyping(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsTyping(false);

        addBotMessage(questionData.question_text, {
          examples: questionData.examples,
        });
      }
    }
  }, [sessionId, state.fields, state.sessionMemory, addBotMessage]);

  // Helper: Process answer with AI validation and follow-up
  const processAnswerWithAI = useCallback(async (answer: string) => {
    // Add user answer to conversation history
    const updatedHistory: Content[] = [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: `User's answer: ${answer}\n\nValidate this answer and decide next steps. Call validate_and_process_answer tool, then either ask a follow-up question or generate the next question on a different topic.` }],
      },
    ];

    setConversationHistory(updatedHistory);

    // Call AI with tools
    const response = await generateWithTools(updatedHistory);

    // Process function calls
    if (response.functionCalls) {
      const { results, stateUpdates } = await executeToolCalls(
        response.functionCalls,
        {
          sessionId: sessionId || '',
          fields: state.fields,
          sessionMemory: state.sessionMemory,
        }
      );

      // Update state with any field updates
      if (stateUpdates.newFields && stateUpdates.newFields.length > 0) {
        setState((prev) => ({
          ...prev,
          fields: [...prev.fields, ...stateUpdates.newFields!],
        }));
      }

      if (stateUpdates.updatedFields && stateUpdates.updatedFields.length > 0) {
        setState((prev) => ({
          ...prev,
          fields: prev.fields.map((field) => {
            const update = stateUpdates.updatedFields!.find(
              (u) => u.fieldKey === field.field_key
            );
            return update ? { ...field, ...update.updates } : field;
          }),
        }));
      }

      if (stateUpdates.memoryUpdate) {
        setState((prev) => ({
          ...prev,
          sessionMemory: {
            ...prev.sessionMemory,
            ...stateUpdates.memoryUpdate,
          } as any,
        }));
      }

      // Check if session is complete
      if (stateUpdates.sessionComplete && stateUpdates.completionData) {
        setState((prev) => ({ ...prev, status: 'session-complete' }));
        setIsTyping(false);
        addBotMessage(stateUpdates.completionData.completion_message);
        return;
      }

      // Update conversation history with function results
      const historyWithFunctionResults: Content[] = [
        ...updatedHistory,
        {
          role: 'model',
          parts: response.functionCalls.map((fc) => ({ functionCall: fc })),
        },
        {
          role: 'user',
          parts: results.map((result) => ({
            functionResponse: {
              name: result.name,
              response: result.response,
            },
          })),
        },
      ];

      setConversationHistory(historyWithFunctionResults);

      // Get AI's next response (question or follow-up)
      const nextResponse = await sendFunctionResults(
        historyWithFunctionResults,
        results
      );

      setIsTyping(false);

      // If AI generated text response, show it
      if (nextResponse.text) {
        addBotMessage(nextResponse.text);
      }

      // If AI wants to call more tools (like generate_next_question), process them
      if (nextResponse.functionCalls) {
        const nextQuestionData = nextResponse.functionCalls[0].args as { question_text: string, examples?: string[] };

        setIsTyping(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setIsTyping(false);

        addBotMessage(nextQuestionData.question_text, {
          examples: nextQuestionData.examples,
        });
      }
    }
  }, [conversationHistory, sessionId, state.fields, state.sessionMemory, addBotMessage]);

  return {
    state,
    isTyping,
    startSession,
    submitIdea,
    submitExperience,
    submitAnswer,
    addBotMessage,
    addUserMessage,
    setStatus,
    setIsTyping,
  };
}
