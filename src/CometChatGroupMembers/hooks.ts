import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect, JSX } from "react";
import { CometChatGroupEvents } from "uikit-resources-lerna";
import { Action } from ".";
import { GroupMembersManager } from "./controller";

type Args = {
    groupMemberRequestBuilder : CometChat.GroupMembersRequestBuilder | null,
    searchRequestBuilder : CometChat.GroupMembersRequestBuilder | null,
    searchText : string,
    groupMembersManagerRef : React.MutableRefObject<GroupMembersManager | null>,
    groupGuid : string,
    fetchNextAndAppendGroupMembers : (id : string) => void,
    fetchNextIdRef : React.MutableRefObject<string>,
    dispatch : React.Dispatch<Action>,
    loggedInUserRef : React.MutableRefObject<CometChat.User | null>,
    errorHandler : (error : unknown) => void,
    changeScopeElement : JSX.IntrinsicElements["cometchat-change-scope"] | null,
    updateGroupMemberScope : (newScope: string) => Promise<void>
};

export function Hooks(args : Args) {
    const {
        groupMemberRequestBuilder,
        searchRequestBuilder,
        searchText,
        groupMembersManagerRef,
        groupGuid,
        fetchNextAndAppendGroupMembers,
        fetchNextIdRef,
        dispatch,
        loggedInUserRef,
        errorHandler,
        changeScopeElement,
        updateGroupMemberScope
    } = args;

    useEffect(
        /**
         * Sets `loggedInUserRef` to the currently logged-in user
         */
        () => {
            (async () => {
                try {
                    loggedInUserRef.current = await CometChat.getLoggedinUser();
                }
                catch(error) {
                    errorHandler(error);
                }
            })();
    }, [errorHandler, loggedInUserRef]);

    useEffect(
        /**
         * Creates a new request builder -> empties the `groupMemberList` state -> initiates a new fetch
         */
        () => {
            groupMembersManagerRef.current = new GroupMembersManager(
                {
                    searchText, 
                    groupMemberRequestBuilder, 
                    searchRequestBuilder, 
                    groupGuid
                }
            );
            dispatch({type: "setGroupMemberList", groupMemberList: []});
            fetchNextAndAppendGroupMembers(fetchNextIdRef.current = "initialFetchNext_" + String(Date.now()));
    }, [groupMemberRequestBuilder, searchRequestBuilder, searchText, groupGuid, fetchNextAndAppendGroupMembers, dispatch, fetchNextIdRef, groupMembersManagerRef]);

    useEffect(
        /**
         * Attaches event listeners to some elements related to the change scope view
         */
        () => {
            if (!changeScopeElement) {
                return;
            }
            const changeScopeClosedEventName = "cc-changescope-close-clicked";
            const scopeChangedEventName = "cc-changescope-changed";
            function handleChangeScopeClose() {
                dispatch({type: "setGroupMemberToChangeScopeOf", groupMember: null});
            }
            function handleScopeChange(e : CustomEvent) {
                const newScope = e.detail?.value;
                if (newScope) {
                    updateGroupMemberScope(newScope);
                }
            }
            changeScopeElement.addEventListener(changeScopeClosedEventName, handleChangeScopeClose);
            changeScopeElement.addEventListener(scopeChangedEventName, handleScopeChange);
            return () => {
                changeScopeElement.removeEventListener(changeScopeClosedEventName, handleChangeScopeClose);
                changeScopeElement.removeEventListener(scopeChangedEventName, handleScopeChange);
            };
    }, [changeScopeElement, updateGroupMemberScope, dispatch]);

    useEffect(
        /**
         * Attaches an SDK user listener
         * 
         * @returns - Function to remove the added SDK user listener
         */
        () => {
            return GroupMembersManager.attachUserListener((user : CometChat.User) => dispatch({type: "updateGroupMemberStatusIfPresent", user}));
    }, [dispatch]);

    useEffect(
        /**
         * Attaches an SDK group listener
         * 
         * @returns - Function to remove the added SDK group listener
         */
        () => {
            return GroupMembersManager.attachGroupListener(groupGuid, dispatch);
    }, [groupGuid, dispatch]);

    useEffect(
        /**
         * Subscribes to Group UI events
         */
        () => {
            const groupMemberKickedSub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(item => {
                const { kickedUser } = item;
                dispatch({type: "removeGroupMemberIfPresent", groupMemberUid: kickedUser.getUid()});
            });
            const groupMemberBannedSub = CometChatGroupEvents.ccGroupMemberBanned.subscribe(item => {
                const { kickedUser } = item;
                dispatch({type: "removeGroupMemberIfPresent", groupMemberUid: kickedUser.getUid()});
            });
            const groupMemberChangeScopeSub = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(item => {
                const { updatedUser, scopeChangedTo } = item;
                dispatch({type: "updateGroupMemberScopeIfPresent", groupMemberUid: updatedUser.getUid(), newScope: scopeChangedTo});
            });
            const groupMemberAddedSub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(item => {
                const { usersAdded, userAddedIn } = item;
                dispatch({type: "appendGroupMembers", groupMembers: usersAdded.map(user => GroupMembersManager.createParticipantGroupMember(user, userAddedIn))});
            });
            return () => {
                groupMemberKickedSub.unsubscribe();
                groupMemberBannedSub.unsubscribe();
                groupMemberChangeScopeSub.unsubscribe();
                groupMemberAddedSub.unsubscribe();
            };
    }, [dispatch]);
}
