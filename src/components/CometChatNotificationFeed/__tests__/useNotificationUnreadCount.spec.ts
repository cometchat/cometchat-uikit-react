/**
 * Unit tests for useNotificationUnreadCount: the shared store's initial fetch,
 * response shapes, one listener/interval shared across subscribers, real-time
 * increments with a corrective re-fetch, polling, focus refresh, teardown, and
 * error handling. Each test imports a fresh module so the singleton is clean.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const sdk = vi.hoisted(() => ({
  getNotificationFeedUnreadCount: vi.fn(),
  addNotificationFeedListener: vi.fn(),
  removeNotificationFeedListener: vi.fn(),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: sdk }));

type Hook = typeof import('../useNotificationUnreadCount').useNotificationUnreadCount;

let useNotificationUnreadCount: Hook;
let FrameContext: typeof import('../../../context/CometChatFrameContext').default;

const settle = () => act(() => vi.advanceTimersByTimeAsync(0));

function feedListener() {
  const call = sdk.addNotificationFeedListener.mock.calls.at(-1) as
    | [string, { onFeedItemReceived: () => void }]
    | undefined;
  if (!call) throw new Error('no listener registered');
  return call[1];
}

describe('useNotificationUnreadCount', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.resetModules();
    ({ useNotificationUnreadCount } = await import('../useNotificationUnreadCount'));
    ({ default: FrameContext } = await import('../../../context/CometChatFrameContext'));
    sdk.getNotificationFeedUnreadCount.mockResolvedValue({ count: 4 });
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
    vi.useRealTimers();
  });

  it('is loading until the first count arrives', async () => {
    const { result } = renderHook(() => useNotificationUnreadCount());
    expect(result.current).toMatchObject({ count: 0, isLoading: true });

    await settle();
    expect(result.current).toMatchObject({ count: 4, isLoading: false });
  });

  it('accepts a bare number or a payload without a count', async () => {
    sdk.getNotificationFeedUnreadCount.mockResolvedValueOnce(12);
    const { result } = renderHook(() => useNotificationUnreadCount());
    await settle();
    expect(result.current.count).toBe(12);

    sdk.getNotificationFeedUnreadCount.mockResolvedValueOnce({});
    await act(() => result.current.refresh());
    expect(result.current.count).toBe(0);
  });

  it('shares one fetch, listener and interval across subscribers', async () => {
    const a = renderHook(() => useNotificationUnreadCount());
    const b = renderHook(() => useNotificationUnreadCount());
    await settle();

    expect(sdk.getNotificationFeedUnreadCount).toHaveBeenCalledTimes(1);
    expect(sdk.addNotificationFeedListener).toHaveBeenCalledTimes(1);
    expect(a.result.current.count).toBe(4);
    expect(b.result.current.count).toBe(4);

    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(sdk.getNotificationFeedUnreadCount).toHaveBeenCalledTimes(2);
  });

  it('bumps the count immediately on a real-time item, then re-fetches for accuracy', async () => {
    const { result } = renderHook(() => useNotificationUnreadCount());
    await settle();

    sdk.getNotificationFeedUnreadCount.mockResolvedValue({ count: 6 });
    act(() => {
      feedListener().onFeedItemReceived();
    });
    expect(result.current.count).toBe(5);

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.count).toBe(6);
  });

  it('re-fetches every 30 seconds and when the window regains focus', async () => {
    const { result } = renderHook(() => useNotificationUnreadCount());
    await settle();

    sdk.getNotificationFeedUnreadCount.mockResolvedValue({ count: 8 });
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(result.current.count).toBe(8);

    sdk.getNotificationFeedUnreadCount.mockResolvedValue({ count: 2 });
    window.dispatchEvent(new Event('focus'));
    await settle();
    expect(result.current.count).toBe(2);
  });

  it('listens for focus on the iframe window when rendered inside a frame', async () => {
    const frameWindow = new EventTarget() as unknown as Window;
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        FrameContext.Provider,
        { value: { iframeWindow: frameWindow, iframeDocument: null, iframe: null } },
        children
      );
    const { result } = renderHook(() => useNotificationUnreadCount(), { wrapper });
    await settle();

    sdk.getNotificationFeedUnreadCount.mockResolvedValue({ count: 1 });
    frameWindow.dispatchEvent(new Event('focus'));
    await settle();
    expect(result.current.count).toBe(1);
  });

  it('tears everything down when the last subscriber unmounts', async () => {
    const a = renderHook(() => useNotificationUnreadCount());
    const b = renderHook(() => useNotificationUnreadCount());
    await settle();

    a.unmount();
    expect(sdk.removeNotificationFeedListener).not.toHaveBeenCalled();
    b.unmount();
    const listenerId = sdk.addNotificationFeedListener.mock.calls[0]?.[0] as string;
    expect(sdk.removeNotificationFeedListener).toHaveBeenCalledWith(listenerId);

    sdk.getNotificationFeedUnreadCount.mockClear();
    await act(() => vi.advanceTimersByTimeAsync(60000));
    window.dispatchEvent(new Event('focus'));
    await settle();
    expect(sdk.getNotificationFeedUnreadCount).not.toHaveBeenCalled();
  });

  it('keeps the last count when a later subscriber restarts the store', async () => {
    const first = renderHook(() => useNotificationUnreadCount());
    await settle();
    first.unmount();

    const gate = new Promise<{ count: number }>(() => undefined);
    sdk.getNotificationFeedUnreadCount.mockReturnValueOnce(gate);
    const { result } = renderHook(() => useNotificationUnreadCount());
    expect(result.current).toMatchObject({ count: 4, isLoading: false });
    expect(sdk.addNotificationFeedListener).toHaveBeenCalledTimes(2);
  });

  it('does not start a second request while one is in flight', async () => {
    let resolve!: (v: { count: number }) => void;
    sdk.getNotificationFeedUnreadCount.mockReturnValueOnce(
      new Promise(r => {
        resolve = r;
      })
    );
    const { result } = renderHook(() => useNotificationUnreadCount());
    await act(() => result.current.refresh());
    expect(sdk.getNotificationFeedUnreadCount).toHaveBeenCalledTimes(1);

    resolve({ count: 3 });
    await settle();
    expect(result.current.count).toBe(3);
  });

  it('keeps the previous count on failure, warning only for unexpected errors', async () => {
    const { result } = renderHook(() => useNotificationUnreadCount());
    await settle();

    sdk.getNotificationFeedUnreadCount.mockRejectedValueOnce({ code: 'ERR_BAD_REQUEST' });
    await act(() => result.current.refresh());
    expect(warn).not.toHaveBeenCalled();
    expect(result.current.count).toBe(4);

    sdk.getNotificationFeedUnreadCount.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.refresh());
    expect(warn).toHaveBeenCalled();
    expect(result.current.count).toBe(4);
  });

  it('still polls when the real-time listener cannot be registered', async () => {
    sdk.addNotificationFeedListener.mockImplementationOnce(() => {
      throw new Error('no ws');
    });
    sdk.removeNotificationFeedListener.mockImplementationOnce(() => {
      throw new Error('no ws');
    });
    const { result, unmount } = renderHook(() => useNotificationUnreadCount());
    await settle();
    expect(warn).toHaveBeenCalled();

    sdk.getNotificationFeedUnreadCount.mockResolvedValue({ count: 9 });
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(result.current.count).toBe(9);
    expect(unmount).not.toThrow();
  });

  // Known issue: isLoading is only cleared on success, so a failed first fetch leaves it true forever.
  it.fails('stops reporting loading once the first fetch has failed', async () => {
    sdk.getNotificationFeedUnreadCount.mockRejectedValue({ code: 'ERR_BAD_REQUEST' });
    const { result } = renderHook(() => useNotificationUnreadCount());
    await settle();
    expect(result.current.isLoading).toBe(false);
  });

  // Known issue: the hook ignores its options, so the documented pollingInterval never takes effect.
  it.fails('polls at the requested pollingInterval', async () => {
    renderHook(() => useNotificationUnreadCount({ pollingInterval: 5000 }));
    await settle();
    sdk.getNotificationFeedUnreadCount.mockClear();

    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(sdk.getNotificationFeedUnreadCount).toHaveBeenCalledTimes(1);
  });
});
