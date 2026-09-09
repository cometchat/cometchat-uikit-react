import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Page size for a saved-messages read.
 */
export const SAVED_MESSAGES_PAGE_SIZE = 30;
const SAVE_LIMIT = SAVED_MESSAGES_PAGE_SIZE;

/**
 * CometChatSavedMessagesManager — SDK wrapper for the user's saved messages.
 *
 * Reads through `MessagesRequestBuilder.setSaved(true)`.
 *
 * Deliberately sets NO uid/guid — saves are user-level and span conversations, and
 * leaving both unset is what routes to the bare messages endpoint. Each row
 * carries its own receiver, so it can be rendered and deep-linked on its own.
 */
export class CometChatSavedMessagesManager {
  private request: CometChat.MessagesRequest | null = null;
  private isFetching = false;
  /** Set once a fetch comes back short — there is nothing further to ask for. */
  private exhausted = false;
  /** The limit actually in force; a caller's builder may set its own. */
  private pageSize = SAVE_LIMIT;

  constructor(private readonly builder?: CometChat.MessagesRequestBuilder) {}

  /**
   * Start a fresh read. Saves come back newest-save first.
   *
   * A caller-supplied builder is used as-is apart from `setSaved(true)`, which is
   * re-asserted because without it this is an ordinary history read. Everything
   * else — page size above all — stays the caller's choice.
   */
  async fetchFirst(): Promise<{ messages: CometChat.BaseMessage[]; hasMore: boolean }> {
    const builder = this.builder ?? new CometChat.MessagesRequestBuilder().setLimit(SAVE_LIMIT);
    this.request = builder.setSaved(true).build();
    // Read the limit back off the built request: only it exposes a getter, and a
    // caller's builder may carry its own page size.
    this.pageSize =
      typeof this.request.getLimit === 'function' ? this.request.getLimit() : SAVE_LIMIT;
    this.exhausted = false;
    return this.fetchNext();
  }

  /**
   * Fetch the next page.
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
      // Latch on a short page so a later call cannot loop against an empty tail.
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
