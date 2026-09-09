import { describe, it, expect, vi } from 'vitest';
import {
  startExclusivePlayback,
  stopExclusivePlayback,
  type AudioPlaybackHandle,
} from '../audioPlaybackController';

function makeHandle(): AudioPlaybackHandle & { pause: ReturnType<typeof vi.fn> } {
  return { pause: vi.fn() };
}

describe('audioPlaybackController', () => {
  it('pauses the previously active player when a new one starts', () => {
    const a = makeHandle();
    const b = makeHandle();

    startExclusivePlayback(a);
    expect(a.pause).not.toHaveBeenCalled();

    startExclusivePlayback(b);
    expect(a.pause).toHaveBeenCalledTimes(1);
    expect(b.pause).not.toHaveBeenCalled();
  });

  it('does not pause a handle when it re-starts itself', () => {
    const a = makeHandle();
    startExclusivePlayback(a);
    startExclusivePlayback(a);
    expect(a.pause).not.toHaveBeenCalled();
  });

  it('stopExclusivePlayback clears only the active handle', () => {
    const a = makeHandle();
    const b = makeHandle();

    startExclusivePlayback(a);
    // b is not active — releasing it must not affect a.
    stopExclusivePlayback(b);

    startExclusivePlayback(b);
    expect(a.pause).toHaveBeenCalledTimes(1);
  });

  it('after releasing, starting again does not pause anyone', () => {
    const a = makeHandle();
    const b = makeHandle();

    startExclusivePlayback(a);
    stopExclusivePlayback(a);

    startExclusivePlayback(b);
    // a was already released, so it should not be paused again.
    expect(a.pause).not.toHaveBeenCalled();
  });

  it('is re-entrancy safe: a synchronous pause listener that releases itself does not clear the new owner', () => {
    const a: AudioPlaybackHandle = {
      // Simulates WaveSurfer: pausing synchronously fires a listener that
      // releases this handle.
      pause: vi.fn(() => {
        stopExclusivePlayback(a);
      }),
    };
    const b = makeHandle();

    startExclusivePlayback(a);
    startExclusivePlayback(b);

    // b must remain the active player despite a's self-release during pause().
    const c = makeHandle();
    startExclusivePlayback(c);
    expect(b.pause).toHaveBeenCalledTimes(1);
  });
});
