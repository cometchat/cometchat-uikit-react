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
  getFlagReasons: vi.fn().mockResolvedValue([
    { id: 'r1', name: 'Spam' },
    { id: 'r2', name: 'Harassment' },
  ]),
}));

const mockMessage = buildTextMessage({ id: 42 }) as unknown as CometChat.BaseMessage;

/**
 * Helper: wraps Actions inside Root so context is available.
 * Includes Reasons so we can select a reason to enable the submit button.
 */
function renderActions(
  actionsProps: Partial<React.ComponentProps<typeof CometChatFlagMessageDialog.Actions>> = {},
  rootProps: Partial<React.ComponentProps<typeof CometChatFlagMessageDialog.Root>> = {}
) {
  const onClose = rootProps.onClose ?? vi.fn();
  return {
    ...render(
      <CometChatFlagMessageDialog.Root
        message={mockMessage}
        isOpen={true}
        onClose={onClose}
        {...rootProps}
      >
        <CometChatFlagMessageDialog.Reasons />
        <CometChatFlagMessageDialog.Actions {...actionsProps} />
      </CometChatFlagMessageDialog.Root>
    ),
    onClose: onClose as ReturnType<typeof vi.fn>,
  };
}

describe('CometChatFlagMessageDialogActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it('renders cancel and submit buttons', async () => {
    renderActions();
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      // At least cancel + submit (reasons may also have buttons)
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders default localized button text (keys as fallback)', async () => {
    renderActions();
    await waitFor(() => {
      expect(screen.getByText('flag_message_confirm_no')).toBeInTheDocument();
      expect(screen.getByText('flag_message_confirm_yes')).toBeInTheDocument();
    });
  });

  it('renders custom cancel and submit text', async () => {
    renderActions({ cancelText: 'Dismiss', submitText: 'Report Now' });
    await waitFor(() => {
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
      expect(screen.getByText('Report Now')).toBeInTheDocument();
    });
  });

  it('renders custom children instead of default buttons', async () => {
    renderActions({
      children: <button>Custom Action</button>,
    });
    await waitFor(() => {
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
      // Default buttons should not be present
      expect(screen.queryByText('flag_message_confirm_no')).not.toBeInTheDocument();
    });
  });

  it('applies custom className to actions container', async () => {
    const { container } = renderActions({ className: 'my-actions' });
    await waitFor(() => {
      const actionsEl = container.querySelector('.my-actions');
      expect(actionsEl).toBeTruthy();
    });
  });

  // --- Submit button disabled state ---

  it('submit button is disabled when no reason is selected', async () => {
    renderActions();
    await waitFor(() => {
      const submitBtn = screen.getByText('flag_message_confirm_yes').closest('button');
      expect(submitBtn).toBeDisabled();
    });
  });

  it('submit button is enabled after selecting a reason', async () => {
    const user = userEvent.setup();
    renderActions();

    // Wait for reasons to load
    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    // Select a reason
    const reasonButtons = screen.getAllByRole('radio');
    await user.click(reasonButtons[0]!);

    // Submit should now be enabled
    const submitBtn = screen.getByText('flag_message_confirm_yes').closest('button');
    expect(submitBtn).not.toBeDisabled();
  });

  // --- Cancel behavior ---

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderActions();

    await waitFor(() => {
      expect(screen.getByText('flag_message_confirm_no')).toBeInTheDocument();
    });

    await user.click(screen.getByText('flag_message_confirm_no'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  // --- Submit behavior ---

  it('calls onSubmit when submit button is clicked with a reason selected', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    renderActions({}, { onSubmit });

    // Wait for reasons to load
    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    // Select a reason
    const reasonButtons = screen.getAllByRole('radio');
    await user.click(reasonButtons[0]!);

    // Click submit
    await user.click(screen.getByText('flag_message_confirm_yes'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith('42', 'r1', undefined);
    });
  });

  it('shows loading state during async submit', async () => {
    let resolvePromise: (value: boolean) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<boolean>(resolve => {
          resolvePromise = resolve;
        })
    );
    const user = userEvent.setup();
    renderActions({}, { onSubmit });

    // Wait for reasons to load and select one
    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
    const reasonButtons = screen.getAllByRole('radio');
    await user.click(reasonButtons[0]!);

    // Click submit
    await user.click(screen.getByText('flag_message_confirm_yes'));

    // The submit button should be in loading state
    await waitFor(() => {
      const submitBtn = screen.getByText('flag_message_confirm_yes').closest('button');
      expect(submitBtn).toHaveAttribute('aria-busy', 'true');
      expect(submitBtn).toBeDisabled();
    });

    // Resolve the promise to clean up
    resolvePromise!(true);
  });

  // --- displayName ---

  it('has correct displayName', () => {
    expect(CometChatFlagMessageDialog.Actions.displayName).toBe(
      'CometChatFlagMessageDialogActions'
    );
  });
});
