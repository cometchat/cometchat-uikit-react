import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CometChatTypingIndicator } from '../CometChatTypingIndicator';

describe('CometChatTypingIndicator property-based tests', () => {
  it('for any array of 1–10 name strings, the component renders without errors', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        names => {
          const { unmount } = render(<CometChatTypingIndicator typingNames={names} isGroupChat />);
          expect(screen.getByRole('status')).toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('for any boolean isGroupChat, the component renders the correct text pattern', () => {
    fc.assert(
      fc.property(fc.boolean(), isGroupChat => {
        const { unmount } = render(
          <CometChatTypingIndicator typingNames={['Alice']} isGroupChat={isGroupChat} />
        );
        const status = screen.getByRole('status');
        if (isGroupChat) {
          expect(status).toHaveAttribute('aria-label', 'Alice is typing');
        } else {
          expect(status).toHaveAttribute('aria-label', 'Someone is typing');
        }
        unmount();
      })
    );
  });

  it('for any combination of typingNames.length (0–10) + isGroupChat, the display text follows documented logic', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 10 }),
        fc.boolean(),
        (names, isGroupChat) => {
          const { unmount, container } = render(
            <CometChatTypingIndicator typingNames={names} isGroupChat={isGroupChat} />
          );

          if (names.length === 0) {
            expect(container.firstChild).toBeNull();
          } else {
            const status = screen.getByRole('status');
            expect(status).toBeInTheDocument();

            if (!isGroupChat) {
              expect(status).toHaveAttribute('aria-label', 'Someone is typing');
            } else if (names.length === 1) {
              expect(status).toHaveAttribute('aria-label', `${names[0] ?? ''} is typing`);
            } else if (names.length === 2) {
              expect(status).toHaveAttribute(
                'aria-label',
                `${names[0] ?? ''} and ${names[1] ?? ''} are typing`
              );
            } else {
              expect(status).toHaveAttribute('aria-label', 'Multiple people are typing');
            }
          }
          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('for any string name (1–100 chars), the name renders correctly in group context', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), name => {
        const { unmount, container } = render(
          <CometChatTypingIndicator typingNames={[name]} isGroupChat />
        );
        const nameSpan = container.querySelector('[class*="cometchat-typing-indicator__name"]');
        expect(nameSpan).not.toBeNull();
        expect(nameSpan!.textContent).toBe(name);
        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
