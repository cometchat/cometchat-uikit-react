import { useEffect } from "react";
import { CometChatMessageEvents } from "../../../";
import { CometChatGroupEvents } from "../CometChatGroupEvents"

export const Hooks = (
    onGroupClickHandler,
    backButtonClickHandler,
    groupRef,
    onGroupJoinedHandler
) => {


    /**ids */
    const onItemClickId = "onItemClick_" + new Date().getTime();
    const onGroupCreateId = "onGroupCreate_" + new Date().getTime();
    const onBackButtonClickId = "onBackButtonClick_" + new Date().getTime();
    const onMessageJoinId = "onMessageJoin" + new Date().getTime();

    useEffect(() => {
        CometChatGroupEvents.addListener(
            CometChatGroupEvents.onItemClick,
            onItemClickId,
            onGroupClickHandler
        );
        CometChatGroupEvents.addListener(
            CometChatGroupEvents.onGroupCreate,
            onGroupCreateId,
            onGroupClickHandler
        )
        CometChatGroupEvents.addListener(
            CometChatGroupEvents.onGroupMemberJoin,
            onMessageJoinId,
            onGroupJoinedHandler
        )
        // CometChatMessageEvents.addListener(
        //     CometChatMessageEvents.onMessageRead,
        //     onMessageReadId,
        //     (data) => groupRef?.current?.groupListRef?.resetUnreadCount(data)
        // );
        CometChatMessageEvents.addListener(
            CometChatMessageEvents.onBackButtonClick,
            onBackButtonClickId,
            backButtonClickHandler
        );

        return () => {
            CometChatGroupEvents.removeListener(CometChatGroupEvents.onItemClick, onItemClickId);
            CometChatGroupEvents.removeListener(CometChatGroupEvents.onGroupCreate, onGroupCreateId)
            CometChatGroupEvents.removeListener(CometChatMessageEvents.onGroupMemberJoin, onMessageJoinId);
            CometChatGroupEvents.removeListener(CometChatMessageEvents.onBackButtonClick, onBackButtonClickId);
        }
    }, []);
};