import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CometChatLinkDialog } from '../CometChatLinkDialog';

const noop = () => {};

describe('CometChatLinkDialog property-based tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('for any string initialText and initialUrl, the inputs pre-fill correctly in edit mode', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        (text, url) => {
          const { unmount } = render(
            <CometChatLinkDialog
              mode="edit"
              initialText={text}
              initialUrl={url}
              onSave={noop}
              onCancel={noop}
            />
          );
          expect(screen.getByLabelText('Text')).toHaveValue(text);
          expect(screen.getByLabelText('Link')).toHaveValue(url);
          unmount();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('for any mode, the correct title is displayed', () => {
    fc.assert(
      fc.property(fc.constantFrom('add' as const, 'edit' as const), mode => {
        const { unmount } = render(
          <CometChatLinkDialog mode={mode} onSave={noop} onCancel={noop} />
        );
        const expectedTitle = mode === 'add' ? 'link_dialog_add_link' : 'link_dialog_edit_link';
        expect(screen.getByText(expectedTitle)).toBeInTheDocument();
        unmount();
      })
    );
  });

  it('for any combination of props, the component renders without errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('add' as const, 'edit' as const),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (mode, initialText, initialUrl, selectedText) => {
          const { unmount } = render(
            <CometChatLinkDialog
              mode={mode}
              initialText={initialText}
              initialUrl={initialUrl}
              selectedText={selectedText}
              onSave={noop}
              onCancel={noop}
            />
          );
          expect(screen.getByRole('dialog')).toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 15 }
    );
  });
});
