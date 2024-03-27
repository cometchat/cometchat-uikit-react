import { CSSProperties } from 'react';
import { AvatarStyle, ListItemStyle, CallscreenStyle } from "@cometchat/uikit-elements";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { IncomingCallStyle } from "@cometchat/uikit-shared";
export declare const IncomingCallWrapperStyle: (incomingCallStyle: IncomingCallStyle) => CSSProperties;
export declare const IncomingCallSubtitleStyle: {
    display: string;
    alignItems: string;
    justifyContent: string;
    gap: string;
};
export declare const IncomingCallLabelStyle: (incomingCallStyle: IncomingCallStyle) => {
    textFont: string | undefined;
    textColor: string | undefined;
};
export declare const IncomingCallListItemStyle: {
    width: string;
    marginLeft: string;
};
export declare const IncomingCallTailViewStyle: CSSProperties;
export declare const IncomingCallButtonsStyle: {
    display: string;
    gap: string;
    paddingLeft: string;
    paddingRight: string;
};
export declare const buttonStyle: {
    height: string;
    width: string;
    display: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    padding: string;
};
export declare const defaultAvatarStyle: (theme: CometChatTheme) => AvatarStyle;
export declare const defaultIncomingCallStyle: (theme: CometChatTheme) => IncomingCallStyle;
export declare const defaultListItemStyle: (incomingCallStyle: IncomingCallStyle, theme: CometChatTheme) => ListItemStyle;
export declare const AcceptButtonStyle: (incomingCallStyle: IncomingCallStyle) => {
    height: string;
    width: string;
    display: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    padding: string;
    border: string | undefined;
    borderRadius: string | undefined;
    background: string | undefined;
    buttonTextFont: string | undefined;
    buttonTextColor: string | undefined;
};
export declare const DeclineButtonStyle: (incomingCallStyle: IncomingCallStyle) => {
    height: string;
    width: string;
    display: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    padding: string;
    border: string | undefined;
    borderRadius: string | undefined;
    background: string | undefined;
    buttonTextFont: string | undefined;
    buttonTextColor: string | undefined;
};
export declare const defaultOngoingCallStyle: (theme: CometChatTheme) => CallscreenStyle;
export declare const IconStyle: (incomingCallStyle: IncomingCallStyle) => {
    height: string;
    width: string;
    iconTint: string;
};
