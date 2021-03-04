import React from "react";
import dateFormat from "dateformat";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { MessageHeaderManager } from "./controller";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

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

import menuIcon from "./resources/menuicon.png";
import audioCallIcon from "./resources/audiocall.png";
import videoCallIcon from "./resources/videocall.png";
import detailPaneIcon from "./resources/detailpane.png";

class CometChatMessageHeader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      status: "",
      presence: "offline",
    }
  }

  componentDidMount() {

    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {
      this.setStatusForUser();
    } else {
      this.setStatusForGroup();
    }
  }

  componentDidUpdate(prevProps, prevState) {

    this.MessageHeaderManager.removeListeners();
    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if (this.props.type === CometChat.RECEIVER_TYPE.USER
    && (prevProps.item.uid !== this.props.item.uid
    || (prevProps.item.uid === this.props.item.uid && prevProps.lang !== this.props.lang))) {

      this.setStatusForUser();

    } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP
    && (prevProps.item.guid !== this.props.item.guid 
    || (prevProps.item.guid === this.props.item.guid && prevProps.item.membersCount !== this.props.item.membersCount)
    || (prevProps.item.guid === this.props.item.guid && prevProps.lang !== this.props.lang)) ) {

      this.setStatusForGroup();
    }
  }

  setStatusForUser = () => {

    let status = "";
    const presence = (this.props.item.status === "online") ? "online" : "offline";

    if(this.props.item.status === "offline" && this.props.item.lastActiveAt) {

      const lastActive = (this.props.item.lastActiveAt * 1000);
      const messageDate = dateFormat(lastActive, "dS mmm yyyy, h:MM TT");

      status = `${Translator.translate("LAST_ACTIVE_AT", this.props.lang)} : ${messageDate}`;

    } else if(this.props.item.status === "offline") {
      
      status = (Translator.translate("OFFLINE", this.props.lang));

    } else if (this.props.item.status === "online") {

      status = (Translator.translate("ONLINE", this.props.lang));
    }

    this.setState({status: status, presence: presence});
  }

  setStatusForGroup = () => {

    let membersText = (Translator.translate("MEMBERS", this.props.lang));
    const status = `${this.props.item.membersCount} ${membersText}`;
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

          //if user presence is disabled in chat widget
          if (validateWidgetSettings(this.props.widgetsettings, "show_user_presence") === false) {
            return false;
          }
          let status = "";
          
          if (item.status === "offline") {

            status = Translator.translate("OFFLINE", this.props.lang);

          } else if (item.status === "online") {

            status = Translator.translate("ONLINE", this.props.lang);
          }

          this.setState({ status: status, presence: item.status });
        }
        break;
      }
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        if(this.props.type === "group" 
        && this.props.item.guid === item.guid
        && this.props.loggedInUser.uid !== groupUser.uid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} ${Translator.translate("MEMBERS", this.props.lang)}`;
          this.setState({status: status});
        }
      break;
      case enums.GROUP_MEMBER_JOINED:
        if(this.props.type === "group" && this.props.item.guid === item.guid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} ${(Translator.translate("MEMBERS", this.props.lang))}`;
          this.setState({status: status});
        }
      break;
      case enums.GROUP_MEMBER_ADDED:
        if(this.props.type === "group" && this.props.item.guid === item.guid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} ${(Translator.translate("MEMBERS", this.props.lang))}`;
          this.setState({status: status});
        }
      break;
      case enums.TYPING_STARTED: {
        
        if (this.props.type === "group" && this.props.type === item.receiverType && this.props.item.guid === item.receiverId) {

          const typingText = `${item.sender.name} ${Translator.translate("IS_TYPING", this.props.lang)}`;
          this.setState({ status: typingText });
          this.props.actionGenerated("showReaction", item);

        } else if (this.props.type === "user" && this.props.type === item.receiverType && this.props.item.uid === item.sender.uid) {

          const typingText = `${Translator.translate("TYPING", this.props.lang)}`;
          this.setState({ status: typingText });
          this.props.actionGenerated("showReaction", item);
        }
        
        break;
      }
      case enums.TYPING_ENDED: {

        if (this.props.type === "group" && this.props.type === item.receiverType && this.props.item.guid === item.receiverId) {

          this.setStatusForGroup();
          this.props.actionGenerated("stopReaction", item);

        } else if (this.props.type === "user" && this.props.type === item.receiverType && this.props.item.uid === item.sender.uid) {
          
          this.props.actionGenerated("stopReaction", item);

          if(this.state.presence === "online") {
            this.setState({ status: Translator.translate("ONLINE", this.props.lang), presence: "online" });
          } else {
            this.setStatusForUser();
          }
        }
        break;
      }
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

    let avatar, presence;
    let chatWithClassName = "chat__user", chatNameClassName = "user__name", chatStatusClassName = "user__status";
    if (this.props.type === enums.CHAT_WITH_USER) {

      avatar = (<CometChatAvatar user={this.props.item} />);
      presence = (
        <CometChatUserPresence
        widgetsettings={this.props.widgetsettings}
        status={this.state.presence}
        borderColor={this.props.theme.borderColor.primary} />
      );

    } else {

      chatWithClassName = "chat__group"; chatNameClassName = "group__name"; chatStatusClassName = "group__members";
      avatar = (<CometChatAvatar group={this.props.item} />);
    }

    let status = (
      <span css={chatStatusStyle(this.props, this.state)} className={chatStatusClassName}>{this.state.status}</span>
    );

    const audioCallText = Translator.translate("AUDIO_CALL", this.props.lang);
    let audioCallBtn = ( 
      <div title={audioCallText} onClick={() => this.props.actionGenerated("audioCall")} css={chatOptionStyle(audioCallIcon)}>
        <img src={audioCallIcon} alt={audioCallText} />
      </div>);
    
    const videoCallText = Translator.translate("VIDEO_CALL", this.props.lang);
    let videoCallBtn = (
      <div title={videoCallText} onClick={() => this.props.actionGenerated("videoCall")} css={chatOptionStyle(videoCallIcon)}>
        <img src={videoCallIcon} alt={videoCallText} />
      </div>);

    const viewDetailText = Translator.translate("VIEW_DETAIL", this.props.lang);
    let viewDetailBtn = (<div title={viewDetailText}  onClick={() => this.props.actionGenerated("viewDetail")} css={chatOptionStyle(detailPaneIcon)}>
      <img src={detailPaneIcon} alt={viewDetailText} />
    </div>);
    
    if(this.props.viewdetail === false) {
      viewDetailBtn = null;
    }

    if (this.props.item.blockedByMe === true || this.props.audiocall === false || this.props.type === enums.CHAT_WITH_GROUP) {
      audioCallBtn = null;
    }

    if(this.props.item.blockedByMe === true || this.props.videocall === false) {
      videoCallBtn = null;
    }

    //if audiocall is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_voice_calling") === false) {
      audioCallBtn = null;
    }

    //if videocall is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_video_calling") === false) {
      videoCallBtn = null;
    }

    //if user presence is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "show_user_presence") === false && this.props.type === "user") {
      status = null;
    }

    return (
      <div css={chatHeaderStyle(this.props)} className="chat__header">
        <div css={chatDetailStyle()} className="chat__details">
          <div css={chatSideBarBtnStyle(menuIcon, this.props)} className="chat__sidebar-menu" onClick={() => this.props.actionGenerated("menuClicked")}></div>
          <div css={chatThumbnailStyle()} className="chat__thumbnail">
            {avatar}
            {presence}
          </div>
          <div css={chatUserStyle()} className={chatWithClassName}>
            <h6 css={chatNameStyle()} className={chatNameClassName}
            onMouseEnter={event => this.toggleTooltip(event, true)} 
            onMouseLeave={event => this.toggleTooltip(event, false)}>{this.props.item.name}</h6>
            {status}
          </div>
        </div>
        <div css={chatOptionWrapStyle()} className="chat__options">
          {audioCallBtn}
          {videoCallBtn}
          {viewDetailBtn}
        </div>
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatMessageHeader.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  item: {},
  type: ""
};

CometChatMessageHeader.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  item: PropTypes.object,
  type: PropTypes.string
}

export default CometChatMessageHeader;