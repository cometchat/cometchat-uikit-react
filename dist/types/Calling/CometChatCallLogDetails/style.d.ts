/// <reference types="react" />
import { CometChatTheme } from "@cometchat/uikit-resources";
import { CallLogDetailsStyle } from "@cometchat/uikit-shared";
export declare function getProfileContainerStyle(): React.CSSProperties;
export declare function getButtonContainerStyle(): React.CSSProperties;
export declare function getBackButtonStyle(theme: CometChatTheme, style: CallLogDetailsStyle): {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
};
export declare function getContainerStyle(theme: CometChatTheme, style: CallLogDetailsStyle): React.CSSProperties;
export declare function getTitleStyle(theme: CometChatTheme, style: CallLogDetailsStyle): {
    font: string;
    color: string | undefined;
    background: string;
};
