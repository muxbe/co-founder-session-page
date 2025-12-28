import type { FunctionCall } from '@google/generative-ai';
import type { Field } from '@/types';
import {
  StartTopicParams,
  AskFollowupParams,
  CompleteTopicParams,
  EndSessionParams,
  handleStartTopic,
  handleAskFollowup,
  handleCompleteTopic,
  handleEndSession,
} from '../tools';
import {
  ConversationState,
  startNewTopic,
  incrementQuestionCount,
  completeTopic,
  endSession,
} from './state';

/**
 * Result of executing a tool call
 */
export interface ExecutionResult {
  // The question/message to show in chat
  question?: string;

  // State changes
  newField?: Field;
  completedFieldKey?: string;
  completedFieldContent?: string;

  // Session end data
  sessionEnd?: {
    message: string;
    score: number;
    assessment: string;
    fieldsCompleted: string[];
  };

  // Updated conversation state
  newState: ConversationState;
}

/**
 * Execute a single tool call and return the result
 */
export function executeTool(
  functionCall: FunctionCall,
  state: ConversationState
): ExecutionResult {
  const { name, args } = functionCall;

  console.log(`[executor] Executing tool: ${name}`);

  switch (name) {
    case 'start_topic': {
      const params = args as StartTopicParams;
      const result = handleStartTopic(params, state.sessionId);

      return {
        question: result.question,
        newField: result.field,
        newState: startNewTopic(state, result.field),
      };
    }

    case 'ask_followup': {
      const params = args as AskFollowupParams;
      const result = handleAskFollowup(params);

      return {
        question: result.question,
        newState: incrementQuestionCount(state),
      };
    }

    case 'complete_topic': {
      const params = args as CompleteTopicParams;

      if (!state.currentFieldKey) {
        console.error('[executor] No current field to complete!');
        return { newState: state };
      }

      const result = handleCompleteTopic(
        params,
        state.currentFieldKey,
        state.sessionId
      );

      // First, complete the current topic
      let newState = completeTopic(state, result.fieldKey, result.content);

      const execResult: ExecutionResult = {
        completedFieldKey: result.fieldKey,
        completedFieldContent: result.content,
        newState,
      };

      // If next_topic is provided, start it
      if (result.nextTopic) {
        execResult.newField = result.nextTopic.field;
        execResult.question = result.nextTopic.question;
        execResult.newState = startNewTopic(newState, result.nextTopic.field);
      }

      return execResult;
    }

    case 'end_session': {
      const params = args as EndSessionParams;
      const result = handleEndSession(params, state.completedFields);

      return {
        sessionEnd: {
          message: result.message,
          score: result.score,
          assessment: result.assessment,
          fieldsCompleted: result.fieldsCompleted,
        },
        newState: endSession(state),
      };
    }

    default:
      console.error(`[executor] Unknown tool: ${name}`);
      return { newState: state };
  }
}

/**
 * Execute multiple tool calls in sequence
 */
export function executeTools(
  functionCalls: FunctionCall[],
  initialState: ConversationState
): ExecutionResult {
  let currentState = initialState;
  let combinedResult: ExecutionResult = { newState: currentState };

  for (const call of functionCalls) {
    const result = executeTool(call, currentState);

    // Merge results
    if (result.question) combinedResult.question = result.question;
    if (result.newField) combinedResult.newField = result.newField;
    if (result.completedFieldKey) {
      combinedResult.completedFieldKey = result.completedFieldKey;
      combinedResult.completedFieldContent = result.completedFieldContent;
    }
    if (result.sessionEnd) combinedResult.sessionEnd = result.sessionEnd;

    currentState = result.newState;
    combinedResult.newState = currentState;
  }

  return combinedResult;
}
