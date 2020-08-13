import React from "react";
import classNames from "classnames";

import "./style.scss";

import { CometChatManager } from "../../util/controller";
import * as enums from '../../util/enums.js';

import NavBar from "./NavBar";
import CometChatMessageListScreen from "../CometChatMessageListScreen";
import CometChatUserDetail from "../CometChatUserDetail";
import CometChatGroupDetail from "../CometChatGroupDetail";
import MessageThread from "../MessageThread";

class CometChatUnified extends React.Component {

  loggedInUser = null;

  constructor(props) {
		super(props);

    this.leftPanelRef = React.createRef();
    this.rightPanelRef = React.createRef();
	}
  
  state = {
    darktheme: false,
    viewdetailscreen: false,
    item: {},
    type: "user",
    tab: "contacts",
    groupToDelete: {},
    groupToLeave: {},
    groupToUpdate: {},
    threadmessageview: false,
    threadmessagetype: null,
    threadmessageitem: {},
    threadmessageparent: {},
    composedthreadmessage: {}
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
    this.setState({
      darktheme: !this.state.darktheme
    })
  }

  navBarAction = (action, type, item) => {
    
    switch(action) {
      case "itemClicked":
        this.itemClicked(item, type);
      break;
      case "tabChanged":
        this.tabChanged(type);
      break;
      case "closeMenuClicked":
        this.toggleSideBar();
      break;
      default:
      break;
    }
  }
  
  itemClicked = (item, type) => {
    this.toggleSideBar();
    this.setState({ item: {...item}, type, viewdetailscreen: false });
  }

  tabChanged = (tab) => {
    this.setState({tab});
    this.setState({viewdetailscreen: false});
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
      case "menuClicked":
        this.toggleSideBar();
      break;
      case "groupUpdated":
        this.groupUpdated(item, count, ...otherProps);
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

  toggleDetailView = () => {

    let viewdetail = !this.state.viewdetailscreen;
    this.setState({viewdetailscreen: viewdetail,  threadmessageview: false});
  }

  toggleSideBar = () => {

    const elem = this.leftPanelRef.current;

		if(elem.classList.contains('active')) {
			elem.classList.remove('active');
		} else {
			elem.classList.add('active');
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

    let detailScreen = null;
    if(this.state.viewdetailscreen) {

      if(this.state.type === "user") {

        detailScreen = (
          <div className="ccl-right-panel" ref={this.rightPanelRef}>
            <CometChatUserDetail
              item={this.state.item} 
              type={this.state.type}
              actionGenerated={this.actionHandler} />
          </div>
          );

      } else if (this.state.type === "group") {

        detailScreen = (
          <div className="ccl-right-panel" ref={this.rightPanelRef}>
          <CometChatGroupDetail
            item={this.state.item} 
            type={this.state.type}
            actionGenerated={this.actionHandler} />
          </div>
        );
      }
    }
    
    let messageScreen = (<h1>Select a chat to start messaging</h1>);
    if(Object.keys(this.state.item).length) {
      messageScreen = (
        <CometChatMessageListScreen 
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type}
        composedthreadmessage={this.state.composedthreadmessage}
        actionGenerated={this.actionHandler} />
      );
    }

    const centerPanelClassName = classNames({
      "ccl-center-panel": true,
      "ccl-chat-center-panel": true,
      "right-panel-active": (this.state.threadmessageview || this.state.viewdetailscreen)
    });  
    
    return (
      <div className="unified">
        <div className="ccl-left-panel" ref={this.leftPanelRef}>
          <NavBar 
            item={this.state.item}
            tab={this.state.tab}
            groupToDelete={this.state.groupToDelete}
            groupToLeave={this.state.groupToLeave}
            groupToUpdate={this.state.groupToUpdate}
            actionGenerated={this.navBarAction}
            enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div className={centerPanelClassName}>{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
      </div>
    );
  }
}

export default CometChatUnified;