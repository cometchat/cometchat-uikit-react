import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChatSoundManager } from '../CometChatSoundManager';

describe('CometChatSoundManager', () => {
  const originalAudio = globalThis.Audio;
  const originalNavigator = window.navigator;
  let firstAudio: { pause: ReturnType<typeof vi.fn>; currentTime: number; loop: boolean } | null = null;
  let secondAudio: { pause: ReturnType<typeof vi.fn>; currentTime: number; loop: boolean } | null = null;
  let audioCount = 0;

  beforeEach(() => {
    audioCount = 0;
    firstAudio = null;
    secondAudio = null;

    Object.defineProperty(window, 'navigator', {
      configurable: true,
      value: {
        ...originalNavigator,
        userActivation: { isActive: true, hasBeenActive: true },
      },
    });

    globalThis.Audio = vi.fn(() => {
      audioCount += 1;
      const audio = {
        pause: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        currentTime: 0,
        loop: false,
      };
      if (audioCount === 1) firstAudio = audio;
      if (audioCount === 2) secondAudio = audio;
      return audio as unknown as HTMLAudioElement;
    }) as unknown as typeof Audio;
  });

  afterEach(() => {
    CometChatSoundManager.pause();
    globalThis.Audio = originalAudio;
    Object.defineProperty(window, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
    vi.restoreAllMocks();
  });

  it('pauses the previous audio before starting a new one', () => {
    CometChatSoundManager.onIncomingCall();
    CometChatSoundManager.onIncomingMessage();

    expect(firstAudio?.pause).toHaveBeenCalledTimes(1);
    expect(firstAudio?.currentTime).toBe(0);
    expect(secondAudio).not.toBeNull();
  });
});
