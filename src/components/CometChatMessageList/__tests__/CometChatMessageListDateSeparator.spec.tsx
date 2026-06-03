import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageListDateSeparator } from '../CometChatMessageListDateSeparator';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider locale="en-us">{ui}</LocaleProvider>);
}

describe('CometChatMessageListDateSeparator', () => {
  it('renders a separator element with the correct aria-label', () => {
    renderWithLocale(
      <CometChatMessageListDateSeparator timestamp={Math.floor(Date.now() / 1000)} />
    );
    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('aria-label', 'Date separator');
  });

  it('applies a custom className alongside the default class', () => {
    const { container } = renderWithLocale(
      <CometChatMessageListDateSeparator
        timestamp={Math.floor(Date.now() / 1000)}
        className="my-custom-class"
      />
    );
    const separator = container.querySelector('[role="separator"]');
    expect(separator?.className).toMatch(/my-custom-class/);
  });

  it('renders a date text node inside', () => {
    const { container } = renderWithLocale(
      <CometChatMessageListDateSeparator timestamp={Math.floor(Date.now() / 1000)} />
    );
    // CometChatDate.Text renders a text node — the separator is never empty
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it('has the correct display name', () => {
    expect(CometChatMessageListDateSeparator.displayName).toBe('CometChatMessageListDateSeparator');
  });
});
