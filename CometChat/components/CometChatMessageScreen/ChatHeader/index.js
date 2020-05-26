import React from "react";
import "./style.scss";

import Avatar from "../../Avatar";

import callBlue from "./resources/call-blue-icon.svg";
import detailPaneBlue from "./resources/details-pane-blue-icon.svg";
import videoCallBlue from "./resources/video-call-blue-icon.svg";

const chatheader = (props) => {

  let status, image;
  if(props.type === "user") {
    status = props.item.status;
    image = props.item.avatar;
  } else {
    status = props.item.type;
    image = props.item.icon;
  }
  
  let callBtns = (
    <React.Fragment>
      <button onClick={() => props.actionGenerated("audioCall")} ><img src={callBlue} alt="call" /></button>
      <button onClick={() => props.actionGenerated("videoCall")} ><img src={videoCallBlue} alt="video call" /></button>
    </React.Fragment>
  );

  if(props.item.blockedByMe) {
    callBtns = "";
  }
  
  return (
    <div className="cp-chatheader" >
      <div style={{ display: "flex" }}>
        <div className="cp-chat-avatar" >
          <Avatar 
          image={image} 
          cornerRadius="50%" 
          borderColor="#CCC"
          borderWidth="1px"></Avatar>
        </div>
        <div className=" col cp-user-info">
          <div className="cp-username font-bold">{props.item.name}</div>
          <div className="cp-chathead-buttons ">
            {callBtns}
            <button onClick={() => props.actionGenerated("viewDetail")}><img src={detailPaneBlue} alt="details" /></button>
          </div>
          <div className="row cp-userstatus">
            <span className="cp-text-blue" >{status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(chatheader);