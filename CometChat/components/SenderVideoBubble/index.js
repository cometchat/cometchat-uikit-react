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
    <div css={messageContainerStyle()} className="sender__message__container message__video">
      <ToolTip {...props} message={message} />
      <div css={messageWrapperStyle()} className="message__wrapper"> 
        <div css={messageVideoWrapperStyle(props)} className="message__video__wrapper">
          <video controls>
            <source src={props.message.data.url} />
          </video>                        
        </div>
      </div>
      <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
        <ReplyCount {...props} message={message} />
        <ReadReciept {...props} />
      </div>                          
    </div>
  )
}

export default sendervideobubble;