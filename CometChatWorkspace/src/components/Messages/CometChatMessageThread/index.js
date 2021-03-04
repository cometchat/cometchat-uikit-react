import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { 
  CometChatMessageList, CometChatMessageComposer,
  CometChatSenderTextMessageBubble, CometChatReceiverTextMessageBubble,
  CometChatSenderImageMessageBubble, CometChatReceiverImageMessageBubble,
  CometChatSenderFileMessageBubble, CometChatReceiverFileMessageBubble,
  CometChatSenderAudioMessageBubble, CometChatReceiverAudioMessageBubble,
  CometChatSenderVideoMessageBubble, CometChatReceiverVideoMessageBubble,
} from "../";

import {
  CometChatSenderPollMessageBubble, CometChatReceiverPollMessageBubble,
  CometChatSenderStickerBubble, CometChatReceiverStickerMessageBubble,
  CometChatSenderDocumentBubble, CometChatReceiverDocumentBubble,
  CometChatSenderWhiteboardBubble, CometChatReceiverWhiteboardBubble,
} from "../Extensions"

import { checkMessageForExtensionsData } from "../../../util/common";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
  wrapperStyle,
  headerStyle,
  headerWrapperStyle,
  headerDetailStyle,
  headerTitleStyle,
  headerNameStyle,
  headerCloseStyle,
  messageContainerStyle,
  parentMessageStyle,
  messageSeparatorStyle,
  messageReplyStyle,
} from "./style";

import clearIcon from "./resources/close.png";

class CometChatMessageThread extends React.PureComponent {

  loggedInUser = null;

  constructor(props) {

    super(props);

    this.loggedInUser = props.loggedInUser;
    this.composerRef = React.createRef();

    this.state = {
      messageList: [],
      scrollToBottom: false,
      replyCount: 0,
      replyPreview: null,
      messageToBeEdited: null,
      parentMessage: props.parentMessage
    }
  }

  componentDidUpdate(prevProps) {

    if (prevProps.parentMessage !== this.props.parentMessage) {

      if (prevProps.parentMessage.id !== this.props.parentMessage.id) {
        this.setState({ messageList: [], scrollToBottom: true, parentMessage: this.props.parentMessage });
      } else if (prevProps.parentMessage.data !== this.props.parentMessage.data) {
        this.setState({ parentMessage: this.props.parentMessage });
      } 
      
    } 
  }

  parentMessageEdited = (message) => {

    const parentMessage = { ...this.props.parentMessage };

    if (parentMessage.id === message.id) {
      const newMessageObj = { ...message };
      this.setState({ parentMessage: newMessageObj });
    }

  }

  actionHandler = (action, messages) => {
      
    switch(action) {
      case "customMessageReceived":
      case "messageReceived": {
        const message = messages[0];
        if (message.hasOwnProperty("parentMessageId") && message.parentMessageId === this.state.parentMessage.id) {

          const replyCount = (this.state.parentMessage.hasOwnProperty("replyCount")) ? this.state.parentMessage.replyCount : 0;
          const newReplyCount = replyCount + 1;

          let messageObj = { ...this.state.parentMessage };
          let newMessageObj = Object.assign({}, messageObj, { replyCount: newReplyCount });
          this.setState({ parentMessage: newMessageObj });

          this.smartReplyPreview(messages);
          this.appendMessage(messages);
        }
      }
      break;
      case enums.ACTIONS["MESSAGE_COMPOSED"]: {

        const replyCount = (this.state.parentMessage.hasOwnProperty("replyCount")) ? this.state.parentMessage.replyCount : 0;
        const newReplyCount = replyCount + 1;

        let messageObj = { ...this.state.parentMessage };
        let newMessageObj = Object.assign({}, messageObj, { replyCount: newReplyCount });
        this.setState({ parentMessage: newMessageObj });

        this.appendMessage(messages);
        this.props.actionGenerated("threadMessageComposed", messages);
      }
      break;
      case enums.ACTIONS["MESSAGE_SENT"]:
      case enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"]:
        this.messageSent(messages);
        break;
      case "onMessageReadAndDelivered":
        this.updateMessages(messages);
        break;
      case "onMessageEdited":
        this.updateMessages(messages);
      break;
      case "messageFetched":
        this.prependMessages(messages);
      break;
      case "messageDeleted":
        this.removeMessages(messages);
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
      case "deleteMessage":
        this.deleteMessage(messages);
        break;
      case "viewActualImage":
        this.props.actionGenerated("viewActualImage", messages);
        break;
      case "reactToMessage":
        this.reactToMessage(messages);
        break;
      default:
      break;
    }
  }

  messageSent = (message) => {

    const messageList = [...this.state.messageList];
    let messageKey = messageList.findIndex(m => m._id === message._id);
    if (messageKey > -1) {

      const newMessageObj = { ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);
    }
  }

  editMessage = (message) => {
    this.setState({ "messageToBeEdited": message });
  }

  messageEdited = (message) => {

    const messageList = [...this.state.messageList];
    let messageKey = messageList.findIndex(m => m.id === message.id);
    if (messageKey > -1) {

      const messageObj = messageList[messageKey];

      const newMessageObj = { ...messageObj, ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);

      if (messageList.length - messageKey === 1) {
        this.props.actionGenerated("messageEdited", [newMessageObj]);
      }

    }
  }

  clearEditPreview = () => {
    this.setState({ "messageToBeEdited": "" });
  }

  deleteMessage = (message) => {

    const messageId = message.id;
    CometChat.deleteMessage(messageId).then(deletedMessage => {

      this.removeMessages([deletedMessage]);

      const messageList = [...this.state.messageList];
      let messageKey = messageList.findIndex(m => m.id === message.id);

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        this.props.actionGenerated("messageDeleted", [deletedMessage]);
      }

    }).catch(error => {
      console.log("Message delete failed with error:", error);
    });
  }

  smartReplyPreview = (messages) => {

    const message = messages[0];

    const smartReplyData = checkMessageForExtensionsData(message, "smart-reply");
    if (smartReplyData && smartReplyData.hasOwnProperty("error") === false) {
      this.setState({ replyPreview: message });
    } else {
      this.setState({ replyPreview: null });
    }
  }

  //message is received or composed & sent
  appendMessage = (message) => {
    let messages = [...this.state.messageList];
    messages = messages.concat(message);
    this.setState({ messageList: messages, scrollToBottom: true });
  }

  //message status is updated
  updateMessages = (messages) => {
    this.setState({ messageList: messages });
  }

  //messages are fetched from backend
  prependMessages = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList: messageList, scrollToBottom: false });
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

  getSenderMessageComponent = (message, key) => {

    let component;

    switch (message.type) {
      case CometChat.MESSAGE_TYPE.TEXT:
        component = <CometChatSenderTextMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        component = <CometChatSenderImageMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      case CometChat.MESSAGE_TYPE.FILE:
        component = <CometChatSenderFileMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        component = <CometChatSenderVideoMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        component = <CometChatSenderAudioMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      default:
        break;
    }

    return component;
  }

  getReceiverMessageComponent = (message, key) => {

    let component;

    switch (message.type) {
      case "message":
      case CometChat.MESSAGE_TYPE.TEXT:
        component = <CometChatReceiverTextMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        component = <CometChatReceiverImageMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      case CometChat.MESSAGE_TYPE.FILE:
        component = <CometChatReceiverFileMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        component = <CometChatReceiverAudioMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        component = <CometChatReceiverVideoMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.actionHandler} {...this.props} />;
        break;
      default:
        break;
    }

    return component;
  }

  getSenderCustomMessageComponent = (message, key) => {

    let component;

    switch (message.type) {
      case enums.CUSTOM_TYPE_POLL:
        component = <CometChatSenderPollMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.props.actionGenerated} {...this.props} />;
        break;
      case enums.CUSTOM_TYPE_STICKER:
        component = <CometChatSenderStickerBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.props.actionGenerated} {...this.props} />;
        break;
      case enums.CUSTOM_TYPE_DOCUMENT:
        component = <CometChatSenderDocumentBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.props.actionGenerated} {...this.props} />;
        break;
      case enums.CUSTOM_TYPE_WHITEBOARD:
        component = <CometChatSenderWhiteboardBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.props.actionGenerated} {...this.props} />;
        break;
      default:
        break;
    }

    return component;
  }

  getReceiverCustomMessageComponent = (message, key) => {

    let component;
    switch (message.type) {
      case enums.CUSTOM_TYPE_POLL:
        component = <CometChatReceiverPollMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.props.actionGenerated} {...this.props} />;
        break;
      case enums.CUSTOM_TYPE_STICKER:
        component = <CometChatReceiverStickerMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.props.actionGenerated} {...this.props} />;
        break;
      case enums.CUSTOM_TYPE_DOCUMENT:
        component = <CometChatReceiverDocumentBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.props.actionGenerated} {...this.props} />;
        break;
      case enums.CUSTOM_TYPE_WHITEBOARD:
        component = <CometChatReceiverWhiteboardBubble loggedInUser={this.loggedInUser} key={key} message={message} actionGenerated={this.props.actionGenerated} {...this.props} />;
        break;
      default:
        break;
    }

    return component;
  }

  getParentMessageComponent = (message) => {

    let component = null;
    const key = 1;

    switch (message.category) {

      case "message":
        if (this.loggedInUser.uid === message.sender.uid) {
          component = this.getSenderMessageComponent(message, key);
        } else {
          component = this.getReceiverMessageComponent(message, key);
        }
      break;
      case "custom":
        if (this.loggedInUser.uid === message.sender.uid) {
          component = this.getSenderCustomMessageComponent(message, key);
        } else {
          component = this.getReceiverCustomMessageComponent(message, key);
        }
      break;
      default:
      break;
    }

    return component;
  }

  reactToMessage = (message) => {

    this.setState({ "messageToReact": message });

    if (this.composerRef) {
      this.composerRef.toggleEmojiPicker();
    }
  }

  render() {

    let parentMessage = this.getParentMessageComponent(this.state.parentMessage);
    
    let seperator = (<div css={messageSeparatorStyle(this.props)}><hr/></div>);
    if (this.state.parentMessage.hasOwnProperty("replyCount")) {

      const replyCount = this.state.parentMessage.replyCount;
      const replyText = (replyCount === 1) ? (`${replyCount} ${Translator.translate("REPLY", this.props.lang)}`) : (`${replyCount} ${Translator.translate("REPLIES", this.props.lang)}`);

      seperator = (
        <div css={messageSeparatorStyle(this.props)} className="message__separator">
          <span css={messageReplyStyle()} className="message__replies">{replyText}</span>
          <hr/>
        </div>
      );
    }

    return (
      <div css={wrapperStyle(this.props)} className="thread__chat">
        <div css={headerStyle(this.props)} className="chat__header">
          <div css={headerWrapperStyle()} className="header__wrapper">    
            <div css={headerDetailStyle()} className="header__details">
              <h6 css={headerTitleStyle()} className="header__title">{Translator.translate("THREAD", this.props.lang)}</h6>
              <span css={headerNameStyle()} className="header__username">{this.props.item.name}</span>
            </div>
            <div css={headerCloseStyle(clearIcon)} className="header__close" onClick={() => this.props.actionGenerated("closeThreadClicked")}></div>
          </div>
        </div>
        <div css={messageContainerStyle()} className="chat__message__container">
          <div css={parentMessageStyle(this.props.parentMessage)} className="parent__message">{parentMessage}</div>
          {seperator}
          <CometChatMessageList
          theme={this.props.theme}
          messages={this.state.messageList} 
          item={this.props.item} 
          type={this.props.type}
          scrollToBottom={this.state.scrollToBottom}
          config={this.props.config}
          widgetsettings={this.props.widgetsettings}
          parentMessageId={this.props.parentMessage.id}
          lang={this.props.lang}
          actionGenerated={this.actionHandler} />
          <CometChatMessageComposer
          ref={(el) => { this.composerRef = el; }}
          theme={this.props.theme}
          item={this.props.item} 
          type={this.props.type}
          lang={this.props.lang}
          widgetsettings={this.props.widgetsettings}
          loggedInUser={this.loggedInUser}
          parentMessageId={this.props.parentMessage.id}
          messageToBeEdited={this.state.messageToBeEdited}
          replyPreview={this.state.replyPreview}
          messageToReact={this.state.messageToReact}
          actionGenerated={this.actionHandler} />
        </div>
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatMessageThread.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatMessageThread.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatMessageThread;