import type { FunctionCall } from '@google/generative-ai';
import type { Field, SessionMemory } from '@/types';
import {
  AnalyzeIdeaPlanParams,
  GenerateQuestionParams,
  ValidateAnswerParams,
  CreateFieldParams,
  UpdateFieldParams,
  StoreMemoryParams,
  CompleteSessionParams,
} from './tools';

/**
 * Tool execution results that update the chat state
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  // State updates
  newField?: Field;
  updatedField?: { fieldKey: string; updates: Partial<Field> };
  memoryUpdate?: Partial<SessionMemory>;
  sessionComplete?: boolean;
  completionData?: CompleteSessionParams;
  conversationPlan?: AnalyzeIdeaPlanParams;
}

/**
 * Execute tool calls from Gemini and return results
 */
export async function executeToolCalls(
  functionCalls: FunctionCall[],
  currentState: {
    sessionId: string;
    fields: Field[];
    sessionMemory: SessionMemory | null;
  }
): Promise<{
  results: { name: string; response: ToolExecutionResult }[];
  stateUpdates: {
    newFields?: Field[];
    updatedFields?: { fieldKey: string; updates: Partial<Field> }[];
    memoryUpdate?: Partial<SessionMemory>;
    sessionComplete?: boolean;
    completionData?: CompleteSessionParams;
    conversationPlan?: AnalyzeIdeaPlanParams;
  };
}> {
  const results: { name: string; response: ToolExecutionResult }[] = [];
  const stateUpdates: {
    newFields?: Field[];
    updatedFields?: { fieldKey: string; updates: Partial<Field> }[];
    memoryUpdate?: Partial<SessionMemory>;
    sessionComplete?: boolean;
    completionData?: CompleteSessionParams;
    conversationPlan?: AnalyzeIdeaPlanParams;
  } = {
    newFields: [],
    updatedFields: [],
  };

  for (const functionCall of functionCalls) {
    const { name, args } = functionCall;

    let result: ToolExecutionResult;

    switch (name) {
      case 'analyze_idea_and_plan_conversation':
        result = await handleAnalyzeIdea(args as AnalyzeIdeaPlanParams);
        if (result.conversationPlan) {
          stateUpdates.conversationPlan = result.conversationPlan;
        }
        break;

      case 'generate_next_question':
        result = await handleGenerateQuestion(args as GenerateQuestionParams);
        break;

      case 'validate_and_process_answer':
        result = await handleValidateAnswer(
          args as ValidateAnswerParams,
          currentState
        );
        if (result.updatedField) {
          stateUpdates.updatedFields!.push(result.updatedField);
        }
        if (result.memoryUpdate) {
          stateUpdates.memoryUpdate = {
            ...stateUpdates.memoryUpdate,
            ...result.memoryUpdate,
          };
        }
        break;

      case 'create_passport_field':
        result = await handleCreateField(
          args as CreateFieldParams,
          currentState.sessionId
        );
        if (result.newField) {
          stateUpdates.newFields!.push(result.newField);
        }
        break;

      case 'update_field_content':
        result = await handleUpdateField(
          args as UpdateFieldParams,
          currentState.fields
        );
        if (result.updatedField) {
          stateUpdates.updatedFields!.push(result.updatedField);
        }
        break;

      case 'store_session_memory':
        result = await handleStoreMemory(
          args as StoreMemoryParams,
          currentState.sessionMemory
        );
        if (result.memoryUpdate) {
          stateUpdates.memoryUpdate = {
            ...stateUpdates.memoryUpdate,
            ...result.memoryUpdate,
          };
        }
        break;

      case 'complete_session':
        result = await handleCompleteSession(args as CompleteSessionParams);
        stateUpdates.sessionComplete = true;
        stateUpdates.completionData = args as CompleteSessionParams;
        break;

      default:
        result = { success: false, data: { error: 'Unknown tool' } };
    }

    results.push({ name, response: result });
  }

  return { results, stateUpdates };
}

async function handleAnalyzeIdea(
  args: AnalyzeIdeaPlanParams
): Promise<ToolExecutionResult> {
  console.log('🤖 AI analyzed idea:', args);
  return {
    success: true,
    data: { message: 'Conversation plan created' },
    conversationPlan: args,
  };
}

async function handleGenerateQuestion(
  args: GenerateQuestionParams
): Promise<ToolExecutionResult> {
  console.log('🤖 AI generated question:', args.question_topic);
  return {
    success: true,
    data: { message: 'Question generated' },
  };
}

async function handleValidateAnswer(
  args: ValidateAnswerParams,
  currentState: {
    sessionId: string;
    fields: Field[];
    sessionMemory: SessionMemory | null;
  }
): Promise<ToolExecutionResult> {
  console.log('🤖 AI validated answer:', args.answer_quality);

  const result: ToolExecutionResult = {
    success: true,
    data: { message: 'Answer validated' },
  };

  // Find or prepare the field to update
  const existingField = currentState.fields.find(
    (f) => f.field_key === args.field_key
  );

  if (existingField) {
    // Update existing field
    result.updatedField = {
      fieldKey: args.field_key,
      updates: {
        content: existingField.content
          ? `${existingField.content}\n\n${args.content_to_add}`
          : args.content_to_add,
      },
    };
  }

  // Update memory with extracted info
  if (args.extracted_info) {
    const currentEntities = currentState.sessionMemory?.mentioned_entities || {
      audiences: [],
      competitors: [],
      features: [],
      numbers: [],
      locations: [],
    };

    result.memoryUpdate = {
      mentioned_entities: {
        audiences: args.extracted_info.entities || currentEntities.audiences,
        competitors: currentEntities.competitors,
        features: currentEntities.features,
        numbers: currentEntities.numbers,
        locations: currentEntities.locations,
      },
    };
  }

  return result;
}

async function handleCreateField(
  args: CreateFieldParams,
  sessionId: string
): Promise<ToolExecutionResult> {
  console.log('🤖 AI creating field:', args.field_key);

  const newField: Field = {
    id: `temp-${Date.now()}`,
    session_id: sessionId,
    field_key: args.field_key,
    name: args.field_name,
    icon: args.field_icon,
    status: args.status || 'active',
    questions: [],
    answers: [],
    content: args.initial_content,
    order_index: 0,
    question_count: 3,
    depth_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    success: true,
    data: { message: 'Field created' },
    newField,
  };
}

async function handleUpdateField(
  args: UpdateFieldParams,
  currentFields: Field[]
): Promise<ToolExecutionResult> {
  console.log('🤖 AI updating field:', args.field_key);

  const existingField = currentFields.find(
    (f) => f.field_key === args.field_key
  );

  if (!existingField) {
    return {
      success: false,
      data: { error: 'Field not found' },
    };
  }

  return {
    success: true,
    data: { message: 'Field updated' },
    updatedField: {
      fieldKey: args.field_key,
      updates: {
        content: existingField.content
          ? `${existingField.content}\n\n${args.content_to_append}`
          : args.content_to_append,
        status: args.mark_complete ? 'complete' : existingField.status,
      },
    },
  };
}

async function handleStoreMemory(
  args: StoreMemoryParams,
  currentMemory: SessionMemory | null
): Promise<ToolExecutionResult> {
  console.log('🤖 AI storing memory:', args.memory_type);

  const memoryUpdate: Partial<SessionMemory> = {};

  const defaultEntities = {
    audiences: [],
    competitors: [],
    features: [],
    numbers: [],
    locations: [],
  };

  switch (args.memory_type) {
    case 'entity':
      memoryUpdate.mentioned_entities = {
        ...(currentMemory?.mentioned_entities || defaultEntities),
        ...(args.data as Partial<typeof defaultEntities>),
      };
      break;

    case 'contradiction':
      const contradictionText = typeof args.data === 'string' ? args.data : JSON.stringify(args.data);
      memoryUpdate.contradictions = [
        ...(currentMemory?.contradictions || []),
        contradictionText,
      ];
      break;

    case 'field_summary':
      memoryUpdate.field_summaries = {
        ...(currentMemory?.field_summaries || {}),
        ...(args.data as Record<string, string>),
      };
      break;
  }

  return {
    success: true,
    data: { message: 'Memory stored' },
    memoryUpdate,
  };
}

async function handleCompleteSession(
  args: CompleteSessionParams
): Promise<ToolExecutionResult> {
  console.log('🤖 AI completing session:', args.readiness_score);

  return {
    success: true,
    data: { message: 'Session completed' },
    completionData: args,
  };
}
