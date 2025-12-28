/**
 * Session API Tests
 * Tests session creation, experience saving, and session management
 */

import { createApiClient, ApiClient } from '../helpers/api-client';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('Session API', () => {
  let client: ApiClient;

  beforeAll(async () => {
    client = createApiClient();

    // Check if server is running
    const isRunning = await client.healthCheck();
    if (!isRunning) {
      console.warn('⚠️ Server not running at http://localhost:3001');
    }
  });

  beforeEach(() => {
    client.reset();
  });

  describe('POST /api/session', () => {
    it('should create a new session with generated ID', async () => {
      const result = await client.createSession();

      expect(result.success).toBe(true);
      expect(client.getSessionId()).toBeTruthy();
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(client.getSessionId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create a session with custom ID', async () => {
      // Must be UUID format for database compatibility
      // Use a randomized UUID to avoid duplicate key errors
      const customId = `a1b2c3d4-e5f6-7890-abcd-${Date.now().toString(16).padStart(12, '0')}`;
      const result = await client.createSession(customId);

      expect(result.success).toBe(true);
      expect(client.getSessionId()).toBe(customId);
    });

    it('should fail when session_id is missing', async () => {
      const response = await fetch(`${BASE_URL}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('session_id');
    });
  });

  describe('POST /api/session/experience', () => {
    beforeEach(async () => {
      await client.createSession();
    });

    it('should save beginner experience profile', async () => {
      const result = await client.saveExperience({
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'none',
        educationLevel: 'none',
      });

      expect(result.success).toBe(true);
    });

    it('should save intermediate experience profile', async () => {
      const result = await client.saveExperience({
        hasExperience: true,
        experienceYears: 2,
        domainKnowledge: 'intermediate',
        educationLevel: 'university',
      });

      expect(result.success).toBe(true);
    });

    it('should save expert experience profile', async () => {
      const result = await client.saveExperience({
        hasExperience: true,
        experienceYears: 10,
        domainKnowledge: 'expert',
        educationLevel: 'university',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without session_id', async () => {
      const response = await fetch(`${BASE_URL}/api/session/experience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience: {
            hasExperience: false,
            experienceYears: 0,
            domainKnowledge: 'none',
            educationLevel: 'none',
          },
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should fail without experience object', async () => {
      const response = await fetch(`${BASE_URL}/api/session/experience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: client.getSessionId(),
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/session/experience', () => {
    beforeEach(async () => {
      await client.createSession();
    });

    it('should retrieve saved experience', async () => {
      const experience = {
        hasExperience: true,
        experienceYears: 5,
        domainKnowledge: 'expert' as const,
        educationLevel: 'university' as const,
      };

      await client.saveExperience(experience);

      const response = await fetch(
        `${BASE_URL}/api/session/experience?session_id=${client.getSessionId()}`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.experience).toMatchObject(experience);
    });

    it('should fail without session_id query param', async () => {
      const response = await fetch(`${BASE_URL}/api/session/experience`);

      expect(response.status).toBe(400);
    });
  });

  describe('Session State Management', () => {
    it('should maintain state across multiple requests', async () => {
      await client.createSession();

      // Save experience
      const experience = {
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'basic' as const,
        educationLevel: 'self-taught' as const,
      };
      await client.saveExperience(experience);

      // Get experience back
      const response = await fetch(
        `${BASE_URL}/api/session/experience?session_id=${client.getSessionId()}`
      );
      const data = await response.json();

      expect(data.experience).toMatchObject(experience);
    });

    it('should handle session updates', async () => {
      await client.createSession();

      // Save initial experience
      await client.saveExperience({
        hasExperience: false,
        experienceYears: 0,
        domainKnowledge: 'none',
        educationLevel: 'none',
      });

      // Update experience
      const updatedExperience = {
        hasExperience: true,
        experienceYears: 3,
        domainKnowledge: 'intermediate' as const,
        educationLevel: 'bootcamp' as const,
      };
      await client.saveExperience(updatedExperience);

      // Verify update
      const response = await fetch(
        `${BASE_URL}/api/session/experience?session_id=${client.getSessionId()}`
      );
      const data = await response.json();

      expect(data.experience).toMatchObject(updatedExperience);
    });
  });
});
