import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallButtons } from '../CometChatCallButtons';
import { buildUser } from '../../../testing/mock-builders';

// The hook owns the SDK side (starting and tracking calls); this spec covers what the component
// renders and how its buttons respond.
const hook = vi.hoisted(() => ({
  state: {
    callButtonsDisabled: false,
    showOutgoingCallScreen: false,
    showOngoingCall: false,
    callSessionId: null as string | null,
    isDirectCalling: false,
    isGroupAudioCall: false,
    activeCall: null,
    initiateAudioCall: vi.fn(),
    initiateVideoCall: vi.fn(),
    cancelOutgoingCall: vi.fn(),
    resetCallState: vi.fn(),
  },
}));
vi.mock('../useCometChatCallButtons', () => ({ useCometChatCallButtons: () => hook.state }));

const bob = buildUser({ uid: 'bob', name: 'Bob' }) as unknown as CometChat.User;

describe('CometChatCallButtons', () => {
  beforeEach(() => {
    hook.state.callButtonsDisabled = false;
    hook.state.initiateAudioCall.mockClear();
    hook.state.initiateVideoCall.mockClear();
  });

  it('shows a voice and a video call button', () => {
    render(<CometChatCallButtons user={bob} />);
    expect(screen.getByRole('button', { name: 'Voice call' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Video call' })).toBeEnabled();
  });

  it('starts a voice or video call when clicked', () => {
    render(<CometChatCallButtons user={bob} />);
    fireEvent.click(screen.getByRole('button', { name: 'Voice call' }));
    fireEvent.click(screen.getByRole('button', { name: 'Video call' }));
    expect(hook.state.initiateAudioCall).toHaveBeenCalledTimes(1);
    expect(hook.state.initiateVideoCall).toHaveBeenCalledTimes(1);
  });

  it('hands the click to onVoiceCallClick instead of calling, when given', () => {
    const onVoiceCallClick = vi.fn();
    render(<CometChatCallButtons user={bob} onVoiceCallClick={onVoiceCallClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Voice call' }));
    expect(onVoiceCallClick).toHaveBeenCalledWith(bob);
    expect(hook.state.initiateAudioCall).not.toHaveBeenCalled();
  });

  it('hides a button when asked, and renders nothing with both hidden', () => {
    const { rerender, container } = render(<CometChatCallButtons user={bob} hideVideoCallButton />);
    expect(screen.queryByRole('button', { name: 'Video call' })).toBeNull();
    rerender(<CometChatCallButtons user={bob} hideVideoCallButton hideVoiceCallButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables both buttons while a call is in progress', () => {
    hook.state.callButtonsDisabled = true;
    render(<CometChatCallButtons user={bob} />);
    expect(screen.getByRole('button', { name: 'Voice call' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Video call' })).toBeDisabled();
  });
});
