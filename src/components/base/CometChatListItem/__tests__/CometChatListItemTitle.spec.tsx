import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatListItem } from '../CometChatListItem';

/**
 * Helper: renders Title inside Root (required for context).
 */
function renderTitle(
  props: Partial<React.ComponentProps<typeof CometChatListItem.Title>> = {},
  children: React.ReactNode = 'Alice'
) {
  return render(
    <CometChatListItem.Root>
      <CometChatListItem.Title {...props}>{children}</CometChatListItem.Title>
    </CometChatListItem.Root>
  );
}

describe('CometChatListItemTitle', () => {
  it('renders text children', () => {
    renderTitle({}, 'Alice');
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders ReactNode children', () => {
    renderTitle({}, <span data-testid="custom-title">Custom</span>);
    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
  });

  it('sets title attribute when children is a string (for tooltip on overflow)', () => {
    renderTitle({}, 'A very long name that might overflow');
    const el = screen.getByText('A very long name that might overflow');
    expect(el).toHaveAttribute('title', 'A very long name that might overflow');
  });

  it('does not set title attribute when children is not a string', () => {
    renderTitle({}, <span>Not a string</span>);
    const el = screen.getByText('Not a string').parentElement!;
    expect(el).not.toHaveAttribute('title');
  });

  it('applies custom className', () => {
    renderTitle({ className: 'my-title-class' }, 'Bob');
    const el = screen.getByText('Bob');
    expect(el.className).toContain('my-title-class');
  });

  it('renders without custom className', () => {
    renderTitle({}, 'Charlie');
    const el = screen.getByText('Charlie');
    expect(el).toBeInTheDocument();
    // Should still have the base CSS module class
    expect(el.className.length).toBeGreaterThan(0);
  });
});
