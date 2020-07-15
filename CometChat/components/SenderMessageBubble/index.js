import React from "react";

import "./style.scss";

import Tooltip from "../Tooltip"

import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";

const SenderMessageBubble = (props) => {

  let ticks = blueDoubleTick;
  if(props.message.sentAt && !props.message.readAt && !props.message.deliveredAt){
    ticks = greyTick;
  } else if(props.message.sentAt && !props.message.readAt && props.message.deliveredAt){
    ticks = greyDoubleTick
  }

  const message = Object.assign({}, props.message, {messageFrom: "sender"});

  let replies = null, tooltip = null;

  if((!props.widgetconfig && props.message.replyCount) 
  || (props.widgetconfig && props.widgetconfig["threaded-chats"] && props.message.replyCount)) {

    const replyCount = props.message.replyCount;
    const replyText = (replyCount === 1) ? `${replyCount} reply` : `${replyCount} replies`;

    replies = (<span className="cc1-chat-win-replies" onClick={() => props.actionGenerated("viewMessageThread", message)}>{replyText}</span>);

  }

  if((!props.widgetconfig) || (props.widgetconfig && props.widgetconfig["threaded-chats"])) {

    tooltip = (
      <Tooltip 
      placement="left" 
      trigger="click" 
      action="viewMessageThread" 
      message={message}
      actionGenerated={props.actionGenerated}>
        <span className="cc1-chat-win-sndr-row-message-action"></span>     
      </Tooltip> 
    );
  }

  return (
    <React.Fragment>
      <div className="cc1-chat-win-sndr-row clearfix">
        <div className="cc1-chat-win-msg-block">
          <div className="cc1-chat-win-sndr-msg-action-wrap">
            <div className="cc1-chat-win-sndr-msg-wrap">
              <p className="chat-txt-msg">{props.message.text}</p>                                
            </div>
            {tooltip}                      
          </div>
          <div className="cc1-chat-win-msg-time-wrap">
            {replies}
            <span className="cc1-chat-win-timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
              <img src={ticks} alt="time" />
            </span>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}

export default SenderMessageBubble;