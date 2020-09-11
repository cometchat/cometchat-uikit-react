import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { ConversationListManager } from "./controller";
import { SvgAvatar } from '../../util/svgavatar';

import * as enums from '../../util/enums.js';

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

    this.theme = Object.assign({}, theme, this.props.theme);
  }

  componentDidMount() {
    this.ConversationListManager = new ConversationListManager();
    this.getConversations();
    this.ConversationListManager.attachListeners(this.conversationUpdated);
  }

  componentDidUpdate(prevProps, prevState) {

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

  }

  componentWillUnmount() {
    this.ConversationListManager.removeListeners();
    this.ConversationListManager = null;
  }

  conversationUpdated = (key, item, message, options) => {

    switch(key) {
      case enums.TEXT_MESSAGE_RECEIVED:
      case enums.MEDIA_MESSAGE_RECEIVED:
      case enums.CUSTOM_MESSAGE_RECEIVED:
      case enums.INCOMING_CALL_RECEIVED:
      case enums.INCOMING_CALL_CANCELLED:
        this.updateConversation(message);
        break;
      case enums.USER_ONLINE:
      case enums.USER_OFFLINE:
        this.updateUser(item);
        break;
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
        this.updateGroupMemberScopeChanged(message, options);
        break;
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        this.updateGroupMemberRemoved(message, options);
        break;
      case enums.GROUP_MEMBER_ADDED:
        this.updateGroupMemberAdded(message, options);
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

  updateGroupMemberAdded = (message, options) => {

    CometChat.CometChatHelper.getConversationFromMessage(message).then((conversation) => {

      let conversationlist = [...this.state.conversationlist];
      let conversationKey = conversationlist.findIndex((c, k) => c.conversationId === conversation.conversationId);

      if (conversationKey > -1) {

        let conversationObj = { ...conversationlist[conversationKey] };

        let conversationWithObj = { ...conversationObj.conversationWith };

        let lastMessageObj = { ...conversationObj.lastMessage, ...message };
        let unreadMessageCount = parseInt(conversationObj.unreadMessageCount);
        let membersCount = parseInt(conversationWithObj.membersCount) + 1;

        let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };

        //if the conversation is selected
        if (this.state.selectedConversation && this.state.selectedConversation.conversationId === conversation.conversationId) {
          unreadMessageCount = 0;
        } else {
          unreadMessageCount = unreadMessageCount + 1;
        }

        let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
        conversationlist.splice(conversationKey, 1);
        conversationlist.unshift(newConversationObj);
        this.setState({ conversationlist: conversationlist });

      } else {

        if (options && this.loggedInUser.uid === options.user.uid) {

          let conversationObj = { ...conversation };

          let conversationWithObj = { ...conversationObj.conversationWith };

          let avatar = this.setAvatar(conversationObj);
          let lastMessageObj = { ...message };
          let unreadMessageCount = 1;
          let membersCount = parseInt(conversationWithObj.membersCount) + 1;

          let scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          let hasJoined = options.hasJoined;

          let newConversationWithObj = { ...conversationWithObj, icon: avatar, membersCount: membersCount, scope: scope, hasJoined: hasJoined };
          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
          conversationlist.unshift(newConversationObj);
          this.setState({ conversationlist: conversationlist });
        }
      }

    }, error => {
      console.log('This is an error in converting message to conversation', { error })
    });
  }

  updateGroupMemberScopeChanged = (message, options) => {

    CometChat.CometChatHelper.getConversationFromMessage(message).then((conversation) => {

      let conversationlist = [...this.state.conversationlist];
      let conversationKey = conversationlist.findIndex((c, k) => c.conversationId === conversation.conversationId);

      if (conversationKey > -1) {

        let conversationObj = { ...conversationlist[conversationKey] };

        let conversationWithObj = { ...conversationObj.conversationWith };

        let lastMessageObj = { ...conversationObj.lastMessage, ...message };
        let unreadMessageCount = parseInt(conversationObj.unreadMessageCount);
        let membersCount = parseInt(conversationWithObj.membersCount);
        let scope = conversationWithObj.scope;

        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = options.scope;
        }

        let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount, scope: scope };

        //if the conversation is selected
        if (this.state.selectedConversation && this.state.selectedConversation.conversationId === conversation.conversationId) {
          unreadMessageCount = 0;
        } else {
          unreadMessageCount = unreadMessageCount + 1;
        }

        let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
        conversationlist.splice(conversationKey, 1);
        conversationlist.unshift(newConversationObj);
        this.setState({ conversationlist: conversationlist });

      } 

    }, error => {
      console.log('This is an error in converting message to conversation', { error })
    });

  }

  updateGroupMemberRemoved = (message, options) => {

    CometChat.CometChatHelper.getConversationFromMessage(message).then((conversation) => {

      let conversationlist = [...this.state.conversationlist];
      let conversationKey = conversationlist.findIndex((c, k) => c.conversationId === conversation.conversationId);

      if (conversationKey > -1) {

        if (options && this.loggedInUser.uid === options.user.uid) {

          conversationlist.splice(conversationKey, 1);
          this.setState({ conversationlist: conversationlist });

        } else {

          let conversationObj = { ...conversationlist[conversationKey] };

          let conversationWithObj = { ...conversationObj.conversationWith };

          let lastMessageObj = { ...conversationObj.lastMessage, ...message };
          let unreadMessageCount = parseInt(conversationObj.unreadMessageCount);
          let membersCount = parseInt(conversationWithObj.membersCount) - 1;

          let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };

          //if the conversation is selected
          if (this.state.selectedConversation && this.state.selectedConversation.conversationId === conversation.conversationId) {
            unreadMessageCount = 0;
          } else {
            unreadMessageCount = unreadMessageCount + 1;
          }

          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
          conversationlist.splice(conversationKey, 1);
          conversationlist.unshift(newConversationObj);
          this.setState({ conversationlist: conversationlist });

        }
      }

    }, error => {
      console.log('This is an error in converting message to conversation', { error })
    });
  }

  updateGroupMemberChanged = (message, options, operator) => {

    CometChat.CometChatHelper.getConversationFromMessage(message).then((conversation) => {

      let conversationlist = [...this.state.conversationlist];
      let conversationKey = conversationlist.findIndex((c, k) => c.conversationId === conversation.conversationId);

      if (conversationKey > -1) {

        if (options && this.loggedInUser.uid !== options.user.uid) {

          let conversationObj = { ...conversationlist[conversationKey] };

          let conversationWithObj = { ...conversationObj.conversationWith };

          let lastMessageObj = { ...conversationObj.lastMessage, ...message };
          let unreadMessageCount = parseInt(conversationObj.unreadMessageCount);
          let membersCount = parseInt(conversationWithObj.membersCount);

          if (operator === "increment") {
            membersCount += 1;
          } 

          let newConversationWithObj = { ...conversationWithObj, membersCount: membersCount };

          //if the conversation is selected
          if (this.state.selectedConversation && this.state.selectedConversation.conversationId === conversation.conversationId) {
            unreadMessageCount = 0;
          } else {
            unreadMessageCount = unreadMessageCount + 1;
          }
          
          let newConversationObj = { ...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount };
          conversationlist.splice(conversationKey, 1);
          conversationlist.unshift(newConversationObj);
          this.setState({ conversationlist: conversationlist });
        }
      }

    }, error => {
      console.log('This is an error in converting message to conversation', { error })
    });
  }

  updateConversation = (message, group, operator, options) => {

    CometChat.CometChatHelper.getConversationFromMessage(message).then((conversation) => {

      let conversationlist = [...this.state.conversationlist];
      let conversationKey = conversationlist.findIndex((c, k) => c.conversationId === conversation.conversationId);

      if(conversationKey > -1) {

        let conversationObj = {...conversationlist[conversationKey]};

        let lastMessageObj = {...conversationObj.lastMessage, ...message};
        let unreadMessageCount = parseInt(conversationObj.unreadMessageCount);
                

        //if the conversation is selected
        if(this.state.selectedConversation && this.state.selectedConversation.conversationId === conversation.conversationId) {
          unreadMessageCount = 0;
        } else {
          unreadMessageCount = unreadMessageCount + 1;
        }

        let newConversationObj = {...conversationObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount};
        conversationlist.splice(conversationKey, 1);
        conversationlist.unshift(newConversationObj);
        this.setState({conversationlist: conversationlist});

      } else {

        let conversationObj = {...conversation};
        
        let lastMessageObj = {...message};
        let unreadMessageCount = 1;

        let newConversationObj = {...conversationObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount};
        conversationlist.unshift(newConversationObj);
        this.setState({ conversationlist:  conversationlist});
      }

    }, error => {
      console.log('This is an error in converting message to conversation', { error })
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

    let conversationlist = [...this.state.conversationlist];
    let conversationObj = {...conversationlist[conversationKey]};
    let newConversationObj = {...conversationObj, unreadMessageCount: 0};

    conversationlist.splice(conversationKey, 1, newConversationObj);
    this.setState({conversationlist: conversationlist, selectedConversation: newConversationObj});

    this.props.onItemClick(newConversationObj.conversationWith, newConversationObj.conversationType);
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
        handleClick={this.handleClick} />
      );
    });

    let messageContainer = null;
    
    if(this.state.conversationlist.length === 0) {
      messageContainer = (
        <div css={chatsMsgStyle()}>
          <p css={chatsMsgTxtStyle(this.theme)}>{this.decoratorMessage}</p>
        </div>
      );
    }

    let closeBtn = (<div css={chatsHeaderCloseStyle(navigateIcon)} onClick={this.handleMenuClose}></div>);
    if (!this.props.hasOwnProperty("enableCloseMenu") || (this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0)) {
      closeBtn = null;
    }

    return (
      <div css={chatsWrapperStyle()}>
        <div css={chatsHeaderStyle(this.theme)}>
          {closeBtn}
          <h4 css={chatsHeaderTitleStyle(this.props)}>Chats</h4>
          <div></div>
        </div>
        {messageContainer}
        <div css={chatsListStyle()} onScroll={this.handleScroll}>{conversationList}</div>
      </div>
    );
  }
}

export default CometChatConversationList;