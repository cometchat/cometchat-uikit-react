import { CometChat } from "@cometchat/chat-sdk-javascript";
import React from "react";
import { Action } from "./CometChatGroups";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";

type Args = {
    searchText: string,
    groupsRequestBuilder: CometChat.GroupsRequestBuilder | null,
    searchRequestBuilder: CometChat.GroupsRequestBuilder | null,
    groupsSearchText:React.MutableRefObject<string>
};

export class GroupsManager {
    private groupsRequest: CometChat.GroupsRequest;
    private static loggedInUser: CometChat.User | null | undefined;
    private static defaultLimit = 30;

    /**
     * Set `groupsRequest` of the instance
     */
    constructor(args: Args) {
        const {
            searchText,
            groupsRequestBuilder,
            searchRequestBuilder,
            groupsSearchText
        } = args;
        let tmpGrpReqBuilder = groupsRequestBuilder || this.getDefaultRequestBuilder();
        if(searchText && searchRequestBuilder) {
            tmpGrpReqBuilder = searchRequestBuilder;
            tmpGrpReqBuilder.setSearchKeyword(searchText)
        }else if(searchText && !searchRequestBuilder && groupsRequestBuilder){
            tmpGrpReqBuilder = groupsRequestBuilder;
            tmpGrpReqBuilder.setSearchKeyword(searchText)
        }else if(!searchText && groupsRequestBuilder && searchRequestBuilder){
            tmpGrpReqBuilder = groupsRequestBuilder;
            tmpGrpReqBuilder.setSearchKeyword(groupsSearchText.current)
        }else if(!searchText && groupsRequestBuilder && !searchRequestBuilder){
            tmpGrpReqBuilder = groupsRequestBuilder;
            tmpGrpReqBuilder.setSearchKeyword(groupsSearchText.current)
        }else if(!searchText && !groupsRequestBuilder && searchRequestBuilder){
            tmpGrpReqBuilder = this.getDefaultRequestBuilder();
            tmpGrpReqBuilder.setSearchKeyword(groupsSearchText.current)
        }else{
            tmpGrpReqBuilder.setSearchKeyword(searchText)
        }
        this.groupsRequest = tmpGrpReqBuilder.build();
    }

    /**
     * Calls `fetchNext` method of the set `groupsRequest`
     */
    fetchNext() {
        return this.groupsRequest.fetchNext();
    }


    private getDefaultRequestBuilder() {
        return new CometChat.GroupsRequestBuilder().setLimit(GroupsManager.defaultLimit);
    }

    /**
     * Sets `loggedInUser` of the instance
     * @returns The logged-in user
     */
    private static async getLoggedInUser() {
        if (this.loggedInUser === undefined) {
            this.loggedInUser = await CometChatUIKitLoginListener.getLoggedInUser();
        }
        return this.loggedInUser;
    }

    /**
     * Creates an SDK group listener
     */
    private static createGroupListener(dispatch: React.Dispatch<Action>) {
        return new CometChat.GroupListener({
            onGroupMemberJoined: async (message: CometChat.Action, joinedUser: CometChat.User, joinedGroup: CometChat.Group) => {
                const loggedInUser = await GroupsManager.getLoggedInUser();
                const newCount = joinedGroup.getMembersCount();
                if (joinedUser.getUid() === loggedInUser?.getUid()) {
                    joinedGroup.setHasJoined(true);
                }
                dispatch({ type: "updateGroupForSDKEvents", group: joinedGroup, hasJoined: true, newCount });
            },
            onGroupMemberLeft: async (message: CometChat.Action, leavingUser: CometChat.User, groupLeft: CometChat.Group) => {
                const newCount = groupLeft.getMembersCount();
                const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();

                if (leavingUser.getUid() === loggedInUser?.getUid()) {
                    groupLeft.setHasJoined(false);
                    if (groupLeft.getType() === CometChatUIKitConstants.GroupTypes.private) {
                        dispatch({ type: "removeGroup", guid: groupLeft.getGuid() });
                    } else {
                        dispatch({ type: "updateGroupForSDKEvents", group: groupLeft, hasJoined: false, newCount });
                    }
                    return;
                }
                dispatch({ type: "updateGroupForSDKEvents", group: groupLeft, hasJoined: false, newCount });
            },
            onMemberAddedToGroup: async (message: CometChat.Action, userAdded: CometChat.User, userAddedBy: CometChat.User, userAddedIn: CometChat.Group) => {
                const newCount = userAddedIn.getMembersCount();
                const loggedInUser = await GroupsManager.getLoggedInUser();
                if (userAdded.getUid() === loggedInUser?.getUid()) {
                    userAddedIn.setHasJoined(true);
                }
                dispatch({ type: "updateGroupForSDKEvents", group: userAddedIn, hasJoined: true, newCount, addGroup: true });
            },
            onGroupMemberKicked: async (message: CometChat.Action, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: CometChat.Group) => {
                const newCount = kickedFrom.getMembersCount();
                const loggedInUser = await GroupsManager.getLoggedInUser();
                if (kickedUser.getUid() === loggedInUser?.getUid()) {
                    kickedFrom.setHasJoined(false);
                    dispatch({ type: "updateGroupForSDKEvents", group: kickedFrom, hasJoined: false, newCount });
                } else {
                    dispatch({ type: "updateGroupForSDKEvents", group: kickedFrom, newCount });
                }
            },
            onGroupMemberBanned: async (message: CometChat.Action, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: CometChat.Group) => {
                const newCount = bannedFrom.getMembersCount();
                const loggedInUser = await GroupsManager.getLoggedInUser();
                if (bannedUser.getUid() === loggedInUser?.getUid()) {
                    dispatch({ type: "removeGroup", guid: bannedFrom.getGuid() });
                } else {
                    dispatch({ type: "updateGroupForSDKEvents", group: bannedFrom, newCount });
                }
            },
            onGroupMemberScopeChanged: async (message: CometChat.Action, changedUser: CometChat.User, newScope: CometChat.GroupMemberScope, oldScope: CometChat.GroupMemberScope, changedGroup: CometChat.Group) => {
                const loggedInUser = await GroupsManager.getLoggedInUser();
                const newCount = changedGroup.getMembersCount();
                if (changedUser.getUid() === loggedInUser?.getUid()) {
                    changedGroup.setScope(newScope);
                }
                dispatch({ type: "updateGroupForSDKEvents", group: changedGroup, newScope, newCount });
            }
        });
    }

    /**
     * Attaches an SDK group listener
     *
     * @returns Function to call to remove the attached SDK group listener
     */
    static attachListeners(dispatch: React.Dispatch<Action>) {
        const listenerId = "GroupsList_" + String(Date.now());
        CometChat.addGroupListener(listenerId, GroupsManager.createGroupListener(dispatch));
        return () => CometChat.removeGroupListener(listenerId);
    }
    /**
* Attaches an SDK websocket  listener
*
* @returns - Function to remove the added SDK websocket listener
*/
    static attachConnestionListener(callback: () => void) {
        const listenerId = "GroupsList_connection_" + String(Date.now());
        CometChat.addConnectionListener(
            listenerId,
            new CometChat.ConnectionListener({
                onConnected: () => {
                    console.log("ConnectionListener =>connected");
                    if (callback) {
                        callback()
                    }
                },
                onDisconnected: () => {
                    console.log("ConnectionListener => On Disconnected");
                }
            })
        );
        return () => CometChat.removeConnectionListener(listenerId);
    }
}
