import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageTxtWrapperStyle,
  messageTxtStyle,
  messageInfoWrapperStyle
} from "./style";

const SenderMessageBubble = (props) => {

  const message = Object.assign({}, props.message, {messageFrom: "sender"});

  const emojiParsedMessage = twemoji.parse(props.message.text, {folder: "svg",  ext: ".svg"});
  const parsedMessage = ReactHtmlParser(emojiParsedMessage);

  const emojiMessage = parsedMessage.filter(message => (message instanceof Object && message.type === "img"));

  let showVariation = true;
  if(props.hasOwnProperty("widgetsettings") 
  && props.widgetsettings
  && props.widgetsettings.hasOwnProperty("main") 
  && props.widgetsettings.main.hasOwnProperty("show_emojis_in_larger_size")
  && props.widgetsettings.main["show_emojis_in_larger_size"] === false) {

    showVariation = false;
  }

  return (
    <div css={messageContainerStyle()}>
      <div css={messageWrapperStyle()}>
        <ToolTip theme={props.theme} action="viewMessageThread" {...props} message={message} />    
        <div css={messageTxtWrapperStyle(props)}>
          <p css={messageTxtStyle(parsedMessage, emojiMessage, showVariation)}>{parsedMessage}</p>                                
        </div>
        <div css={messageInfoWrapperStyle()}>
          <ReplyCount theme={props.theme} action="viewMessageThread" {...props} message={message} />
          <ReadReciept theme={props.theme} {...props} />
        </div>
      </div>
    </div>
  )
}

export default SenderMessageBubble;