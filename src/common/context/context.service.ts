import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

import type { AuthUser, ContextEvent } from '../types';

export interface Context {
  authUser?: AuthUser;
  event?: ContextEvent;
  extras?: Record<string, any>;
}

@Injectable()
export class ContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<Context>();

  /**
   * Initialize a new context for the current async execution chain.
   * Anything that runs inside `callback` (and asynchronous sub-calls)
   * will see the same store returned by `getContext()`.
   */
  run(initial: Context, callback: () => void) {
    this.asyncLocalStorage.run(initial, callback);
  }

  getContext(): Context {
    return this.asyncLocalStorage.getStore() ?? {};
  }

  setUser(authUser: AuthUser) {
    const ctx = this.getContext();
    if (ctx) {
      ctx.authUser = authUser;
    }
  }

  setEvent(event: ContextEvent) {
    const ctx = this.getContext();
    if (ctx) {
      ctx.event = event;
    }
  }

  resetEvent() {
    const ctx = this.getContext();
    if (ctx) {
      delete ctx.event;
    }
  }

  addContext(data: Record<string, any>) {
    const ctx = this.getContext();
    if (!ctx.extras) {
      ctx.extras = {};
    }
    Object.assign(ctx.extras, data);
  }
}
