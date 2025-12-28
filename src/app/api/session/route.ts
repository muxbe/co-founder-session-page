import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'session_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Create new session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        id: session_id,
        status: 'intro',
      })
      .select()
      .single();

    if (error) {
      console.error('[Create Session] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('[Create Session] Success:', session_id);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Create Session] Exception:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
