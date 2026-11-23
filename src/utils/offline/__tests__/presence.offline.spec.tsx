/**
 * No presence while the SDK is not connected, offline on only: the header's
 * subtitle, typing and dot, and every avatar status dot. Back on reconnect.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';
import { CometChatAvatarStatusIndicator } from '../../../components/base/CometChatAvatar/CometChatAvatarStatusIndicator';
import { CometChatMessageHeaderSubtitle } from '../../../components/CometChatMessageHeader/CometChatMessageHeaderSubtitle';
import { CometChatMessageHeaderAvatar } from '../../../components/CometChatMessageHeader/CometChatMessageHeaderAvatar';
import { CometChatMessageHeaderContext } from '../../../components/CometChatMessageHeader/CometChatMessageHeader.context';
import type { CometChatMessageHeaderContextValue } from '../../../components/CometChatMessageHeader/CometChatMessageHeader.types';
import { isPresenceSuppressed } from '../presence';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key, language: 'en-us' }),
}));

function context(
  overrides: Partial<CometChatMessageHeaderContextValue>
): CometChatMessageHeaderContextValue {
  return {
    user: null,
    group: null,
    userStatus: 'online',
    lastActiveAt: null,
    isTyping: false,
    typingText: '',
    groupMemberCount: 3,
    hideUserStatus: false,
    displayName: '',
    avatarImage: '',
    avatarName: 'Ann',
    isUserConversation: true,
    isGroupConversation: false,
    summaryGenerationMessageCount: 1000,
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
    ...overrides,
  };
}

function renderHeader(overrides: Partial<CometChatMessageHeaderContextValue> = {}) {
  return render(
    <CometChatMessageHeaderContext.Provider value={context(overrides)}>
      <CometChatMessageHeaderAvatar />
      <CometChatMessageHeaderSubtitle />
    </CometChatMessageHeaderContext.Provider>
  );
}

/** Move the SDK connection and tell the kit's connection listener, as the SDK does. */
function setConnection(fake: OfflineSdkFake, connected: boolean) {
  fake.connected = connected;
  const listener = connectionListeners.get('uikit_react_offline_presence') as Record<
    string,
    () => void
  >;
  act(() => {
    (connected ? listener.onConnected : listener.onDisconnected)?.();
  });
}

// The kit registers one shared connection listener the first time a screen mounts.
const connectionListeners = new Map<string, object>();

describe('U1: no presence while not connected (offline on)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation((id, listener) => {
      connectionListeners.set(id, listener);
    });
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  it('header: Online subtitle and dot go while disconnected and return on reconnect', () => {
    renderHeader();
    expect(screen.getByText('message_header_online')).toBeInTheDocument();
    expect(document.querySelector('.cometchat-message-header__status-indicator')).not.toBeNull();

    setConnection(fake, false);
    expect(screen.queryByText('message_header_online')).toBeNull();
    expect(document.querySelector('.cometchat-message-header__status-indicator')).toBeNull();
    expect(document.querySelector('.cometchat-message-header__subtitle')).toBeNull();

    setConnection(fake, true);
    expect(screen.getByText('message_header_online')).toBeInTheDocument();
    expect(document.querySelector('.cometchat-message-header__status-indicator')).not.toBeNull();
  });

  it('header: a typing indicator is ignored while disconnected', () => {
    fake.connected = false;
    renderHeader({ isTyping: true, typingText: 'typing' });
    expect(screen.queryByText('typing')).toBeNull();
  });

  it('group header keeps its member count while disconnected', () => {
    fake.connected = false;
    renderHeader({ isUserConversation: false, isGroupConversation: true, groupMemberCount: 3 });
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('list status dot (avatar indicator) hides while disconnected and returns on reconnect', () => {
    const { container } = render(<CometChatAvatarStatusIndicator status="online" />);
    expect(container.firstElementChild).not.toBeNull();
    setConnection(fake, false);
    expect(container.firstElementChild).toBeNull();
    setConnection(fake, true);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('offline off: nothing changes while disconnected', () => {
    fake.setEnabled(false);
    fake.connected = false;
    expect(isPresenceSuppressed()).toBe(false);
    const { container } = render(<CometChatAvatarStatusIndicator status="online" />);
    expect(container.firstElementChild).not.toBeNull();
    renderHeader();
    expect(screen.getByText('message_header_online')).toBeInTheDocument();
  });
});
