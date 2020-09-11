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
import CallScreen from "../CallScreen";

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
      outgoingCall: null,
      callmessage: {},
      sidebarview: false
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

  onItemClicked = (item, type) => {
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
      case "menuClicked":
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
      break;
      case "callEnded":
        this.callUpdated(item);
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

    let callType = CometChat.CALL_TYPE.AUDIO;

    CometChatManager.audioCall(receiverId, receiverType, callType).then(call => {

      this.callUpdated(call);
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
   
    let callType = CometChat.CALL_TYPE.VIDEO;

    CometChatManager.videoCall(receiverId, receiverType, callType).then(call => {

      this.callUpdated(call);
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

  callUpdated = (call) => {
    this.setState({callmessage: call})
  }

  render() {

    let threadMessageView = null;
    if(this.state.threadmessageview) {
      threadMessageView = (
        <div css={chatScreenSecondaryStyle(this.theme)}>
          <MessageThread
          theme={this.theme}
          tab={this.state.tab}
          item={this.state.threadmessageitem}
          type={this.state.threadmessagetype}
          parentMessage={this.state.threadmessageparent}
          callmessage={this.state.callmessage}
          actionGenerated={this.actionHandler} />
        </div>
      );
    }

    let detailScreen;
    if(this.state.viewdetailscreen) {

      if(this.state.type === "user") {

        detailScreen = (
          <div css={chatScreenSecondaryStyle(this.theme)}>
            <CometChatUserDetail
              theme={this.theme}
              item={this.state.item} 
              type={this.state.type}
              actionGenerated={this.actionHandler} />
          </div>);

      } else if (this.state.type === "group") {

        detailScreen = (
          <div css={chatScreenSecondaryStyle(this.theme)}>
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
        loggedInUser={this.loggedInUser}
        actionGenerated={this.actionHandler} />
      );
    } 

    return (
      <div css={chatScreenStyle(this.theme)}>
        <div css={chatScreenSidebarStyle(this.state, this.theme)}>
          <CometChatConversationList
          theme={this.theme}
          item={this.state.item}
          groupToDelete={this.state.groupToDelete}
          groupToLeave={this.state.groupToLeave}
          groupToUpdate={this.state.groupToUpdate}
          onItemClick={this.onItemClicked}
          actionGenerated={this.actionHandler}
          enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div css={chatScreenMainStyle(this.state)}>{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
        <CallScreen
        theme={this.theme}
        item={this.state.item} 
        type={this.state.type}
        actionGenerated={this.actionHandler} 
        outgoingCall={this.state.outgoingCall} />
      </div>
    );
  }
}

export default CometChatConversationListScreen;