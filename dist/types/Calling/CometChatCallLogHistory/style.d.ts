/// <reference types="react" />
import { AvatarStyle, DateStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CallLogHistoryStyle, ListStyle } from "@cometchat/uikit-shared";
import { CometChatTheme } from "@cometchat/uikit-resources";
export declare function getSubtitleStyle(theme: CometChatTheme, style: CallLogHistoryStyle): DateStyle;
export declare function getAvatarStyle(theme: CometChatTheme, avatarStyle?: AvatarStyle): AvatarStyle;
export declare function getListItemStyle(theme: CometChatTheme, listItemStyle?: ListItemStyle): ListItemStyle;
export declare function getCallStatusStyle(theme: CometChatTheme, style: CallLogHistoryStyle): {
    font: string;
    color: string | undefined;
};
export declare function getContainerStyle(theme: CometChatTheme, callLogsStyle: CallLogHistoryStyle): React.CSSProperties;
export declare function getListStyle(theme: CometChatTheme, callLogsStyle: CallLogHistoryStyle): ListStyle;
export declare function getCallDurationStyle(theme: CometChatTheme, style: CallLogHistoryStyle): {
    font: string;
    color: string | undefined;
};
export declare function getButtonContainerStyle(): React.CSSProperties;
export declare function getBackButtonStyle(theme: CometChatTheme, style: CallLogHistoryStyle): {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
};
export declare function getDateSeparator(theme: CometChatTheme, style: CallLogHistoryStyle): {
    textFont: string;
    textColor: string | undefined;
    background: string;
};
export declare function getDividerStyle(theme: CometChatTheme, style: CallLogHistoryStyle): {
    height: string;
    width: string;
    background: string | undefined;
};
export declare function getTitleStyle(theme: CometChatTheme, style: CallLogHistoryStyle): {
    font: string;
    color: string | undefined;
    background: string;
};
