import { CometChatTheme, fontHelper } from "uikit-resources-lerna";
import { MessagesStyle } from "uikit-utils-lerna";
import {CSSProperties} from 'react';

export const DefaultMessagesStyle = (theme : CometChatTheme) => {
    return new MessagesStyle({
        width: "100%",
        height: "100%",
        background: theme.palette.getBackground(),
        borderRadius: "none",
        border: "none",
        messageTextColor: theme.palette.getAccent600(),
        messageTextFont: fontHelper(theme.typography.title1),
    });
}

export const MessagesWrapperStyle = (theme : CometChatTheme) => {
    return {
        position: 'relative',
        height: '100%',
        width: '100%',
        background: theme.palette.getBackground()
    } as CSSProperties
}

export const MessagesDivStyle = {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxSizing: 'border-box',
    justifyContent: 'space-between'
} as CSSProperties

export const ThreadedMessagesDivStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    width: '100%',
    maxHeight: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    maxWidth: '100%',
    zIndex: '1'
} as CSSProperties

export const MessagesDetailsDivStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    width: '100%',
    maxHeight: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    maxWidth: '100%',
    zIndex: '1'
} as CSSProperties

export const MessagesHeaderDivStyle = {
    height: '8%',
    width: '100%'
} as CSSProperties

export const MessagesListDivStyle = {
    height: '84%',
    width: '100%'
} as CSSProperties

export const CometChatThreadedMessagesDivStyle = {
    height: '100%',
    display: 'flex'
} as CSSProperties

export const MessagesComposerDivStyle = (theme : CometChatTheme) => {
    return {
        height: '8%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: theme.palette.getBackground()
    } as CSSProperties 
}
