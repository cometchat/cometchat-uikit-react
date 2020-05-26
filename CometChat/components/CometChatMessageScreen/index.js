import React from "react";
import "./style.scss";

import ChatHeader from "./ChatHeader";
import ChatWindow from "./ChatWindow";
import MessageComposer from "./MessageComposer";
import UserProfile from "./UserProfile";

const messagescreen = (props) => {

    let detail;
    if(props.viewdetail) {
      detail = (<div className="cp-profile-container">
        <UserProfile 
        item={props.item} 
        type={props.type} 
        actionGenerated={props.actionGenerated}></UserProfile>
      </div>);
    }

    return (
      <div className="cp-chatview-container-wrapper">
        <div className="cp-chatview-container">
          <ChatHeader 
          item={props.item} 
          type={props.type} 
          actionGenerated={props.actionGenerated}></ChatHeader>
          <div className="cp-chatwindow-conatiner">
            <ChatWindow 
            messages={props.messages} 
            item={props.item} 
            type={props.type}
            actionGenerated={props.actionGenerated}></ChatWindow>
          </div>
          <MessageComposer 
          item={props.item} 
          type={props.type}
          actionGenerated={props.actionGenerated}></MessageComposer>
        </div>
        {detail}
      </div>
    )
}

export default React.memo(messagescreen);