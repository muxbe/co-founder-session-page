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
 * Get Gemini 1.5 Pro model instance
 */
export function getGeminiModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: 'gemini-1.5-pro',
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

CONVERSATION STRATEGY:
- FIRST: Always start by asking about the user's experience (role, business background, startup knowledge, idea stage)
- Ask 2-3 quick questions to understand their experience level
- THEN: Based on their experience, explore the business idea with appropriate depth
- Adapt your language complexity based on their experience level

ALWAYS:
- Respond in Georgian (ქართული)
- Be friendly and encouraging
- Reference previous answers when relevant
- Give concrete examples from THIS user's idea
- Sign off as გიორგი when appropriate`;

/**
 * Get Gemini model with function calling support
 */
export function getGeminiModelWithTools(): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: 'gemini-1.5-pro',
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
  const model = getGeminiModelWithTools();

  // Start chat with conversation history
  const chat = model.startChat({
    history: conversationHistory.slice(0, -1), // All messages except the last one
  });

  // Send the last message
  const lastMessage = conversationHistory[conversationHistory.length - 1];
  const result = await chat.sendMessage(
    lastMessage.parts.map((part) => part.text || '').join('\n')
  );

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
