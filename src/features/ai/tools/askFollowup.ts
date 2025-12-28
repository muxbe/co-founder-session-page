import type { AskFollowupParams } from './definitions';

export interface AskFollowupResult {
  success: boolean;
  question: string;
}

/**
 * Handle ask_followup tool call
 * Simply returns the follow-up question
 * Field stays in "active" status (showing "იწერება...")
 */
export function handleAskFollowup(
  params: AskFollowupParams
): AskFollowupResult {
  console.log('[askFollowup] Asking follow-up:', params.reason || 'no reason given');

  return {
    success: true,
    question: params.question,
  };
}
