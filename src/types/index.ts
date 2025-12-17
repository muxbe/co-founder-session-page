// User Experience Types
export interface UserExperience {
  role: 'student' | 'employed' | 'founder' | 'other';
  business_experience: 'none' | '1-2_years' | '3-5_years' | '5+_years';
  startup_knowledge: 'beginner' | 'intermediate' | 'expert';
  idea_stage: 'just_idea' | 'validating' | 'building' | 'launched';
}

// Session Types
export interface Session {
  id: string;
  user_id: string | null;
  idea_title: string | null;
  idea_description: string | null;
  user_experience: UserExperience | null;
  status: 'intro' | 'collecting-experience' | 'in-progress' | 'completed';
  current_field_index: number;
  progress: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Field Types
export interface Field {
  id: string;
  session_id: string;
  field_key: string;
  name: string;
  icon: string;
  status: 'pending' | 'active' | 'complete';
  questions: string[];
  answers: string[];
  content: string | null;
  order_index: number;
  question_count: number;
  depth_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Message Types
export interface Message {
  id: string;
  session_id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  metadata?: MessageMetadata;
  created_at: string;
}

export interface MessageMetadata {
  is_suggestion?: boolean;
  references_field?: string;
  is_example?: boolean;
  is_clarification?: boolean;
  examples?: string[];
}

// Session Memory Types
export interface SessionMemory {
  id: string;
  session_id: string;
  mentioned_entities: MentionedEntities;
  field_summaries: Record<string, string>;
  contradictions: string[];
  created_at: string;
  updated_at: string;
}

export interface MentionedEntities {
  audiences: string[];
  competitors: string[];
  features: string[];
  numbers: string[];
  locations: string[];
}

// Chat State Types
export type ChatStatus =
  | 'intro'                    // Welcome, waiting for idea
  | 'collecting-experience'    // After idea, collecting user background
  | 'analyzing'                // AI analyzing idea + experience
  | 'in-progress'              // Session in progress (general state)
  | 'deciding-depth'           // AI deciding question count
  | 'questioning'              // Showing question
  | 'waiting'                  // Waiting for user input
  | 'validating'               // Validating answer
  | 'checking-memory'          // Checking for contradictions
  | 'asking-followup'          // Asking follow-up question
  | 're-asking'                // Re-asking due to invalid answer
  | 'field-complete'           // Field Q&A done, synthesizing
  | 'transitioning'            // Moving to next field
  | 'session-complete';        // All fields done

export interface ChatState {
  status: ChatStatus;
  userExperience: UserExperience | null;
  currentFieldIndex: number;
  currentQuestionIndex: number;
  reaskCount: number;
  fields: Field[];
  messages: Message[];
  currentFieldQuestionCount: number;
  sessionMemory: SessionMemory | null;
  isLoading: boolean;
  loadingMessage: string;
}

// API Response Types
export interface ValidationResult {
  valid: boolean;
  feedback: string;
  suggestion?: string;
  exampleForThisIdea?: string;
}

export interface SynthesisResult {
  content: string;
  corrections_made: string[];
}

export interface QuestionDepthResult {
  count: number;
  reason: string;
}

export interface ExtractedEntities {
  audiences: string[];
  competitors: string[];
  features: string[];
  numbers: string[];
  locations: string[];
}

export interface ContradictionResult {
  has_contradiction: boolean;
  contradiction_details?: string;
  clarification_question?: string;
}

// Field Definition (from AI analysis)
export interface FieldDefinition {
  field_key: string;
  name: string;
  icon: string;
}

export interface AnalyzeIdeaResult {
  idea_title: string;
  fields: FieldDefinition[];
  personalization_notes: string;
}

export interface GenerateQuestionsResult {
  questions: string[];
  depth_reason: string;
}
