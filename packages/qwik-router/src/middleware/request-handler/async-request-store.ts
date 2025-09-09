import type { RequestEventInternal } from './request-event';
import type { AsyncLocalStorage } from 'node:async_hooks';

export type AsyncStore = AsyncLocalStorage<RequestEventInternal>;

// Qwik Core will also be using the async store if this is present
export const asyncRequestStore: AsyncStore | undefined = globalThis.qcAsyncRequestStore;

export const setAsyncRequestStore = (store: AsyncStore | undefined) => {
  globalThis.qcAsyncRequestStore = store;
};

import('node:async_hooks')
  .then((module) => {
    const AsyncLocalStorage = module.AsyncLocalStorage;
    const asyncStore = new AsyncLocalStorage<RequestEventInternal>();
    setAsyncRequestStore(asyncStore);
  })
  .catch((err) => {
    console.warn(
      'AsyncLocalStorage not available, continuing without it. This might impact concurrent server calls.',
      err
    );
  });
