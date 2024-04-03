import { CallWorkflow } from "@cometchat/uikit-resources";
import { CallscreenStyle } from "@cometchat/uikit-elements";
import { CometChatUIKitCalls } from "@cometchat/uikit-shared";
interface IOngoingCallProps {
    callSettingsBuilder?: typeof CometChatUIKitCalls.CallSettings;
    sessionID: string;
    ongoingCallStyle?: CallscreenStyle;
    resizeIconHoverText?: string;
    minimizeIconURL?: string;
    maximizeIconURL?: string;
    onError?: Function;
    callWorkflow?: CallWorkflow;
}
declare const CometChatOngoingCall: {
    (props: IOngoingCallProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: IOngoingCallProps;
};
export { CometChatOngoingCall };
