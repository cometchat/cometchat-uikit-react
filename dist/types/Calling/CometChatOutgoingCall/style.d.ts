import { AvatarStyle, CardStyle } from "@cometchat/uikit-elements";
import { OutgoingCallStyle } from "@cometchat/uikit-shared";
import { CometChatTheme } from "@cometchat/uikit-resources";
export declare const OutgoingCallWrapperStyle: (outgoingCallStyle: OutgoingCallStyle) => {
    height: string | undefined;
    width: string | undefined;
    background: string | undefined;
    border: string | undefined;
    borderRadius: string | undefined;
};
export declare const OutgoingCallSubtitleStyle: (outgoingCallStyle: OutgoingCallStyle) => {
    textFont: string | undefined;
    textColor: string | undefined;
};
export declare const OutgoingCallCancelButtonStyle: (outgoingCallStyle: OutgoingCallStyle) => {
    height: string;
    width: string;
    buttonTextFont: string | undefined;
    buttonTextColor: string | undefined;
    borderRadius: string;
    border: string;
    buttonIconTint: string | undefined;
    background: string;
    iconBackground: string | undefined;
};
export declare const buttonStyle: {
    height: string;
    width: string;
    buttonTextFont: string;
    buttonTextColor: string;
    borderRadius: string;
    border: string;
    buttonIconTint: string;
    background: string;
    iconBackground: string;
};
export declare const OutgoingCallCardStyle: CardStyle;
export declare const defaultAvatarStyle: (theme: CometChatTheme) => AvatarStyle;
export declare const defaultOutgoingCallStyle: (theme: CometChatTheme) => OutgoingCallStyle;
