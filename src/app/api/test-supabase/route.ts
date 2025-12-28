import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase credentials not configured',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to query the sessions table
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: 'Failed to query sessions table',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      supabaseUrl,
      tablesAccessible: true,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
