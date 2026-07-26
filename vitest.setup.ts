import '@testing-library/jest-dom/vitest';

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
