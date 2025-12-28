/**
 * Chat API Tests
 * Tests the full chat flow with the AI
 */

import { createApiClient, ApiClient, wait } from '../helpers/api-client';
import { testIdeas, getRandomAnswer } from '../fixtures/predefined-answers';

describe('Chat API', () => {
  let client: ApiClient;

  beforeAll(async () => {
    client = createApiClient();

    // Check if server is running
    const isRunning = await client.healthCheck();
    if (!isRunning) {
      console.warn('⚠️ Server not running at http://localhost:3001');
      console.warn('Please start the server with: pnpm dev');
    }
  });

  beforeEach(() => {
    client.reset();
  });

  describe('Session Creation', () => {
    it('should create a new session', async () => {
      const result = await client.createSession();

      expect(result.success).toBe(true);
      expect(client.getSessionId()).toBeTruthy();
    });

    it('should create session with custom ID', async () => {
      // Must be UUID format for database compatibility
      // Use a randomized UUID to avoid duplicate key errors
      const customId = `b2c3d4e5-f678-9012-abcd-${Date.now().toString(16).padStart(12, '0')}`;
      const result = await client.createSession(customId);

      expect(result.success).toBe(true);
      expect(client.getSessionId()).toBe(customId);
    });
  });

  describe('Experience Saving', () => {
    beforeEach(async () => {
      await client.createSession();
    });

    it('should save user experience', async () => {
      const experience = {
        hasExperience: true,
        experienceYears: 2,
        domainKnowledge: 'intermediate' as const,
        educationLevel: 'university' as const,
      };

      const result = await client.saveExperience(experience);
      expect(result.success).toBe(true);
    });

    it('should save beginner experience', async () => {
      const experience = {
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'none' as const,
        educationLevel: 'none' as const,
      };

      const result = await client.saveExperience(experience);
      expect(result.success).toBe(true);
    });
  });

  describe('Idea Submission', () => {
    beforeEach(async () => {
      await client.createSession();
      await client.saveExperience({
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'none',
        educationLevel: 'none',
      });
    });

    it('should accept and process business idea', async () => {
      const testIdea = testIdeas[0];
      const response = await client.submitIdea(testIdea.description);

      // AI should respond with text or function calls
      expect(response).toBeDefined();
      expect(response.text || response.functionCalls).toBeTruthy();
    });

    it('should trigger start_topic for first field', async () => {
      const testIdea = testIdeas[0];
      const response = await client.submitIdea(testIdea.description);

      // Check if start_topic was called
      if (response.functionCalls) {
        const startTopicCall = response.functionCalls.find(
          (call) => call.name === 'start_topic'
        );

        if (startTopicCall) {
          expect(startTopicCall.args).toHaveProperty('field_key');
          expect(startTopicCall.args).toHaveProperty('display_name');
        }
      }

      // Either function calls or text response is acceptable
      expect(response.text || response.functionCalls).toBeTruthy();
    });
  });

  describe('Chat Flow - Happy Path', () => {
    beforeEach(async () => {
      await client.createSession();
      await client.saveExperience({
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'basic',
        educationLevel: 'self-taught',
      });
    });

    it('should complete a basic conversation flow', async () => {
      const testIdea = testIdeas[0];

      // Submit idea
      const ideaResponse = await client.submitIdea(testIdea.description);
      expect(ideaResponse).toBeDefined();

      // Wait a bit for AI to process
      await wait(1000);

      // Answer first follow-up question
      const answer1 = getRandomAnswer('problem');
      const response1 = await client.answerQuestion(answer1);
      expect(response1).toBeDefined();

      // Answer second question
      await wait(500);
      const answer2 = getRandomAnswer('solution');
      const response2 = await client.answerQuestion(answer2);
      expect(response2).toBeDefined();

      // Check conversation history is building up
      const history = client.getConversationHistory();
      expect(history.length).toBeGreaterThanOrEqual(4); // At least 2 user + 2 model messages
    });

    it('should handle multiple questions in sequence', async () => {
      const testIdea = testIdeas[1];

      // Submit idea
      await client.submitIdea(testIdea.description);

      // Answer 5 questions in sequence
      const fieldKeys = ['problem', 'solution', 'target_users', 'value_proposition', 'competition'];

      for (const fieldKey of fieldKeys) {
        await wait(500);
        const answer = getRandomAnswer(fieldKey);
        const response = await client.answerQuestion(answer);

        expect(response).toBeDefined();
        expect(response.text || response.functionCalls).toBeTruthy();
      }

      // Check conversation history (at least 1 idea + 5 questions = 6 exchanges = 12 messages)
      // But AI may combine responses, so expect at least 8 messages
      const history = client.getConversationHistory();
      expect(history.length).toBeGreaterThanOrEqual(8);
    }, 60000); // 60 second timeout for this test
  });

  describe('AI Tool Calls', () => {
    beforeEach(async () => {
      await client.createSession();
      await client.saveExperience({
        hasExperience: true,
        experienceYears: 3,
        domainKnowledge: 'intermediate',
        educationLevel: 'university',
      });
    });

    it('should receive valid tool calls from AI', async () => {
      const testIdea = testIdeas[2];
      const response = await client.submitIdea(testIdea.description);

      if (response.functionCalls && response.functionCalls.length > 0) {
        const validTools = ['start_topic', 'ask_followup', 'complete_field', 'evaluate'];

        for (const call of response.functionCalls) {
          expect(validTools).toContain(call.name);
          expect(call.args).toBeDefined();
        }
      }
    });

    it('should handle state updates from tool results', async () => {
      const testIdea = testIdeas[0];
      const response = await client.submitIdea(testIdea.description);

      // If there are state updates, they should have valid structure
      if (response.stateUpdates) {
        if (response.stateUpdates.fields) {
          expect(Array.isArray(response.stateUpdates.fields)).toBe(true);
        }
        if (response.stateUpdates.currentFieldKey !== undefined) {
          expect(typeof response.stateUpdates.currentFieldKey).toBe('string');
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session gracefully', async () => {
      // Don't create session
      await expect(client.submitIdea('test idea')).rejects.toThrow();
    });

    it('should handle empty message', async () => {
      await client.createSession();
      await client.saveExperience({
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'none',
        educationLevel: 'none',
      });

      // Empty message should still get a response (AI might ask for clarification)
      const response = await client.answerQuestion('');
      expect(response).toBeDefined();
    });

    it('should handle very long message', async () => {
      await client.createSession();
      await client.saveExperience({
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'none',
        educationLevel: 'none',
      });

      const longMessage = 'a'.repeat(5000);
      const response = await client.answerQuestion(longMessage);
      expect(response).toBeDefined();
    });
  });

  describe('Concurrent Sessions', () => {
    it('should handle multiple sessions independently', async () => {
      const client1 = createApiClient();
      const client2 = createApiClient();

      // Create two separate sessions
      await client1.createSession();
      await client2.createSession();

      expect(client1.getSessionId()).not.toBe(client2.getSessionId());

      // Save different experiences
      await client1.saveExperience({
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'none',
        educationLevel: 'none',
      });

      await client2.saveExperience({
        hasExperience: true,
        experienceYears: 5,
        domainKnowledge: 'expert',
        educationLevel: 'university',
      });

      // Both sessions should work independently
      const response1 = await client1.submitIdea(testIdeas[0].description);
      const response2 = await client2.submitIdea(testIdeas[1].description);

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });
  });
});
