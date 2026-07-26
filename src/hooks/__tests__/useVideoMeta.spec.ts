import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useVideoMeta } from '../useVideoMeta';

/**
 * Minimal controllable stand-in for an off-screen <video> element. Lets a test
 * drive the `loadedmetadata` / `error` events and the dimension/duration props
 * that useVideoMeta inspects.
 */
class FakeVideo {
  preload = '';
  src = '';
  videoWidth = 0;
  videoHeight = 0;
  duration = NaN;
  private listeners: Record<string, (() => void)[]> = {};
  addEventListener(type: string, cb: () => void) {
    (this.listeners[type] ??= []).push(cb);
  }
  removeEventListener(type: string, cb: () => void) {
    this.listeners[type] = (this.listeners[type] ?? []).filter(l => l !== cb);
  }
  removeAttribute() {
    /* noop */
  }
  load() {
    /* noop */
  }
  fire(type: string) {
    (this.listeners[type] ?? []).forEach(cb => {
      cb();
    });
  }
}

let fake: FakeVideo;
// eslint-disable-next-line @typescript-eslint/no-deprecated -- generic string overload is fine for a test passthrough
const realCreateElement = document.createElement.bind(document);

beforeEach(() => {
  fake = new FakeVideo();
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'video') return fake as unknown as HTMLElement;
    return realCreateElement(tag);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useVideoMeta', () => {
  it('starts in the loading state', () => {
    const { result } = renderHook(() => useVideoMeta('https://example.com/v.mp4'));
    expect(result.current.status).toBe('loading');
    expect(result.current.duration).toBeNull();
  });

  it('stays loading with no URL (pending / optimistic message)', () => {
    const { result } = renderHook(() => useVideoMeta(undefined));
    expect(result.current.status).toBe('loading');
  });

  it('marks a real video with a visual track as valid and reports its duration', () => {
    const { result } = renderHook(() => useVideoMeta('https://example.com/v.mp4'));
    act(() => {
      fake.videoWidth = 1920;
      fake.videoHeight = 1080;
      fake.duration = 42;
      fake.fire('loadedmetadata');
    });
    expect(result.current.status).toBe('valid');
    expect(result.current.duration).toBe(42);
  });

  it('marks an audio-only file (no visual track) as invalid', () => {
    const { result } = renderHook(() => useVideoMeta('https://example.com/audio.mp3'));
    act(() => {
      fake.videoWidth = 0;
      fake.videoHeight = 0;
      fake.duration = 30;
      fake.fire('loadedmetadata');
    });
    expect(result.current.status).toBe('invalid');
    expect(result.current.duration).toBeNull();
  });

  it('marks a resource that fails to load (broken URL / image) as invalid', () => {
    const { result } = renderHook(() => useVideoMeta('https://example.com/picture.png'));
    act(() => {
      fake.fire('error');
    });
    expect(result.current.status).toBe('invalid');
  });
});
