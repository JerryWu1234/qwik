import { tryGetInvokeContext } from './use-core';

let _locale: string | undefined = undefined;

/**
 * Retrieve the current locale.
 *
 * If no current locale and there is no `defaultLocale` the function throws an error.
 *
 * @returns The locale.
 * @public
 */
export function getLocale(defaultLocale?: string): string {
  // Prefer per-request locale from AsyncLocalStorage if available (server-side)
  try {
    const asyncStore = (globalThis as any).qcAsyncRequestStore;
    const ev = asyncStore?.getStore?.();
    const evLocale = ev && typeof ev.locale === 'function' ? ev.locale : undefined;
    if (evLocale) {
      const l = evLocale();
      if (l) {
        return l;
      }
    }
  } catch {
    // ignore and fallback
  }

  if (_locale === undefined) {
    const ctx = tryGetInvokeContext();
    if (ctx && ctx.$locale$) {
      return ctx.$locale$;
    }
    if (defaultLocale !== undefined) {
      return defaultLocale;
    }
    throw new Error('Reading `locale` outside of context.');
  }
  return _locale;
}

/**
 * Override the `getLocale` with `lang` within the `fn` execution.
 *
 * @public
 */
export function withLocale<T>(locale: string, fn: () => T): T {
  // If running on the server with AsyncLocalStorage, set locale on the current request
  try {
    const asyncStore = (globalThis as any).qcAsyncRequestStore;
    const ev = asyncStore?.getStore?.();
    const evLocale = ev && typeof ev.locale === 'function' ? ev.locale : undefined;
    if (evLocale) {
      const previous = evLocale();
      try {
        evLocale(locale);
        return fn();
      } finally {
        evLocale(previous);
      }
    }
  } catch {
    // ignore and fallback
  }

  const previousLang = _locale;
  try {
    _locale = locale;
    return fn();
  } finally {
    _locale = previousLang;
  }
}

/**
 * Globally set a lang.
 *
 * This can be used only in browser. Server execution requires that each request could potentially
 * be a different lang, therefore setting a global lang would produce incorrect responses.
 *
 * @public
 */
export function setLocale(locale: string): void {
  // On the server, prefer setting the locale on the per-request store
  try {
    const asyncStore = (globalThis as any).qcAsyncRequestStore;
    const ev = asyncStore?.getStore?.();
    const evLocale = ev && typeof ev.locale === 'function' ? ev.locale : undefined;
    if (evLocale) {
      evLocale(locale);
      return;
    }
  } catch {
    // ignore and fallback
  }
  _locale = locale;
}
