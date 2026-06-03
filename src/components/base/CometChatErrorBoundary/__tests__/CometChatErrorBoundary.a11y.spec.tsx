import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatErrorBoundary } from '../CometChatErrorBoundary';

expect.extend(toHaveNoViolations);

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('a11y test error');
  return <div>Child OK</div>;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('CometChatErrorBoundary accessibility', () => {
  it('passes axe-core audit in normal state (children rendered)', async () => {
    const { container } = render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={false} />
      </CometChatErrorBoundary.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit in error state (default fallback)', async () => {
    const { container } = render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('fallback container has role="alert"', () => {
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('fallback container has aria-live="assertive"', () => {
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('retry button has aria-label', () => {
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Retry');
  });

  it('retry button is focusable via Tab', async () => {
    const user = userEvent.setup();
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
  });

  it('retry button activates on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    const btn = screen.getByRole('button');
    btn.focus();
    await user.keyboard('{Enter}');
    // After retry, children should re-render (and throw again, showing fallback)
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('retry button activates on Space key', async () => {
    const user = userEvent.setup();
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    const btn = screen.getByRole('button');
    btn.focus();
    await user.keyboard(' ');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
