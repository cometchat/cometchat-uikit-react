import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { SvgAvatar } from '../../util/svgavatar';

import Avatar from "../Avatar";
import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageThumbnailStyle,
  messageDetailStyle,
  nameWrapperStyle,
  nameStyle,
  messageTxtWrapperStyle,
  messageTxtStyle,
  messageInfoWrapperStyle,
  messageTimestampStyle
} from "./style";

const receivermessagebuble = (props) => {
  
  let avatar = null, name = null;
  if(props.message.receiverType === 'group') {

    if(!props.message.sender.avatar) {

      const uid = props.message.sender.getUid();
      const char = props.message.sender.getName().charAt(0).toUpperCase();

      props.message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
    } 
    
    avatar = (
      <div css={messageThumbnailStyle}>
        <Avatar 
        cornerRadius="50%" 
        borderColor={props.theme.color.secondary}
        borderWidth="1px"
        image={props.message.sender.avatar} />
      </div>
    );

    name = (<div css={nameWrapperStyle(avatar)}><span css={nameStyle(props)}>{props.message.sender.name}</span></div>);
  }

  const message = Object.assign({}, props.message, {messageFrom: "receiver"});

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
        {avatar}
        <div css={messageDetailStyle(name)}>
          {name}
          <ToolTip action="viewMessageThread" {...props} message={message} />
          <div css={messageTxtWrapperStyle(props)}>
            <p css={messageTxtStyle(parsedMessage, emojiMessage, showVariation)}>{parsedMessage}</p>                                
          </div>
          <div css={messageInfoWrapperStyle()}>
            <span css={messageTimestampStyle(props)}>{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
            <ReplyCount action="viewMessageThread" {...props} message={message} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default receivermessagebuble;