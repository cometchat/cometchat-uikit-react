import React, { JSX, useEffect, useRef } from "react";

import { Action } from "./CometChatGroupMembers";
import { GroupMembersManager } from "./controller";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { CometChatGroupEvents } from "../../events/CometChatGroupEvents";

type Args = {
  groupMemberRequestBuilder: CometChat.GroupMembersRequestBuilder | null;
  searchRequestBuilder: CometChat.GroupMembersRequestBuilder | null;
  searchText: string;
  groupMembersManagerRef: React.MutableRefObject<GroupMembersManager | null>;
  groupGuid: string;
  fetchNextAndAppendGroupMembers: (id: string) => void;
  fetchNextIdRef: React.MutableRefObject<string>;
  dispatch: React.Dispatch<Action>;
  loggedInUserRef: React.MutableRefObject<CometChat.User | null>;
  errorHandler: (error: unknown, source?: string | undefined) => void;
  updateGroupMemberScope: (newScope: string) => Promise<void>;
  searchKeyword: string;
  disableLoadingState: boolean;
  groupMembersSearchText: React.MutableRefObject<string>;
  hideUserStatus?: boolean;
};

export function Hooks(args: Args) {
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
    updateGroupMemberScope,
    searchKeyword,
    disableLoadingState,
    groupMembersSearchText,
    hideUserStatus
  } = args;

  const isFirstRenderRef = useRef<boolean>(true);


  useEffect(() => {
    try {
      if (groupMemberRequestBuilder?.searchKeyword) {
        groupMembersSearchText.current = groupMemberRequestBuilder?.searchKeyword;
      } else if (searchRequestBuilder?.searchKeyword) {
        groupMembersSearchText.current = searchRequestBuilder?.searchKeyword;
      }
      return () => {
        /* 
           When the prop (groupMemberRequestBuilder) gets updated (setSearchKeyword), reference in parent component gets updated too. 
           This was causing an issue in mentions since the previous search keyword remained in the request builder reference in 
           composer.
        */
        groupMemberRequestBuilder?.setSearchKeyword("")
      }
    } catch (error) {
      errorHandler(error, 'useEffect');
    }
  }, []);

  useEffect(
    /**
     * Sets `loggedInUserRef` to the currently logged-in user
     */
    () => {
      (async () => {
        try {
          loggedInUserRef.current = CometChatUIKitLoginListener.getLoggedInUser();
        } catch (error) {
          errorHandler(error, 'useEffect');
        }
      })();
    },
    [errorHandler, loggedInUserRef]
  );

  useEffect(
    /**
     * Creates a new request builder -> empties the `groupMemberList` state -> initiates a new fetch
     */
    () => {
      try {
        if(!isFirstRenderRef.current) return;
        groupMembersManagerRef.current = new GroupMembersManager({
          searchText,
          groupMemberRequestBuilder,
          searchRequestBuilder,
          groupGuid,
          groupMembersSearchText

        });
        if (!disableLoadingState) {
          dispatch({ type: "setGroupMemberList", groupMemberList: [] });
        }
        fetchNextAndAppendGroupMembers(
          (fetchNextIdRef.current = "initialFetchNext_" + String(Date.now()))
        );
        isFirstRenderRef.current = false;
      } catch (error) {
        errorHandler(error, 'useEffect');
      }
    },
    [
      groupMemberRequestBuilder,
      searchRequestBuilder,
      searchText,
      groupGuid,
      fetchNextAndAppendGroupMembers,
      dispatch,
      fetchNextIdRef,
      groupMembersManagerRef,
    ]
  );


  useEffect(
    /**
     * Attaches an SDK user listener
     *
     * @returns - Function to remove the added SDK user listener
     */
    () => {
      try {
        if (!hideUserStatus) {
          return GroupMembersManager.attachUserListener((user: CometChat.User) =>
            dispatch({ type: "updateGroupMemberStatusIfPresent", user })
          );
        }
      } catch (error) {
        errorHandler(error, 'useEffect');
      }
    },
    [dispatch, hideUserStatus]
  );

  useEffect(
    /**
     * Attaches an SDK group listener
     *
     * @returns - Function to remove the added SDK group listener
     */
    () => {
      return GroupMembersManager.attachGroupListener(groupGuid, dispatch);
    },
    [groupGuid, dispatch]
  );

  useEffect(
    /**
     * Subscribes to Group UI events
     */
    () => {
      try {
        const groupMemberKickedSub =
          CometChatGroupEvents.ccGroupMemberKicked.subscribe((item) => {
            const { kickedUser } = item;
            dispatch({
              type: "removeGroupMemberIfPresent",
              groupMemberUid: kickedUser.getUid(),
            });
          });
        const groupMemberBannedSub =
          CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
            const { kickedUser } = item;
            dispatch({
              type: "removeGroupMemberIfPresent",
              groupMemberUid: kickedUser.getUid(),
            });
          });
        const groupMemberChangeScopeSub =
          CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe((item) => {
            const { updatedUser, scopeChangedTo } = item;
            dispatch({
              type: "updateGroupMemberScopeIfPresent",
              groupMemberUid: updatedUser.getUid(),
              newScope: scopeChangedTo,
            });
          });
        const groupMemberAddedSub =
          CometChatGroupEvents.ccGroupMemberAdded.subscribe((item) => {
            const { usersAdded, userAddedIn } = item;
            let groupMembersManager: GroupMembersManager | null = groupMembersManagerRef.current;
            dispatch({
              type: "appendGroupMembers",
              groupMembersManager,
              groupMembers: usersAdded.map((user) =>
                GroupMembersManager.createParticipantGroupMember(
                  user,
                  userAddedIn
                )
              ),
            });
          });
        return () => {
          groupMemberKickedSub.unsubscribe();
          groupMemberBannedSub.unsubscribe();
          groupMemberChangeScopeSub.unsubscribe();
          groupMemberAddedSub.unsubscribe();
        };
      } catch (error) {
        errorHandler(error, 'useEffect');
      }
    },
    [dispatch]
  );

  useEffect(() => {
    dispatch({ type: "setSearchText", searchText: searchKeyword });
  }, [searchKeyword, dispatch]);
}
