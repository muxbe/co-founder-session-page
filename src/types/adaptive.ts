/**
 * Adaptive Questioning Types
 * For dynamic question count based on user experience and field complexity
 */

/**
 * Field complexity levels
 */
export type FieldComplexity = 'low' | 'medium' | 'high';

/**
 * Previous field quality assessment
 */
export type PreviousFieldQuality = 'first_field' | 'vague' | 'adequate' | 'detailed';

/**
 * Depth decision request
 */
export interface DepthDecisionRequest {
  field_key: string;
  field_name: string;
  user_experience?: {
    role?: string;
    business_experience?: string;
    startup_knowledge?: 'beginner' | 'intermediate' | 'expert';
  };
  previous_field_quality?: PreviousFieldQuality;
  field_complexity?: FieldComplexity;
  idea_context?: string;
}

/**
 * Depth decision response
 */
export interface DepthDecisionResult {
  count: number;           // Number of questions to ask (2-7)
  reason: string;          // Explanation for the count
  complexity: FieldComplexity;
  quality_assessment: PreviousFieldQuality;
}

/**
 * Field complexity mapping
 */
export const FIELD_COMPLEXITY_MAP: Record<string, FieldComplexity> = {
  // Low complexity (2-3 questions)
  experience: 'low',
  team: 'low',
  mvp_features: 'low',

  // Medium complexity (3-5 questions)
  problem: 'medium',
  solution: 'medium',
  target_users: 'medium',
  marketing_strategy: 'medium',
  risks: 'medium',
  launch_plan: 'medium',

  // High complexity (5-7 questions)
  value_proposition: 'high',
  uvp: 'high',
  revenue_model: 'high',
  business_model: 'high',
  competitive_advantage: 'high',
  competition: 'high',
  financial_forecast: 'high',
  metrics: 'high',
};

/**
 * Base question count by complexity
 */
export const BASE_QUESTION_COUNT: Record<FieldComplexity, number> = {
  low: 2,
  medium: 4,
  high: 5,
};
