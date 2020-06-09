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
    <div className=" cp-receiver-file-container" >
        <div className="cp-float-left">{avatar}</div>
        <div className="cp-float-left cp-receiver-file-wrapper">
          {name}
          <div className=" cp-receiver-file" >
            <div>
              <a href={props.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{props.message.data.attachments[0].name} <img src={blueFile} alt="file"/></a>
            </div>
            <p>{props.message.data.attachments[0].extension}</p>
          </div>
          <div className="cp-time text-muted"> {new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>
        </div>
      </div>
  )
}

export default receiverfilebubble;