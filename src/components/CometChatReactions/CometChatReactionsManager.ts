import { CometChat } from '@cometchat/chat-sdk-javascript';

const DEFAULT_LIMIT = 20;

/**
 * CometChatReactionsManager — SDK manager for reaction operations.
 *
 * Encapsulates all SDK interactions for fetching reactor details.
 * No React imports — pure TypeScript class, testable independently.
 */
export class CometChatReactionsManager {
  private request: CometChat.ReactionsRequest | null = null;

  constructor(messageId: number, emoji?: string, builder?: CometChat.ReactionsRequestBuilder) {
    if (!CometChat.isInitialized()) {
      this.request = null;
      return;
    }
    try {
      // Always create a fresh builder to avoid mutation issues across calls
      const requestBuilder = new CometChat.ReactionsRequestBuilder().setLimit(DEFAULT_LIMIT);
      requestBuilder.setMessageId(messageId);
      if (emoji && emoji !== 'all') {
        requestBuilder.setReaction(emoji);
      }
      // Apply custom limit from provided builder if available
      if (builder) {
        const customLimit = (builder as unknown as { limit?: number }).limit;
        if (customLimit) {
          requestBuilder.setLimit(customLimit);
        }
      }
      this.request = requestBuilder.build();
    } catch {
      this.request = null;
    }
  }

  /** Fetch the next page of reactors. Returns empty array when exhausted. */
  fetchNext(): Promise<CometChat.Reaction[]> {
    if (!this.request) return Promise.resolve([]);
    return this.request.fetchNext();
  }
}
