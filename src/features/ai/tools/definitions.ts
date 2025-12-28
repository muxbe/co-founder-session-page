import type { FunctionDeclaration } from '@google/generative-ai';
import { SchemaType } from '@google/generative-ai';

/**
 * Tool Definitions for Gemini Function Calling
 * 4-Tool System for Idea Passport Conversations
 */

export const toolDefinitions: FunctionDeclaration[] = [
  {
    name: 'start_topic',
    description:
      'Start exploring a new topic/field in the business idea. Creates a new field in the passport and asks the first question about it. Use this when moving to a new aspect of the business idea.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        field_key: {
          type: SchemaType.STRING,
          description: 'Unique identifier for the field',
          format: 'enum',
          enum: [
            'idea',
            'problem',
            'solution',
            'target_users',
            'value_proposition',
            'competition',
            'revenue_model',
            'mvp_features',
            'risks',
            'metrics',
            'experience',
            'market_size',
            'pricing',
            'distribution',
            'team',
            'funding',
            'timeline',
            'technology',
            'legal',
            'partnerships',
            'growth',
          ],
        },
        field_name: {
          type: SchemaType.STRING,
          description: 'Display name in Georgian (e.g., "პრობლემა", "გადაწყვეტა")',
        },
        field_icon: {
          type: SchemaType.STRING,
          description: 'Emoji icon for the field',
        },
        question: {
          type: SchemaType.STRING,
          description:
            'First question to ask about this topic in Georgian. Should be friendly and conversational.',
        },
      },
      required: ['field_key', 'field_name', 'field_icon', 'question'],
    },
  },
  {
    name: 'ask_followup',
    description:
      'Ask a follow-up question about the current active field. Use this to dig deeper, clarify vague answers, or gather more details about the current topic.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        question: {
          type: SchemaType.STRING,
          description:
            'Follow-up question in Georgian. Should reference previous answer when relevant.',
        },
        reason: {
          type: SchemaType.STRING,
          description:
            'Brief internal note on why this follow-up is needed (for debugging)',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'complete_topic',
    description:
      'Mark the current field as complete. IMPORTANT: Always include next_topic to create the next field (unless ending session).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        content: {
          type: SchemaType.STRING,
          description:
            'Content summary in Georgian of what was learned about this topic to save in the passport field',
        },
        next_topic: {
          type: SchemaType.OBJECT,
          description: 'REQUIRED (except before end_session): Next topic to start. This creates the next field in the passport.',
          properties: {
            field_key: {
              type: SchemaType.STRING,
              description: 'Field key for next topic',
            },
            field_name: {
              type: SchemaType.STRING,
              description: 'Field name in Georgian',
            },
            field_icon: {
              type: SchemaType.STRING,
              description: 'Emoji icon',
            },
            question: {
              type: SchemaType.STRING,
              description: 'First question for next topic',
            },
          },
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'end_session',
    description:
      'Complete the entire conversation session when all critical topics have been explored. Provides final summary and next steps.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        message: {
          type: SchemaType.STRING,
          description:
            'Final congratulatory message to the user in Georgian, summarizing the session',
        },
        assessment: {
          type: SchemaType.STRING,
          description:
            'Brief assessment of the idea and recommended next steps (in Georgian)',
        },
        score: {
          type: SchemaType.NUMBER,
          description: 'Score from 1-10 indicating idea readiness',
        },
      },
      required: ['message', 'assessment', 'score'],
    },
  },
];

/**
 * Type definitions for tool parameters
 */

export interface StartTopicParams {
  field_key: string;
  field_name: string;
  field_icon: string;
  question: string;
}

export interface AskFollowupParams {
  question: string;
  reason?: string;
}

export interface CompleteTopicParams {
  content: string;
  next_topic?: {
    field_key: string;
    field_name: string;
    field_icon: string;
    question: string;
  };
}

export interface EndSessionParams {
  message: string;
  assessment: string;
  score: number;
}

export type ToolParams =
  | StartTopicParams
  | AskFollowupParams
  | CompleteTopicParams
  | EndSessionParams;
