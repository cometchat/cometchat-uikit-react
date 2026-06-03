import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatReactionsOverflow } from '../CometChatReactionsOverflow';

describe('CometChatReactionsOverflow', () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it('renders a button element', () => {
    render(<CometChatReactionsOverflow count={3} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('displays the count with a + prefix', () => {
    render(<CometChatReactionsOverflow count={5} />);
    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('displays count of 1', () => {
    render(<CometChatReactionsOverflow count={1} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('displays large counts', () => {
    render(<CometChatReactionsOverflow count={42} />);
    expect(screen.getByText('+42')).toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────

  it('has an aria-label indicating the number of hidden reactions', () => {
    render(<CometChatReactionsOverflow count={3} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '+3 more reactions');
  });

  it('has correct aria-label for count of 1', () => {
    render(<CometChatReactionsOverflow count={1} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '+1 more reactions');
  });

  // ─── Custom className ─────────────────────────────────────────────

  it('applies custom className', () => {
    const { container } = render(<CometChatReactionsOverflow count={3} className="my-overflow" />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('my-overflow');
  });

  it('renders without custom className', () => {
    const { container } = render(<CometChatReactionsOverflow count={3} />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    // Should still have the base CSS module class
    expect(button?.className).toBeTruthy();
  });
});
