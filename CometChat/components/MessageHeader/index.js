import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { MessageHeaderManager } from "./controller";

import Avatar from "../Avatar";
import { SvgAvatar } from '../../util/svgavatar';

import * as enums from '../../util/enums.js';

import StatusIndicator from "../StatusIndicator";

import { 
  chatHeaderStyle, 
  chatDetailStyle, 
  chatSideBarBtnStyle, 
  chatThumbnailStyle,
  chatUserStyle,
  chatNameStyle,
  chatStatusStyle,
  chatOptionWrapStyle,
  chatOptionStyle
 } from "./style";

import menuIcon from './resources/menu-icon.svg';
import audioCallIcon from './resources/call-blue-icon.svg';
import videoCallIcon from './resources/video-call-blue-icon.svg';
import detailPaneIcon from './resources/details-pane-blue-icon.svg';

class MessageHeader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      status: null,
      presence: "offline",
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

    this.MessageHeaderManager.removeListeners();
    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {
      this.setStatusForUser();
    } else if (this.props.type === 'group' 
    && (prevProps.item.guid !== this.props.item.guid 
      || (prevProps.item.guid === this.props.item.guid && prevProps.item.membersCount !== this.props.item.membersCount)) ) {
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

  updateHeader = (key, item, groupUser) => {
    
    switch(key) {

      case enums.USER_ONLINE:
      case enums.USER_OFFLINE: {
        if(this.props.type === "user" && this.props.item.uid === item.uid) {

          if(this.props.widgetsettings 
            && this.props.widgetsettings.hasOwnProperty("main")
            && this.props.widgetsettings.main.hasOwnProperty("show_user_presence")
            && this.props.widgetsettings.main["show_user_presence"] === false) {
              return false;
            }
          this.setState({status: item.status, presence: item.status});
        }
      break;
      }
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        if(this.props.type === "group" 
        && this.props.item.guid === item.guid
        && this.props.loggedInUser.uid !== groupUser.uid) {

          let membersCount = parseInt(item.membersCount) - 1;
          const status = `${membersCount} members`;
          this.setState({status: status});
        }
      break;
      case enums.GROUP_MEMBER_JOINED:
        if(this.props.type === "group" && this.props.item.guid === item.guid) {

          let membersCount = parseInt(item.membersCount) + 1;
          const status = `${membersCount} members`;
          this.setState({status: status});
        }
      break;
      case enums.GROUP_MEMBER_ADDED:
        if(this.props.type === "group" && this.props.item.guid === item.guid) {

          let membersCount = parseInt(item.membersCount) + 1;
          const status = `${membersCount} members`;
          this.setState({status: status});
        }
      break;
      default:
      break;
    }
  }
    
  toggleTooltip = (event, flag) => {

    const elem = event.target;
    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;

    if(scrollWidth <= clientWidth) {
      return false;
    }

    if(flag) {
      elem.setAttribute("title", elem.textContent);
    } else {
      elem.removeAttribute("title");
    }
    
  }

  render() {

    let image, presence;
    if(this.props.type === "user") {

      if(!this.props.item.avatar) {

        const uid = this.props.item.uid;
        const char = this.props.item.name.charAt(0).toUpperCase();

        this.props.item.avatar = SvgAvatar.getAvatar(uid, char);
      }

      image = this.props.item.avatar;
      presence = (
        <StatusIndicator
        widgetsettings={this.props.widgetsettings}
        status={this.state.presence}
        cornerRadius="50%" 
        borderColor={this.props.theme.borderColor.primary}
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

    let status = (
      <span css={chatStatusStyle(this.props, this.state)}
      onMouseEnter={event => this.toggleTooltip(event, true)}
      onMouseLeave={event => this.toggleTooltip(event, false)}>{this.state.status}</span>
    );

    let audioCallBtn = (<span onClick={() => this.props.actionGenerated("audioCall")} css={chatOptionStyle(audioCallIcon)}></span>);
    let videoCallBtn = (<span onClick={() => this.props.actionGenerated("videoCall")} css={chatOptionStyle(videoCallIcon)}></span>);
    let viewDetailBtn = (<span onClick={() => this.props.actionGenerated("viewDetail")} css={chatOptionStyle(detailPaneIcon)}></span>);
    
    if(this.props.viewdetail === false) {
      viewDetailBtn = null;
    }

    if(this.props.item.blockedByMe === true || this.props.audiocall === false) {
      audioCallBtn = null;
    }

    if(this.props.item.blockedByMe === true || this.props.videocall === false) {
      videoCallBtn = null;
    }

    if(this.props.widgetsettings && this.props.widgetsettings.hasOwnProperty("main")) {

      if(this.props.widgetsettings.main.hasOwnProperty("enable_voice_calling")
      && this.props.widgetsettings.main["enable_voice_calling"] === false) {
        audioCallBtn = null;
      }

      if(this.props.widgetsettings.main.hasOwnProperty("enable_video_calling")
      && this.props.widgetsettings.main["enable_video_calling"] === false) {
        videoCallBtn = null;
      }

      if(this.props.widgetsettings.main.hasOwnProperty("show_user_presence")
      && this.props.widgetsettings.main["show_user_presence"] === false
      && this.props.type === "user") {
        status = null;
      }
      
    }

    return (
      <div css={chatHeaderStyle(this.props)}>
        <div css={chatDetailStyle()}>
          <div css={chatSideBarBtnStyle(menuIcon, this.props)} onClick={() => this.props.actionGenerated("menuClicked")}></div>
          <div css={chatThumbnailStyle()}>
            <Avatar 
            image={image} 
            cornerRadius="18px" 
            borderColor={this.props.theme.borderColor.primary}
            borderWidth="1px" />
            {presence}
          </div>
          <div css={chatUserStyle()}>
            <h6 css={chatNameStyle()} 
            onMouseEnter={event => this.toggleTooltip(event, true)} 
            onMouseLeave={event => this.toggleTooltip(event, false)}>{this.props.item.name}</h6>
            {status}
          </div>
        </div>
        <div css={chatOptionWrapStyle()}>
          {audioCallBtn}
          {videoCallBtn}
          {viewDetailBtn}
        </div>
      </div>
    );
  }
}

export default MessageHeader;