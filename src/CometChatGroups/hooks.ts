import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect } from "react";
import { CometChatGroupEvents, CometChatUIKitConstants } from "uikit-resources-lerna";
import { CometChatUIKitUtility } from "uikit-utils-lerna";
import { Action } from ".";
import { GroupsManager } from "./controller";

type Args = {
    groupsRequestBuilder : CometChat.GroupsRequestBuilder | null,
    searchRequestBuilder : CometChat.GroupsRequestBuilder | null,
    searchText : string,
    fetchNextIdRef : React.MutableRefObject<string>,
    groupsManagerRef : React.MutableRefObject<GroupsManager | null>,
    dispatch : React.Dispatch<Action>,
    fetchNextAndAppendGroups : (fetchId : string) => Promise<void>
};

export function Hooks(args : Args) {
    const {
        groupsRequestBuilder : groupsRequestBuilderProp,
        searchRequestBuilder,
        searchText,
        fetchNextIdRef,
        groupsManagerRef,
        dispatch,
        fetchNextAndAppendGroups
    } = args;

    useEffect(
        /**
         * Creates a new request builder -> empties the `groupList` state -> initiates a new fetch
         */
        () => {
            const groupsRequestBuilder = groupsRequestBuilderProp === null ? new CometChat.GroupsRequestBuilder().setLimit(30) : groupsRequestBuilderProp;
            dispatch({type: "setGroupList", groupList: []});
            groupsManagerRef.current = new GroupsManager({searchText, groupsRequestBuilder, searchRequestBuilder});
            fetchNextAndAppendGroups(fetchNextIdRef.current = "initialFetch_" + String(Date.now()));
    }, [fetchNextAndAppendGroups, groupsRequestBuilderProp, searchRequestBuilder, searchText, dispatch, fetchNextIdRef, groupsManagerRef]);

    useEffect(
        /**
         * Attaches an SDK group listener
         * 
         * @returns - Function to remove the added SDK group listener
         */
        () => {
            return GroupsManager.attachListeners(dispatch);
    }, [dispatch]);

    useEffect(
        /**
         * Subscribes to Group UI events
         */
        () => {
            const groupCreatedSub = CometChatGroupEvents.ccGroupCreated.subscribe((group : CometChat.Group) => {
                dispatch({type: "prependGroup", group: CometChatUIKitUtility.clone(group)});
            });
            const groupDeletedSub = CometChatGroupEvents.ccGroupDeleted.subscribe((group : CometChat.Group) => {
                dispatch({type: "removeGroup", guid: group.getGuid()});
            });
            const groupMemberJoinedSub = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item) => {
                dispatch({type: "updateGroup", group: CometChatUIKitUtility.clone(item.joinedGroup)});
            });
            const groupMemberKickedSub = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item) => {
                dispatch({type: "updateGroup", group: CometChatUIKitUtility.clone(item.kickedFrom)});
            });
            const groupMemberLeftSub = CometChatGroupEvents.ccGroupLeft.subscribe((item) => {
                if (item.leftGroup.getType() === CometChatUIKitConstants.GroupTypes.private) {
                    dispatch({type: "removeGroup", guid: item.leftGroup.getGuid()});
                }
                else {
                    dispatch({type: "updateGroup", group: item.leftGroup});
                }
            });
            const groupMemberBannedSub = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
                dispatch({type: "updateGroup", group: item.kickedFrom});
            });
            const groupMemberAddedSub = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item) => {
                dispatch({type: "updateGroup", group: item.userAddedIn});
            });
            const groupOwnershipChangedSub = CometChatGroupEvents.ccOwnershipChanged.subscribe((item) => {
                dispatch({type: "updateGroup", group: item.group});
            });
            return () => {
                groupCreatedSub.unsubscribe();
                groupDeletedSub.unsubscribe();
                groupMemberJoinedSub.unsubscribe();
                groupMemberKickedSub.unsubscribe();
                groupMemberLeftSub.unsubscribe();
                groupMemberBannedSub.unsubscribe();
                groupMemberAddedSub.unsubscribe();
                groupOwnershipChangedSub.unsubscribe();
            };
    }, [dispatch]);
}
