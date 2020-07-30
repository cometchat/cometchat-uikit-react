import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";
import classNames from "classnames";

import "./style.scss";

import { SvgAvatar } from '../../util/svgavatar';

import Avatar from "../Avatar";
import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";

const receivermessagebuble = (props) => {
  
  let avatar = "", name = "";
  if(props.message.receiverType === 'group') {

    if(!props.message.sender.avatar) {

      const uid = props.message.sender.getUid();
      const char = props.message.sender.getName().charAt(0).toUpperCase();

      props.message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
    
    } 
    
    avatar = (
      <div className="cc1-chat-win-rcvr-thumbnail-wrap">
        <Avatar 
        cornerRadius="50%" 
        borderColor="#CCC" 
        borderWidth="1px"
        image={props.message.sender.avatar}></Avatar>
      </div>
    );

    name = (<div className="cc1-chat-win-rcvr-name-wrap"><span className="cc1-chat-win-rcvr-name">{props.message.sender.name}</span></div>);
  }

  const message = Object.assign({}, props.message, {messageFrom: "receiver"});

  let replies = null, tooltip = null;
  if((!props.widgetconfig && props.message.replyCount) 
  || (props.widgetconfig && props.widgetconfig["threaded-chats"] && props.message.replyCount)) {

    replies = (
      <ReplyCount
      message={message}
      action="viewMessageThread"
      actionGenerated={props.actionGenerated} />
    );
  }

  if((!props.widgetconfig) || (props.widgetconfig && props.widgetconfig["threaded-chats"])) {
    tooltip = (
      <ToolTip
      message={message}
      action="viewMessageThread"
      actionGenerated={props.actionGenerated} />
    );
  }

  const emojiParsedMessage = twemoji.parse(props.message.text, {folder: "svg",  ext: ".svg"});
  const parsedMessage = ReactHtmlParser(emojiParsedMessage);

  const emojiMessage = parsedMessage.filter(message => (message instanceof Object && message.type === "img"));

  const messageClassName = classNames({
    "chat-txt-msg": true,
    "size1x": (parsedMessage.length === emojiMessage.length && emojiMessage.length === 1),
    "size2x": (parsedMessage.length === emojiMessage.length && emojiMessage.length === 2),
    "size3x": (parsedMessage.length === emojiMessage.length && emojiMessage.length > 2)
  });

  return (
    <div className="cc1-chat-win-rcvr-row clearfix">
      <div className="cc1-chat-win-msg-block">
        {avatar}
        <div className="cc1-chat-win-rcvr-dtls">
          {name}
          {tooltip}
          <div className="cc1-chat-win-rcvr-msg-wrap">
            <p className={messageClassName}>{parsedMessage}</p>                                
          </div>
          <div className="cc1-chat-win-msg-time-wrap">
            <span className="cc1-chat-win-timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
            {replies}
          </div>
        </div>
      </div>
    </div>
  )
}

export default receivermessagebuble;