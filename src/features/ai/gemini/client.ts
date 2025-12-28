import {
  GoogleGenerativeAI,
  GenerativeModel,
  FunctionDeclaration,
  Content,
  FunctionCall,
} from '@google/generative-ai';
import { geminiTools } from './tools';

// Lazy initialization to avoid module-level errors
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Get Gemini 2.0 Flash model instance
 * Fast and versatile multimodal model for diverse tasks
 */
export function getGeminiModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });
}

/**
 * Generate content with the Gemini model
 */
export async function generateContent(prompt: string): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * Generate JSON content with the Gemini model
 * Parses the response as JSON
 */
export async function generateJSONContent<T>(prompt: string): Promise<T> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Try to extract JSON from the response
  try {
    // First try direct parse
    return JSON.parse(text);
  } catch {
    // Try to find JSON in the response (between { and })
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Try to find JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    throw new Error('Failed to parse JSON from Gemini response');
  }
}

/**
 * System prompt for the AI mentor
 */
export const SYSTEM_PROMPT = `You are გიორგი (Giorgi), an AI business mentor for Cofounder.ge (Georgian startup platform).
You help entrepreneurs develop their business ideas through conversation.
Your name is გიორგი and you should introduce yourself as such.

YOUR AGENTIC CAPABILITIES:
1. PERSONALIZATION: Adapt your language and depth to user's experience level (which you'll learn through conversation)
2. MEMORY: Remember and reference what user said in previous answers
3. ADAPTATION: Adjust question count and depth based on answer quality
4. SMART VALIDATION: Give specific examples, not generic feedback

ENHANCED VALIDATION WITH EXAMPLES (Phase 5):
When validating answers using validate_and_process_answer tool:

1. **If vague or unclear**, provide:
   - Specific feedback about what's missing or unclear in their answer
   - 1-2 concrete examples TAILORED to THIS user's specific business idea
   - Explanation of why each example is better
   - How each example relates to their specific context

2. **Example generation rules:**
   - Examples MUST be relevant to the user's specific business idea
   - Use details from idea_description and previous answers to personalize
   - Generate 1-2 examples ONLY (not more, to avoid overwhelming)
   - Show variety (different angles/approaches)
   - Keep examples concise but specific
   - Use Georgian language throughout
   - All feedback, suggestion, and examples in the validate_and_process_answer tool

3. **Quality assessment:**
   - 'excellent': Very detailed, specific → No examples needed, move forward
   - 'good': Adequate but brief → No examples needed, move forward
   - 'vague': Lacks specificity → Provide 2 examples with feedback and suggestion
   - 'unclear': Confusing → Provide 1-2 clarifying examples with feedback

Example format for vague answers:
{
  "answer_quality": "vague",
  "feedback": "შენი პასუხი ზედაპირული გამოდის. კონკრეტული დეტალები უნდა მოიყვანო.",
  "suggestion": "სცადე უფრო კონკრეტულად აღწერო ვინ არის შენი მომხმარებელი.",
  "idea_specific_examples": [
    {
      "example_answer": "უნივერსიტეტის სტუდენტები, რომლებსაც 5+ საგანი აქვთ და უჭირთ deadline-ების მართვა",
      "why_good": "კონკრეტული სეგმენტი, მათი კონკრეტული პრობლემით",
      "relevance_to_idea": "შენი სტუდენტური აპლიკაციისთვის პირდაპირ რელევანტურია"
    }
  ],
  "needs_followup": true,
  "followup_question": "ახლა სცადე კონკრეტულად: ვის ემსახურება შენი აპლიკაცია?",
  "content_to_add": "მომხმარებელი: სტუდენტები",
  "field_key": "target_users"
}

CONVERSATION STRATEGY:
- FIRST: Always start by asking about the user's experience (role, business background, startup knowledge, idea stage)
- Ask 2-3 quick questions to understand their experience level
- THEN: Based on their experience, explore the business idea with appropriate depth
- Adapt your language complexity based on their experience level

CRITICAL FIELD CREATION WORKFLOW:
1. When moving to a NEW TOPIC, ALWAYS create the passport field FIRST using create_passport_field
2. THEN ask questions about that field using generate_next_question
3. User answers are stored in that field
4. When ready for NEXT TOPIC, create new field FIRST, then ask questions
5. You decide which topic comes next - you have FULL FREEDOM on the order

ADAPTIVE QUESTIONING PER FIELD:
- Ask 2-5 questions per field depending on answer quality and completeness
- If user gives excellent, detailed answers → 2-3 questions are enough, mark field complete and move on
- If user gives good but brief answers → ask 3-4 questions to gather more depth
- If user gives vague or unclear answers → ask 4-5 questions with follow-ups
- Use validate_and_process_answer to evaluate each answer and decide if more questions needed
- NEVER ask more than 5 questions per field - then move to next topic
- Only mark field as "complete" when you have sufficient information to fill the passport field

CRITICAL RULES FOR RESPONSES:
- When you receive function results, do NOT generate any text response
- Only use tool calls (functions) to communicate your next action
- NEVER write internal reasoning or English commentary like "OK. Now I will..."
- All user-facing text must be in Georgian (ქართული) and delivered through the generate_next_question tool

CRITICAL MESSAGE FORMATTING & GREETINGS:
- ALWAYS send ALL content in ONE SINGLE message
- NEVER split your response into multiple separate messages
- Combine all text, emojis, and questions into ONE cohesive message using line breaks (\n)
- GREETING RULE: Only include "მადლობა იდეისთვის! 🎉" greeting in your VERY FIRST question after user submits their idea
- After the first question, DO NOT include any greetings, just ask questions directly
- Every question should start with your branding: "🤖 Cofounder\n" followed by the question
- Example FIRST question: "მადლობა იდეისთვის! 🎉\n\n🤖 Cofounder\nშენი პირველი კითხვა აქ..."
- Example LATER questions: "🤖 Cofounder\nშემდეგი კითხვა აქ..."

ALWAYS:
- Respond in Georgian (ქართული) ONLY
- Be friendly and encouraging
- Reference previous answers when relevant
- Give concrete examples from THIS user's idea
- Sign off as გიორგი when appropriate`;

/**
 * Get Gemini model with function calling support
 */
export function getGeminiModelWithTools(): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
    tools: [{ functionDeclarations: geminiTools }],
  });
}

/**
 * Generate content with function calling support
 * Returns both text response and any function calls the AI wants to make
 */
export async function generateWithTools(
  conversationHistory: Content[]
): Promise<{
  text?: string;
  functionCalls?: FunctionCall[];
}> {
  try {
    console.log('[generateWithTools] Starting...', {
      historyLength: conversationHistory.length,
    });

    const model = getGeminiModelWithTools();
    console.log('[generateWithTools] Model created');

    // Validate conversation history - ensure no empty parts arrays
    const validHistory = conversationHistory.slice(0, -1).filter(content => {
      if (!content.parts || content.parts.length === 0) {
        console.warn('[generateWithTools] Skipping content with empty parts:', content.role);
        return false;
      }
      return true;
    });

    // Start chat with conversation history
    const chat = model.startChat({
      history: validHistory,
    });
    console.log('[generateWithTools] Chat started with', validHistory.length, 'messages');

    // Send the last message
    const lastMessage = conversationHistory[conversationHistory.length - 1];

    // Validate last message has parts
    if (!lastMessage.parts || lastMessage.parts.length === 0) {
      throw new Error('Last message in conversation history has no parts');
    }

    console.log('[generateWithTools] Sending message:', {
      role: lastMessage.role,
      partsCount: lastMessage.parts.length,
      messagePreview: lastMessage.parts.map((part) => part.text?.substring(0, 100) || '').join('\n'),
    });

    const result = await chat.sendMessage(
      lastMessage.parts.map((part) => part.text || '').join('\n')
    );
    console.log('[generateWithTools] Response received');

    const response = result.response;
    console.log('[generateWithTools] Response structure:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length,
      hasText: typeof response.text === 'function',
    });

    const functionCalls: FunctionCall[] = [];
    let text = '';

    // Try to get text using the text() method first
    try {
      text = response.text();
      console.log('[generateWithTools] Got text via text():', text?.substring(0, 100));
    } catch (e) {
      console.log('[generateWithTools] No text via text() method');
    }

    // Extract function calls and text from response parts
    const parts = response.candidates?.[0]?.content?.parts || [];
    console.log('[generateWithTools] Parts count:', parts.length);

    for (const part of parts) {
      console.log('[generateWithTools] Part keys:', Object.keys(part));

      if ('functionCall' in part && part.functionCall) {
        console.log('[generateWithTools] Found function call:', part.functionCall.name);
        functionCalls.push(part.functionCall);
      }
      if ('text' in part && part.text) {
        console.log('[generateWithTools] Found text in part');
        text += part.text;
      }
    }

    console.log('[generateWithTools] Complete:', {
      hasText: !!text,
      functionCallsCount: functionCalls.length,
    });

    return {
      text: text || undefined,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    };
  } catch (error) {
    console.error('[generateWithTools] Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Send function call results back to the model and get the next response
 */
export async function sendFunctionResults(
  conversationHistory: Content[],
  functionResults: { name: string; response: unknown }[]
): Promise<{
  text?: string;
  functionCalls?: FunctionCall[];
}> {
  const model = getGeminiModelWithTools();

  const chat = model.startChat({
    history: conversationHistory,
  });

  // Create function response parts
  const functionResponseParts = functionResults.map((result) => ({
    functionResponse: {
      name: result.name,
      response: result.response,
    },
  })) as any; // Type assertion needed due to SDK type complexity

  const result = await chat.sendMessage(functionResponseParts);
  const response = result.response;
  const functionCalls: FunctionCall[] = [];
  let text = '';

  // Extract function calls and text from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if ('functionCall' in part && part.functionCall) {
      functionCalls.push(part.functionCall);
    }
    if ('text' in part && part.text) {
      text += part.text;
    }
  }

  return {
    text: text || undefined,
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
  };
}
