import React from "react";
import "./style.scss";

import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";
import blueFile from "./resources/file-blue.svg";

const senderfilebubble = (props) => {

  let ticks = blueDoubleTick;
  if(props.message.sentAt && !props.message.readAt && !props.message.deliveredAt){
    ticks = greyTick;
  }else if(props.message.sentAt && !props.message.readAt && props.message.deliveredAt){
    ticks = greyDoubleTick
  }

  return (

    <div className="cc1-chat-win-sndr-row clearfix">
      <div className="cc1-chat-win-msg-block">                                
        <div className="cc1-chat-win-sndr-file-wrap">
          <a href={props.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{props.message.data.attachments[0].name} <img src={blueFile} alt="file"/></a>                      
        </div>
        <div className="cc1-chat-win-msg-time-wrap">
          <span className="cc1-chat-win-timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
            <img src={ticks} alt="time" />
          </span>
        </div>
      </div>                            
    </div>
  )
}

export default senderfilebubble;