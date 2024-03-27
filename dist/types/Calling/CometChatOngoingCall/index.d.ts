import { CallWorkflow } from "@cometchat/uikit-resources";
import { CometChatUIKitCalls } from "@cometchat/uikit-shared";
import { CallscreenStyle } from "@cometchat/uikit-elements";
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
