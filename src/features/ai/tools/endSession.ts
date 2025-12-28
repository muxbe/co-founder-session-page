import type { EndSessionParams } from './definitions';

export interface EndSessionResult {
  success: boolean;
  message: string;
  score: number;
  assessment: string;
  fieldsCompleted: string[];
}

/**
 * Handle end_session tool call
 * Finishes dialogue and prepares completion page data
 */
export function handleEndSession(
  params: EndSessionParams,
  completedFieldKeys: string[]
): EndSessionResult {
  console.log('[endSession] Ending session with score:', params.score);
  console.log('[endSession] Fields completed:', completedFieldKeys.join(', '));

  return {
    success: true,
    message: params.message,
    score: params.score,
    assessment: params.assessment,
    fieldsCompleted: completedFieldKeys,
  };
}
