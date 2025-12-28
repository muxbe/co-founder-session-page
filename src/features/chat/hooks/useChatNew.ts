'use client';

import { useState, useCallback, useRef } from 'react';
import type { Content, FunctionCall } from '@google/generative-ai';
import type { Field, Message, UserExperience } from '@/types';
import {
  INITIAL_GREETING,
  createInitialState,
  executeTools,
} from '@/features/ai';
import type { ConversationState } from '@/features/ai';
import { useMemory } from './useMemory'; // 🆕 Phase 2: Memory System

// API call helper
async function callChatAPI(
  history: Content[],
  message: string,
  completedFields: string[] = [],
  sessionId?: string
): Promise<{ text?: string; functionCalls?: FunctionCall[] }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, message, completedFields, sessionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API call failed');
  }

  return response.json();
}

// ============================================
// Types
// ============================================

type ChatStatus = 'idle' | 'ready' | 'chatting' | 'complete';

interface ChatState {
  status: ChatStatus;
  messages: Message[];
  fields: Field[];
  conversationState: ConversationState | null;
  showExperienceModal: boolean; // 🆕 Phase 4: Experience Modal
  pendingIdea: string | null; // 🆕 Phase 4: Idea waiting for experience
}

// ============================================
// Hook
// ============================================

export function useChatNew() {
  const [state, setState] = useState<ChatState>({
    status: 'idle',
    messages: [],
    fields: [],
    conversationState: null,
    showExperienceModal: false, // 🆕 Phase 4
    pendingIdea: null, // 🆕 Phase 4
  });
  const [isTyping, setIsTyping] = useState(false);

  // Conversation history for Gemini
  const historyRef = useRef<Content[]>([]);

  // 🆕 Phase 2: Memory System
  const {
    memory,
    updateMemoryWithAnswer,
    checkForContradictions,
    getMemorySummary,
    updateFieldSummary,
  } = useMemory(state.conversationState?.sessionId || '');

  // ============================================
  // Helper: Add message to chat
  // ============================================
  const addMessage = useCallback((type: 'user' | 'bot', content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      session_id: state.conversationState?.sessionId || '',
      type,
      content,
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
    return message;
  }, [state.conversationState?.sessionId]);

  // ============================================
  // Helper: Process AI response
  // ============================================
  const processAIResponse = useCallback(
    async (
      functionCalls: FunctionCall[] | undefined,
      convState: ConversationState
    ): Promise<{ question?: string; newState: ConversationState }> => {
      console.log('[processAIResponse] Called with', functionCalls?.length || 0, 'function calls');

      if (!functionCalls || functionCalls.length === 0) {
        console.warn('[useChat] No function calls from AI');
        return { newState: convState };
      }

      // Execute all tool calls
      console.log('[processAIResponse] Executing tools...');
      const result = executeTools(functionCalls, convState);
      console.log('[processAIResponse] Result:', {
        hasNewField: !!result.newField,
        newFieldKey: result.newField?.field_key,
        hasQuestion: !!result.question,
      });

      // Update fields in state (with deduplication)
      if (result.newField) {
        console.log('[processAIResponse] Adding new field to state:', result.newField.field_key);
        setState((prev) => {
          // Check if field with same field_key already exists
          const existingField = prev.fields.find(f => f.field_key === result.newField!.field_key);
          if (existingField) {
            console.log('[processAIResponse] ⚠️ Field already exists, skipping duplicate:', result.newField!.field_key);
            return prev; // Don't add duplicate
          }
          const newFields = [...prev.fields, result.newField!];
          console.log('[processAIResponse] New fields array:', newFields.map(f => f.field_key));
          return {
            ...prev,
            fields: newFields,
          };
        });
      }

      if (result.completedFieldKey && result.completedFieldContent) {
        setState((prev) => ({
          ...prev,
          fields: prev.fields.map((f) =>
            f.field_key === result.completedFieldKey
              ? { ...f, content: result.completedFieldContent!, status: 'complete' as const }
              : f
          ),
        }));
      }

      // Handle session end
      if (result.sessionEnd) {
        setState((prev) => ({ ...prev, status: 'complete' }));
        addMessage('bot', result.sessionEnd.message);

        // Store completion data and redirect (include sessionId for navigation)
        sessionStorage.setItem(
          'completionData',
          JSON.stringify({
            session_id: state.conversationState?.sessionId,
            completion_message: result.sessionEnd.message,
            readiness_score: result.sessionEnd.score / 10, // Convert to 1-10 scale
            overall_assessment: result.sessionEnd.assessment,
            fields_completed: result.sessionEnd.fieldsCompleted,
          })
        );

        setTimeout(() => {
          window.location.href = '/completion';
        }, 3000);

        return { newState: result.newState };
      }

      return {
        question: result.question,
        newState: result.newState,
      };
    },
    [addMessage]
  );

  // ============================================
  // Start Session
  // ============================================
  const startSession = useCallback((sessionId: string) => {
    console.log('[useChat] Starting session:', sessionId);

    // Initialize conversation state
    const convState = createInitialState(sessionId);

    // Initialize empty history (system prompt is added by API)
    historyRef.current = [];

    // Add greeting message
    addMessage('bot', INITIAL_GREETING);

    setState((prev) => ({
      ...prev,
      status: 'ready',
      conversationState: convState,
    }));
  }, [addMessage]);

  // ============================================
  // Submit Idea (First message)
  // ============================================
  const submitIdea = useCallback(
    async (idea: string) => {
      console.log('[useChat] submitIdea called, conversationState:', !!state.conversationState);
      if (!state.conversationState) {
        console.error('[useChat] ERROR: conversationState is null!');
        return;
      }

      console.log('[useChat] Submitting idea:', idea.substring(0, 50) + '...');

      // Add user message
      addMessage('user', idea);

      // Create "იდეა" field with the user's idea content - immediately complete
      // This is the user's input, not AI-generated, so it shows immediately
      const ideaField: Field = {
        id: `field-idea-${Date.now()}`,
        session_id: state.conversationState.sessionId,
        field_key: 'idea',
        name: 'იდეა',
        icon: '💡',
        status: 'complete', // Complete immediately - it's the user's input
        questions: [],
        answers: [],
        content: idea, // Show the idea content immediately
        order_index: 0,
        question_count: 1,
        depth_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 🆕 Phase 4: Show experience modal instead of directly calling AI
      console.log('[useChat] 🎯 Showing experience modal...');
      console.log('[useChat] 💡 Adding idea field:', ideaField);
      setState((prev) => {
        const newFields = [...prev.fields, ideaField];
        console.log('[useChat] 📋 New fields array:', newFields.length, newFields.map(f => f.field_key));
        return {
          ...prev,
          status: 'chatting',
          showExperienceModal: true,
          pendingIdea: idea,
          fields: newFields, // Add idea field immediately with content
        };
      });
    },
    [state.conversationState, addMessage]
  );

  // ============================================
  // 🆕 Phase 4: Handle Experience Modal Completion
  // ============================================
  const handleExperienceComplete = useCallback(
    async (experience: UserExperience) => {
      if (!state.conversationState || !state.pendingIdea) return;

      console.log('[useChat] 📊 Experience collected:', experience);

      // Hide modal (idea field is already complete)
      setState((prev) => ({
        ...prev,
        showExperienceModal: false,
      }));

      setIsTyping(true);

      try {
        // 1. Save experience to database
        console.log('[useChat] Saving experience to database...');
        const saveResponse = await fetch('/api/session/experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: state.conversationState.sessionId,
            experience,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save experience');
        }

        console.log('[useChat] ✅ Experience saved');

        // 2. Update conversation state with experience
        const updatedConvState = {
          ...state.conversationState,
          userExperience: experience,
        };

        // 3. Add to history
        const ideaMessage = `მომხმარებლის ბიზნეს იდეა: ${state.pendingIdea}\n\nმომხმარებლის გამოცდილება:\n- როლი: ${experience.role}\n- ბიზნეს გამოცდილება: ${experience.business_experience}\n- სტარტაპ ცოდნა: ${experience.startup_knowledge}\n- იდეის ეტაპი: ${experience.idea_stage}`;

        historyRef.current.push({
          role: 'user',
          parts: [{ text: ideaMessage }],
        });

        // 4. Send to AI (no completed fields yet - first message)
        console.log('[useChat] Sending to AI with experience context...');
        const response = await callChatAPI(historyRef.current, ideaMessage, [], updatedConvState.sessionId);

        // 5. Process function calls
        const { question, newState } = await processAIResponse(
          response.functionCalls,
          updatedConvState
        );

        // 6. Show question if we got one
        if (question) {
          addMessage('bot', question);

          // Add to history
          historyRef.current.push({
            role: 'model',
            parts: [{ text: question }],
          });
        }

        // 7. Update conversation state
        setState((prev) => ({
          ...prev,
          conversationState: newState,
          pendingIdea: null,
        }));
      } catch (error) {
        console.error('[useChat] Error:', error);
        addMessage('bot', 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.');
      } finally {
        setIsTyping(false);
      }
    },
    [state.conversationState, state.pendingIdea, addMessage, processAIResponse]
  );

  // ============================================
  // Submit Answer (Subsequent messages)
  // ============================================
  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!state.conversationState) return;

      console.log('[useChat] Submitting answer:', answer.substring(0, 50) + '...');

      // Add user message
      addMessage('user', answer);
      setIsTyping(true);

      // Add to history
      historyRef.current.push({
        role: 'user',
        parts: [{ text: answer }],
      });

      try {
        // 🆕 PHASE 2: CHECKING MEMORY STATE (from AI-questions-flow.md lines 132-150)
        // This implements the "CHECKING_MEMORY" state from the flow diagram
        console.log('[useChat] 🧠 CHECKING MEMORY...');

        // Get current field for context
        const currentField = state.fields.find(f => f.status === 'active');
        // Idea description is in conversation history, we can use first user message
        const ideaDescription = state.messages.find(m => m.type === 'user')?.content || '';

        if (currentField) {
          // 1. Extract entities and update memory
          console.log('[useChat] Extracting entities from answer...');
          await updateMemoryWithAnswer(answer, currentField.field_key, ideaDescription);

          // 2. Check for contradictions
          console.log('[useChat] Checking for contradictions...');
          const contradictionResult = await checkForContradictions(answer, currentField.field_key);

          // 3. If contradiction found, ask clarification
          if (contradictionResult.has_contradiction) {
            console.log('[useChat] ⚠️ Contradiction detected!');

            // Show clarification question to user
            const clarificationMsg = contradictionResult.clarification_question ||
              '🤔 შეამჩნიე რაღაც წინააღმდეგობა თქვენს პასუხებში. შეგიძლიათ დააზუსტოთ?';

            addMessage('bot', clarificationMsg);

            // Add to history
            historyRef.current.push({
              role: 'model',
              parts: [{ text: clarificationMsg }],
            });

            setIsTyping(false);
            return; // Stop here, wait for user to clarify
          }

          console.log('[useChat] ✅ No contradictions, proceeding...');
        }

        // 🆕 Pass memory summary to AI for context-aware questions
        const memorySummary = getMemorySummary();
        console.log('[useChat] Memory summary:', memorySummary ? 'Available' : 'Empty');

        // Get list of ALL field keys that exist (completed or active) to tell AI not to create them again
        const existingFieldKeys = state.fields.map(f => f.field_key);
        console.log('[useChat] Existing fields (do not create again):', existingFieldKeys);

        // Send to API with existing fields and sessionId
        const response = await callChatAPI(historyRef.current, answer, existingFieldKeys, state.conversationState?.sessionId);

        let currentState = state.conversationState;
        let question: string | undefined;

        // Process function calls
        if (response.functionCalls && response.functionCalls.length > 0) {
          const result = await processAIResponse(
            response.functionCalls,
            currentState
          );
          question = result.question;
          currentState = result.newState;

          // Note: Field completion and updates are already handled inside processAIResponse
        } else {
          // AI didn't call a tool - this shouldn't happen but handle gracefully
          console.warn('[useChat] ⚠️ AI returned no function calls, prompting to continue...');

          // If AI returned text (likely a question), show it
          if (response.text && /[\u10A0-\u10FF]/.test(response.text)) {
            // Contains Georgian text - show it as a question
            question = response.text;
          } else {
            // Fallback: Ask a generic follow-up
            question = '🤖 Cofounder\n\nგთხოვთ გააგრძელოთ - მეტი დეტალი მიამბეთ თქვენი იდეის შესახებ.';
          }
        }

        // Show question if we got one
        if (question) {
          addMessage('bot', question);

          // Add to history
          historyRef.current.push({
            role: 'model',
            parts: [{ text: question }],
          });
        }

        // Update conversation state
        setState((prev) => ({
          ...prev,
          conversationState: currentState,
        }));
      } catch (error) {
        console.error('[useChat] Error:', error);
        addMessage('bot', 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.');
      } finally {
        setIsTyping(false);
      }
    },
    [state.conversationState, state.fields, addMessage, processAIResponse, updateMemoryWithAnswer, checkForContradictions, getMemorySummary, updateFieldSummary]
  );

  // ============================================
  // Return
  // ============================================
  return {
    state: {
      status: state.status,
      messages: state.messages,
      fields: state.fields,
      showExperienceModal: state.showExperienceModal, // 🆕 Phase 4
      conversationState: state.conversationState, // 🆕 Phase 6: For user experience badge
    },
    isTyping,
    startSession,
    submitIdea,
    submitAnswer,
    handleExperienceComplete, // 🆕 Phase 4
  };
}
