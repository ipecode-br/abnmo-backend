import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';

import type { ContextEvent, ContextUser } from '../types';

interface Context {
  user?: ContextUser;
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

  setUser(user: ContextUser): void {
    const ctx = this.getContext();
    ctx.user = user;
  }

  setEvent(event: ContextEvent) {
    const ctx = this.getContext();
    ctx.event = event;
  }

  resetEvent() {
    const ctx = this.getContext();
    delete ctx.event;
  }

  addContext(data: Record<string, any>) {
    const ctx = this.getContext();
    ctx.extras = {};

    Object.assign(ctx.extras, data);
  }
}
