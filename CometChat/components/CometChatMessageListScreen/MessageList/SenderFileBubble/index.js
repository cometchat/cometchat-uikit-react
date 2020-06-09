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
    <div className="cp-sender-file-container" >
      <div className="cp-sender-file">
        <div>
          <a href={props.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{props.message.data.attachments[0].name} <img src={blueFile} alt="file"/></a>
        </div>
        <p>{props.message.data.attachments[0].extension}</p>      
      </div>
      <div className="cp-time text-muted"> {new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
        <span><img src={ticks} alt="time"></img></span></div>
    </div>
  )
}

export default senderfilebubble;