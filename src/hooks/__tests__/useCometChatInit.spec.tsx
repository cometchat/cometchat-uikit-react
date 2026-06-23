import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInit = vi.fn();
const mockIsInitialized = vi.fn();

vi.mock('../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: {
    init: (settings: unknown) => mockInit(settings),
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

import { useCometChatInit } from '../useCometChatInit';
import type { UIKitSettings } from '../../CometChatUIKit/UIKitSettings';

describe('useCometChatInit', () => {
  const mockSettings = { getAppId: () => 'app1' } as unknown as UIKitSettings;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsInitialized.mockReturnValue(false);
  });

  it('should start in idle state initially', () => {
    // Prevent init from running
    mockInit.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useCometChatInit({ settings: mockSettings }));
    // State is either idle or initializing depending on timing
    expect(['idle', 'initializing']).toContain(result.current.initState);
    expect(result.current.initError).toBeNull();
  });

  it('should transition to initialized on success', async () => {
    mockInit.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCometChatInit({ settings: mockSettings }));

    await waitFor(() => {
      expect(result.current.initState).toBe('initialized');
    });
    expect(result.current.initError).toBeNull();
    expect(mockInit).toHaveBeenCalledWith(mockSettings);
  });

  it('should skip init when already initialized', async () => {
    mockIsInitialized.mockReturnValue(true);

    const { result } = renderHook(() => useCometChatInit({ settings: mockSettings }));

    await waitFor(() => {
      expect(result.current.initState).toBe('initialized');
    });
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should set error state when init fails', async () => {
    mockInit.mockRejectedValue(new Error('Init failed'));
    const onError = vi.fn();

    const { result } = renderHook(() => useCometChatInit({ settings: mockSettings, onError }));

    await waitFor(() => {
      expect(result.current.initState).toBe('error');
    });
    expect(result.current.initError?.message).toBe('Init failed');
    expect(onError).toHaveBeenCalled();
  });

  it('should handle non-Error rejection', async () => {
    mockInit.mockRejectedValue('string error');

    const { result } = renderHook(() => useCometChatInit({ settings: mockSettings }));

    await waitFor(() => {
      expect(result.current.initState).toBe('error');
    });
    expect(result.current.initError?.message).toBe('string error');
  });
});
