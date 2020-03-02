import React from "react";
import "./style.scss";
import ConversationView from "../ConversationView";
import { CometChatManager } from "./controller";
import { CometChat } from "@cometchat-pro/chat";


class CometChatConversationList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      conversationList: [],
      onItemClick: null,
      selectedConversation: undefined
    }
    this.getConversationList = this.getConversationList.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

  }
  componentDidMount() {
    this.cometChatManager = new CometChatManager();
    this.getConversationList();
    this.cometChatManager.attachMessageListener(this.conversationUpdated);

  }
  conversationUpdated = (message) => {
    let conversationList = this.state.conversationList;
    let found = false;
    conversationList.map((stateConversation, key) => {
      if (stateConversation.conversationId === message.conversationId) {
        found = true;
        if (this.state.selectedConversation && this.state.selectedConversation.uid === message.sender.uid) {
          stateConversation.unreadMessageCount = 0;
        } else {
          stateConversation.unreadMessageCount++;
        }
        stateConversation.lastMessage = message;
        conversationList.unshift(conversationList.splice(key, 1)[0]);
        return true;
      }
      return true;
    });
    if (!found) {
      CometChat.CometChatHelper.getConversationFromMessage(message).then((conv) => {
        conv.setUnreadMessageCount(1);
        conversationList = [conv, ...conversationList];
        this.setState({ conversationList });
      }, error => {
        console.log('This is an error in converting message to conversation', { error })
      })


    } else
      this.setState({ conversationList });
  }
  
  handleScroll(e) {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
    if (bottom) this.getConversationList();
  }
  handleClick = (item, type) => {
    this.props.onItemClick(item, type);
    let conversationList = this.state.conversationList;

    conversationList.map((stateConversation, key) => {
      if (stateConversation.conversationWith.uid === item.uid) {
        stateConversation.unreadMessageCount = 0;
        return true;
      }
      return true;
    });
    this.setState({ selectedConversation: item });
  }


  getConversationList() {
    this.cometChatManager.isCometChatUserLogedIn().then(
      conversation => {
        this.cometChatManager.fetchNextConversation().then(
          (conversationList) => {
            this.setState({ conversationList: [...this.state.conversationList, ...conversationList] });
          },
          error => {
            //TODO Handle the erros in conatct List.
            console.error("Handle the erros in conversation List", error);
          }
        );
      },
      error => {
        //TODO Handle the erros in users logedin state.
        console.error("Handle the erros in conversation List", error);
      }
    );
  }

  displayConversationList() {
    if (this.state.conversationList.length > 0) {
      return this.state.conversationList.map((conversation, key) => {
        return (
          <div id={key} onClick={() => this.handleClick(conversation.conversationWith, conversation.conversationType)} key={conversation.conversationId}>
            <ConversationView key={conversation.conversationId} conversation={conversation}></ConversationView>
            <div className="row cp-list-seperator"></div>

          </div>
        );

      });
    }
  }
  render() {
    return (
      <div className="cp-conversatiolist-wrapper">
        <p className="cp-contact-list-title font-extra-large">Chats</p>
        {/* <p className="cp-searchbar">
          <input  className="font-normal" type="text" placeholder="Search" aria-label="Search"/>
        </p> */}
        <div className="cp-userlist" onScroll={this.handleScroll}>

          {this.displayConversationList()}
        </div>
      </div>

    );
  }
}



export default CometChatConversationList;
export const cometChatConversationList=CometChatConversationList;

CometChatConversationList.defaultProps = {
  CometChatConversationList: {}
};
