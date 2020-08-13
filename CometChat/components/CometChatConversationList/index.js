import React from "react";
import classNames from "classnames";

import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { ConversationListManager } from "./controller";
import { SvgAvatar } from '../../util/svgavatar';

import * as enums from '../../util/enums.js';

import ConversationView from "../ConversationView";

class CometChatConversationList extends React.Component {

  loggedInUser = null;

  constructor(props) {

    super(props);
    this.state = {
      conversationlist: [],
      onItemClick: null,
      selectedConversation: undefined,
      loading: false
    }
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
      case enums.GROUP_MEMBER_UNBANNED:
      case enums.INCOMING_CALL_RECEIVED:
      case enums.INCOMING_CALL_CANCELLED:
        this.updateConversation(message);
        break;
      case enums.USER_ONLINE:
      case enums.USER_OFFLINE:
        this.updateUser(item);
        break;
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
        this.updateConversation(message, item, undefined, options);
        break;
      case enums.GROUP_MEMBER_KICKED:
        this.updateConversation(message, item, "decrement", options);
        break;
      case enums.GROUP_MEMBER_BANNED:
        this.updateConversation(message, item, "decrement");
        break;
      case enums.GROUP_MEMBER_ADDED:
        this.updateConversation(message, item, "increment", options);
        break;
      case enums.GROUP_MEMBER_LEFT:
        this.updateConversation(message, item, "decrement");
        break;
      case enums.GROUP_MEMBER_JOINED:
        this.updateConversation(message, item, "increment");
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

  updateConversation = (message, group, operator, options) => {

    CometChat.CometChatHelper.getConversationFromMessage(message).then((conversation) => {

      let conversationlist = [...this.state.conversationlist];
      let conversationKey = conversationlist.findIndex((c, k) => c.conversationId === conversation.conversationId);

      if(conversationKey > -1) {

        let conversationObj = {...conversationlist[conversationKey]};
        let conversationWithObj = {...conversationObj.conversationWith};
        let lastMessageObj = {...conversationObj.lastMessage, ...message};
        let unreadMessageCount = parseInt(conversationObj.unreadMessageCount);
        
        let newConversationWithObj = conversationWithObj;
        //group listeners response handler
        if(group) {

          let membersCount = parseInt(conversationWithObj.membersCount);
          let scope = conversationWithObj.scope;
          let hasJoined = conversationWithObj.hasJoined;

          //member added to group / member joined
          if(operator === "increment") {
            membersCount = membersCount + 1;
          } else if(operator === "decrement") {//member kicked, banned / member left
            membersCount = membersCount - 1;
          }

          //if the loggedin user has been kicked from / or added to group / scope is changed
          if(options && this.loggedInUser.uid === options.user.uid) {

            if(options.scope) {
              scope = options.scope;
            } else if(options.hasJoined) {
              hasJoined = options.hasJoined;
            }
          }
          newConversationWithObj = {...conversationWithObj, membersCount: membersCount, scope: scope, hasJoined: hasJoined};
        }

        
        //if the conversation is selected
        if(this.state.selectedConversation && this.state.selectedConversation.conversationId === conversation.conversationId) {
          unreadMessageCount = 0;
        } else {
          unreadMessageCount = unreadMessageCount + 1;
        }

        let newConversationObj = {...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount};
        conversationlist.splice(conversationKey, 1);
        conversationlist.unshift(newConversationObj);
        this.setState({conversationlist: conversationlist});

      } else {

        let conversationObj = {...conversation};
        let conversationWithObj = {...conversationObj.conversationWith};
        let avatar = this.setAvatar(conversationObj);
        let lastMessageObj = {...message};
        let unreadMessageCount = 1;

        let newConversationWithObj = {...conversationWithObj, avatar: avatar};
        let newConversationObj = {...conversationObj, conversationWith: newConversationWithObj, lastMessage: lastMessageObj, unreadMessageCount: unreadMessageCount};
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

    this.setState({loading: true});
    new CometChatManager().getLoggedInUser().then(user => {

      this.loggedInUser = user;
      this.ConversationListManager.fetchNextConversation().then(conversationList => {

        conversationList.forEach(conversation => {

          if(conversation.conversationType === "user" && !conversation.conversationWith.avatar) {
            conversation.conversationWith.avatar = this.setAvatar(conversation);
          } else if(conversation.conversationType === "group" && !conversation.conversationWith.icon) {
            conversation.conversationWith.icon = this.setAvatar(conversation);
          }
          
        });
        this.setState({ conversationlist: [...this.state.conversationlist, ...conversationList], loading: false });

      }).catch(error => {
        console.error("[CometChatConversationList] getConversations fetchNext error", error);
        this.setState({loading: false});
      });

    }).catch(error => {
      console.log("[CometChatConversationList] getConversations getLoggedInUser error", error);
      this.setState({loading: false});
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
        config={this.props.config}
        conversationKey={key} 
        conversation={conversation}
        handleClick={this.handleClick} />
      );
    });

    let closeBtn = (<div className="cc1-left-panel-close" onClick={this.handleMenuClose}></div>);
    if(this.props.hasOwnProperty("enableCloseMenu") && this.props.enableCloseMenu === 0) {
      closeBtn = null;
    }

    return (
      <React.Fragment>
        <div className="ccl-left-panel-head-wrap">
          {closeBtn}
          <h4 className="ccl-left-panel-head-ttl">Chats</h4>
        </div>
        {/* <div className={loadingClassName}>Loading...</div> */}
        <div className="chat-ppl-list-ext-wrap" onScroll={this.handleScroll}>
          {conversationList}
        </div>
      </React.Fragment>
    );
  }
}

export default CometChatConversationList;