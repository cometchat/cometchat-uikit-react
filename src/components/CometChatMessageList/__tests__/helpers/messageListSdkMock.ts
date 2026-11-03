/**
 * The SDK as the CometChatMessageList props specs see it: the real module (its constants and
 * message classes, which the kit reads on import), with every call the list makes replaced by a
 * spy the spec controls. Nothing of the kit is mocked.
 *
 * Use it from a spec with:
 *
 * ```ts
 * vi.mock('@cometchat/chat-sdk-javascript', async () =>
 *   (await import('./helpers/messageListSdkMock')).mockSdkModule()
 * );
 * ```
 *
 * This module imports nothing from the kit, so the mock factory can load it without a cycle.
 */
import { vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** How one request builder was configured: method name → the arguments of its last call. */
export type BuilderCalls = Record<string, unknown[]>;

/** The user the app is logged in as (what `CometChat.getLoggedinUser()` resolves). */
export const me = {
  getUid: () => 'me',
  getName: () => 'Me',
  getAvatar: () => '',
  getStatus: () => 'online',
  getRole: () => 'default',
  getBlockedByMe: () => false,
  getHasBlockedMe: () => false,
};

export const sdk = {
  /** One entry per `new CometChat.MessagesRequestBuilder()`, in order. */
  messageRequests: [] as BuilderCalls[],
  fetchPrevious: vi.fn<(request: BuilderCalls) => Promise<CometChat.BaseMessage[]>>(),
  fetchNext: vi.fn<(request: BuilderCalls) => Promise<CometChat.BaseMessage[]>>(),
  /** One entry per `new CometChat.ReactionsRequestBuilder()`, in order. */
  reactionRequests: [] as BuilderCalls[],
  fetchReactions: vi.fn<(request: BuilderCalls) => Promise<CometChat.Reaction[]>>(),
  getConversation: vi.fn<(id: string, type: string) => Promise<unknown>>(),
  getMessageDetails: vi.fn<(id: string) => Promise<unknown>>(),
  markAsDelivered: vi.fn<(message: unknown) => Promise<void>>(),
  markAsRead: vi.fn<(message: unknown) => Promise<void>>(),
  markConversationAsRead: vi.fn<(id: string, type: string) => Promise<void>>(),
  markMessageAsUnread: vi.fn<(message: unknown) => Promise<unknown>>(),
  deleteMessage: vi.fn<(id: string) => Promise<unknown>>(),
  addReaction: vi.fn<(id: number, emoji: string) => Promise<unknown>>(),
  removeReaction: vi.fn<(id: number, emoji: string) => Promise<unknown>>(),
  getSmartReplies: vi.fn<(id: string, type: string) => Promise<unknown>>(),
  getConversationStarter: vi.fn<(id: string, type: string) => Promise<string[]>>(),
  getFlagReasons: vi.fn<() => Promise<unknown[]>>(),
  getMessageReceipts: vi.fn<(id: number) => Promise<unknown[]>>(),
  isPinMessageEnabled: vi.fn<() => Promise<boolean>>(),
  isSaveMessageEnabled: vi.fn<() => Promise<boolean>>(),
};

/**
 * A request builder that records how it was configured. Every setter returns the builder, and
 * `build()` hands back a request whose fetches go to the spies above.
 */
function recordingBuilder(
  store: BuilderCalls[],
  methods: readonly string[],
  request: (calls: BuilderCalls) => object
) {
  return function RequestBuilder(this: Record<string, unknown>) {
    const calls: BuilderCalls = {};
    store.push(calls);
    for (const name of methods) {
      this[name] = (...args: unknown[]) => {
        calls[name] = args;
        return this;
      };
    }
    this.build = () => request(calls);
  };
}

export async function mockSdkModule() {
  const actual = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>(
    '@cometchat/chat-sdk-javascript'
  );
  const resolved = <T>(value: T) => () => Promise.resolve(value);
  const CometChat = Object.assign({}, actual.CometChat, {
    // Session: CometChatUIKit.init() finds `me` already logged in.
    init: resolved(true),
    setSource: () => undefined,
    isInitialized: () => true,
    getLoggedinUser: resolved(me),
    getConversationUpdateSettings: resolved(null),
    addLoginListener: () => undefined,
    removeLoginListener: () => undefined,
    // Fetching
    MessagesRequestBuilder: recordingBuilder(
      sdk.messageRequests,
      [
        'setLimit',
        'hideDeletedMessages',
        'setUID',
        'setGUID',
        'setParentMessageId',
        'hideReplies',
        'withParent',
        'setTypes',
        'setCategories',
        'setMessageId',
      ],
      calls => ({
        fetchPrevious: () => sdk.fetchPrevious(calls),
        fetchNext: () => sdk.fetchNext(calls),
      })
    ),
    ReactionsRequestBuilder: recordingBuilder(
      sdk.reactionRequests,
      ['setLimit', 'setMessageId', 'setReaction'],
      calls => ({ fetchNext: () => sdk.fetchReactions(calls) })
    ),
    getConversation: sdk.getConversation,
    getMessageDetails: sdk.getMessageDetails,
    getMessageReceipts: sdk.getMessageReceipts,
    // Receipts and actions
    markAsDelivered: sdk.markAsDelivered,
    markAsRead: sdk.markAsRead,
    markConversationAsRead: sdk.markConversationAsRead,
    markMessageAsUnread: sdk.markMessageAsUnread,
    deleteMessage: sdk.deleteMessage,
    addReaction: sdk.addReaction,
    removeReaction: sdk.removeReaction,
    getFlagReasons: sdk.getFlagReasons,
    flagMessage: resolved({}),
    subscribeToThread: resolved('ok'),
    unsubscribeFromThread: resolved('ok'),
    // AI
    getSmartReplies: sdk.getSmartReplies,
    getConversationStarter: sdk.getConversationStarter,
    // Pin / save feature flags and caps
    isPinMessageEnabled: sdk.isPinMessageEnabled,
    isSaveMessageEnabled: sdk.isSaveMessageEnabled,
    isPinConversationEnabled: resolved(false),
    getPinnedMessagesLimit: resolved(null),
    getSavedMessagesLimit: resolved(null),
    getPinnedConversationsLimit: resolved(null),
  });
  return { ...actual, CometChat };
}

/** Put every spy back to its plain default: an empty conversation, every call succeeding. */
export function resetSdk(): void {
  sdk.messageRequests.length = 0;
  sdk.reactionRequests.length = 0;
  sdk.fetchPrevious.mockReset().mockResolvedValue([]);
  sdk.fetchNext.mockReset().mockResolvedValue([]);
  sdk.fetchReactions.mockReset().mockResolvedValue([]);
  sdk.getConversation.mockReset().mockResolvedValue({
    getLastReadMessageId: () => '',
    getUnreadMessageCount: () => 0,
    getConversationId: () => 'user_bob',
  });
  sdk.getMessageDetails.mockReset().mockRejectedValue(new Error('not found'));
  sdk.markAsDelivered.mockReset().mockResolvedValue(undefined);
  sdk.markAsRead.mockReset().mockResolvedValue(undefined);
  sdk.markConversationAsRead.mockReset().mockResolvedValue(undefined);
  sdk.markMessageAsUnread.mockReset().mockResolvedValue({});
  sdk.deleteMessage.mockReset().mockResolvedValue({});
  sdk.addReaction.mockReset().mockResolvedValue({});
  sdk.removeReaction.mockReset().mockResolvedValue({});
  sdk.getSmartReplies.mockReset().mockResolvedValue({});
  sdk.getConversationStarter.mockReset().mockResolvedValue([]);
  sdk.getFlagReasons.mockReset().mockResolvedValue([]);
  sdk.getMessageReceipts.mockReset().mockResolvedValue([]);
  sdk.isPinMessageEnabled.mockReset().mockResolvedValue(false);
  sdk.isSaveMessageEnabled.mockReset().mockResolvedValue(false);
}
