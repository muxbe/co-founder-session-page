import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, field_key, question, content } = body;

    if (!session_id || !field_key || !question) {
      return NextResponse.json(
        { success: false, error: 'session_id, field_key, and question are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Create new passport field
    const { data: field, error } = await supabase
      .from('passport_fields')
      .insert({
        session_id,
        field_key,
        question,
        content: content || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('[Create Field] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('[Create Field] Success:', field.id);

    return NextResponse.json({
      success: true,
      field,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Create Field] Exception:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
