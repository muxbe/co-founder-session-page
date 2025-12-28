import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/list-available-models
 * List all available models using direct API call
 */
export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not found' },
        { status: 500 }
      );
    }

    console.log('[List Models] Fetching from v1 API...');

    // Try v1 API
    const v1Response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const v1Data = await v1Response.json();

    console.log('[List Models] V1 Response:', v1Response.status);

    // Try v1beta API
    console.log('[List Models] Fetching from v1beta API...');
    const v1betaResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const v1betaData = await v1betaResponse.json();

    console.log('[List Models] V1BETA Response:', v1betaResponse.status);

    // Extract model names that support generateContent
    const v1Models = v1Data.models?.filter((m: any) =>
      m.supportedGenerationMethods?.includes('generateContent')
    ).map((m: any) => ({
      name: m.name,
      displayName: m.displayName,
      description: m.description,
    })) || [];

    const v1betaModels = v1betaData.models?.filter((m: any) =>
      m.supportedGenerationMethods?.includes('generateContent')
    ).map((m: any) => ({
      name: m.name,
      displayName: m.displayName,
      description: m.description,
    })) || [];

    return NextResponse.json({
      success: true,
      v1: {
        status: v1Response.status,
        available: v1Response.ok,
        count: v1Models.length,
        models: v1Models,
      },
      v1beta: {
        status: v1betaResponse.status,
        available: v1betaResponse.ok,
        count: v1betaModels.length,
        models: v1betaModels,
      },
      recommendation: v1Models.length > 0
        ? `Use one of these models: ${v1Models.map((m: any) => m.name).join(', ')}`
        : v1betaModels.length > 0
        ? `Use one of these models: ${v1betaModels.map((m: any) => m.name).join(', ')}`
        : 'No models available',
    });

  } catch (error) {
    console.error('[List Models] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
