import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageFileWrapper,
  messageInfoWrapperStyle
} from "./style";

import blueFile from "./resources/file-blue.svg";

const senderfilebubble = (props) => {

  const message = Object.assign({}, props.message, {messageFrom: "sender"});

  return (
    <div css={messageContainerStyle()}>
      <div css={messageWrapperStyle()}>
        <ToolTip action="viewMessageThread" {...props} message={message} />
        <div css={messageFileWrapper(props)}>
          <a href={props.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{props.message.data.attachments[0].name} <img src={blueFile} alt="file"/></a>                      
        </div>
        <div css={messageInfoWrapperStyle()}>
          <ReplyCount action="viewMessageThread" {...props} message={message} />
          <ReadReciept {...props} />
        </div>
      </div>                            
    </div>
  )
}

export default senderfilebubble;