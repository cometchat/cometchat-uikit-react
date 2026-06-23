import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCollaborativeWhiteboardBubble } from '../CometChatCollaborativeWhiteboardBubble';

vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({ getLocalizedString: (k: string) => k }),
}));
vi.mock('../../../hooks/useLoggedInUser', () => ({ useLoggedInUser: () => null }));

function boardMessage(url = 'https://example.com/board/xyz'): CometChat.BaseMessage {
  return {
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getMetadata: () => ({ '@injected': { extensions: { whiteboard: { board_url: url } } } }),
  } as unknown as CometChat.BaseMessage;
}

describe('CometChatCollaborativeWhiteboardBubble', () => {
  it('renders the whiteboard title/button (localized keys) and whiteboard variant', () => {
    const { container } = render(
      <CometChatCollaborativeWhiteboardBubble message={boardMessage()} />
    );
    expect(screen.getByText('message_list_collaborative_whiteboard_title')).toBeInTheDocument();
    expect(screen.getByText('message_list_collaborative_whiteboard_open')).toBeInTheDocument();
    expect(
      container.querySelector('.cometchat-collaborative-bubble--whiteboard')
    ).toBeInTheDocument();
  });

  it('derives the outgoing/incoming variant from the alignment prop', () => {
    const { container, rerender } = render(
      <CometChatCollaborativeWhiteboardBubble message={boardMessage()} alignment="right" />
    );
    expect(container.querySelector('.cometchat-collaborative-bubble--outgoing')).toBeTruthy();
    rerender(<CometChatCollaborativeWhiteboardBubble message={boardMessage()} alignment="left" />);
    expect(container.querySelector('.cometchat-collaborative-bubble--incoming')).toBeTruthy();
  });

  it('calls onButtonClick with the extracted URL', () => {
    const onButtonClick = vi.fn();
    render(
      <CometChatCollaborativeWhiteboardBubble
        message={boardMessage('https://board.example/x')}
        onButtonClick={onButtonClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onButtonClick).toHaveBeenCalledWith('https://board.example/x');
  });

  it('disables the button when the message has no URL', () => {
    const empty = {
      getSender: () => ({ getUid: () => 'u1', getName: () => 'A' }),
      getMetadata: () => ({}),
    } as unknown as CometChat.BaseMessage;
    render(<CometChatCollaborativeWhiteboardBubble message={empty} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('respects the disabled prop', () => {
    render(<CometChatCollaborativeWhiteboardBubble message={boardMessage()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
