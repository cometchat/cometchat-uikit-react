import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinnedMessages } from '../CometChatPinnedMessages';
import { useCometChatPinnedMessagesContext } from '../CometChatPinnedMessages.context';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatOverlayContainerContext } from '../../../context/OverlayContainerContext';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { resolvePinSaveFeatures, resetPinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { buildUser, buildGroup } from '../../../testing/mock-builders';

/**
 * The pinned panel sits in a positioned side column. Its Message Information overlay must be
 * portalled into the app's overlay container: rendered in place, an `absolute` overlay covers only
 * that column, and the `fixed` one it replaced covered the whole host page when embedded.
 */

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;
const OVERLAY = '.cometchat-pinned-messages__message-info-overlay';

function pinnedMessage(id: number): CometChat.BaseMessage {
  return {
    getId: () => id,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({ getUid: () => 'other', getName: () => 'Other', getAvatar: () => '' }),
    getReceiverType: () => 'group',
    getReceiverId: () => 'g1',
    getSentAt: () => 1735689600,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => `m-${String(id)}`,
    getParentMessageId: () => 0,
    isPinned: () => true,
    isSaved: () => false,
  } as unknown as CometChat.BaseMessage;
}

function mockEmptyPinnedRequest() {
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setPinned: () => builder,
      setGUID: () => builder,
      setUID: () => builder,
      build: () => ({ fetchPrevious: () => Promise.resolve([]), hasMore: () => false }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

/** Opens Message Information through the Root's context, as a pinned item's option does. */
function OpenInfo({ message }: { message: CometChat.BaseMessage }) {
  const { onMessageInfo } = useCometChatPinnedMessagesContext();
  return (
    <button type="button" onClick={() => onMessageInfo(message)}>
      open info
    </button>
  );
}

function renderInApp(appContainer: HTMLElement) {
  const group = buildGroup() as unknown as CometChat.Group;
  Object.assign(group, { getGuid: () => 'g1', getScope: () => CometChat.GROUP_MEMBER_SCOPE.ADMIN });
  return render(
    <CometChatPluginRegistryContext.Provider value={new CometChatPluginRegistry([])}>
      <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
        <CometChatOverlayContainerContext.Provider value={appContainer}>
          <CometChatPinnedMessages.Root group={group}>
            <OpenInfo message={pinnedMessage(1)} />
          </CometChatPinnedMessages.Root>
        </CometChatOverlayContainerContext.Provider>
      </CometChatThemeContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}

let appContainer: HTMLElement;

beforeEach(async () => {
  vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInUser);
  resetPinSaveFeatures();
  vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
  vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(true);
  vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(true);
  await resolvePinSaveFeatures();
  mockEmptyPinnedRequest();
  appContainer = document.createElement('div');
  appContainer.className = 'cometchat';
  document.body.appendChild(appContainer);
});

afterEach(() => {
  appContainer.remove();
  vi.restoreAllMocks();
  resetPinSaveFeatures();
});

describe('CometChatPinnedMessages — Message Information overlay', () => {
  it('portals into the app overlay container, not in place inside the panel', () => {
    const { container: panel } = renderInApp(appContainer);

    fireEvent.click(screen.getByText('open info'));

    const overlay = document.querySelector(OVERLAY);
    expect(overlay).not.toBeNull();
    expect(appContainer.contains(overlay)).toBe(true);
    expect(panel.contains(overlay)).toBe(false);
  });

  it('closes when its backdrop is clicked', () => {
    renderInApp(appContainer);
    fireEvent.click(screen.getByText('open info'));

    fireEvent.click(appContainer.querySelector(OVERLAY)!);

    expect(document.querySelector(OVERLAY)).toBeNull();
  });
});
