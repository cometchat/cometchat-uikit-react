import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { ConversationListManager } from "./controller";

import { CometChatConversationListItem } from "../";

import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";
import { incomingOtherMessageAlert } from "../../../resources/audio/";

import {
  chatsWrapperStyle,
  chatsHeaderStyle,
  chatsHeaderCloseStyle,
  chatsHeaderTitleStyle,
  chatsMsgStyle,
  chatsMsgTxtStyle,
  chatsListStyle
} from "./style";

import navigateIcon from "./resources/navigate.png";

class CometChatConversationList extends React.Component {

  loggedInUser = null;

  constructor(props) {

    super(props);

    this.state = {
      conversationlist: props.conversationlist,
      onItemClick: null,
      selectedConversation: undefined,
      lang: props.lang,
      selectedConversationUnreadMessages: []
    }

    this.decoratorMessage = Translator.translate("LOADING", props.lang);
    this.chatListRef = React.createRef();
    this.audio = new Audio(incomingOtherMessageAlert);

    CometChat.getLoggedinUser().then((user) => {

      this.loggedInUser = user;

    }).catch((error) => {

      this.decoratorMessage = Translator.translate("ERROR", this.state.lang);
      console.log("[CometChatConversationList] getConversations getLoggedinUser error", error);
    });
  }

  componentDidMount() {

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
        this.setState({ selectedConversation: {}, selectedConversationUnreadMessages: [] });

      } else {

        const conversationlist = [...this.state.conversationlist];
        const conversationObj = conversationlist.find(c => {

          if ((c.conversationType === this.props.type && this.props.type === CometChat.RECEIVER_TYPE.USER && c.conversationWith.uid === this.props.item.uid)
            || (c.conversationType === this.props.type && this.props.type === CometChat.RECEIVER_TYPE.GROUP && c.conversationWith.guid === this.props.item.guid)) {

            return c;
          }

          return false;
        });
        
        if (conversationObj) {

          let conversationKey = conversationlist.indexOf(conversationObj);
          let newConversationObj = { ...conversationObj, unreadMessageCount: 0 };

          conversationlist.splice(conversationKey, 1, newConversationObj);
          this.setState({ conversationlist: conversationlist, selectedConversation: newConversationObj, selectedConversationUnreadMessages: [] });
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

    //if user deletes a group, remove it from chatslist
    if (prevProps.groupToDelete !== this.props.groupToDelete) {

      const conversationlist = [...this.state.conversationlist];
      const groupToDelete = this.props.groupToDelete;

      const convKey = conversationlist.findIndex(c => c.conversationType === CometChat.RECEIVER_TYPE.GROUP && c.conversationWith.guid === groupToDelete.guid);
      if (convKey > -1) {
        
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

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
    }

    if (prevProps.unreadMessages.length !== this.props.unreadMessages.length) {

      this.setState({ selectedConversationUnreadMessages: [ ...this.props.unreadMessages ] });
      
      if (this.props.unreadMessages.length === 0) {

        const unreadMessage = prevProps.unreadMessages[0];
        this.makeConversation(unreadMessage).then(response => {

          const { conversationKey, conversationObj, conversationList } = response;

          let unreadMessageCount = this.props.unreadMessages.length;
          let newConversationObj = { ...conversationObj, unreadMessageCount: unreadMessageCount };

          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationlist: conversationList });

        }).catch(error => {
          console.log('This is an error in converting message to conversation', error);
        });

      }
    }
  }

  componentWillUnmount() {
    this.ConversationListManager.removeListeners();
    this.ConversationListManager = null;
  }

  updateLastMessage = (lastMessage) => {

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

  removeGroupFromListOnDeleting = (group) => {

    const conversationList = [...this.state.conversationlist];
    const conversationKey = conversationList.findIndex(c => c.conversationType === CometChat.RECEIVER_TYPE.GROUP && c.conversationWith.guid === group.guid);
    
    if (conversationKey > -1) {

      conversationList.splice(conversationKey, 1);
      this.setState({ conversationlist: conversationList });
    }
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
      case enums.INCOMING_CALL_RECEIVED:
      case enums.INCOMING_CALL_CANCELLED:
        this.updateConversation(key, message);
        break;
      case enums.MESSAGE_EDITED:
      case enums.MESSAGE_DELETED:
        this.conversationEditedDeleted(message);
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
      case enums.GROUP_MEMBER_UNBANNED:
        this.updateGroupMemberChanged(message, options);
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

    //if audio sound is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_sound_for_messages") === false) {
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

  makeUnreadMessageCount = (conversation = {}, listenerEvent = null) => {

    if (Object.keys(conversation).length === 0) {
      return 1;
    }

    let unreadMessageCount = parseInt(conversation.unreadMessageCount)
    if (this.state.selectedConversation && this.state.selectedConversation.conversationId === conversation.conversationId) {

      if(this.state.selectedConversationUnreadMessages.length) {

        const unreadMessage = this.state.selectedConversationUnreadMessages[0];
        const selectedConversation = this.state.selectedConversation;

        if (unreadMessage.hasOwnProperty("conversationId") && unreadMessage.conversationId === selectedConversation.conversationId) {

          unreadMessageCount = 0;
          this.state.selectedConversationUnreadMessages.forEach(message => {

            if (message.category === CometChat.CATEGORY_MESSAGE) {
              ++unreadMessageCount;
            }

          });

        }

      } else {
        unreadMessageCount = 0;
      }

    } else if ((this.props.item.hasOwnProperty("guid") && conversation.conversationWith.hasOwnProperty("guid") && this.props.item.guid === conversation.conversationWith.guid)
      || (this.props.item.hasOwnProperty("uid") && conversation.conversationWith.hasOwnProperty("uid") && this.props.item.uid === conversation.conversationWith.uid)) {

      unreadMessageCount = 0;

    } else {

      if (listenerEvent && (listenerEvent === enums.TEXT_MESSAGE_RECEIVED || listenerEvent === enums.MEDIA_MESSAGE_RECEIVED)) {
        unreadMessageCount = unreadMessageCount + 1;
      } 

    }

    return unreadMessageCount;
  }

  makeLastMessage = (message, conversation = {}) => {

    const newMessage = Object.assign({}, message);
    return newMessage;
  }

  updateConversation = (key, message) => {

    this.makeConversation(message).then(response => {

      const { conversationKey, conversationObj, conversationList } = response;
      
      if (conversationKey > -1) {

        let unreadMessageCount = this.makeUnreadMessageCount(conversationObj, key);
        let lastMessageObj = this.makeLastMessage(message, conversationObj);

        let newConversationObj = { ...conversationObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });

        if (key !== enums.INCOMING_CALL_RECEIVED && key !== enums.INCOMING_CALL_CANCELLED) {
          this.playAudio(message);
        }

      } else {

        let unreadMessageCount = this.makeUnreadMessageCount({}, key);
        let lastMessageObj = this.makeLastMessage(message);

        let newConversationObj = { ...conversationObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });

        if (key !== enums.INCOMING_CALL_RECEIVED && key !== enums.INCOMING_CALL_CANCELLED) {
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

        let lastMessageObj = this.makeLastMessage(message, conversationObj);
        let conversationWithObj = { ...conversationObj.conversationWith };

        let membersCount = parseInt(conversationWithObj.membersCount);
        if (message.hasOwnProperty("actionFor") && message.actionFor.hasOwnProperty("membersCount")) {
          membersCount = message.actionFor.membersCount;
        }

        let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };

        let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj };
        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });
        this.playAudio(message);

      } else {

        if (options && this.loggedInUser.uid === options.user.uid) {
          
          let lastMessageObj = this.makeLastMessage(message);
          let conversationWithObj = { ...conversationObj.conversationWith };

          let membersCount = parseInt(conversationWithObj.membersCount);
          if (message.hasOwnProperty("actionFor") && message.actionFor.hasOwnProperty("membersCount")) {
            membersCount = message.actionFor.membersCount;
          }
          let scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          let hasJoined = options.hasJoined;

          let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount, scope: scope, hasJoined: hasJoined };
          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj };

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

          let lastMessageObj = this.makeLastMessage(message, conversationObj);
          let conversationWithObj = { ...conversationObj.conversationWith };

          let membersCount = parseInt(conversationWithObj.membersCount);
          if (message.hasOwnProperty("actionFor") && message.actionFor.hasOwnProperty("membersCount")) {
            membersCount = message.actionFor.membersCount;
          }

          let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };

          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj };
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

        let lastMessageObj = this.makeLastMessage(message, conversationObj);

        let conversationWithObj = { ...conversationObj.conversationWith };
        let membersCount = parseInt(conversationWithObj.membersCount);

        let scope = conversationWithObj.scope;
        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = options.scope;
        }

        let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount, scope: scope };
        let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj };
        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });
        this.playAudio(message);

      } 

    }).catch(error => {
      console.log('This is an error in converting message to conversation', error);
    });
  }

  updateGroupMemberChanged = (message, options) => {

    this.makeConversation(message).then(response => {

      const { conversationKey, conversationObj, conversationList } = response;
      if (conversationKey > -1) {

        if (options && this.loggedInUser.uid !== options.user.uid) {

          let lastMessageObj = this.makeLastMessage(message, conversationObj);
          let conversationWithObj = { ...conversationObj.conversationWith };
          
          let membersCount = parseInt(conversationWithObj.membersCount);
          if (message.hasOwnProperty("actionFor") && message.actionFor.hasOwnProperty("membersCount")) {
            membersCount = message.actionFor.membersCount;
          }
          
          let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };
          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj };
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

    this.ConversationListManager.fetchNextConversation().then(conversationList => {

      if(conversationList.length === 0) {
        this.decoratorMessage = Translator.translate("NO_CHATS_FOUND", this.state.lang);
      }

      conversationList.forEach(conversation => {

        if (this.props.hasOwnProperty("type") && this.props.hasOwnProperty("item") && this.props.type === conversation.conversationType) {

          if ((conversation.conversationType === CometChat.RECEIVER_TYPE.USER && this.props.item.uid === conversation.conversationWith.uid) ||
            (conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP && this.props.item.guid === conversation.conversationWith.guid)) {
            conversation.unreadMessageCount = 0;
          }
        }
        
      });

      this.setState({ conversationlist: [...this.state.conversationlist, ...conversationList] });

    }).catch(error => {

      this.decoratorMessage = Translator.translate("ERROR", this.state.lang);
      console.error("[CometChatConversationList] getConversations fetchNext error", error);
    });
  }

  render() {

    const conversationList = this.state.conversationlist.map((conversation, key) => {

      return (
        <CometChatConversationListItem 
        key={key}
        theme={this.props.theme}
        config={this.props.config}
        lang={this.state.lang}
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
          <p css={chatsMsgTxtStyle(this.props)} className="decorator-message">{this.decoratorMessage}</p>
        </div>
      );
    }

    let closeBtn = (<div css={chatsHeaderCloseStyle(navigateIcon, this.props)} className="header__close" onClick={this.handleMenuClose}></div>);
    if (!this.props.hasOwnProperty("enableCloseMenu") || (this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0)) {
      closeBtn = null;
    }    

    return (
      <div css={chatsWrapperStyle()} className="chats">
        <div css={chatsHeaderStyle(this.props)} className="chats__header">
          {closeBtn}
          <h4 css={chatsHeaderTitleStyle(this.props)} className="header__title" dir={Translator.getDirection(this.state.lang)}>{Translator.translate("CHATS", this.state.lang)}</h4>
        </div>
        {messageContainer}
        <div css={chatsListStyle()} className="chats__list" onScroll={this.handleScroll} ref={el => this.chatListRef = el}>{conversationList}</div>
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatConversationList.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  unreadMessages: [],
  item: {},
  conversationlist: []
};

CometChatConversationList.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  unreadMessages: PropTypes.array,
  item: PropTypes.object,
  conversationlist: PropTypes.arrayOf(PropTypes.shape(CometChat.Conversation))
}

export default CometChatConversationList;
