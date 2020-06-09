import React from "react";
import "./style.scss";

import Avatar from "../../Avatar";

import callBlue from "./resources/call-blue-icon.svg";
import detailPaneBlue from "./resources/details-pane-blue-icon.svg";
import videoCallBlue from "./resources/video-call-blue-icon.svg";

const messageheader = (props) => {

  let status, image;
  if(props.type === "user") {
    status = props.item.status;
    image = props.item.avatar;
  } else {
    status = props.item.type;
    image = props.item.icon;
  }
  
  let viewDetailBtn = "", audioCallBtn = "", videoCallBtn = "";
  
  if(!props.item.blockedByMe && props.audiocall) {
    audioCallBtn = (<button onClick={() => props.actionGenerated("audioCall")} ><img src={callBlue} alt="Audio Call" /></button>);
  }

  if(!props.item.blockedByMe && props.videocall) {
    videoCallBtn = (<button onClick={() => props.actionGenerated("videoCall")} ><img src={videoCallBlue} alt="Video Call" /></button>);
  }
  
  if(props.viewdetail) {
    viewDetailBtn = (
      <button onClick={() => props.actionGenerated("viewDetail")}><img src={detailPaneBlue} alt="details" /></button>
    );
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
            {audioCallBtn}
            {videoCallBtn}
            {viewDetailBtn}
          </div>
          <div className="row cp-userstatus">
            <span className="cp-text-blue" >{status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(messageheader);