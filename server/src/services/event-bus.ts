import { EventEmitter } from 'events';
import type { AppEventType, AppEventPayloadMap } from '@taskify/shared';

/**
 * Typed in-process event bus for decoupling cross-cutting concerns.
 *
 * When a mutation happens (e.g. issue created):
 *   1. The service writes to DB
 *   2. The service emits one event on the bus
 *   3. Subscribers (activity, socket, cache, notifications) handle side-effects
 *
 * This keeps controllers/services thin and makes new subscribers additive.
 */
class TypedEventBus {
  private emitter = new EventEmitter();
  // Prevent memory leaks from unbounded listeners
  private maxListeners = 64;

  constructor() {
    this.emitter.setMaxListeners(this.maxListeners);
  }

  emit<E extends AppEventType>(event: E, payload: AppEventPayloadMap[E]): void {
    this.emitter.emit(event, payload);
  }

  on<E extends AppEventType>(
    event: E,
    handler: (payload: AppEventPayloadMap[E]) => void | Promise<void>,
  ): void {
    this.emitter.on(event, handler);
  }

  off<E extends AppEventType>(
    event: E,
    handler: (payload: AppEventPayloadMap[E]) => void | Promise<void>,
  ): void {
    this.emitter.off(event, handler);
  }

  /** Remove all listeners — useful in tests */
  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

export const eventBus = new TypedEventBus();
