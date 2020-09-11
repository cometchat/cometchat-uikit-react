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
    <div css={messageContainerStyle()}>
      <div css={messageWrapperStyle()}> 
        <ToolTip action="viewMessageThread" {...props} message={message} />
        <div css={messageVideoWrapperStyle(props)}>
          <video controls>
            <source src={props.message.data.url} />
          </video>                        
        </div>
        <div css={messageInfoWrapperStyle()}>
          <ReplyCount action="viewMessageThread" {...props} message={message} />
          <ReadReciept {...props} />
        </div>
      </div>                            
    </div>
  )
}

export default sendervideobubble;