import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageHeaderSubtitle } from '../CometChatMessageHeaderSubtitle';
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
    initiateAudioCall: async () => {},
    initiateVideoCall: async () => {},
    cancelOutgoingCall: async () => {},
    resetCallState: () => {},
    ...overrides,
  };
}

function renderSubtitle(contextOverrides: Partial<CometChatMessageHeaderContextValue> = {}) {
  const contextValue = createContextValue(contextOverrides);
  return render(
    <CometChatMessageHeaderContext.Provider value={contextValue}>
      <CometChatMessageHeaderSubtitle />
    </CometChatMessageHeaderContext.Provider>
  );
}

describe('CometChatMessageHeaderSubtitle', () => {
  describe('User conversation', () => {
    it('shows "Online" for online user', () => {
      renderSubtitle({
        isUserConversation: true,
        userStatus: 'online',
      });
      expect(screen.getByText('message_header_online')).toBeInTheDocument();
    });

    it('shows "Last seen" for offline user with lastActiveAt', () => {
      const oneHourAgo = Date.now() - 3600000;
      renderSubtitle({
        isUserConversation: true,
        userStatus: 'offline',
        lastActiveAt: oneHourAgo,
      });
      expect(screen.getByText('Last seen')).toBeInTheDocument();
    });

    it('shows nothing for offline user without lastActiveAt', () => {
      const { container } = renderSubtitle({
        isUserConversation: true,
        userStatus: 'offline',
        lastActiveAt: null,
      });
      const wrapper = container.querySelector('[class*="subtitle-wrapper"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent).toBe('');
    });

    it('shows nothing when hideUserStatus is true', () => {
      const { container } = renderSubtitle({
        isUserConversation: true,
        userStatus: 'online',
        hideUserStatus: true,
      });
      const wrapper = container.querySelector('[class*="subtitle-wrapper"]');
      expect(wrapper).toBeInTheDocument();
      // Should not show "Online"
      expect(screen.queryByText('message_header_online')).not.toBeInTheDocument();
    });
  });

  describe('Group conversation', () => {
    it('shows member count with "Members" for plural', () => {
      renderSubtitle({
        isGroupConversation: true,
        groupMemberCount: 12,
      });
      expect(screen.getByText(/12/)).toBeInTheDocument();
      expect(screen.getByText(/message_header_members/)).toBeInTheDocument();
    });

    it('shows "Member" for singular', () => {
      renderSubtitle({
        isGroupConversation: true,
        groupMemberCount: 1,
      });
      expect(screen.getByText(/1/)).toBeInTheDocument();
      expect(screen.getByText(/message_header_member$/)).toBeInTheDocument();
    });

    it('shows "0 Members" for empty group', () => {
      renderSubtitle({
        isGroupConversation: true,
        groupMemberCount: 0,
      });
      expect(screen.getByText(/0/)).toBeInTheDocument();
      expect(screen.getByText(/message_header_members/)).toBeInTheDocument();
    });
  });

  describe('Typing indicator', () => {
    it('shows typing indicator for user conversation', () => {
      renderSubtitle({
        isUserConversation: true,
        isTyping: true,
        typingText: 'typing',
      });
      expect(screen.getByText('typing')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows typing indicator for group with single user', () => {
      renderSubtitle({
        isGroupConversation: true,
        isTyping: true,
        typingText: 'Alice is typing',
      });
      expect(screen.getByText('Alice is typing')).toBeInTheDocument();
    });

    it('shows typing indicator for group with two users', () => {
      renderSubtitle({
        isGroupConversation: true,
        isTyping: true,
        typingText: 'Alice and Bob are typing',
      });
      expect(screen.getByText('Alice and Bob are typing')).toBeInTheDocument();
    });

    it('shows typing indicator for group with multiple users', () => {
      renderSubtitle({
        isGroupConversation: true,
        isTyping: true,
        typingText: 'Alice and 2 others are typing',
      });
      expect(screen.getByText('Alice and 2 others are typing')).toBeInTheDocument();
    });

    it('has aria-live="polite" when typing', () => {
      const { container } = renderSubtitle({
        isUserConversation: true,
        isTyping: true,
        typingText: 'typing',
      });
      const wrapper = container.querySelector('[aria-live="polite"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('renders animated typing dots', () => {
      const { container } = renderSubtitle({
        isUserConversation: true,
        isTyping: true,
        typingText: 'typing',
      });
      // The dots container has 3 child dot spans
      const dotsContainer = container.querySelector('[class*="typing-dots"]');
      expect(dotsContainer).toBeInTheDocument();
      const dots = dotsContainer?.children;
      expect(dots).toHaveLength(3);
    });

    it('typing indicator takes priority over status', () => {
      renderSubtitle({
        isUserConversation: true,
        userStatus: 'online',
        isTyping: true,
        typingText: 'typing',
      });
      expect(screen.getByText('typing')).toBeInTheDocument();
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
    });

    it('typing indicator takes priority over member count', () => {
      renderSubtitle({
        isGroupConversation: true,
        groupMemberCount: 12,
        isTyping: true,
        typingText: 'Alice is typing',
      });
      expect(screen.getByText('Alice is typing')).toBeInTheDocument();
      expect(screen.queryByText(/12/)).not.toBeInTheDocument();
    });
  });

  describe('No entity', () => {
    it('renders empty wrapper when no user or group', () => {
      const { container } = renderSubtitle({
        isUserConversation: false,
        isGroupConversation: false,
      });
      const wrapper = container.querySelector('[class*="subtitle-wrapper"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent).toBe('');
    });
  });
});
