import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCometChatConfirmDialogContext } from '../CometChatConfirmDialog.context';

describe('useCometChatConfirmDialogContext', () => {
  it('throws when used outside of CometChatConfirmDialog.Root', () => {
    expect(() => {
      renderHook(() => useCometChatConfirmDialogContext());
    }).toThrow(
      'useCometChatConfirmDialogContext must be used within <CometChatConfirmDialog.Root>'
    );
  });
});
