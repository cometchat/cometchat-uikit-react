import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConfirmDialog } from '../CometChatConfirmDialog';
import { TITLE_ID, MESSAGE_ID } from '../CometChatConfirmDialogRoot';

/**
 * Helper: wraps Content inside Root so context is available.
 */
function renderContent(
  contentProps: Partial<React.ComponentProps<typeof CometChatConfirmDialog.Content>> = {}
) {
  return render(
    <CometChatConfirmDialog.Root isOpen={true} onClose={vi.fn()}>
      <CometChatConfirmDialog.Content {...contentProps} />
    </CometChatConfirmDialog.Root>
  );
}

describe('CometChatConfirmDialogContent', () => {
  // --- Default rendering ---

  it('renders default localized title and message (keys as fallback)', () => {
    renderContent();
    // Default t() returns the key itself
    expect(screen.getByText('conversation_delete_title')).toBeInTheDocument();
    expect(screen.getByText('conversation_delete_subtitle')).toBeInTheDocument();
  });

  // --- Custom title and message ---

  it('renders custom title', () => {
    renderContent({ title: 'Are you sure?' });
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    renderContent({ messageText: 'This action is permanent.' });
    expect(screen.getByText('This action is permanent.')).toBeInTheDocument();
  });

  it('renders both custom title and message', () => {
    renderContent({ title: 'Delete Chat', messageText: 'All messages will be lost.' });
    expect(screen.getByText('Delete Chat')).toBeInTheDocument();
    expect(screen.getByText('All messages will be lost.')).toBeInTheDocument();
  });

  // --- Accessibility IDs ---

  it('sets correct id on title element for aria-labelledby', () => {
    renderContent({ title: 'Delete?' });
    const titleEl = document.getElementById(TITLE_ID);
    expect(titleEl).toBeTruthy();
    expect(titleEl?.textContent).toBe('Delete?');
  });

  it('sets correct id on message element for aria-describedby', () => {
    renderContent({ messageText: 'Cannot undo.' });
    const messageEl = document.getElementById(MESSAGE_ID);
    expect(messageEl).toBeTruthy();
    expect(messageEl?.textContent).toBe('Cannot undo.');
  });

  // --- Custom children ---

  it('renders custom children instead of title and message', () => {
    renderContent({
      children: <p data-testid="custom-content">Custom content here</p>,
    });
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom content here')).toBeInTheDocument();
    // Default title/message should not be present
    expect(screen.queryByText('conversation_delete_title')).not.toBeInTheDocument();
  });

  it('does not render title/message ids when children are provided', () => {
    renderContent({
      children: <span>Override</span>,
    });
    expect(document.getElementById(TITLE_ID)).toBeNull();
    expect(document.getElementById(MESSAGE_ID)).toBeNull();
  });

  // --- Custom className ---

  it('applies custom className to content container', () => {
    const { container } = renderContent({ className: 'my-content' });
    const contentEl = container.querySelector('.my-content');
    expect(contentEl).toBeTruthy();
  });

  // --- displayName ---

  it('has correct displayName', () => {
    expect(CometChatConfirmDialog.Content.displayName).toBe('CometChatConfirmDialogContent');
  });
});
