import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";
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

import CallMessage from "../CallMessage";

import { 
  chatListStyle,
  listWrapperStyle,
  actionMessageStyle,
  actionMessageTxtStyle,
  messageDateContainerStyle,
  messageDateStyle,
  decoratorMessageStyle,
  decoratorMessageTxtStyle
} from "./style";

class MessageList extends React.PureComponent {
  loggedInUser = null;
  lastScrollTop = 0;
  times = 0;
  decoratorMessage = "Loading...";

  constructor(props) {

    super(props);
    this.state = {
      onItemClick: null,
    }
    
    this.loggedInUser = this.props.loggedInUser;
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
      
      this.MessageListManager.removeListeners();

      if (this.props.parentMessageId) {
        this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type, this.props.parentMessageId);
      } else {
        this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type);
      }

      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);

    } else if (this.props.type === 'group' && prevProps.item.guid !== this.props.item.guid){

      this.MessageListManager.removeListeners();

      if (this.props.parentMessageId) {
        this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type, this.props.parentMessageId);
      } else {
        this.MessageListManager = new MessageListManager(this.props.widgetsettings, this.props.item, this.props.type);
      }
      
      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);

    } else if(prevProps.parentMessageId !== this.props.parentMessageId) {
        
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

  getMessages = (scrollToBottom = false) => {

    const actionMessages = [];
    
    new CometChatManager().getLoggedInUser().then((user) => {
      
      //this.loggedInUser = user;
      this.MessageListManager.fetchPreviousMessages().then(messageList => {

        if (messageList.length === 0) {
          this.decoratorMessage = "No messages found";
        }

        messageList.forEach((message) => {
          
          if (message.category === "action" && message.sender.uid === "app_system") {
            actionMessages.push(message);
          }

          //if the sender of the message is not the loggedin user, mark it as read.
          if (message.getSender().getUid() !== user.getUid() && !message.getReadAt()) {
            
            if(message.getReceiverType() === "user") {

              CometChat.markAsRead(message.getId().toString(), message.getSender().getUid(), message.getReceiverType());

            } else if(message.getReceiverType() === "group") {

              CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
            }
          }
          this.props.actionGenerated("messageRead", message);
        });

        let actionGenerated = "messageFetched";
        if (scrollToBottom === true) {
          actionGenerated = "messageFetchedAgain";
        }
      
        ++this.times;

          if ((this.times === 1 && actionMessages.length > 5)
            || (this.times > 1 && actionMessages.length === 30)) {

            this.props.actionGenerated("messageFetched", messageList);
            this.getMessages(true);

          } else {

            this.lastScrollTop = this.messagesEnd.scrollHeight;
            this.props.actionGenerated(actionGenerated, messageList);
          }
          
      }).catch((error) => {
        //TODO Handle the erros in contact list.
        console.error("[MessageList] getMessages fetchPrevious error", error);
        this.decoratorMessage = "Error";
      });

    }).catch((error) => {
      console.log("[MessageList] getMessages getLoggedInUser error", error);
      this.decoratorMessage = "Error";
    });

  }

  //callback for listener functions
  messageUpdated = (key, message, group, options) => {

    switch(key) {

      case enums.MESSAGE_DELETED:
        this.messageDeleted(message);
        break;
      case enums.MESSAGE_EDITED:
        this.messageEdited(message);
        break;
      case enums.MESSAGE_DELIVERED:
      case enums.MESSAGE_READ:
        this.messageReadAndDelivered(message);
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

  messageEdited = (message) => {

    if ((this.props.type === 'group' && message.getReceiverType() === 'group' && message.getReceiver().guid === this.props.item.guid) 
      || (this.props.type === 'user' && message.getReceiverType() === 'user' && message.getSender().uid === this.props.item.uid)) {

      const messageList = [...this.props.messages];
      let messageKey = messageList.findIndex((m, k) => m.id === message.id);
      
      if (messageKey > -1) {

        const messageObj = messageList[messageKey];
        const newMessageObj = Object.assign({}, messageObj, message);

        messageList.splice(messageKey, 1, newMessageObj);
        this.props.actionGenerated("messageUpdated", messageList);
      } 
    } 
  }

  messageReadAndDelivered = (message) => {

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

          this.props.actionGenerated("messageUpdated", messageList);
        }

      } else if (message.getReceiptType() === "read") {

        //search for message
        let messageKey = messageList.findIndex(m => m.id === message.messageId);

        if (messageKey > -1) {

          let messageObj = { ...messageList[messageKey] };
          let newMessageObj = Object.assign({}, messageObj, { readAt: message.getReadAt() });
          messageList.splice(messageKey, 1, newMessageObj);

          this.props.actionGenerated("messageUpdated", messageList);
        }

      }

    } else if (message.getReceiverType() === 'group' 
      && message.getReceiver().guid === this.props.item.guid) {
      //not implemented
    }

  }

  messageReceived = (message) => {

    //new messages
    if (this.props.type === 'group' 
      && message.getReceiverType() === 'group'
      && message.getReceiverId() === this.props.item.guid) {

      if(!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }
      
      this.props.actionGenerated("messageReceived", [message]);
        
    } else if (this.props.type === 'user' 
      && message.getReceiverType() === 'user'
      && message.getSender().uid === this.props.item.uid) {

      if(!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getSender().uid, message.getReceiverType());
      }

      this.props.actionGenerated("messageReceived", [message]);
    }
  }

  customMessageReceived = (message) => {

    //new messages
    if (this.props.type === 'group'
      && message.getReceiverType() === 'group'
      && message.getReceiverId() === this.props.item.guid) {

      if (!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }

      if (message.hasOwnProperty("metadata")) {

        this.props.actionGenerated("customMessageReceived", [message]);

      } else if (message.type === "extension_poll") {//customdata (poll extension) does not have metadata

        const newMessage = this.addMetadataToCustomData(message);
        this.props.actionGenerated("customMessageReceived", [newMessage]);
      }

    } else if (this.props.type === 'user'
      && message.getReceiverType() === 'user'
      && message.getSender().uid === this.props.item.uid) {

      if (!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getSender().uid, message.getReceiverType());
      }

      if (message.hasOwnProperty("metadata")) {

        this.props.actionGenerated("customMessageReceived", [message]);

      } else if (message.type === "extension_poll") {//customdata (poll extension) does not have metadata

        const newMessage = this.addMetadataToCustomData(message);
        this.props.actionGenerated("customMessageReceived", [newMessage]);
      }
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

    if (validateWidgetSettings(this.props.widgetsettings, "show_call_notifications") === false) {
      return false;
    }
    
    if (this.props.type === 'group'
      && message.getReceiverType() === 'group'
      && message.getReceiverId() === this.props.item.guid) {

      if (!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }
      
      this.props.actionGenerated("callUpdated", message);

    } else if (this.props.type === 'user'
      && message.getReceiverType() === 'user'
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
    this.lastScrollTop = this.messagesEnd.scrollHeight - scrollTop;
    
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
      
      component = (<DeletedMessageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} messageOf="sender" />);

    } else {

      switch (message.type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          component = (message.text ? <SenderMessageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = (message.data.url ? <SenderImageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = (message.data.attachments ? <SenderFileBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = (message.data.url ? <SenderVideoBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = (message.data.url ? <SenderAudioBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
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

      component = (<DeletedMessageBubble theme={this.props.theme} key={key} message={message} messageOf="receiver" />);

    } else {

      switch (message.type) {
        case "message":
        case CometChat.MESSAGE_TYPE.TEXT:
          component = (message.text ? <ReceiverMessageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          component = (message.data.url ? <ReceiverImageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.FILE:
          component = (message.data.attachments ? <ReceiverFileBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          component = (message.data.url ? <ReceiverAudioBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
        break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          component = (message.data.url ? <ReceiverVideoBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} widgetconfig={this.props.widgetconfig} actionGenerated={this.props.actionGenerated} /> : null);
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
      component = (<DeletedMessageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} messageOf="sender" />);
    } else {

      switch (message.type) {
        case "extension_poll":
          component = <SenderPollBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
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
      component = (<DeletedMessageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} messageOf="receiver" />);
    } else {

      switch (message.type) {
        case "extension_poll":
          component = <ReceiverPollBubble user={this.loggedInUser} theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
          break;
        default:
          break;
      }
    }

    return component;
  }

  getCallMessageComponent = (message, key) => {
    return (
      <CallMessage message={message} key={key} theme={this.props.theme} loggedInUser={this.loggedInUser} />
    );
  }

  getActionMessageComponent = (message, key) => {

    let component = null;
    //console.log("getActionMessageComponent message", message);
    if(message.message) {

      component = (
        <div css={actionMessageStyle()} className="message__action" key={key}><p css={actionMessageTxtStyle()}>{message.message}</p></div>
      );

      //if action messages are set to hide in config
      if(this.props.messageconfig) {

        const found = this.props.messageconfig.find(cfg => {
          return (cfg.action === message.action && cfg.category === message.category);
        });
  
        if(found && found.enabled === false) {
          component = null;
        }
      }
      
    }

    return component;
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
      const messageSentDate = new Date(message.sentAt * 1000).toLocaleDateString();
      if (cDate !== messageSentDate) {
        dateSeparator = (<div css={messageDateContainerStyle()} className="message__date"><span css={messageDateStyle(this.props)}>{messageSentDate}</span></div>);
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

export default MessageList;
