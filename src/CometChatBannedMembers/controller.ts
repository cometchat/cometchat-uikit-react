import { CometChat } from "@cometchat-pro/chat";
import { Action } from ".";
import React from "react";

type Args = {
    bannedMembersRequestBuilder : CometChat.BannedMembersRequestBuilder | null,
    searchRequestBuilder : CometChat.BannedMembersRequestBuilder | null,
    searchText : string,
    groupGuid : string
};

export class BannedMembersManager {
    private bannedMembersRequest : CometChat.BannedMembersRequest;
    
    /**
     * Set `bannedMembersRequest` of the instance
     */
    constructor(args : Args) {
        const {
            bannedMembersRequestBuilder,
            searchRequestBuilder,
            searchText,
            groupGuid
        } = args;

        let finalBannedMembersRequestBuilder = bannedMembersRequestBuilder || new CometChat.BannedMembersRequestBuilder(groupGuid).setLimit(30);
        if (searchText !== "") {
            finalBannedMembersRequestBuilder = searchRequestBuilder || finalBannedMembersRequestBuilder;
            finalBannedMembersRequestBuilder.setSearchKeyword(searchText);
        }
        this.bannedMembersRequest = finalBannedMembersRequestBuilder.build();
    }

    /**
     * Calls `fetchNext` method of the set `bannedMembersRequest` 
     */
    fetchNext() : Promise<CometChat.GroupMember[]> {
        return this.bannedMembersRequest.fetchNext();
    }

    /**
     * Creates `CometChat.GroupMember` instance
     */
    static createGroupMemberFromUser(user : CometChat.User, group : CometChat.Group) : CometChat.GroupMember {
        const groupMember = new CometChat.GroupMember(user.getUid());
        groupMember.setName(user.getName());
        groupMember.setAvatar(user.getAvatar());
        groupMember.setGuid(group.getGuid());
        return groupMember;
    }

    /**
     * Attaches an SDK group listener
     * 
     * @returns - Function to remove the added SDK group listener
     */
    static attachSDKGroupListener(groupRef : React.MutableRefObject<CometChat.Group>, dispatch : React.Dispatch<Action>) : () => void {
        const listenerId = "BannedMembers_GroupListener_" + String(Date.now());
        CometChat.addGroupListener(
            listenerId,
            new CometChat.GroupListener({
                onGroupMemberBanned: (
                    message : CometChat.Action,
                    bannedUser : CometChat.User,
                    bannedBy : CometChat.User,
                    bannedFrom : CometChat.Group
                ) => {
                    if (groupRef.current.getGuid() !== bannedFrom.getGuid()) {
                        return;
                    }
                    dispatch({type: "addMember", member: BannedMembersManager.createGroupMemberFromUser(bannedUser, groupRef.current)});
                },
                onGroupMemberUnbanned: (
                    message : CometChat.Action,
                    unbannedUser : CometChat.User,
                    unbannedBy : CometChat.User,
                    unbannedFrom : CometChat.Group
                ) => {
                    if (groupRef.current.getGuid() !== unbannedFrom.getGuid()) {
                        return;
                    }
                    dispatch({type: "removeBannedMemberIfPresent", bannedMemberUid: unbannedUser.getUid()});
                }
            })
        );
        return () => CometChat.removeGroupListener(listenerId);
    }

    /**
     * Attaches an SDK user listener
     * 
     * @returns - Function to remove the added SDK user listener
     */
    static attachSDKUserListener(dispatch : React.Dispatch<Action>) : () => void {
        const listenerId = "BannedMembers_UserListener_" + String(Date.now());
        const cb = (user : CometChat.User) => dispatch({type: "updateMemberStatusIfPresent", member: user});
        CometChat.addUserListener(
            listenerId,
            new CometChat.UserListener({
                onUserOnline: cb, 
                onUserOffline: cb
            })
        );
        return () => CometChat.removeUserListener(listenerId);
    }
}
