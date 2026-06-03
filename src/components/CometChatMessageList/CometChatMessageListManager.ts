import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageListManagerOptions } from './CometChatMessageList.types';

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
    if (opts.builder) {
      const builder = opts.builder;
      if (messageId !== undefined) {
        builder.setMessageId(messageId);
      }
      return builder.build();
    }

    // Default builder: construct from individual options.
    const builder = new CometChat.MessagesRequestBuilder().setLimit(opts.limit ?? 30);

    if (opts.user) {
      builder.setUID(opts.user.getUid());
    } else if (opts.group) {
      builder.setGUID(opts.group.getGuid());
    }

    if (opts.parentMessageId) {
      builder.setParentMessageId(opts.parentMessageId);
      builder.hideReplies(false);
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

  // --- Fetch ---

  /** Fetch older messages (reverse pagination). */
  async fetchPrevious(): Promise<CometChat.BaseMessage[]> {
    const result = await this.previousRequest.fetchPrevious();
    return result;
  }

  /** Fetch newer messages (forward pagination). */
  async fetchNext(): Promise<CometChat.BaseMessage[]> {
    if (!this.nextRequest) {
      return [];
    }
    return this.nextRequest.fetchNext();
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

  // --- Conversation ---

  async getConversation(): Promise<CometChat.Conversation> {
    return CometChat.getConversation(this.receiverId, this.receiverType);
  }

  // --- Accessors ---

  getReceiverId(): string {
    return this.receiverId;
  }

  getReceiverType(): string {
    return this.receiverType;
  }
}
