import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/diagnose
 * Comprehensive diagnostics - test direct API calls
 */
export async function GET() {
  const results: any = {
    step1_env: null,
    step2_sdk_version: null,
    step3_direct_v1: null,
    step4_direct_v1beta: null,
    errors: [],
  };

  try {
    // STEP 1: Check environment
    const apiKey = process.env.GEMINI_API_KEY;
    results.step1_env = {
      keyExists: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 15) + '...',
      nodeVersion: process.version,
    };

    if (!apiKey) {
      throw new Error('API key not found');
    }

    // STEP 2: Check SDK version
    try {
      const packageJson = require('../../../../package.json');
      results.step2_sdk_version = {
        geminiVersion: packageJson.dependencies['@google/generative-ai'],
        nextVersion: packageJson.dependencies['next'],
      };
    } catch (e) {
      results.step2_sdk_version = { error: 'Could not read package.json' };
    }

    // STEP 3: Direct fetch to v1 API
    console.log('\n=== Testing V1 API (direct fetch) ===');
    try {
      const v1Response = await fetch(
        'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say hello in Georgian' }]
            }]
          }),
        }
      );

      const v1Data = await v1Response.json();

      results.step3_direct_v1 = {
        status: v1Response.status,
        ok: v1Response.ok,
        response: v1Data,
      };

      console.log('V1 Response:', v1Response.status, v1Data);
    } catch (error) {
      console.error('V1 API failed:', error);
      results.step3_direct_v1 = {
        error: error instanceof Error ? error.message : String(error),
      };
      results.errors.push({ step: 'v1_api', error: String(error) });
    }

    // STEP 4: Direct fetch to v1beta API
    console.log('\n=== Testing V1BETA API (direct fetch) ===');
    try {
      const v1betaResponse = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say hello in Georgian' }]
            }]
          }),
        }
      );

      const v1betaData = await v1betaResponse.json();

      results.step4_direct_v1beta = {
        status: v1betaResponse.status,
        ok: v1betaResponse.ok,
        response: v1betaData,
      };

      console.log('V1BETA Response:', v1betaResponse.status, v1betaData);
    } catch (error) {
      console.error('V1BETA API failed:', error);
      results.step4_direct_v1beta = {
        error: error instanceof Error ? error.message : String(error),
      };
      results.errors.push({ step: 'v1beta_api', error: String(error) });
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      diagnosis: analyzeDiagnosis(results),
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return NextResponse.json({
      success: false,
      fatalError: error instanceof Error ? error.message : String(error),
      results,
    }, { status: 500 });
  }
}

function analyzeDiagnosis(results: any): string {
  const v1Status = results.step3_direct_v1?.status;
  const v1betaStatus = results.step4_direct_v1beta?.status;

  if (v1Status === 200) {
    return '✅ V1 API works! Use v1 endpoint instead of v1beta';
  }

  if (v1betaStatus === 200) {
    return '✅ V1BETA API works! SDK should work';
  }

  if (v1Status === 403 || v1betaStatus === 403) {
    return '❌ API key lacks permission. Enable Gemini API in Google AI Studio';
  }

  if (v1Status === 400 || v1betaStatus === 400) {
    return '⚠️ API key works but request format wrong';
  }

  if (v1Status === 404 && v1betaStatus === 404) {
    return '❌ Model not found on both APIs. API key might be for wrong service (Google Cloud vs AI Studio)';
  }

  return '❓ Unknown issue - check detailed results';
}
