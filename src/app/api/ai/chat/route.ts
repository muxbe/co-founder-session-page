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

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'Invalid conversation history' },
        { status: 400 }
      );
    }

    // Call AI with tools
    const response = await generateWithTools(conversationHistory as Content[]);

    // Process function calls if any
    let toolResults = null;
    let stateUpdates = null;

    if (response.functionCalls) {
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
    }

    return NextResponse.json({
      text: response.text,
      functionCalls: response.functionCalls,
      toolResults,
      stateUpdates,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
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
