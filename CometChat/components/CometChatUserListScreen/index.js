import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";

import CometChatUserList from "../CometChatUserList";
import CometChatMessageListScreen from "../CometChatMessageListScreen";
import CometChatUserDetail from "../CometChatUserDetail";
import MessageThread from "../MessageThread";
import CallAlert from "../CallAlert";
import CallScreen from "../CallScreen";
import ImageView from "../ImageView";

import { theme } from "../../resources/theme";

import {
  userScreenStyle,
  userScreenSidebarStyle,
  userScreenMainStyle,
  userScreenSecondaryStyle
} from "./style"

class CometChatUserListScreen extends React.Component {

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
      outgoingCall: null,
      callmessage: {},
      sidebarview: false,
      imageView: null,
    }

    this.theme = Object.assign({}, theme, this.props.theme);
  }
  
  componentDidMount() {

    if(!Object.keys(this.state.item).length) {
      this.toggleSideBar();
    }

    new CometChatManager().getLoggedInUser().then((user) => {
      this.loggedInUser = user;
    }).catch((error) => {
      console.log("[CometChatUnified] getLoggedInUser error", error);

    });
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
      case "audioCall":
        this.audioCall();
      break;
      case "videoCall":
        this.videoCall();
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
      case "acceptIncomingCall":
        this.acceptIncomingCall(item);
        break;
      case "acceptedIncomingCall":
        this.callInitiated(item);
        break;
      case "rejectedIncomingCall":
        this.rejectedIncomingCall(item, count);
        break;
      case "outgoingCallRejected":
      case "outgoingCallCancelled":
      case "callEnded":
        this.outgoingCallEnded(item);
        break;
      case "userJoinedCall":
      case "userLeftCall":
        //this.appendCallMessage(item);
        break;
      case "viewActualImage":
        this.toggleImageView(item);
        break;
      default:
      break;
    }
  }

  blockUser = () => {

    let usersList = [this.state.item.uid];
    CometChatManager.blockUsers(usersList).then(list => {

        this.setState({item: {...this.state.item, blockedByMe: true}});

    }).catch(error => {
      console.log("Blocking user fails with error", error);
    });

  }

  unblockUser = () => {
    
    let usersList = [this.state.item.uid];
    CometChatManager.unblockUsers(usersList).then(list => {

        this.setState({item: {...this.state.item, blockedByMe: false}});

      }).catch(error => {
      console.log("unblocking user fails with error", error);
    });

  }

  audioCall = () => {

    let receiverId, receiverType;
    if(this.state.type === "user") {

      receiverId = this.state.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;

    } else if(this.state.type === "group") {

      receiverId = this.state.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.AUDIO).then(call => {

      this.appendCallMessage(call);
      this.setState({ outgoingCall: call });

    }).catch(error => {
      console.log("Call initialization failed with exception:", error);
    });

  }

  videoCall = () => {

    let receiverId, receiverType;
    if(this.state.type === "user") {

      receiverId = this.state.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;

    } else if(this.state.type === "group") {
      receiverId = this.state.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }
   
    CometChatManager.call(receiverId, receiverType, CometChat.CALL_TYPE.VIDEO).then(call => {

      this.appendCallMessage(call);
      this.setState({ outgoingCall: call });

    }).catch(error => {
      console.log("Call initialization failed with exception:", error);
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

  acceptIncomingCall = (call) => {

    this.setState({ incomingCall: call });

    const type = call.receiverType;
    const id = (type === "user") ? call.sender.uid : call.receiverId;

    CometChat.getConversation(id, type).then(conversation => {

      this.itemClicked(conversation.conversationWith, type);

    }).catch(error => {

      console.log('error while fetching a conversation', error);
    });

  }

  callInitiated = (message) => {
    this.appendCallMessage(message);
  }

  rejectedIncomingCall = (incomingCallMessage, rejectedCallMessage) => {

    let receiverType = incomingCallMessage.receiverType;
    let receiverId = (receiverType === "user") ? incomingCallMessage.sender.uid : incomingCallMessage.receiverId;

    //marking the incoming call message as read
    if (incomingCallMessage.hasOwnProperty("readAt") === false) {
      CometChat.markAsRead(incomingCallMessage.id, receiverId, receiverType);
    }

    //updating unreadcount in chats list
    this.setState({ messageToMarkRead: incomingCallMessage });

    let item = this.state.item;
    let type = this.state.type;

    receiverType = rejectedCallMessage.receiverType;
    receiverId = rejectedCallMessage.receiverId;

    if ((type === 'group' && receiverType === 'group' && receiverId === item.guid)
      || (type === 'user' && receiverType === 'user' && receiverId === item.uid)) {

      this.appendCallMessage(rejectedCallMessage);
    }
  }

  outgoingCallEnded = (message) => {

    this.setState({ outgoingCall: null, incomingCall: null });
    this.appendCallMessage(message);
  }

  appendCallMessage = (call) => {

    this.setState({ callmessage: call });
  }

  toggleImageView = (message) => {
    this.setState({ imageView: message });
  }

  render() {

    let threadMessageView = null;
    if(this.state.threadmessageview) {
      threadMessageView = (
        <div css={userScreenSecondaryStyle(this.theme)} className="contacts__secondary-view">
          <MessageThread
          theme={this.theme}
          tab={this.state.tab}
          item={this.state.threadmessageitem}
          type={this.state.threadmessagetype}
          parentMessage={this.state.threadmessageparent}
          loggedInUser={this.loggedInUser}
          actionGenerated={this.actionHandler} />
        </div>
      );
    }

    let detailScreen;
    if(this.state.viewdetailscreen) {
      detailScreen = (
        <div css={userScreenSecondaryStyle(this.theme)} className="contacts__secondary-view">
          <CometChatUserDetail
            theme={this.theme}
            item={this.state.item} 
            type={this.state.type}
            actionGenerated={this.actionHandler} />
        </div>);
    }
    
    let messageScreen = null;
    if(Object.keys(this.state.item).length) {
      messageScreen = (<CometChatMessageListScreen
      theme={this.theme}
      item={this.state.item} 
      tab={this.state.tab}
      type={this.state.type}
      composedthreadmessage={this.state.composedthreadmessage}
      callmessage={this.state.callmessage}
      loggedInUser={this.loggedInUser}
      actionGenerated={this.actionHandler} />);
    }

    let imageView = null;
    if (this.state.imageView) {
      imageView = (<ImageView open={true} close={() => this.toggleImageView(null)} message={this.state.imageView} />);
    }

    return (
      <div css={userScreenStyle(this.theme)} className="cometchat cometchat--contacts">
        <div css={userScreenSidebarStyle(this.state, this.theme)} className="contacts__sidebar">
          <CometChatUserList
          theme={this.theme}
          item={this.state.item}
          type={this.state.type}
          onItemClick={this.itemClicked}
          actionGenerated={this.actionHandler}
          enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div css={userScreenMainStyle(this.state)} className="contacts__main">{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
        <CallAlert
        theme={this.theme}
        actionGenerated={this.actionHandler} />
        <CallScreen
        theme={this.theme}
        item={this.state.item} 
        type={this.state.type}
        incomingCall={this.state.incomingCall}
        outgoingCall={this.state.outgoingCall}
        loggedInUser={this.loggedInUser}
        actionGenerated={this.actionHandler} />
        {imageView}
      </div>
    );
  }
}

export default CometChatUserListScreen;
