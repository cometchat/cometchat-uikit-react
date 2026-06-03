import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { CometChatThemeProvider } from '../ThemeProvider';
import { useTheme } from '../ThemeContext';

describe('CometChatThemeProvider', () => {
  it('renders children', () => {
    render(
      <CometChatThemeProvider>
        <span data-testid="child">Hello</span>
      </CometChatThemeProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders wrapper with data-theme="light" by default', () => {
    const { container } = render(
      <CometChatThemeProvider>
        <span>Content</span>
      </CometChatThemeProvider>
    );
    const wrapper = container.querySelector('[data-theme="light"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders wrapper with data-theme="dark" when theme="dark"', () => {
    const { container } = render(
      <CometChatThemeProvider theme="dark">
        <span>Content</span>
      </CometChatThemeProvider>
    );
    const wrapper = container.querySelector('[data-theme="dark"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('wrapper has className="cometchat"', () => {
    const { container } = render(
      <CometChatThemeProvider>
        <span>Content</span>
      </CometChatThemeProvider>
    );
    const wrapper = container.querySelector('.cometchat');
    expect(wrapper).toBeInTheDocument();
  });

  it('useTheme returns current theme value inside provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CometChatThemeProvider theme="dark">{children}</CometChatThemeProvider>
    );
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('dark');
  });

  it('setTheme updates the theme', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CometChatThemeProvider>{children}</CometChatThemeProvider>
    );
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
  });

  it('syncs with prop changes (controlled mode)', () => {
    const { container, rerender } = render(
      <CometChatThemeProvider theme="light">
        <span>Content</span>
      </CometChatThemeProvider>
    );

    expect(container.querySelector('[data-theme="light"]')).toBeInTheDocument();

    rerender(
      <CometChatThemeProvider theme="dark">
        <span>Content</span>
      </CometChatThemeProvider>
    );

    expect(container.querySelector('[data-theme="dark"]')).toBeInTheDocument();
  });

  it('has displayName', () => {
    expect(CometChatThemeProvider.displayName).toBe('CometChatThemeProvider');
  });
});
