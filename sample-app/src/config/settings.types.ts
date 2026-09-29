/**
 * CometChat Builder settings schema.
 *
 * This is the contract between the Chat Builder (dashboard UI), the builder service
 * (`/v1/builders`), and this app. The same shape is stored server-side, patched into the
 * downloadable app's `cometchat-builder-settings.json` at export time, and handed to the
 * no-code widget at runtime.
 *
 * Compatibility rules:
 * - Every field is optional at the leaf level via `SettingsInput` (see `defaultSettings.ts`).
 *   Stored customer settings predate several keys and must keep loading.
 * - Never rename or remove a key. Add new ones as optional.
 */

/** Core send/receive messaging features. */
export interface CoreMessagingExperience {
  typingIndicator: boolean;
  threadConversationAndReplies: boolean;
  photosSharing: boolean;
  videoSharing: boolean;
  audioSharing: boolean;
  fileSharing: boolean;
  editMessage: boolean;
  deleteMessage: boolean;
  messageDeliveryAndReadReceipts: boolean;
  userAndFriendsPresence: boolean;
  conversationAndAdvancedSearch: boolean;
  moderation: boolean;
  quotedReplies: boolean;
  markAsUnread: boolean;
  richTextFormatting: boolean;
  multipleAttachments: boolean;
  pinMessage: boolean;
  saveMessage: boolean;
  pinConversation: boolean;
  threadSubscription: boolean;
}

/** Richer engagement features layered on top of core messaging. */
export interface DeeperUserEngagement {
  mentions: boolean;
  mentionAll: boolean;
  reactions: boolean;
  messageTranslation: boolean;
  polls: boolean;
  collaborativeWhiteboard: boolean;
  collaborativeDocument: boolean;
  voiceNotes: boolean;
  emojis: boolean;
  stickers: boolean;
  userInfo: boolean;
  groupInfo: boolean;
}

/** AI-assisted composing and reading. */
export interface AiUserCopilot {
  conversationStarter: boolean;
  conversationSummary: boolean;
  smartReply: boolean;
}

/** User-scope controls. */
export interface UserManagement {
  friendsOnly: boolean;
}

/** Group lifecycle controls. */
export interface GroupManagement {
  createGroup: boolean;
  addMembersToGroups: boolean;
  joinLeaveGroup: boolean;
  deleteGroup: boolean;
  viewGroupMembers: boolean;
}

/** Moderation actions available to group owners/admins. */
export interface ModeratorControls {
  kickUsers: boolean;
  banUsers: boolean;
  promoteDemoteMembers: boolean;
  reportMessage: boolean;
}

/** 1:1 messaging initiated from within a group. */
export interface PrivateMessagingWithinGroups {
  sendPrivateMessageToGroupMembers: boolean;
}

/** Notification sounds. */
export interface InAppSounds {
  incomingMessageSound: boolean;
  outgoingMessageSound: boolean;
}

/** Chat feature groups. */
export interface ChatFeatures {
  coreMessagingExperience: CoreMessagingExperience;
  deeperUserEngagement: DeeperUserEngagement;
  aiUserCopilot: AiUserCopilot;
  userManagement: UserManagement;
  groupManagement: GroupManagement;
  moderatorControls: ModeratorControls;
  privateMessagingWithinGroups: PrivateMessagingWithinGroups;
  inAppSounds: InAppSounds;
}

/** Voice and video calling. */
export interface VoiceAndVideoCalling {
  oneOnOneVoiceCalling: boolean;
  oneOnOneVideoCalling: boolean;
  groupVideoConference: boolean;
  groupVoiceConference: boolean;
}

/** Call feature groups. */
export interface CallFeatures {
  voiceAndVideoCalling: VoiceAndVideoCalling;
}

/** Which selector tabs are available. */
export type TabName = 'chats' | 'calls' | 'users' | 'groups';

/** Default conversation kind when the app opens a chat directly. */
export type ChatType = 'user' | 'group';

/** Shell layout. */
export interface LayoutSettings {
  /** Render the conversations sidebar. When false the app is a single chat pane. */
  withSideBar: boolean;
  /** Tabs to show, in order. A single tab hides the tab bar. */
  tabs: TabName[];
  chatType: ChatType;
  /** Use the compact composer layout. */
  compactMessageComposer: boolean;
}

/** Brand palette. Light/dark variants are picked by the active theme. */
export interface ColorSettings {
  brandColor: string;
  primaryTextLight: string;
  primaryTextDark: string;
  secondaryTextLight: string;
  secondaryTextDark: string;
}

/** Font family and scale. */
export interface TypographySettings {
  font: string;
  /** Maps to the font-size ramps in the builder's style config. */
  size: 'compact' | 'default' | 'comfortable' | string;
}

/**
 * Visual styling.
 *
 * `theme: 'system'` is resolved to light/dark by the consumer before being handed to
 * the UI Kit — `CometChatThemeProvider` accepts only 'light' | 'dark'.
 */
export interface StyleSettings {
  theme: 'light' | 'dark' | 'system' | string;
  color: ColorSettings;
  typography: TypographySettings;
}

/** No-code widget presentation. Only consumed by `@cometchat/chat-embed`. */
export interface NoCodeStyles {
  buttonBackGround: string;
  buttonShape: string;
  openIcon: string;
  closeIcon: string;
  customJs: string;
  customCss: string;
  dockedAlignment: 'left' | 'right' | string;
}

/** No-code widget settings. */
export interface NoCodeSettings {
  docked: boolean;
  styles: NoCodeStyles;
}

/** AI agent presentation. */
export interface AgentSettings {
  chatHistory: boolean;
  newChat: boolean;
  agentIcon: string;
  showAgentIcon: boolean;
}

/** The full, resolved settings object. Every field present — see `defaultSettings`. */
export interface CometChatSettingsInterface {
  chatFeatures: ChatFeatures;
  callFeatures: CallFeatures;
  layout: LayoutSettings;
  style: StyleSettings;
  noCode: NoCodeSettings;
  agent: AgentSettings;
}

/**
 * Recursively-optional form of the settings.
 *
 * Stored settings and `cometchat-builder-settings.json` are validated against this rather
 * than the strict interface, so older payloads missing newer keys still load. Merge with
 * `defaultSettings` via `resolveSettings()` to get a complete object.
 */
export type SettingsInput = {
  [K in keyof CometChatSettingsInterface]?: Partial<{
    [P in keyof CometChatSettingsInterface[K]]: CometChatSettingsInterface[K][P] extends object
      ? Partial<CometChatSettingsInterface[K][P]>
      : CometChatSettingsInterface[K][P];
  }>;
};

/** The envelope the builder service and the exported `*-settings.json` use. */
export interface CometChatBuilderConfig {
  builderId?: string;
  settings?: SettingsInput;
}
