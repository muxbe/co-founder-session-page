/**
 * API Client for Testing
 * Makes HTTP calls to the running dev server
 */

import type { Content } from '@google/generative-ai';
import { randomUUID } from 'crypto';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

export interface UserExperience {
  hasExperience: boolean;
  experienceYears: number;
  domainKnowledge: 'none' | 'basic' | 'intermediate' | 'expert';
  educationLevel: 'none' | 'self-taught' | 'bootcamp' | 'university';
}

export interface Field {
  id: string;
  session_id: string;
  field_key: string;
  name: string;
  icon: string;
  status: 'active' | 'complete' | 'pending';
  questions: string[];
  answers: string[];
  content: string | null;
  order_index: number;
  question_count: number;
  depth_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  text?: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
  toolResults?: unknown;
  stateUpdates?: {
    fields?: Field[];
    currentFieldKey?: string;
    completedFields?: string[];
    isComplete?: boolean;
  };
}

export interface SessionMemory {
  mentioned_entities: Record<string, unknown>;
  field_summaries: Record<string, string>;
  contradictions: Array<unknown>;
  user_preferences: Record<string, unknown>;
  key_metrics: Record<string, unknown>;
}

/**
 * API Client class for making requests to the dev server
 */
export class ApiClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private conversationHistory: Content[] = [];
  private fields: Field[] = [];
  private currentState: {
    fields: Field[];
    sessionMemory: SessionMemory | null;
  } = {
    fields: [],
    sessionMemory: null,
  };

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a unique session ID (UUID format for database compatibility)
   */
  generateSessionId(): string {
    return randomUUID();
  }

  /**
   * Create a new session
   */
  async createSession(sessionId?: string): Promise<{ success: boolean; session?: unknown; error?: string }> {
    this.sessionId = sessionId || this.generateSessionId();

    const response = await fetch(`${this.baseUrl}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: this.sessionId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create session' };
    }

    return { success: true, session: data.session };
  }

  /**
   * Save user experience to the session
   */
  async saveExperience(experience: UserExperience): Promise<{ success: boolean; error?: string }> {
    if (!this.sessionId) {
      return { success: false, error: 'No session created' };
    }

    const response = await fetch(`${this.baseUrl}/api/session/experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: this.sessionId,
        experience,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to save experience' };
    }

    return { success: true };
  }

  /**
   * Send a chat message and get AI response
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    if (!this.sessionId) {
      throw new Error('No session created. Call createSession() first.');
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await fetch(`${this.baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationHistory: this.conversationHistory,
        sessionId: this.sessionId,
        currentState: this.currentState,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Chat request failed');
    }

    const data: ChatResponse = await response.json();

    // Add assistant response to history
    if (data.text) {
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: data.text }],
      });
    }

    // Update state if there are updates
    if (data.stateUpdates) {
      if (data.stateUpdates.fields) {
        this.fields = data.stateUpdates.fields;
        this.currentState.fields = data.stateUpdates.fields;
      }
    }

    return data;
  }

  /**
   * Submit the initial business idea
   * This simulates what happens when user submits their idea
   */
  async submitIdea(idea: string): Promise<ChatResponse> {
    // The idea submission is the first message
    // It should trigger the AI to call start_topic for the first field
    return this.sendMessage(idea);
  }

  /**
   * Answer a follow-up question
   */
  async answerQuestion(answer: string): Promise<ChatResponse> {
    return this.sendMessage(answer);
  }

  /**
   * Get all fields for the current session
   */
  getFields(): Field[] {
    return this.fields;
  }

  /**
   * Get the session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Content[] {
    return this.conversationHistory;
  }

  /**
   * Reset the client state
   */
  reset(): void {
    this.sessionId = null;
    this.conversationHistory = [];
    this.fields = [];
    this.currentState = {
      fields: [],
      sessionMemory: null,
    };
  }

  /**
   * Check if the server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test-gemini`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Save memory to database
   */
  async saveMemory(memory: SessionMemory): Promise<{ success: boolean; error?: string }> {
    if (!this.sessionId) {
      return { success: false, error: 'No session created' };
    }

    const response = await fetch(`${this.baseUrl}/api/memory/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: this.sessionId,
        memory,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to save memory' };
    }

    this.currentState.sessionMemory = memory;
    return { success: true };
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(baseUrl?: string): ApiClient {
  return new ApiClient(baseUrl);
}

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function until it succeeds or times out
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delay?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await wait(delay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
