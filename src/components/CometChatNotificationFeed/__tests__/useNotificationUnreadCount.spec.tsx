import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

const {
  mockGetNotificationFeedUnreadCount,
  mockAddNotificationFeedListener,
  mockRemoveNotificationFeedListener,
} = vi.hoisted(() => ({
  mockGetNotificationFeedUnreadCount: vi.fn(),
  mockAddNotificationFeedListener: vi.fn(),
  mockRemoveNotificationFeedListener: vi.fn(),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getNotificationFeedUnreadCount: mockGetNotificationFeedUnreadCount,
    addNotificationFeedListener: mockAddNotificationFeedListener,
    removeNotificationFeedListener: mockRemoveNotificationFeedListener,
  },
}));

vi.mock('../../../context/CometChatFrameContext', () => ({
  useCometChatFrameContext: () => ({ iframeWindow: null }),
}));

import { useNotificationUnreadCount } from '../useNotificationUnreadCount';

describe('useNotificationUnreadCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNotificationFeedUnreadCount.mockResolvedValue({ count: 7 });
  });

  it('does not crash during server-side rendering', () => {
    const SsrProbe = () => {
      useNotificationUnreadCount();
      return React.createElement('div');
    };

    expect(() => renderToString(React.createElement(SsrProbe))).not.toThrow();
  });

  it('uses the provided polling interval', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { result, unmount } = renderHook(() =>
      useNotificationUnreadCount({ pollingInterval: 1234 })
    );

    await waitFor(() => {
      expect(result.current.count).toBe(7);
    });

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1234);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('warns when category filtering is requested', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderHook(() => useNotificationUnreadCount({ category: 'mentions' }));

    expect(warnSpy).toHaveBeenCalledWith(
      '[useNotificationUnreadCount] category filtering is not supported by the current SDK unread-count API.'
    );
  });
});
