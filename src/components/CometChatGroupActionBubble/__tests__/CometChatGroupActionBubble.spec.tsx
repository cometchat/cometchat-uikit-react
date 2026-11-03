import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupActionBubble } from '../CometChatGroupActionBubble';

/** An action message in the shape getActionMessageText reads. */
function action(kind: string, by: string, on: string): CometChat.BaseMessage {
  return { action: kind, actionBy: { name: by }, actionOn: { name: on } } as unknown as CometChat.BaseMessage;
}

describe('CometChatGroupActionBubble', () => {
  it('shows who did what, as a sentence', () => {
    render(<CometChatGroupActionBubble message={action('added', 'Alice', 'Bob')} />);
    expect(screen.getByText('Alice added Bob')).toBeInTheDocument();
  });

  it('passes its class name to the bubble', () => {
    const { container } = render(
      <CometChatGroupActionBubble message={action('joined', 'Alice', 'Alice')} className="custom" />
    );
    expect(container.querySelector('.custom')).toHaveTextContent('Alice joined');
  });
});
