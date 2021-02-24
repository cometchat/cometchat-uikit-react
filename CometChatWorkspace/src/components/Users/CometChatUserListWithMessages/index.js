import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatUserList, CometChatUserDetails } from "../";
import { CometChatMessages, CometChatImageViewer, CometChatMessageThread } from "../../Messages";
import { CometChatIncomingCall } from "../../Calls";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
  userScreenStyle,
  userScreenSidebarStyle,
  userScreenMainStyle,
  userScreenSecondaryStyle
} from "./style"

class CometChatUserListWithMessages extends React.Component {

  loggedInUser = null;

  constructor(props) {

		super(props);

    this.state = {
      darktheme: false,
      viewdetailscreen: false,
      item: {},
      type: "user",
      tab: "contacts",
      threadmessageview: false,
      threadmessagetype: null,
      threadmessageitem: {},
      threadmessageparent: {},
      composedthreadmessage: {},
      incomingCall: null,
      sidebarview: false,
      imageView: null,
      lang: props.lang
    }

    this.messageScreenRef = React.createRef();

    CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;
    }).catch((error) => {
      console.log("[CometChatUnified] getLoggedinUser error", error);
    });
  }
  
  componentDidMount() {

    if(!Object.keys(this.state.item).length) {
      this.toggleSideBar();
    }
  }

  componentDidUpdate(prevProps) {

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
    }
  }

  changeTheme = (e) => {

    const theme = this.state.darktheme;
    this.setState({darktheme: !theme});
  }

  itemClicked = (item, type) => {

    this.toggleSideBar();
    this.setState({ item: {...item}, type, viewdetailscreen: false });
  }

  actionHandler = (action, item, count) => {
    
    switch(action) {
      case "blockUser":
        this.blockUser();
      break;
      case "unblockUser":
        this.unblockUser();
      break;
      case "viewDetail":
      case "closeDetailClicked":
        this.toggleDetailView();
      break;
      // eslint-disable-next-line no-lone-blocks
      case "menuClicked": {
        this.toggleSideBar();
        this.setState({ item: {} });
      }
      break;
      case "closeMenuClicked":
        this.toggleSideBar();
      break;
      case "viewMessageThread":
        this.viewMessageThread(item);
      break;
      case "closeThreadClicked":
        this.closeThreadMessages();
      break;
      case "threadMessageComposed":
        this.onThreadMessageComposed(item);
      break;
      case "acceptedIncomingCall":
        this.acceptedIncomingCall(item);
        break;
      case "rejectedIncomingCall":
        this.rejectedIncomingCall(item, count);
        break;
      case "viewActualImage":
        this.toggleImageView(item);
        break;
      case "updateThreadMessage":
        this.updateThreadMessage(item[0], count);
        break;
      default:
      break;
    }
  }

  updateThreadMessage = (message, action) => {

    if (this.state.threadmessageview === false || message.id !== this.state.threadmessageparent.id) {
      return false;
    }

    if (action === "delete") {
      this.setState({ threadmessageparent: { ...message }, threadmessageview: false });
    } else {
      this.setState({ threadmessageparent: { ...message } });
    }

  }

  blockUser = () => {

    let usersList = [this.state.item.uid];
    CometChat.blockUsers(usersList).then(list => {

        this.setState({item: {...this.state.item, blockedByMe: true}});

    }).catch(error => {
      console.log("Blocking user fails with error", error);
    });

  }

  unblockUser = () => {
    
    let usersList = [this.state.item.uid];
    CometChat.unblockUsers(usersList).then(list => {

        this.setState({item: {...this.state.item, blockedByMe: false}});

      }).catch(error => {
      console.log("unblocking user fails with error", error);
    });

  }

  toggleSideBar = () => {

    const sidebarview = this.state.sidebarview;
    this.setState({ sidebarview: !sidebarview });
  }

  toggleDetailView = () => {

    let viewdetail = !this.state.viewdetailscreen;
    this.setState({viewdetailscreen: viewdetail,  threadmessageview: false});
  }

  closeThreadMessages = () => {
    this.setState({viewdetailscreen: false, threadmessageview: false});
  }

  viewMessageThread = (parentMessage) => {

    const message = {...parentMessage};
    const threaditem = {...this.state.item};
    this.setState({
      threadmessageview: true, 
      threadmessageparent: message, 
      threadmessageitem: threaditem,
      threadmessagetype: this.state.type, 
      viewdetailscreen: false
    });
  }

  onThreadMessageComposed = (composedMessage) => {

    if(this.state.type !== this.state.threadmessagetype) {
      return false;
    }

    if((this.state.threadmessagetype === "group" && this.state.item.guid !== this.state.threadmessageitem.guid)
    || (this.state.threadmessagetype === "user" && this.state.item.uid !== this.state.threadmessageitem.uid)) {
      return false;
    }

    const message = {...composedMessage};
    this.setState({composedthreadmessage: message});
  }

  acceptedIncomingCall = (call) => {

    const type = call.receiverType;
    const id = call.receiverId;

    CometChat.getConversation(id, type).then(conversation => {

      this.itemClicked(conversation.conversationWith, type);
      this.setState({ incomingCall: call });

    }).catch(error => {

      console.log('error while fetching a conversation', error);
    });

  }

  rejectedIncomingCall = (incomingCallMessage, rejectedCallMessage) => {

    if (this.messageScreenRef) {
      this.messageScreenRef.rejectedIncomingCall(incomingCallMessage, rejectedCallMessage);
    }
  }

  toggleImageView = (message) => {
    this.setState({ imageView: message });
  }

  render() {

    let threadMessageView = null;
    if(this.state.threadmessageview) {
      threadMessageView = (
        <div css={userScreenSecondaryStyle(this.props)} className="contacts__secondary-view">
          <CometChatMessageThread
          theme={this.props.theme}
          tab={this.state.tab}
          item={this.state.threadmessageitem}
          type={this.state.threadmessagetype}
          parentMessage={this.state.threadmessageparent}
          loggedInUser={this.loggedInUser}
          lang={this.state.lang}
          actionGenerated={this.actionHandler} />
        </div>
      );
    }

    let detailScreen;
    if(this.state.viewdetailscreen) {
      detailScreen = (
        <div css={userScreenSecondaryStyle(this.props)} className="contacts__secondary-view">
          <CometChatUserDetails
            theme={this.props.theme}
            item={this.state.item} 
            type={this.state.type}
            lang={this.state.lang}
            actionGenerated={this.actionHandler} />
        </div>);
    }
    
    let messageScreen = null;
    if(Object.keys(this.state.item).length) {
      messageScreen = (
      <CometChatMessages
      ref={(el) => { this.messageScreenRef = el; }}
      theme={this.props.theme}
      item={this.state.item} 
      tab={this.state.tab}
      type={this.state.type}
      composedthreadmessage={this.state.composedthreadmessage}
      loggedInUser={this.loggedInUser}
      lang={this.state.lang}
      parentComponent="users"
      incomingCall={this.state.incomingCall}
      actionGenerated={this.actionHandler} />);
    }

    let imageView = null;
    if (this.state.imageView) {
      imageView = (<CometChatImageViewer open={true} close={() => this.toggleImageView(null)} message={this.state.imageView} lang={this.state.lang} />);
    }

    return (
      <div css={userScreenStyle(this.props.theme)} className="cometchat cometchat--contacts" dir={Translator.getDirection(this.state.lang)}>
        <div css={userScreenSidebarStyle(this.state, this.props)} className="contacts__sidebar">
          <CometChatUserList
          theme={this.props.theme}
          item={this.state.item}
          type={this.state.type}
          lang={this.state.lang}
          onItemClick={this.itemClicked}
          actionGenerated={this.actionHandler}
          enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div css={userScreenMainStyle(this.state, this.props)} className="contacts__main">{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
        {imageView}
        <CometChatIncomingCall
        theme={this.props.theme}
        lang={this.state.lang}
        actionGenerated={this.actionHandler} />
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatUserListWithMessages.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatUserListWithMessages.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatUserListWithMessages;
