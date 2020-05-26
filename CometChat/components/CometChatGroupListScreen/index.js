import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";

import CometChatGroupList from "../CometChatGroupList";
import CometChatMessageScreen from "../CometChatMessageScreen"
import CallScreen from "../CallScreen";


class CometChatGroupListScreen extends React.Component {

  state = {
    darktheme: false,
    item: {},
    type: "group",
    tab: "groups",
    viewdetail: false,
    messageList: [],
    outgoingCall: null
  }

  changeTheme = (e) => {

    const theme = this.state.darktheme;
    this.setState({darktheme: !theme});

  }

  onItemClicked = (item, type) => {

    //empty messagelist only if user changes
    if(item.guid !== this.state.item.guid) {
      this.setState({ messageList: [] });
    }

    this.setState({ item: {...item}, type, viewdetail: false });
  }

  msgScreenAction = (action, messages) => {

    switch(action) {
      case "messageComposed":
      case "messageReceived":
        this.appendMessage(messages);
      break;
      case "messageFetched":
        this.updateMessageList(messages);
      break;
      case "audioCall":
        this.audioCall();
      break;
      case "videoCall":
        this.videoCall();
      break;
      case "viewDetail":
        this.toggleUserDetail();
      break;
      default:
      break;
    }

  }

  audioCall = () => {

    let receiverID = this.state.item.guid;
    let receiverType = CometChat.RECEIVER_TYPE.GROUP;
    let callType = CometChat.CALL_TYPE.AUDIO;

    CometChatManager.audioCall(receiverID, receiverType, callType).then(call => {

      console.log("Call initiated successfully:", call);
      this.callScreenAction("callStarted", call);
      this.setState({ outgoingCall: call });

    }).catch(error => {

      console.log("Call initialization failed with exception:", error);

    });

  }

  videoCall = () => {

    let receiverID = this.state.item.guid;
    let receiverType = CometChat.RECEIVER_TYPE.GROUP;
    let callType = CometChat.CALL_TYPE.VIDEO;

    CometChatManager.videoCall(receiverID, receiverType, callType).then(call => {

      console.log("Call initiated successfully:", call);
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

  //listener when messages are fetched from backend
  updateMessageList = (message) => {
    const messages = [...message, ...this.state.messageList];
    this.setState({ messageList: messages });
  }

  //listener when message is received from composer
  appendMessage = (message) => {
    let messages = [...this.state.messageList];
    messages = messages.concat(message);
    this.setState({ messageList: messages });
  }

  groupScreenAction = (action, type, item) => {

    switch(action) {
      case "groupMemberLeft":
        this.appendMessage(item);
      break;
      case "groupMemberJoined":
        this.appendMessage(item);
      break;
      default:
      break;
    }
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
        actionGenerated={this.msgScreenAction}>
      </CometChatMessageScreen>);
    }

    return (
      <div className={"row cometchat-container " + (this.state.darktheme ? "dark" : "light")}>
        <div className="col-lg-3 col-sm-6 col-xs-12 cp-lists-container" >
          <div className="cp-lists">
            <CometChatGroupList
            item={this.state.item} 
            actionGenerated={this.groupScreenAction}
            onItemClick={this.onItemClicked}></CometChatGroupList>
          </div>
        </div>
        <div className="col-lg-9 col-sm-6 col-xs-12 cp-chat-container">
        {messageScreen}
        <label className="switch">
          <input type="checkbox" onChange={this.changeTheme} />
          <span className="slider round"></span>
        </label>
        </div>
        <CallScreen 
        actionGenerated={this.callScreenAction}
        outgoingCall={this.state.outgoingCall}></CallScreen>
      </div>
    );
  }
}

export default CometChatGroupListScreen;