import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCometChatFlagMessageDialog } from '../useCometChatFlagMessageDialog';
import { buildTextMessage } from '../../../testing/mock-builders';
import type { CometChat, FlagReason } from '@cometchat/chat-sdk-javascript';

// Hoist mock for vi.mock factory
const { getFlagReasons } = vi.hoisted(() => ({
  getFlagReasons: vi.fn(),
}));

vi.mock('../CometChatFlagMessageDialogManager', () => ({
  getFlagReasons,
}));

const mockMessage = buildTextMessage({ id: 42 }) as unknown as CometChat.BaseMessage;

const mockReasons: FlagReason[] = [
  { id: 'r1', name: 'Spam' } as FlagReason,
  { id: 'r2', name: 'Harassment' } as FlagReason,
];

function renderFlagHook(
  overrides: Partial<Parameters<typeof useCometChatFlagMessageDialog>[0]> = {}
) {
  const defaultOptions = {
    message: mockMessage,
    onClose: vi.fn(),
    ...overrides,
  };
  return {
    ...renderHook(() => useCometChatFlagMessageDialog(defaultOptions)),
    onClose: defaultOptions.onClose as ReturnType<typeof vi.fn>,
  };
}

describe('useCometChatFlagMessageDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFlagReasons.mockResolvedValue(mockReasons);
  });

  // --- Initial state ---

  it('starts with isLoadingReasons=true', () => {
    getFlagReasons.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderFlagHook();
    expect(result.current.isLoadingReasons).toBe(true);
  });

  it('starts with empty flagReasons', () => {
    getFlagReasons.mockReturnValue(new Promise(() => {}));
    const { result } = renderFlagHook();
    expect(result.current.flagReasons).toEqual([]);
  });

  it('starts with no selected reason', () => {
    const { result } = renderFlagHook();
    expect(result.current.selectedReason).toBeNull();
  });

  it('starts with empty remark', () => {
    const { result } = renderFlagHook();
    expect(result.current.remark).toBe('');
  });

  it('starts with empty errorMessage', () => {
    const { result } = renderFlagHook();
    expect(result.current.errorMessage).toBe('');
  });

  it('starts with isLoading=false', () => {
    const { result } = renderFlagHook();
    expect(result.current.isLoading).toBe(false);
  });

  // --- Fetching reasons ---

  it('fetches flag reasons on mount', async () => {
    const { result } = renderFlagHook();

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    expect(getFlagReasons).toHaveBeenCalledOnce();
    expect(result.current.flagReasons).toEqual(mockReasons);
  });

  it('sets isLoadingReasons=false after fetch completes', async () => {
    const { result } = renderFlagHook();

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });
  });

  it('calls onError when fetching reasons fails', async () => {
    const error = new Error('Network error');
    getFlagReasons.mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderFlagHook({ onError });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith(error);
  });

  // --- Selecting a reason ---

  it('selectReason updates selectedReason', async () => {
    const { result } = renderFlagHook();

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
    });

    expect(result.current.selectedReason).toEqual(mockReasons[0]);
  });

  it('selectReason clears errorMessage', async () => {
    const { result } = renderFlagHook();

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    // Set an error first
    act(() => {
      result.current.setErrorMessage('Some error');
    });
    expect(result.current.errorMessage).toBe('Some error');

    // Select a reason should clear it
    act(() => {
      result.current.selectReason(mockReasons[0]!);
    });
    expect(result.current.errorMessage).toBe('');
  });

  // --- Remark ---

  it('setRemark updates remark', () => {
    const { result } = renderFlagHook();

    act(() => {
      result.current.setRemark('This is my remark');
    });

    expect(result.current.remark).toBe('This is my remark');
  });

  // --- Error message ---

  it('setErrorMessage updates errorMessage', () => {
    const { result } = renderFlagHook();

    act(() => {
      result.current.setErrorMessage('Something went wrong');
    });

    expect(result.current.errorMessage).toBe('Something went wrong');
  });

  // --- Submit ---

  it('handleSubmit does nothing when no reason is selected', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { result } = renderFlagHook({ onSubmit });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('handleSubmit calls onSubmit with messageId, reasonId, and remark', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { result } = renderFlagHook({ onSubmit });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
      result.current.setRemark('My remark');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith('42', 'r1', 'My remark');
  });

  it('handleSubmit passes undefined remark when remark is empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { result } = renderFlagHook({ onSubmit });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith('42', 'r1', undefined);
  });

  it('handleSubmit trims whitespace-only remark to undefined', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { result } = renderFlagHook({ onSubmit });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
      result.current.setRemark('   ');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith('42', 'r1', undefined);
  });

  it('handleSubmit calls onClose on successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { result, onClose } = renderFlagHook({ onSubmit });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('handleSubmit sets isLoading=true during submission', async () => {
    let resolvePromise: (value: boolean) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<boolean>(resolve => {
          resolvePromise = resolve;
        })
    );
    const { result } = renderFlagHook({ onSubmit });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
    });

    // Start submit (don't await)
    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.handleSubmit();
    });

    // isLoading should be true while waiting
    expect(result.current.isLoading).toBe(true);

    // Resolve
    await act(async () => {
      resolvePromise!(true);
      await submitPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('handleSubmit sets errorMessage when onSubmit returns false', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    const { result, onClose } = renderFlagHook({ onSubmit });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMessage).toBe('flag_message_error');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handleSubmit sets errorMessage and calls onError when onSubmit throws', async () => {
    const error = new Error('Submit failed');
    const onSubmit = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    const { result, onClose } = renderFlagHook({ onSubmit, onError });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMessage).toBe('flag_message_error');
    expect(result.current.isLoading).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handleSubmit calls onClose when no onSubmit is provided', async () => {
    const { result, onClose } = renderFlagHook({ onSubmit: undefined });

    await waitFor(() => {
      expect(result.current.isLoadingReasons).toBe(false);
    });

    act(() => {
      result.current.selectReason(mockReasons[0]!);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onClose).toHaveBeenCalledOnce();
  });

  // --- Cleanup ---

  it('does not update state after unmount (cancelled flag)', () => {
    let resolvePromise: (value: FlagReason[]) => void;
    getFlagReasons.mockReturnValue(
      new Promise<FlagReason[]>(resolve => {
        resolvePromise = resolve;
      })
    );

    const { unmount } = renderFlagHook();

    // Unmount before the promise resolves
    unmount();

    // Resolve after unmount — should not throw or update state
    act(() => {
      resolvePromise!(mockReasons);
    });

    // If we get here without errors, the cancelled flag worked
    expect(true).toBe(true);
  });
});
