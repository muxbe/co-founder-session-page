import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  FunctionCall,
} from '@google/generative-ai';
import { toolDefinitions } from './tools';
import { SYSTEM_PROMPT } from './prompts/system';

// Lazy initialization
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
 * Get Gemini model with 4-tool function calling
 */
export function getModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    },
    tools: [{ functionDeclarations: toolDefinitions }],
  });
}

/**
 * Build conversation history with system prompt
 */
export function buildHistory(
  userIdea: string,
  previousMessages: { role: 'user' | 'model'; content: string }[]
): Content[] {
  const history: Content[] = [
    // System prompt as first user message
    {
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }],
    },
    // Model acknowledges
    {
      role: 'model',
      parts: [{ text: 'გასაგებია. მზად ვარ დასახმარებლად.' }],
    },
  ];

  // Add previous conversation
  for (const msg of previousMessages) {
    if (msg.content) {
      history.push({
        role: msg.role,
        parts: [{ text: msg.content }],
      });
    }
  }

  return history;
}

/**
 * Send message and get AI response with function calls
 */
export async function chat(
  history: Content[],
  userMessage: string
): Promise<{
  text?: string;
  functionCalls?: FunctionCall[];
}> {
  const model = getModel();

  // Filter out empty content
  const validHistory = history.filter(
    (content) => content.parts && content.parts.length > 0
  );

  const chat = model.startChat({
    history: validHistory,
  });

  console.log('[client] Sending message to Gemini...');
  const result = await chat.sendMessage(userMessage);
  const response = result.response;

  // Extract function calls and text
  const functionCalls: FunctionCall[] = [];
  let text = '';

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if ('functionCall' in part && part.functionCall) {
      console.log('[client] Function call:', part.functionCall.name);
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
 * Send function results back to Gemini
 */
export async function sendFunctionResults(
  history: Content[],
  results: { name: string; response: unknown }[]
): Promise<{
  text?: string;
  functionCalls?: FunctionCall[];
}> {
  const model = getModel();

  const validHistory = history.filter(
    (content) => content.parts && content.parts.length > 0
  );

  const chatSession = model.startChat({
    history: validHistory,
  });

  // Create function response parts
  const functionResponseParts = results.map((result) => ({
    functionResponse: {
      name: result.name,
      response: result.response,
    },
  })) as any;

  console.log('[client] Sending function results to Gemini...');
  const result = await chatSession.sendMessage(functionResponseParts);
  const response = result.response;

  const functionCalls: FunctionCall[] = [];
  let text = '';

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if ('functionCall' in part && part.functionCall) {
      console.log('[client] Follow-up function call:', part.functionCall.name);
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

// Re-export for convenience
export { SYSTEM_PROMPT } from './prompts/system';
export { INITIAL_GREETING } from './prompts/system';
