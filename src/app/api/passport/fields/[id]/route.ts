import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const fieldId = resolvedParams.id;
    const body = await request.json();
    const { content, status } = body;

    if (!content && !status) {
      return NextResponse.json(
        { success: false, error: 'content or status is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update passport field
    const updateData: Record<string, unknown> = {};

    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;

    const { data: field, error } = await supabase
      .from('passport_fields')
      .update(updateData)
      .eq('id', fieldId)
      .select()
      .single();

    if (error) {
      console.error('[Update Field] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('[Update Field] Success:', fieldId);

    return NextResponse.json({
      success: true,
      field,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Update Field] Exception:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
