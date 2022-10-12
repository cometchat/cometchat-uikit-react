import { useEffect } from "react";
import { CometChatMessageEvents } from "../../../";
import { CometChatUserEvents } from "../CometChatUserEvents"

export const Hooks = (
    onUserClickHandler,
    backButtonClickHandler,
    userRef
) => {

    /**ids */
    const onItemClickId = "onItemClick_" + new Date().getTime();
    const onBackButtonClickId = "onBackButtonClick_" + new Date().getTime();

    useEffect(() => {
        CometChatUserEvents.addListener(
            CometChatUserEvents.onItemClick,
            onItemClickId,
            onUserClickHandler
        );
        CometChatMessageEvents.addListener(
            CometChatMessageEvents.onBackButtonClick,
            onBackButtonClickId,
            backButtonClickHandler
        );

        return () => {
            CometChatUserEvents.removeListener(CometChatUserEvents.onItemClick, onItemClickId);
            CometChatUserEvents.removeListener(CometChatMessageEvents.onBackButtonClick, onBackButtonClickId);
        }
    }, []);
};