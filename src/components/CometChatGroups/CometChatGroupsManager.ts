import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * CometChatGroupsManager — SDK wrapper for group list operations.
 *
 * No React imports. No state. Pure SDK orchestration.
 * Encapsulates group fetching, mutations, and listener management.
 */
export class CometChatGroupsManager {
  private groupsRequest: CometChat.GroupsRequest;
  private static readonly DEFAULT_LIMIT = 30;

  /**
   * Creates a new GroupsManager instance.
   * @param builder - Optional GroupsRequestBuilder. Defaults to limit 30.
   */
  constructor(builder?: CometChat.GroupsRequestBuilder) {
    const requestBuilder =
      builder ??
      new CometChat.GroupsRequestBuilder().setLimit(CometChatGroupsManager.DEFAULT_LIMIT);
    this.groupsRequest = requestBuilder.build();
  }

  /**
   * Fetch the next page of groups.
   * @returns Array of groups. Empty array when exhausted.
   */
  fetchNext(): Promise<CometChat.Group[]> {
    return this.groupsRequest.fetchNext();
  }

  /**
   * Create a new group.
   * @param group - The group object to create.
   * @returns The created group.
   */
  static createGroup(group: CometChat.Group): Promise<CometChat.Group> {
    return CometChat.createGroup(group);
  }

  /**
   * Join a group (with optional password for password-protected groups).
   * @param guid - The group GUID.
   * @param groupType - The group type (public, private, password).
   * @param password - Optional password for password-protected groups.
   * @returns The joined group.
   */
  static joinGroup(guid: string, groupType: string, password?: string): Promise<CometChat.Group> {
    return CometChat.joinGroup(guid, groupType as CometChat.GroupType, password ?? '');
  }

  /**
   * Leave a group.
   * @param guid - The group GUID.
   * @returns Whether the operation succeeded.
   */
  static leaveGroup(guid: string): Promise<boolean> {
    return CometChat.leaveGroup(guid);
  }

  /**
   * Delete a group (owner only).
   * @param guid - The group GUID.
   * @returns Whether the operation succeeded.
   */
  static deleteGroup(guid: string): Promise<boolean> {
    return CometChat.deleteGroup(guid);
  }

  /**
   * Attach an SDK GroupListener for real-time group events.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for group events.
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
      onGroupDeleted?: (group: CometChat.Group) => void;
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
