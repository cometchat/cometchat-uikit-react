import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatTheme } from '@cometchat/uikit-resources';
import { MessageHeaderStyle, MessagesConfiguration, MessagesStyle, UsersConfiguration, UsersStyle, WithMessagesStyle } from '@cometchat/uikit-shared';
import { LabelStyle } from '@cometchat/uikit-elements';
import { CSSProperties } from 'react';
export declare const getUsersWrapperStyles: (usersWithMessagesStyle: WithMessagesStyle | undefined, theme: CometChatTheme) => CSSProperties;
export declare const getWithMessagesSidebarStyle: (usersWithMessagesStyle: WithMessagesStyle | undefined, theme: CometChatTheme, isMobileView: boolean | undefined, activeUser: CometChat.User | undefined) => CSSProperties;
export declare const getWithMessagesMainStyle: (usersWithMessagesStyle: WithMessagesStyle | undefined, isMobileView: boolean | undefined, activeUser: CometChat.User | undefined) => CSSProperties;
export declare const getLabelStyle: (usersWithMessagesStyle: WithMessagesStyle | undefined, theme: CometChatTheme) => LabelStyle;
export declare const getUsersStyle: (usersConfiguration: UsersConfiguration | undefined) => UsersStyle;
export declare const getMessageHeaderStyle: (usersWithMessagesStyle: WithMessagesStyle | undefined, messagesConfiguration: MessagesConfiguration | undefined, isMobileView: boolean | undefined) => MessageHeaderStyle;
export declare const getMessageComposerStyle: (usersWithMessagesStyle: WithMessagesStyle | undefined, messagesConfiguration: MessagesConfiguration | undefined, isMobileView: boolean | undefined) => {
    attachIcontint?: string | undefined;
    sendIconTint?: string | undefined;
    emojiIconTint?: string | undefined;
    AIIconTint?: string | undefined;
    voiceRecordingIconTint?: string | undefined;
    inputBackground?: string | undefined;
    inputBorder?: string | undefined;
    inputBorderRadius?: string | undefined;
    dividerTint?: string | undefined;
    textFont?: string | undefined;
    textColor?: string | undefined;
    placeHolderTextColor?: string | undefined;
    placeHolderTextFont?: string | undefined;
    emojiKeyboardTextFont?: string | undefined;
    emojiKeyboardTextColor?: string | undefined;
    previewTitleFont?: string | undefined;
    previewTitleColor?: string | undefined;
    previewSubtitleColor?: string | undefined;
    previewSubtitleFont?: string | undefined;
    closePreviewTint?: string | undefined;
    maxInputHeight?: string | undefined;
    height?: string | undefined;
    width?: string | undefined;
    border?: string | undefined;
    borderRadius: string;
    background?: string | undefined;
};
export declare const getMessagesStyle: (messagesStyle?: MessagesStyle, withMessagesStyle?: WithMessagesStyle | undefined) => {
    messageTextColor?: string | undefined;
    messageTextFont?: string | undefined;
    height?: string | undefined;
    width?: string | undefined;
    border?: string | undefined;
    borderRadius?: string | undefined;
    background: string | undefined;
};
export declare const getEmptyMessageLayoutStyle: (isMobileView: boolean | undefined, activeUser: CometChat.User | undefined) => CSSProperties;
