import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatGroupList, CometChatGroupDetails } from "../";
import { CometChatMessages, CometChatImageViewer, CometChatMessageThread } from "../../Messages";
import { CometChatIncomingDirectCall } from "../../Calls";

import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
  groupScreenStyle,
  groupScreenSidebarStyle,
  groupScreenMainStyle,
  groupScreenSecondaryStyle
} from "./style"

class CometChatGroupListWithMessages extends React.Component {

  loggedInUser = null;

  constructor(props) {

		super(props);

    this.state = {
      darktheme: false,
      viewdetailscreen: false,
      item: {},
      type: "group",
      tab: "groups",
      groupToUpdate: {},
      threadmessageview: false,
      threadmessagetype: null,
      threadmessageitem: {},
      threadmessageparent: {},
      composedthreadmessage: {},
      sidebarview: false,
      imageView: null,
      groupmessage: {},
      lang: props.lang,
      ongoingDirectCall: false
    }

    this.messageScreenRef = React.createRef();
    this.incomingMessageRef = React.createRef();
    this.groupListRef = React.createRef();

    CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;
    }).catch((error) => {
      console.log("[CometChatUnified] getLoggedinUser error", error);
    });
  }

  componentDidMount() {

    if (!Object.keys(this.state.item).length) {
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

  actionHandler = (action, item, count, ...otherProps) => {
    
    switch(action) {
      case "blockUser":
        this.blockUser();
      break;
      case "unblockUser":
        this.unblockUser();
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
      case "viewDetail":
      case "closeDetailClicked":
        this.toggleDetailView();
      break;
      case "groupUpdated":
        this.groupUpdated(item, count, ...otherProps);
        break;
      case enums.ACTIONS["GROUP_DELETED"]: 
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
      case "updateThreadMessage":
        this.updateThreadMessage(item[0], count);
        break;
      case enums.ACTIONS["ACCEPT_DIRECT_CALL"]:
        this.acceptDirectCall(item);
        break;
      case enums.ACTIONS["JOIN_DIRECT_CALL"]:
        this.joinDirectCall(item);
        break;
      case enums.ACTIONS["START_DIRECT_CALL"]:
        this.ongoingDirectCall(true);
        break;
      case enums.ACTIONS["END_DIRECT_CALL"]:
        this.ongoingDirectCall(false);
        break;
      default:
      break;
    }
  }

  acceptDirectCall = (call) => {

    const type = call.receiverType;
    const id = call.receiverId;

    CometChat.getConversation(id, type).then(conversation => {

      this.itemClicked(conversation.conversationWith, type);

      if (this.messageScreenRef) {
        this.messageScreenRef.actionHandler(enums.ACTIONS["ACCEPT_DIRECT_CALL"]);
      }
      this.ongoingDirectCall(true);

    }).catch(error => {

      console.log('error while fetching a conversation', error);
    });
  }

  joinDirectCall = () => {

    //pause alert audio and close the alert popup
    if (this.incomingMessageRef) {
      this.incomingMessageRef.ignoreCall();
    }
    this.ongoingDirectCall(true);
  }

  ongoingDirectCall = (flag) => {
    this.setState({ ongoingDirectCall: flag });
  }

  updateThreadMessage = (message, action) => {

    if (this.state.threadmessageview === false|| message.id !== this.state.threadmessageparent.id) {
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

  deleteGroup = (group) => {

    this.toggleSideBar();
    this.setState({ groupToDelete: group, item: {}, type: CometChat.RECEIVER_TYPE.GROUP, viewdetailscreen: false});
    this.groupListRef.removeGroupFromListOnDeleting(group);
  }

  leaveGroup = (group) => {
    this.setState({ item: {}, type: CometChat.RECEIVER_TYPE.GROUP, viewdetailscreen: false});
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
        <div css={groupScreenSecondaryStyle(this.props)} className="groups__secondary-view">
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
        <div css={groupScreenSecondaryStyle(this.props)} className="groups__secondary-view">
          <CometChatGroupDetails
          theme={this.props.theme}
          item={this.state.item} 
          type={this.state.type}
          lang={this.state.lang}
          actionGenerated={this.actionHandler} />
        </div>
      );
      
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
        groupmessage={this.state.groupmessage}
        loggedInUser={this.loggedInUser}
        lang={this.state.lang}
        parentComponent="groups"
        actionGenerated={this.actionHandler} />
      );
    }

    let imageView = null;
    if (this.state.imageView) {
      imageView = (<CometChatImageViewer open={true} close={() => this.toggleImageView(null)} message={this.state.imageView} lang={this.state.lang} />);
    }

    let incomingMessageView = (<CometChatIncomingDirectCall ref={el => this.incomingMessageRef = el} theme={this.props.theme} lang={this.state.lang} actionGenerated={this.actionHandler} />);
    if (this.state.ongoingDirectCall) {
      incomingMessageView = null;
    }

    return (
      <div css={groupScreenStyle(this.props.theme)} className="cometchat cometchat--groups">
        <div css={groupScreenSidebarStyle(this.state, this.props)} className="groups__sidebar">
          <CometChatGroupList 
          ref={el => this.groupListRef = el}
          theme={this.props.theme}
          item={this.state.item}
          type={this.state.type}
          lang={this.state.lang}
          groupToUpdate={this.state.groupToUpdate}
          onItemClick={this.itemClicked}
          actionGenerated={this.actionHandler}
          enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div css={groupScreenMainStyle(this.state, this.props)} className="groups__main">{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
        {imageView}
        {incomingMessageView}
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatGroupListWithMessages.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatGroupListWithMessages.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatGroupListWithMessages;