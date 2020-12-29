/* eslint-disable no-lone-blocks */
import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { CometChat } from "@cometchat-pro/chat";

import MessageHeader from "../MessageHeader";
import MessageList from "../MessageList";
import MessageComposer from "../MessageComposer";
import LiveReaction from "../LiveReaction";

import { theme } from "../../resources/theme";

import * as enums from '../../util/enums.js';
import { checkMessageForExtensionsData, validateWidgetSettings } from "../../util/common";
import Translator from "../../resources/localization/translator";

import { chatWrapperStyle, reactionsWrapperStyle } from "./style";

import { incomingMessageAlert } from "../../resources/audio/";

class CometChatMessageListScreen extends React.PureComponent {

  constructor(props) {

    super(props);

    this.state = {
      messageList: [],
      scrollToBottom: true,
      messageToBeEdited: "",
      replyPreview: null,
      liveReaction: false,
      messageToReact: null,
      lang: props.lang
    }

    this.composerRef = React.createRef();
    this.reactionName = props.reaction;
    this.audio = new Audio(incomingMessageAlert);
  }

  componentDidMount() {
    window.addEventListener('languagechange', this.setState({ lang: Translator.getLanguage() }));
  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {
      
      this.setState({ messageList: [], scrollToBottom: true, messageToBeEdited: ""});

    } else if (this.props.type === 'group' && prevProps.item.guid !== this.props.item.guid) {
      
      this.setState({ messageList: [], scrollToBottom: true, messageToBeEdited: "" });

    } else if(prevProps.type !== this.props.type) {
      
      this.setState({ messageList: [], scrollToBottom: true, messageToBeEdited: "" });

    } else if(prevProps.composedthreadmessage !== this.props.composedthreadmessage) {

      this.updateReplyCount(this.props.composedthreadmessage);

    } else if(prevProps.callmessage !== this.props.callmessage) {

      this.actionHandler("callUpdated", this.props.callmessage);

    } else if (prevProps.groupmessage !== this.props.groupmessage) {

      if (validateWidgetSettings(this.props.widgetsettings, "hide_join_leave_notifications") !== true) {
        this.appendMessage(this.props.groupmessage);
      }
    }

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
    }
  }

  playAudio = () => {

    //if audio sound is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_sound_for_messages") === false) {
      return false;
    }

    this.audio.currentTime = 0;
    this.audio.play();
  }

  actionHandler = (action, messages, key, group, options) => {
    
    switch(action) {
      case "customMessageReceived":
      case "messageReceived": {

        const message = messages[0];
        if(message.parentMessageId) {
          this.updateReplyCount(messages);
        } else {

          this.smartReplyPreview(messages);
          this.appendMessage(messages);
        }

        this.playAudio();
      }
      break;
      case "messageRead":
        this.props.actionGenerated(action, messages);
      break;
      case "messageComposed": {
        this.appendMessage(messages);
        this.props.actionGenerated("messageComposed", messages);
        break;
      }
      case "onMessageEdited": {

        this.updateMessages(messages);
        //update the parent message of thread message
        this.props.actionGenerated("updateThreadMessage", messages, "edit");

      }
      break;
      case "messageFetched":
        this.prependMessages(messages);
      break;
      case "messageFetchedAgain": 
        this.prependMessagesAndScrollBottom(messages);
      break;
      case "messageDeleted": {

        this.removeMessages(messages);
        //remove the thread message
        this.props.actionGenerated("updateThreadMessage", messages, "delete");

      }
      break;
      case "viewMessageThread":
        this.props.actionGenerated("viewMessageThread", messages);
      break;
      case "deleteMessage":
        this.deleteMessage(messages);
      break;
      case "editMessage":
        this.editMessage(messages);
      break;
      case "messageEdited":
        this.messageEdited(messages);
        break;
      case "clearEditPreview":
        this.clearEditPreview();
        break;
      case "groupUpdated":
        this.groupUpdated(messages, key, group, options);
      break;
      case "callUpdated":
        this.callUpdated(messages);
      break;
      case "pollAnswered": 
        this.updatePollMessage(messages)
      break;
      case "pollCreated":
        this.appendPollMessage(messages)
      break;
      case "viewActualImage":
        this.props.actionGenerated("viewActualImage", messages);
      break;
      case "audioCall":
      case "videoCall":
      case "viewDetail":
      case "menuClicked":
        this.props.actionGenerated(action);
        break;
      case "sendReaction":
        this.toggleReaction(true);
      break;
      case "showReaction":
        this.showReaction(messages);
        break;
      case "stopReaction":
        this.toggleReaction(false);
        break; 
      case "reactToMessage":
        this.reactToMessage(messages);
      break;
      default:
      break;
    }
  }

  toggleReaction = (flag) => {
    this.setState({ liveReaction: flag});
  }

  showReaction = (reaction) => {
    
    if(!reaction.hasOwnProperty("metadata")) {
      return false;
    }

    if (!reaction.metadata.hasOwnProperty("type") || !reaction.metadata.hasOwnProperty("reaction")) {
      return false;
    }

    if (!enums.LIVE_REACTIONS.hasOwnProperty(reaction.metadata.reaction)) {
      return false;
    }

    if (reaction.metadata.type === enums.LIVE_REACTION_KEY) {

      this.reactionName = reaction.metadata.reaction;
      this.setState({ liveReaction: true });
    }
  }

  deleteMessage = (message) => {

    const messageId = message.id;
    CometChat.deleteMessage(messageId).then(deletedMessage => {
      
      //remove edit preview when message is deleted
      if (deletedMessage.id === this.state.messageToBeEdited.id) {
        this.setState({ messageToBeEdited: "" });
      }

      this.removeMessages([deletedMessage]);

      const messageList = [...this.state.messageList];
      let messageKey = messageList.findIndex(m => m.id === message.id);

      this.props.actionGenerated("updateThreadMessage", [deletedMessage], "delete");

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        this.props.actionGenerated("messageDeleted", [deletedMessage]);
      }
      
    }).catch(error => {
      console.log("Message delete failed with error:", error);
    });
  }

  editMessage = (message) => {
    this.setState({ messageToBeEdited: message, replyPreview: null });
  }

  messageEdited = (message) => {
    
    const messageList = [...this.state.messageList];
    let messageKey = messageList.findIndex(m => m.id === message.id);
    if (messageKey > -1) {

      const messageObj = messageList[messageKey];

      const newMessageObj = Object.assign({}, messageObj, message);

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);

      this.props.actionGenerated("updateThreadMessage", [newMessageObj], "edit");

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        this.props.actionGenerated("messageEdited", [newMessageObj]);
      }
      
    }
  }

  updatePollMessage = (message) => {

    const messageList = [...this.state.messageList];
    const messageId = message.poll.id;
    let messageKey = messageList.findIndex((m, k) => m.id === messageId);
    if (messageKey > -1) {

      const messageObj = messageList[messageKey]; 

      const metadataObj = { "@injected": { "extensions": { "polls": message.poll }}};

      const newMessageObj = { ...messageObj, "metadata": metadataObj };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);
    }
  }

  appendPollMessage = (messages) => {

    this.appendMessage(messages); 
  }

  //messages are deleted
  removeMessages = (messages) => {

    const deletedMessage = messages[0];
    const messagelist = [...this.state.messageList];

    let messageKey = messagelist.findIndex(message => message.id === deletedMessage.id);
    if (messageKey > -1) {

      let messageObj = { ...messagelist[messageKey] };
      let newMessageObj = Object.assign({}, messageObj, deletedMessage);

      messagelist.splice(messageKey, 1, newMessageObj);
      this.setState({ messageList: messagelist, scrollToBottom: false });
    }
  }

  //messages are fetched from backend
  prependMessages = (messages) => {

    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList: messageList, scrollToBottom: false });
  }

  prependMessagesAndScrollBottom = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList: messageList, scrollToBottom: true });
  }

  //message is received or composed & sent
  appendMessage = (message) => {

    let messages = [...this.state.messageList];
    messages = messages.concat(message);
    this.setState({ messageList: messages, scrollToBottom: true });
  }

  //message status is updated
  updateMessages = (messages) => {
    this.setState({ messageList: messages, scrollToBottom: false });
  }

  groupUpdated = (message, key, group, options) => {

    if (validateWidgetSettings(this.props.widgetsettings, "hide_join_leave_notifications") !== true) {
      this.appendMessage([message]);
    }

    this.props.actionGenerated("groupUpdated", message, key, group, options);
  }

  callUpdated = (message) => {

    //if call actions messages are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "show_call_notifications") === false) {
      return false;
    }

    this.appendMessage([message]);
  }

  updateReplyCount = (messages) => {

    const receivedMessage = messages[0];

    let messageList = [...this.state.messageList];
    let messageKey = messageList.findIndex(m => m.id === receivedMessage.parentMessageId);
    if (messageKey > -1) {

      const messageObj = messageList[messageKey];
      let replyCount = (messageObj.hasOwnProperty("replyCount")) ? messageObj.replyCount : 0;
      replyCount = replyCount + 1;
      const newMessageObj = Object.assign({}, messageObj, { "replyCount": replyCount });
      
      messageList.splice(messageKey, 1, newMessageObj);
      this.setState({ messageList: messageList, scrollToBottom: false });
    }
  }

  smartReplyPreview = (messages) => {

    const message = messages[0];
    if (message.sender.uid === this.props.loggedInUser.uid || message.category === enums.CATEGORY_CUSTOM) {
      return false;
    }
    
    const smartReplyData = checkMessageForExtensionsData(message, "smart-reply");
    if (smartReplyData && smartReplyData.hasOwnProperty("error") === false) {
      this.setState({ replyPreview: message });
    } else {
      this.setState({ replyPreview: null });
    }
  }

  clearEditPreview = () => {
    this.setState({ messageToBeEdited:  "" });
  }

  reactToMessage = (message) => {

    this.setState({ "messageToReact": message});

    if (this.composerRef) {
      this.composerRef.toggleEmojiPicker();
    }
  }

  render() {

    let messageComposer = (
      <MessageComposer 
      ref={(el) => { this.composerRef = el; } }
      theme={this.props.theme}
      item={this.props.item} 
      type={this.props.type}
      lang={this.state.lang}
      widgetsettings={this.props.widgetsettings}
      loggedInUser={this.props.loggedInUser}
      messageToBeEdited={this.state.messageToBeEdited}
      replyPreview={this.state.replyPreview}
      reaction={this.reactionName}
      messageToReact={this.state.messageToReact}
      actionGenerated={this.actionHandler} />
    );

    //if sending messages are disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "enable_sending_messages") === false) {
      messageComposer = null;
    }

    let liveReactionView = null;
    if (this.state.liveReaction) {
      liveReactionView = (
        <div css={reactionsWrapperStyle()}>
          <LiveReaction reaction={this.reactionName} theme={this.props.theme} lang={this.state.lang} />
        </div>
      );
    }
    
    return (
      <div css={chatWrapperStyle(this.props.theme)} className="main__chat" dir={Translator.getDirection(this.state.lang)}>
        <MessageHeader 
        sidebar={this.props.sidebar}
        theme={this.props.theme}
        item={this.props.item} 
        type={this.props.type} 
        lang={this.state.lang}
        viewdetail={this.props.viewdetail === false ? false : true}
        audiocall={this.props.audiocall === false ? false : true}
        videocall={this.props.videocall === false ? false : true}
        widgetsettings={this.props.widgetsettings}
        loggedInUser={this.props.loggedInUser}
        actionGenerated={this.actionHandler} />
        <MessageList 
        theme={this.props.theme}
        messages={this.state.messageList} 
        item={this.props.item} 
        type={this.props.type}
        lang={this.state.lang}
        scrollToBottom={this.state.scrollToBottom}
        messageconfig={this.props.messageconfig}
        widgetsettings={this.props.widgetsettings}
        widgetconfig={this.props.widgetconfig}
        loggedInUser={this.props.loggedInUser}
        actionGenerated={this.actionHandler} />
        {liveReactionView}
        {messageComposer}
      </div>
    )
  }
}

// Specifies the default values for props:
CometChatMessageListScreen.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  reaction: "heart"
};

CometChatMessageListScreen.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  reaction: PropTypes.string
}

export default CometChatMessageListScreen;
