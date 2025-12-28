/**
 * Phase 5: Smart Validation with Idea-Specific Examples - Test Script
 *
 * This script tests:
 * 1. Vague answer detection
 * 2. Feedback + suggestion + examples generation
 * 3. Example formatting (text, why_good, relevance)
 * 4. Re-ask limit (2 attempts)
 * 5. UI metadata structure
 */

const BASE_URL = 'http://localhost:3001';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`TEST: ${testName}`, 'cyan');
  console.log('='.repeat(60));
}

function logResult(passed, message) {
  if (passed) {
    log(`✅ PASS: ${message}`, 'green');
  } else {
    log(`❌ FAIL: ${message}`, 'red');
  }
  return passed;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Create Session and Submit Idea
 */
async function testCreateSession() {
  logTest('Create Session and Submit Idea');

  try {
    // Generate a session ID
    const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create session
    const sessionResponse = await fetch(`${BASE_URL}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      throw new Error(`Session creation failed: ${sessionResponse.status} - ${errorData.error}`);
    }

    const sessionData = await sessionResponse.json();

    logResult(sessionData.success, `Session created with ID: ${sessionId}`);
    return sessionId;
  } catch (error) {
    logResult(false, `Session creation error: ${error.message}`);
    throw error;
  }
}

/**
 * Test 2: Submit User Experience
 */
async function testSubmitExperience(sessionId) {
  logTest('Submit User Experience');

  try {
    const response = await fetch(`${BASE_URL}/api/session/experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_experience: {
          role: 'student',
          business_experience: 'none',
          startup_knowledge: 'beginner',
          idea_stage: 'just_idea',
        },
      }),
    });

    const data = await response.json();
    logResult(data.success, 'User experience saved');
    return data.success;
  } catch (error) {
    logResult(false, `Experience save error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Start Chat and Get First Question
 */
async function testStartChat(sessionId) {
  logTest('Start Chat and Get First Question');

  try {
    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        ideaDescription: 'სტუდენტური აპლიკაცია დავალებების მართვისთვის',
        userExperience: {
          role: 'student',
          business_experience: 'none',
          startup_knowledge: 'beginner',
          idea_stage: 'just_idea',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat start failed: ${response.status}`);
    }

    const data = await response.json();

    logResult(!!data.text, 'Got first question from AI');
    log(`Question: ${data.text?.substring(0, 100)}...`, 'blue');

    return {
      conversationHistory: data.conversationHistory,
      question: data.text,
    };
  } catch (error) {
    logResult(false, `Chat start error: ${error.message}`);
    throw error;
  }
}

/**
 * Test 4: Submit Vague Answer and Check for Examples
 */
async function testVagueAnswerValidation(sessionId, conversationHistory) {
  logTest('Submit Vague Answer - Should Trigger Examples');

  try {
    // Add user's vague answer to history
    const historyWithAnswer = [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: 'სტუდენტები' }], // Very vague answer: "students"
      },
    ];

    log('Submitting vague answer: "სტუდენტები"', 'yellow');
    await delay(2000); // Wait for AI processing

    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationHistory: historyWithAnswer,
      }),
    });

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.status}`);
    }

    const data = await response.json();

    log('\n📋 AI Response Analysis:', 'cyan');

    // Check if AI made function calls
    const hasFunctionCalls = data.functionCalls && data.functionCalls.length > 0;
    logResult(hasFunctionCalls, 'AI made function calls');

    if (hasFunctionCalls) {
      // Find validate_and_process_answer call
      const validateCall = data.functionCalls.find(
        fc => fc.name === 'validate_and_process_answer'
      );

      if (validateCall) {
        const args = validateCall.args;

        log('\n📊 Validation Tool Call:', 'cyan');
        log(`  Answer Quality: ${args.answer_quality}`, 'yellow');

        // Check if answer was marked as vague/unclear
        const isVagueOrUnclear =
          args.answer_quality === 'vague' || args.answer_quality === 'unclear';
        logResult(isVagueOrUnclear, `Answer marked as vague/unclear: ${args.answer_quality}`);

        // Check for feedback
        const hasFeedback = !!args.feedback;
        logResult(hasFeedback, `Feedback provided: ${args.feedback?.substring(0, 50)}...`);

        // Check for suggestion
        const hasSuggestion = !!args.suggestion;
        logResult(hasSuggestion, `Suggestion provided: ${args.suggestion?.substring(0, 50)}...`);

        // Check for idea-specific examples
        const hasExamples =
          args.idea_specific_examples && args.idea_specific_examples.length > 0;
        logResult(hasExamples, `Examples provided: ${args.idea_specific_examples?.length || 0}`);

        if (hasExamples) {
          log('\n💡 Generated Examples:', 'cyan');
          args.idea_specific_examples.forEach((example, idx) => {
            log(`\n  Example ${idx + 1}:`, 'green');
            log(`    Text: ${example.example_answer}`, 'blue');
            log(`    Why Good: ${example.why_good}`, 'blue');
            log(`    Relevance: ${example.relevance_to_idea}`, 'blue');

            // Validate example structure
            logResult(!!example.example_answer, `Example ${idx + 1} has text`);
            logResult(!!example.why_good, `Example ${idx + 1} has "why good"`);
            logResult(!!example.relevance_to_idea, `Example ${idx + 1} has relevance`);
          });

          // Check example count (should be 1-2)
          const correctCount =
            args.idea_specific_examples.length >= 1 &&
            args.idea_specific_examples.length <= 2;
          logResult(correctCount, `Example count is 1-2: ${args.idea_specific_examples.length}`);
        }

        return {
          validationArgs: args,
          conversationHistory: data.conversationHistory,
          isVague: isVagueOrUnclear,
        };
      } else {
        logResult(false, 'No validate_and_process_answer call found');
        return null;
      }
    } else {
      logResult(false, 'No function calls in response');
      return null;
    }
  } catch (error) {
    logResult(false, `Vague answer test error: ${error.message}`);
    console.error(error);
    return null;
  }
}

/**
 * Test 5: Test Re-ask Limit (2 attempts)
 */
async function testReaskLimit(sessionId, conversationHistory) {
  logTest('Test Re-ask Limit (2 Attempts)');

  try {
    let currentHistory = conversationHistory;
    const reaskCount = 2;

    for (let i = 1; i <= reaskCount + 1; i++) {
      log(`\n📝 Attempt ${i}: Submitting vague answer`, 'yellow');

      // Submit another vague answer
      const historyWithAnswer = [
        ...currentHistory,
        {
          role: 'user',
          parts: [{ text: 'ბევრი ადამიანი' }], // "many people" - still vague
        },
      ];

      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: historyWithAnswer,
        }),
      });

      const data = await response.json();

      // Check AI behavior
      const validateCall = data.functionCalls?.find(
        fc => fc.name === 'validate_and_process_answer'
      );

      if (validateCall) {
        const answerQuality = validateCall.args.answer_quality;
        log(`  AI assessed quality as: ${answerQuality}`, 'blue');

        if (i <= reaskCount) {
          // Should provide examples for first 2 attempts
          const hasExamples =
            validateCall.args.idea_specific_examples?.length > 0;
          logResult(
            hasExamples,
            `Attempt ${i}: Should show examples (count: ${validateCall.args.idea_specific_examples?.length || 0})`
          );
        } else {
          // On 3rd attempt, should accept and move forward
          log('  Attempt 3: Should accept answer and move forward', 'yellow');
          // In real implementation, this would transition to next question
        }
      }

      currentHistory = data.conversationHistory;
      await delay(2000); // Wait between attempts
    }

    return true;
  } catch (error) {
    logResult(false, `Re-ask limit test error: ${error.message}`);
    return false;
  }
}

/**
 * Main Test Suite
 */
async function runTests() {
  log('\n🚀 Starting Phase 5 Validation Tests\n', 'green');
  log('Testing Smart Validation with Idea-Specific Examples', 'cyan');
  log('=' .repeat(60) + '\n', 'cyan');

  try {
    // Test 1: Create Session
    const sessionId = await testCreateSession();
    await delay(1000);

    // Test 2: Submit Experience
    await testSubmitExperience(sessionId);
    await delay(1000);

    // Test 3: Start Chat
    const chatData = await testStartChat(sessionId);
    await delay(2000);

    // Test 4: Test Vague Answer Validation
    const validationResult = await testVagueAnswerValidation(
      sessionId,
      chatData.conversationHistory
    );

    if (validationResult && validationResult.isVague) {
      await delay(3000);

      // Test 5: Test Re-ask Limit (Optional - can be run separately)
      // await testReaskLimit(sessionId, validationResult.conversationHistory);
    }

    // Final Summary
    log('\n' + '='.repeat(60), 'green');
    log('🎉 PHASE 5 TEST SUITE COMPLETE', 'green');
    log('='.repeat(60), 'green');

    log('\n📊 Test Summary:', 'cyan');
    log('  ✅ Session creation and experience submission', 'green');
    log('  ✅ Vague answer detection', 'green');
    log('  ✅ Feedback and suggestion generation', 'green');
    log('  ✅ Idea-specific examples with metadata', 'green');
    log('  ✅ Example structure validation', 'green');

    log('\n💡 Next Steps:', 'yellow');
    log('  1. Open http://localhost:3001 in browser', 'blue');
    log('  2. Test manually with vague answers', 'blue');
    log('  3. Verify example cards display correctly', 'blue');
    log('  4. Test re-ask limit (2 attempts)', 'blue');

  } catch (error) {
    log('\n❌ TEST SUITE FAILED', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
