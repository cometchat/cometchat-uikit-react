import type { CometChatSettingsInterface, SettingsInput } from './settings.types';

/**
 * The docked chat button's open/close icons, served from the widget package's own CDN copy.
 *
 * The sample app has no docked button, so it never reads either of these — they live here only
 * because this is where the value they default is declared.
 * 
 * `dist/icons/*.svg` inside `@cometchat/chat-embed` is therefore a public contract: the paths must
 * stay byte-identical and must never gain a content hash.
 */
export const DEFAULT_DOCKED_OPEN_ICON =
  'https://cdn.jsdelivr.net/npm/@cometchat/chat-embed@latest/dist/icons/docked_open_icon.svg';
export const DEFAULT_DOCKED_CLOSE_ICON =
  'https://cdn.jsdelivr.net/npm/@cometchat/chat-embed@latest/dist/icons/docked_close_icon.svg';

/**
 * The icon the docked toggle button should draw, given whatever the resolved settings hold.
 *
 * Empty — and whitespace-only, which the builder's icon field will happily save — counts as "not
 * configured" rather than "no icon". The defaults above cannot reach the button on their own,
 * because `resolveSettings` lets any *present* value win.
 *
 * Lives here rather than in either component because both the builder and widget need it and neither can import from the other.
 */
export function dockedToggleIcon(
  styles: Partial<CometChatSettingsInterface['noCode']['styles']> | undefined,
  isOpen: boolean
): string {
  const configured = isOpen ? styles?.closeIcon : styles?.openIcon;
  return configured?.trim() || (isOpen ? DEFAULT_DOCKED_CLOSE_ICON : DEFAULT_DOCKED_OPEN_ICON);
}

/**
 * What the app does with no builder attached.
 *
 * Every feature on. The plain sample app renders no `SettingsProvider`, so `useSettings()`
 * returns this object directly — it is the sample app's behaviour, and it has always been
 * everything enabled.
 *
 * This is NOT what fills gaps in a stored settings blob; see `storedSettingsDefaults`.
 *
 * Changing a value here changes the plain sample app. Don't; override via `SettingsProvider`.
 */
export const defaultSettings: CometChatSettingsInterface = {
  chatFeatures: {
    coreMessagingExperience: {
      typingIndicator: true,
      threadConversationAndReplies: true,
      photosSharing: true,
      videoSharing: true,
      audioSharing: true,
      fileSharing: true,
      editMessage: true,
      deleteMessage: true,
      messageDeliveryAndReadReceipts: true,
      userAndFriendsPresence: true,
      conversationAndAdvancedSearch: true,
      moderation: true,
      quotedReplies: true,
      markAsUnread: true,
      richTextFormatting: true,
      multipleAttachments: true,
      pinMessage: true,
      saveMessage: true,
      pinConversation: true,
      threadSubscription: true,
    },
    deeperUserEngagement: {
      mentions: true,
      mentionAll: true,
      reactions: true,
      messageTranslation: true,
      polls: true,
      collaborativeWhiteboard: true,
      collaborativeDocument: true,
      voiceNotes: true,
      emojis: true,
      stickers: true,
      userInfo: true,
      groupInfo: true,
    },
    // AI copilot features are opt-in. The UI Kit defaults `showSmartReplies`,
    // `showConversationStarters` and `showConversationSummaryButton` to false, and the sample
    // app has never enabled them — defaulting these to true here would silently switch them on.
    aiUserCopilot: {
      conversationStarter: false,
      conversationSummary: false,
      smartReply: false,
    },
    userManagement: {
      friendsOnly: false,
    },
    groupManagement: {
      createGroup: true,
      addMembersToGroups: true,
      joinLeaveGroup: true,
      deleteGroup: true,
      viewGroupMembers: true,
    },
    moderatorControls: {
      kickUsers: true,
      banUsers: true,
      promoteDemoteMembers: true,
      reportMessage: true,
    },
    privateMessagingWithinGroups: {
      sendPrivateMessageToGroupMembers: true,
    },
    inAppSounds: {
      incomingMessageSound: true,
      outgoingMessageSound: true,
    },
  },
  callFeatures: {
    voiceAndVideoCalling: {
      oneOnOneVoiceCalling: true,
      oneOnOneVideoCalling: true,
      groupVideoConference: true,
      groupVoiceConference: true,
    },
  },
  layout: {
    withSideBar: true,
    tabs: ['chats', 'calls', 'users', 'groups'],
    chatType: 'user',
    compactMessageComposer: true,
  },
  style: {
    theme: 'system',
    color: {
      brandColor: '#6852D6',
      primaryTextLight: '#141414',
      primaryTextDark: '#FFFFFF',
      secondaryTextLight: '#727272',
      secondaryTextDark: '#989898',
    },
    typography: {
      font: 'Roboto',
      size: 'default',
    },
  },
  noCode: {
    docked: false,
    styles: {
      buttonBackGround: '#141414',
      buttonShape: 'rounded',
      openIcon: DEFAULT_DOCKED_OPEN_ICON,
      closeIcon: DEFAULT_DOCKED_CLOSE_ICON,
      customJs: '',
      customCss: '',
      dockedAlignment: 'right',
    },
  },
  agent: {
    chatHistory: true,
    newChat: true,
    agentIcon: '',
    showAgentIcon: true,
  },
};

/** True for plain objects — i.e. things we should merge into rather than replace. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * What fills the gaps in a STORED settings blob.
 *
 * Identical to `defaultSettings` except for the opt-in eight, which are off. Each was added
 * after customer variants already existed, so a blob that does not mention one means "saved
 * before this shipped" rather than "leave it on" — defaulting them to `true` would switch eight
 * features on for every customer who never chose them. The dashboard writes `true` into a new
 * variant's payload, so new variants get them.
 *
 * Kept separate from `defaultSettings` on purpose: that object answers "what does the sample app
 * do with no builder", and the two questions have different right answers. One constant serving
 * both is what silently turned these off in the plain sample app.
 */
export const storedSettingsDefaults: CometChatSettingsInterface = {
  ...defaultSettings,
  chatFeatures: {
    ...defaultSettings.chatFeatures,
    coreMessagingExperience: {
      ...defaultSettings.chatFeatures.coreMessagingExperience,
      quotedReplies: false,
      markAsUnread: false,
      multipleAttachments: false,
      pinMessage: false,
      saveMessage: false,
      pinConversation: false,
      threadSubscription: false,
    },
  },
  layout: {
    ...defaultSettings.layout,
    compactMessageComposer: false,
  },
};

/**
 * Deep-merges partial settings over `storedSettingsDefaults`.
 *
 * Arrays (notably `layout.tabs`) are replaced wholesale, not concatenated — a builder that
 * selects only `['chats']` must not inherit the default four tabs.
 *
 * Missing keys fall back to `storedSettingsDefaults`, which is what keeps older stored settings
 * loading without acquiring features they never opted into.
 *
 * With no input at all there is no builder in play, so the answer is the plain sample app.
 */
export function resolveSettings(input?: SettingsInput | null): CometChatSettingsInterface {
  if (!input) return defaultSettings;

  const merge = (base: unknown, override: unknown): unknown => {
    if (override === undefined || override === null) return base;
    if (!isPlainObject(base) || !isPlainObject(override)) return override;

    const out: Record<string, unknown> = { ...base };
    for (const key of Object.keys(override)) {
      out[key] = merge(base[key], override[key]);
    }
    return out;
  };

  return merge(storedSettingsDefaults, input) as CometChatSettingsInterface;
}
