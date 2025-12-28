import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('[Get Idea] Session error:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch fields for this session from passport_fields table
    const { data: fields, error: fieldsError } = await supabase
      .from('passport_fields')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });

    if (fieldsError) {
      console.error('[Get Idea] Fields error:', fieldsError);
      // Return session even if fields fail
      return NextResponse.json({
        success: true,
        session,
        fields: [],
      });
    }

    console.log(`[Get Idea] Success: session ${sessionId}, ${fields?.length || 0} fields`);

    return NextResponse.json({
      success: true,
      session,
      fields: fields || [],
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Get Idea] Exception:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
