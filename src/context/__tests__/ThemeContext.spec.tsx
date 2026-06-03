import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTheme } from '../ThemeContext';
import { CometChatThemeContext } from '../ThemeContext';

describe('useTheme', () => {
  it('returns light theme by default when no provider is present', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('setTheme is a no-op outside provider (does not throw)', () => {
    const { result } = renderHook(() => useTheme());
    expect(() => result.current.setTheme('dark')).not.toThrow();
  });
});

describe('CometChatThemeContext', () => {
  it('has the correct displayName', () => {
    expect(CometChatThemeContext.displayName).toBe('CometChatThemeContext');
  });
});
