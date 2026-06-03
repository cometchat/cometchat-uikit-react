import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatSearchFilter } from './CometChatSearch.types';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

/**
 * CometChatSearchConversationsManager — SDK wrapper for conversation search.
 *
 * No React imports. No state. Pure SDK orchestration.
 */
export class CometChatSearchConversationsManager {
  private searchRequest: CometChat.ConversationsRequest | null = null;
  private isLoadingMore = false;

  /**
   * Build and execute a conversation search.
   * Returns the first page of results.
   */
  async search(
    keyword: string,
    filters: CometChatSearchFilter[],
    customBuilder?: CometChat.ConversationsRequestBuilder
  ): Promise<{ results: CometChat.Conversation[]; hasMore: boolean }> {
    const limit = filters.length > 0 ? 30 : 3;
    this.searchRequest = this.buildRequest(keyword, filters, customBuilder, limit);

    const results = await this.searchRequest.fetchNext();
    return {
      results,
      hasMore: results.length >= limit,
    };
  }

  /**
   * Load the next page of results.
   */
  async loadMore(): Promise<{ results: CometChat.Conversation[]; hasMore: boolean }> {
    if (this.isLoadingMore || !this.searchRequest) {
      return { results: [], hasMore: false };
    }
    this.isLoadingMore = true;
    try {
      const results = await this.searchRequest.fetchNext();
      return {
        results,
        hasMore: results.length >= 30,
      };
    } finally {
      this.isLoadingMore = false;
    }
  }

  /** Reset the request state. */
  reset(): void {
    this.searchRequest = null;
    this.isLoadingMore = false;
  }

  // ── Listener attachment (static) ──

  static attachMessageListener(
    listenerId: string,
    callbacks: {
      onMessageReceived: (msg: CometChat.BaseMessage) => void;
      onMessageEdited: (msg: CometChat.BaseMessage) => void;
      onMessageDeleted: (msg: CometChat.BaseMessage) => void;
    }
  ): () => void {
    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: callbacks.onMessageReceived,
        onMediaMessageReceived: callbacks.onMessageReceived,
        onCustomMessageReceived: callbacks.onMessageReceived,
        onMessageEdited: callbacks.onMessageEdited,
        onMessageDeleted: callbacks.onMessageDeleted,
      })
    );
    return () => {
      CometChat.removeMessageListener(listenerId);
    };
  }

  static attachUserListener(
    listenerId: string,
    callbacks: {
      onUserOnline: (user: CometChat.User) => void;
      onUserOffline: (user: CometChat.User) => void;
    }
  ): () => void {
    CometChat.addUserListener(
      listenerId,
      new CometChat.UserListener({
        onUserOnline: callbacks.onUserOnline,
        onUserOffline: callbacks.onUserOffline,
      })
    );
    return () => {
      CometChat.removeUserListener(listenerId);
    };
  }

  static attachGroupListener(
    listenerId: string,
    callbacks: {
      onGroupMemberJoined: (msg: CometChat.Action) => void;
      onGroupMemberLeft: (msg: CometChat.Action, user: CometChat.User) => void;
      onGroupMemberKicked: (msg: CometChat.Action, _: unknown, kicked: CometChat.User) => void;
      onGroupMemberBanned: (msg: CometChat.Action, banned: CometChat.User) => void;
      onMemberAddedToGroup: (msg: CometChat.Action) => void;
      onGroupMemberScopeChanged: (msg: CometChat.Action) => void;
    }
  ): () => void {
    CometChat.addGroupListener(
      listenerId,
      new CometChat.GroupListener({
        onGroupMemberJoined: callbacks.onGroupMemberJoined,
        onGroupMemberLeft: callbacks.onGroupMemberLeft,
        onGroupMemberKicked: callbacks.onGroupMemberKicked,
        onGroupMemberBanned: callbacks.onGroupMemberBanned,
        onMemberAddedToGroup: callbacks.onMemberAddedToGroup,
        onGroupMemberScopeChanged: callbacks.onGroupMemberScopeChanged,
      })
    );
    return () => {
      CometChat.removeGroupListener(listenerId);
    };
  }

  static attachTypingListener(
    listenerId: string,
    callbacks: {
      onTypingStarted: (indicator: CometChat.TypingIndicator) => void;
      onTypingEnded: (indicator: CometChat.TypingIndicator) => void;
    }
  ): () => void {
    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onTypingStarted: callbacks.onTypingStarted,
        onTypingEnded: callbacks.onTypingEnded,
      })
    );
    return () => {
      CometChat.removeMessageListener(listenerId);
    };
  }

  // ── Private helpers ──

  private buildRequest(
    keyword: string,
    filters: CometChatSearchFilter[],
    customBuilder?: CometChat.ConversationsRequestBuilder,
    limit = 30
  ): CometChat.ConversationsRequest {
    let builder = customBuilder ?? new CometChat.ConversationsRequestBuilder();
    builder = builder.setLimit(limit);

    if (keyword.trim() !== '') {
      builder = builder.setSearchKeyword(keyword);
    }
    if (filters.includes('unread')) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      builder = (builder as any).setUnread(true);
    }
    if (filters.includes('groups')) {
      builder = builder.setConversationType(CometChatUIKitConstants.MessageReceiverType.group);
    }

    return builder.build();
  }
}
