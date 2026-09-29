import { useMemo } from 'react';
import { useSettings } from './SettingsContext';
import type { CometChatSettingsInterface } from './settings.types';

/**
 * Translates builder settings into UI Kit component props.
 *
 * The whole seam lives here: components spread a bundle rather than reading settings
 * themselves, so adding or re-mapping a setting touches one file instead of many.
 *
 * With the default settings every feature is enabled, so every prop below resolves to
 * `false`/`undefined` — spreading a bundle is a no-op and the plain sample app is unchanged.
 */

/** Props for `<CometChatMessageHeader>`. */
export interface MessageHeaderFeatureProps {
  hideVoiceCallButton?: boolean;
  hideVideoCallButton?: boolean;
  hideUserStatus?: boolean;
  showConversationSummaryButton?: boolean;
  showSearchOption?: boolean;
  hidePinnedMessagesOption?: boolean;
}

/** Props for `<CometChatMessageList>`. */
export interface MessageListFeatureProps {
  hideReceipts?: boolean;
  hideReactionOption?: boolean;
  hideEditMessageOption?: boolean;
  hideDeleteMessageOption?: boolean;
  hideReplyInThreadOption?: boolean;
  hideReplyOption?: boolean;
  hideTranslateMessageOption?: boolean;
  hideMessagePrivatelyOption?: boolean;
  hideFlagMessageOption?: boolean;
  hideModerationView?: boolean;
  hideGroupActionMessages?: boolean;
  showMarkAsUnreadOption?: boolean;
  showSmartReplies?: boolean;
  showConversationStarters?: boolean;
  disableSoundForMessages?: boolean;
  /*
   * Pin and save each need both halves. The options menu shows "Pin" or "Unpin" depending on the
   * message's current state, so hiding only one leaves the other reachable on every message that
   * is already pinned.
   */
  hidePinMessageOption?: boolean;
  hideUnpinMessageOption?: boolean;
  hideSaveMessageOption?: boolean;
  hideUnsaveMessageOption?: boolean;
  hideThreadSubscriptionOption?: boolean;
}

/** Props for `<CometChatMessageComposer>`. */
export interface ComposerFeatureProps {
  enableMultipleAttachments?: boolean;
  hideAttachmentOptions?: {
    image?: boolean;
    video?: boolean;
    audio?: boolean;
    file?: boolean;
    polls?: boolean;
    collaborativeDocument?: boolean;
    collaborativeWhiteboard?: boolean;
  };
  hideEmojiKeyboardButton?: boolean;
  hideStickersButton?: boolean;
  hideVoiceRecordingButton?: boolean;
  hideRichTextFormattingOptions?: boolean;
  disableMentions?: boolean;
  disableMentionAll?: boolean;
  disableTypingEvents?: boolean;
  disableSoundForMessage?: boolean;
}

/**
 * Props for `<CometChatSearch>`.
 *
 * Search results repeat the conversation rows, so they need the same two display gates —
 * without them a disabled toggle still showed receipts and presence inside search.
 */
export interface SearchFeatureProps {
  hideUserStatus?: boolean;
  hideReceipts?: boolean;
}

/**
 * Props for `<CometChatConversations>`.
 *
 * `showSearchBar` must be passed explicitly: the UI Kit defaults it to true, so leaving it out
 * left the conversations search bar visible with `conversationAndAdvancedSearch` off.
 */
export interface ConversationsFeatureProps {
  hideUserStatus?: boolean;
  hideReceipts?: boolean;
  showSearchBar?: boolean;
  disableSoundForMessages?: boolean;
  hidePinConversation?: boolean;
}

/**
 * Props for `<CometChatUsers>`.
 *
 * `userManagement.friendsOnly` is not mapped here — it needs a `CometChat.UsersRequestBuilder`,
 * and keeping the SDK out of this module lets the mapping be unit-tested without a DOM. Read it
 * from `featureProps.settings` where the request builder is constructed.
 */
export interface UsersFeatureProps {
  hideUserStatus?: boolean;
}

/** Props for `<CometChatGroupMembers>`. */
export interface GroupMembersFeatureProps {
  hideUserStatus?: boolean;
  hideKickMemberOption?: boolean;
  hideBanMemberOption?: boolean;
  hideScopeChangeOption?: boolean;
}

/** Props for `<CometChatThreadHeader>`. */
export interface ThreadHeaderFeatureProps {
  hideReceipts?: boolean;
  hideThreadSubscriptionToggle?: boolean;
}

/** All prop bundles, plus the raw settings for the few structural decisions. */
export interface FeatureProps {
  /**
   * Header props. Takes the entity kind because calling is configured separately for 1:1 and
   * group conversations — `groupVideoConference` vs `oneOnOneVideoCalling`.
   */
  messageHeader: (opts?: { isGroup?: boolean }) => MessageHeaderFeatureProps;
  messageList: MessageListFeatureProps;
  composer: ComposerFeatureProps;
  conversations: ConversationsFeatureProps;
  users: UsersFeatureProps;
  groupMembers: GroupMembersFeatureProps;
  threadHeader: ThreadHeaderFeatureProps;
  search: SearchFeatureProps;
  /** Resolved settings, for layout choices that aren't expressible as props. */
  settings: CometChatSettingsInterface;
}

/**
 * Builds every prop bundle from a settings object.
 *
 * `hide*` props are the negation of the corresponding feature flag; `show*` props track it
 * directly. Both are emitted unconditionally — passing `hideX={false}` is equivalent to
 * omitting it, and emitting them always keeps the mapping readable.
 *
 * Exported as a pure function so the settings → props mapping can be tested without rendering.
 */
export function buildFeatureProps(settings: CometChatSettingsInterface): FeatureProps {
  const { chatFeatures, callFeatures } = settings;
  const core = chatFeatures.coreMessagingExperience;
  const engagement = chatFeatures.deeperUserEngagement;
  const ai = chatFeatures.aiUserCopilot;
  const moderators = chatFeatures.moderatorControls;
  const sounds = chatFeatures.inAppSounds;
  const calling = callFeatures.voiceAndVideoCalling;

  return {
    messageHeader: ({ isGroup = false } = {}) => ({
      hideVoiceCallButton: isGroup ? !calling.groupVoiceConference : !calling.oneOnOneVoiceCalling,
      hideVideoCallButton: isGroup ? !calling.groupVideoConference : !calling.oneOnOneVideoCalling,
      hideUserStatus: !core.userAndFriendsPresence,
      showConversationSummaryButton: ai.conversationSummary,
      showSearchOption: core.conversationAndAdvancedSearch,
      hidePinnedMessagesOption: !core.pinMessage,
    }),
    messageList: {
      hideReceipts: !core.messageDeliveryAndReadReceipts,
      hideReactionOption: !engagement.reactions,
      hideEditMessageOption: !core.editMessage,
      hideDeleteMessageOption: !core.deleteMessage,
      hideReplyInThreadOption: !core.threadConversationAndReplies,
      hideReplyOption: !core.quotedReplies,
      hideTranslateMessageOption: !engagement.messageTranslation,
      hideMessagePrivatelyOption:
        !chatFeatures.privateMessagingWithinGroups.sendPrivateMessageToGroupMembers,
      hideFlagMessageOption: !moderators.reportMessage,
      hideModerationView: !core.moderation,
      hideGroupActionMessages: false,
      showMarkAsUnreadOption: core.markAsUnread,
      showSmartReplies: ai.smartReply,
      showConversationStarters: ai.conversationStarter,
      disableSoundForMessages: !sounds.incomingMessageSound,
      hidePinMessageOption: !core.pinMessage,
      hideUnpinMessageOption: !core.pinMessage,
      hideSaveMessageOption: !core.saveMessage,
      hideUnsaveMessageOption: !core.saveMessage,
      hideThreadSubscriptionOption: !core.threadSubscription,
    },
    composer: {
      // Passed through rather than negated: the schema key and the UI Kit prop share polarity.
      enableMultipleAttachments: core.multipleAttachments,
      hideAttachmentOptions: {
        image: !core.photosSharing,
        video: !core.videoSharing,
        audio: !core.audioSharing,
        file: !core.fileSharing,
        polls: !engagement.polls,
        collaborativeDocument: !engagement.collaborativeDocument,
        collaborativeWhiteboard: !engagement.collaborativeWhiteboard,
      },
      hideEmojiKeyboardButton: !engagement.emojis,
      hideStickersButton: !engagement.stickers,
      hideVoiceRecordingButton: !engagement.voiceNotes,
      hideRichTextFormattingOptions: !core.richTextFormatting,
      disableMentions: !engagement.mentions,
      disableMentionAll: !engagement.mentionAll,
      disableTypingEvents: !core.typingIndicator,
      disableSoundForMessage: !sounds.outgoingMessageSound,
    },
    conversations: {
      hideUserStatus: !core.userAndFriendsPresence,
      hideReceipts: !core.messageDeliveryAndReadReceipts,
      showSearchBar: core.conversationAndAdvancedSearch,
      disableSoundForMessages: !sounds.incomingMessageSound,
      hidePinConversation: !core.pinConversation,
    },
    users: {
      hideUserStatus: !core.userAndFriendsPresence,
    },
    groupMembers: {
      hideUserStatus: !core.userAndFriendsPresence,
      hideKickMemberOption: !moderators.kickUsers,
      hideBanMemberOption: !moderators.banUsers,
      hideScopeChangeOption: !moderators.promoteDemoteMembers,
    },
    threadHeader: {
      hideReceipts: !core.messageDeliveryAndReadReceipts,
      hideThreadSubscriptionToggle: !core.threadSubscription,
    },
    search: {
      hideUserStatus: !core.userAndFriendsPresence,
      hideReceipts: !core.messageDeliveryAndReadReceipts,
    },
    settings,
  };
}

/** Reads the active settings and builds the prop bundles, memoised per settings object. */
export function useFeatureProps(): FeatureProps {
  const settings = useSettings();
  return useMemo(() => buildFeatureProps(settings), [settings]);
}
