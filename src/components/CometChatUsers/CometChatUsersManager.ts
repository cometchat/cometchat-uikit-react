import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * CometChatUsersManager — SDK wrapper for user list operations.
 *
 * No React imports. No state. Pure SDK orchestration.
 * Encapsulates user fetching and listener management.
 */
export class CometChatUsersManager {
  private usersRequest: CometChat.UsersRequest;
  private static readonly DEFAULT_LIMIT = 30;

  /**
   * Creates a new UsersManager instance.
   * @param builder - Optional UsersRequestBuilder. Defaults to limit 30.
   */
  constructor(builder?: CometChat.UsersRequestBuilder) {
    const requestBuilder =
      builder ?? new CometChat.UsersRequestBuilder().setLimit(CometChatUsersManager.DEFAULT_LIMIT);
    this.usersRequest = requestBuilder.build();
  }

  /**
   * Fetch the next page of users.
   * @returns Array of users. Empty array when exhausted.
   */
  fetchNext(): Promise<CometChat.User[]> {
    return this.usersRequest.fetchNext();
  }

  /**
   * Attach an SDK UserListener for online/offline status updates.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for user status events.
   * @returns Cleanup function to remove the listener.
   */
  static attachUserStatusListener(
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

  /**
   * Attach an SDK ConnectionListener for reconnect recovery.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for connection events.
   * @returns Cleanup function to remove the listener.
   */
  static attachConnectionListener(
    listenerId: string,
    callbacks: {
      onConnected: () => void;
      onDisconnected?: () => void;
    }
  ): () => void {
    CometChat.addConnectionListener(
      listenerId,
      new CometChat.ConnectionListener({
        onConnected: callbacks.onConnected,
        onDisconnected:
          callbacks.onDisconnected ??
          (() => {
            /* no-op */
          }),
      })
    );
    return () => {
      CometChat.removeConnectionListener(listenerId);
    };
  }
}
