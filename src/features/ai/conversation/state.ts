import type { Field, UserExperience } from '@/types';

/**
 * Conversation State Manager
 * Tracks the current state of the AI conversation
 */

export interface ConversationState {
  sessionId: string;
  currentFieldKey: string | null;  // Currently active field
  questionsAskedInCurrentField: number;
  completedFields: string[];
  fields: Field[];
  isComplete: boolean;
  userExperience?: UserExperience;  // 🆕 User's experience from modal
}

export function createInitialState(sessionId: string): ConversationState {
  return {
    sessionId,
    currentFieldKey: null,
    questionsAskedInCurrentField: 0,
    completedFields: [],
    fields: [],
    isComplete: false,
  };
}

/**
 * State update functions
 */

export function startNewTopic(
  state: ConversationState,
  field: Field
): ConversationState {
  return {
    ...state,
    currentFieldKey: field.field_key,
    questionsAskedInCurrentField: 1,
    fields: [...state.fields, field],
  };
}

export function incrementQuestionCount(
  state: ConversationState
): ConversationState {
  return {
    ...state,
    questionsAskedInCurrentField: state.questionsAskedInCurrentField + 1,
  };
}

export function completeTopic(
  state: ConversationState,
  fieldKey: string,
  content: string
): ConversationState {
  return {
    ...state,
    completedFields: [...state.completedFields, fieldKey],
    questionsAskedInCurrentField: 0,
    currentFieldKey: null,
    fields: state.fields.map((field) =>
      field.field_key === fieldKey
        ? { ...field, content, status: 'complete' as const }
        : field
    ),
  };
}

export function endSession(state: ConversationState): ConversationState {
  return {
    ...state,
    isComplete: true,
  };
}

/**
 * Helper to get current field
 */
export function getCurrentField(state: ConversationState): Field | undefined {
  return state.fields.find((f) => f.field_key === state.currentFieldKey);
}

/**
 * Helper to check if can ask more followups
 */
export function canAskFollowup(state: ConversationState): boolean {
  return state.questionsAskedInCurrentField < 5; // Max 5 questions per field
}
