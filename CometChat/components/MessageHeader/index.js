import React from "react";
import classNames from "classnames";

import { MessageHeaderManager } from "./controller";

import Avatar from "../Avatar";
import { SvgAvatar } from '../../util/svgavatar';

import * as enums from '../../util/enums.js';

import StatusIndicator from "../StatusIndicator";

import "./style.scss";

class MessageHeader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      status: null,
      presence: "offline"
    }
  }

  componentDidMount() {

    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if(this.props.type === "user") {
      this.setStatusForUser();
    } else {
      this.setStatusForGroup();
    }
  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {
      this.setStatusForUser();
    } else if (this.props.type === 'group' && prevProps.item.guid !== this.props.item.guid) {
      this.setStatusForGroup();
    }
  }

  setStatusForUser = () => {

    let status = this.props.item.status;
    const presence = (this.props.item.status === "online") ? "online" : "offline";

    if(this.props.item.status === "offline" && this.props.item.lastActiveAt) {
      status = "Last active at: " + new Date(this.props.item.lastActiveAt * 1000).toLocaleTimeString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    } else if(this.props.item.status === "offline") {
      status = "offline";
    }

    this.setState({status: status, presence: presence});
  }

  setStatusForGroup = () => {

    const status = `${this.props.item.membersCount} members`;
    this.setState({status: status});

  }

  componentWillUnmount() {

    this.MessageHeaderManager.removeListeners();
    this.MessageHeaderManager = null;
  }

  updateHeader = (key, item) => {
    
    console.log("MessageHeader updateHeader key", key, "item", item);
    switch(key) {

      case enums.USER_ONLINE:
      case enums.USER_OFFLINE: {

        if(this.props.type === "user" && this.props.item.uid === item.uid) {
          this.setState({status: item.status, presence: item.status})
        }

      }
      break;
      default:
      break;
    }
  }

  render() {

    let status, image, presence;
    if(this.props.type === "user") {

      if(!this.props.item.avatar) {

        const uid = this.props.item.uid;
        const char = this.props.item.name.charAt(0).toUpperCase();

        this.props.item.avatar = SvgAvatar.getAvatar(uid, char);
      }

      image = this.props.item.avatar;
      presence = (
        <StatusIndicator
          status={this.state.presence}
          cornerRadius="50%" 
          borderColor="rgb(238, 238, 238)" 
          borderWidth="1px" />
      );

    } else {

      if(!this.props.item.icon) {

        const guid = this.props.item.guid;
        const char = this.props.item.name.charAt(0).toUpperCase();

        this.props.item.icon = SvgAvatar.getAvatar(guid, char);
      }
      
      image = this.props.item.icon;
    }

    let viewDetailBtn = "", audioCallBtn = "", videoCallBtn = "";
  
    if(!this.props.item.blockedByMe && this.props.audiocall) {
      audioCallBtn = (<span onClick={() => this.props.actionGenerated("audioCall")} className="cc1-chat-win-con-opt call"></span>);
    }

    if(!this.props.item.blockedByMe && this.props.videocall) {
      videoCallBtn = (<span onClick={() => this.props.actionGenerated("videoCall")} className="cc1-chat-win-con-opt video-call"></span>);
    }
    
    if(this.props.viewdetail) {
      viewDetailBtn = (<span onClick={() => this.props.actionGenerated("viewDetail")} className="cc1-chat-win-con-opt details"></span>);
    }

    const statusClassName = classNames({
      "cc1-chat-win-user-status": true,
      "ccl-blue-color": (this.props.type === "user"),
      "offline": (this.props.type === "user" && this.state.presence === "offline"),
      "capitalize": (this.props.type === "user"),
      "ccl-secondary-color": (this.props.type === "group")
    });  

    return (
      <div className="cc1-chat-win-header clearfix">
        <div className="cc1-left-panel-trigger" onClick={() => this.props.actionGenerated("menuClicked")}></div>
        <div className="cc1-chat-win-user">
          <div className="cc1-chat-win-user-thumb">
            <Avatar 
            image={image} 
            cornerRadius="18px" 
            borderColor="#CCC"
            borderWidth="1px" />
            {presence}
          </div>
          <div className="cc1-chat-win-user-name-wrap">
            <h6 className="cc1-chat-win-user-name">{this.props.item.name}</h6>
            <span className={statusClassName}>{this.state.status}</span>
          </div>
        </div>
        <div className="cc1-chat-win-con-opt-wrap">
          {audioCallBtn}
          {videoCallBtn}
          {viewDetailBtn}
        </div>
      </div>
    );
  }
}

export default MessageHeader;