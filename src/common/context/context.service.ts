import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';

import type { AuthUser, Event } from '../types';

interface Context {
  authUser?: AuthUser;
  event?: Event;
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

  setUser(authUser: AuthUser): void {
    const ctx = this.getContext();
    if (ctx) {
      ctx.authUser = authUser;
    }
  }

  setEvent(event: Event) {
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
