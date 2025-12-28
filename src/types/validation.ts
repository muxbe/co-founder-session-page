/**
 * Validation Types
 * For smart answer validation with examples and suggestions
 */

/**
 * Answer quality levels
 */
export type AnswerQuality = 'excellent' | 'good' | 'vague' | 'unclear';

/**
 * Validation result from API
 */
export interface ValidationResult {
  valid: boolean;
  feedback: string;
  suggestion?: string;
  exampleForThisIdea?: string;
  answer_quality?: AnswerQuality;
}

/**
 * Validation request payload
 */
export interface ValidationRequest {
  question: string;
  answer: string;
  field_context: string;
  field_key: string;
  idea_description: string;
  user_experience?: {
    role?: string;
    business_experience?: string;
    startup_knowledge?: string;
  };
  memory_summary?: string;
}

/**
 * Example for user's specific idea
 */
export interface IdeaSpecificExample {
  example_answer: string;
  why_good: string;
  relevance_to_idea: string;
}

/**
 * Validation with multiple examples
 */
export interface EnhancedValidationResult extends ValidationResult {
  examples?: IdeaSpecificExample[];
  improvement_suggestions?: string[];
}
