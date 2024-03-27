import { CallButtonsStyle, OutgoingCallStyle } from "@cometchat/uikit-shared";
import { CallscreenStyle } from "@cometchat/uikit-elements";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { CSSProperties } from "react";
export declare const CallButtonsWrapperStyle: (callButtonStyle: CallButtonsStyle) => {
    height: string | undefined;
    width: string | undefined;
    background: string | undefined;
    border: string | undefined;
    borderRadius: string | undefined;
    display: string;
    justifyContent: string;
};
export declare const outgoingCallStyle: OutgoingCallStyle;
export declare const buttonStyle: {
    height: string;
    width: string;
    display: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
};
export declare const defaultCallsButtonStyle: (theme: CometChatTheme) => CallButtonsStyle;
export declare const ongoingCallStyle: (theme: CometChatTheme) => CallscreenStyle;
export declare const getVoiceCallButtonTint: (disableButtons: boolean, callButtonStyle: CallButtonsStyle | undefined, theme: CometChatTheme) => string | undefined;
export declare const getVideoCallButtonTint: (disableButtons: boolean, callButtonStyle: CallButtonsStyle | undefined, theme: CometChatTheme) => string | undefined;
export declare const VideoCallButtonStyle: (callButtonStyle: CallButtonsStyle | undefined) => CSSProperties;
export declare const VoiceCallButtonStyle: (callButtonStyle: CallButtonsStyle | undefined) => CSSProperties;
