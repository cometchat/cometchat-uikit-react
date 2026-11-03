/**
 * The public props of <CometChatCallActionBubble />, one case each: the prop is set (or left out) on
 * the real component and the test checks what it changes. Only the SDK is mocked: the logged-in user
 * the bubble reads the call's direction against comes from the SDK.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallActionBubble } from '../CometChatCallActionBubble';
import { buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({ getLoggedinUser: vi.fn() }));

// The real SDK's constants (the kit reads them on import), with only the login mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return { CometChat: Object.assign({}, CometChat, { getLoggedinUser: sdk.getLoggedinUser }) };
});

const me = buildUser({ uid: 'me', name: 'Me' });
const them = buildUser({ uid: 'them', name: 'Them' });

/** A call message in the `call` category, as the SDK delivers it. */
function callMessage(status: string, initiator: ReturnType<typeof buildUser>, type: 'audio' | 'video') {
  return {
    getCategory: () => 'call',
    getType: () => type,
    getStatus: () => status,
    getCallInitiator: () => initiator,
    getCallReceiver: () => (initiator === me ? them : me),
  } as unknown as CometChat.BaseMessage;
}

/** The bubble renders once the logged-in user has resolved. */
const bubble = () => screen.findByRole('status');

beforeEach(() => {
  sdk.getLoggedinUser.mockReset().mockResolvedValue(me);
});

describe('CometChatCallActionBubble props', () => {
  it("message: the bubble's text and icon come from the call's status, type and direction", async () => {
    covers('CometChatCallActionBubble.message', 'set');
    let view = render(<CometChatCallActionBubble message={callMessage('unanswered', them, 'video')} />);
    expect(await bubble()).toHaveTextContent('Missed Call');
    expect(view.container.querySelector('.cometchat-action-bubble__icon')).toHaveClass(
      'cometchat-action-bubble__icon--missed-video',
      'cometchat-action-bubble__icon--error'
    );
    view.unmount();

    view = render(<CometChatCallActionBubble message={callMessage('initiated', me, 'audio')} />);
    expect(await bubble()).toHaveTextContent('Outgoing Call');
    const icon = view.container.querySelector('.cometchat-action-bubble__icon');
    expect(icon).toHaveClass('cometchat-action-bubble__icon--outgoing-audio');
    expect(icon).not.toHaveClass('cometchat-action-bubble__icon--error');
    view.unmount();

    render(<CometChatCallActionBubble message={callMessage('ended', them, 'audio')} />);
    expect(await bubble()).toHaveTextContent('Call Ended');
  });

  it('className is added to the root; by default the root has only its own class', async () => {
    covers('CometChatCallActionBubble.className', 'set', 'default');
    const message = callMessage('ended', me, 'video');
    const { unmount } = render(<CometChatCallActionBubble message={message} className="call-note" />);
    expect(await bubble()).toHaveClass('cometchat-action-bubble', 'call-note');
    unmount();

    render(<CometChatCallActionBubble message={message} />);
    expect((await bubble()).getAttribute('class')).toBe('cometchat-action-bubble');
  });
});
