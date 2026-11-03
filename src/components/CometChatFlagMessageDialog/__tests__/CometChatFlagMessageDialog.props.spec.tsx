/**
 * The public props of <CometChatFlagMessageDialog />, one case each: the prop is set (or left out) on
 * the real component and the test checks what it changes. Only the SDK is mocked: it serves the
 * report reasons.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatFlagMessageDialog } from '../CometChatFlagMessageDialog';
import { buildTextMessage } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  getFlagReasons: vi.fn(),
  flagMessage: vi.fn(),
}));

// The real SDK's classes and constants, with the calls the dialog can make mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const actual = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>(
    '@cometchat/chat-sdk-javascript'
  );
  return {
    ...actual,
    CometChat: Object.assign({}, actual.CometChat, {
      getFlagReasons: sdk.getFlagReasons,
      flagMessage: sdk.flagMessage,
    }),
  };
});

const reasons = [
  { id: 'spam', name: 'Spam' },
  { id: 'harassment', name: 'Harassment' },
];

const message = buildTextMessage({ id: 42, text: 'Buy followers now' }) as unknown as CometChat.BaseMessage;

type Props = React.ComponentProps<typeof CometChatFlagMessageDialog>;
function show(props: Partial<Props> = {}) {
  return render(<CometChatFlagMessageDialog message={message} isOpen {...props} />);
}

const dialog = () => screen.queryByRole('dialog', { name: 'Report a Message' });
const reason = (name: string) => screen.findByRole('radio', { name });
const reportButton = () => screen.getByRole('button', { name: 'Report' });
const backdrop = () => document.querySelector('.cometchat-flag-message-dialog__backdrop');

beforeEach(() => {
  sdk.getFlagReasons.mockReset().mockResolvedValue(reasons);
  sdk.flagMessage.mockReset().mockResolvedValue({});
});

describe('CometChatFlagMessageDialog props', () => {
  it('isOpen shows the dialog with the reasons to pick from; false or left out, nothing is shown', async () => {
    covers('CometChatFlagMessageDialog.isOpen', 'true', 'false', 'default');
    const view = show({ isOpen: true });
    expect(dialog()).toBeInTheDocument();
    expect(await reason('Spam')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Harassment' })).toBeInTheDocument();
    view.unmount();

    for (const props of [{ isOpen: false }, {}]) {
      const closed = render(<CometChatFlagMessageDialog message={message} {...props} />);
      expect(dialog()).toBeNull();
      expect(backdrop()).toBeNull();
      closed.unmount();
    }
  });

  it('message is the one reported: its id is what gets submitted', async () => {
    covers('CometChatFlagMessageDialog.message', 'set');
    const onSubmit = vi.fn().mockResolvedValue(true);
    const other = buildTextMessage({ id: 77, text: 'Another message' }) as unknown as CometChat.BaseMessage;
    show({ message: other, onSubmit });
    fireEvent.click(await reason('Harassment'));
    fireEvent.click(reportButton());
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('77', 'harassment', undefined);
    });
  });

  describe('callbacks', () => {
    it('onSubmit gets the message id, the picked reason and the trimmed remark; a success closes the dialog', async () => {
      covers('CometChatFlagMessageDialog.onSubmit', 'called');
      const onSubmit = vi.fn().mockResolvedValue(true);
      const onClose = vi.fn();
      show({ onSubmit, onClose });
      // Nothing to submit until a reason is picked.
      expect(reportButton()).toBeDisabled();
      fireEvent.click(await reason('Spam'));
      fireEvent.change(screen.getByRole('textbox', { name: /Reason/ }), {
        target: { value: '  selling followers  ' },
      });
      fireEvent.click(reportButton());
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith('42', 'spam', 'selling followers');
    });

    it('onSubmit resolving false keeps the dialog open with an error', async () => {
      covers('CometChatFlagMessageDialog.onSubmit', 'called');
      const onSubmit = vi.fn().mockResolvedValue(false);
      const onClose = vi.fn();
      show({ onSubmit, onClose });
      fireEvent.click(await reason('Spam'));
      fireEvent.click(reportButton());
      expect(await screen.findByRole('alert')).toHaveTextContent('Looks like something went wrong');
      expect(onSubmit).toHaveBeenCalledWith('42', 'spam', undefined);
      expect(onClose).not.toHaveBeenCalled();
      expect(dialog()).toBeInTheDocument();
    });

    it('onClose fires from Cancel and from Escape', async () => {
      covers('CometChatFlagMessageDialog.onClose', 'called');
      const onClose = vi.fn();
      show({ onClose });
      await reason('Spam');
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(dialog()!, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('onError gets the error when the reasons cannot be loaded', async () => {
      covers('CometChatFlagMessageDialog.onError', 'called');
      const error = { code: 'ERR_NETWORK', message: 'offline' };
      sdk.getFlagReasons.mockRejectedValue(error);
      const onError = vi.fn();
      show({ onError });
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
    });

    it('onError gets the error when submitting throws, and the dialog shows it failed', async () => {
      covers('CometChatFlagMessageDialog.onError', 'called');
      const error = { code: 'ERR_FLAG', message: 'not allowed' };
      const onError = vi.fn();
      const onClose = vi.fn();
      show({ onError, onClose, onSubmit: vi.fn().mockRejectedValue(error) });
      fireEvent.click(await reason('Spam'));
      fireEvent.click(reportButton());
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
      expect(screen.getByRole('alert')).toHaveTextContent('Looks like something went wrong');
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('display', () => {
    it('closeOnOutsideClick: a press outside the dialog closes it; on by default', async () => {
      covers('CometChatFlagMessageDialog.closeOnOutsideClick', 'true', 'false', 'default');
      for (const [props, closes] of [
        [{ closeOnOutsideClick: true }, true],
        [{ closeOnOutsideClick: false }, false],
        [{}, true],
      ] as const) {
        const onClose = vi.fn();
        const view = show({ onClose, ...props });
        await reason('Spam');
        // A press inside never closes it.
        fireEvent.mouseDown(screen.getByRole('radio', { name: 'Spam' }));
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.mouseDown(document.body);
        expect(onClose).toHaveBeenCalledTimes(closes ? 1 : 0);
        view.unmount();
      }
    });

    it('className is added to the backdrop; by default it has only its own', async () => {
      covers('CometChatFlagMessageDialog.className', 'set', 'default');
      const view = show({ className: 'app-report' });
      await reason('Spam');
      expect(backdrop()).toHaveClass('cometchat-flag-message-dialog__backdrop', 'app-report');
      expect(backdrop()?.contains(dialog())).toBe(true);
      view.unmount();
      show();
      await reason('Spam');
      expect(backdrop()?.className).toBe('cometchat-flag-message-dialog__backdrop');
    });

    it('children replace the default parts with the ones given', async () => {
      covers('CometChatFlagMessageDialog.children', 'custom');
      // By default there is a remark field.
      const view = show();
      await reason('Spam');
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      view.unmount();

      render(
        <CometChatFlagMessageDialog.Root message={message} isOpen>
          <CometChatFlagMessageDialog.Header title="Report this message?" />
          <CometChatFlagMessageDialog.Reasons />
          <CometChatFlagMessageDialog.Actions submitText="Send report" />
        </CometChatFlagMessageDialog.Root>
      );
      expect(await screen.findByRole('dialog', { name: 'Report this message?' })).toBeInTheDocument();
      expect(await reason('Spam')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send report' })).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).toBeNull();
    });
  });
});
