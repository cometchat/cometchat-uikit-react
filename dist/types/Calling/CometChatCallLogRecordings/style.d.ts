/// <reference types="react" />
import { ListItemStyle } from "@cometchat/uikit-elements";
import { CallLogRecordingsStyle, ListStyle } from "@cometchat/uikit-shared";
import { CometChatTheme } from "@cometchat/uikit-resources";
export declare function getButtonContainerStyle(): React.CSSProperties;
export declare function getListStyle(theme: CometChatTheme, callLogsStyle: CallLogRecordingsStyle): ListStyle;
export declare function getListItemStyle(theme: CometChatTheme, listItemStyle?: ListItemStyle): ListItemStyle;
export declare function getSubtitleStyle(theme: CometChatTheme, style: CallLogRecordingsStyle): React.CSSProperties;
export declare function getCallDateStyle(theme: CometChatTheme, style: CallLogRecordingsStyle): {
    textColor: string | undefined;
    textFont: string;
    background: string;
};
export declare function getBackButtonStyle(theme: CometChatTheme, style: CallLogRecordingsStyle): {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
};
export declare function getDownloadButtonStyle(theme: CometChatTheme, style: CallLogRecordingsStyle): {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
};
export declare function getContainerStyle(theme: CometChatTheme, callLogsStyle: CallLogRecordingsStyle): React.CSSProperties;
export declare function getTitleStyle(theme: CometChatTheme, style: CallLogRecordingsStyle): {
    font: string;
    color: string | undefined;
    background: string;
};
