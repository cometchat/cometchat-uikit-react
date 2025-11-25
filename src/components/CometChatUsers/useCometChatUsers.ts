import React, { useEffect } from "react";
import { Action } from "./CometChatUsers";
import { UsersManager } from "./controller";
import { CometChatUserEvents } from "../../events/CometChatUserEvents";
import { CometChat } from "@cometchat/chat-sdk-javascript";
type Args = {
    usersManagerRef: React.MutableRefObject<UsersManager | null>,
    fetchNextAndAppendUsers: (fetchId: string) => Promise<void>,
    searchText: string,
    usersRequestBuilder: CometChat.UsersRequestBuilder | null,
    searchRequestBuilder: CometChat.UsersRequestBuilder | null,
    dispatch: React.Dispatch<Action>,
    updateUser: (user: CometChat.User) => void,
    fetchNextIdRef: React.MutableRefObject<string>,
    searchKeyword: string,
    disableLoadingState: boolean,
    usersSearchText: React.MutableRefObject<string>,
    hideUserStatus: boolean,
    errorHandler: (error: unknown, source?: string | undefined) => void
};

export function useCometChatUsers(args: Args) {
    const {
        usersManagerRef,
        fetchNextAndAppendUsers,
        searchText,
        usersRequestBuilder,
        searchRequestBuilder,
        dispatch,
        updateUser,
        fetchNextIdRef,
        searchKeyword,
        disableLoadingState,
        usersSearchText,
        hideUserStatus,
        errorHandler,
    } = args;

    useEffect(() => {
        try {
            if (usersRequestBuilder?.searchKeyword) {
                usersSearchText.current = usersRequestBuilder?.searchKeyword;
            } else if (searchRequestBuilder?.searchKeyword) {
                usersSearchText.current = searchRequestBuilder?.searchKeyword;
            }
            return () => {
                /* 
                   When the prop (usersRequestBuilder) gets updated (setSearchKeyword), reference in parent component gets updated too. 
                   This was causing an issue in mentions since the previous search keyword remained in the request builder reference in 
                   composer.
                */
                usersRequestBuilder?.setSearchKeyword("")
            }
        } catch (error) {
            errorHandler(error, 'useEffect');
        }
    }, []);

    useEffect(
        /**
         * Creates a new request builder -> empties the `userList` state -> initiates a new fetch
         */
        () => {
            try {
                dispatch({ type: "setIsFirstReload", isFirstReload: true });
                usersSearchText.current = searchKeyword;
                usersManagerRef.current = new UsersManager({ searchText, usersRequestBuilder, searchRequestBuilder, usersSearchText });
                if (!disableLoadingState) {
                    dispatch({ type: "setUserList", userList: [] });
                }
                fetchNextAndAppendUsers(fetchNextIdRef.current = "initialFetch_" + String(Date.now()));
            } catch (error) {
                errorHandler(error, 'useEffect');
            }
        }, [searchText, usersRequestBuilder, searchRequestBuilder, fetchNextAndAppendUsers, dispatch, fetchNextIdRef, usersManagerRef, disableLoadingState, searchKeyword]);

    useEffect(
        /**
         * Attaches an SDK user listener
         *
         * @returns - Function to remove the added SDK user listener
         */
        () => {
            try {
                if (!hideUserStatus) {
                    const listenerId = "UsersList_" + String(Date.now());
                    const userListener = new CometChat.UserListener({ onUserOnline: updateUser, onUserOffline: updateUser });
                    CometChat.addUserListener(listenerId, userListener);
                    return () => CometChat.removeUserListener(listenerId);
                }
            } catch (error) {
                errorHandler(error, 'useEffect');
            }
        }, [updateUser]);

    useEffect(
        /**
         * Subscribes to User UI events
         */
        () => {
            try {
                const subUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(updateUser);
                const subUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe(updateUser);
                return () => {
                    subUserBlocked.unsubscribe();
                    subUserUnblocked.unsubscribe();
                };
            } catch (error) {
                errorHandler(error, 'useEffect');
            }
        }, [updateUser]);

    useEffect(
        () => {
            dispatch({ type: "setSearchText", searchText: searchKeyword });
        }, [searchKeyword, dispatch]);
}
