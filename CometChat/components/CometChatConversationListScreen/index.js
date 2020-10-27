import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import * as enums from '../../util/enums.js';

import CometChatConversationList from "../CometChatConversationList";
import CometChatMessageListScreen from "../CometChatMessageListScreen";
import CometChatUserDetail from "../CometChatUserDetail";
import CometChatGroupDetail from "../CometChatGroupDetail";
import MessageThread from "../MessageThread";
import CallAlert from "../CallAlert";
import CallScreen from "../CallScreen";
import ImageView from "../ImageView";

import { theme } from "../../resources/theme";

import {
  chatScreenStyle,
  chatScreenSidebarStyle,
  chatScreenMainStyle,
  chatScreenSecondaryStyle
} from "./style";


class CometChatConversationListScreen extends React.Component {

  loggedInUser = null;

  constructor(props) {
		super(props);

    this.state = {
      darktheme: false,
      viewdetailscreen: false,
      item: {},
      type: "",
      tab: "conversations",
      groupToDelete: {},
      groupToLeave: {},
      groupToUpdate: {},
      threadmessageview: false,
      threadmessagetype: null,
      threadmessageitem: {},
      threadmessageparent: {},
      composedthreadmessage: {},
      incomingCall: null,
      outgoingCall: null,
      messageToMarkRead: {},
      callmessage: {},
      sidebarview: false,
      imageView: null,
      groupmessage: {},
      lastmessage: {}
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
    this.setState({darktheme: !theme})
  }

  itemClicked = (item, type) => {

    this.toggleSideBar();
    this.setState({ item: {...item}, type, viewdetailscreen: false })
  }

  actionHandler = (action, item, count, ...otherProps) => {
    
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
      case "menuClicked":{
        this.toggleSideBar();
        this.setState({ item: {} });
      }
        break;
      case "closeMenuClicked":
        this.toggleSideBar();
      break;
      case "groupUpdated":
        this.groupUpdated(item, count, ...otherProps);
      break;
      case "groupDeleted": 
        this.deleteGroup(item);
      break;
      case "leftGroup":
        this.leaveGroup(item, ...otherProps);
      break;
      case "membersUpdated":
        this.updateMembersCount(item, count);
      break;
      case "viewMessageThread":
        this.viewMessageThread(item);
      break;
      case "closeThreadClicked":
        this.closeThreadMessages();
      break;
      case "threadMessageComposed":
        this.onThreadMessageComposed(item);
        this.updateLastMessage(item[0]);
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
        this.appendCallMessage(item);
        break;
      case "viewActualImage":
        this.toggleImageView(item);
        break;
      case "membersAdded":
        this.membersAdded(item);
        break;
      case "memberUnbanned":
        this.memberUnbanned(item);
        break;
      case "memberScopeChanged":
        this.memberScopeChanged(item);
        break;
      case "messageComposed":
      case "messageEdited":
      case "messageDeleted":
        this.updateLastMessage(item[0]);
        break;
      default:
      break;
    }
  }

  updateLastMessage = (message) => {
    this.setState({ lastmessage: message });
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

  toggleDetailView = () => {

    let viewdetail = !this.state.viewdetailscreen;
    this.setState({viewdetailscreen: viewdetail, threadmessageview: false});
  }

  toggleSideBar = () => {

    const sidebarview = this.state.sidebarview;
    this.setState({ sidebarview: !sidebarview });
  }

  deleteGroup = (group) => {
    this.setState({groupToDelete: group, item: {}, type: "group", viewdetailscreen: false});
  }

  leaveGroup = (group) => {
    this.setState({groupToLeave: group, item: {}, type: "group", viewdetailscreen: false});
  }

  updateMembersCount = (item, count) => {

    const group = Object.assign({}, this.state.item, {membersCount: count});
    this.setState({item: group, groupToUpdate: group});
  }

  groupUpdated = (message, key, group, options) => {
    
    switch(key) {
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_KICKED: {
        if(options.user.uid === this.loggedInUser.uid) {
          this.setState({item: {}, type: "group", viewdetailscreen: false});
        }
        break;
      }
      case enums.GROUP_MEMBER_SCOPE_CHANGED: {
        
        if(options.user.uid === this.loggedInUser.uid) {

          const newObj = Object.assign({}, this.state.item, {"scope": options["scope"]})
          this.setState({item: newObj, type: "group", viewdetailscreen: false});
        }
        break;
      }
      default:
      break;
    }
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

  membersAdded = (members) => {

    const messageList = [];
    members.forEach(eachMember => {

      const message = `${this.loggedInUser.name} added ${eachMember.name}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { "category": "action", "message": message, "type": enums.ACTION_TYPE_GROUPMEMBER, "sentAt": sentAt };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  }

  memberUnbanned = (members) => {

    const messageList = [];
    members.forEach(eachMember => {

      const message = `${this.loggedInUser.name} unbanned ${eachMember.name}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { "category": "action", "message": message, "type": enums.ACTION_TYPE_GROUPMEMBER, "sentAt": sentAt };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  }

  memberScopeChanged = (members) => {

    const messageList = [];

    members.forEach(eachMember => {

      const message = `${this.loggedInUser.name} made ${eachMember.name} ${eachMember.scope}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { "category": "action", "message": message, "type": enums.ACTION_TYPE_GROUPMEMBER, "sentAt": sentAt };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  }

  render() {

    let threadMessageView = null;
    if(this.state.threadmessageview) {
      threadMessageView = (
        <div css={chatScreenSecondaryStyle(this.theme)} className="chats__secondary-view">
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

      if(this.state.type === "user") {

        detailScreen = (
          <div css={chatScreenSecondaryStyle(this.theme)} className="chats__secondary-view">
            <CometChatUserDetail
              theme={this.theme}
              item={this.state.item} 
              type={this.state.type}
              actionGenerated={this.actionHandler} />
          </div>);

      } else if (this.state.type === "group") {

        detailScreen = (
          <div css={chatScreenSecondaryStyle(this.theme)} className="chats__secondary-view">
          <CometChatGroupDetail
            theme={this.theme}
            item={this.state.item} 
            type={this.state.type}
            actionGenerated={this.actionHandler} />
          </div>
        );
      }
    }

    let messageScreen = null;
    if(Object.keys(this.state.item).length) {
      messageScreen = (
        <CometChatMessageListScreen
        theme={this.theme}
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type}
        composedthreadmessage={this.state.composedthreadmessage}
        callmessage={this.state.callmessage}
        groupmessage={this.state.groupmessage}
        loggedInUser={this.loggedInUser}
        actionGenerated={this.actionHandler} />
      );
    }

    let imageView = null;
    if (this.state.imageView) {
      imageView = (<ImageView open={true} close={() => this.toggleImageView(null)} message={this.state.imageView} />);
    }

    return (
      <div css={chatScreenStyle(this.theme)} className="cometchat cometchat--chats">
        <div css={chatScreenSidebarStyle(this.state, this.theme)} className="chats__sidebar">
          <CometChatConversationList
          theme={this.theme}
          item={this.state.item}
          type={this.state.type}
          groupToDelete={this.state.groupToDelete}
          groupToLeave={this.state.groupToLeave}
          groupToUpdate={this.state.groupToUpdate}
          messageToMarkRead={this.state.messageToMarkRead}
          onItemClick={this.itemClicked}
          lastMessage={this.state.lastmessage}
          actionGenerated={this.actionHandler}
          enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div css={chatScreenMainStyle(this.state)} className="chats__main">{messageScreen}</div>
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

export default CometChatConversationListScreen;