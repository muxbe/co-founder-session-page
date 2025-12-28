// Test the full chat flow to verify it works
const baseUrl = 'http://localhost:3001';

async function testFullFlow() {
  console.log('🧪 Testing Full Chat Flow\n');

  // Step 1: Test initial API call (like submitIdea does)
  console.log('Step 1: Sending initial idea to API...');
  const SYSTEM_PROMPT = `You are გიორგი (Giorgi), an AI business mentor for Cofounder.ge (Georgian startup platform).
You help entrepreneurs develop their business ideas through conversation.
Your name is გიორგი and you should introduce yourself as such.

YOUR AGENTIC CAPABILITIES:
1. PERSONALIZATION: Adapt your language and depth to user's experience level (which you'll learn through conversation)
2. MEMORY: Remember and reference what user said in previous answers
3. ADAPTATION: Adjust question count and depth based on answer quality
4. SMART VALIDATION: Give specific examples, not generic feedback

CONVERSATION STRATEGY:
- FIRST: Always start by asking about the user's experience (role, business background, startup knowledge, idea stage)
- Ask 2-3 quick questions to understand their experience level
- THEN: Based on their experience, explore the business idea with appropriate depth
- Adapt your language complexity based on their experience level

CRITICAL RULES FOR RESPONSES:
- When you receive function results, do NOT generate any text response
- Only use tool calls (functions) to communicate your next action
- NEVER write internal reasoning or English commentary like "OK. Now I will..."
- All user-facing text must be in Georgian (ქართული) and delivered through the generate_next_question tool

IMPORTANT MESSAGE FORMATTING:
- Each question should be a SINGLE message
- Do NOT split your response into multiple messages
- Combine all your thoughts into one cohesive message
- Use line breaks within the message if needed for readability

ALWAYS:
- Respond in Georgian (ქართული) ONLY
- Be friendly and encouraging
- Reference previous answers when relevant
- Give concrete examples from THIS user's idea
- Sign off as გიორგი when appropriate`;

  const idea = 'მინდა შევქმნა mobile აპლიკაცია რომელიც დაეხმარება სტუდენტებს სწავლის დაგეგმვაში';

  const history = [
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
        text: `User's business idea: ${idea}\n\nIMPORTANT: You don't know the user's experience level yet. You should ask about their experience (role, business background, startup knowledge, idea stage) as part of your conversation. Include these as topics in your conversation strategy.\n\nAnalyze this idea and create a personalized conversation strategy. Start by asking about their experience first, then proceed to explore the business idea. Call the analyze_idea_and_plan_conversation tool.`,
      }],
    },
  ];

  try {
    const response1 = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationHistory: history,
        sessionId: 'test-session-123',
        currentState: {
          fields: [],
          sessionMemory: null,
        },
      }),
    });

    if (!response1.ok) {
      const errorData = await response1.json();
      console.error('❌ Step 1 FAILED:', errorData);
      return;
    }

    const data1 = await response1.json();
    console.log('✅ Step 1 SUCCESS');
    console.log('  - Has function calls:', !!data1.functionCalls);
    console.log('  - Function calls:', data1.functionCalls?.map(fc => fc.name).join(', '));
    console.log('  - Has tool results:', !!data1.toolResults);
    console.log('  - Has state updates:', !!data1.stateUpdates);

    if (!data1.functionCalls || data1.functionCalls.length === 0) {
      console.log('⚠️  No function calls returned, cannot proceed');
      return;
    }

    // Step 2: Send function results via PUT (like the code does after getting function calls)
    console.log('\nStep 2: Sending function results via PUT...');

    const historyWithFunctionCall = [
      ...history,
      {
        role: 'model',
        parts: data1.functionCalls.map(fc => ({ functionCall: fc })),
      },
    ];

    const response2 = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationHistory: historyWithFunctionCall,
        functionResults: data1.toolResults,
      }),
    });

    if (!response2.ok) {
      const errorData = await response2.json();
      console.error('❌ Step 2 FAILED:', errorData);
      return;
    }

    const data2 = await response2.json();
    console.log('✅ Step 2 SUCCESS');
    console.log('  - Response text:', data2.text ? 'Yes (' + data2.text.substring(0, 50) + '...)' : 'No');

    // Step 3: Ask AI to generate first question
    console.log('\nStep 3: Requesting first question...');

    const historyAfterFunctionResults = [
      ...historyWithFunctionCall,
      {
        role: 'model',
        parts: data2.text ? [{ text: data2.text }] : [],
      },
      {
        role: 'user',
        parts: [{ text: 'Now generate the first question to ask the user. Call the generate_next_question tool.' }],
      },
    ];

    const response3 = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationHistory: historyAfterFunctionResults,
        sessionId: 'test-session-123',
        currentState: {
          fields: data1.stateUpdates?.newFields || [],
          sessionMemory: null,
        },
      }),
    });

    if (!response3.ok) {
      const errorData = await response3.json();
      console.error('❌ Step 3 FAILED:', errorData);
      console.error('Full error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const data3 = await response3.json();
    console.log('✅ Step 3 SUCCESS');
    console.log('  - Has function calls:', !!data3.functionCalls);
    if (data3.functionCalls) {
      console.log('  - Function:', data3.functionCalls[0].name);
      console.log('  - Question:', data3.functionCalls[0].args.question_text?.substring(0, 100) + '...');
    }

    console.log('\n🎉 FULL FLOW TEST PASSED!\n');

  } catch (error) {
    console.error('❌ TEST FAILED with exception:', error.message);
  }
}

testFullFlow();
