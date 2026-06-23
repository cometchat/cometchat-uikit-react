import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallBubble } from '../CometChatCallBubble';
import { buildUser } from '../../../testing/mock-builders';

// Localization returns the key, except dateLocaleLanguage which drives Intl formatting.
vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
    dateLocaleLanguage: 'en-US',
  }),
}));

// Logged-in user resolves to "me" so a message sent by "me" defaults to "outgoing".
vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => buildUser({ uid: 'me', name: 'Me' }),
}));

/**
 * Build a meeting CustomMessage. The bubble self-extracts call type / session id
 * from getData().customData and the timestamp from getSentAt().
 */
function buildMeetingMessage(
  options: {
    sessionID?: string;
    callType?: 'audio' | 'video';
    senderUid?: string;
    sentAt?: number;
    noData?: boolean;
  } = {}
): CometChat.CustomMessage {
  const sender = buildUser({ uid: options.senderUid ?? 'me', name: 'Me' });
  const data = options.noData
    ? undefined
    : {
        customData: {
          sessionID: options.sessionID ?? 'session-123',
          callType: options.callType ?? 'video',
        },
      };
  return {
    getId: () => 1,
    getSender: () => sender,
    getReceiverType: () => 'group',
    getReceiverId: () => 'group-1',
    getType: () => 'meeting',
    getCategory: () => 'custom',
    getSentAt: () => options.sentAt ?? 0,
    getData: () => data,
  } as unknown as CometChat.CustomMessage;
}

describe('CometChatCallBubble', () => {
  it('renders the video call title (default call type)', () => {
    render(<CometChatCallBubble message={buildMeetingMessage({ callType: 'video' })} />);
    expect(screen.getByText('message_list_video_call')).toBeInTheDocument();
  });

  it('renders the voice call title for audio calls', () => {
    render(<CometChatCallBubble message={buildMeetingMessage({ callType: 'audio' })} />);
    expect(screen.getByText('message_list_voice_call')).toBeInTheDocument();
  });

  it('defaults to video call when message has no data', () => {
    render(<CometChatCallBubble message={buildMeetingMessage({ noData: true })} />);
    expect(screen.getByText('message_list_video_call')).toBeInTheDocument();
  });

  it('renders the localized Join button', () => {
    render(<CometChatCallBubble message={buildMeetingMessage()} />);
    expect(screen.getByRole('button', { name: 'meeting_join' })).toBeInTheDocument();
  });

  it('renders a formatted subtitle when sentAt is provided', () => {
    const { container } = render(
      <CometChatCallBubble message={buildMeetingMessage({ sentAt: 1700000000 })} />
    );
    const subtitle = container.querySelector('.cometchat-call-bubble__body-content-subtitle');
    expect(subtitle).not.toBeNull();
    expect(subtitle?.textContent?.length).toBeGreaterThan(0);
  });

  it('does not render subtitle when sentAt is zero/absent', () => {
    const { container } = render(
      <CometChatCallBubble message={buildMeetingMessage({ sentAt: 0 })} />
    );
    expect(container.querySelector('.cometchat-call-bubble__body-content-subtitle')).toBeNull();
  });

  it('calls onJoinClick with the extracted sessionId when button is clicked', () => {
    const onJoinClick = vi.fn();
    render(
      <CometChatCallBubble
        message={buildMeetingMessage({ sessionID: 'sess-xyz' })}
        onJoinClick={onJoinClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onJoinClick).toHaveBeenCalledWith('sess-xyz');
  });

  it('passes empty string sessionId when none is present', () => {
    const onJoinClick = vi.fn();
    render(
      <CometChatCallBubble
        message={buildMeetingMessage({ noData: true })}
        onJoinClick={onJoinClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onJoinClick).toHaveBeenCalledWith('');
  });

  it('defaults to outgoing alignment when sender is the logged-in user', () => {
    const { container } = render(
      <CometChatCallBubble message={buildMeetingMessage({ senderUid: 'me' })} />
    );
    expect(container.firstChild).toHaveClass('cometchat-call-bubble-outgoing');
  });

  it('defaults to incoming alignment when sender is another user', () => {
    const { container } = render(
      <CometChatCallBubble message={buildMeetingMessage({ senderUid: 'someone-else' })} />
    );
    expect(container.firstChild).toHaveClass('cometchat-call-bubble-incoming');
  });

  it('respects an explicit "right" alignment override', () => {
    const { container } = render(
      <CometChatCallBubble
        message={buildMeetingMessage({ senderUid: 'someone-else' })}
        alignment="right"
      />
    );
    expect(container.firstChild).toHaveClass('cometchat-call-bubble-outgoing');
  });

  it('respects an explicit "left" alignment override', () => {
    const { container } = render(
      <CometChatCallBubble message={buildMeetingMessage({ senderUid: 'me' })} alignment="left" />
    );
    expect(container.firstChild).toHaveClass('cometchat-call-bubble-incoming');
  });

  it('applies the outgoing-video icon class for an outgoing video call', () => {
    const { container } = render(
      <CometChatCallBubble message={buildMeetingMessage({ callType: 'video' })} alignment="right" />
    );
    const icon = container.querySelector('.cometchat-call-bubble__icon-wrapper-icon');
    expect(icon).toHaveClass('cometchat-call-bubble__icon--outgoing-video');
  });

  it('applies the incoming-audio icon class for an incoming audio call', () => {
    const { container } = render(
      <CometChatCallBubble message={buildMeetingMessage({ callType: 'audio' })} alignment="left" />
    );
    const icon = container.querySelector('.cometchat-call-bubble__icon-wrapper-icon');
    expect(icon).toHaveClass('cometchat-call-bubble__icon--incoming-audio');
  });

  it('icon has aria-hidden="true"', () => {
    const { container } = render(<CometChatCallBubble message={buildMeetingMessage()} />);
    const icon = container.querySelector('.cometchat-call-bubble__icon-wrapper-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies a custom className to the root', () => {
    const { container } = render(
      <CometChatCallBubble message={buildMeetingMessage()} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
