import { supabase } from '@/lib/supabase';
import type { Session, Message, Field, UserExperience, SessionMemory } from '@/types';

/**
 * Create a new session
 */
export async function createSession(): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      status: 'intro',
      progress: 0,
      current_field_index: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }

  return data;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return data;
}

/**
 * Update session with idea description
 */
export async function updateSessionIdea(
  sessionId: string,
  ideaDescription: string
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({
      idea_description: ideaDescription,
      status: 'collecting-experience',
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session idea:', error);
    throw new Error('Failed to update session');
  }
}

/**
 * Update session with user experience
 */
export async function updateSessionExperience(
  sessionId: string,
  experience: UserExperience
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({
      user_experience: experience,
      status: 'in-progress',
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session experience:', error);
    throw new Error('Failed to update session');
  }
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: Session['status'],
  additionalData?: Partial<Session>
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({
      status,
      ...additionalData,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session status:', error);
    throw new Error('Failed to update session status');
  }
}

/**
 * Update session progress
 */
export async function updateSessionProgress(
  sessionId: string,
  progress: number
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ progress })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session progress:', error);
  }
}

/**
 * Save a message to the database
 */
export async function saveMessage(
  sessionId: string,
  type: Message['type'],
  content: string,
  metadata?: Message['metadata']
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      type,
      content,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }

  return data;
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Create fields for a session
 */
export async function createFields(
  sessionId: string,
  fields: Array<{ field_key: string; name: string; icon: string }>
): Promise<Field[]> {
  const fieldsToInsert = fields.map((field, index) => ({
    session_id: sessionId,
    field_key: field.field_key,
    name: field.name,
    icon: field.icon,
    order_index: index,
    status: 'pending',
    questions: [],
    answers: [],
  }));

  const { data, error } = await supabase
    .from('fields')
    .insert(fieldsToInsert)
    .select();

  if (error) {
    console.error('Error creating fields:', error);
    throw new Error('Failed to create fields');
  }

  return data;
}

/**
 * Get fields for a session
 */
export async function getSessionFields(sessionId: string): Promise<Field[]> {
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching fields:', error);
    return [];
  }

  return data || [];
}

/**
 * Update a field
 */
export async function updateField(
  fieldId: string,
  updates: Partial<Field>
): Promise<void> {
  const { error } = await supabase
    .from('fields')
    .update(updates)
    .eq('id', fieldId);

  if (error) {
    console.error('Error updating field:', error);
    throw new Error('Failed to update field');
  }
}

/**
 * Create or update session memory
 */
export async function upsertSessionMemory(
  sessionId: string,
  memory: Partial<SessionMemory>
): Promise<void> {
  const { error } = await supabase
    .from('session_memory')
    .upsert({
      session_id: sessionId,
      ...memory,
    });

  if (error) {
    console.error('Error upserting session memory:', error);
    throw new Error('Failed to update session memory');
  }
}

/**
 * Get session memory
 */
export async function getSessionMemory(sessionId: string): Promise<SessionMemory | null> {
  const { data, error } = await supabase
    .from('session_memory')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    // Not found is OK - memory might not exist yet
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching session memory:', error);
    return null;
  }

  return data;
}
