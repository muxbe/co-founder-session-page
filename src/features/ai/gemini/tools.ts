import type { FunctionDeclaration } from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";

/**
 * Gemini Function Calling Tools
 * These tools allow the AI to take structured actions during the conversation
 */

export const geminiTools: FunctionDeclaration[] = [
  {
    name: "analyze_idea_and_plan_conversation",
    description:
      "Analyze the user's business idea along with their experience level and create a personalized conversation strategy. Determines what topics to explore and in what order based on the idea complexity and user experience.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        idea_complexity: {
          type: SchemaType.STRING,
          description:
            "Assessment of idea complexity: 'simple' (single clear problem/solution), 'moderate' (multiple components), 'complex' (ecosystem/platform)",
          format: "enum",
          enum: ["simple", "moderate", "complex"],
        },
        key_topics_to_explore: {
          type: SchemaType.ARRAY,
          description:
            "Ordered list of topics to explore. MUST START WITH: 'user_experience_role', 'user_experience_background', 'user_experience_stage'. THEN: 'target_users', 'problem_validation', 'competition', 'monetization', 'mvp_features', etc.",
          items: {
            type: SchemaType.STRING,
          },
        },
        conversation_depth: {
          type: SchemaType.STRING,
          description:
            "How deep to go based on user experience: 'basic' (beginner-friendly), 'detailed' (intermediate), 'expert' (challenging questions)",
          format: "enum",
          enum: ["basic", "detailed", "expert"],
        },
        estimated_questions: {
          type: SchemaType.NUMBER,
          description: "Estimated total questions needed (8-15 typically)",
        },
        reasoning: {
          type: SchemaType.STRING,
          description: "Brief explanation of the conversation strategy",
        },
      },
      required: [
        "idea_complexity",
        "key_topics_to_explore",
        "conversation_depth",
        "estimated_questions",
        "reasoning",
      ],
    },
  },
  {
    name: "generate_next_question",
    description:
      "Generate the next question to ask the user based on conversation history and current topic being explored. Consider what information is still missing and what would be most valuable to learn next.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        question_text: {
          type: SchemaType.STRING,
          description:
            "The question to ask in Georgian language, conversational and friendly",
        },
        question_topic: {
          type: SchemaType.STRING,
          description:
            "Topic this question explores (e.g., 'target_users', 'problem_validation', 'competition')",
        },
        field_to_populate: {
          type: SchemaType.STRING,
          description:
            "Which passport field this will help fill: 'user_experience' (for experience questions), 'problem', 'solution', 'target_users', 'value_proposition', 'competition', 'business_model', 'mvp_features', 'risks', 'metrics'",
          format: "enum",
          enum: [
            "user_experience",
            "problem",
            "solution",
            "target_users",
            "value_proposition",
            "competition",
            "business_model",
            "mvp_features",
            "risks",
            "metrics",
          ],
        },
        why_asking: {
          type: SchemaType.STRING,
          description:
            "Brief reasoning for why this question is important now (used internally)",
        },
        examples: {
          type: SchemaType.ARRAY,
          description:
            "Optional: 2-3 example answers to help guide the user (in Georgian)",
          items: {
            type: SchemaType.STRING,
          },
        },
      },
      required: ["question_text", "question_topic", "field_to_populate"],
    },
  },
  {
    name: "validate_and_process_answer",
    description:
      "Validate the user's answer, extract key information, and decide next steps. Determines if a follow-up question is needed or if we can move to the next topic.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        answer_quality: {
          type: SchemaType.STRING,
          description:
            "'excellent' (detailed, specific), 'good' (sufficient), 'vague' (needs clarification), 'unclear' (didn't understand question)",
          format: "enum",
          enum: ["excellent", "good", "vague", "unclear"],
        },
        extracted_info: {
          type: SchemaType.OBJECT,
          description: "Key information extracted from the answer",
          properties: {
            entities: {
              type: SchemaType.ARRAY,
              description:
                "Important entities mentioned (competitors, features, user segments, numbers, locations)",
              items: {
                type: SchemaType.STRING,
              },
            },
            insights: {
              type: SchemaType.ARRAY,
              description: "Key insights or claims made by the user",
              items: {
                type: SchemaType.STRING,
              },
            },
          },
        },
        needs_followup: {
          type: SchemaType.BOOLEAN,
          description: "Whether a follow-up question is needed for clarification",
        },
        followup_question: {
          type: SchemaType.STRING,
          description:
            "If needs_followup is true, the follow-up question to ask (in Georgian)",
        },
        content_to_add: {
          type: SchemaType.STRING,
          description:
            "Synthesized content to add to the passport field based on this answer (in Georgian)",
        },
        field_key: {
          type: SchemaType.STRING,
          description: "Which field to update with this content",
        },
      },
      required: [
        "answer_quality",
        "extracted_info",
        "needs_followup",
        "content_to_add",
        "field_key",
      ],
    },
  },
  {
    name: "create_passport_field",
    description:
      "Create a new field in the idea passport when enough information has been gathered about a specific topic. This makes the field visible in the document panel.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        field_key: {
          type: SchemaType.STRING,
          description: "Unique identifier for the field",
          format: "enum",
          enum: [
            "user_experience",
            "problem",
            "solution",
            "target_users",
            "value_proposition",
            "competition",
            "business_model",
            "mvp_features",
            "risks",
            "metrics",
          ],
        },
        field_name: {
          type: SchemaType.STRING,
          description: "Display name in Georgian (e.g., 'პრობლემა', 'გადაწყვეტა')",
        },
        field_icon: {
          type: SchemaType.STRING,
          description: "Emoji icon for the field",
        },
        initial_content: {
          type: SchemaType.STRING,
          description: "Initial content to populate the field with (in Georgian)",
        },
        status: {
          type: SchemaType.STRING,
          description:
            "Field status: 'active' (still being filled), 'complete' (done)",
          format: "enum",
          enum: ["active", "complete"],
        },
      },
      required: ["field_key", "field_name", "field_icon", "initial_content"],
    },
  },
  {
    name: "update_field_content",
    description:
      "Update existing field content by adding or refining information based on new answers from the user.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        field_key: {
          type: SchemaType.STRING,
          description: "Which field to update",
          format: "enum",
          enum: [
            "user_experience",
            "problem",
            "solution",
            "target_users",
            "value_proposition",
            "competition",
            "business_model",
            "mvp_features",
            "risks",
            "metrics",
          ],
        },
        content_to_append: {
          type: SchemaType.STRING,
          description: "Content to add to the field (in Georgian)",
        },
        mark_complete: {
          type: SchemaType.BOOLEAN,
          description: "Whether to mark this field as complete",
        },
      },
      required: ["field_key", "content_to_append"],
    },
  },
  {
    name: "store_session_memory",
    description:
      "Store important information in session memory for later reference (entities, contradictions, field summaries).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        memory_type: {
          type: SchemaType.STRING,
          description: "Type of memory to store",
          format: "enum",
          enum: [
            "entity",
            "contradiction",
            "field_summary",
            "user_preference",
            "key_metric",
          ],
        },
        data: {
          type: SchemaType.OBJECT,
          description: "The data to store",
          properties: {},
        },
        reasoning: {
          type: SchemaType.STRING,
          description: "Why this is being stored",
        },
      },
      required: ["memory_type", "data"],
    },
  },
  {
    name: "complete_session",
    description:
      "Mark the session as complete when all critical information has been gathered. Generate a final summary and congratulate the user.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        completion_message: {
          type: SchemaType.STRING,
          description:
            "Final message to the user in Georgian, congratulating them and summarizing what was accomplished",
        },
        fields_completed: {
          type: SchemaType.ARRAY,
          description: "List of field keys that were successfully filled",
          items: {
            type: SchemaType.STRING,
          },
        },
        overall_assessment: {
          type: SchemaType.STRING,
          description:
            "Brief assessment of the idea's strength and next recommended steps (in Georgian)",
        },
        readiness_score: {
          type: SchemaType.NUMBER,
          description:
            "Score from 1-10 indicating how ready the idea is for next steps",
        },
      },
      required: [
        "completion_message",
        "fields_completed",
        "overall_assessment",
        "readiness_score",
      ],
    },
  },
];

/**
 * Tool execution types for type safety
 */
export type AnalyzeIdeaPlanParams = {
  idea_complexity: "simple" | "moderate" | "complex";
  key_topics_to_explore: string[];
  conversation_depth: "basic" | "detailed" | "expert";
  estimated_questions: number;
  reasoning: string;
};

export type GenerateQuestionParams = {
  question_text: string;
  question_topic: string;
  field_to_populate: string;
  why_asking?: string;
  examples?: string[];
};

export type ValidateAnswerParams = {
  answer_quality: "excellent" | "good" | "vague" | "unclear";
  extracted_info: {
    entities?: string[];
    insights?: string[];
  };
  needs_followup: boolean;
  followup_question?: string;
  content_to_add: string;
  field_key: string;
};

export type CreateFieldParams = {
  field_key: string;
  field_name: string;
  field_icon: string;
  initial_content: string;
  status?: "active" | "complete";
};

export type UpdateFieldParams = {
  field_key: string;
  content_to_append: string;
  mark_complete?: boolean;
};

export type StoreMemoryParams = {
  memory_type:
    | "entity"
    | "contradiction"
    | "field_summary"
    | "user_preference"
    | "key_metric";
  data: Record<string, unknown>;
  reasoning?: string;
};

export type CompleteSessionParams = {
  completion_message: string;
  fields_completed: string[];
  overall_assessment: string;
  readiness_score: number;
};
