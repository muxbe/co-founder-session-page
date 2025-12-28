import { NextRequest, NextResponse } from 'next/server';
import { generateWithTools } from '@/features/ai/gemini/client';
import type { Content } from '@google/generative-ai';

export const runtime = 'nodejs';

/**
 * POST /api/test-chat-simple
 * Simple test of the exact flow used in the chat
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Test Chat Simple] Starting...');

    const body = await request.json();
    const { idea } = body;

    console.log('[Test Chat Simple] Idea:', idea);

    // Build conversation history exactly like the real chat does
    const SYSTEM_PROMPT = `You are გიორგი (Giorgi), an AI business mentor for Cofounder.ge (Georgian startup platform).
You help entrepreneurs develop their business ideas through conversation.

ALWAYS:
- Respond in Georgian (ქართული)
- Be friendly and encouraging`;

    const history: Content[] = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'გამარჯობა! მზად ვარ დაგეხმარო შენი ბიზნეს იდეის განვითარებაში.' }],
      },
      {
        role: 'user',
        parts: [{
          text: `User's business idea: ${idea}\n\nAnalyze this idea and call the analyze_idea_and_plan_conversation tool.`,
        }],
      },
    ];

    console.log('[Test Chat Simple] Conversation history built, calling AI...');

    // Call AI with tools
    const response = await generateWithTools(history);

    console.log('[Test Chat Simple] AI Response received:', {
      hasText: !!response.text,
      hasFunctionCalls: !!response.functionCalls,
      functionCallsCount: response.functionCalls?.length || 0,
    });

    if (response.functionCalls) {
      console.log('[Test Chat Simple] Function calls:', response.functionCalls.map(fc => fc.name));
    }

    return NextResponse.json({
      success: true,
      response,
      message: 'Test successful!',
    });

  } catch (error) {
    console.error('[Test Chat Simple] Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
