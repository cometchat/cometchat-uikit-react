import React from "react";
import dateFormat from "dateformat";
/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { CometChat } from "@cometchat-pro/chat";

import { MessageListManager } from "./controller";
import * as enums from "../../util/enums.js";
import { validateWidgetSettings } from "../../util/common";

import SenderMessageBubble from "../SenderMessageBubble";
import ReceiverMessageBubble from "../ReceiverMessageBubble";
import SenderImageBubble from "../SenderImageBubble";
import ReceiverImageBubble from "../ReceiverImageBubble";
import SenderFileBubble from "../SenderFileBubble";
import ReceiverFileBubble from "../ReceiverFileBubble";
import SenderAudioBubble from "../SenderAudioBubble";
import ReceiverAudioBubble from "../ReceiverAudioBubble";
import SenderVideoBubble from "../SenderVideoBubble";
import ReceiverVideoBubble from "../ReceiverVideoBubble";
import DeletedMessageBubble from "../DeletedMessageBubble";
import SenderPollBubble from "../SenderPollBubble";
import ReceiverPollBubble from "../ReceiverPollBubble";
import SenderStickerBubble from "../SenderStickerBubble";
import ReceiverStickerBubble from "../ReceiverStickerBubble";
import SenderDocumentBubble from "../SenderDocumentBubble";
import ReceiverDocumentBubble from "../ReceiverDocumentBubble";
import SenderWhiteboardBubble from "../SenderWhiteboardBubble";
import ReceiverWhiteboardBubble from "../ReceiverWhiteboardBubble";
import SenderDirectCallBubble from "../SenderDirectCallBubble";
import ReceiverDirectCallBubble from "../ReceiverDirectCallBubble";

import CallMessage from "../CallMessage";
import ActionMessage from "../ActionMessage";

import { theme } from "../../resources/theme";
import Translator from "../../resources/localization/translator";

import { 
  chatListStyle,
  listWrapperStyle,
  messageDateContainerStyle,
  messageDateStyle,
  decoratorMessageStyle,
  decoratorMessageTxtStyle
} from "./style";

class MessageList extends React.PureComponent {
  loggedInUser = null;
  lastScrollTop = 0;
  times = 0;
  decoratorMessage = Translator.translate("LOADING", Translator.getDefaultLanguage());

  constructor(props) {

    super(props);
    this.state = {
      onItemClick: null,
    }

    CometChat.getLoggedInUser().then(user => this.loggedInUser = user).catch((error) => {
      console.log("[CometChatUnified] getLoggedInUser error", error);
    });

    this.messagesEnd = React.createRef();
  }

  componentDidMount() {

    if(this.props.parentMessageId) {
      this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type,this.props.parentMessageId);
    } else {
      this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type);
    }
    
    this.getMessages();
    this.MessageListManager.attachListeners(this.messageUpdated);
  }

  componentDidUpdate(prevProps, prevState) {
   
    const previousMessageStr = JSON.stringify(prevProps.messages);
    const currentMessageStr = JSON.stringify(this.props.messages);

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {
      
      this.messageCount = 0;
      this.decoratorMessage = Translator.translate("LOADING", this.props.lang);
      this.MessageListManager.removeListeners();

      if (this.props.parentMessageId) {
        this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type, this.props.parentMessageId);
      } else {
        this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type);
      }

      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);

    } else if (this.props.type === 'group' && prevProps.item.guid !== this.props.item.guid){

      this.messageCount = 0;
      this.decoratorMessage = Translator.translate("LOADING", this.props.lang);
      this.MessageListManager.removeListeners();

      if (this.props.parentMessageId) {
        this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type, this.props.parentMessageId);
      } else {
        this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type);
      }
      
      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);

    } else if(prevProps.parentMessageId !== this.props.parentMessageId) {
      
      this.messageCount = 0;
      this.decoratorMessage = Translator.translate("LOADING", this.props.lang);
      this.MessageListManager.removeListeners();

      this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type, this.props.parentMessageId);
      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);

    } else if (previousMessageStr !== currentMessageStr) {
      
      if(this.props.scrollToBottom) {
        this.scrollToBottom();
      } else {
        this.scrollToBottom(this.lastScrollTop);
      }
      
    }
  }

  scrollToBottom = (scrollHeight = 0) => {
    
    if (this.messagesEnd) {
      this.messagesEnd.scrollTop = (this.messagesEnd.scrollHeight - scrollHeight);
    }
  }

  getMessages = (actionGenerated = "messageFetched") => {
          
    this.MessageListManager.fetchPreviousMessages().then(messageList => {

      if (messageList.length === 0) {
        this.decoratorMessage = Translator.translate("NO_MESSAGES_FOUND", this.props.lang);
      }

      //updating messagecount variable
      this.messageCount = messageList.length;

      messageList.forEach((message) => {

        //if the sender of the message is not the loggedin user, mark it as read.
        if (message.getSender().getUid() !== this.loggedInUser.getUid() && !message.getReadAt()) {
          
          if(message.getReceiverType() === "user") {

            CometChat.markAsRead(message.getId().toString(), message.getSender().getUid(), message.getReceiverType());

          } else if(message.getReceiverType() === "group") {

            CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
          }
        }

        this.props.actionGenerated("messageRead", message);
      });

      this.lastScrollTop = this.messagesEnd.scrollHeight;
      this.props.actionGenerated(actionGenerated, messageList);
        
    }).catch((error) => {
      //TODO Handle the erros in contact list.
      console.error("[MessageList] getMessages fetchPrevious error", error);
      this.decoratorMessage = Translator.translate("ERROR", this.props.lang);
    });

  }

  //callback for listener functions
  messageUpdated = (key, message, group, options) => {

    switch(key) {

      case enums.MESSAGE_DELETED:
        this.messageDeleted(message);
        break;
      case enums.MESSAGE_EDITED:
        this.onMessageEdited(message);
        break;
      case enums.MESSAGE_DELIVERED:
      case enums.MESSAGE_READ:
        this.onMessageReadAndDelivered(message);
        break;
      case enums.TEXT_MESSAGE_RECEIVED:
      case enums.MEDIA_MESSAGE_RECEIVED:
        this.messageReceived(message);
        break;
      case enums.CUSTOM_MESSAGE_RECEIVED:
        this.customMessageReceived(message);
        break;
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
      case enums.GROUP_MEMBER_JOINED:
      case enums.GROUP_MEMBER_LEFT:
      case enums.GROUP_MEMBER_ADDED:
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_UNBANNED:
        this.groupUpdated(key, message, group, options);
        break;
      case enums.INCOMING_CALL_RECEIVED:
      case enums.INCOMING_CALL_CANCELLED:
      case enums.OUTGOING_CALL_ACCEPTED:
      case enums.OUTGOING_CALL_REJECTED:
        this.callUpdated(message);
        break;
      default:
        break;
    }
  }

  messageDeleted = (message) => {

    if (this.props.type === 'group' 
    && message.getReceiverType() === 'group'
    && message.getReceiver().guid === this.props.item.guid) {

      this.props.actionGenerated("messageDeleted", [message]);
        
    } else if (this.props.type === 'user' 
    && message.getReceiverType() === 'user'
    && message.getSender().uid === this.props.item.uid) {

      this.props.actionGenerated("messageDeleted", [message]);
    }
  }

  onMessageEdited = (message) => {

    const messageList = [...this.props.messages];
    const updateEditedMessage = (message) => {

      let messageKey = messageList.findIndex(m => m.id === message.id);

      if (messageKey > -1) {

        const messageObj = messageList[messageKey];
        const newMessageObj = Object.assign({}, messageObj, message);

        messageList.splice(messageKey, 1, newMessageObj);
        this.props.actionGenerated("onMessageEdited", messageList, newMessageObj);
      }
    }

    if (this.props.type === 'group' && message.getReceiverType() === 'group' && message.getReceiver().guid === this.props.item.guid) {

      updateEditedMessage(message);

    } else if (this.props.type === 'user' 
    && message.getReceiverType() === 'user' 
    && (this.loggedInUser.uid === message.getReceiverId() && message.getSender().uid === this.props.item.uid)) {

      updateEditedMessage(message);

    } else if (this.props.type === 'user'
    && message.getReceiverType() === 'user'
    && (this.loggedInUser.uid === message.getSender().uid && message.getReceiverId() === this.props.item.uid)) {
      updateEditedMessage(message);
    }

  }

  onMessageReadAndDelivered = (message) => {

    //read receipts
    if (message.getReceiverType() === 'user'
    && message.getSender().getUid() === this.props.item.uid
    && message.getReceiver() === this.loggedInUser.uid) {

      let messageList = [...this.props.messages];
      
      if (message.getReceiptType() === "delivery") {

        //search for message
        let messageKey = messageList.findIndex(m => m.id === message.messageId);

        if (messageKey > -1) {

          let messageObj = { ...messageList[messageKey] };
          let newMessageObj = Object.assign({}, messageObj, { deliveredAt: message.getDeliveredAt() });
          messageList.splice(messageKey, 1, newMessageObj);

          this.props.actionGenerated("onMessageReadAndDelivered", messageList);
        }

      } else if (message.getReceiptType() === "read") {

        //search for message
        let messageKey = messageList.findIndex(m => m.id === message.messageId);

        if (messageKey > -1) {

          let messageObj = { ...messageList[messageKey] };
          let newMessageObj = Object.assign({}, messageObj, { readAt: message.getReadAt() });
          messageList.splice(messageKey, 1, newMessageObj);

          this.props.actionGenerated("onMessageReadAndDelivered", messageList);
        }

      }

    } else if (message.getReceiverType() === 'group' 
      && message.getReceiver().guid === this.props.item.guid) {
      //not implemented
    }

  }

  reInitializeMessageBuilder = () => {

    if (this.props.hasOwnProperty("parentMessageId") === false) {
      this.messageCount = 0;
    }
    
    this.props.actionGenerated("refreshingMessages", []);

    this.decoratorMessage = Translator.translate("LOADING", this.props.lang);
    this.MessageListManager.removeListeners();

    if (this.props.parentMessageId) {
      this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type, this.props.parentMessageId);
    } else {
      this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type);
    }
    
    this.getMessages("messageRefreshed");
    this.MessageListManager.attachListeners(this.messageUpdated);
  }

  markMessageAsRead = (message, type) => {

    if (type === "user") {

      if (!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getSender().uid, message.getReceiverType());
      }

    } else if (type === "group") {

      if (!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }

    }
  }

  messageReceived = (message) => {

    //new messages
    if (this.props.type === 'group' 
      && message.getReceiverType() === 'group'
      && message.getReceiverId() === this.props.item.guid) {

      this.messageReceivedHandler(message, "group");
        
    } else if (this.props.type === 'user' 
      && message.getReceiverType() === 'user'
      && message.getSender().uid === this.props.item.uid) {

      this.messageReceivedHandler(message, "user");
    }
  }

  messageReceivedHandler = (message, type) => {

    //handling dom lag - increment count only for main message list
    if (message.hasOwnProperty("parentMessageId") === false && this.props.hasOwnProperty("parentMessageId") === false) {

      ++this.messageCount;
      //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
      if (this.messagesEnd.scrollHeight - this.messagesEnd.scrollTop === this.messagesEnd.clientHeight) {

        if (this.messageCount > enums.MAX_MESSAGE_COUNT) {

          this.reInitializeMessageBuilder();

        } else {
          
          this.markMessageAsRead(message, type);
          this.props.actionGenerated("messageReceived", [message]);
        }

      } else {//if the user has scrolled in chat window
        this.props.actionGenerated("newMessagesArrived", [message]);
      }

    } else if (message.hasOwnProperty("parentMessageId") === true && this.props.hasOwnProperty("parentMessageId") === true) {

      if (message.parentMessageId === this.props.parentMessageId) {
        this.markMessageAsRead(message, type);
      }

      this.props.actionGenerated("messageReceived", [message]);

    } else {
      this.props.actionGenerated("messageReceived", [message]);
    }

  }

  //polls, stickers, collaborative document, collaborative whiteboard
  customMessageReceived = (message) => {

    //new messages
    if (this.props.type === CometChat.RECEIVER_TYPE.GROUP
      && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP
      && this.loggedInUser.uid === message.getSender().uid && message.getReceiverId() === this.props.item.guid
      && (message.type === enums.CUSTOM_TYPE_DOCUMENT || message.type === enums.CUSTOM_TYPE_WHITEBOARD)) {

      //showing collaborative document and whiteboard for sender (custom message received listener for sender)
      this.props.actionGenerated("customMessageReceived", [message]);

    } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP
    && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP
    && message.getReceiverId() === this.props.item.guid) {

      this.customMessageReceivedHandler(message, "group");

    } else if (this.props.type === CometChat.RECEIVER_TYPE.USER
    && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER
    && message.getSender().uid === this.props.item.uid) {

      this.customMessageReceivedHandler(message, "user");

    } else if (this.props.type === CometChat.RECEIVER_TYPE.USER
    && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER
    && this.loggedInUser.uid === message.getSender().uid && message.getReceiverId() === this.props.item.uid
    && (message.type === enums.CUSTOM_TYPE_DOCUMENT || message.type === enums.CUSTOM_TYPE_WHITEBOARD)) {

      //showing collaborative document and whiteboard for sender (custom message received listener for sender)
      this.props.actionGenerated("customMessageReceived", [message]);

    }
  }

  customMessageReceivedHandler = (message, type) => {

    const triggerCustomMessageReceived = (message) => {

      if (message.type === enums.CUSTOM_TYPE_POLL) {

        const newMessage = this.addMetadataToCustomData(message);
        this.props.actionGenerated("customMessageReceived", [newMessage]);

      } else {

        this.props.actionGenerated("customMessageReceived", [message]);
      }
    }

    //handling dom lag - increment count only for main message list
    if (message.hasOwnProperty("parentMessageId") === false && this.props.hasOwnProperty("parentMessageId") === false) {

      ++this.messageCount;
      
      //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
      if (this.messagesEnd.scrollHeight - this.messagesEnd.scrollTop === this.messagesEnd.clientHeight) {

        if (this.messageCount > enums.MAX_MESSAGE_COUNT) {

          this.reInitializeMessageBuilder();

        } else {

          this.markMessageAsRead(message, type);
          triggerCustomMessageReceived(message);
        }

      } else {//if the user has scrolled in chat window
        
        this.props.actionGenerated("newMessagesArrived", [message]);
      }

    } else if (message.hasOwnProperty("parentMessageId") === true && this.props.hasOwnProperty("parentMessageId") === true) {

      if (message.parentMessageId === this.props.parentMessageId) {
        this.markMessageAsRead(message, type);
      }
      
      triggerCustomMessageReceived(message);

    } else {

      triggerCustomMessageReceived(message);
    }

  }

  addMetadataToCustomData = (message) => {

    const customData = message.data.customData;
    const options = customData.options;

    const resultOptions = {};
    for (const option in options) {

      resultOptions[option] = {
        text: options[option],
        count: 0,
      }
    }

    const polls = {
      "id": message.id,
      "options": options,
      "results": {
        "total": 0,
        "options": resultOptions,
        "question": customData.question
      },
      "question": customData.question
    };

    return { ...message, "metadata": { "@injected": { "extensions": { "polls": polls } } } };
  }

  callUpdated = (message) => {

    // if (validateWidgetSettings(this.props.widgetsettings, "show_call_notifications") === false) {
    //   return false;
    // }
    
    if (this.props.type === CometChat.RECEIVER_TYPE.GROUP
      && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP
      && message.getReceiverId() === this.props.item.guid) {

      if (!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }
      
      this.props.actionGenerated("callUpdated", message);

    } else if (this.props.type === CometChat.RECEIVER_TYPE.USER
      && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER
      && message.getSender().uid === this.props.item.uid) {

      if (!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getSender().uid, message.getReceiverType());
      }
      
      this.props.actionGenerated("callUpdated", message);
    }

  }

  groupUpdated = (key, message, group, options) => {
    
    if (this.props.type === 'group' 
    && message.getReceiverType() === 'group'
    && message.getReceiver().guid === this.props.item.guid) {

      // if(!message.getReadAt()) {
      //   CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      // }
      
      this.props.actionGenerated("groupUpdated", message, key, group, options);
    }
  }

  handleScroll = (e) => {

    const scrollTop = e.currentTarget.scrollTop;
    const scrollHeight = e.currentTarget.scrollHeight;
    const clientHeight = e.currentTarget.clientHeight;

    this.lastScrollTop = scrollHeight - scrollTop;

    if (this.lastScrollTop === clientHeight) {
      this.props.actionGenerated("clearUnreadMessages");
    }
    
    const top = Math.round(scrollTop) === 0;
    if (top && this.props.messages.length) {
      this.getMessages();
    }
  }

  handleClick = (message) => {
    this.props.onItemClick(message, 'message');
  }

  getSenderMessageComponent = (message, key) => {

    let component;
    
    if(message.hasOwnProperty("deletedAt")) {
      
      component = (<DeletedMessageBubble key={key} message={message} messageOf="sender" {...this.props} />);

    } else {

      switch (message.type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          component = (message.text ? <SenderMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = (message.data.url ? <SenderImageBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = (message.data.attachments ? <SenderFileBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = (message.data.url ? <SenderVideoBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = (message.data.url ? <SenderAudioBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        default:
        break;
      }

    }
    
    return component;
  }

  getReceiverMessageComponent = (message, key) => {

    let component;

    if(message.hasOwnProperty("deletedAt")) {

      component = (<DeletedMessageBubble key={key} message={message} messageOf="receiver" />);

    } else {

      switch (message.type) {
        case "message":
        case CometChat.MESSAGE_TYPE.TEXT:
          component = (message.text ? <ReceiverMessageBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = (message.data.url ? <ReceiverImageBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = (message.data.attachments ? <ReceiverFileBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = (message.data.url ? <ReceiverAudioBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = (message.data.url ? <ReceiverVideoBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} /> : null);
        break;
        default:
        break;
      }
    }
    return component;
  }

  getSenderCustomMessageComponent = (message, key) => {

    let component;
    if (message.hasOwnProperty("deletedAt")) {
      component = (<DeletedMessageBubble key={key} message={message} messageOf="sender" {...this.props} />);
    } else {

      switch (message.type) {
        case enums.CUSTOM_TYPE_POLL:
          component = <SenderPollBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break;
        case enums.CUSTOM_TYPE_STICKER:
          component = <SenderStickerBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break;
        case enums.CUSTOM_TYPE_DOCUMENT:
          component = <SenderDocumentBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break; 
        case enums.CUSTOM_TYPE_WHITEBOARD:
          component = <SenderWhiteboardBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break; 
        case enums.CUSTOM_TYPE_MEETING:
          component = <SenderDirectCallBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break;
        default:
          break;
      }
    }

    return component;
  }

  getReceiverCustomMessageComponent = (message, key) => {

    let component;
    if (message.hasOwnProperty("deletedAt")) {
      component = (<DeletedMessageBubble key={key} message={message} messageOf="receiver" {...this.props} />);
    } else {

      switch (message.type) {
        case enums.CUSTOM_TYPE_POLL:
          component = <ReceiverPollBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break;
        case enums.CUSTOM_TYPE_STICKER:
          component = <ReceiverStickerBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break;
        case enums.CUSTOM_TYPE_DOCUMENT:
          component = <ReceiverDocumentBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break;
        case enums.CUSTOM_TYPE_WHITEBOARD:
          component = <ReceiverWhiteboardBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break;
        case enums.CUSTOM_TYPE_MEETING:
          component = <ReceiverDirectCallBubble loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />;
          break;
        default:
          break;
      }
    }

    return component;
  }

  getCallMessageComponent = (message, key) => {
    return (
      <CallMessage loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />
    );
  }

  getActionMessageComponent = (message, key) => {

    return (
      <ActionMessage loggedInUser={this.loggedInUser} key={key} message={message} {...this.props} />
    );
  }
  
  getComponent = (message, key) => {

    let component;
    
    switch(message.category) {
      case "action":
        component = this.getActionMessageComponent(message, key);
      break;
      case "call":
        component = this.getCallMessageComponent(message, key);
      break;
      case "message":
        if(this.loggedInUser.uid === message.sender.uid) {
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

  render() {

    let messageContainer = null;
    if (this.props.messages.length === 0) {
      messageContainer = (
        <div css={decoratorMessageStyle()} className="messages__decorator-message">
          <p css={decoratorMessageTxtStyle(this.props)} className="decorator-message">{this.decoratorMessage}</p>
        </div>
      );
    }

    let cDate = null;
    const messages = this.props.messages.map((message, key) => {

      let dateSeparator = null;

      const messageDate = (message.sentAt * 1000);
      const messageSentDate = dateFormat(messageDate, "dd/mm/yyyy");
      if (cDate !== messageSentDate) {
        dateSeparator = (<div css={messageDateContainerStyle()} className="message__date">
          <span css={messageDateStyle(this.props)}>{messageSentDate}</span>
        </div>);
      }
      cDate = messageSentDate;

      return (
        <React.Fragment key={key}>
          {dateSeparator}
          {this.getComponent(message, key)}
        </React.Fragment>
      )
    });

    return (
      <div className="chat__list" css={chatListStyle(this.props)}>
        {messageContainer}
        <div className="list__wrapper" css={listWrapperStyle()} ref={(el) => { this.messagesEnd = el; }} onScroll={this.handleScroll}>
          {messages}
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this.MessageListManager.removeListeners();
    this.MessageListManager = null;
  }
}

// Specifies the default values for props:
MessageList.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

MessageList.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default MessageList;
