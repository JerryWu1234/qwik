/**
 * This re-exports the QRL handlers so that they can be used as QRLs.
 *
 * In vite dev mode, this file is referenced directly. This ensures that the correct path to core is
 * used so that there's only one instance of Qwik.
 *
 * Make sure that these handlers are listed in manifest.ts
 */
export { _run, _task } from '@qwik.dev/core';
