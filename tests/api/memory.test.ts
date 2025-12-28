/**
 * Memory API Tests
 * Tests memory saving, retrieval, and entity tracking
 */

import { createApiClient, ApiClient, SessionMemory } from '../helpers/api-client';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('Memory API', () => {
  let client: ApiClient;

  beforeAll(async () => {
    client = createApiClient();

    // Check if server is running
    const isRunning = await client.healthCheck();
    if (!isRunning) {
      console.warn('⚠️ Server not running at http://localhost:3001');
    }
  });

  beforeEach(async () => {
    client.reset();
    await client.createSession();
  });

  describe('POST /api/memory/save', () => {
    it('should save empty memory', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {},
        field_summaries: {},
        contradictions: [],
        user_preferences: {},
        key_metrics: {},
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });

    it('should save memory with entities', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {
          'target_audience': {
            value: '23-40 წლის მეწარმეები',
            context: 'სამიზნე აუდიტორია',
            field: 'target_users',
          },
          'market_size': {
            value: '10000 პოტენციური მომხმარებელი',
            context: 'ბაზრის ზომა',
            field: 'problem',
          },
        },
        field_summaries: {},
        contradictions: [],
        user_preferences: {},
        key_metrics: {},
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });

    it('should save memory with field summaries', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {},
        field_summaries: {
          'problem': 'მომხმარებლებს უჭირთ ბიზნეს იდეების შეფასება',
          'solution': 'AI-ზე დაფუძნებული პლატფორმა იდეების ვალიდაციისთვის',
        },
        contradictions: [],
        user_preferences: {},
        key_metrics: {},
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });

    it('should save memory with contradictions', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {},
        field_summaries: {},
        contradictions: [
          {
            field1: 'target_users',
            field2: 'revenue_model',
            description: 'მიზნობრივი აუდიტორია სტუდენტებია, მაგრამ ფასი მაღალია',
            severity: 'medium',
          },
        ],
        user_preferences: {},
        key_metrics: {},
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });

    it('should save memory with key metrics', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {},
        field_summaries: {},
        contradictions: [],
        user_preferences: {},
        key_metrics: {
          'target_revenue': '200000 ლარი/წელი',
          'target_users': '5000 მომხმარებელი',
          'conversion_rate': '5-10%',
        },
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });

    it('should save complete memory object', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {
          'business_name': {
            value: 'IdeaPassport',
            context: 'პროდუქტის სახელი',
            field: 'idea',
          },
          'target_age': {
            value: '23-40',
            context: 'ასაკობრივი დიაპაზონი',
            field: 'target_users',
          },
        },
        field_summaries: {
          'problem': 'ბიზნეს იდეების შეფასების სირთულე',
          'solution': 'AI ჩათბოტი სტრუქტურირებული კითხვებით',
          'target_users': 'დამწყები მეწარმეები და სტუდენტები',
        },
        contradictions: [],
        user_preferences: {
          'communication_style': 'formal',
          'detail_level': 'high',
        },
        key_metrics: {
          'mau_target': '1000',
          'revenue_target': '15000 ლარი/თვე',
        },
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });

    it('should fail without session_id', async () => {
      const response = await fetch(`${BASE_URL}/api/memory/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memory: {
            mentioned_entities: {},
            field_summaries: {},
            contradictions: [],
            user_preferences: {},
            key_metrics: {},
          },
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Memory Updates', () => {
    it('should update memory incrementally', async () => {
      // Save initial memory
      const initialMemory: SessionMemory = {
        mentioned_entities: {
          'entity1': { value: 'test1', context: 'ctx1', field: 'problem' },
        },
        field_summaries: {},
        contradictions: [],
        user_preferences: {},
        key_metrics: {},
      };
      await client.saveMemory(initialMemory);

      // Update with more entities
      const updatedMemory: SessionMemory = {
        mentioned_entities: {
          'entity1': { value: 'test1', context: 'ctx1', field: 'problem' },
          'entity2': { value: 'test2', context: 'ctx2', field: 'solution' },
        },
        field_summaries: {
          'problem': 'Updated summary',
        },
        contradictions: [],
        user_preferences: {},
        key_metrics: {},
      };
      const result = await client.saveMemory(updatedMemory);

      expect(result.success).toBe(true);
    });

    it('should handle memory with special characters', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {
          'special_entity': {
            value: 'ტესტი "quotes" & <special> chars',
            context: 'სპეციალური სიმბოლოები',
            field: 'problem',
          },
        },
        field_summaries: {
          'problem': 'Summary with "quotes" and <tags>',
        },
        contradictions: [],
        user_preferences: {},
        key_metrics: {},
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });

    it('should handle memory with Unicode content', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {
          'unicode_entity': {
            value: 'ქართული ტექსტი 🚀 emoji 日本語',
            context: 'მრავალენოვანი კონტენტი',
            field: 'idea',
          },
        },
        field_summaries: {
          'idea': '💡 იდეის აღწერა ქართულად',
        },
        contradictions: [],
        user_preferences: {},
        key_metrics: {},
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });
  });

  describe('Memory Edge Cases', () => {
    it('should handle large memory objects', async () => {
      const largeEntities: Record<string, unknown> = {};
      for (let i = 0; i < 50; i++) {
        largeEntities[`entity_${i}`] = {
          value: `Value for entity ${i} with some additional text to make it longer`,
          context: `Context ${i}`,
          field: 'problem',
        };
      }

      const memory: SessionMemory = {
        mentioned_entities: largeEntities,
        field_summaries: {
          'problem': 'A'.repeat(1000), // Long summary
        },
        contradictions: [],
        user_preferences: {},
        key_metrics: {},
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });

    it('should handle multiple contradictions', async () => {
      const memory: SessionMemory = {
        mentioned_entities: {},
        field_summaries: {},
        contradictions: [
          { field1: 'problem', field2: 'solution', description: 'Contradiction 1', severity: 'low' },
          { field1: 'target_users', field2: 'revenue', description: 'Contradiction 2', severity: 'medium' },
          { field1: 'mvp', field2: 'metrics', description: 'Contradiction 3', severity: 'high' },
        ],
        user_preferences: {},
        key_metrics: {},
      };

      const result = await client.saveMemory(memory);
      expect(result.success).toBe(true);
    });
  });
});
