import React from "react";
import "./style.scss";

import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";

const sendervideobubble = (props) => {

  let ticks = blueDoubleTick;
  if(props.message.sentAt && !props.message.readAt && !props.message.deliveredAt){
    return greyTick;
  }else if(props.message.sentAt && !props.message.readAt && props.message.deliveredAt){
    return greyDoubleTick
  }
  
  return (
    <div className=" cp-sender-video-container" >
      <div className=" cp-sender-video" >
        <video controls>
          <source src={props.message.data.url} type="video/mp4"/>
          <source src={props.message.data.url} type="video/ogg"/>
        </video>
      </div>
      <div className="cp-time text-muted"> {new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
        <span><img src={ticks} alt="time"></img></span>
      </div>
    </div>
  )
}

export default sendervideobubble;