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
    <div css={messageContainerStyle()} className="sender__message__container message__file">
      <ToolTip {...props} message={message} />
      <div css={messageWrapperStyle()} className="message__wrapper">
        <div css={messageFileWrapper(props)} className="message__file__wrapper">
          <a href={props.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{props.message.data.attachments[0].name} <img src={blueFile} alt="file"/></a>                      
        </div>
      </div> 
      <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
        <ReplyCount {...props} message={message} />
        <ReadReciept {...props} />
      </div>                           
    </div>
  )
}

export default senderfilebubble;