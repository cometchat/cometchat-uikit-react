import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playIncomingSound } from '../CometChatMessageList.sound';

describe('playIncomingSound', () => {
  let originalAudio: typeof Audio | undefined;

  beforeEach(() => {
    originalAudio = globalThis.Audio;
  });

  afterEach(() => {
    if (originalAudio) {
      globalThis.Audio = originalAudio;
    }
  });

  it('plays the default incoming sound URL when no override is given', () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const AudioMock = vi.fn().mockImplementation((url: string) => ({
      src: url,
      currentTime: 0,
      play,
    }));
    globalThis.Audio = AudioMock as unknown as typeof Audio;

    playIncomingSound();

    expect(AudioMock).toHaveBeenCalledWith(
      'https://assets.cc-cluster-2.io/uikits/static/audio/incomingmessage.wav'
    );
    expect(play).toHaveBeenCalled();
  });

  it('plays the custom URL when provided', () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const AudioMock = vi.fn().mockImplementation((url: string) => ({
      src: url,
      currentTime: 0,
      play,
    }));
    globalThis.Audio = AudioMock as unknown as typeof Audio;

    playIncomingSound('https://example.com/custom.mp3');

    expect(AudioMock).toHaveBeenCalledWith('https://example.com/custom.mp3');
    expect(play).toHaveBeenCalled();
  });

  it('resets currentTime to 0 before calling play', () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const instance: { currentTime: number; play: typeof play } = {
      currentTime: 42,
      play,
    };
    globalThis.Audio = vi.fn().mockImplementation(() => instance) as unknown as typeof Audio;

    playIncomingSound();

    expect(instance.currentTime).toBe(0);
  });

  it('silently swallows play() promise rejections (autoplay blocked)', () => {
    const play = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    globalThis.Audio = vi.fn().mockImplementation(() => ({
      currentTime: 0,
      play,
    })) as unknown as typeof Audio;

    // Should not throw synchronously and the returned rejected promise is swallowed
    expect(() => {
      playIncomingSound();
    }).not.toThrow();
  });

  it('silently swallows errors when Audio constructor throws (e.g. SSR)', () => {
    globalThis.Audio = vi.fn().mockImplementation(() => {
      throw new Error('Audio is not defined');
    }) as unknown as typeof Audio;

    expect(() => {
      playIncomingSound();
    }).not.toThrow();
  });
});
