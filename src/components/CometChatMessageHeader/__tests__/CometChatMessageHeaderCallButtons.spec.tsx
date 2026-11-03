import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageHeaderCallButtons } from '../CometChatMessageHeaderCallButtons';
import { CometChatMessageHeaderContext } from '../CometChatMessageHeader.context';
import type { CometChatMessageHeaderContextValue } from '../CometChatMessageHeader.types';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import type { UIKitSettings } from '../../../CometChatUIKit/UIKitSettings';

const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

// Mock CometChatCallButtons to verify what props are passed to it
vi.mock('../../CometChatCallButtons/CometChatCallButtons', () => ({
  CometChatCallButtons: (props: Record<string, unknown>) => {
    received.props = props;
    return (
      <div
        data-testid="call-buttons"
        data-user={props.user ? 'true' : 'false'}
        data-group={props.group ? 'true' : 'false'}
      />
    );
  },
}));

function callingEnabled(enabled: boolean) {
  vi.spyOn(CometChatUIKit, 'getSettings').mockReturnValue({
    isCallingEnabled: () => enabled,
  } as unknown as UIKitSettings);
}

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
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
    ...overrides,
  };
}

function renderCallButtons(
  contextOverrides: Partial<CometChatMessageHeaderContextValue> = {},
  props: React.ComponentProps<typeof CometChatMessageHeaderCallButtons> = {}
) {
  const contextValue = createContextValue(contextOverrides);
  return {
    contextValue,
    ...render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        <CometChatMessageHeaderCallButtons {...props} />
      </CometChatMessageHeaderContext.Provider>
    ),
  };
}

describe('CometChatMessageHeaderCallButtons', () => {
  beforeEach(() => {
    received.props = {};
    callingEnabled(true);
  });

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

  it('renders nothing when calling is not enabled', () => {
    callingEnabled(false);
    renderCallButtons();
    expect(screen.queryByTestId('call-buttons')).toBeNull();
  });

  it('renders nothing when the header hides both buttons', () => {
    renderCallButtons({ hideVoiceCallButton: true, hideVideoCallButton: true });
    expect(screen.queryByTestId('call-buttons')).toBeNull();
  });

  it("follows the header's call props when placed on its own", () => {
    const onVoiceCallClick = vi.fn();
    const onVideoCallClick = vi.fn();
    const onError = vi.fn();
    const callSettingsBuilder = { tag: 'settings' };
    renderCallButtons({
      hideVideoCallButton: true,
      onVoiceCallClick,
      onVideoCallClick,
      onError,
      callSettingsBuilder,
    });
    expect(received.props).toMatchObject({
      hideVoiceCallButton: false,
      hideVideoCallButton: true,
      onVoiceCallClick,
      onVideoCallClick,
      onError,
      callSettingsBuilder,
    });
  });

  it("its own props win over the header's", () => {
    const fromHeader = vi.fn();
    const own = vi.fn();
    renderCallButtons(
      { hideVideoCallButton: true, onVoiceCallClick: fromHeader },
      { hideVideoCallButton: false, hideVoiceCallButton: true, onVoiceCallClick: own }
    );
    expect(received.props).toMatchObject({
      hideVoiceCallButton: true,
      hideVideoCallButton: false,
      onVoiceCallClick: own,
    });
  });
});
