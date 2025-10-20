---
'@qwik.dev/router': patch
'@qwik.dev/core': patch
---

FEAT: `withLocale()` uses AsyncLocalStorage for server-side requests when available, allowing async operations to retain the correct locale context.
