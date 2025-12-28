import { NextRequest, NextResponse } from 'next/server';
import type { Content } from '@google/generative-ai';
import { generateWithTools, sendFunctionResults } from '@/features/ai/gemini/client';
import { executeToolCalls } from '@/features/ai/gemini/toolHandlers';

export const runtime = 'nodejs';

/**
 * POST /api/ai/chat
 * Handle AI conversation with tool calling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationHistory, sessionId, currentState } = body;

    console.log('[AI API] Received request:', {
      historyLength: conversationHistory?.length,
      sessionId,
      hasCurrentState: !!currentState,
    });

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      console.error('[AI API] Invalid conversation history');
      return NextResponse.json(
        { error: 'Invalid conversation history' },
        { status: 400 }
      );
    }

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('[AI API] Missing GEMINI_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    console.log('[AI API] Calling Gemini API...');

    // Call AI with tools
    const response = await generateWithTools(conversationHistory as Content[]);

    console.log('[AI API] Gemini response received:', {
      hasText: !!response.text,
      hasFunctionCalls: !!response.functionCalls,
      functionCallsCount: response.functionCalls?.length || 0,
    });

    // Process function calls if any
    let toolResults = null;
    let stateUpdates = null;

    if (response.functionCalls) {
      console.log('[AI API] Processing function calls...');
      const result = await executeToolCalls(
        response.functionCalls,
        {
          sessionId: sessionId || '',
          fields: currentState?.fields || [],
          sessionMemory: currentState?.sessionMemory || null,
        }
      );

      toolResults = result.results;
      stateUpdates = result.stateUpdates;
      console.log('[AI API] Function calls processed successfully');
    }

    return NextResponse.json({
      text: response.text,
      functionCalls: response.functionCalls,
      toolResults,
      stateUpdates,
    });
  } catch (error) {
    console.error('[AI API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
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
 * POST /api/ai/chat/continue
 * Send function results back and get next response
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationHistory, functionResults } = body;

    if (!conversationHistory || !functionResults) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Send function results and get next response
    const response = await sendFunctionResults(
      conversationHistory as Content[],
      functionResults
    );

    return NextResponse.json({
      text: response.text,
      functionCalls: response.functionCalls,
    });
  } catch (error) {
    console.error('AI continue error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
