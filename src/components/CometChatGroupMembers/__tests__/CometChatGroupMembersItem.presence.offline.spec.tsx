import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembersContext } from '../CometChatGroupMembers.context';
import { CometChatGroupMembersItem } from '../CometChatGroupMembersItem';
import type { CometChatGroupMembersContextValue } from '../CometChatGroupMembers.types';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

/**
 * D84 rule 10: nobody shows online while the SDK is disconnected, in any list. The member row's
 * status dot already hides; its screen-reader label must not say "Online" either.
 */

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key, language: 'en-us' }),
}));

function onlineMember() {
  return {
    getUid: () => 'm1',
    getName: () => 'Mia',
    getAvatar: () => '',
    getScope: () => 'participant',
    getStatus: () => 'online',
    getHasBlockedMe: () => false,
    getBlockedByMe: () => false,
  } as unknown as CometChat.GroupMember;
}

function renderRow() {
  const context = {
    group: { getGuid: () => 'g1', getOwner: () => 'owner' } as unknown as CometChat.Group,
    members: [],
    fetchState: 'loaded',
    selectedMemberIds: [],
    selectedMembersMap: new Map(),
    activeMemberId: null,
    loggedInUser: { getUid: () => 'me' } as unknown as CometChat.User,
    loggedInUserScope: 'participant',
    selectionMode: 'none',
    hideUserStatus: false,
    handleItemClick: vi.fn(),
  } as unknown as CometChatGroupMembersContextValue;
  return render(
    <CometChatGroupMembersContext.Provider value={context}>
      <CometChatGroupMembersItem member={onlineMember()} />
    </CometChatGroupMembersContext.Provider>
  );
}

describe('group member row presence (D84 rule 10)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
  });

  it('connected: the row reads online', () => {
    fake.connected = true;
    renderRow();
    expect(screen.getByRole('option').getAttribute('aria-label')).toContain(
      'accessibility_online'
    );
  });

  it('disconnected, offline on: the row does not read online', () => {
    fake.connected = false;
    renderRow();
    expect(screen.getByRole('option').getAttribute('aria-label')).not.toContain(
      'accessibility_online'
    );
  });

  it('disconnected, offline off: unchanged, the row still reads online', () => {
    fake.setEnabled(false);
    fake.connected = false;
    renderRow();
    expect(screen.getByRole('option').getAttribute('aria-label')).toContain(
      'accessibility_online'
    );
  });
});
