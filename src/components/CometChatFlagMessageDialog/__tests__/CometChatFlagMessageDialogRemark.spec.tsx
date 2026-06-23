import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatFlagMessageDialog } from '../CometChatFlagMessageDialog';
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
 * Helper: wraps Remark inside Root so context is available.
 */
function renderRemark(
  remarkProps: Partial<React.ComponentProps<typeof CometChatFlagMessageDialog.Remark>> = {}
) {
  return render(
    <CometChatFlagMessageDialog.Root message={mockMessage} isOpen={true} onClose={vi.fn()}>
      <CometChatFlagMessageDialog.Remark {...remarkProps} />
    </CometChatFlagMessageDialog.Root>
  );
}

describe('CometChatFlagMessageDialogRemark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it('renders a textarea', () => {
    renderRemark();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders default localized label (key as fallback)', () => {
    renderRemark();
    expect(screen.getByText('flag_message_remark_label')).toBeInTheDocument();
  });

  it('renders optional indicator text', () => {
    renderRemark();
    expect(screen.getByText('(flag_message_remark_optional)')).toBeInTheDocument();
  });

  it('renders default localized placeholder (key as fallback)', () => {
    renderRemark();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'flag_message_remark_placeholder');
  });

  it('renders custom label', () => {
    renderRemark({ label: 'Additional Details' });
    expect(screen.getByText('Additional Details')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    renderRemark({ placeholder: 'Enter your reason...' });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'Enter your reason...');
  });

  // --- Character counter ---

  it('shows character counter with remaining characters', () => {
    renderRemark({ maxLength: 500 });
    expect(screen.getByText('500 / 500')).toBeInTheDocument();
  });

  it('updates character counter as user types', async () => {
    const user = userEvent.setup();
    renderRemark({ maxLength: 500 });

    // On open, Root moves focus to the dialog container via requestAnimationFrame.
    // Wait for that to settle before typing so it does not steal focus mid-input.
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');

    expect(screen.getByText('495 / 500')).toBeInTheDocument();
  });

  it('shows limit reached message when at max length', async () => {
    const user = userEvent.setup();
    renderRemark({ maxLength: 5 });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');

    expect(screen.getByText('flag_message_character_limit_reached')).toBeInTheDocument();
  });

  it('uses custom maxLength', () => {
    renderRemark({ maxLength: 200 });
    expect(screen.getByText('200 / 200')).toBeInTheDocument();
  });

  // --- Input behavior ---

  it('updates textarea value as user types', async () => {
    const user = userEvent.setup();
    renderRemark();

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test remark');

    expect(textarea).toHaveValue('Test remark');
  });

  it('enforces maxLength on textarea', async () => {
    const user = userEvent.setup();
    renderRemark({ maxLength: 10 });

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    await user.type(textarea, 'This is a very long text that exceeds the limit');

    // The textarea should be truncated to maxLength
    expect(textarea.value.length).toBeLessThanOrEqual(10);
  });

  it('sets maxLength attribute on textarea', () => {
    renderRemark({ maxLength: 300 });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxLength', '300');
  });

  // --- Accessibility ---

  it('textarea has aria-describedby pointing to character count', () => {
    renderRemark();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-describedby', 'remark-character-count');
  });

  it('textarea has associated label via htmlFor', () => {
    renderRemark();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', 'cometchat-flag-message-remark');
    const label = screen.getByText('flag_message_remark_label').closest('label');
    expect(label).toHaveAttribute('for', 'cometchat-flag-message-remark');
  });

  it('textarea has rows attribute', () => {
    renderRemark();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '3');
  });

  // --- Custom className ---

  it('applies custom className to remark container', () => {
    const { container } = renderRemark({ className: 'my-remark' });
    const remarkEl = container.querySelector('.my-remark');
    expect(remarkEl).toBeTruthy();
  });

  // --- displayName ---

  it('has correct displayName', () => {
    expect(CometChatFlagMessageDialog.Remark.displayName).toBe('CometChatFlagMessageDialogRemark');
  });
});
