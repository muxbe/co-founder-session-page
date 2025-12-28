import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserExperience } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Save user experience to session
 * POST /api/session/experience
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, experience } = body as {
      session_id: string;
      experience: UserExperience;
    };

    if (!session_id || !experience) {
      return NextResponse.json(
        { error: 'Missing session_id or experience' },
        { status: 400 }
      );
    }

    console.log('[Save Experience] Session:', session_id);
    console.log('[Save Experience] Experience:', experience);

    const supabase = createClient();

    // Update session with user experience
    const { data, error } = await supabase
      .from('sessions')
      .update({
        user_experience: experience,
        status: 'in-progress', // Move from 'intro' to 'in-progress'
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id)
      .select()
      .single();

    if (error) {
      console.error('[Save Experience] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save experience', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Save Experience] Success:', data.id);

    return NextResponse.json({
      success: true,
      session: data,
    });
  } catch (error) {
    console.error('[Save Experience] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get user experience from session
 * GET /api/session/experience?session_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('sessions')
      .select('user_experience')
      .eq('id', session_id)
      .single();

    if (error) {
      console.error('[Get Experience] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to get experience', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      experience: data.user_experience,
    });
  } catch (error) {
    console.error('[Get Experience] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
