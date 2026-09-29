import { describe, expect, it } from 'vitest';
import { buildFeatureProps } from './useFeatureProps';
import { defaultSettings, storedSettingsDefaults, resolveSettings } from './defaultSettings';

/**
 * These are the tests that prove the seam actually does something.
 *
 * The coverage spec proves every setting is *referenced*; this proves each one produces the
 * right prop. Two halves matter equally:
 *  - defaults must be a no-op, so the plain sample app is untouched (AC1)
 *  - a disabled feature must emit the prop that hides it
 */

/** The plain sample app: no SettingsProvider, so `defaultSettings` is what it reads. */
const defaults = buildFeatureProps(defaultSettings);

/** A stored blob that mentions nothing — an existing variant saved before the opt-in keys. */
const stored = buildFeatureProps(storedSettingsDefaults);

/** Builds props with a partial settings override applied over the defaults. */
const withSettings = (override: Parameters<typeof resolveSettings>[0]) =>
  buildFeatureProps(resolveSettings(override));

describe('the plain sample app is untouched', () => {
  /*
   * No SettingsProvider means `defaultSettings`, and that has always been every feature on. The
   * opt-in rules belong to stored variants, not to an app with no builder attached — conflating
   * the two is what silently switched eight features off here once.
   */
  it('emits no hide/disable flags on the message list', () => {
    const enabled = Object.entries(defaults.messageList).filter(
      ([key, value]) => /^(hide|disable)/.test(key) && value === true
    );
    expect(enabled).toEqual([]);
  });

  it('leaves the opt-in features on', () => {
    expect(defaults.messageList.showMarkAsUnreadOption).toBe(true);
    expect(defaults.composer.enableMultipleAttachments).toBe(true);
    expect(defaults.conversations.hidePinConversation).toBe(false);
    expect(defaults.threadHeader.hideThreadSubscriptionToggle).toBe(false);
    expect(defaults.messageHeader().hidePinnedMessagesOption).toBe(false);
    expect(defaults.settings.layout.compactMessageComposer).toBe(true);
  });
});

describe('a stored blob hides only the opt-in features', () => {
  /*
   * Asserting the exact set means adding another opt-in feature has to be a deliberate edit
   * here, not a silent change.
   */
  it('hides exactly the opt-in message-list features', () => {
    const enabled = Object.entries(stored.messageList)
      .filter(([key, value]) => /^(hide|disable)/.test(key) && value === true)
      .map(([key]) => key)
      .sort();
    expect(enabled).toEqual([
      'hidePinMessageOption',
      'hideReplyOption',
      'hideSaveMessageOption',
      'hideThreadSubscriptionOption',
      'hideUnpinMessageOption',
      'hideUnsaveMessageOption',
    ]);
  });

  it('emits no hide/disable flags on the composer', () => {
    const enabled = Object.entries(defaults.composer).filter(
      ([key, value]) => /^(hide|disable)/.test(key) && value === true
    );
    expect(enabled).toEqual([]);
  });

  it('hides no attachment options', () => {
    expect(Object.values(defaults.composer.hideAttachmentOptions!)).toEqual(Array(7).fill(false));
  });

  it('leaves AI show-flags off, matching the UI Kit defaults', () => {
    expect(defaults.messageList.showSmartReplies).toBe(false);
    expect(defaults.messageList.showConversationStarters).toBe(false);
    expect(defaults.messageHeader().showConversationSummaryButton).toBe(false);
  });

  it('keeps search on, which the sample app used to hardcode', () => {
    expect(defaults.messageHeader().showSearchOption).toBe(true);
  });

  it('leaves the opt-in features off on their other surfaces too', () => {
    expect(stored.messageList.showMarkAsUnreadOption).toBe(false);
    expect(stored.composer.enableMultipleAttachments).toBe(false);
    expect(stored.conversations.hidePinConversation).toBe(true);
    expect(stored.threadHeader.hideThreadSubscriptionToggle).toBe(true);
    expect(stored.settings.layout.compactMessageComposer).toBe(false);
  });
});

describe('disabling a feature emits the prop that hides it', () => {
  it.each([
    ['editMessage', 'hideEditMessageOption'],
    ['deleteMessage', 'hideDeleteMessageOption'],
    ['messageDeliveryAndReadReceipts', 'hideReceipts'],
    ['threadConversationAndReplies', 'hideReplyInThreadOption'],
    ['moderation', 'hideModerationView'],
  ] as const)('coreMessagingExperience.%s → messageList.%s', (setting, prop) => {
    const props = withSettings({ chatFeatures: { coreMessagingExperience: { [setting]: false } } });
    expect(props.messageList[prop]).toBe(true);
    expect(defaults.messageList[prop]).toBe(false);
  });

  /*
   * The opt-in features invert the check: they are hidden by default, and turning them ON is what
   * has to emit the prop. Kept separate from the block above so the two contracts stay visible.
   */
  it.each([
    ['quotedReplies', 'hideReplyOption'],
    ['pinMessage', 'hidePinMessageOption'],
    ['pinMessage', 'hideUnpinMessageOption'],
    ['saveMessage', 'hideSaveMessageOption'],
    ['saveMessage', 'hideUnsaveMessageOption'],
    ['threadSubscription', 'hideThreadSubscriptionOption'],
  ] as const)('coreMessagingExperience.%s on → messageList.%s false', (setting, prop) => {
    expect(stored.messageList[prop]).toBe(true);
    const props = withSettings({ chatFeatures: { coreMessagingExperience: { [setting]: true } } });
    expect(props.messageList[prop]).toBe(false);
  });

  it('pinMessage hides the header entry that opens the pinned list', () => {
    // The list is reachable only from this entry, so leaving it on would keep the whole feature
    // one click away with pinning off.
    expect(stored.messageHeader().hidePinnedMessagesOption).toBe(true);
    const on = withSettings({ chatFeatures: { coreMessagingExperience: { pinMessage: true } } });
    expect(on.messageHeader().hidePinnedMessagesOption).toBe(false);
  });

  it('pinConversation and threadSubscription reach their other surfaces', () => {
    const on = withSettings({
      chatFeatures: {
        coreMessagingExperience: { pinConversation: true, threadSubscription: true },
      },
    });
    expect(on.conversations.hidePinConversation).toBe(false);
    expect(on.threadHeader.hideThreadSubscriptionToggle).toBe(false);
  });

  it.each([
    ['reactions', 'hideReactionOption'],
    ['messageTranslation', 'hideTranslateMessageOption'],
  ] as const)('deeperUserEngagement.%s → messageList.%s', (setting, prop) => {
    const props = withSettings({ chatFeatures: { deeperUserEngagement: { [setting]: false } } });
    expect(props.messageList[prop]).toBe(true);
  });

  it.each([
    ['emojis', 'hideEmojiKeyboardButton'],
    ['stickers', 'hideStickersButton'],
    ['voiceNotes', 'hideVoiceRecordingButton'],
    ['mentions', 'disableMentions'],
    ['mentionAll', 'disableMentionAll'],
  ] as const)('deeperUserEngagement.%s → composer.%s', (setting, prop) => {
    const props = withSettings({ chatFeatures: { deeperUserEngagement: { [setting]: false } } });
    expect(props.composer[prop]).toBe(true);
  });

  it('typingIndicator → composer.disableTypingEvents', () => {
    const props = withSettings({
      chatFeatures: { coreMessagingExperience: { typingIndicator: false } },
    });
    expect(props.composer.disableTypingEvents).toBe(true);
  });

  it('reportMessage → messageList.hideFlagMessageOption', () => {
    const props = withSettings({ chatFeatures: { moderatorControls: { reportMessage: false } } });
    expect(props.messageList.hideFlagMessageOption).toBe(true);
  });

  it.each([
    ['kickUsers', 'hideKickMemberOption'],
    ['banUsers', 'hideBanMemberOption'],
    ['promoteDemoteMembers', 'hideScopeChangeOption'],
  ] as const)('moderatorControls.%s → groupMembers.%s', (setting, prop) => {
    const props = withSettings({ chatFeatures: { moderatorControls: { [setting]: false } } });
    expect(props.groupMembers[prop]).toBe(true);
  });
});

describe('attachment options fold into one structured prop', () => {
  it.each([
    ['photosSharing', 'image'],
    ['videoSharing', 'video'],
    ['audioSharing', 'audio'],
    ['fileSharing', 'file'],
  ] as const)('coreMessagingExperience.%s → hideAttachmentOptions.%s', (setting, key) => {
    const props = withSettings({ chatFeatures: { coreMessagingExperience: { [setting]: false } } });
    expect(props.composer.hideAttachmentOptions?.[key]).toBe(true);
    // the others stay visible
    expect(props.composer.hideAttachmentOptions?.polls).toBe(false);
  });

  it.each([
    ['polls', 'polls'],
    ['collaborativeDocument', 'collaborativeDocument'],
    ['collaborativeWhiteboard', 'collaborativeWhiteboard'],
  ] as const)('deeperUserEngagement.%s → hideAttachmentOptions.%s', (setting, key) => {
    const props = withSettings({ chatFeatures: { deeperUserEngagement: { [setting]: false } } });
    expect(props.composer.hideAttachmentOptions?.[key]).toBe(true);
  });
});

describe('calling is resolved per entity kind', () => {
  const onlyOneOnOne = {
    callFeatures: {
      voiceAndVideoCalling: {
        oneOnOneVoiceCalling: true,
        oneOnOneVideoCalling: true,
        groupVoiceConference: false,
        groupVideoConference: false,
      },
    },
  };

  it('uses the 1:1 settings for a user conversation', () => {
    const header = withSettings(onlyOneOnOne).messageHeader({ isGroup: false });
    expect(header.hideVoiceCallButton).toBe(false);
    expect(header.hideVideoCallButton).toBe(false);
  });

  it('uses the group settings for a group conversation', () => {
    const header = withSettings(onlyOneOnOne).messageHeader({ isGroup: true });
    expect(header.hideVoiceCallButton).toBe(true);
    expect(header.hideVideoCallButton).toBe(true);
  });

  it('defaults to the 1:1 settings when no entity kind is given', () => {
    const props = withSettings({
      callFeatures: { voiceAndVideoCalling: { oneOnOneVideoCalling: false } },
    });
    expect(props.messageHeader().hideVideoCallButton).toBe(true);
  });
});

describe('sounds map to the right side of the conversation', () => {
  it('outgoing sound gates the composer', () => {
    const props = withSettings({ chatFeatures: { inAppSounds: { outgoingMessageSound: false } } });
    expect(props.composer.disableSoundForMessage).toBe(true);
    expect(props.messageList.disableSoundForMessages).toBe(false);
  });

  it('incoming sound gates the list and the conversations pane', () => {
    const props = withSettings({ chatFeatures: { inAppSounds: { incomingMessageSound: false } } });
    expect(props.messageList.disableSoundForMessages).toBe(true);
    expect(props.conversations.disableSoundForMessages).toBe(true);
    expect(props.composer.disableSoundForMessage).toBe(false);
  });
});

describe('friendsOnly is surfaced through settings, not as a prop', () => {
  it('is off by default and readable when enabled', () => {
    expect(defaults.settings.chatFeatures.userManagement.friendsOnly).toBe(false);
    const props = withSettings({ chatFeatures: { userManagement: { friendsOnly: true } } });
    expect(props.settings.chatFeatures.userManagement.friendsOnly).toBe(true);
  });
});

describe('presence fans out to every list that shows it', () => {
  it('hides user status everywhere at once', () => {
    const props = withSettings({
      chatFeatures: { coreMessagingExperience: { userAndFriendsPresence: false } },
    });
    expect(props.messageHeader().hideUserStatus).toBe(true);
    expect(props.conversations.hideUserStatus).toBe(true);
    expect(props.users.hideUserStatus).toBe(true);
    expect(props.groupMembers.hideUserStatus).toBe(true);
  });
});

describe('search is gated wherever it appears', () => {
  // The conversations search bar defaults to true in the UI Kit, so an unmapped prop left it
  // visible with the feature off.
  it('shows the conversations search bar by default', () => {
    expect(defaults.conversations.showSearchBar).toBe(true);
  });

  it('hides the conversations search bar when the feature is off', () => {
    const props = withSettings({
      chatFeatures: { coreMessagingExperience: { conversationAndAdvancedSearch: false } },
    });
    expect(props.conversations.showSearchBar).toBe(false);
    expect(props.messageHeader().showSearchOption).toBe(false);
  });
});

describe('search results carry the same display gates as the rows they mirror', () => {
  it('leaves both off by default', () => {
    expect(defaults.search.hideReceipts).toBe(false);
    expect(defaults.search.hideUserStatus).toBe(false);
  });

  it('hides receipts in search when receipts are disabled', () => {
    const props = withSettings({
      chatFeatures: { coreMessagingExperience: { messageDeliveryAndReadReceipts: false } },
    });
    expect(props.search.hideReceipts).toBe(true);
    expect(props.conversations.hideReceipts).toBe(true);
    expect(props.messageList.hideReceipts).toBe(true);
  });

  it('hides presence in search when presence is disabled', () => {
    const props = withSettings({
      chatFeatures: { coreMessagingExperience: { userAndFriendsPresence: false } },
    });
    expect(props.search.hideUserStatus).toBe(true);
  });
});
