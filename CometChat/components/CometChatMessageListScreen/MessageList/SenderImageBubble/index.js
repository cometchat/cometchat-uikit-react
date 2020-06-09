import React from "react";
import "./style.scss";

import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";

const senderimagebubble = (props) => {

  let ticks = blueDoubleTick;
  if(props.message.sentAt && !props.message.readAt && !props.message.deliveredAt){
    ticks = greyTick;
  }else if(props.message.sentAt && !props.message.readAt && props.message.deliveredAt){
    ticks = greyDoubleTick
  }

  return (
    <div className="cp-sender-image-container" >
      <div className="cp-sender-image" >
        <img src={props.message.data.url} alt="sender"></img>
      </div>
      <div className="cp-time text-muted"> {new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
        <span><img src={ticks} alt="time"/></span>
      </div>
    </div>
  )

}

export default senderimagebubble;