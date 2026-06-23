import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageHeaderCallButtons } from '../CometChatMessageHeaderCallButtons';
import { CometChatMessageHeaderContext } from '../CometChatMessageHeader.context';
import type { CometChatMessageHeaderContextValue } from '../CometChatMessageHeader.types';

// Mock CometChatCallButtons to verify what props are passed to it
vi.mock('../../CometChatCallButtons/CometChatCallButtons', () => ({
  CometChatCallButtons: (props: Record<string, unknown>) => (
    <div
      data-testid="call-buttons"
      data-user={props.user ? 'true' : 'false'}
      data-group={props.group ? 'true' : 'false'}
    />
  ),
}));

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
    summaryGenerationMessageCount: 1000,
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
  it('renders CometChatCallButtons', () => {
    renderCallButtons();
    expect(screen.getByTestId('call-buttons')).toBeInTheDocument();
  });

  it('passes user from context to CometChatCallButtons', () => {
    const mockUser = { getUid: () => 'u1', getName: () => 'Test User' } as any;
    renderCallButtons({ user: mockUser });
    expect(screen.getByTestId('call-buttons')).toHaveAttribute('data-user', 'true');
  });

  it('passes group from context to CometChatCallButtons', () => {
    const mockGroup = { getGuid: () => 'g1', getName: () => 'Test Group' } as any;
    renderCallButtons({ group: mockGroup });
    expect(screen.getByTestId('call-buttons')).toHaveAttribute('data-group', 'true');
  });

  it('passes undefined when user/group are null in context', () => {
    renderCallButtons({ user: null, group: null });
    expect(screen.getByTestId('call-buttons')).toHaveAttribute('data-user', 'false');
    expect(screen.getByTestId('call-buttons')).toHaveAttribute('data-group', 'false');
  });
});
