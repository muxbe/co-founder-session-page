import type { Field } from '@/types';
import type { CompleteTopicParams } from './definitions';
import { handleStartTopic, StartTopicResult } from './startTopic';

export interface CompleteTopicResult {
  success: boolean;
  fieldKey: string;
  content: string;
  nextTopic?: StartTopicResult;
}

/**
 * Handle complete_topic tool call
 * Marks current field as complete with content
 * Optionally starts next topic immediately
 */
export function handleCompleteTopic(
  params: CompleteTopicParams,
  currentFieldKey: string,
  sessionId: string
): CompleteTopicResult {
  console.log('[completeTopic] Completing field:', currentFieldKey);
  console.log('[completeTopic] Content preview:', params.content.substring(0, 100) + '...');

  const result: CompleteTopicResult = {
    success: true,
    fieldKey: currentFieldKey,
    content: params.content,
  };

  // If next_topic is provided, start it immediately
  if (params.next_topic) {
    console.log('[completeTopic] Starting next topic:', params.next_topic.field_key);
    result.nextTopic = handleStartTopic(params.next_topic, sessionId);
  }

  return result;
}
