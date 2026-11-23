/**
 * Cached media (UIK-MEDIA-01), the less travelled paths: a broken caching-mode
 * call, a lookup that fails or resolves too late, connection changes, the
 * hub's media event for another session, and the download action's edges.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor, fireEvent } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { shouldResolveCachedMedia, useCachedMedia, useQueuedFilePreviews } from '../media';
import { OfflineMediaUnavailable } from '../OfflineMediaUnavailable';
import { OfflineHub, type MediaReadyEvent } from '../hub';
import { CometChatLogger } from '../../CometChatLogger';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEvent, CometChatEventsContextValue } from '../../../context/CometChatEvents.types';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

type Sdk = Record<string, unknown>;
const sdk = CometChat as unknown as Sdk;

const mediaEvent = (gen: number, urlKey: string): MediaReadyEvent => ({
  gen,
  urlKey,
  messageKey: '1',
  localPath: '/opfs/x',
});

/** An events context whose subscribers the test can publish to. */
function eventBus() {
  const handlers = new Set<(event: CometChatEvent) => void>();
  const value: CometChatEventsContextValue = {
    subscribe: handler => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    publish: () => undefined,
  };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CometChatEventsContext.Provider value={value}>{children}</CometChatEventsContext.Provider>
  );
  const emit = (event: CometChatEvent) => {
    for (const handler of handlers) handler(event);
  };
  return { wrapper, emit };
}

describe('shouldResolveCachedMedia', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
  });
  afterEach(() => {
    fake.restore();
  });

  it('a throwing getMediaCachingMode still resolves (the cache is assumed on)', () => {
    sdk.getMediaCachingMode = () => {
      throw new Error('not ready');
    };
    expect(shouldResolveCachedMedia()).toBe(true);
  });

  it('no getCachedMediaObjectURL on the SDK: never resolves', () => {
    fake.restore();
    fake = installOfflineSdk({ enabled: true, omit: ['getCachedMediaObjectURL'] });
    expect(shouldResolveCachedMedia()).toBe(false);
  });

  it('an SDK without getMediaCachingMode resolves', () => {
    fake.restore();
    fake = installOfflineSdk({ enabled: true, omit: ['getMediaCachingMode'] });
    expect(shouldResolveCachedMedia()).toBe(true);
  });
});

describe('useCachedMedia paths', () => {
  let fake: OfflineSdkFake;
  const revoke = vi.fn();

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    OfflineHub.getInstance().start();
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revoke,
      configurable: true,
      writable: true,
    });
    revoke.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('local (non-http) attachments are never looked up', () => {
    const attachments = [{ url: 'blob:local-1' }, { url: '' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    expect(result.current.attachments).toBe(attachments);
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(0);
  });

  it('mixed attachments: only the remote one is swapped, the local one is kept as it is', async () => {
    fake.cachedMediaUrl = 'blob:cached';
    const local = { url: 'blob:already-local' };
    const attachments = [local, { url: 'https://cdn/a.png', mimeType: 'image/png', size: 3 }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.attachments[1]?.url).toBe('blob:cached');
    });
    expect(result.current.attachments[0]).toBe(local);
    expect(fake.callsTo('getCachedMediaObjectURL')).toEqual([
      [{ url: 'https://cdn/a.png', mimeType: 'image/png', name: undefined, size: 3 }],
    ]);
  });

  it('a lookup that throws is logged and leaves the URL as it is', async () => {
    const warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
    sdk.getCachedMediaObjectURL = () => Promise.reject(new Error('opfs broken'));
    const attachments = [{ url: 'https://cdn/e.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        'OfflineMedia',
        'Cached media lookup failed:',
        expect.any(Error)
      );
    });
    expect(result.current.attachments).toBe(attachments);
    expect(result.current.unavailable).toBe(false);
  });

  it('a lookup that resolves after the attachments changed revokes the late object URL', async () => {
    let finish: (url: string) => void = () => undefined;
    sdk.getCachedMediaObjectURL = () =>
      new Promise<string>(resolve => {
        finish = resolve;
      });
    const first = [{ url: 'https://cdn/1.png' }];
    const { result, rerender } = renderHook(({ list }) => useCachedMedia(list), {
      initialProps: { list: first },
    });
    const late = finish;
    sdk.getCachedMediaObjectURL = () => Promise.resolve(null);
    const second = [{ url: 'https://cdn/2.png' }];
    rerender({ list: second });
    await act(async () => {
      late('blob:late');
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(revoke).toHaveBeenCalledWith('blob:late');
    });
    expect(result.current.attachments).toBe(second);
  });

  it('a clone of the message keeps the cached src from its first render, with no revoke', async () => {
    fake.cachedMediaUrl = 'blob:cached';
    const first = [{ url: 'https://cdn/v.mp4' }];
    const seen: string[] = [];
    const { result, rerender } = renderHook(
      ({ list }) => {
        const state = useCachedMedia(list);
        seen.push(state.attachments[0]?.url ?? '');
        return state;
      },
      { initialProps: { list: first } }
    );
    await waitFor(() => {
      expect(result.current.attachments[0]?.url).toBe('blob:cached');
    });
    seen.length = 0;
    // A receipt or reaction clones the message: a new array, the same URLs.
    rerender({ list: [{ url: 'https://cdn/v.mp4' }] });
    await act(async () => {
      await Promise.resolve();
    });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(url => url === 'blob:cached')).toBe(true);
    expect(revoke).not.toHaveBeenCalled();
  });

  it('a revoke that throws does not break unmount', async () => {
    fake.cachedMediaUrl = 'blob:twice';
    revoke.mockImplementation(() => {
      throw new Error('already revoked');
    });
    const attachments = [{ url: 'https://cdn/t.png' }];
    const { result, unmount } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.attachments[0]?.url).toBe('blob:twice');
    });
    expect(() => unmount()).not.toThrow();
    expect(revoke).toHaveBeenCalledWith('blob:twice');
  });

  it('a media event from an older session (stale gen) is ignored', async () => {
    fake.connected = false;
    const attachments = [{ url: 'https://cdn/g.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.unavailable).toBe(true);
    });
    const hub = OfflineHub.getInstance();
    const before = fake.callsTo('getCachedMediaObjectURL').length;
    act(() => {
      hub.mediaReady.emit(mediaEvent(hub.gen + 1, 'https://cdn/g.png'));
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(before);
  });

  it('a media event for one of its URLs re-resolves even with nothing missing, keeping its object URL (R17); others are ignored', async () => {
    fake.cachedMediaUrl = 'blob:first';
    const attachments = [{ url: 'https://cdn/n.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.attachments[0]?.url).toBe('blob:first');
    });
    const hub = OfflineHub.getInstance();
    const before = fake.callsTo('getCachedMediaObjectURL').length;
    act(() => {
      hub.mediaReady.emit(mediaEvent(hub.gen, 'https://cdn/other.png'));
    });
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(before);
    fake.cachedMediaUrl = 'blob:second';
    act(() => {
      hub.mediaReady.emit(mediaEvent(hub.gen, 'https://cdn/n.png'));
    });
    await act(async () => {
      await Promise.resolve();
    });
    // One object URL per cached item while it is shown: same src, nothing revoked.
    expect(result.current.attachments[0]?.url).toBe('blob:first');
    expect(revoke).not.toHaveBeenCalledWith('blob:first');
  });

  it('coming back online re-resolves: the bubble is no longer unavailable', async () => {
    const { wrapper, emit } = eventBus();
    fake.connected = false;
    const attachments = [{ url: 'https://cdn/c.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments), { wrapper });
    await waitFor(() => {
      expect(result.current.unavailable).toBe(true);
    });
    const before = fake.callsTo('getCachedMediaObjectURL').length;
    fake.connected = true;
    act(() => {
      emit({ type: 'ui:conversation/deleted' } as unknown as CometChatEvent);
    });
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(before);
    act(() => {
      emit({ type: 'connection/connected' } as CometChatEvent);
    });
    await waitFor(() => {
      expect(fake.callsTo('getCachedMediaObjectURL').length).toBeGreaterThan(before);
    });
    expect(result.current.unavailable).toBe(false);
  });

  it('offline off: a connection change does not look anything up', () => {
    fake.setEnabled(false);
    const { wrapper, emit } = eventBus();
    const attachments = [{ url: 'https://cdn/off.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments), { wrapper });
    act(() => {
      emit({ type: 'connection/disconnected' } as CometChatEvent);
    });
    expect(result.current.attachments).toBe(attachments);
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(0);
  });

  it('download: only the missing attachments are asked for, and success re-resolves', async () => {
    fake.connected = false;
    const attachments = [{ url: 'https://cdn/d.png', name: 'd.png', mimeType: 'image/png', size: 9 }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.unavailable).toBe(true);
    });
    act(() => {
      result.current.download();
    });
    const [[asked, callback]] = fake.callsTo('downloadMedia') as [
      [object, { onSuccess: () => void }],
    ];
    expect(asked).toEqual({ url: 'https://cdn/d.png', name: 'd.png', mimeType: 'image/png', size: 9 });
    fake.cachedMediaUrl = 'blob:downloaded';
    act(() => {
      callback.onSuccess();
    });
    await waitFor(() => {
      expect(result.current.attachments[0]?.url).toBe('blob:downloaded');
    });
    expect(result.current.unavailable).toBe(false);
  });

  it('download with nothing missing asks for nothing', async () => {
    fake.cachedMediaUrl = 'blob:have';
    const attachments = [{ url: 'https://cdn/h.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.attachments[0]?.url).toBe('blob:have');
    });
    result.current.download();
    expect(fake.callsTo('downloadMedia')).toHaveLength(0);
  });

  it('download on an SDK without downloadMedia is a no-op; a throwing downloadMedia is logged', async () => {
    const warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
    fake.connected = false;
    const attachments = [{ url: 'https://cdn/x.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.unavailable).toBe(true);
    });
    const saved = sdk.downloadMedia;
    Reflect.deleteProperty(sdk, 'downloadMedia');
    expect(() => result.current.download()).not.toThrow();
    sdk.downloadMedia = () => {
      throw new Error('quota');
    };
    result.current.download();
    expect(warn).toHaveBeenCalledWith('OfflineMedia', 'downloadMedia failed:', expect.any(Error));
    sdk.downloadMedia = saved;
  });
});

describe('OfflineMediaUnavailable', () => {
  it('shows the offline label; a tap downloads without reaching the bubble', () => {
    const onDownload = vi.fn();
    const onBubbleClick = vi.fn();
    render(<OfflineMediaUnavailable onDownload={onDownload} />);
    // A click handler above the kit's root (the bubble's own handlers sit there too).
    document.body.addEventListener('click', onBubbleClick);
    const button = screen.getByTestId('offline-media-unavailable');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveTextContent('Available when online');
    fireEvent.click(button);
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onBubbleClick).not.toHaveBeenCalled();
    document.body.removeEventListener('click', onBubbleClick);
  });
});

describe('useQueuedFilePreviews', () => {
  let fake: OfflineSdkFake;
  const revoke = vi.fn();
  const create = vi.fn();

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    create.mockReset().mockReturnValueOnce('blob:held-1').mockReturnValue('blob:held-more');
    revoke.mockReset();
    Object.defineProperty(URL, 'createObjectURL', { value: create, configurable: true, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revoke, configurable: true, writable: true });
  });

  afterEach(() => {
    fake.restore();
  });

  it('a clone of the queued message keeps its preview URL: no revoke, no new URL, no blank render', async () => {
    const file = new Blob(['x'], { type: 'image/png' });
    const seen: string[] = [];
    const { rerender, unmount } = renderHook(
      ({ list }) => {
        const shown = useQueuedFilePreviews(list);
        seen.push(shown[0]?.url ?? '');
        return shown;
      },
      { initialProps: { list: [{ url: '', file }] as { url: string; file?: Blob }[] } }
    );
    await waitFor(() => {
      expect(seen[seen.length - 1]).toBe('blob:held-1');
    });
    seen.length = 0;
    rerender({ list: [{ url: '', file }] });
    expect(seen.every(url => url === 'blob:held-1')).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(revoke).not.toHaveBeenCalled();

    // The ack gives the attachment its hosted URL: the held file's URL is let go.
    rerender({ list: [{ url: 'https://cdn/sent.png' }] });
    expect(revoke).toHaveBeenCalledWith('blob:held-1');
    unmount();
  });
});
