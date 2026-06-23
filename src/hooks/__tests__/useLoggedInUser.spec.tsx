import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetLoggedInUser = vi.fn();
const mockSDKGetLoggedinUser = vi.fn();

vi.mock('../../CometChatUIKit', () => ({
  CometChatUIKit: {
    getLoggedInUser: () => mockGetLoggedInUser(),
  },
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getLoggedinUser: () => mockSDKGetLoggedinUser(),
  },
}));

import { useLoggedInUser } from '../useLoggedInUser';

describe('useLoggedInUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockReturnValue(null);
    mockSDKGetLoggedinUser.mockResolvedValue(null);
  });

  it('should return null initially when no user is logged in', () => {
    const { result } = renderHook(() => useLoggedInUser());
    expect(result.current).toBeNull();
  });

  it('should return user synchronously from UIKit if available', () => {
    const mockUser = { getUid: () => 'user1' };
    mockGetLoggedInUser.mockReturnValue(mockUser);

    const { result } = renderHook(() => useLoggedInUser());
    expect(result.current).toBe(mockUser);
  });

  it('should fallback to SDK getLoggedinUser when UIKit returns null', async () => {
    const mockUser = { getUid: () => 'user2' };
    mockSDKGetLoggedinUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useLoggedInUser());

    await waitFor(() => {
      expect(result.current).toBe(mockUser);
    });
  });

  it('should remain null when SDK rejects', async () => {
    mockSDKGetLoggedinUser.mockRejectedValue(new Error('Not initialized'));

    const { result } = renderHook(() => useLoggedInUser());

    // Wait a tick for the promise to settle
    await new Promise(r => setTimeout(r, 10));
    expect(result.current).toBeNull();
  });

  it('should not update state after unmount', async () => {
    const mockUser = { getUid: () => 'user3' };
    let resolvePromise: (value: unknown) => void;
    mockSDKGetLoggedinUser.mockReturnValue(
      new Promise(r => {
        resolvePromise = r;
      })
    );

    const { result, unmount } = renderHook(() => useLoggedInUser());
    unmount();

    // Resolve after unmount
    resolvePromise!(mockUser);
    await new Promise(r => setTimeout(r, 10));
    // Should not have updated (no error thrown)
    expect(result.current).toBeNull();
  });
});
