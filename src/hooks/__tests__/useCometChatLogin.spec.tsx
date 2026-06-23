import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetLoggedInUser = vi.fn();
const mockLoginWithAuthToken = vi.fn();
const mockLogin = vi.fn();
const mockIsInitialized = vi.fn();

vi.mock('../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: {
    getLoggedInUser: () => mockGetLoggedInUser(),
    loginWithAuthToken: (token: string) => mockLoginWithAuthToken(token),
    login: (uid: string) => mockLogin(uid),
    isInitialized: () => mockIsInitialized(),
  },
}));

vi.mock('../../utils/CometChatLogger', () => ({
  CometChatLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { useCometChatLogin } from '../useCometChatLogin';
import type { CometChatInitState } from '../../context/ChatState.types';

describe('useCometChatLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockReturnValue(null);
  });

  it('should start in idle state', () => {
    const { result } = renderHook(() =>
      useCometChatLogin({ initState: 'idle' as CometChatInitState })
    );
    expect(result.current.loginState).toBe('idle');
    expect(result.current.loggedInUser).toBeNull();
    expect(result.current.loginError).toBeNull();
  });

  it('should not attempt login when initState is not initialized', () => {
    renderHook(() =>
      useCometChatLogin({ initState: 'initializing' as CometChatInitState, authToken: 'token' })
    );
    expect(mockLoginWithAuthToken).not.toHaveBeenCalled();
  });

  it('should use existing session if getLoggedInUser returns a user', async () => {
    const mockUser = { getUid: () => 'user1' };
    mockGetLoggedInUser.mockReturnValue(mockUser);
    const onLoginSuccess = vi.fn();

    const { result } = renderHook(() =>
      useCometChatLogin({
        initState: 'initialized' as CometChatInitState,
        authToken: 'token123',
        onLoginSuccess,
      })
    );

    await waitFor(() => {
      expect(result.current.loginState).toBe('logged-in');
    });
    expect(result.current.loggedInUser).toBe(mockUser);
    expect(onLoginSuccess).toHaveBeenCalledWith(mockUser);
    expect(mockLoginWithAuthToken).not.toHaveBeenCalled();
  });

  it('should login with authToken when provided', async () => {
    const mockUser = { getUid: () => 'user1' };
    mockLoginWithAuthToken.mockResolvedValue(mockUser);

    const { result } = renderHook(() =>
      useCometChatLogin({
        initState: 'initialized' as CometChatInitState,
        authToken: 'my-token',
      })
    );

    await waitFor(() => {
      expect(result.current.loginState).toBe('logged-in');
    });
    expect(mockLoginWithAuthToken).toHaveBeenCalledWith('my-token');
    expect(result.current.loggedInUser).toBe(mockUser);
  });

  it('should login with uid when authToken is not provided', async () => {
    const mockUser = { getUid: () => 'uid1' };
    mockLogin.mockResolvedValue(mockUser);

    const { result } = renderHook(() =>
      useCometChatLogin({
        initState: 'initialized' as CometChatInitState,
        uid: 'uid1',
      })
    );

    await waitFor(() => {
      expect(result.current.loginState).toBe('logged-in');
    });
    expect(mockLogin).toHaveBeenCalledWith('uid1');
    expect(result.current.loggedInUser).toBe(mockUser);
  });

  it('should set error state when neither authToken nor uid is provided', async () => {
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useCometChatLogin({
        initState: 'initialized' as CometChatInitState,
        onError,
      })
    );

    await waitFor(() => {
      expect(result.current.loginState).toBe('error');
    });
    expect(result.current.loginError).toBeInstanceOf(Error);
    expect(result.current.loginError?.message).toContain('authToken or uid');
    expect(onError).toHaveBeenCalled();
  });

  it('should set error state when login fails', async () => {
    mockLoginWithAuthToken.mockRejectedValue(new Error('Auth failed'));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useCometChatLogin({
        initState: 'initialized' as CometChatInitState,
        authToken: 'bad-token',
        onError,
      })
    );

    await waitFor(() => {
      expect(result.current.loginState).toBe('error');
    });
    expect(result.current.loginError?.message).toBe('Auth failed');
    expect(onError).toHaveBeenCalled();
  });

  it('should handle non-Error rejection', async () => {
    mockLoginWithAuthToken.mockRejectedValue('string error');

    const { result } = renderHook(() =>
      useCometChatLogin({
        initState: 'initialized' as CometChatInitState,
        authToken: 'token',
      })
    );

    await waitFor(() => {
      expect(result.current.loginState).toBe('error');
    });
    expect(result.current.loginError?.message).toBe('string error');
  });
});
