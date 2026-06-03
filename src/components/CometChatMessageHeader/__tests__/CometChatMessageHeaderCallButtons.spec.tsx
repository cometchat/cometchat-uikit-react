import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageHeaderCallButtons } from '../CometChatMessageHeaderCallButtons';
import { CometChatMessageHeaderContext } from '../CometChatMessageHeader.context';
import type { CometChatMessageHeaderContextValue } from '../CometChatMessageHeader.types';

function createContextValue(
  overrides: Partial<CometChatMessageHeaderContextValue> = {}
): CometChatMessageHeaderContextValue {
  return {
    user: null,
    group: null,
    userStatus: 'offline',
    lastActiveAt: null,
    isTyping: false,
    typingText: '',
    groupMemberCount: 0,
    hideUserStatus: false,
    displayName: '',
    avatarImage: '',
    avatarName: '',
    isUserConversation: false,
    isGroupConversation: false,
    callButtonsDisabled: false,
    showOutgoingCallScreen: false,
    showOngoingCall: false,
    callSessionId: '',
    isDirectCalling: false,
    isGroupAudioCall: false,
    activeCall: null,
    initiateAudioCall: vi.fn().mockResolvedValue(undefined),
    initiateVideoCall: vi.fn().mockResolvedValue(undefined),
    cancelOutgoingCall: vi.fn().mockResolvedValue(undefined),
    resetCallState: vi.fn(),
    ...overrides,
  };
}

function renderCallButtons(contextOverrides: Partial<CometChatMessageHeaderContextValue> = {}) {
  const contextValue = createContextValue(contextOverrides);
  return {
    contextValue,
    ...render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        <CometChatMessageHeaderCallButtons />
      </CometChatMessageHeaderContext.Provider>
    ),
  };
}

describe('CometChatMessageHeaderCallButtons', () => {
  it('renders voice and video call buttons', () => {
    renderCallButtons();
    expect(screen.getByRole('button', { name: 'Voice call' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Video call' })).toBeInTheDocument();
  });

  it('voice call button has correct aria-label', () => {
    renderCallButtons();
    const voiceBtn = screen.getByRole('button', { name: 'Voice call' });
    expect(voiceBtn).toHaveAttribute('aria-label', 'Voice call');
  });

  it('video call button has correct aria-label', () => {
    renderCallButtons();
    const videoBtn = screen.getByRole('button', { name: 'Video call' });
    expect(videoBtn).toHaveAttribute('aria-label', 'Video call');
  });

  it('calls initiateAudioCall when voice button is clicked', () => {
    const { contextValue } = renderCallButtons();
    const voiceBtn = screen.getByRole('button', { name: 'Voice call' });
    fireEvent.click(voiceBtn);
    expect(contextValue.initiateAudioCall).toHaveBeenCalledTimes(1);
  });

  it('calls initiateVideoCall when video button is clicked', () => {
    const { contextValue } = renderCallButtons();
    const videoBtn = screen.getByRole('button', { name: 'Video call' });
    fireEvent.click(videoBtn);
    expect(contextValue.initiateVideoCall).toHaveBeenCalledTimes(1);
  });

  it('calls onVoiceCallClick override when provided', () => {
    const onVoiceCallClick = vi.fn();
    const mockUser = { getUid: () => 'u1' } as any;
    renderCallButtons({ user: mockUser, onVoiceCallClick });
    const voiceBtn = screen.getByRole('button', { name: 'Voice call' });
    fireEvent.click(voiceBtn);
    expect(onVoiceCallClick).toHaveBeenCalledWith(mockUser);
  });

  it('calls onVideoCallClick override when provided', () => {
    const onVideoCallClick = vi.fn();
    const mockUser = { getUid: () => 'u1' } as any;
    renderCallButtons({ user: mockUser, onVideoCallClick });
    const videoBtn = screen.getByRole('button', { name: 'Video call' });
    fireEvent.click(videoBtn);
    expect(onVideoCallClick).toHaveBeenCalledWith(mockUser);
  });

  it('disables buttons when callButtonsDisabled is true', () => {
    renderCallButtons({ callButtonsDisabled: true });
    const voiceBtn = screen.getByRole('button', { name: 'Voice call' });
    const videoBtn = screen.getByRole('button', { name: 'Video call' });
    expect(voiceBtn).toBeDisabled();
    expect(videoBtn).toBeDisabled();
  });

  it('does not call initiateAudioCall when disabled', () => {
    const { contextValue } = renderCallButtons({ callButtonsDisabled: true });
    const voiceBtn = screen.getByRole('button', { name: 'Voice call' });
    fireEvent.click(voiceBtn);
    expect(contextValue.initiateAudioCall).not.toHaveBeenCalled();
  });

  it('does not call initiateVideoCall when disabled', () => {
    const { contextValue } = renderCallButtons({ callButtonsDisabled: true });
    const videoBtn = screen.getByRole('button', { name: 'Video call' });
    fireEvent.click(videoBtn);
    expect(contextValue.initiateVideoCall).not.toHaveBeenCalled();
  });

  it('voice button responds to Enter key', () => {
    const { contextValue } = renderCallButtons();
    const voiceBtn = screen.getByRole('button', { name: 'Voice call' });
    fireEvent.keyDown(voiceBtn, { key: 'Enter' });
    expect(contextValue.initiateAudioCall).toHaveBeenCalled();
  });

  it('video button responds to Space key', () => {
    const { contextValue } = renderCallButtons();
    const videoBtn = screen.getByRole('button', { name: 'Video call' });
    fireEvent.keyDown(videoBtn, { key: ' ' });
    expect(contextValue.initiateVideoCall).toHaveBeenCalled();
  });

  it('stops click propagation to prevent triggering parent onItemClick', () => {
    const parentClick = vi.fn();
    const contextValue = createContextValue();
    render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <div onClick={parentClick}>
          <CometChatMessageHeaderCallButtons />
        </div>
      </CometChatMessageHeaderContext.Provider>
    );
    const voiceBtn = screen.getByRole('button', { name: 'Voice call' });
    fireEvent.click(voiceBtn);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
