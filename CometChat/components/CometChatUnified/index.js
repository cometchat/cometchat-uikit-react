import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";

import NavBar from "./NavBar";
import CometChatMessageScreen from "../CometChatMessageScreen"
import CallScreen from "../CallScreen";

class CometChatUnified extends React.Component {
  
  state = {
    darktheme: false,
    outgoingCall: undefined,
    item: {},
    type: "user",
    tab: "contacts",
    viewdetail: false,
    messageList: [],
    scrollToBottom: false
  }

  changeTheme = (e) => {
    this.setState({
      darktheme: !this.state.darktheme
    })
  }

  msgScreenAction = (action, messages) => {

    switch(action) {
      case "messageComposed":
      case "messageReceived":
        this.appendMessage(messages);
      break;
      case "messageUpdated":
        this.updateMessages(messages);
      break;
      case "messageFetched":
        this.prependMessages(messages);
      break;
      case "audioCall":
        this.audioCall();
      break;
      case "videoCall":
        this.videoCall();
      break;
      case "viewDetail":
        this.toggleUserDetail( );
      break;
      case "blockUser":
        this.blockUser( );
      break;
      case "unblockUser":
        this.unblockUser( );
      break;
      default:
      break;
    }

  }

  blockUser = () => {

    console.log("[CometChatUnified] blockUser", {...this.state.item});

    let usersList = [this.state.item.uid];
    CometChatManager.blockUsers(usersList).then(list => {

        console.log(list);console.log("[blockUser success]", this.state.item);
        
        this.setState({item: {...this.state.item, blockedByMe: true}});

    }).catch(error => {
      console.log("Blocking user fails with error", error);
    });
  }

  unblockUser = () => {

    console.log("[CometChatUnified] unblockUser", {...this.state.item});

    let usersList = [this.state.item.uid];
    CometChatManager.unblockUsers(usersList).then(list => {

        console.log(list);console.log("[unblockUser success]", this.state.item);
        
        this.setState({item: {...this.state.item, blockedByMe: false}});

      }).catch(error => {
      console.log("unblocking user fails with error", error);
    });
  }

  audioCall = () => {

    let receiverID;
    let receiverType = CometChat.RECEIVER_TYPE.USER;
    let callType = CometChat.CALL_TYPE.AUDIO;

    if (this.state.type === 'group') {
      receiverID = this.state.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    } else {
      receiverID = this.state.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    }

    CometChatManager.audioCall(receiverID, receiverType, callType).then(call => {

      this.callScreenAction("callStarted", call);
      this.setState({ outgoingCall: call });

    }).catch(error => {

      console.log("Call initialization failed with exception:", error);

    });

  }

  videoCall = () => {

    let receiverID;
    let receiverType = CometChat.RECEIVER_TYPE.USER;
    let callType = CometChat.CALL_TYPE.VIDEO;
    
    if (this.state.type === 'group') {
      receiverID = this.state.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    } else {
      receiverID = this.state.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    }

    CometChatManager.videoCall(receiverID, receiverType, callType).then(call => {

      this.callScreenAction("callStarted", call);
      this.setState({ outgoingCall: call });

    }).catch(error => {

      console.log("Call initialization failed with exception:", error);

    });
  }

  toggleUserDetail = () => {
    let viewdetail = !this.state.viewdetail;
    this.setState({viewdetail: viewdetail});
  }

  //messages are fetched from backend
  prependMessages = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList: messageList, scrollToBottom: false });
  }

  //message is received or composed & sent
  appendMessage = (message) => {

    let messages = [...this.state.messageList];
    messages = messages.concat(message);
    this.setState({ messageList: messages, scrollToBottom: true });
  }

  //message status is updated(read receipts)
  updateMessages = (messages) => {
    this.setState({ messageList: messages });
  }

  navBarAction = (action, type, item) => {
    
    switch(action) {
      case "itemClicked":
        this.itemClicked(item, type);
      break;
      case "tabChanged":
        this.tabChanged(type);
      break;
      case "groupMemberLeft":
        this.appendMessage(item);
      break;
      case "groupMemberJoined":
        this.appendMessage(item);
      break;
      case "userStatusChanged":
        this.updateSelectedUser(item);
      break;
      default:
      break;
    }
  }

  updateSelectedUser = (item) => {

    this.setState({ item: {...item}});
  }

  itemClicked = (item, type) => {
    
    //empty messagelist only if the user/group changes
    if(this.state.type === type) {
      
      if((type === "user" && item.uid !== this.state.item.uid) || 
      (type === "group" && item.guid !== this.state.item.guid)) {
        this.setState({ messageList: []});
      } 
    }
    else {
      this.setState({ messageList: []});
    }
    
    this.setState({ item: {...item}, type });
    this.setState({viewdetail: false});
    
  }

  tabChanged = (tab) => {
    this.setState({tab});
    this.setState({viewdetail: false});
  }

  callScreenAction = (action, call) => {

    switch(action) {
      case "callStarted":
      case "callEnded":
        if(!call) return;
        this.appendMessage(call);
      break;
      default:
      break;
    }
  }

  render() {

    let messageScreen = (<h1 className="cp-center-text">Select a chat to start messaging</h1>);
    if(Object.keys(this.state.item).length) {
      messageScreen = (<CometChatMessageScreen 
        messages={this.state.messageList}
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type} 
        viewdetail={this.state.viewdetail}
        scrollToBottom={this.state.scrollToBottom}
        actionGenerated={this.msgScreenAction}>
      </CometChatMessageScreen>);
    }
    
    return (
      <div className={"row cometchat-container " + (this.state.darktheme ? " dark" : " light")}>
        <div className="col-lg-3 col-sm-6 col-xs-12 cp-lists-container" >
          <div className="cp-lists">
            <NavBar 
            item={this.state.item} 
            tab={this.state.tab} 
            actionGenerated={this.navBarAction}></NavBar>
          </div>
        </div>
        <div className="col-lg-9 col-sm-6 col-xs-12 cp-chat-container">{messageScreen}</div>
        <CallScreen 
        actionGenerated={this.callScreenAction} 
        outgoingCall={this.state.outgoingCall}></CallScreen>
      </div>
    );
  }
}

export default CometChatUnified;