import '@testing-library/jest-dom/vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// jsdom doesn't implement HTMLMediaElement playback: play() returns undefined
// (so `.catch(...)` on it throws) and pause()/load() log "Not implemented"
// noise. Stub them so audio/video components can be exercised in tests.
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  writable: true,
  value: () => Promise.resolve(),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  writable: true,
  value: () => undefined,
});
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  configurable: true,
  writable: true,
  value: () => undefined,
});

/**
 * jsdom implements no IntersectionObserver, but several components use one for
 * infinite scroll. Without this, merely rendering a list that thinks it has more
 * pages throws — which is a property of the environment, not of the component.
 *
 * Specs that need to *drive* the observer should stub it locally and capture the
 * callbacks; this stub only keeps rendering from crashing.
 */
if (!('IntersectionObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: class {
      observe() {
        /* no-op */
      }
      unobserve() {
        /* no-op */
      }
      disconnect() {
        /* no-op */
      }
      takeRecords() {
        return [];
      }
    },
  });
}

/**
 * Neutralise the pin/save feature-flag reads for every spec.
 *
 * `usePinSaveFeatures` is mounted by ordinary components now — the message bubble,
 * the conversation row, the message-header overflow menu — so any spec rendering
 * one reaches the real SDK. The real implementation reads the app-settings blob,
 * which no test has, and rejects from a promise INSIDE the SDK that our own
 * try/catch never sees; it surfaces as an unhandled rejection and fails the whole
 * file, however unrelated the spec.
 *
 * Off by default, matching production before resolution lands. A spec that wants
 * the features on does `vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true)`
 * and awaits `resolvePinSaveFeatures()`; `vi.restoreAllMocks()` restores these
 * stubs, not the live SDK, so the isolation holds across files.
 */
for (const flag of [
  'isPinMessageEnabled',
  'isSaveMessageEnabled',
  'isPinConversationEnabled',
] as const) {
  Object.defineProperty(CometChat, flag, {
    configurable: true,
    writable: true,
    value: () => Promise.resolve(false),
  });
}
