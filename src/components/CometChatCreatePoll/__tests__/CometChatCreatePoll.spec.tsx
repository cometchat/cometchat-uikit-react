import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCreatePoll } from '../CometChatCreatePoll';

describe('CometChatCreatePoll', () => {
  it('renders the dialog with title', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Poll')).toBeInTheDocument();
  });

  it('renders question input and 2 default option inputs', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    expect(screen.getByPlaceholderText('Ask question')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Add').length).toBe(2);
  });

  it('create button is disabled initially', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    expect(screen.getByText('Create')).toBeDisabled();
  });

  it('create button enables when question and 2 options filled', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Ask question'), { target: { value: 'Q?' } });
    const opts = screen.getAllByPlaceholderText('Add');
    fireEvent.change(opts[0]!, { target: { value: 'A' } });
    fireEvent.change(opts[1]!, { target: { value: 'B' } });
    expect(screen.getByText('Create')).toBeEnabled();
  });

  it('can add an option', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Add Option/));
    expect(screen.getAllByPlaceholderText('Add').length).toBe(3);
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<CometChatCreatePoll onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders custom title', () => {
    render(<CometChatCreatePoll title="My Survey" onClose={() => {}} />);
    expect(screen.getByText('My Survey')).toBeInTheDocument();
  });

  it('respects defaultAnswers prop', () => {
    render(<CometChatCreatePoll defaultAnswers={4} onClose={() => {}} />);
    expect(screen.getAllByPlaceholderText('Add').length).toBe(4);
  });

  describe('quoting a message', () => {
    const user = { getUid: () => 'uid-2' } as unknown as CometChat.User;

    async function createPoll(replyToMessage?: CometChat.BaseMessage) {
      const callExtension = vi
        .spyOn(CometChat, 'callExtension')
        .mockResolvedValue({ success: true });
      const onPollCreated = vi.fn();
      render(
        <CometChatCreatePoll
          user={user}
          onPollCreated={onPollCreated}
          {...(replyToMessage ? { replyToMessage } : {})}
        />
      );
      fireEvent.change(screen.getByPlaceholderText('Ask question'), { target: { value: 'Q?' } });
      const opts = screen.getAllByPlaceholderText('Add');
      fireEvent.change(opts[0]!, { target: { value: 'A' } });
      fireEvent.change(opts[1]!, { target: { value: 'B' } });
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => expect(onPollCreated).toHaveBeenCalled());
      const payload = callExtension.mock.calls[0]?.[3];
      callExtension.mockRestore();
      return payload;
    }

    it('sends quotedMessageId when replying', async () => {
      const payload = await createPoll({ getId: () => 7 } as unknown as CometChat.BaseMessage);

      expect(payload).toMatchObject({ quotedMessageId: 7 });
    });

    it('sends no quotedMessageId otherwise', async () => {
      const payload = await createPoll();

      expect(payload).not.toHaveProperty('quotedMessageId');
    });
  });
});
