import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect } from "react";
import { CometChatUserEvents } from "uikit-resources-lerna";
import { Action } from ".";
import { UsersManager } from "./controller";

type Args = {
    usersManagerRef : React.MutableRefObject<UsersManager | null>,
    fetchNextAndAppendUsers : (fetchId : string) => Promise<void>,
    searchText : string,
    usersRequestBuilder : CometChat.UsersRequestBuilder | null,
    searchRequestBuilder : CometChat.UsersRequestBuilder | null,
    dispatch : React.Dispatch<Action>,
    updateUser : (user : CometChat.User) => void,
    fetchNextIdRef : React.MutableRefObject<string>
};

export function Hooks(args : Args) {
    const {
        usersManagerRef,
        fetchNextAndAppendUsers,
        searchText,
        usersRequestBuilder,
        searchRequestBuilder,
        dispatch,
        updateUser,
        fetchNextIdRef
    } = args;

    useEffect(
        /**
         * Creates a new request builder -> empties the `userList` state -> initiates a new fetch
         */
        () => {
            usersManagerRef.current = new UsersManager({searchText, usersRequestBuilder, searchRequestBuilder});
            dispatch({type: "setUserList", userList: []});
            fetchNextAndAppendUsers(fetchNextIdRef.current = "initialFetch_" + String(Date.now()));
    }, [searchText, usersRequestBuilder, searchRequestBuilder, fetchNextAndAppendUsers, dispatch, fetchNextIdRef, usersManagerRef]);

    useEffect(
        /**
         * Attaches an SDK user listener
         * 
         * @returns - Function to remove the added SDK user listener
         */
        () => {
            return UsersManager.atttachListeners(updateUser);
    }, [updateUser]);

    useEffect(
        /**
         * Subscribes to User UI events
         */
        () => {
            const subUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(updateUser);
            const subUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe(updateUser);
            return () => {
                subUserBlocked.unsubscribe();
                subUserUnblocked.unsubscribe();
            };
    }, [updateUser]);
}
