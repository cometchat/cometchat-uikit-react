/** @jsx jsx */
import { jsx } from '@emotion/core'

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageAudioWrapperStyle,
  messageInfoWrapperStyle
} from "./style";

const senderaudiobubble = (props) => {

  const message = Object.assign({}, props.message, {messageFrom: "sender"});

  return (
    <div css={messageContainerStyle()} className="sender__message__container message__audio">
      <ToolTip {...props} message={message} />
      <div css={messageWrapperStyle()} className="message__wrapper">
        <div css={messageAudioWrapperStyle(props)} className="message__audio__wrapper">
          <audio controls>
            <source src={props.message.data.url} />
          </audio>                  
        </div>
      </div>
      <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
        <ReplyCount {...props} message={message} />
        <ReadReciept {...props} />
      </div>                          
    </div>
  )
}

export default senderaudiobubble;