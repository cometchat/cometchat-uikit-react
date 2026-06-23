import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatFlagMessageDialog } from '../CometChatFlagMessageDialog';
import { TITLE_ID, SUBTITLE_ID } from '../CometChatFlagMessageDialogRoot';
import { buildTextMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

// Mock the manager so SDK calls don't run
vi.mock('../CometChatFlagMessageDialogManager', () => ({
  getFlagReasons: vi.fn().mockResolvedValue([]),
}));

const mockMessage = buildTextMessage({ id: 1 }) as unknown as CometChat.BaseMessage;

/**
 * Helper: wraps Header inside Root so context is available.
 */
function renderHeader(
  headerProps: Partial<React.ComponentProps<typeof CometChatFlagMessageDialog.Header>> = {}
) {
  return render(
    <CometChatFlagMessageDialog.Root message={mockMessage} isOpen={true} onClose={vi.fn()}>
      <CometChatFlagMessageDialog.Header {...headerProps} />
    </CometChatFlagMessageDialog.Root>
  );
}

describe('CometChatFlagMessageDialogHeader', () => {
  // --- Default rendering ---

  it('renders default localized title and subtitle (keys as fallback)', () => {
    renderHeader();
    // Default t() returns the key itself
    expect(screen.getByText('flag_message_title')).toBeInTheDocument();
    expect(screen.getByText('flag_message_subtitle')).toBeInTheDocument();
  });

  // --- Custom title and subtitle ---

  it('renders custom title', () => {
    renderHeader({ title: 'Report this message' });
    expect(screen.getByText('Report this message')).toBeInTheDocument();
  });

  it('renders custom subtitle', () => {
    renderHeader({ subtitle: 'Please select a reason below.' });
    expect(screen.getByText('Please select a reason below.')).toBeInTheDocument();
  });

  it('renders both custom title and subtitle', () => {
    renderHeader({ title: 'Flag Message', subtitle: 'Choose a reason.' });
    expect(screen.getByText('Flag Message')).toBeInTheDocument();
    expect(screen.getByText('Choose a reason.')).toBeInTheDocument();
  });

  // --- Accessibility IDs ---

  it('sets correct id on title element for aria-labelledby', () => {
    renderHeader({ title: 'Report?' });
    const titleEl = document.getElementById(TITLE_ID);
    expect(titleEl).toBeTruthy();
    expect(titleEl?.textContent).toBe('Report?');
  });

  it('sets correct id on subtitle element for aria-describedby', () => {
    renderHeader({ subtitle: 'Select reason.' });
    const subtitleEl = document.getElementById(SUBTITLE_ID);
    expect(subtitleEl).toBeTruthy();
    expect(subtitleEl?.textContent).toBe('Select reason.');
  });

  // --- Custom children ---

  it('renders custom children instead of title and subtitle', () => {
    renderHeader({
      children: <p data-testid="custom-header">Custom header content</p>,
    });
    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByText('Custom header content')).toBeInTheDocument();
    // Default title/subtitle should not be present
    expect(screen.queryByText('flag_message_title')).not.toBeInTheDocument();
  });

  it('does not render title/subtitle ids when children are provided', () => {
    renderHeader({
      children: <span>Override</span>,
    });
    expect(document.getElementById(TITLE_ID)).toBeNull();
    expect(document.getElementById(SUBTITLE_ID)).toBeNull();
  });

  // --- Custom className ---

  it('applies custom className to header container', () => {
    const { container } = renderHeader({ className: 'my-header' });
    const headerEl = container.querySelector('.my-header');
    expect(headerEl).toBeTruthy();
  });

  // --- displayName ---

  it('has correct displayName', () => {
    expect(CometChatFlagMessageDialog.Header.displayName).toBe('CometChatFlagMessageDialogHeader');
  });
});
