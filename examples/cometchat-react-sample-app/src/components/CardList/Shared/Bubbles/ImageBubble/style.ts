import { useContext } from "react";
import {CometChatContext,fontHelper} from "@cometchat-pro/react-ui-kit"
export function senderBubbleStyle() {
    const { theme } = useContext(CometChatContext);
    return {
        borderRadius:"8px",
        background:theme.palette.getPrimary(),
        textFont: fontHelper(theme.typography.text2),
        textColor: theme.palette.getAccent("dark"),
    };
}

export function receiverBubbleStyle() {
    const { theme } = useContext(CometChatContext);
    return {
        borderRadius:"8px",
        background:theme.palette.getAccent200(),
        textFont: fontHelper(theme.typography.text2),
        textColor: theme.palette.getAccent(),
    };
}