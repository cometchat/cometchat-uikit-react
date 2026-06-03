import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CometChatErrorBoundary } from '../CometChatErrorBoundary';

function ThrowingChild({ message }: { message: string }): React.ReactNode {
  throw new Error(message);
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('CometChatErrorBoundary property-based tests', () => {
  it('for any string componentName, error context contains that exact name', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), name => {
        const onError = vi.fn();
        const { unmount } = render(
          <CometChatErrorBoundary.Root componentName={name} onError={onError}>
            <ThrowingChild message="test" />
          </CometChatErrorBoundary.Root>
        );
        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0]![0]!.componentName).toBe(name);
        unmount();
      }),
      { numRuns: 30 }
    );
  });

  it('for any Error message, error context contains that exact error', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }), msg => {
        const onError = vi.fn();
        const { unmount } = render(
          <CometChatErrorBoundary.Root componentName="Test" onError={onError}>
            <ThrowingChild message={msg} />
          </CometChatErrorBoundary.Root>
        );
        expect(onError.mock.calls[0]![0]!.error.message).toBe(msg);
        unmount();
      }),
      { numRuns: 30 }
    );
  });

  it('timestamp in error context is always a positive number close to Date.now()', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const onError = vi.fn();
        const before = Date.now();
        const { unmount } = render(
          <CometChatErrorBoundary.Root componentName="Test" onError={onError}>
            <ThrowingChild message="test" />
          </CometChatErrorBoundary.Root>
        );
        const after = Date.now();
        const ts = onError.mock.calls[0]![0]!.timestamp;
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after);
        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('component never crashes regardless of error message content', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 500 }), (msg: string) => {
        const { unmount } = render(
          <CometChatErrorBoundary.Root componentName="Test">
            <ThrowingChild message={msg} />
          </CometChatErrorBoundary.Root>
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();
        unmount();
      }),
      { numRuns: 30 }
    );
  });
});
