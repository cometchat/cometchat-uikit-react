import React from "react";
import classNames from "classnames";

import "./style.scss";

import { CometChatManager } from "../../util/controller";

import CometChatGroupList from "../CometChatGroupList";
import CometChatMessageListScreen from "../CometChatMessageListScreen";
import CometChatGroupDetail from "../CometChatGroupDetail";
import MessageThread from "../MessageThread";

class CometChatGroupListScreen extends React.Component {

  constructor(props) {
		super(props);

    this.leftPanelRef = React.createRef();

    this.state = {
      darktheme: false,
      viewdetailscreen: false,
      item: {},
      type: "group",
      tab: "groups",
      groupToDelete: {},
      groupToLeave: {},
      groupToUpdate: {},
      groupUpdated: {},
      threadmessageview: false,
      threadmessagetype: null,
      threadmessageitem: {},
      threadmessageparent: {},
      composedthreadmessage: {}
    }
  }

  componentDidMount() {

    if(!Object.keys(this.state.item).length) {
      this.toggleSideBar();
    }
  }

  changeTheme = (e) => {
    const theme = this.state.darktheme;
    this.setState({darktheme: !theme});
  }

  onItemClicked = (item, type) => {
    this.toggleSideBar();
    this.setState({ item: {...item}, type, viewdetailscreen: false });
  }

  actionHandler = (action, item, count, ...otherProps) => {
    
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
      case "groupDeleted": 
        this.deleteGroup(item);
      break;
      case "leftGroup":
        this.leaveGroup(item);
      break;
      case "membersUpdated":
        this.updateMembersCount(item, count);
      break;
      case "groupUpdated":
        this.groupUpdated(item, count, ...otherProps);
      break;
      case "menuClicked":
      case "closeMenuClicked":
        this.toggleSideBar();
      break;
      case "groupMemberLeft":
      case "groupMemberJoined":
        this.appendMessage(item);
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

  toggleSideBar = () => {

    const elem = this.leftPanelRef.current;

		if(elem.classList.contains('active')) {
			elem.classList.remove('active');
		} else {
			elem.classList.add('active');
		}
  }

  toggleDetailView = () => {
    let viewdetail = !this.state.viewdetailscreen;
    this.setState({viewdetailscreen: viewdetail,  threadmessageview: false});
  }

  deleteGroup = (group) => {
    this.setState({groupToDelete: group, item: {}, type: "group", viewdetailscreen: false});
  }

  leaveGroup = (group) => {
    this.setState({groupToLeave: group, item: {}, type: "group", viewdetailscreen: false});
  }

  updateMembersCount = (item, count) => {
    const group = Object.assign({}, this.state.item, {membersCount: count, scope: item.scope});
    this.setState({item: group, groupToUpdate: group});
  }

  groupUpdated = (message, key, ...otherProps) => {

    const groupUpdated = {};
    groupUpdated["action"] = key;
    groupUpdated["message"] = message;
    groupUpdated["messageId"] = message.id;
    groupUpdated["guid"] = message.receiver.guid;
    groupUpdated["props"] = {...otherProps};

    this.setState({groupUpdated: groupUpdated});
  }

  closeThreadMessages = () => {
    this.setState({viewdetailscreen: false,  threadmessageview: false});
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

  render() {

    let threadMessageView = null;
    if(this.state.threadmessageview) {
      threadMessageView = (
        <div className="ccl-right-panel" ref={this.rightPanelRef}>
          <MessageThread
          tab={this.state.tab}
          item={this.state.threadmessageitem}
          type={this.state.threadmessagetype}
          parentMessage={this.state.threadmessageparent}
          actionGenerated={this.actionHandler} />
        </div>
      );
    }

    let detailScreen;
    if(this.state.viewdetailscreen) {

      detailScreen = (
        <div className="ccl-right-panel">
        <CometChatGroupDetail
          item={this.state.item} 
          type={this.state.type}
          groupUpdated={this.state.groupUpdated}
          actionGenerated={this.actionHandler} />
        </div>
      );
      
    }

    let messageScreen = (<h1 className="cp-center-text">Select a chat to start messaging</h1>);
    if(Object.keys(this.state.item).length) {
      messageScreen = (
        <CometChatMessageListScreen 
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type}
        membersCount={this.state.groupMembersCount}
        composedthreadmessage={this.state.composedthreadmessage}
        actionGenerated={this.actionHandler} />
      );
    }

    const wrapperClassName = classNames({
      "groups": true,
      "dark": this.state.darktheme
    });

    return (
      <div className={wrapperClassName}>
        <div className="ccl-left-panel" ref={this.leftPanelRef}>
          <CometChatGroupList
          item={this.state.item}
          groupToDelete={this.state.groupToDelete}
          groupToLeave={this.state.groupToLeave}
          groupToUpdate={this.state.groupToUpdate}
          actionGenerated={this.actionHandler}
          onItemClick={this.onItemClicked} />
        </div>
        <div className="ccl-center-panel ccl-chat-center-panel">{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
      </div>
    );
  }
}

export default CometChatGroupListScreen;