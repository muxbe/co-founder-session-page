import type { Field } from '@/types';
import type { StartTopicParams } from './definitions';

export interface StartTopicResult {
  success: boolean;
  field: Field;
  question: string;
}

/**
 * Handle start_topic tool call
 * Creates a new field and returns the first question
 */
export function handleStartTopic(
  params: StartTopicParams,
  sessionId: string
): StartTopicResult {
  console.log('[startTopic] Creating field:', params.field_key);

  const newField: Field = {
    id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    session_id: sessionId,
    field_key: params.field_key,
    name: params.field_name,
    icon: params.field_icon,
    status: 'active', // Shows "იწერება..." animation
    questions: [params.question],
    answers: [],
    content: '',
    order_index: 0,
    question_count: 1,
    depth_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    success: true,
    field: newField,
    question: params.question,
  };
}
