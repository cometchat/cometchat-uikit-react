import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatErrorBoundary } from '../CometChatErrorBoundary';
import { CometChatErrorBoundaryContext } from '../CometChatErrorBoundary.context';
import type { CometChatErrorBoundaryContextValue } from '../CometChatErrorBoundary.types';

/** A child that throws during render when shouldThrow is true. */
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div data-testid="child-content">Child OK</div>;
}

/** A child that reads context and exposes it for assertions. */
function ContextReader({
  onContext,
}: {
  onContext: (ctx: CometChatErrorBoundaryContextValue) => void;
}) {
  const ctx = React.useContext(CometChatErrorBoundaryContext);
  React.useEffect(() => {
    if (ctx) onContext(ctx);
  }, [ctx, onContext]);
  return <div>context reader</div>;
}

// Suppress console.error from React error boundary logging during tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('CometChatErrorBoundaryRoot', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={false} />
      </CometChatErrorBoundary.Root>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('catches rendering errors and displays default fallback', () => {
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onError callback with structured CometChatErrorContext', () => {
    const onError = vi.fn();
    render(
      <CometChatErrorBoundary.Root componentName="MessageBubble" onError={onError}>
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const ctx = onError.mock.calls[0]![0]!;
    expect(ctx.error).toBeInstanceOf(Error);
    expect(ctx.error.message).toBe('Test render error');
    expect(ctx.componentName).toBe('MessageBubble');
    expect(typeof ctx.timestamp).toBe('number');
    expect(ctx.timestamp).toBeGreaterThan(0);
  });

  it('uses componentName prop in error context, defaults to Unknown', () => {
    const onError = vi.fn();
    render(
      <CometChatErrorBoundary.Root onError={onError}>
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    expect(onError.mock.calls[0]![0]!.componentName).toBe('Unknown');
  });

  it('logs error to console with [CometChat:ErrorBoundary] prefix', () => {
    render(
      <CometChatErrorBoundary.Root componentName="TestComp">
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    expect(console.error).toHaveBeenCalledWith(
      '[CometChat:ErrorBoundary]',
      'Error in TestComp:',
      expect.any(Error),
      expect.anything()
    );
  });

  it('renders custom fallbackView when provided and error occurs', () => {
    render(
      <CometChatErrorBoundary.Root
        componentName="Test"
        fallbackView={(ctx, retry) => (
          <div data-testid="custom-fallback">
            Error: {ctx.error.message}
            <button onClick={retry}>Retry</button>
          </div>
        )}
      >
        <ThrowingChild shouldThrow={true} />
      </CometChatErrorBoundary.Root>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Error: Test render error')).toBeInTheDocument();
  });

  it('applies custom className to root wrapper', () => {
    const { container } = render(
      <CometChatErrorBoundary.Root componentName="Test" className="my-custom-class">
        <ThrowingChild shouldThrow={false} />
      </CometChatErrorBoundary.Root>
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain('my-custom-class');
  });

  it('provides context to children via CometChatErrorBoundaryContext', () => {
    const onContext = vi.fn();
    render(
      <CometChatErrorBoundary.Root componentName="Test">
        <ContextReader onContext={onContext} />
      </CometChatErrorBoundary.Root>
    );
    expect(onContext).toHaveBeenCalled();
    const ctx = onContext.mock.calls[0]![0]!;
    expect(ctx.hasError).toBe(false);
    expect(ctx.errorContext).toBeNull();
    expect(typeof ctx.retry).toBe('function');
  });

  it('nested error boundaries: inner catches error, outer is unaffected', () => {
    render(
      <CometChatErrorBoundary.Root componentName="Outer">
        <div data-testid="outer-child">Outer OK</div>
        <CometChatErrorBoundary.Root componentName="Inner">
          <ThrowingChild shouldThrow={true} />
        </CometChatErrorBoundary.Root>
      </CometChatErrorBoundary.Root>
    );
    expect(screen.getByTestId('outer-child')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
