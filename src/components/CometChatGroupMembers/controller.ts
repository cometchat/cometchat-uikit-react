import { CometChatUIKitConstants } from './../../constants/CometChatUIKitConstants';
import { Action } from "./CometChatGroupMembers";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import React from "react";

type Args = {
    searchText: string,
    groupMemberRequestBuilder: CometChat.GroupMembersRequestBuilder | null,
    searchRequestBuilder: CometChat.GroupMembersRequestBuilder | null,
    groupGuid: string,
    groupMembersSearchText: React.MutableRefObject<string>
};

export class GroupMembersManager {
    private groupMembersRequest: CometChat.GroupMembersRequest;

    /**
     * Sets `groupMembersRequest` of the instance
     */
    constructor(args: Args) {
        const {
            searchText,
            groupMemberRequestBuilder,
            searchRequestBuilder,
            groupGuid,
            groupMembersSearchText
        } = args;
        let finalGroupRequestBuilder = groupMemberRequestBuilder || new CometChat.GroupMembersRequestBuilder(groupGuid).setLimit(30);
        if (searchText && searchRequestBuilder) {
            finalGroupRequestBuilder = searchRequestBuilder;
            finalGroupRequestBuilder.setSearchKeyword(searchText)
        } else if (searchText && !searchRequestBuilder && groupMemberRequestBuilder) {
            finalGroupRequestBuilder = groupMemberRequestBuilder;
            finalGroupRequestBuilder.setSearchKeyword(searchText)
        } else if (!searchText && groupMemberRequestBuilder && searchRequestBuilder) {
            finalGroupRequestBuilder = groupMemberRequestBuilder;
            finalGroupRequestBuilder.setSearchKeyword(groupMembersSearchText.current)
        } else if (!searchText && groupMemberRequestBuilder && !searchRequestBuilder) {
            finalGroupRequestBuilder = groupMemberRequestBuilder;
            finalGroupRequestBuilder.setSearchKeyword(groupMembersSearchText.current)
        } else if (!searchText && !groupMemberRequestBuilder && searchRequestBuilder) {
            finalGroupRequestBuilder.setSearchKeyword(groupMembersSearchText.current)
        } else {
            finalGroupRequestBuilder.setSearchKeyword(searchText)
        }
        this.groupMembersRequest = finalGroupRequestBuilder.build();
    }

    /**
     * Calls `fetchNext` method of the set `groupMembersRequest`
     */
    fetchNext(): Promise<CometChat.GroupMember[]> {
        return this.groupMembersRequest.fetchNext();
    }

    getCurrentPage(): number {
        return (this.groupMembersRequest as any).pagination.current_page;
    }

    /**
     * Attaches an SDK user listener
     *
     * @returns Function to call to remove the attached SDK user listener
     */
    static attachUserListener(callback: (user: CometChat.User) => void): () => void {
        const listenerId = "GroupMembers_User_" + String(Date.now());
        CometChat.addUserListener(
            listenerId,
            new CometChat.UserListener({
                onUserOnline: callback,
                onUserOffline: callback
            })
        );
        return () => CometChat.removeUserListener(listenerId);
    }

    /**
     * Creates a `CometChat.GroupMember` instance from the provided `user` and `group`
     */
    static createParticipantGroupMember(user: CometChat.User, group: CometChat.Group): CometChat.GroupMember {
        const groupMember = new CometChat.GroupMember(user.getUid(), CometChatUIKitConstants.groupMemberScope.participant);
        groupMember.setName(user.getName());
        groupMember.setGuid(group.getGuid());
        groupMember.setUid(user.getUid());
        groupMember.setAvatar(user?.getAvatar())
        groupMember.setStatus(user.getStatus());
        return groupMember;
    }

    /**
     * Attaches an SDK user listener
     *
     * @returns Function to call to remove the attached SDK user listener
     */
    static attachGroupListener(groupGuid: string, dispatch: React.Dispatch<Action>): () => void {
        const listenerId = "GroupMembers_Group_" + String(Date.now());
        CometChat.addGroupListener(
            listenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (
                    message: CometChat.Action,
                    changedUser: CometChat.GroupMember,
                    newScope: CometChat.GroupMemberScope,
                    oldScope: CometChat.GroupMemberScope,
                    changedGroup: CometChat.Group
                ) => {
                    if (changedGroup.getGuid() !== groupGuid) {
                        return;
                    }
                    dispatch({ type: "updateGroupMemberScopeIfPresent", groupMemberUid: changedUser.getUid(), newScope });
                },
                onGroupMemberKicked: (
                    message: CometChat.Action,
                    kickedUser: CometChat.User,
                    kickedBy: CometChat.User,
                    kickedFrom: CometChat.Group
                ) => {
                    if (kickedFrom.getGuid() !== groupGuid) {
                        return;
                    }
                    dispatch({ type: "removeGroupMemberIfPresent", groupMemberUid: kickedUser.getUid() });
                },
                onGroupMemberBanned: (
                    message: CometChat.Action,
                    bannedUser: CometChat.User,
                    bannedBy: CometChat.User,
                    bannedFrom: CometChat.Group
                ) => {
                    if (bannedFrom.getGuid() !== groupGuid) {
                        return;
                    }
                    dispatch({ type: "removeGroupMemberIfPresent", groupMemberUid: bannedUser.getUid() });
                },
                onMemberAddedToGroup: (
                    message: CometChat.Action,
                    userAdded: CometChat.User,
                    userAddedBy: CometChat.User,
                    userAddedIn: CometChat.Group
                ) => {
                    if (userAddedIn.getGuid() !== groupGuid) {
                        return;
                    }
                    dispatch({ type: "appendGroupMember", groupMember: GroupMembersManager.createParticipantGroupMember(userAdded, userAddedIn) });
                },
                onGroupMemberLeft: (
                    message: CometChat.Action,
                    leavingUser: CometChat.User,
                    group: CometChat.Group
                ) => {
                    if (group.getGuid() !== groupGuid) {
                        return;
                    }
                    dispatch({ type: "removeGroupMemberIfPresent", groupMemberUid: leavingUser.getUid() });
                },
                onGroupMemberJoined: (
                    message: CometChat.Action,
                    joinedUser: CometChat.User,
                    joinedGroup: CometChat.Group
                ) => {
                    if (joinedGroup.getGuid() !== groupGuid) {
                        return;
                    }
                    dispatch({ type: "appendGroupMember", groupMember: GroupMembersManager.createParticipantGroupMember(joinedUser, joinedGroup) });
                }
            })
        );
        return () => CometChat.removeGroupListener(listenerId);
    }
}
