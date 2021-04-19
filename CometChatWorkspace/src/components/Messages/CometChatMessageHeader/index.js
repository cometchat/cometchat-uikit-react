import React from "react";
import dateFormat from "dateformat";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { MessageHeaderManager } from "./controller";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
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

  item;
  static contextType = CometChatContext;

  constructor(props) {
    super(props);

    this.state = {
      status: "",
      presence: "offline",
    }

    CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
      console.error(error);
    });
  }

  componentDidMount() {

    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER) {
      this.setStatusForUser();
    } else if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP) {
      this.setStatusForGroup();
    }

    this.item = this.context.item;
  }

  componentDidUpdate(prevProps, prevState) {
    
    this.MessageHeaderManager.removeListeners();
    this.MessageHeaderManager = new MessageHeaderManager();
    this.MessageHeaderManager.attachListeners(this.updateHeader);

    if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER
    && (this.item !== this.context.item || prevProps.lang !== this.props.lang)) {

      this.setStatusForUser();

    } else if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP
    && (this.item !== this.context.item || prevProps.lang !== this.props.lang)) {

      this.setStatusForGroup();
    }

    this.item = this.context.item;
  }

  setStatusForUser = () => {

    let status = "";
    const presence = (this.context.item.status === "online") ? "online" : "offline";

    if (this.context.item.status === "offline" && this.context.item.lastActiveAt) {

      const lastActive = (this.context.item.lastActiveAt * 1000);
      const messageDate = dateFormat(lastActive, "dS mmm yyyy, h:MM TT");

      status = `${Translator.translate("LAST_ACTIVE_AT", this.props.lang)} : ${messageDate}`;

    } else if (this.context.item.status === "offline") {
      
      status = (Translator.translate("OFFLINE", this.props.lang));

    } else if (this.context.item.status === "online") {

      status = (Translator.translate("ONLINE", this.props.lang));
    }

    this.setState({status: status, presence: presence });
  }

  setStatusForGroup = () => {

    let membersText = (Translator.translate("MEMBERS", this.props.lang));
    const status = `${this.context.item.membersCount} ${membersText}`;
    this.setState({ status: status });
  }

  componentWillUnmount() {

    this.MessageHeaderManager.removeListeners();
    this.MessageHeaderManager = null;
  }

  updateHeader = (key, item, groupUser) => {
    
    switch(key) {

      case enums.USER_ONLINE:
      case enums.USER_OFFLINE: {
        if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER && this.context.item.uid === item.uid) {

          //if user presence is disabled in chat widget
          if (validateWidgetSettings(this.props.widgetsettings, "show_user_presence") === false) {
            return false;
          }
          let status = "";
          
          if (item.status === CometChat.USER_STATUS.OFFLINE) {

            status = Translator.translate("OFFLINE", this.props.lang);

          } else if (item.status === CometChat.USER_STATUS.ONLINE) {

            status = Translator.translate("ONLINE", this.props.lang);
          }

          this.setState({ status: status, presence: item.status });
        }
        break;
      }
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP
        && this.context.item.guid === item.guid
        && this.loggedInUser.uid !== groupUser.uid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} ${Translator.translate("MEMBERS", this.props.lang)}`;
          this.setState({status: status});
        }
      break;
      case enums.GROUP_MEMBER_JOINED:
        if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.context.item.guid === item.guid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} ${(Translator.translate("MEMBERS", this.props.lang))}`;
          this.setState({status: status});
        }
      break;
      case enums.GROUP_MEMBER_ADDED:
        if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.context.item.guid === item.guid) {

          let membersCount = parseInt(item.membersCount);
          const status = `${membersCount} ${(Translator.translate("MEMBERS", this.props.lang))}`;
          this.setState({status: status});
        }
      break;
      case enums.TYPING_STARTED:
        this.onTypingStarted(item);
      break;
      case enums.TYPING_ENDED: {

        if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.context.type === item.receiverType && this.context.item.guid === item.receiverId) {

          this.setStatusForGroup();
          this.props.actionGenerated("stopReaction", item);

        } else if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER && this.context.type === item.receiverType && this.context.item.uid === item.sender.uid) {
          
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

  onTypingStarted = (item) => {

    const showTyping = (typingText) => {

      if (item.hasOwnProperty("metadata") && item.metadata && item.metadata.hasOwnProperty("type") && item.metadata.type === enums.CONSTANTS["METADATA_TYPE_LIVEREACTION"]) {

        this.props.actionGenerated(enums.ACTIONS["SHOW_LIVE_REACTION"], item);

      } else {
        this.setState({ status: typingText });
      }
    }

    if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.context.type === item.receiverType && this.context.item.guid === item.receiverId) {

      const typingText = `${item.sender.name} ${Translator.translate("IS_TYPING", this.props.lang)}`;
      showTyping(typingText);

    } else if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER && this.context.type === item.receiverType && this.context.item.uid === item.sender.uid) {

      const typingText = `${Translator.translate("TYPING", this.props.lang)}`;
      showTyping(typingText);

    }
  }

  onTypingEnded = (item) => {

    const endLiveReaction = () => {

      if (item.hasOwnProperty("metadata") && item.metadata && item.metadata.hasOwnProperty("type") && item.metadata.type === enums.CONSTANTS["METADATA_TYPE_LIVEREACTION"]) {
        this.props.actionGenerated(enums.ACTIONS["STOP_LIVE_REACTION"], item);
      }
    }

    if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.context.type === item.receiverType && this.context.item.guid === item.receiverId) {

      this.setStatusForGroup();
      endLiveReaction();

    } else if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER && this.context.type === item.receiverType && this.context.item.uid === item.sender.uid) {

      if (this.state.presence === CometChat.USER_STATUS.ONLINE) {
        this.setState({ status: Translator.translate("ONLINE", this.props.lang), presence: CometChat.USER_STATUS.ONLINE });
      } else {
        this.setStatusForUser();
      }

      endLiveReaction();
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

  resetChat = () => {

    this.context.setItem({});
    this.props.actionGenerated(enums.ACTIONS["TOGGLE_SIDEBAR"])
  }

  render() {

    let avatar, presence;
    let videoCallClassName = "option__videocall-user";
    let audioCallClassName = "option__audiocall-user";
    let viewDetailClassName = "option__viewdetail-user";
    let chatWithClassName = "chat__user";
    let chatNameClassName = "user__name";
    let chatStatusClassName = "user__status";
    if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER) {

      avatar = (<CometChatAvatar user={this.context.item} />);
      presence = (
        <CometChatUserPresence
        widgetsettings={this.props.widgetsettings}
        status={this.state.presence}
        borderColor={this.props.theme.borderColor.primary} />
      );

    } else if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP) {

      chatWithClassName = "chat__group"; chatNameClassName = "group__name"; chatStatusClassName = "group__members";
      videoCallClassName = "option__videocall-group"; audioCallClassName = "option__audiocall-group"; viewDetailClassName = "option__viewdetail-group";
      avatar = (<CometChatAvatar group={this.context.item} />);
    }

    let status = (
      <span css={chatStatusStyle(this.props, this.state, this.context)} className={chatStatusClassName}>{this.state.status}</span>
    );

    const audioCallText = Translator.translate("AUDIO_CALL", this.props.lang);
    let audioCallBtn = ( 
      <div className={audioCallClassName} title={audioCallText} onClick={() => this.props.actionGenerated(enums.ACTIONS["INITIATE_AUDIO_CALL"])} css={chatOptionStyle(audioCallIcon)}>
        <img src={audioCallIcon} alt={audioCallText} />
      </div>);
    
    const videoCallText = Translator.translate("VIDEO_CALL", this.props.lang);
    let videoCallBtn = (
      <div className={videoCallClassName} title={videoCallText} onClick={() => this.props.actionGenerated(enums.ACTIONS["INITIATE_VIDEO_CALL"])} css={chatOptionStyle(videoCallIcon)}>
        <img src={videoCallIcon} alt={videoCallText} />
      </div>);

    const viewDetailText = Translator.translate("VIEW_DETAIL", this.props.lang);
    let viewDetailBtn = (<div className={viewDetailClassName} title={viewDetailText} onClick={() => this.props.actionGenerated(enums.ACTIONS["VIEW_DETAIL"])} css={chatOptionStyle(detailPaneIcon)}>
      <img src={detailPaneIcon} alt={viewDetailText} />
    </div>);
    
    if(this.props.viewdetail === false) {
      viewDetailBtn = null;
    }

    if ((this.context.type === CometChat.ACTION_TYPE.TYPE_USER && this.context.item.blockedByMe === true) 
    || this.props.audiocall === false 
    || this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP) {
      audioCallBtn = null;
    }

    if ((this.context.type === CometChat.ACTION_TYPE.TYPE_USER && this.context.item.blockedByMe === true) 
    || this.props.videocall === false) {
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
    if (validateWidgetSettings(this.props.widgetsettings, "show_user_presence") === false && this.context.type === CometChat.ACTION_TYPE.TYPE_USER) {
      status = null;
    }

    return (
      <div css={chatHeaderStyle(this.props)} className="chat__header">
        <div css={chatDetailStyle()} className="chat__details">
          <div css={chatSideBarBtnStyle(menuIcon, this.props)} className="chat__sidebar-menu" onClick={this.resetChat}></div>
          <div css={chatThumbnailStyle()} className="chat__thumbnail">
            {avatar}
            {presence}
          </div>
          <div css={chatUserStyle()} className={chatWithClassName}>
            <h6 css={chatNameStyle()} className={chatNameClassName}
            onMouseEnter={event => this.toggleTooltip(event, true)} 
            onMouseLeave={event => this.toggleTooltip(event, false)}>{this.context.item.name}</h6>
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
