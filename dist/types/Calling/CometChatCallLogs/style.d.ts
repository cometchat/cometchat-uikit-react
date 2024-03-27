/// <reference types="react" />
import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { CallLogsStyle, ListStyle } from "@cometchat/uikit-shared";
export declare function getSubtitleStyle(theme: CometChatTheme, style: CallLogsStyle): React.CSSProperties;
export declare function getAvatarStyle(theme: CometChatTheme, avatarStyle?: AvatarStyle): AvatarStyle;
export declare function getListItemStyle(call: any, theme: CometChatTheme, listItemStyle?: ListItemStyle, loggedInUser?: CometChat.User): ListItemStyle;
export declare function getContainerStyle(theme: CometChatTheme, callLogsStyle: CallLogsStyle): React.CSSProperties;
export declare function getListStyle(theme: CometChatTheme, callLogsStyle: CallLogsStyle): ListStyle;
export declare function getCallDateStyle(theme: CometChatTheme, style: CallLogsStyle): {
    textColor: string | undefined;
    textFont: string;
    background: string;
};
export declare function getButtonContainerStyle(): React.CSSProperties;
export declare function getDirectionIconStyle(call: any, theme: CometChatTheme, style: CallLogsStyle, loggedInUser: CometChat.User): {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
};
export declare function getInfoButtonStyle(theme: CometChatTheme, style: CallLogsStyle): {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
};
export declare function getDateSeparator(theme: CometChatTheme, style: CallLogsStyle): {
    textFont: string;
    textColor: string | undefined;
    background: string;
    padding: string;
};
