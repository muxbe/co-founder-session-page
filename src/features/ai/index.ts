// Main AI Client
export {
  getModel,
  buildHistory,
  chat,
  sendFunctionResults,
  SYSTEM_PROMPT,
  INITIAL_GREETING,
} from './client';

// Tools
export { toolDefinitions } from './tools';
export type {
  StartTopicParams,
  AskFollowupParams,
  CompleteTopicParams,
  EndSessionParams,
} from './tools';

// Conversation Management
export {
  createInitialState,
  executeTools,
  executeTool,
} from './conversation';
export type { ConversationState, ExecutionResult } from './conversation';

// Legacy exports (for backwards compatibility during transition)
export * from './gemini';
