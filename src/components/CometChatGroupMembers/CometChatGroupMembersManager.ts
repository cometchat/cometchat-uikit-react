import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * CometChatGroupMembersManager — SDK wrapper for group member operations.
 *
 * No React imports. No state. Pure SDK orchestration.
 * Encapsulates member fetching, mutations (kick/ban/unban/changeScope), and listener management.
 */
export class CometChatGroupMembersManager {
  private membersRequest: CometChat.GroupMembersRequest;
  private static readonly DEFAULT_LIMIT = 30;

  /**
   * Creates a new GroupMembersManager instance.
   * @param guid - The group GUID to fetch members for.
   * @param builder - Optional GroupMembersRequestBuilder. Defaults to limit 30.
   */
  constructor(guid: string, builder?: CometChat.GroupMembersRequestBuilder) {
    const requestBuilder =
      builder ??
      new CometChat.GroupMembersRequestBuilder(guid).setLimit(
        CometChatGroupMembersManager.DEFAULT_LIMIT
      );
    this.membersRequest = requestBuilder.build();
  }

  /**
   * Fetch the next page of group members.
   * @returns Array of group members. Empty array when exhausted.
   */
  fetchNext(): Promise<CometChat.GroupMember[]> {
    return this.membersRequest.fetchNext();
  }

  /**
   * Kick a member from the group.
   * @param guid - The group GUID.
   * @param uid - The UID of the member to kick.
   * @returns Whether the operation succeeded.
   */
  static kickMember(guid: string, uid: string): Promise<boolean> {
    return CometChat.kickGroupMember(guid, uid).then(() => true);
  }

  /**
   * Ban a member from the group.
   * @param guid - The group GUID.
   * @param uid - The UID of the member to ban.
   * @returns Whether the operation succeeded.
   */
  static banMember(guid: string, uid: string): Promise<boolean> {
    return CometChat.banGroupMember(guid, uid).then(() => true);
  }

  /**
   * Unban a previously banned member.
   * @param guid - The group GUID.
   * @param uid - The UID of the member to unban.
   * @returns Whether the operation succeeded.
   */
  static unbanMember(guid: string, uid: string): Promise<boolean> {
    return CometChat.unbanGroupMember(guid, uid).then(() => true);
  }

  /**
   * Change a member's role/scope (admin, moderator, participant).
   * @param guid - The group GUID.
   * @param uid - The UID of the member.
   * @param scope - The new scope to assign.
   * @returns Whether the operation succeeded.
   */
  static changeScope(guid: string, uid: string, scope: string): Promise<boolean> {
    return CometChat.updateGroupMemberScope(guid, uid, scope as CometChat.GroupMemberScope).then(
      () => true
    );
  }

  /**
   * Attach an SDK GroupListener for real-time group member events.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for group member events.
   * @returns Cleanup function to remove the listener.
   */
  static attachGroupListener(
    listenerId: string,
    callbacks: {
      onGroupMemberJoined: (
        message: CometChat.Action,
        joinedUser: CometChat.User,
        joinedGroup: CometChat.Group
      ) => void;
      onGroupMemberLeft: (
        message: CometChat.Action,
        leavingUser: CometChat.User,
        group: CometChat.Group
      ) => void;
      onGroupMemberBanned: (
        message: CometChat.Action,
        bannedUser: CometChat.User,
        bannedBy: CometChat.User,
        bannedFrom: CometChat.Group
      ) => void;
      onGroupMemberKicked: (
        message: CometChat.Action,
        kickedUser: CometChat.User,
        kickedBy: CometChat.User,
        kickedFrom: CometChat.Group
      ) => void;
      onGroupMemberScopeChanged: (
        message: CometChat.Action,
        changedUser: CometChat.User,
        newScope: string,
        oldScope: string,
        changedGroup: CometChat.Group
      ) => void;
    }
  ): () => void {
    CometChat.addGroupListener(
      listenerId,
      new CometChat.GroupListener({
        onGroupMemberJoined: (
          message: CometChat.Action,
          joinedUser: CometChat.User,
          joinedGroup: CometChat.Group
        ) => {
          callbacks.onGroupMemberJoined(message, joinedUser, joinedGroup);
        },
        onGroupMemberLeft: (
          message: CometChat.Action,
          leavingUser: CometChat.User,
          group: CometChat.Group
        ) => {
          callbacks.onGroupMemberLeft(message, leavingUser, group);
        },
        onGroupMemberBanned: (
          message: CometChat.Action,
          bannedUser: CometChat.User,
          bannedBy: CometChat.User,
          bannedFrom: CometChat.Group
        ) => {
          callbacks.onGroupMemberBanned(message, bannedUser, bannedBy, bannedFrom);
        },
        onGroupMemberKicked: (
          message: CometChat.Action,
          kickedUser: CometChat.User,
          kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          callbacks.onGroupMemberKicked(message, kickedUser, kickedBy, kickedFrom);
        },
        onGroupMemberScopeChanged: (
          message: CometChat.Action,
          changedUser: CometChat.User,
          newScope: string,
          oldScope: string,
          changedGroup: CometChat.Group
        ) => {
          callbacks.onGroupMemberScopeChanged(
            message,
            changedUser,
            newScope,
            oldScope,
            changedGroup
          );
        },
      })
    );
    return () => {
      CometChat.removeGroupListener(listenerId);
    };
  }

  /**
   * Attach an SDK UserListener for online/offline presence updates.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for user status events.
   * @returns Cleanup function to remove the listener.
   */
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
