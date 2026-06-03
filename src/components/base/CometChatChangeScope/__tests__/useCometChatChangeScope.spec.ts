import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCometChatChangeScope } from '../useCometChatChangeScope';

const options = [
  { id: 'admin', label: 'Admin' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'participant', label: 'Participant' },
];

describe('useCometChatChangeScope', () => {
  it('returns initial selection matching defaultSelection', () => {
    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'moderator' })
    );
    expect(result.current.selectedId).toBe('moderator');
  });

  it('selectOption updates selectedId', () => {
    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant' })
    );
    act(() => {
      result.current.selectOption('admin');
    });
    expect(result.current.selectedId).toBe('admin');
  });

  it('hasChanged is false when selectedId equals defaultSelection', () => {
    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant' })
    );
    expect(result.current.hasChanged).toBe(false);
  });

  it('hasChanged is true when selectedId differs from defaultSelection', () => {
    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant' })
    );
    act(() => {
      result.current.selectOption('admin');
    });
    expect(result.current.hasChanged).toBe(true);
  });

  it('confirmChange calls onScopeChanged with selectedId', async () => {
    const onScopeChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant', onScopeChanged })
    );

    act(() => {
      result.current.selectOption('admin');
    });

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await act(() => {
      result.current.confirmChange();
    });

    expect(onScopeChanged).toHaveBeenCalledWith('admin');
  });

  it('sets isLoading during async onScopeChanged', async () => {
    let resolvePromise: () => void;
    const onScopeChanged = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant', onScopeChanged })
    );

    act(() => {
      result.current.selectOption('admin');
    });

    act(() => {
      result.current.confirmChange();
    });

    expect(result.current.isLoading).toBe(true);

    await act(() => {
      resolvePromise!();
      return Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets error on onScopeChanged rejection', async () => {
    const onScopeChanged = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant', onScopeChanged })
    );

    act(() => {
      result.current.selectOption('admin');
    });

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await act(() => {
      result.current.confirmChange();
    });

    expect(result.current.error).toBe('change_scope_error');
    expect(result.current.isLoading).toBe(false);
  });

  it('clears error on new confirmChange attempt', async () => {
    let callCount = 0;
    const onScopeChanged = vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve();
    });

    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant', onScopeChanged })
    );

    act(() => {
      result.current.selectOption('admin');
    });

    // First attempt — fails
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await act(() => {
      result.current.confirmChange();
    });
    expect(result.current.error).toBe('change_scope_error');

    // Second attempt — error should be cleared before the call
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await act(() => {
      result.current.confirmChange();
    });
    expect(result.current.error).toBeNull();
  });

  it('cancel calls onClose', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant', onClose })
    );
    act(() => {
      result.current.cancel();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onScopeChanged if hasChanged is false', () => {
    const onScopeChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCometChatChangeScope({ options, defaultSelection: 'participant', onScopeChanged })
    );

    act(() => {
      result.current.confirmChange();
    });

    expect(onScopeChanged).not.toHaveBeenCalled();
  });
});
