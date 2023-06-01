import { CometChat } from "@cometchat-pro/chat";
import React from "react";
import { Action } from ".";

type Args = {
    searchText : string,
    groupsRequestBuilder : CometChat.GroupsRequestBuilder,
    searchRequestBuilder : CometChat.GroupsRequestBuilder | null,
};

export class GroupsManager {
    private groupsRequest : CometChat.GroupsRequest;
    private static loggedInUser : CometChat.User | null | undefined;

    /**
     * Set `groupsRequest` of the instance
     */
    constructor(args : Args) {
        const {
            searchText,
            groupsRequestBuilder,
            searchRequestBuilder
        } = args;
        let tmpGrpReqBuilder : CometChat.GroupsRequestBuilder;
        if (searchText.length === 0) {
            tmpGrpReqBuilder = groupsRequestBuilder;
        }
        else {
            tmpGrpReqBuilder = searchRequestBuilder !== null ? searchRequestBuilder : groupsRequestBuilder;
            tmpGrpReqBuilder.setSearchKeyword(searchText);
        }
        this.groupsRequest = tmpGrpReqBuilder.build();
    }

    /**
     * Calls `fetchNext` method of the set `groupsRequest` 
     */
    fetchNext() {
        return this.groupsRequest.fetchNext();
    }

    /**
     * Sets `loggedInUser` of the instance
     * @returns The logged-in user
     */
    private static async getLoggedInUser() {
        if (this.loggedInUser === undefined) {
            this.loggedInUser = await CometChat.getLoggedinUser();
        }
        return this.loggedInUser;
    }

    /**
     * Creates an SDK group listener
     */
    private static createGroupListener(dispatch : React.Dispatch<Action>) { 
        return new CometChat.GroupListener({
            onGroupMemberJoined: async (message : CometChat.Action, joinedUser : CometChat.User, joinedGroup : CometChat.Group) => {
                if (joinedUser.getUid() === (await GroupsManager.getLoggedInUser())?.getUid()) {
                    joinedGroup.setHasJoined(true);
                }
                dispatch({type: "updateGroup", group: joinedGroup});
            },
            onGroupMemberLeft: async (message : CometChat.Action, leavingUser : CometChat.User, groupLeft : CometChat.Group) => {
                if (leavingUser.getUid() === (await GroupsManager.getLoggedInUser())?.getUid()) {
                    groupLeft.setHasJoined(false);
                }
                dispatch({type: "updateGroup", group: groupLeft});
            },
            onMemberAddedToGroup: async (message : CometChat.Action, userAdded : CometChat.User, userAddedBy : CometChat.User, userAddedIn : CometChat.Group) => {
                if (userAdded.getUid() === (await GroupsManager.getLoggedInUser())?.getUid()) {
                    userAddedIn.setHasJoined(true);
                }
                dispatch({type: "updateGroup", group: userAddedIn});
            },
            onGroupMemberKicked: async (message : CometChat.Action, kickedUser : CometChat.User, kickedBy : CometChat.User, kickedFrom : CometChat.Group) => {
                if (kickedUser.getUid() === (await GroupsManager.getLoggedInUser())?.getUid()) {
                    kickedFrom.setHasJoined(false);
                }
                dispatch({type: "updateGroup", group: kickedFrom});
            },
            onGroupMemberBanned: async (message : CometChat.Action, bannedUser : CometChat.User, bannedBy : CometChat.User, bannedFrom : CometChat.Group) => {
                if (bannedUser.getUid() === (await GroupsManager.getLoggedInUser())?.getUid()) {
                    dispatch({type: "removeGroup", guid: bannedFrom.getGuid()});
                }
                else {
                    dispatch({type: "updateGroup", group: bannedFrom});
                }
            },
            onGroupMemberUnbanned: async (message : CometChat.Action, unbannedUser : CometChat.User, unbannedBy : CometChat.User, unbannedFrom : CometChat.Group) => {
                if (unbannedUser.getUid() === (await GroupsManager.getLoggedInUser())?.getUid()) {
                    unbannedFrom.setHasJoined(false);
                    dispatch({type: "prependGroup", group: unbannedFrom});
                }
            },
            onGroupMemberScopeChanged: async (message : CometChat.Action, changedUser : CometChat.User, newScope : CometChat.GroupMemberScope, oldScope : CometChat.GroupMemberScope, changedGroup : CometChat.Group) => {
                if (changedUser.getUid() === (await GroupsManager.getLoggedInUser())?.getUid()) {
                    changedGroup.setScope(newScope);
                }
                dispatch({type: "updateGroup", group: changedGroup});
            }
        });
    }

    /**
     * Attaches an SDK group listener
     * 
     * @returns Function to call to remove the attached SDK group listener 
     */
    static attachListeners(dispatch : React.Dispatch<Action>) {
        const listenerId = "GroupsList_" + String(Date.now());
        CometChat.addGroupListener(listenerId, GroupsManager.createGroupListener(dispatch));
        return () => CometChat.removeGroupListener(listenerId);
    }
} 
