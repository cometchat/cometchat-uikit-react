import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatFlagMessageDialog } from '../CometChatFlagMessageDialog';
import { buildTextMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const mockReasons = [
  { id: 'r1', name: 'Spam' },
  { id: 'r2', name: 'Harassment' },
  { id: 'r3', name: 'Inappropriate Content' },
];

const { getFlagReasons } = vi.hoisted(() => ({
  getFlagReasons: vi.fn(),
}));

vi.mock('../CometChatFlagMessageDialogManager', () => ({
  getFlagReasons,
}));

const mockMessage = buildTextMessage({ id: 1 }) as unknown as CometChat.BaseMessage;

/**
 * Helper: wraps Reasons inside Root so context is available.
 */
function renderReasons(
  reasonsProps: Partial<React.ComponentProps<typeof CometChatFlagMessageDialog.Reasons>> = {},
  rootProps: Partial<React.ComponentProps<typeof CometChatFlagMessageDialog.Root>> = {}
) {
  return render(
    <CometChatFlagMessageDialog.Root
      message={mockMessage}
      isOpen={true}
      onClose={vi.fn()}
      {...rootProps}
    >
      <CometChatFlagMessageDialog.Reasons {...reasonsProps} />
    </CometChatFlagMessageDialog.Root>
  );
}

describe('CometChatFlagMessageDialogReasons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFlagReasons.mockResolvedValue(mockReasons);
  });

  // --- Loading state ---

  it('shows loading state while reasons are being fetched', () => {
    // Use a promise that never resolves to keep loading state
    getFlagReasons.mockReturnValue(new Promise(() => {}));
    renderReasons();
    expect(screen.getByText('LOADING')).toBeInTheDocument();
  });

  it('sets aria-busy="true" during loading', () => {
    getFlagReasons.mockReturnValue(new Promise(() => {}));
    const { container } = renderReasons();
    const loadingContainer = container.querySelector('[aria-busy="true"]');
    expect(loadingContainer).toBeTruthy();
  });

  // --- Rendering reasons ---

  it('renders all flag reasons as radio buttons after loading', async () => {
    renderReasons();
    await waitFor(() => {
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });
  });

  it('renders reasons inside a radiogroup', async () => {
    renderReasons();
    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
  });

  it('renders reason names as button text (from backend)', async () => {
    renderReasons();
    await waitFor(() => {
      // reason.name is displayed directly from the backend data
      expect(screen.getByText('Spam')).toBeInTheDocument();
      expect(screen.getByText('Harassment')).toBeInTheDocument();
      expect(screen.getByText('Inappropriate Content')).toBeInTheDocument();
    });
  });

  // --- Selection ---

  it('selects a reason when clicked', async () => {
    const user = userEvent.setup();
    renderReasons();

    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    const radios = screen.getAllByRole('radio');
    await user.click(radios[0]!);

    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('deselects previous reason when a new one is selected', async () => {
    const user = userEvent.setup();
    renderReasons();

    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    const radios = screen.getAllByRole('radio');
    await user.click(radios[0]!);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');

    await user.click(radios[1]!);
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('no reason is selected initially', async () => {
    renderReasons();

    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    const radios = screen.getAllByRole('radio');
    radios.forEach(radio => {
      expect(radio).toHaveAttribute('aria-checked', 'false');
    });
  });

  // --- Keyboard navigation ---

  it('navigates reasons with ArrowDown key', async () => {
    renderReasons();

    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    const radiogroup = screen.getByRole('radiogroup');
    const radios = screen.getAllByRole('radio');

    // Focus the radiogroup
    radiogroup.focus();

    // Press ArrowDown to select first reason
    fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');

    // Press ArrowDown again to select second reason
    fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('navigates reasons with ArrowUp key', async () => {
    const user = userEvent.setup();
    renderReasons();

    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    const radiogroup = screen.getByRole('radiogroup');
    const radios = screen.getAllByRole('radio');

    // Select the last reason first
    await user.click(radios[2]!);
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');

    // Press ArrowUp to go to previous
    fireEvent.keyDown(radiogroup, { key: 'ArrowUp' });
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[2]).toHaveAttribute('aria-checked', 'false');
  });

  it('wraps around from last to first with ArrowDown', async () => {
    const user = userEvent.setup();
    renderReasons();

    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    const radiogroup = screen.getByRole('radiogroup');
    const radios = screen.getAllByRole('radio');

    // Select the last reason
    await user.click(radios[2]!);

    // Press ArrowDown should wrap to first
    fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('wraps around from first to last with ArrowUp', async () => {
    const user = userEvent.setup();
    renderReasons();

    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    const radiogroup = screen.getByRole('radiogroup');
    const radios = screen.getAllByRole('radio');

    // Select the first reason
    await user.click(radios[0]!);

    // Press ArrowUp should wrap to last
    fireEvent.keyDown(radiogroup, { key: 'ArrowUp' });
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
  });

  // --- Custom children ---

  it('renders custom children instead of default reason list', () => {
    renderReasons({
      children: <div data-testid="custom-reasons">Custom reasons</div>,
    });
    expect(screen.getByTestId('custom-reasons')).toBeInTheDocument();
    // No radiogroup should be present
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  // --- Custom className ---

  it('applies custom className to reasons container', async () => {
    const { container } = renderReasons({ className: 'my-reasons' });
    await waitFor(() => {
      const reasonsEl = container.querySelector('.my-reasons');
      expect(reasonsEl).toBeTruthy();
    });
  });

  // --- Error handling ---

  it('calls onError when fetching reasons fails', async () => {
    const error = new Error('Network error');
    getFlagReasons.mockRejectedValue(error);
    const onError = vi.fn();

    renderReasons({}, { onError });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  // --- Tabindex ---

  it('sets tabIndex=0 on first reason when none selected', async () => {
    renderReasons();

    await waitFor(() => {
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('tabindex', '0');
      expect(radios[1]).toHaveAttribute('tabindex', '-1');
      expect(radios[2]).toHaveAttribute('tabindex', '-1');
    });
  });

  it('sets tabIndex=0 on selected reason', async () => {
    const user = userEvent.setup();
    renderReasons();

    await waitFor(() => {
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    const radios = screen.getAllByRole('radio');
    await user.click(radios[1]!);

    expect(radios[1]).toHaveAttribute('tabindex', '0');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');
    expect(radios[2]).toHaveAttribute('tabindex', '-1');
  });

  // --- displayName ---

  it('has correct displayName', () => {
    expect(CometChatFlagMessageDialog.Reasons.displayName).toBe(
      'CometChatFlagMessageDialogReasons'
    );
  });
});
