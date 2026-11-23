import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageListManagerOptions } from './CometChatMessageList.types';
import { copyRequestBuilder } from '../../utils/copyRequestBuilder';
import { fetchTwoPhase, type TwoPhaseHandlers } from '../../utils/offline/two-phase';
import { isOfflineOn, makeSdkListener } from '../../utils/offline/gate';

/**
 * A two-phase page read of the message list. `rawPage` is what the read
 * returned before the kit's client filter (absent when nothing was filtered):
 * paging and delete-by-omission go by it, never by the filtered count.
 */
export interface MessagePageHandlers {
  onCached(page: CometChat.BaseMessage[], rawPage?: CometChat.BaseMessage[]): void;
  onServer(page: CometChat.BaseMessage[], rawPage?: CometChat.BaseMessage[]): void;
  onError(error: unknown, notConnected: boolean): void;
}

/**
 * CometChatMessageListManager — SDK wrapper for message list operations.
 *
 * No React imports. No state. Pure SDK orchestration.
 * Maintains two MessagesRequest instances: one for fetchPrevious (older),
 * one for fetchNext (newer). Both are built from the same configuration.
 */
export class CometChatMessageListManager {
  private previousRequest: CometChat.MessagesRequest;
  private nextRequest: CometChat.MessagesRequest | null = null;
  private readonly receiverType: string;
  private readonly receiverId: string;
  private readonly builderConfig: CometChatMessageListManagerOptions;
  /** Requests the kit filters on the client: see {@link buildCacheableRequest}. */
  private readonly clientFiltered = new WeakSet<CometChat.MessagesRequest>();

  constructor(options: CometChatMessageListManagerOptions) {
    this.builderConfig = options;
    this.receiverType = options.user ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    this.receiverId = options.user
      ? options.user.getUid()
      : options.group
        ? options.group.getGuid()
        : '';

    this.previousRequest = this.buildRequest();
  }

  /** Build a MessagesRequest from the stored config. */
  private buildRequest(messageId?: number): CometChat.MessagesRequest {
    const opts = this.builderConfig;

    // If a custom builder was provided, use it as the base.
    // Only set messageId for pagination — all other config is the consumer's responsibility.
    // The anchor is set on a copy: the consumer's builder is never changed.
    if (opts.builder) {
      const builder = copyRequestBuilder(opts.builder);
      if (messageId !== undefined) {
        builder.setMessageId(messageId);
      }
      return builder.build();
    }

    // Offline support: a default top-level list asks in the form the SDK caches.
    if (!opts.parentMessageId && isOfflineOn()) {
      return this.buildCacheableRequest(messageId);
    }

    // Default builder: construct from individual options.
    const builder = new CometChat.MessagesRequestBuilder()
      .setLimit(opts.limit ?? 30)
      .hideDeletedMessages(true);

    if (opts.user) {
      builder.setUID(opts.user.getUid());
    } else if (opts.group) {
      builder.setGUID(opts.group.getGuid());
    }

    if (opts.parentMessageId) {
      builder.setParentMessageId(opts.parentMessageId);
      builder.hideReplies(false);
      // Only agent chat wants the parent in the reply list; in an ordinary
      // thread it would render twice — once in the header, once as message one.
      builder.withParent(opts.isAgentChat === true);
    } else {
      builder.hideReplies(true);
    }

    if (opts.messageTypes) {
      builder.setTypes(opts.messageTypes);
    }
    if (opts.messageCategories) {
      builder.setCategories(opts.messageCategories);
    }

    if (messageId !== undefined) {
      builder.setMessageId(messageId);
    }

    return builder.build();
  }

  /**
   * Offline (ON) path only. The SDK writes a fetched page to its cache only when
   * `hideReplies` is the page's sole content filter, so the default list sends
   * just that and applies its types, categories and hide-deleted itself, to
   * both phases ({@link matchesDefaultFilters}). A consumer's builder and thread
   * lists never come here.
   */
  private buildCacheableRequest(messageId?: number): CometChat.MessagesRequest {
    const opts = this.builderConfig;
    const builder = new CometChat.MessagesRequestBuilder()
      .setLimit(opts.limit ?? 30)
      .hideReplies(true);
    if (opts.user) {
      builder.setUID(opts.user.getUid());
    } else if (opts.group) {
      builder.setGUID(opts.group.getGuid());
    }
    if (messageId !== undefined) {
      builder.setMessageId(messageId);
    }
    const request = builder.build();
    this.clientFiltered.add(request);
    return request;
  }

  /** The filters a default request would otherwise have asked the server for. */
  private matchesDefaultFilters(message: CometChat.BaseMessage): boolean {
    const { messageTypes, messageCategories } = this.builderConfig;
    if (message.getDeletedAt()) return false;
    if (messageTypes?.length && !messageTypes.includes(message.getType())) return false;
    if (messageCategories?.length && !messageCategories.includes(message.getCategory())) {
      return false;
    }
    return true;
  }

  private filterPage(
    request: CometChat.MessagesRequest,
    page: CometChat.BaseMessage[]
  ): CometChat.BaseMessage[] {
    if (!this.clientFiltered.has(request)) return page;
    return page.filter(message => this.matchesDefaultFilters(message));
  }

  private filteredHandlers(
    request: CometChat.MessagesRequest,
    handlers: MessagePageHandlers
  ): TwoPhaseHandlers<CometChat.BaseMessage> {
    return {
      onCached: page => {
        handlers.onCached(this.filterPage(request, page), page);
      },
      onServer: page => {
        handlers.onServer(this.filterPage(request, page), page);
      },
      onError: (error, notConnected) => {
        handlers.onError(error, notConnected);
      },
    };
  }

  // --- Fetch ---

  /** Fetch older messages (reverse pagination). */
  async fetchPrevious(): Promise<CometChat.BaseMessage[]> {
    const request = this.previousRequest;
    const result = await request.fetchPrevious();
    // A request built before a kill switch still needs the filter it left out.
    return this.filterPage(request, result);
  }

  /** Fetch newer messages (forward pagination). */
  async fetchNext(): Promise<CometChat.BaseMessage[]> {
    if (!this.nextRequest) {
      return [];
    }
    const request = this.nextRequest;
    return this.filterPage(request, await request.fetchNext());
  }

  /**
   * Initialize the next request for forward pagination from a given messageId.
   * Call this after fetching around a messageId to enable fetchNext().
   */
  initNextRequest(messageId: number): void {
    this.nextRequest = this.buildRequest(messageId);
  }

  /**
   * Fetch messages around a specific messageId (bidirectional).
   * SDK's setMessageId is exclusive — fetchPrevious returns messages BEFORE the target,
   * fetchNext returns messages AFTER the target.
   * We fetch the target message separately and combine all three sets.
   *
   * Returns `{ messages, hasMoreNewer }` so callers can determine if there are
   * newer messages beyond the fetched window.
   */
  async fetchAroundMessageId(
    messageId: number
  ): Promise<{ messages: CometChat.BaseMessage[]; hasMoreNewer: boolean }> {
    // 1. Build request anchored at messageId and fetch messages BEFORE the target
    const request = this.buildRequest(messageId);
    this.previousRequest = request;
    const previousMessages = await request.fetchPrevious();

    // 2. Fetch the target message itself (setMessageId is exclusive)
    let targetMessage: CometChat.BaseMessage | null = null;
    try {
      const details = await CometChat.getMessageDetails(String(messageId));
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (details) {
        targetMessage = details as CometChat.BaseMessage;
      }
    } catch {
      // Target message might not exist — proceed without it
    }

    // 3. Initialize next request and fetch messages AFTER the target
    this.nextRequest = this.buildRequest(messageId);
    const nextMessages = await this.nextRequest.fetchNext();

    // 4. Combine: previous + target + next
    const allMessages: CometChat.BaseMessage[] = [...previousMessages];
    if (targetMessage) {
      allMessages.push(targetMessage);
    }
    allMessages.push(...nextMessages);

    // hasMoreNewer: if we got a full page of next messages, there are likely more
    const limit = this.builderConfig.limit ?? 30;
    const hasMoreNewer = nextMessages.length >= limit;

    return { messages: allMessages, hasMoreNewer };
  }

  // --- Offline support (two-phase reads; used only with offline on) ---

  /**
   * Two-phase older page: the device cache, then the server, then one
   * terminal. Never used with offline off, where {@link fetchPrevious} keeps
   * today's single fetch.
   */
  fetchPreviousTwoPhase(handlers: MessagePageHandlers): Promise<void> {
    const request = this.previousRequest;
    return fetchTwoPhase(request, 'previous', 'messages', this.filteredHandlers(request, handlers));
  }

  /** Two-phase newer page from the current next-request cursor. */
  fetchNextTwoPhase(handlers: MessagePageHandlers): Promise<void> {
    if (!this.nextRequest) {
      handlers.onServer([]);
      return Promise.resolve();
    }
    const request = this.nextRequest;
    return fetchTwoPhase(request, 'next', 'messages', this.filteredHandlers(request, handlers));
  }

  /** The page size a server-side filter would have filled. */
  getPageLimit(): number {
    return this.builderConfig.limit ?? 30;
  }

  /**
   * Point the older-page request at `messageId` (exclusive), or at the newest
   * messages when absent. Cursors always anchor on a row with a server id.
   */
  resetPreviousRequest(messageId?: number): void {
    this.previousRequest = this.buildRequest(messageId);
  }

  // --- Send ---

  async sendTextMessage(
    text: string,
    parentMessageId?: number,
    richTextHtml?: string
  ): Promise<CometChat.BaseMessage> {
    const msg = new CometChat.TextMessage(this.receiverId, text, this.receiverType);
    if (parentMessageId) {
      msg.setParentMessageId(parentMessageId);
    }
    if (richTextHtml && richTextHtml.trim().length > 0) {
      msg.setMetadata({ richText: { html: richTextHtml, hasFormatting: true } });
    }
    return CometChat.sendMessage(msg);
  }

  async sendMediaMessage(
    file: File,
    type: string,
    parentMessageId?: number
  ): Promise<CometChat.BaseMessage> {
    const msg = new CometChat.MediaMessage(this.receiverId, file, type, this.receiverType);
    if (parentMessageId) {
      msg.setParentMessageId(parentMessageId);
    }
    return CometChat.sendMediaMessage(msg) as Promise<CometChat.BaseMessage>;
  }

  // --- Edit / Delete ---

  async editMessage(message: CometChat.BaseMessage): Promise<CometChat.BaseMessage> {
    return CometChat.editMessage(message);
  }

  async deleteMessage(messageId: number): Promise<CometChat.BaseMessage> {
    return CometChat.deleteMessage(String(messageId));
  }

  // --- Read receipts ---

  async markAsRead(message: CometChat.BaseMessage): Promise<void> {
    await CometChat.markAsRead(message);
  }

  async markConversationAsRead(): Promise<void> {
    await CometChat.markConversationAsRead(this.receiverId, this.receiverType);
  }

  async markAsDelivered(message: CometChat.BaseMessage): Promise<void> {
    await CometChat.markAsDelivered(message);
  }

  /** Mark a message as unread. Returns the updated conversation. */
  async markMessageAsUnread(message: CometChat.BaseMessage): Promise<CometChat.Conversation> {
    return CometChat.markMessageAsUnread(message);
  }

  // --- Message details ---

  /**
   * Offline support only: one message by id, two-phase: resolves with the
   * device's copy when it has one (offline too), else with the server's, else
   * `null` (not cached and not reachable). Never rejects; `onFail` hears why it
   * answered `null`.
   */
  getMessageDetailsTwoPhase(
    messageId: number,
    onFail?: (error: unknown) => void
  ): Promise<CometChat.BaseMessage | null> {
    return new Promise(resolve => {
      let settled = false;
      const settle = (message: unknown) => {
        if (settled) return;
        settled = true;
        resolve((message as CometChat.BaseMessage | null | undefined) ?? null);
      };
      const fail = (error: unknown) => {
        if (!settled) onFail?.(error);
        settle(null);
      };
      const listener = makeSdkListener('MessageDetailsListener', {
        onCachedMessage: (message: unknown) => {
          if (message) settle(message);
        },
        onServerMessage: settle,
        onError: fail,
      });
      try {
        // The 4.3 listener overload, reached untyped (the peer floor is 4.2).
        const sdk = CometChat as unknown as {
          getMessageDetails: (id: string, listener: object) => Promise<CometChat.BaseMessage>;
        };
        sdk.getMessageDetails(String(messageId), listener).then(settle, fail);
      } catch (error) {
        fail(error);
      }
    });
  }

  // --- Conversation ---

  async getConversation(): Promise<CometChat.Conversation> {
    return CometChat.getConversation(this.receiverId, this.receiverType);
  }

  /**
   * Offline support only: the conversation two-phase (BEH-READ-32): resolves
   * with the device's copy when it has one (so a cached chat opens at once,
   * with its unread anchor, even offline), else with the server's, else
   * `null`. Never rejects.
   */
  getConversationTwoPhase(): Promise<CometChat.Conversation | null> {
    return new Promise(resolve => {
      let settled = false;
      const settle = (conversation: unknown) => {
        if (settled) return;
        settled = true;
        resolve((conversation as CometChat.Conversation | null | undefined) ?? null);
      };
      const listener = makeSdkListener('ConversationDetailsListener', {
        onCachedConversation: (conversation: unknown) => {
          if (conversation) settle(conversation);
        },
        onServerConversation: settle,
        onError: () => {
          settle(null);
        },
      });
      try {
        // The 4.3 listener overload, reached untyped (the peer floor is 4.2).
        const sdk = CometChat as unknown as {
          getConversation: (
            id: string,
            type: string,
            listener: object
          ) => Promise<CometChat.Conversation>;
        };
        sdk.getConversation(this.receiverId, this.receiverType, listener).then(settle, () => {
          settle(null);
        });
      } catch {
        settle(null);
      }
    });
  }

  // --- Accessors ---

  getReceiverId(): string {
    return this.receiverId;
  }

  getReceiverType(): string {
    return this.receiverType;
  }
}
