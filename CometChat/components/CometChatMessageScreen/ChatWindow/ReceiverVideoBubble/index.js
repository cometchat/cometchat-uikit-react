import React from "react";
import "./style.scss";

import { SvgAvatar } from '../../../../util/svgavatar';

import Avatar from "../../../Avatar";

const receivervideobubble = (props) => {
  
  let avatar = "", name = "";
  if(props.message.receiverType === 'group') {

    if(!props.message.sender.avatar) {

      const uid = props.message.sender.getUid();
      const char = props.message.sender.getName().charAt(0).toUpperCase();

      props.message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
    
    } 

    avatar = (
      <div className="cp-float-left">
        <Avatar 
        cornerRadius="50%" 
        borderColor="#CCC" 
        borderWidth="1px"
        image={props.message.sender.avatar}></Avatar>
      </div>
    );

    name = (<div className="text-muted">{props.message.sender.name}</div>);
  }

  return (
    <div className=" cp-receiver-video-container" >
      <div className="cp-float-left">{avatar}</div>
      <div className="cp-float-left cp-receiver-video-wrapper">
      {name}
      <div className=" cp-receiver-video" >
        <video controls>
          <source src={props.message.data.url} type="video/mp4"/>
          <source src={props.message.data.url} type="video/ogg"/>
        </video>
      </div>
      <div className="cp-time text-muted"> {new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>
      </div>
    </div>
  )
}

export default receivervideobubble;