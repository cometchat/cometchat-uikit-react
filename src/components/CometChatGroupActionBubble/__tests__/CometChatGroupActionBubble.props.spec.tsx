/**
 * The public props of <CometChatGroupActionBubble />, one case each: the prop is set (or left out) on
 * the real component and the test checks what it changes. Nothing needs mocking: the bubble makes no
 * SDK calls, and without a provider it speaks English.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupActionBubble } from '../CometChatGroupActionBubble';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';
import { covers } from '../../../testing/covers';

const A = CometChatUIKitConstants.groupMemberAction;

/** A group action message with the fields the SDK's CometChat.Action carries. */
function action(kind: string, by: string, on: string, extra: Record<string, unknown> = {}) {
  return { action: kind, actionBy: { name: by }, actionOn: { name: on }, ...extra } as unknown as CometChat.BaseMessage;
}

describe('CometChatGroupActionBubble props', () => {
  it('message is turned into the sentence the bubble shows and announces', () => {
    covers('CometChatGroupActionBubble.message', 'set');
    const { container, rerender } = render(<CometChatGroupActionBubble message={action(A.KICKED, 'Alice', 'Bob')} />);
    expect(screen.getByRole('status', { name: 'Alice kicked Bob' })).toHaveTextContent('Alice kicked Bob');

    rerender(
      <CometChatGroupActionBubble
        message={action(A.SCOPE_CHANGE, 'Alice', 'Bob', { data: { extras: { scope: { new: 'admin' } } } })}
      />
    );
    expect(screen.getByRole('status', { name: 'Alice made Bob Admin' })).toHaveTextContent('Alice made Bob Admin');

    rerender(<CometChatGroupActionBubble message={action(A.LEFT, 'Carol', 'Carol')} />);
    expect(screen.getByRole('status', { name: 'Carol left' })).toHaveTextContent('Carol left');

    // A message that isn't a group action has nothing to say, so there's no bubble.
    rerender(<CometChatGroupActionBubble message={{} as unknown as CometChat.BaseMessage} />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('className is added to the bubble; by default it has only its own class', () => {
    covers('CometChatGroupActionBubble.className', 'set', 'default');
    const joined = action(A.JOINED, 'Alice', 'Alice');
    const { rerender } = render(<CometChatGroupActionBubble message={joined} className="my-action" />);
    expect(screen.getByRole('status', { name: 'Alice joined' })).toHaveClass('cometchat-action-bubble', 'my-action');

    rerender(<CometChatGroupActionBubble message={joined} />);
    expect(screen.getByRole('status', { name: 'Alice joined' }).className).toBe('cometchat-action-bubble');
  });
});
