import { CometChat } from '@cometchat/chat-sdk-javascript';

const DEFAULT_LIMIT = 20;

/**
 * CometChatReactionListManager — SDK manager for the standalone reaction list.
 *
 * Fetches all reactions for a message without emoji filtering (grouping is done
 * client-side). No React imports — pure TypeScript class, testable independently.
 */
export class CometChatReactionListManager {
  private request: CometChat.ReactionsRequest | null = null;

  constructor(messageId: number, builder?: CometChat.ReactionsRequestBuilder) {
    if (!CometChat.isInitialized()) {
      this.request = null;
      return;
    }
    try {
      const requestBuilder =
        builder ?? new CometChat.ReactionsRequestBuilder().setLimit(DEFAULT_LIMIT);
      // Always fetch all reactions — grouping is done client-side
      requestBuilder.setMessageId(messageId);
      this.request = requestBuilder.build();
    } catch {
      this.request = null;
    }
  }

  /** Fetch the next page of reactions. Returns empty array when exhausted. */
  fetchNext(): Promise<CometChat.Reaction[]> {
    if (!this.request) return Promise.resolve([]);
    return this.request.fetchNext();
  }
}
