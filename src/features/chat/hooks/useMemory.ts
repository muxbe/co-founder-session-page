/**
 * Memory Hook - Track entities, contradictions, and field summaries across conversation
 * This is a KEY AGENTIC FEATURE for v3
 */

import { useState, useCallback } from 'react';
import type {
  SessionMemory,
  MentionedEntities,
  Contradiction,
  MemoryExtractedEntities,
  ContradictionCheckResult,
} from '@/types';
import { initialMemory } from '@/types';

interface UseMemoryReturn {
  memory: SessionMemory | null;

  // Core operations
  updateMemoryWithAnswer: (answer: string, fieldKey: string, ideaDescription: string) => Promise<void>;
  checkForContradictions: (answer: string, fieldKey: string) => Promise<ContradictionCheckResult>;
  getMemorySummary: () => string;
  addContradiction: (details: Contradiction) => void;
  updateFieldSummary: (fieldKey: string, summary: string) => void;

  // Helpers
  hasMemoryFor: (fieldKey: string) => boolean;
  getEntitiesForField: (category: keyof MentionedEntities) => string[];
  clearMemory: () => void;
}

export function useMemory(sessionId: string): UseMemoryReturn {
  const [memory, setMemory] = useState<SessionMemory | null>({
    ...initialMemory,
    session_id: sessionId,
    id: `memory-${sessionId}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  /**
   * Extract entities from answer and update memory
   */
  const updateMemoryWithAnswer = useCallback(async (
    answer: string,
    fieldKey: string,
    ideaDescription: string
  ) => {
    try {
      // Call entity extraction API
      const response = await fetch('/api/ai/extract-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer,
          field_key: fieldKey,
          idea_context: ideaDescription,
        }),
      });

      if (!response.ok) {
        console.error('[useMemory] Entity extraction failed:', response.statusText);
        return;
      }

      const entities: MemoryExtractedEntities = await response.json();

      // Merge new entities with existing and save to database
      // Using a Promise to capture the updated memory from setMemory callback
      let updatedMemory: SessionMemory | null = null;

      setMemory((prev) => {
        if (!prev) return prev;

        const updatedEntities = mergeEntities(prev.mentioned_entities, entities);

        updatedMemory = {
          ...prev,
          mentioned_entities: updatedEntities,
          updated_at: new Date().toISOString(),
        };

        return updatedMemory;
      });

      // Save to database with the updated memory (use small delay to ensure state is updated)
      // We use setTimeout to ensure the state update has been processed
      setTimeout(async () => {
        if (updatedMemory) {
          try {
            await saveMemoryToDatabase(sessionId, updatedMemory);
            console.log('[useMemory] Memory saved successfully');
          } catch (saveError) {
            console.error('[useMemory] Failed to save memory to database:', saveError);
          }
        }
      }, 0);
    } catch (error) {
      console.error('[useMemory] Error updating memory:', error);
    }
  }, [sessionId]);

  /**
   * Check for contradictions between current answer and memory
   */
  const checkForContradictions = useCallback(async (
    answer: string,
    fieldKey: string
  ): Promise<ContradictionCheckResult> => {
    try {
      const memorySummary = getMemorySummary();

      const response = await fetch('/api/ai/check-contradictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_answer: answer,
          current_field: fieldKey,
          memory_summary: memorySummary,
        }),
      });

      if (!response.ok) {
        console.error('[useMemory] Contradiction check failed:', response.statusText);
        return { has_contradiction: false };
      }

      const result: ContradictionCheckResult = await response.json();

      // If contradiction found, add to memory
      if (result.has_contradiction && result.contradiction_details) {
        const contradiction: Contradiction = {
          id: `contradiction-${Date.now()}`,
          field1: result.contradiction_details.field1,
          field2: fieldKey,
          statement1: result.contradiction_details.statement1,
          statement2: result.contradiction_details.statement2,
          resolved: false,
          created_at: new Date().toISOString(),
        };

        addContradiction(contradiction);
      }

      return result;
    } catch (error) {
      console.error('[useMemory] Error checking contradictions:', error);
      return { has_contradiction: false };
    }
  }, []);

  /**
   * Get formatted memory summary for AI prompts
   */
  const getMemorySummary = useCallback((): string => {
    if (!memory) return '';

    const parts: string[] = [];

    const { audiences, competitors, features, numbers, locations } = memory.mentioned_entities;

    if (audiences.length > 0) {
      parts.push(`აუდიტორია: ${audiences.join(', ')}`);
    }
    if (competitors.length > 0) {
      parts.push(`კონკურენტები: ${competitors.join(', ')}`);
    }
    if (features.length > 0) {
      parts.push(`ფუნქციები: ${features.join(', ')}`);
    }
    if (numbers.length > 0) {
      parts.push(`რიცხვები: ${numbers.join(', ')}`);
    }
    if (locations.length > 0) {
      parts.push(`ლოკაციები: ${locations.join(', ')}`);
    }

    // Add field summaries
    for (const [field, summary] of Object.entries(memory.field_summaries)) {
      parts.push(`${field}: ${summary}`);
    }

    // Add contradiction warnings if any
    const unresolvedContradictions = memory.contradictions.filter(c => !c.resolved);
    if (unresolvedContradictions.length > 0) {
      parts.push(`⚠️ გაურკვეველი წინააღმდეგობები: ${unresolvedContradictions.length}`);
    }

    return parts.join('\n');
  }, [memory]);

  /**
   * Add contradiction to memory
   */
  const addContradiction = useCallback((details: Contradiction) => {
    setMemory((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        contradictions: [...prev.contradictions, details],
        updated_at: new Date().toISOString(),
      };
    });
  }, []);

  /**
   * Update field summary in memory
   */
  const updateFieldSummary = useCallback((fieldKey: string, summary: string) => {
    setMemory((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        field_summaries: {
          ...prev.field_summaries,
          [fieldKey]: summary.substring(0, 200), // Max 200 chars
        },
        updated_at: new Date().toISOString(),
      };
    });
  }, []);

  /**
   * Check if we have memory for a field
   */
  const hasMemoryFor = useCallback((fieldKey: string): boolean => {
    return memory?.field_summaries[fieldKey] !== undefined;
  }, [memory]);

  /**
   * Get entities of a specific category
   */
  const getEntitiesForField = useCallback((category: keyof MentionedEntities): string[] => {
    return memory?.mentioned_entities[category] || [];
  }, [memory]);

  /**
   * Clear all memory (for testing/reset)
   */
  const clearMemory = useCallback(() => {
    setMemory({
      ...initialMemory,
      session_id: sessionId,
      id: `memory-${sessionId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }, [sessionId]);

  return {
    memory,
    updateMemoryWithAnswer,
    checkForContradictions,
    getMemorySummary,
    addContradiction,
    updateFieldSummary,
    hasMemoryFor,
    getEntitiesForField,
    clearMemory,
  };
}

/**
 * Merge new entities with existing ones (deduplication + limit)
 */
function mergeEntities(
  existing: MentionedEntities,
  newEntities: MemoryExtractedEntities
): MentionedEntities {
  return {
    audiences: [...new Set([...existing.audiences, ...newEntities.audiences])].slice(0, 10),
    competitors: [...new Set([...existing.competitors, ...newEntities.competitors])].slice(0, 10),
    features: [...new Set([...existing.features, ...newEntities.features])].slice(0, 10),
    numbers: [...new Set([...existing.numbers, ...newEntities.numbers])].slice(0, 10),
    locations: [...new Set([...existing.locations, ...newEntities.locations])].slice(0, 10),
  };
}

/**
 * Save memory to Supabase database
 */
async function saveMemoryToDatabase(sessionId: string, memory: SessionMemory): Promise<void> {
  try {
    const response = await fetch('/api/memory/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        memory,
      }),
    });

    if (!response.ok) {
      console.error('[useMemory] Failed to save memory to database');
    }
  } catch (error) {
    console.error('[useMemory] Error saving memory:', error);
  }
}
