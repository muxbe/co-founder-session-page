import { NextResponse } from 'next/server';
import { generateContent } from '@/features/ai/gemini/client';

export const runtime = 'nodejs';

/**
 * GET /api/test-gemini
 * Test endpoint to verify Gemini API is working
 */
export async function GET() {
  try {
    console.log('[Test Gemini] Testing API key...');

    // Check if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[Test Gemini] API Key exists:', !!apiKey);
    console.log('[Test Gemini] API Key length:', apiKey?.length || 0);
    console.log('[Test Gemini] API Key prefix:', apiKey?.substring(0, 10) + '...');

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY not found in environment variables',
          envKeys: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API'))
        },
        { status: 500 }
      );
    }

    // Test simple generation
    console.log('[Test Gemini] Attempting simple generation with gemini-1.5-flash...');
    const result = await generateContent('Say "Hello, I am working!" in Georgian');

    console.log('[Test Gemini] Success! Response:', result);

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working correctly',
      apiKeyConfigured: true,
      response: result,
    });
  } catch (error) {
    console.error('[Test Gemini] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
