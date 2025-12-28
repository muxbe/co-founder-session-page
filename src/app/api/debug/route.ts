import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export const runtime = 'nodejs';

/**
 * GET /api/debug
 * Comprehensive debugging endpoint
 */
export async function GET() {
  const results: any = {
    step1_env_check: null,
    step2_api_init: null,
    step3_simple_call: null,
    step4_with_tools: null,
    errors: [],
  };

  try {
    // STEP 1: Check environment variables
    console.log('=== STEP 1: Environment Check ===');
    const apiKey = process.env.GEMINI_API_KEY;
    results.step1_env_check = {
      keyExists: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 15) + '...',
    };
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length);

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }

    // STEP 2: Initialize GoogleGenerativeAI
    console.log('\n=== STEP 2: Initialize API ===');
    const genAI = new GoogleGenerativeAI(apiKey);
    results.step2_api_init = { success: true };
    console.log('GoogleGenerativeAI initialized');

    // STEP 3: Simple text generation (no tools)
    console.log('\n=== STEP 3: Simple Text Generation ===');
    try {
      const simpleModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash'
      });
      console.log('Model created');

      const simpleResult = await simpleModel.generateContent('Say "hello" in Georgian');
      console.log('Generation complete');

      const simpleResponse = simpleResult.response;
      const simpleText = simpleResponse.text();

      results.step3_simple_call = {
        success: true,
        response: simpleText,
      };
      console.log('Simple response:', simpleText);
    } catch (error) {
      console.error('Simple call failed:', error);
      results.errors.push({
        step: 'simple_call',
        error: error instanceof Error ? error.message : String(error),
      });
      results.step3_simple_call = { success: false, error: String(error) };
    }

    // STEP 4: Test with function calling
    console.log('\n=== STEP 4: Function Calling ===');
    try {
      const toolsModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        tools: [{
          functionDeclarations: [{
            name: 'test_function',
            description: 'A test function',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                message: {
                  type: SchemaType.STRING,
                  description: 'A test message',
                },
              },
              required: ['message'],
            },
          }],
        }],
      });
      console.log('Model with tools created');

      const toolsResult = await toolsModel.generateContent(
        'Call the test_function with message "test"'
      );
      console.log('Tool call generation complete');

      const toolsResponse = toolsResult.response;
      const functionCalls = toolsResponse.functionCalls?.();

      results.step4_with_tools = {
        success: true,
        hasFunctionCall: functionCalls ? functionCalls.length > 0 : false,
        response: toolsResponse.text?.() || 'No text response',
      };
      console.log('Tool response:', results.step4_with_tools);
    } catch (error) {
      console.error('Tools call failed:', error);
      results.errors.push({
        step: 'tools_call',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      results.step4_with_tools = { success: false, error: String(error) };
    }

    console.log('\n=== ALL TESTS COMPLETE ===');
    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      summary: {
        envCheck: results.step1_env_check?.keyExists ? '✅' : '❌',
        apiInit: results.step2_api_init?.success ? '✅' : '❌',
        simpleCall: results.step3_simple_call?.success ? '✅' : '❌',
        toolsCall: results.step4_with_tools?.success ? '✅' : '❌',
      },
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return NextResponse.json({
      success: false,
      fatalError: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      results,
    }, { status: 500 });
  }
}
