import React from "react";
import classNames from "classnames";

import "./style.scss";

import { CometChatManager } from "../../util/controller";

import CometChatUserList from "../CometChatUserList";
import CometChatMessageListScreen from "../CometChatMessageListScreen";
import CometChatUserDetail from "../CometChatUserDetail";
import MessageThread from "../MessageThread";

class CometChatUserListScreen extends React.Component {

  constructor(props) {
		super(props);

    this.leftPanelRef = React.createRef();

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

  actionHandler = (action, item) => {
    
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
      case "menuClicked":
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
          <CometChatUserDetail
            item={this.state.item} 
            type={this.state.type}
            actionGenerated={this.actionHandler} />
        </div>);
    }
    
    let messageScreen = (<h1 className="cp-center-text">Select a chat to start messaging</h1>);
    if(Object.keys(this.state.item).length) {
      messageScreen = (<CometChatMessageListScreen 
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type}
        composedthreadmessage={this.state.composedthreadmessage}
        actionGenerated={this.actionHandler} />);
    }

    const wrapperClassName = classNames({
      "users": true,
      "dark": this.state.darktheme
    });

    const centerPanelClassName = classNames({
      "ccl-center-panel": true,
      "ccl-chat-center-panel": true,
      "right-panel-active": (this.state.threadmessageview || this.state.viewdetailscreen)
    });  

    return (
      <div className={wrapperClassName}>
        <div className="ccl-left-panel" ref={this.leftPanelRef}>
          <CometChatUserList 
          item={this.state.item}
          onItemClick={this.onItemClicked}
          actionGenerated={this.actionHandler}
          enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div className={centerPanelClassName}>{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
      </div>
    );
  }
}

export default CometChatUserListScreen;
