import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const runtime = 'nodejs';

/**
 * POST /api/memory/save
 * Save session memory to Supabase sessions.memory column
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, memory } = body;

    if (!session_id || !memory) {
      return NextResponse.json(
        { error: 'Session ID and memory are required' },
        { status: 400 }
      );
    }

    // Skip saving for local/offline sessions
    if (session_id.startsWith('local-')) {
      console.log('[Memory Save] Skipping save for local session:', session_id);
      return NextResponse.json({ success: true, data: null, skipped: true });
    }

    const supabase = createServerClient();

    // Save memory to sessions.memory JSONB column
    const { data, error } = await supabase
      .from('sessions')
      .update({
        memory: {
          mentioned_entities: memory.mentioned_entities,
          field_summaries: memory.field_summaries,
          contradictions: memory.contradictions,
          user_preferences: memory.user_preferences || {},
          key_metrics: memory.key_metrics || {},
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id)
      .select()
      .single();

    if (error) {
      console.error('[Memory Save] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save memory', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Memory Save] Success for session:', session_id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Memory Save] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/memory/save?session_id=xxx
 * Retrieve session memory from Supabase sessions.memory column
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Skip for local/offline sessions
    if (sessionId.startsWith('local-')) {
      return NextResponse.json({ memory: null, skipped: true });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('sessions')
      .select('memory')
      .eq('id', sessionId)
      .single();

    if (error) {
      // No session found is not an error - return empty
      if (error.code === 'PGRST116') {
        return NextResponse.json({ memory: null });
      }

      console.error('[Memory Retrieve] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve memory', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ memory: data?.memory || null });
  } catch (error) {
    console.error('[Memory Retrieve] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
