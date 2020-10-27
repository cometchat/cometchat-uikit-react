import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { ConversationListManager } from "./controller";
import { SvgAvatar } from '../../util/svgavatar';
import * as enums from '../../util/enums.js';
import { validateWidgetSettings } from "../../util/common";

import ConversationView from "../ConversationView";

import { theme } from "../../resources/theme";

import {
  chatsWrapperStyle,
  chatsHeaderStyle,
  chatsHeaderCloseStyle,
  chatsHeaderTitleStyle,
  chatsMsgStyle,
  chatsMsgTxtStyle,
  chatsListStyle
} from "./style";

import navigateIcon from './resources/navigate_before.svg';

import { incomingOtherMessageAlert } from "../../resources/audio/";

class CometChatConversationList extends React.Component {

  loggedInUser = null;
  decoratorMessage = "Loading...";

  constructor(props) {

    super(props);

    this.state = {
      conversationlist: [],
      onItemClick: null,
      selectedConversation: undefined
    }
    this.chatListRef = React.createRef();
    this.theme = Object.assign({}, theme, this.props.theme);
  }

  componentDidMount() {

    this.audio = new Audio(incomingOtherMessageAlert);

    this.ConversationListManager = new ConversationListManager();
    this.getConversations();
    this.ConversationListManager.attachListeners(this.conversationUpdated);
  }

  componentDidUpdate(prevProps) {
    
    const previousItem = JSON.stringify(prevProps.item);
    const currentItem = JSON.stringify(this.props.item);

    //if different conversation is selected
    if (previousItem !== currentItem) {

      if (Object.keys(this.props.item).length === 0) {

        this.chatListRef.scrollTop = 0;
        this.setState({ selectedConversation: {} });

      } else {

        const conversationlist = [...this.state.conversationlist];
        const conversationObj = conversationlist.find(c => {

          if ((c.conversationType === this.props.type && this.props.type === "user" && c.conversationWith.uid === this.props.item.uid)
            || (c.conversationType === this.props.type && this.props.type === "group" && c.conversationWith.guid === this.props.item.guid)) {

            return c;
          }

          return false;
        });
        
        if (conversationObj) {

          let conversationKey = conversationlist.indexOf(conversationObj);
          let newConversationObj = { ...conversationObj, unreadMessageCount: 0 };

          conversationlist.splice(conversationKey, 1, newConversationObj);
          this.setState({ conversationlist: conversationlist, selectedConversation: newConversationObj });
        }
      }
    }

    //if user is blocked/unblocked, update conversationlist in state
    if(prevProps.item 
    && Object.keys(prevProps.item).length 
    && prevProps.item.uid === this.props.item.uid 
    && prevProps.item.blockedByMe !== this.props.item.blockedByMe) {

      let conversationlist = [...this.state.conversationlist];

      //search for user
      let convKey = conversationlist.findIndex((c, k) => c.conversationType === "user" && c.conversationWith.uid === this.props.item.uid);
      if(convKey > -1) {

        conversationlist.splice(convKey, 1);

        this.setState({ conversationlist: conversationlist });
      }
    }

    if (prevProps.groupToUpdate
      && (prevProps.groupToUpdate.guid !== this.props.groupToUpdate.guid
        || (prevProps.groupToUpdate.guid === this.props.groupToUpdate.guid && (prevProps.groupToUpdate.membersCount !== this.props.groupToUpdate.membersCount || prevProps.groupToUpdate.scope !== this.props.groupToUpdate.scope)))) {

      const conversationlist = [...this.state.conversationlist];
      const groupToUpdate = this.props.groupToUpdate;

      const convKey = conversationlist.findIndex(c => c.conversationType === "group" && c.conversationWith.guid === groupToUpdate.guid);
      if (convKey > -1) {
        
        const convObj = conversationlist[convKey];

        let convWithObj = { ...convObj.conversationWith };

        let newConvWithObj = { ...convWithObj, scope: groupToUpdate["scope"], membersCount: groupToUpdate["membersCount"] };
        let newConvObj = { ...convObj, conversationWith: newConvWithObj };

        conversationlist.splice(convKey, 1, newConvObj);
        this.setState({ conversationlist: conversationlist });
      }
    }

    if (prevProps.messageToMarkRead !== this.props.messageToMarkRead) {

      const message = this.props.messageToMarkRead;
      this.makeConversation(message).then(response => {

        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {

          let unreadMessageCount = this.makeUnreadMessageCount(conversationObj, "decrement");
          let lastMessageObj = this.makeLastMessage(message, conversationObj);
          
          let newConversationObj = { ...conversationObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationlist: conversationList });

        }

      }).catch(error => {
        console.log('This is an error in converting message to conversation', error);
      });

    }

    if (prevProps.lastMessage !== this.props.lastMessage) {

      const lastMessage = this.props.lastMessage;
      const conversationList = [...this.state.conversationlist];
      const conversationKey = conversationList.findIndex(c => c.conversationId === lastMessage.conversationId);

      if (conversationKey > -1) {

        const conversationObj = conversationList[conversationKey];
        let newConversationObj = { ...conversationObj, lastMessage: lastMessage };

        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });
      }
    }
  }

  componentWillUnmount() {
    this.ConversationListManager.removeListeners();
    this.ConversationListManager = null;
  }

  conversationUpdated = (key, item, message, options) => {

    switch(key) {
      case enums.USER_ONLINE:
      case enums.USER_OFFLINE:
        this.updateUser(item);
        break;
      case enums.TEXT_MESSAGE_RECEIVED:
      case enums.MEDIA_MESSAGE_RECEIVED:
      case enums.CUSTOM_MESSAGE_RECEIVED:
        this.updateConversation(message);
        break;
      case enums.MESSAGE_EDITED:
      case enums.MESSAGE_DELETED:
        this.conversationEditedDeleted(message);
        break;
      case enums.INCOMING_CALL_RECEIVED:
      case enums.INCOMING_CALL_CANCELLED:
        this.updateConversation(message, false);
        break;
      case enums.GROUP_MEMBER_ADDED:
        this.updateGroupMemberAdded(message, options);
        break;
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        this.updateGroupMemberRemoved(message, options);
        break;
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
        this.updateGroupMemberScopeChanged(message, options);
        break;
      case enums.GROUP_MEMBER_JOINED:
        this.updateGroupMemberChanged(message, options, "increment");
        break;
      case enums.GROUP_MEMBER_UNBANNED:
        this.updateGroupMemberChanged(message, options, "");
        break;
      default:
        break;
    }

  }

  updateUser = (user) => {

    const conversationlist = [...this.state.conversationlist];
    const conversationKey = conversationlist.findIndex(conversationObj => conversationObj.conversationType === "user" && conversationObj.conversationWith.uid === user.uid);

    if(conversationKey > -1) {

      let conversationObj = {...conversationlist[conversationKey]};
      let conversationWithObj = {...conversationObj.conversationWith, status: user.getStatus()};
      
      let newConversationObj = {...conversationObj, conversationWith: conversationWithObj};
      conversationlist.splice(conversationKey, 1, newConversationObj);
      this.setState({conversationlist: conversationlist});
    }
  }

  playAudio = (message) => {

    //if it is disabled for chat wigdet in dashboard
    if (this.props.hasOwnProperty("widgetsettings")
    && this.props.widgetsettings
    && this.props.widgetsettings.hasOwnProperty("main")
    && (this.props.widgetsettings.main.hasOwnProperty("enable_sound_for_messages") === false
    || (this.props.widgetsettings.main.hasOwnProperty("enable_sound_for_messages")
    && this.props.widgetsettings.main["enable_sound_for_messages"] === false))) {
      return false;
    }

    if (message.category === enums.CATEGORY_ACTION 
      && message.type === enums.ACTION_TYPE_GROUPMEMBER 
      && validateWidgetSettings(this.props.widgetsettings, "hide_join_leave_notifications") === true) {
      return false;
    }

    this.audio.currentTime = 0;
    this.audio.play();
  }

  makeConversation = (message) => {

    const promise = new Promise((resolve, reject) => {

      CometChat.CometChatHelper.getConversationFromMessage(message).then(conversation => {

        let conversationList = [...this.state.conversationlist];
        let conversationKey = conversationList.findIndex(c => c.conversationId === conversation.conversationId);
        
        let conversationObj = { ...conversation };
        if (conversationKey > -1) {
          conversationObj = { ...conversationList[conversationKey] };
        }

        resolve({ "conversationKey": conversationKey, "conversationObj": conversationObj, "conversationList": conversationList });
      
      }).catch(error => reject(error));

    });
    
    return promise;
  }

  makeUnreadMessageCount = (conversation = {}, operator) => {

    if (Object.keys(conversation).length === 0) {
      return 1;
    }

    let unreadMessageCount = parseInt(conversation.unreadMessageCount)
    if (this.state.selectedConversation && this.state.selectedConversation.conversationId === conversation.conversationId) {

      unreadMessageCount = 0;

    } else if ((this.props.hasOwnProperty("item") && this.props.item.hasOwnProperty("guid") && conversation.conversationWith.hasOwnProperty("guid") && this.props.item.guid === conversation.conversationWith.guid)
      || (this.props.hasOwnProperty("item") && this.props.item.hasOwnProperty("uid") && conversation.conversationWith.hasOwnProperty("uid") && this.props.item.uid === conversation.conversationWith.uid)) {

      unreadMessageCount = 0;

    } else {

      if (operator && operator === "decrement") {
         
        unreadMessageCount = (unreadMessageCount) ? (unreadMessageCount - 1) : 0;
      } else {
        unreadMessageCount = unreadMessageCount + 1;
      }
    }

    return unreadMessageCount;
  }

  makeLastMessage = (message, conversation = {}) => {

    const newMessage = Object.assign({}, message);
    return newMessage;
  }

  updateConversation = (message, notification = true) => {

    this.makeConversation(message).then(response => {

      const { conversationKey, conversationObj, conversationList } = response;
      
      if (conversationKey > -1) {

        let unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
        let lastMessageObj = this.makeLastMessage(message, conversationObj);

        let newConversationObj = { ...conversationObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });

        if (notification) {
          this.playAudio(message);
        }

      } else {

        let unreadMessageCount = this.makeUnreadMessageCount();
        let lastMessageObj = this.makeLastMessage(message);

        let newConversationObj = { ...conversationObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });

        if (notification) {
          this.playAudio(message);
        }
      }

    }).catch(error => {
      console.log('This is an error in converting message to conversation', error);
    });

  }

  conversationEditedDeleted = (message) => {

    this.makeConversation(message).then(response => {

      const { conversationKey, conversationObj, conversationList } = response;
      
      if (conversationKey > -1) {

        let lastMessageObj = conversationObj.lastMessage;

        if (lastMessageObj.id === message.id) {

          const newLastMessageObj = Object.assign({}, lastMessageObj, message);
          let newConversationObj = Object.assign({}, conversationObj, { lastMessage: newLastMessageObj }); 
          conversationList.splice(conversationKey, 1, newConversationObj);
          this.setState({ conversationlist: conversationList });
        }
      }

    }).catch(error => {
      console.log('This is an error in converting message to conversation', error);
    });

  }

  updateGroupMemberAdded = (message, options) => {

    this.makeConversation(message).then(response => {

      const { conversationKey, conversationObj, conversationList } = response;

      if (conversationKey > -1) {

        let unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
        let lastMessageObj = this.makeLastMessage(message, conversationObj);

        let conversationWithObj = { ...conversationObj.conversationWith };
        let membersCount = parseInt(conversationWithObj.membersCount) + 1;
        let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };

        let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });
        this.playAudio(message);

      } else {

        if (options && this.loggedInUser.uid === options.user.uid) {

          let avatar = this.setAvatar(conversationObj);
          
          let unreadMessageCount = this.makeUnreadMessageCount();
          let lastMessageObj = this.makeLastMessage(message);

          let conversationWithObj = { ...conversationObj.conversationWith };
          let membersCount = parseInt(conversationWithObj.membersCount) + 1;
          let scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          let hasJoined = options.hasJoined;

          let newConversationWithObj = { ...conversationWithObj, icon: avatar, membersCount: membersCount, scope: scope, hasJoined: hasJoined };
          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
          conversationList.unshift(newConversationObj);
          this.setState({ conversationlist: conversationList });
          this.playAudio(message);
        }

      }

    }).catch(error => {
      console.log('This is an error in converting message to conversation', error);
    });
  }

  updateGroupMemberRemoved = (message, options) => {

    this.makeConversation(message).then(response => {

      const { conversationKey, conversationObj, conversationList } = response;

      if (conversationKey > -1) {

        if (options && this.loggedInUser.uid === options.user.uid) {

          conversationList.splice(conversationKey, 1);
          this.setState({ conversationlist: conversationList });

        } else {

          let unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
          let lastMessageObj = this.makeLastMessage(message, conversationObj);

          let conversationWithObj = { ...conversationObj.conversationWith };
          let membersCount = parseInt(conversationWithObj.membersCount) - 1;
          let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };

          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationlist: conversationList });
          this.playAudio(message);
        }
      }

    }).catch(error => {
      console.log('This is an error in converting message to conversation', error);
    });
    
  }

  updateGroupMemberScopeChanged = (message, options) => {

    this.makeConversation(message).then(response => {

      const { conversationKey, conversationObj, conversationList } = response;

      if (conversationKey > -1) {

        let unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
        let lastMessageObj = this.makeLastMessage(message, conversationObj);

        let conversationWithObj = { ...conversationObj.conversationWith };
        let membersCount = parseInt(conversationWithObj.membersCount);
        let scope = conversationWithObj.scope;

        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = options.scope;
        }

        let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount, scope: scope };
        let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });
        this.playAudio(message);

      } 

    }).catch(error => {
      console.log('This is an error in converting message to conversation', error);
    });
  }

  updateGroupMemberChanged = (message, options, operator) => {

    this.makeConversation(message).then(response => {

      const { conversationKey, conversationObj, conversationList } = response;
      if (conversationKey > -1) {

        if (options && this.loggedInUser.uid !== options.user.uid) {

          let unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
          let lastMessageObj = this.makeLastMessage(message, conversationObj);

          let conversationWithObj = { ...conversationObj.conversationWith };
          let membersCount = parseInt(conversationWithObj.membersCount);
          if (operator === "increment") {
            membersCount += 1;
          }
          
          let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };
          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationlist: conversationList });
          this.playAudio(message);
        }
      }

    }).catch(error => {
      console.log('This is an error in converting message to conversation', error);
    });

  }
  
  handleScroll = (e) => {

    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getConversations();
  }

  //updating unread message count to zero
  handleClick = (conversation, conversationKey) => {
    
    if(!this.props.onItemClick)
      return;

    this.props.onItemClick(conversation.conversationWith, conversation.conversationType);
  }

  handleMenuClose = () => {

    if(!this.props.actionGenerated) {
      return false;
    }

    this.props.actionGenerated("closeMenuClicked")
  }

  getConversations = () => {

    new CometChatManager().getLoggedInUser().then(user => {

      this.loggedInUser = user;
      this.ConversationListManager.fetchNextConversation().then(conversationList => {

        if(conversationList.length === 0) {
          this.decoratorMessage = "No chats found";
        }

        conversationList.forEach(conversation => {

          if(conversation.conversationType === "user" && !conversation.conversationWith.avatar) {
            conversation.conversationWith.avatar = this.setAvatar(conversation);
          } else if(conversation.conversationType === "group" && !conversation.conversationWith.icon) {
            conversation.conversationWith.icon = this.setAvatar(conversation);
          }

          
          if (this.props.hasOwnProperty("type") && this.props.hasOwnProperty("item") && this.props.type === conversation.conversationType) {

            if ((conversation.conversationType === "user" && this.props.item.uid === conversation.conversationWith.uid) ||
              (conversation.conversationType === "group" && this.props.item.guid === conversation.conversationWith.guid)) {

              conversation.unreadMessageCount = 0;
            }
          }
          
        });
        this.setState({ conversationlist: [...this.state.conversationlist, ...conversationList] });

      }).catch(error => {

        this.decoratorMessage = "Error";
        console.error("[CometChatConversationList] getConversations fetchNext error", error);
      });

    }).catch(error => {

      this.decoratorMessage = "Error";
      console.log("[CometChatConversationList] getConversations getLoggedInUser error", error);
    });
  }

  setAvatar(conversation) {

    if(conversation.conversationType === "user" && !conversation.conversationWith.avatar) {
      
      const uid = conversation.conversationWith.uid;
      const char = conversation.conversationWith.name.charAt(0).toUpperCase();

      return SvgAvatar.getAvatar(uid, char);

    } else if(conversation.conversationType === "group" && !conversation.conversationWith.icon) {

      const guid = conversation.conversationWith.guid;
      const char = conversation.conversationWith.name.charAt(0).toUpperCase();

      return SvgAvatar.getAvatar(guid, char)
    }
  }

  render() {

    const conversationList = this.state.conversationlist.map((conversation, key) => {
      return (
        <ConversationView 
        key={key}
        theme={this.theme}
        config={this.props.config}
        conversationKey={key} 
        conversation={conversation}
        selectedConversation={this.state.selectedConversation}
        widgetsettings={this.props.widgetsettings}
        loggedInUser={this.loggedInUser}
        handleClick={this.handleClick} />
      );
    });

    let messageContainer = null;
    
    if(this.state.conversationlist.length === 0) {
      messageContainer = (
        <div css={chatsMsgStyle()} className="chats__decorator-message">
          <p css={chatsMsgTxtStyle(this.theme)} className="decorator-message">{this.decoratorMessage}</p>
        </div>
      );
    }

    let closeBtn = (<div css={chatsHeaderCloseStyle(navigateIcon)} className="header__close" onClick={this.handleMenuClose}></div>);
    if (!this.props.hasOwnProperty("enableCloseMenu") || (this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0)) {
      closeBtn = null;
    }

    return (
      <div css={chatsWrapperStyle()} className="chats">
        <div css={chatsHeaderStyle(this.theme)} className="chats__header">
          {closeBtn}
          <h4 css={chatsHeaderTitleStyle(this.props)} className="header__title">Chats</h4>
          <div></div>
        </div>
        {messageContainer}
        <div css={chatsListStyle()} className="chats__list" onScroll={this.handleScroll} ref={el => this.chatListRef = el}>{conversationList}</div>
      </div>
    );
  }
}

export default CometChatConversationList;
