import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { ConversationListManager } from "./controller";

import { CometChatConversationListItem } from "../";

import { CometChatContextProvider, CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";
import { SoundManager } from "../../../util/SoundManager";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

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
  selectedConversation = null;
  static contextType = CometChatContext;

  constructor(props) {

    super(props);

    this.state = {
      conversationlist: [],
      onItemClick: null,
      lang: props.lang,
    }

    this.contextProviderRef = React.createRef();
    this.decoratorMessage = Translator.translate("LOADING", props.lang);
    this.chatListRef = React.createRef();

    CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
      this.decoratorMessage = Translator.translate("ERROR", this.state.lang);
      console.error(error);
    });
  }

  componentDidMount() {

    this.item = (this.getContext().type === CometChat.ACTION_TYPE.TYPE_USER || CometChat.ACTION_TYPE.TYPE_GROUP) ? this.getContext().item : null;

    this.ConversationListManager = new ConversationListManager();
    this.getConversations();
    this.ConversationListManager.attachListeners(this.conversationUpdated);

    SoundManager.setWidgetSettings(this.props.widgetsettings);
  }

  componentDidUpdate(prevProps) {
    
    if (this.getContext().item !== this.item) {

      const conversationlist = [...this.state.conversationlist];
      const conversationObj = conversationlist.find(c => {

        if ((c.conversationType === this.getContext().type && this.getContext().type === CometChat.RECEIVER_TYPE.USER && c.conversationWith.uid === this.getContext().item.uid)
          || (c.conversationType === this.getContext().type && this.getContext().type === CometChat.RECEIVER_TYPE.GROUP && c.conversationWith.guid === this.getContext().item.guid)) {

          return c;
        }

        return false;
      });

      if (conversationObj) {

        let conversationKey = conversationlist.indexOf(conversationObj);
        let newConversationObj = { ...conversationObj, unreadMessageCount: 0 };

        conversationlist.splice(conversationKey, 1, newConversationObj);
        this.setState({ conversationlist: conversationlist });
      }

    }

    //if user is blocked/unblocked, update conversationlist in state
    if (this.item 
    && Object.keys(this.item).length
    && this.item.hasOwnProperty("uid") 
    && this.getContext().type === CometChat.ACTION_TYPE.TYPE_USER && this.item.uid === this.getContext().item.uid
    && this.item.blockedByMe !== this.getContext().item.blockedByMe) {

      let conversationlist = [...this.state.conversationlist];

      //search for user
      let convKey = conversationlist.findIndex(c => c.conversationType === CometChat.ACTION_TYPE.TYPE_USER && c.conversationWith.uid === this.getContext().item.uid);
      if(convKey > -1) {

        const convObj = conversationlist[convKey];
        
        let convWithObj = { ...convObj.conversationWith };
        let newConvWithObj = Object.assign({}, convWithObj, { blockedByMe: this.getContext().item.blockedByMe });

        let newConvObj = Object.assign({}, convObj, { conversationWith: newConvWithObj });

        conversationlist.splice(convKey, 1, newConvObj);
        this.setState({ conversationlist: conversationlist });
      }
    }

    //if group detail(membersCount) is updated, update grouplist
    if (this.item
    && Object.keys(this.item).length
    && this.item.hasOwnProperty("guid") 
    && this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP && this.item.guid === this.getContext().item.guid
    && this.item.membersCount !== this.getContext().item.membersCount) {

      const conversationlist = [...this.state.conversationlist];

      let convKey = conversationlist.findIndex(c => c.conversationType === CometChat.ACTION_TYPE.TYPE_GROUP && c.conversationWith.guid === this.getContext().item.guid);
      if (convKey > -1) {

        const convObj = conversationlist[convKey];

        let convWithObj = { ...convObj.conversationWith };
        let newConvWithObj = Object.assign({}, convWithObj, { membersCount: this.getContext().item.membersCount });

        let newConvObj = Object.assign({}, convObj, { conversationWith: newConvWithObj });

        conversationlist.splice(convKey, 1, newConvObj);
        this.setState({ conversationlist: conversationlist });
      }
    }

    //upon user deleting a group, remove group from conversation list
    if (this.getContext().deletedGroupId.trim().length) {

      const guid = this.getContext().deletedGroupId.trim();
      const conversationlist = [...this.state.conversationlist];

      let conversationKey = conversationlist.findIndex(c => c.conversationType === CometChat.ACTION_TYPE.TYPE_GROUP && c.conversationWith.guid === guid);

      if (conversationKey > -1) {

        conversationlist.splice(conversationKey, 1);
        this.setState({ conversationlist: conversationlist });
      }
    }

    //updating last message whenever a message is composed, 
    if (Object.keys(this.getContext().lastMessage).length) {

      const lastMessage = this.getContext().lastMessage;
      const conversationList = [...this.state.conversationlist];

      const conversationKey = conversationList.findIndex(c => c.conversationId === lastMessage.conversationId);
      if (conversationKey > -1) {

        const conversationObj = conversationList[conversationKey];
        let newConversationObj = { ...conversationObj, lastMessage: { ...lastMessage } };

        if (conversationKey === 0) {

          conversationList.splice(conversationKey, 1, newConversationObj);
          
        } else {
          
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
        }
        
        this.setState({ conversationlist: conversationList });
        this.getContext().setLastMessage({});

      } else {

        const getConversationId = () => {

          let conversationId = null;
          if (this.getContext().type === CometChat.RECEIVER_TYPE.USER) {

            const users = [this.loggedInUser.uid, this.getContext().item.uid];
            conversationId = users.sort().join("_user_");

          } else if (this.getContext().type === CometChat.RECEIVER_TYPE.GROUP) {
            conversationId = `group_${this.getContext().item.guid}`
          }

          return conversationId;
        }

        let newConversation = new CometChat.Conversation();
        newConversation.setConversationId(getConversationId());
        newConversation.setConversationType(this.getContext().type);
        newConversation.setConversationWith(this.getContext().item);
        newConversation.setLastMessage(lastMessage);
        newConversation.setUnreadMessageCount(0);

        conversationList.unshift(newConversation);
        this.setState({ conversationlist: conversationList });
        this.getContext().setLastMessage({});

      }
    }

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
    }

    if (this.getContext().clearedUnreadMessages === true && this.selectedConversation) {
      
      let conversationList = [...this.state.conversationlist];
      
      let conversationKey = conversationList.findIndex(c => c.conversationId === this.selectedConversation.conversationId);

      if (conversationKey > -1) {

        let conversationObj = { ...conversationList[conversationKey] };
        let unreadMessageCount = this.getContext().unreadMessages.length;
        let newConversationObj = { ...conversationObj, unreadMessageCount: unreadMessageCount };

        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });
        this.getContext().setClearedUnreadMessages(false);
      }
    }

    this.item = (this.getContext().type === CometChat.ACTION_TYPE.TYPE_USER || CometChat.ACTION_TYPE.TYPE_GROUP) ? this.getContext().item : null;
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

    if (message.category === CometChat.CATEGORY_ACTION
    && message.type === CometChat.ACTION_TYPE.TYPE_GROUP_MEMBER 
    && validateWidgetSettings(this.props.widgetsettings, "hide_join_leave_notifications") === true) {
      return false;
    }


    /**
     * If active chat is receiving message, don't play audio
     */
    if (this.getContext().type.trim().length && Object.keys(this.getContext().item).length) {

      if (message.getReceiverType() === this.getContext().type
      && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER 
      && message.getSender().uid === this.getContext().item.uid) {
        return false;
      }

      if (message.getReceiverType() === this.getContext().type
        && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP
        && message.getReceiverId() === this.getContext().item.guid) {
        return false;
      }
    }
    
    SoundManager.play(enums.CONSTANTS.AUDIO["INCOMING_OTHER_MESSAGE"]);
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
    if (this.selectedConversation && this.selectedConversation.conversationId === conversation.conversationId) {

      if (this.getContext().unreadMessages.length) {

        const unreadMessage = this.getContext().unreadMessages[0];
        const selectedConversation = this.selectedConversation;

        if (unreadMessage.hasOwnProperty("conversationId") && unreadMessage.conversationId === selectedConversation.conversationId) {

          unreadMessageCount = 0;
          this.getContext().unreadMessages.forEach(message => {

            if (message.category === CometChat.CATEGORY_MESSAGE) {
              ++unreadMessageCount;
            }

          });

        }

      } else {
        unreadMessageCount = 0;
      }

    } else if ((this.getContext().item.hasOwnProperty("guid") && conversation.conversationWith.hasOwnProperty("guid") && this.getContext().item.guid === conversation.conversationWith.guid)
      || (this.getContext().item.hasOwnProperty("uid") && conversation.conversationWith.hasOwnProperty("uid") && this.getContext().item.uid === conversation.conversationWith.uid)) {

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
      const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
      this.getContext().setToastMessage("error", errorCode);
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

      const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
      this.getContext().setToastMessage("error", errorCode);

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
      const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
      this.getContext().setToastMessage("error", errorCode);
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
      const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
      this.getContext().setToastMessage("error", errorCode);
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
      const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
      this.getContext().setToastMessage("error", errorCode);
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
      const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
      this.getContext().setToastMessage("error", errorCode);
    });

  }
  
  handleScroll = (e) => {

    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getConversations();
  }

  //click handler
  handleClick = (conversation) => {
    
    if(!this.props.onItemClick)
      return;

    this.props.onItemClick(conversation.conversationWith, conversation.conversationType);
    this.selectedConversation = conversation;
  }

  handleMenuClose = () => {

    if(!this.props.actionGenerated) {
      return false;
    }

    this.props.actionGenerated(enums.ACTIONS["TOGGLE_SIDEBAR"])
  }

  getConversations = () => {
    
    this.ConversationListManager.fetchNextConversation().then(conversationList => {

      if(conversationList.length === 0) {
        this.decoratorMessage = Translator.translate("NO_CHATS_FOUND", this.state.lang);
      }

      conversationList.forEach(conversation => {

        if (this.getContext().hasOwnProperty("type") && this.props.hasOwnProperty("item") && this.getContext().type === conversation.conversationType) {

          if ((conversation.conversationType === CometChat.RECEIVER_TYPE.USER && this.getContext().item.uid === conversation.conversationWith.uid) ||
            (conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP && this.getContext().item.guid === conversation.conversationWith.guid)) {
            conversation.unreadMessageCount = 0;
          }
        }
        
      });

      this.setState({ conversationlist: [...this.state.conversationlist, ...conversationList] });

    }).catch(error => {

      this.decoratorMessage = Translator.translate("ERROR", this.state.lang);
      const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
      this.getContext().setToastMessage("error", errorCode);

    });
  }

  getContext = () => {

    if (this.props._parent.length) {
      return this.context;
    } else {
      return this.contextProviderRef.state;
    }
  }

  render() {

    const conversationList = this.state.conversationlist.map((conversation, key) => {

      let selectedConversation = null;
      if (this.getContext() && Object.keys(this.getContext().item).length && this.getContext().type.trim().length) {

        if (this.getContext().type === CometChat.ACTION_TYPE.TYPE_USER && this.getContext().item.uid === conversation.conversationWith.uid) {
          selectedConversation = conversation;
        } else if (this.getContext().type === CometChat.ACTION_TYPE.TYPE_GROUP && this.getContext().item.guid === conversation.conversationWith.guid) {
          selectedConversation = conversation;
        }
        
      }

      return (
        <CometChatConversationListItem 
        key={key}
        theme={this.props.theme}
        config={this.props.config}
        lang={this.state.lang}
        conversationKey={key} 
        conversation={conversation}
        selectedConversation={selectedConversation}
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
    if (this.getContext() && Object.keys(this.getContext().item).length === 0) {
      closeBtn = null;
    }    

    const chatList = (
      <div css={chatsWrapperStyle(this.props)} className="chats">
        <div css={chatsHeaderStyle(this.props)} className="chats__header">
          {closeBtn}
          <h4 css={chatsHeaderTitleStyle(this.props)} className="header__title" dir={Translator.getDirection(this.state.lang)}>{Translator.translate("CHATS", this.state.lang)}</h4>
        </div>
        {messageContainer}
        <div css={chatsListStyle()} className="chats__list" onScroll={this.handleScroll} ref={el => this.chatListRef = el}>{conversationList}</div>
      </div>
    );

    let chatListWrapper = (chatList);
    //if used as a standalone component, add errorboundary and context provider
    if (this.props._parent === "") {

      chatListWrapper = (
        <CometChatContextProvider ref={el => this.contextProviderRef = el} >
          {chatList}
        </CometChatContextProvider>
      );
    }

    return (chatListWrapper);
  }
}

// Specifies the default values for props:
CometChatConversationList.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  onItemClick: () => { },
  _parent: ""
};

CometChatConversationList.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  onItemClick: PropTypes.func,
  _parent: PropTypes.string
}

export default CometChatConversationList;