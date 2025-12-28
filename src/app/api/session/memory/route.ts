import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { session_id, memory } = await request.json();

    if (!session_id || !memory) {
      return NextResponse.json(
        { success: false, error: 'session_id and memory are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update session with memory
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        memory,
      })
      .eq('id', session_id)
      .select()
      .single();

    if (error) {
      console.error('[Save Memory] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('[Save Memory] Success:', session_id);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Save Memory] Exception:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
