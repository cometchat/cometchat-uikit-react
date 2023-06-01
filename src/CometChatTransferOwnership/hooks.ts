import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect } from "react";

type Args = {
    errorHandler : (error : unknown) => void,
    setLoggedInUser : React.Dispatch<React.SetStateAction<CometChat.User | null>>
};

export function Hooks(args : Args) {
    const {
        errorHandler,
        setLoggedInUser
    } = args;

    useEffect(
        /**
         * Sets `loggedInUser` state to the currently logged-in user
         */
        () => {
            (async () => {
                try {
                    setLoggedInUser(await CometChat.getLoggedinUser());
                }
                catch(error) {
                    errorHandler(error);
                }
            })();
    }, [errorHandler, setLoggedInUser]);
}
