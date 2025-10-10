import type { AsyncLocalStorage } from 'node:async_hooks';
import { isServer } from 'packages/qwik/core-internal';
export let qcAsyncRequestStore: AsyncLocalStorage<RequestEventInternal> | undefined;

if (isServer) {
  import('node:async_hooks')
    .then((module) => {
      qcAsyncRequestStore = new module.AsyncLocalStorage();
    })
    .catch(() => {
      // ignore if AsyncLocalStorage is not available
    });
}
