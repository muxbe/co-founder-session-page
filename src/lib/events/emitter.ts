type EventCallback = (data: unknown) => void;

interface EventMap {
  [key: string]: EventCallback[];
}

/**
 * Simple event emitter for component communication
 */
class EventEmitter {
  private events: EventMap = {};

  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event: string, data?: unknown): void {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => callback(data));
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Global event emitter instance
export const eventEmitter = new EventEmitter();

// Event types for type safety
export type ChatEvents = {
  'field:active': { fieldId: string };
  'field:synthesizing': { fieldId: string };
  'field:complete': { fieldId: string; content: string };
  'session:complete': { sessionId: string };
  'experience:collected': { experience: unknown };
};
