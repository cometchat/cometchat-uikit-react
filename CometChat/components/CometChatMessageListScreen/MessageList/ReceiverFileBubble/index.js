import React from "react";
import "./style.scss";

import { SvgAvatar } from '../../../../util/svgavatar';

import Avatar from "../../../Avatar";

import blueFile from "./resources/file-blue.svg";

const receiverfilebubble = (props) => {

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

  return (

    <div className="cc1-chat-win-rcvr-row clearfix">
      <div className="cc1-chat-win-msg-block">
        {avatar}
        <div className="cc1-chat-win-rcvr-dtls">
          {name}
          <div className="cc1-chat-win-rcvr-file-wrap">
          <a href={props.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{props.message.data.attachments[0].name} <img src={blueFile} alt="file"/></a>                        
          </div>
          <div className="cc1-chat-win-msg-time-wrap">
            <span className="cc1-chat-win-timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
          </div>
        </div>
         
      </div>
    </div>
  )
}

export default receiverfilebubble;