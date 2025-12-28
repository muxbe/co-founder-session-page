import { useEffect } from 'react';
import { documentEvents, DocumentEvents, type ChatEvents } from '@/lib/events/emitter';

/**
 * Hook for Document Real-time Updates
 * Subscribes to document events from chat system
 *
 * Events:
 * - field:active - When a field becomes active
 * - field:synthesizing - When AI is synthesizing content
 * - field:complete - When a field is completed
 * - session:complete - When session is completed
 */

interface DocumentUpdateHandlers {
  onFieldActive?: (data: ChatEvents['field:active']) => void;
  onFieldSynthesizing?: (data: ChatEvents['field:synthesizing']) => void;
  onFieldComplete?: (data: ChatEvents['field:complete']) => void;
  onSessionComplete?: (data: ChatEvents['session:complete']) => void;
}

export function useDocumentUpdates(handlers: DocumentUpdateHandlers) {
  useEffect(() => {
    // Subscribe to field:active events
    if (handlers.onFieldActive) {
      documentEvents.on(DocumentEvents.FIELD_ACTIVE, (data) => {
        handlers.onFieldActive?.(data as ChatEvents['field:active']);
      });
    }

    // Subscribe to field:synthesizing events
    if (handlers.onFieldSynthesizing) {
      documentEvents.on(DocumentEvents.FIELD_SYNTHESIZING, (data) => {
        handlers.onFieldSynthesizing?.(data as ChatEvents['field:synthesizing']);
      });
    }

    // Subscribe to field:complete events
    if (handlers.onFieldComplete) {
      documentEvents.on(DocumentEvents.FIELD_COMPLETE, (data) => {
        handlers.onFieldComplete?.(data as ChatEvents['field:complete']);
      });
    }

    // Subscribe to session:complete events
    if (handlers.onSessionComplete) {
      documentEvents.on(DocumentEvents.SESSION_COMPLETE, (data) => {
        handlers.onSessionComplete?.(data as ChatEvents['session:complete']);
      });
    }

    // Cleanup subscriptions on unmount
    return () => {
      documentEvents.removeAllListeners(DocumentEvents.FIELD_ACTIVE);
      documentEvents.removeAllListeners(DocumentEvents.FIELD_SYNTHESIZING);
      documentEvents.removeAllListeners(DocumentEvents.FIELD_COMPLETE);
      documentEvents.removeAllListeners(DocumentEvents.SESSION_COMPLETE);
    };
  }, [handlers]);
}
