import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CometChatToast } from '../CometChatToast';

describe('CometChatToast property-based tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('for any string text (1–1000 chars), the toast renders without errors', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 1000 }), text => {
        const { unmount } = render(<CometChatToast text={text} duration={0} />);
        const toast = screen.getByRole('status');
        expect(toast).toBeInTheDocument();
        expect(toast).toHaveAttribute('aria-label', text);
        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('for any positive integer duration, auto-dismiss fires at the correct time', () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 10000 }), duration => {
        const onClose = vi.fn();
        const { unmount } = render(
          <CometChatToast text="Test" duration={duration} onClose={onClose} />
        );

        act(() => {
          vi.advanceTimersByTime(duration - 1);
        });
        expect(onClose).not.toHaveBeenCalled();

        act(() => {
          vi.advanceTimersByTime(1);
        });
        expect(onClose).toHaveBeenCalledOnce();
        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('for any boolean showCloseButton, the close button renders/hides correctly', () => {
    fc.assert(
      fc.property(fc.boolean(), showCloseButton => {
        const { unmount } = render(
          <CometChatToast text="Test" duration={0} showCloseButton={showCloseButton} />
        );

        const btn = screen.queryByLabelText('Close notification');
        if (showCloseButton) {
          expect(btn).not.toBeNull();
        } else {
          expect(btn).toBeNull();
        }
        unmount();
      })
    );
  });

  it('for any boolean dismissOnEscape, Escape key behavior is correct', () => {
    fc.assert(
      fc.property(fc.boolean(), dismissOnEscape => {
        const onClose = vi.fn();
        const { unmount } = render(
          <CometChatToast
            text="Test"
            duration={0}
            onClose={onClose}
            dismissOnEscape={dismissOnEscape}
          />
        );

        fireEvent.keyDown(document, { key: 'Escape' });

        if (dismissOnEscape) {
          expect(onClose).toHaveBeenCalledOnce();
        } else {
          expect(onClose).not.toHaveBeenCalled();
        }
        unmount();
      })
    );
  });

  it('for any combination of duration: 0 + showCloseButton + dismissOnEscape, the component renders without errors', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (showCloseButton, dismissOnEscape) => {
        const { unmount } = render(
          <CometChatToast
            text="Persistent test"
            duration={0}
            showCloseButton={showCloseButton}
            dismissOnEscape={dismissOnEscape}
          />
        );

        const toast = screen.getByRole('status');
        expect(toast).toBeInTheDocument();

        // Advance time — should never auto-dismiss
        act(() => {
          vi.advanceTimersByTime(10000);
        });
        expect(toast).toBeInTheDocument();
        unmount();
      }),
      { numRuns: 10 }
    );
  });
});
