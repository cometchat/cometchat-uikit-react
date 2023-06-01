import { CometChatTheme } from 'uikit-resources-lerna';
import {MessageBubbleAlignment} from 'uikit-utils-lerna';
import {CSSProperties} from 'react';

export const MessageBubbleWrapperStyles = (alignment: MessageBubbleAlignment, MessageBubbleAlignment: any) => {
  let justifyContent;
  if (alignment === MessageBubbleAlignment.right) {
      justifyContent = 'flex-end'
  } else if (alignment === MessageBubbleAlignment.left) {
    justifyContent = 'flex-start'
  }
  else if (alignment === MessageBubbleAlignment.center) {
    justifyContent = 'center'
  }
  return {
    display: 'flex',
    justifyContent: justifyContent,
    position: 'relative',
  } as CSSProperties
}

export const MessageBubbleContainerStyles = () => {
  return {
    paddingRight: '8px',
    borderRadius: 'inherit',
    display: 'flex',
    height: 'fit-content',
    width: 'fit-content',
  }
}

export const MessageBubbleAvatarStyles = () => {
  return {
    position: 'relative' ,
    borderRadius: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: '8px 4px',
    marginTop: '5px'
  } as CSSProperties
}

export const MessageBubbleAlignmentStyles = (alignment: MessageBubbleAlignment, MessageBubbleAlignment : any) => {
  return {
    flex: '1 1 0',
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    padding: "8px 2px",
    borderRadius: "inherit",
    justifyContent: "flex-start",
    alignItems: alignment === MessageBubbleAlignment.left ? "flex-start" : "flex-end",
  } as CSSProperties
}

export const MessageBubbleTitleStyles = (alignment: MessageBubbleAlignment, MessageBubbleAlignment: any) => {
  return {
    display:"flex",
    justifyContent: alignment === MessageBubbleAlignment.left ? "flex-start" : "flex-end",
    alignItems:"flex-start"
  }
}

export const MessageOptionsStyles = (alignment: MessageBubbleAlignment, MessageBubbleAlignment: any, headerView: any, theme: CometChatTheme) => {
  return {
    justifyContent: alignment === MessageBubbleAlignment.left ? "flex-start" : "flex-end",
    top: headerView && alignment === MessageBubbleAlignment.left ? "-4px" : "-24px",
    position: 'absolute',
    display: 'flex',
    zIndex: '1',
    alignItems: 'center',
    background: theme.palette.getBackground()
  } as CSSProperties
}