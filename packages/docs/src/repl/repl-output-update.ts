import type { ReplResult, ReplStore } from './types';

// TODO fix useStore to recursively notify subscribers
const deepUpdate = (prev: any, next: any) => {
  for (const key in next) {
    if (prev[key] && typeof next[key] === 'object' && typeof prev[key] === 'object') {
      deepUpdate(prev[key], next[key]);
    } else {
      if (prev[key] !== next[key]) {
        prev[key] = next[key];
      }
    }
  }
  if (Array.isArray(prev)) {
    for (const key in prev) {
      if (!(key in next)) {
        delete prev[key];
        // deleting array elements doesn't change the length
        prev.length--;
      }
    }
  } else {
    for (const key in prev) {
      if (!(key in next)) {
        delete prev[key];
      }
    }
  }
};

export const updateReplOutput = async (store: ReplStore, result: ReplResult) => {
  deepUpdate(store.diagnostics, result.diagnostics);

  if (result.diagnostics.length === 0) {
    if (store.html !== result.html) {
      store.html = result.html;
    }
    deepUpdate(store.transformedModules, result.transformedModules);
    deepUpdate(store.clientBundles, result.clientBundles);
    deepUpdate(store.ssrModules, result.ssrModules);
    if (
      result.events.length !== store.events.length ||
      result.events.some((ev, i) => ev?.start !== store.events[i]?.start)
    ) {
      store.events = result.events;
    }

    if (store.selectedOutputPanel === 'diagnostics' && store.monacoDiagnostics.length === 0) {
      store.selectedOutputPanel = 'app';
    }
  }
};
