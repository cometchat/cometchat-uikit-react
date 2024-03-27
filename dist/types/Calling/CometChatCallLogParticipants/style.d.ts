/// <reference types="react" />
import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CallLogParticipantsStyle, ListStyle } from "@cometchat/uikit-shared";
import { CometChatTheme } from "@cometchat/uikit-resources";
export declare function getButtonContainerStyle(): React.CSSProperties;
export declare function getBackButtonStyle(theme: CometChatTheme, style: CallLogParticipantsStyle): {
    height: string;
    width: string;
    border: string;
    borderRadius: string;
    background: string;
    buttonIconTint: string | undefined;
};
export declare function getListStyle(theme: CometChatTheme, callLogsStyle: CallLogParticipantsStyle): ListStyle;
export declare function getAvatarStyle(theme: CometChatTheme, avatarStyle?: AvatarStyle): AvatarStyle;
export declare function getListItemStyle(theme: CometChatTheme, listItemStyle?: ListItemStyle): ListItemStyle;
export declare function getSubtitleStyle(theme: CometChatTheme, style: CallLogParticipantsStyle): React.CSSProperties;
export declare function getCallDateStyle(theme: CometChatTheme, style: CallLogParticipantsStyle): {
    textColor: string | undefined;
    textFont: string;
    font: string;
    color: string | undefined;
    background: string;
    padding: string;
};
export declare function getContainerStyle(theme: CometChatTheme, callLogsStyle: CallLogParticipantsStyle): React.CSSProperties;
export declare function getTitleStyle(theme: CometChatTheme, style: CallLogParticipantsStyle): {
    font: string;
    color: string | undefined;
    background: string;
};
