import React from "react";
import "./style.scss";

import Tooltip from "../Tooltip";

import { SvgAvatar } from '../../util/svgavatar';

import Avatar from "../Avatar";

const receivervideobubble = (props) => {
  
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

    const replyCount = props.message.replyCount;
    const replyText = (replyCount === 1) ? `${replyCount} reply` : `${replyCount} replies`;
    replies = (<span className="cc1-chat-win-replies" onClick={() => props.actionGenerated("viewMessageThread", message)}>{replyText}</span>);
  }

  if((!props.widgetconfig) || (props.widgetconfig && props.widgetconfig["threaded-chats"])) {
    tooltip = (
      <Tooltip 
      placement="right" 
      trigger="click" 
      action="viewMessageThread" 
      message={message}
      actionGenerated={props.actionGenerated}>
        <span className="cc1-chat-win-rcvr-row-message-action"></span>     
      </Tooltip>
    );
  }
 
  return (

    <div className="cc1-chat-win-rcvr-row clearfix">
      <div className="cc1-chat-win-msg-block">
        {avatar}
        <div className="cc1-chat-win-rcvr-dtls">
          {name}
          <div className="cc1-chat-win-rcvr-video-action-wrap">
            <div className="cc1-chat-win-rcvr-video-wrap">
              <video controls>
                <source src={props.message.data.url} />
              </video>                        
            </div>
            {tooltip}
          </div>
          <div className="cc1-chat-win-msg-time-wrap">
            {replies}
            <span className="cc1-chat-win-timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default receivervideobubble;