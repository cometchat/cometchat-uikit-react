import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
import { ConversationListManager } from "./controller";
import { SvgAvatar } from '../../util/svgavatar';

import ConversationView from "../ConversationView";

class CometChatConversationList extends React.Component {

  constructor(props) {

    super(props);
    this.state = {
      conversationlist: [],
      onItemClick: null,
      selectedConversation: undefined
    }
  }
  componentDidMount() {

    this.ConversationListManager = new ConversationListManager();
    this.getConversations();
    this.ConversationListManager.attachListeners(this.conversationUpdated);

  }

  componentWillUnmount() {
    this.ConversationListManager.removeListeners();
    this.ConversationListManager = null;
  }

  conversationUpdated = (message) => {

    console.log("[CometChatConversationList] conversationUpdated message", message);
    let conversationlist = [...this.state.conversationlist];
    let convKey = conversationlist.findIndex((c, k) => c.conversationId === message.conversationId);
    let convObj = conversationlist.find((c, k) => c.conversationId === message.conversationId);
    console.log("[CometChatConversationList] conversationUpdated convObj", convObj);
    if(convObj) {

      if(this.state.selectedConversation && this.state.selectedConversation.getConversationId() === message.getConversationId()) {
        convObj.setUnreadMessageCount(0);
      } else {
        convObj.setUnreadMessageCount(parseInt(convObj.getUnreadMessageCount()) + 1);
      }

      convObj.lastMessage = message;
      const conv = conversationlist.splice(convKey, 1);
      conversationlist.unshift(conv[0]);
      this.setState({ conversationlist:  conversationlist});

    } else {

      CometChat.CometChatHelper.getConversationFromMessage(message).then((conv) => {
        
        conv.setUnreadMessageCount(1);
        convObj.lastMessage = message;
        conversationlist.unshift(conv);
        this.setState({ conversationlist:  conversationlist});

      }, error => {
        console.log('This is an error in converting message to conversation', { error })
      });

    }
  }
  
  handleScroll = (e) => {

    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getConversations();
  }

  //updating unread message count to zero
  handleClick = (item, type) => {
    
    if(!this.props.onItemClick)
      return;

    this.props.onItemClick(item, type);
    const conversationList = [...this.state.conversationlist];

    const conversationFound = conversationList.find(conversation => conversation.conversationWith.uid === item.uid);
    if(conversationFound) {
      conversationFound.unreadMessageCount = 0;
    }

    this.setState({ selectedConversation: conversationFound });
  }

  getConversations = () => {

    new CometChatManager().getLoggedInUser().then(conversation => {

        this.ConversationListManager.fetchNextConversation().then(conversationList => {

          conversationList.forEach(conv => conv = this.setAvatar(conv));
          this.setState({ conversationlist: [...this.state.conversationlist, ...conversationList] });

        }).catch(error => {
          console.error("[CometChatConversationList] getConversations fetchNext error", error);
        });

      }).catch(error => {
        console.log("[CometChatConversationList] getConversations getLoggedInUser error", error);
    });
  }

  setAvatar(conversation) {

    if(conversation.getConversationType() === "user" && !conversation.getConversationWith().getAvatar()) {
      
        const uid = conversation.getConversationWith().getUid();
        const char = conversation.getConversationWith().getName().charAt(0).toUpperCase();

        conversation.getConversationWith().setAvatar(SvgAvatar.getAvatar(uid, char));

    } else if(conversation.getConversationType() === "group" && !conversation.getConversationWith().getIcon()) {

        const guid = conversation.getConversationWith().getGuid();
        const char = conversation.getConversationWith().getName().charAt(0).toUpperCase();

        conversation.getConversationWith().setIcon(SvgAvatar.getAvatar(guid, char))
    }
  }

  render() {

    const conversationList = this.state.conversationlist.map((conversation, key) => {
      return (
        <div id={key} onClick={() => this.handleClick(conversation.conversationWith, conversation.conversationType)} key={key}>
          <ConversationView key={conversation.conversationId} conversation={conversation}></ConversationView>
          <div className="row cp-list-seperator"></div>
        </div>
      );

    });

    return (
      <div className="cp-conversatiolist-wrapper">
        <p className="cp-contact-list-title font-extra-large">Chats</p>
        <div className="cp-userlist" onScroll={this.handleScroll}>
          {conversationList}
        </div>
      </div>
    );
  }
}

export default CometChatConversationList;