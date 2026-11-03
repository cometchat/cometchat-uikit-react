import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallActionBubble } from '../CometChatCallActionBubble';
import { buildUser } from '../../../testing/mock-builders';

vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => buildUser({ uid: 'me', name: 'Me' }),
}));

function call(status: string, initiatorUid: string, type = 'audio'): CometChat.Call {
  return {
    getStatus: () => status,
    getType: () => type,
    getCallInitiator: () => buildUser({ uid: initiatorUid }),
    getCallReceiver: () => buildUser({ uid: initiatorUid === 'me' ? 'them' : 'me' }),
  } as unknown as CometChat.Call;
}

describe('CometChatCallActionBubble', () => {
  it('says the call ended, with the ended-call icon', () => {
    const { container } = render(<CometChatCallActionBubble message={call('ended', 'me')} />);
    expect(screen.getByText('Call Ended')).toBeInTheDocument();
    expect(container.querySelector('.cometchat-action-bubble__icon--call-ended')).not.toBeNull();
  });

  it('marks an unanswered incoming video call as missed', () => {
    const { container } = render(<CometChatCallActionBubble message={call('unanswered', 'them', 'video')} />);
    expect(screen.getByText('Missed Call')).toBeInTheDocument();
    expect(container.querySelector('.cometchat-action-bubble__icon--missed-video')).not.toBeNull();
  });

  it('describes my own unanswered call from my side', () => {
    render(<CometChatCallActionBubble message={call('unanswered', 'me')} />);
    expect(screen.getByText('Unanswered Call')).toBeInTheDocument();
  });
});
