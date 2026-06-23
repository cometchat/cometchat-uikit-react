import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCollaborativeDocumentBubble } from '../CometChatCollaborativeDocumentBubble';

// Stub locale (return the key) and the logged-in user hook (avoid SDK calls).
vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({ getLocalizedString: (k: string) => k }),
}));
vi.mock('../../../hooks/useLoggedInUser', () => ({ useLoggedInUser: () => null }));

function docMessage(url = 'https://example.com/doc/abc'): CometChat.BaseMessage {
  return {
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getMetadata: () => ({ '@injected': { extensions: { document: { document_url: url } } } }),
  } as unknown as CometChat.BaseMessage;
}

describe('CometChatCollaborativeDocumentBubble', () => {
  it('renders the document title/subtitle/button (localized keys) and document variant', () => {
    const { container } = render(<CometChatCollaborativeDocumentBubble message={docMessage()} />);
    expect(screen.getByText('message_list_collaborative_document_title')).toBeInTheDocument();
    expect(screen.getByText('message_list_collaborative_document_open')).toBeInTheDocument();
    expect(
      container.querySelector('.cometchat-collaborative-bubble--document')
    ).toBeInTheDocument();
  });

  it('derives the outgoing/incoming variant from the alignment prop', () => {
    const { container, rerender } = render(
      <CometChatCollaborativeDocumentBubble message={docMessage()} alignment="right" />
    );
    expect(container.querySelector('.cometchat-collaborative-bubble--outgoing')).toBeTruthy();
    rerender(<CometChatCollaborativeDocumentBubble message={docMessage()} alignment="left" />);
    expect(container.querySelector('.cometchat-collaborative-bubble--incoming')).toBeTruthy();
  });

  it('calls onButtonClick with the extracted URL', () => {
    const onButtonClick = vi.fn();
    render(
      <CometChatCollaborativeDocumentBubble
        message={docMessage('https://doc.example/x')}
        onButtonClick={onButtonClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onButtonClick).toHaveBeenCalledWith('https://doc.example/x');
  });

  it('disables the button when the message has no URL', () => {
    const empty = {
      getSender: () => ({ getUid: () => 'u1', getName: () => 'A' }),
      getMetadata: () => ({}),
    } as unknown as CometChat.BaseMessage;
    render(<CometChatCollaborativeDocumentBubble message={empty} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('respects the disabled prop', () => {
    render(<CometChatCollaborativeDocumentBubble message={docMessage()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
