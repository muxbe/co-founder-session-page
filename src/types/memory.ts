/**
 * Memory System Types
 * For tracking entities, contradictions, and summaries across the conversation
 */

/**
 * Entities mentioned by the user throughout the conversation
 */
export interface MentionedEntities {
  audiences: string[];      // "სტუდენტები", "SMBs", "IT სპეციალისტები"
  competitors: string[];    // "ChatGPT", "Notion", "Google Docs"
  features: string[];       // "AI chat", "PDF export", "real-time collaboration"
  numbers: string[];        // "500 ლარი", "3 months", "1000 users"
  locations: string[];      // "თბილისი", "Georgia", "Europe"
}

/**
 * Summary of what was discussed in each field
 */
export interface FieldSummaries {
  [fieldKey: string]: string;  // fieldKey => brief summary (200 chars max)
}

/**
 * Detected contradictions in user's answers
 */
export interface Contradiction {
  id: string;
  field1: string;           // First field where info was mentioned
  field2: string;           // Second field with contradicting info
  statement1: string;       // What was said in field1
  statement2: string;       // What was said in field2
  clarification?: string;   // User's clarification if provided
  resolved: boolean;        // Whether contradiction was resolved
  created_at: string;
}

/**
 * Complete session memory structure
 */
export interface SessionMemory {
  id?: string;
  session_id: string;

  // Entities extracted from answers
  mentioned_entities: MentionedEntities;

  // Summaries of completed fields
  field_summaries: FieldSummaries;

  // Detected contradictions
  contradictions: Contradiction[];

  // User preferences detected during conversation
  user_preferences?: {
    communication_style?: 'formal' | 'casual';
    detail_level?: 'brief' | 'detailed';
    question_pace?: 'fast' | 'normal' | 'slow';
  };

  // Key metrics mentioned
  key_metrics?: {
    revenue_target?: string;
    user_target?: string;
    timeline?: string;
  };

  created_at?: string;
  updated_at?: string;
}

/**
 * Initial empty memory state
 */
export const initialMemory: Omit<SessionMemory, 'session_id'> = {
  mentioned_entities: {
    audiences: [],
    competitors: [],
    features: [],
    numbers: [],
    locations: [],
  },
  field_summaries: {},
  contradictions: [],
  user_preferences: {},
  key_metrics: {},
};

/**
 * Memory update payload for API calls
 */
export interface MemoryUpdatePayload {
  type: 'entities' | 'summary' | 'contradiction' | 'preference' | 'metric';
  data: Partial<SessionMemory>;
}

/**
 * Entity extraction API response
 */
export interface ExtractedEntities {
  audiences: string[];
  competitors: string[];
  features: string[];
  numbers: string[];
  locations: string[];
}

/**
 * Contradiction check API response
 */
export interface ContradictionCheckResult {
  has_contradiction: boolean;
  contradiction_details?: {
    field1: string;
    field2: string;
    statement1: string;
    statement2: string;
    explanation: string;
  };
  clarification_question?: string;
}
