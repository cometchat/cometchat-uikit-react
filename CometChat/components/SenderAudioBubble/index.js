import React from "react";
import "./style.scss";

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";

import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";


const senderaudiobubble = (props) => {

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

  return (

    <div className="cc1-chat-win-sndr-row clearfix">
      <div className="cc1-chat-win-msg-block">
        {tooltip}
        <div className="cc1-chat-win-sndr-audio-wrap">
          <audio controls>
            <source src={props.message.data.url} />
          </audio>                  
        </div>
        <div className="cc1-chat-win-msg-time-wrap">
          {replies}
          <span className="cc1-chat-win-timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
            <img src={ticks} alt="time" />
          </span>
        </div>
      </div>                            
    </div>
  )
}

export default senderaudiobubble;