import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Page size for a pinned read.
 */
export const PINNED_MESSAGES_PAGE_SIZE = 30;
const PIN_LIMIT = PINNED_MESSAGES_PAGE_SIZE;

/**
 * CometChatPinnedMessagesManager — SDK wrapper for one conversation's pinned list.
 *
 * Reads through `MessagesRequestBuilder.setPinned(true)`.
 *
 * `setUID` and `setGUID` are mutually exclusive, so the manager is constructed
 * with exactly one of them.
 */
export class CometChatPinnedMessagesManager {
  private request: CometChat.MessagesRequest | null = null;
  private isFetching = false;
  /** Set once a fetch comes back short — there is nothing further to ask for. */
  private exhausted = false;

  /** The limit actually in force; a caller's builder may set its own. */
  private pageSize = PIN_LIMIT;

  constructor(
    private readonly uid?: string,
    private readonly guid?: string,
    private readonly builder?: CometChat.MessagesRequestBuilder
  ) {}

  /**
   * Read the conversation's pins, newest pin first.
   *
   * A caller-supplied builder is used as-is apart from `setPinned(true)` and the
   * conversation scope, both of which are re-asserted — without them this is an
   * ordinary history read of the wrong chat.
   */
  async fetchFirst(): Promise<{ messages: CometChat.BaseMessage[]; hasMore: boolean }> {
    const builder = this.builder ?? new CometChat.MessagesRequestBuilder().setLimit(PIN_LIMIT);
    builder.setPinned(true);
    if (this.guid) {
      builder.setGUID(this.guid);
    } else if (this.uid) {
      builder.setUID(this.uid);
    } else {
      // Pins are conversation-scoped; without a scope there is nothing to ask for.
      return { messages: [], hasMore: false };
    }
    this.request = builder.build();
    this.pageSize =
      typeof this.request.getLimit === 'function' ? this.request.getLimit() : PIN_LIMIT;
    this.exhausted = false;
    return this.fetchNext();
  }

  /**
   * Fetch the next page. A full page means "there may be more"; a short one ends
   * it.
   */
  async fetchNext(): Promise<{ messages: CometChat.BaseMessage[]; hasMore: boolean }> {
    // A call that lands while one is already running reports "still more" — it
    // knows nothing about the tail. Saying `false` here would write an exhausted
    // flag into state off the back of a request that never happened; the real
    // fetch usually corrects it a tick later, but if that fetch then FAILS the
    // false sticks and pagination is dead.
    if (this.isFetching) return { messages: [], hasMore: true };
    if (!this.request || this.exhausted) {
      return { messages: [], hasMore: false };
    }
    this.isFetching = true;
    try {
      const messages = await this.request.fetchPrevious();
      const hasMore = messages.length >= this.pageSize;
      if (!hasMore) this.exhausted = true;
      return { messages, hasMore };
    } finally {
      this.isFetching = false;
    }
  }

  reset(): void {
    this.request = null;
    this.isFetching = false;
    this.exhausted = false;
  }
}
