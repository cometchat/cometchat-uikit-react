import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageVideoWrapperStyle,
  messageInfoWrapperStyle
} from "./style";

const sendervideobubble = (props) => {

  const message = Object.assign({}, props.message, {messageFrom: "sender"});

  return (
    <div css={messageContainerStyle()} className="message__container">
      <ToolTip {...props} message={message} />
      <div css={messageWrapperStyle()}> 
        <div css={messageVideoWrapperStyle(props)}>
          <video controls>
            <source src={props.message.data.url} />
          </video>                        
        </div>
      </div>
      <div css={messageInfoWrapperStyle()}>
        <ReplyCount {...props} message={message} />
        <ReadReciept {...props} />
      </div>                          
    </div>
  )
}

export default sendervideobubble;