import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCachedMedia, useCachedMediaAttachments } from '../media';
import { OfflineHub } from '../hub';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

describe('cached media (UIK-MEDIA-01)', () => {
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
    revoke.mockClear();
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('uses the SDK cached object URL when there is one, and revokes it on unmount', async () => {
    fake.cachedMediaUrl = 'blob:cached-1';
    const attachments = [{ url: 'https://cdn/x.png', name: 'x.png' }];
    const { result, unmount } = renderHook(() => useCachedMediaAttachments(attachments));
    expect(result.current).toBe(attachments);
    await waitFor(() => {
      expect(result.current[0]?.url).toBe('blob:cached-1');
    });
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:cached-1');
  });

  it('keeps one object URL per cached item across re-resolves; revokes it only when the item goes (R17)', async () => {
    fake.cachedMediaUrl = 'blob:first';
    const attachments = [{ url: 'https://cdn/v.mp4', name: 'v.mp4' }];
    const { result, rerender, unmount } = renderHook(
      ({ list }) => useCachedMediaAttachments(list),
      { initialProps: { list: attachments } }
    );
    await waitFor(() => {
      expect(result.current[0]?.url).toBe('blob:first');
    });
    // A connection change or a download re-resolves: the same src comes back.
    fake.cachedMediaUrl = 'blob:second';
    const hub = OfflineHub.getInstance();
    for (let i = 0; i < 3; i++) {
      act(() => {
        hub.mediaReady.emit({
          gen: hub.gen,
          messageKey: '1',
          urlKey: 'https://cdn/v.mp4',
          localPath: '',
        });
      });
      await act(async () => {
        await Promise.resolve();
      });
    }
    expect(result.current[0]?.url).toBe('blob:first');
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(1);
    expect(revoke).not.toHaveBeenCalled();
    // Another message: the old item's URL is revoked, the new item looked up.
    rerender({ list: [{ url: 'https://cdn/w.mp4', name: 'w.mp4' }] });
    await waitFor(() => {
      expect(result.current[0]?.url).toBe('blob:second');
    });
    expect(revoke).toHaveBeenCalledWith('blob:first');
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:second');
  });

  it('keeps the URL when nothing is cached', async () => {
    const attachments = [{ url: 'https://cdn/y.png' }];
    const { result } = renderHook(() => useCachedMediaAttachments(attachments));
    await waitFor(() => {
      expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(1);
    });
    expect(result.current).toBe(attachments);
  });

  it('offline off: no SDK lookup at all, the attachments are returned as given', () => {
    fake.setEnabled(false);
    const attachments = [{ url: 'https://cdn/z.png' }];
    const { result } = renderHook(() => useCachedMediaAttachments(attachments));
    expect(result.current).toBe(attachments);
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(0);
  });

  it('offline with bytes missing: unavailable, and a tap asks the SDK to download', async () => {
    fake.connected = false;
    const attachments = [{ url: 'https://cdn/m.png', name: 'm.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.unavailable).toBe(true);
    });
    expect(result.current.attachments).toBe(attachments);
    result.current.download();
    expect(fake.callsTo('downloadMedia')).toHaveLength(1);
  });

  it('online with bytes missing: the URL as today, not unavailable', async () => {
    const attachments = [{ url: 'https://cdn/o.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(1);
    });
    expect(result.current.unavailable).toBe(false);
  });

  it('re-resolves when the SDK reports a download for a bubble still missing bytes', async () => {
    fake.connected = false;
    const attachments = [{ url: 'https://cdn/r.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    await waitFor(() => {
      expect(result.current.unavailable).toBe(true);
    });
    fake.cachedMediaUrl = 'blob:now-cached';
    act(() => {
      fake.fire('media', 'onMediaDownloaded', '12', 'some-cache-key', '/opfs/r.png');
    });
    await waitFor(() => {
      expect(result.current.attachments[0]?.url).toBe('blob:now-cached');
    });
    expect(result.current.unavailable).toBe(false);
  });

  it('media caching OFF: no lookup, URL only (BEH-MEDIA-03)', () => {
    (CometChat as unknown as { getMediaCachingMode: () => string }).getMediaCachingMode = () =>
      'OFF';
    const attachments = [{ url: 'https://cdn/c.png' }];
    const { result } = renderHook(() => useCachedMedia(attachments));
    expect(result.current.attachments).toBe(attachments);
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(0);
  });
});
