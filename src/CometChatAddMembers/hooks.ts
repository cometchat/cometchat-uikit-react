import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect } from "react";
import { SelectionMode } from "uikit-utils-lerna";

type Args = {
    loggedInUserRef : React.MutableRefObject<CometChat.User | null>,
    errorHandler : (error : unknown) => void,
    selectionMode : SelectionMode,
    selectionModeRef : React.MutableRefObject<SelectionMode>,
    membersToAddRef : React.MutableRefObject<CometChat.GroupMember[]>
};

export function Hooks(args : Args) {
    const {
        loggedInUserRef,
        errorHandler,
        selectionMode,
        selectionModeRef,
        membersToAddRef
    } = args;

    useEffect(() => {
        if (selectionModeRef.current !== selectionMode) {
            selectionModeRef.current = selectionMode;
            membersToAddRef.current = [];
        }
    }, [selectionMode, membersToAddRef, selectionModeRef]);

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
}
