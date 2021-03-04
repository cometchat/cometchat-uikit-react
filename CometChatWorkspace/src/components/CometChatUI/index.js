import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatNavBar } from "./CometChatNavBar";
import { CometChatMessages, CometChatImageViewer, CometChatMessageThread } from "../Messages";
import { CometChatUserDetails } from "../Users";
import { CometChatGroupDetails } from "../Groups";
import { CometChatIncomingCall, CometChatIncomingDirectCall } from "../Calls";

import * as enums from "../../util/enums.js";

import { theme } from "../../resources/theme";
import Translator from "../../resources/localization/translator";

import {
  unifiedStyle,
  unifiedSidebarStyle,
  unifiedMainStyle,
  unifiedSecondaryStyle
} from "./style";

class CometChatUI extends React.Component {

  loggedInUser = null;

  constructor(props) {
    
    super(props);

    this.tabs = {
      "CHATS": "chats",
      "USERS": "users",
      "CALLS": "calls",
      "GROUPS": "groups",
      "INFO": "info"
    }
    
    this.state = {
      darktheme: false,
      viewdetailscreen: false,
      item: {},
      type: "user",
      activeTab: this.tabs["CHATS"],
      groupToUpdate: {},
      threadmessageview: false,
      threadmessagetype: null,
      threadmessageitem: {},
      threadmessageparent: {},
      composedthreadmessage: {},
      incomingCall: null,
      sidebarview: false,
      imageView: null,
      groupmessage: {},
      lastmessage: {},
      lang: props.lang,
      unreadMessages: [],
      ongoingDirectCall: false
    }

    this.messageScreenRef = React.createRef();
    this.navBarRef = React.createRef();
    this.incomingMessageRef = React.createRef();

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

    this.setState({ activeTab: tab });
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
      // eslint-disable-next-line no-lone-blocks
      case "menuClicked": {
        
        this.toggleSideBar();
        this.setState({ item: {} });
      }
      break;
      case "groupUpdated":
        this.groupUpdated(item, count, ...otherProps);
      break;
      case enums.ACTIONS["GROUP_DELETED"]: 
        this.deleteGroup(item);
      break;
      case enums.ACTIONS["GROUP_LEFT"]:
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
        this.updateLastMessage(item[0]);
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
        this.navBarRef.updateLastMessage(item[0]);
      break;
      case "messageEdited":
      case "messageDeleted":
        this.updateLastMessage(item[0]);
      break;
      case "updateThreadMessage":
        this.updateThreadMessage(item[0], count);
      break;
      case "unreadMessages":
        this.setState({ unreadMessages: [...item] });
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

  updateLastMessage = (message) => {
    this.setState({ lastmessage: message });
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

  toggleDetailView = () => {

    let viewdetail = !this.state.viewdetailscreen;
    this.setState({viewdetailscreen: viewdetail,  threadmessageview: false});
  }

  toggleSideBar = () => {

    const sidebarview = this.state.sidebarview;
    this.setState({ sidebarview: !sidebarview });
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

    const message = { ...composedMessage };
    this.setState({composedthreadmessage: message});
  }

  deleteGroup = (group) => {

    this.toggleSideBar();
    this.setState({ item: {}, type: CometChat.RECEIVER_TYPE.GROUP, viewdetailscreen: false});
    this.navBarRef.removeGroupFromListOnDeleting(group);
  }

  leaveGroup = (group) => {

    this.toggleSideBar();
    this.setState({ item: {}, type: CometChat.RECEIVER_TYPE.GROUP, viewdetailscreen: false});
  }

  updateMembersCount = (item, count) => {

    //console.log("updateMembersCount item", item);
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

  membersAdded = (members) => {
    
    const messageList = [];
    members.forEach(eachMember => {

      const message = `${this.loggedInUser.name} ${Translator.translate("ADDED", this.state.lang)} ${eachMember.name}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { 
        "category": CometChat.CATEGORY_ACTION, 
        "message": message, 
        "type": enums.ACTION_TYPE_GROUPMEMBER, 
        "sentAt": sentAt, 
        "action": CometChat.ACTION_TYPE.MEMBER_ADDED,
        "actionBy": { ...this.loggedInUser }, 
        "actionOn": { ...eachMember } 
      };

      messageList.push(messageObj);
    });
    
    this.setState({ groupmessage: messageList });
  }

  memberUnbanned = (members) => {

    const messageList = [];
    members.forEach(eachMember => {

      const message = `${this.loggedInUser.name} ${Translator.translate("UNBANNED", this.state.lang)} ${eachMember.name}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { 
        "category": CometChat.CATEGORY_ACTION, 
        "message": message, 
        "type": enums.ACTION_TYPE_GROUPMEMBER, 
        "sentAt": sentAt,
        "action": CometChat.ACTION_TYPE.MEMBER_UNBANNED,
        "actionBy": { ...this.loggedInUser },
        "actionOn": { ...eachMember } 
      };

      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  }

  memberScopeChanged = (members) => {

    const messageList = [];

    members.forEach(eachMember => {

      const newScope = Translator.translate(eachMember.scope, this.state.lang);

      const message = `${this.loggedInUser.name} ${Translator.translate("MADE", this.state.lang)} ${eachMember.name} ${newScope}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { 
        "category": CometChat.CATEGORY_ACTION, 
        "message": message, 
        "type": enums.ACTION_TYPE_GROUPMEMBER, 
        "sentAt": sentAt,
        "action": CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED,
        "actionBy": { ...this.loggedInUser },
        "actionOn": { ...eachMember } 
      };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  }

  toggleImageView = (message) => {
    this.setState({ imageView: message });
  }
  
  render() {

    let threadMessageView = null;
    if(this.state.threadmessageview) {
      threadMessageView = (
        <div css={unifiedSecondaryStyle(this.props)} className="unified__secondary-view">
          <CometChatMessageThread
          theme={this.props.theme}
          activeTab={this.state.activeTab}
          item={this.state.threadmessageitem}
          type={this.state.threadmessagetype}
          parentMessage={this.state.threadmessageparent}
          loggedInUser={this.loggedInUser}
          lang={this.state.lang}
          actionGenerated={this.actionHandler} />
        </div>
      );
    }

    let detailScreen = null;
    if(this.state.viewdetailscreen) {

      if(this.state.type === "user") {

        detailScreen = (
          <div css={unifiedSecondaryStyle(this.props)} className="unified__secondary-view">
            <CometChatUserDetails
              theme={this.props.theme}
              item={this.state.item} 
              type={this.state.type}
              lang={this.state.lang}
              actionGenerated={this.actionHandler} />
          </div>
          );

      } else if (this.state.type === "group") {

        detailScreen = (
          <div css={unifiedSecondaryStyle(this.props)} className="unified__secondary-view">
          <CometChatGroupDetails
            theme={this.props.theme}
            item={this.state.item} 
            type={this.state.type}
            lang={this.state.lang}
            actionGenerated={this.actionHandler} />
          </div>
        );
      }
    }
    
    let messageScreen = null;
    if(Object.keys(this.state.item).length) {
      messageScreen = (
        <CometChatMessages 
        ref={el => this.messageScreenRef = el}
        theme={this.props.theme}
        item={this.state.item} 
        activeTab={this.state.activeTab}
        type={this.state.type}
        composedthreadmessage={this.state.composedthreadmessage}
        groupmessage={this.state.groupmessage}
        loggedInUser={this.loggedInUser}
        lang={this.state.lang}
        parentComponent="unified"
        incomingCall={this.state.incomingCall}
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
      <div css={unifiedStyle(this.props.theme)} className="cometchat cometchat--unified" dir={Translator.getDirection(this.state.lang)}>
        <div css={unifiedSidebarStyle(this.state, this.props)} className="unified__sidebar">
          <CometChatNavBar 
          ref={el => this.navBarRef = el}
          theme={this.props.theme}
          type={this.state.type}
          item={this.state.item}
          activeTab={this.state.activeTab}
          groupToUpdate={this.state.groupToUpdate}
          lastMessage={this.state.lastmessage}
          lang={this.state.lang}
          tabs={this.tabs}
          unreadMessages={this.state.unreadMessages}
          actionGenerated={this.navBarAction}
          enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div css={unifiedMainStyle(this.state, this.props)} className="unified__main">{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
        {imageView}
        <CometChatIncomingCall theme={this.props.theme} lang={this.state.lang} actionGenerated={this.actionHandler} />
        {incomingMessageView}
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatUI.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatUI.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatUI;