/**
 * Quality Assessment Utilities
 * Helper functions for adaptive questioning
 */

import type { Field } from '@/types';
import type { PreviousFieldQuality, FieldComplexity } from '@/types/adaptive';
import { FIELD_COMPLEXITY_MAP } from '@/types/adaptive';

/**
 * Assess the quality of previous field based on answer lengths
 */
export function getPreviousFieldQuality(
  fields: Field[],
  currentFieldIndex: number
): PreviousFieldQuality {
  // If this is the first field
  if (currentFieldIndex === 0 || fields.length === 0) {
    return 'first_field';
  }

  // Get previous completed field
  const previousField = fields[currentFieldIndex - 1];

  if (!previousField || !previousField.answers || previousField.answers.length === 0) {
    return 'first_field';
  }

  // Calculate average answer length
  const answers = previousField.answers.filter(a => a && a.length > 0);

  if (answers.length === 0) {
    return 'vague';
  }

  const avgLength = answers.reduce((sum, a) => sum + a.length, 0) / answers.length;

  // Classify based on average length
  if (avgLength > 200) {
    return 'detailed';      // Long, thorough answers
  } else if (avgLength > 50) {
    return 'adequate';      // Decent answers
  } else {
    return 'vague';         // Short, minimal answers
  }
}

/**
 * Get field complexity from field key
 */
export function getFieldComplexity(fieldKey: string): FieldComplexity {
  return FIELD_COMPLEXITY_MAP[fieldKey] || 'medium';
}

/**
 * Calculate answer quality for a specific answer
 */
export function calculateAnswerQuality(answer: string): {
  length: number;
  wordCount: number;
  hasDetails: boolean;
  quality: 'excellent' | 'good' | 'vague' | 'unclear';
} {
  const length = answer.length;
  const wordCount = answer.split(/\s+/).filter(w => w.length > 0).length;

  // Check if answer has specific details (numbers, Georgian text, etc.)
  const hasNumbers = /\d/.test(answer);
  const hasGeorgianText = /[\u10A0-\u10FF]/.test(answer);
  const hasDetails = hasNumbers || length > 100;

  let quality: 'excellent' | 'good' | 'vague' | 'unclear';

  if (length > 200 && hasDetails) {
    quality = 'excellent';
  } else if (length > 50 && wordCount > 10) {
    quality = 'good';
  } else if (length > 20) {
    quality = 'vague';
  } else {
    quality = 'unclear';
  }

  return {
    length,
    wordCount,
    hasDetails,
    quality,
  };
}

/**
 * Check if we should ask more questions based on answer quality
 */
export function shouldAskMoreQuestions(
  currentQuestionIndex: number,
  totalPlannedQuestions: number,
  lastAnswer: string,
  userExperience?: { startup_knowledge?: string }
): boolean {
  // If we haven't reached planned questions, continue
  if (currentQuestionIndex < totalPlannedQuestions - 1) {
    // But if answer was very detailed and user is expert, might skip some
    if (userExperience?.startup_knowledge === 'expert' && lastAnswer.length > 300) {
      // Only skip if there are 2+ remaining questions
      const remaining = totalPlannedQuestions - currentQuestionIndex - 1;
      if (remaining > 1) {
        console.log('[Quality Assessment] Skipping remaining questions - expert gave detailed answer');
        return false;
      }
    }
    return true;
  }

  // Reached planned questions
  return false;
}

/**
 * Get recommended question count adjustment based on real-time factors
 */
export function getQuestionCountAdjustment(params: {
  baseCount: number;
  userExperience?: { startup_knowledge?: string };
  previousQuality: PreviousFieldQuality;
  fieldComplexity: FieldComplexity;
}): number {
  let adjustment = 0;
  const { baseCount, userExperience, previousQuality, fieldComplexity } = params;

  // Adjust for user experience
  if (userExperience?.startup_knowledge === 'expert') {
    adjustment -= 2;
  } else if (userExperience?.startup_knowledge === 'beginner') {
    adjustment += 2;
  }

  // Adjust for previous quality
  if (previousQuality === 'detailed') {
    adjustment -= 1;
  } else if (previousQuality === 'vague') {
    adjustment += 1;
  }

  // Adjust for field complexity
  if (fieldComplexity === 'high') {
    adjustment += 1;
  } else if (fieldComplexity === 'low') {
    adjustment -= 1;
  }

  // Apply adjustment with bounds
  const finalCount = Math.max(2, Math.min(7, baseCount + adjustment));

  console.log(`[Quality Assessment] Base: ${baseCount}, Adjustment: ${adjustment}, Final: ${finalCount}`);

  return finalCount;
}
