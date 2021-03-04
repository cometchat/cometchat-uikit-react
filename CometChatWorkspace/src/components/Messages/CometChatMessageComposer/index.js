/* eslint-disable jsx-a11y/img-redundant-alt */
import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import "emoji-mart/css/emoji-mart.css";

import { CometChatSmartReplyPreview, CometChatCreatePoll, CometChatStickerKeyboard } from "../Extensions";
import { CometChatEmojiKeyboard } from "../";

import { validateWidgetSettings, checkMessageForExtensionsData, ID, getUnixTimestamp } from "../../../util/common";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";
import { outgoingMessageAlert } from "../../../resources/audio/";

import {
  chatComposerStyle,
  editPreviewContainerStyle,
  previewHeadingStyle,
  previewCloseStyle,
  previewTextStyle,
  composerInputStyle,
  inputInnerStyle,
  messageInputStyle,
  inputStickyStyle,
  stickyAttachmentStyle,
  filePickerStyle,
  fileListStyle,
  fileItemStyle,
  stickyAttachButtonStyle,
  stickyButtonStyle,
  emojiButtonStyle,
  sendButtonStyle,
  reactionBtnStyle,
  stickerBtnStyle
} from "./style";

import roundedPlus from "./resources/attach.png";
import videoIcon from "./resources/attachvideo.png";
import audioIcon from "./resources/attachaudio.png";
import docIcon from "./resources/attachfile.png";
import imageIcon from "./resources/attachimage.png";
import insertEmoticon from "./resources/insertemoji.png"
import sendBlue from "./resources/sendmessage.png";
import pollIcon from "./resources/createpoll.png";
import stickerIcon from "./resources/insertsticker.png"
import closeIcon from "./resources/close.png";
import documentIcon from "./resources/launchcollaborativedocument.png";
import whiteboardIcon from "./resources/launchcollaborativewhiteboard.png";

class CometChatMessageComposer extends React.PureComponent {

  constructor(props) {

    super(props);
  
		this.imageUploaderRef = React.createRef();
		this.fileUploaderRef = React.createRef();
		this.audioUploaderRef = React.createRef();
    this.videoUploaderRef = React.createRef();
    this.messageInputRef = React.createRef();

    this.isTyping = false;

    this.state = {
      showFilePicker: false,
      messageInput: "",
      messageType: "",
      emojiViewer: false,
      createPoll: false,
      messageToBeEdited: "",
      replyPreview: null,
      stickerViewer: false,
      messageToReact: "",
      shareDocument: false,
      shareWhiteboard: false
    }

    this.audio = new Audio(outgoingMessageAlert);
  }

  componentDidMount() {

    if (this.messageInputRef && this.messageInputRef.current) {
      this.messageInputRef.current.focus();
    }
  }

  componentDidUpdate(prevProps, prevState) {

    if (prevProps.messageToBeEdited !== this.props.messageToBeEdited) {

      const messageToBeEdited = this.props.messageToBeEdited;

      this.setState({ "messageInput": messageToBeEdited, "messageToBeEdited": messageToBeEdited });
      
      const element = this.messageInputRef.current;
      if (messageToBeEdited) {

        let messageText = messageToBeEdited.text;

        //xss extensions data
        const xssData = checkMessageForExtensionsData(messageToBeEdited, "xss-filter");
        if (xssData
          && xssData.hasOwnProperty("sanitized_text")
          && xssData.hasOwnProperty("hasXSS")
          && xssData.hasXSS === "yes") {
          messageText = xssData.sanitized_text;
        }
        
        element.focus();
        element.textContent = "";
        this.pasteHtmlAtCaret(messageText, false);

      } else {
        element.textContent = "";
      }
    }

    if (prevProps.replyPreview !== this.props.replyPreview) {
      this.setState({ replyPreview: this.props.replyPreview });  
    }

    const previousMessageStr = JSON.stringify(prevProps.messageToReact);
    const currentMessageStr = JSON.stringify(this.props.messageToReact);

    if (previousMessageStr !== currentMessageStr) {
      this.setState({ messageToReact: this.props.messageToReact });
    }

    if (prevProps.item !== this.props.item) {

      this.messageInputRef.current.textContent = "";
      this.setState({ stickerViewer: false, emojiViewer: false, replyPreview: null, messageToBeEdited: "", messageInput: "" });

      this.focusOnMessageComposer();
    }

    if (prevState.messageInput !== this.state.messageInput) {
      this.focusOnMessageComposer();
    }
  }

  focusOnMessageComposer = () => {

    if (this.messageInputRef && this.messageInputRef.current) {
      this.messageInputRef.current.focus();
    }
  }

  playAudio = () => {

    //if message sound is disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "enable_sound_for_messages") === false) {
      return false;
    }

    this.audio.currentTime = 0;
    this.audio.play();
  }

  pasteHtmlAtCaret(html, selectPastedContent) {
    var sel, range;
    if (window.getSelection) {
      // IE9 and non-IE
      sel = window.getSelection();
      if (this.props.widgetsettings && this.props.hasOwnProperty("widgetsettings")) {
        const parentnode = (this.props.widgetsettings.hasOwnProperty("parentNode")) ? this.props.widgetsettings.parentNode : null;
        if (parentnode) {
          sel = parentnode.querySelector('iframe').contentWindow.getSelection();
        }
      }
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        // Range.createContextualFragment() would be useful here but is
        // only relatively recently standardized and is not supported in
        // some browsers (IE9, for one)
        var el = document.createElement("div");
        el.innerText = html;
        var frag = document.createDocumentFragment(), node, lastNode;
        while ( (node = el.firstChild) ) {
          lastNode = frag.appendChild(node);
        }
        var firstNode = frag.firstChild;
        range.insertNode(frag);
        
        // Preserve the selection
        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);
          if (selectPastedContent) {
            range.setStartBefore(firstNode);
          } else {
            range.collapse(true);
          }
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else if ( (sel = document.selection) && sel.type !== "Control") {
      // IE < 9
      var originalRange = sel.createRange();
      originalRange.collapse(true);
      sel.createRange().pasteHTML(html);
      if (selectPastedContent) {
        range = sel.createRange();
        range.setEndPoint("StartToStart", originalRange);
        range.select();
      }
    }
  }

  emojiClicked = (emoji, event) => {

    if (this.state.messageToReact) {
      this.reactToMessages(emoji);
      return;
    }

    const element = this.messageInputRef.current;
    element.focus();
    this.pasteHtmlAtCaret(emoji.native, false);
    this.setState({"messageInput": element.innerText, "messageType": "text"});
  }
  
  changeHandler = (event) => {

    this.startTyping();

    const elem = event.currentTarget;
    let messageInput = elem.textContent.trim();

    if(!messageInput.length) {
      event.currentTarget.textContent = messageInput;
      //return false;
    }
    
    this.setState({"messageInput": elem.innerText, "messageType": "text"});
  }

  toggleFilePicker = () => {

    const currentState = !this.state.showFilePicker;
    this.setState({ showFilePicker: currentState });
  }

  openFileDialogue = (fileType) => {

    switch (fileType) {
      case "image":
        this.imageUploaderRef.current.click();
        break;
      case "file":
          this.fileUploaderRef.current.click();
        break;
      case "audio":
          this.audioUploaderRef.current.click();
        break;
      case "video":
          this.videoUploaderRef.current.click();
        break;
      default:
        break;
    }
  }

  onImageChange = (e) => {; 

    if (!this.imageUploaderRef.current.files["0"]) {
      return false;
    }

    const uploadedFile = this.imageUploaderRef.current.files["0"];

    var reader = new FileReader(); // Creating reader instance from FileReader() API
    reader.addEventListener("load", (event) => { // Setting up base64 URL on image

      const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
      this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.IMAGE);

    }, false);

    reader.readAsArrayBuffer(uploadedFile)  
  }

  onFileChange = (e) => {

    if (!this.fileUploaderRef.current.files["0"]) {
      return false;
    }

    const uploadedFile = this.fileUploaderRef.current.files["0"];

    var reader = new FileReader(); // Creating reader instance from FileReader() API
    reader.addEventListener("load", (event) => { // Setting up base64 URL on image

      const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
      this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.FILE);

    }, false);

    reader.readAsArrayBuffer(uploadedFile); 
  }

  onAudioChange = (e) => {

    if (!this.audioUploaderRef.current.files["0"]) {
      return false;
    }

    const uploadedFile = this.audioUploaderRef.current.files["0"];

    var reader = new FileReader(); // Creating reader instance from FileReader() API
    reader.addEventListener("load", () => { // Setting up base64 URL on image

      const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
      this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.AUDIO);

    }, false);

    reader.readAsArrayBuffer(uploadedFile); 
  }

  onVideoChange = (e) => {
 
    if (!this.videoUploaderRef.current.files["0"]) {
      return false;
    }

    const uploadedFile = this.videoUploaderRef.current.files["0"];

    var reader = new FileReader(); // Creating reader instance from FileReader() API
    reader.addEventListener("load", () => { // Setting up base64 URL on image

      const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
      this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.VIDEO);

    }, false);

    reader.readAsArrayBuffer(uploadedFile);  
  }

  getReceiverDetails = () => {

    let receiverId;
    let receiverType;

    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {

      receiverId = this.props.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;

    } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {

      receiverId = this.props.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    return { "receiverId": receiverId, "receiverType": receiverType };
  }

  getConversationId = () => {

    let conversationId = null;
    
    if (this.props.type === CometChat.RECEIVER_TYPE.USER) {

      const users = [this.props.loggedInUser.uid, this.props.item.uid];
      conversationId = users.sort().join("_user_");
      
    } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {
      conversationId = `group_${this.props.item.guid}`
    }

    return conversationId;
  }

  sendMediaMessage = (messageInput, messageType) => {

    this.toggleFilePicker();
    this.endTyping(null, null);
    
    const { receiverId, receiverType } = this.getReceiverDetails();
    const conversationId = this.getConversationId();

    let mediaMessage = new CometChat.MediaMessage(receiverId, messageInput, messageType, receiverType);
    if(this.props.parentMessageId) {
      mediaMessage.setParentMessageId(this.props.parentMessageId);
    }

    mediaMessage.setSender(this.props.loggedInUser);
    mediaMessage.setReceiver(this.props.type);
    mediaMessage.setType(messageType);
    mediaMessage.setConversationId(conversationId);
    mediaMessage.setData({
      type: messageType,
      category: CometChat.CATEGORY_MESSAGE,
      name: messageInput["name"],
      file: messageInput
    });
    mediaMessage._composedAt = getUnixTimestamp();
    mediaMessage._id = ID();

    this.playAudio();
    this.props.actionGenerated(enums.ACTIONS["MESSAGE_COMPOSED"], [mediaMessage]);
    
    CometChat.sendMessage(mediaMessage).then(message => {

      const newMessageObj = { ...message, "_id": mediaMessage._id };
      this.props.actionGenerated(enums.ACTIONS["MESSAGE_SENT"], newMessageObj);

    }).catch(error => {

      console.log("Message sending failed with error:", error);

      const newMessageObj = { ...mediaMessage, "error": error };
      this.props.actionGenerated(enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"], newMessageObj);
    });
  }

  sendMessageOnEnter = (event) => {

    if(event.keyCode === 13 && !event.shiftKey) {

      event.preventDefault();
      this.sendTextMessage();
      return true;
    }
  }

  sendTextMessage = () => {

    if(this.state.emojiViewer) {
      this.setState({ emojiViewer: false});
    }

    if(!this.state.messageInput.trim().length) {
      return false;
    }

    if (this.state.messageToBeEdited) {
      this.editMessage();
      return false;
    }

    this.endTyping(null, null);
    
    let { receiverId, receiverType } = this.getReceiverDetails();
    let messageInput = this.state.messageInput.trim();

    const conversationId = this.getConversationId();

    let textMessage = new CometChat.TextMessage(receiverId, messageInput, receiverType);
    if(this.props.parentMessageId) {
      textMessage.setParentMessageId(this.props.parentMessageId);
    }
    textMessage.setSender(this.props.loggedInUser);
    textMessage.setReceiver(this.props.type);
    textMessage.setText(messageInput);
    textMessage.setConversationId(conversationId);
    textMessage._composedAt = getUnixTimestamp();
    textMessage._id = ID();

    this.props.actionGenerated(enums.ACTIONS["MESSAGE_COMPOSED"], [textMessage]);
    this.setState({ messageInput: "", replyPreview: false });
    
    this.messageInputRef.current.textContent = "";
    this.playAudio();
    
    CometChat.sendMessage(textMessage).then(message => {

      const newMessageObj = { ...message, "_id": textMessage._id };
      this.props.actionGenerated(enums.ACTIONS["MESSAGE_SENT"], newMessageObj);

    }).catch(error => {

      console.log("Message sending failed with error:", error);

      const newMessageObj = { ...textMessage, "error": error };
      this.props.actionGenerated(enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"], newMessageObj);

    });
  }

  editMessage = () => {

    this.endTyping(null, null);

    const messageToBeEdited = this.props.messageToBeEdited;

    let { receiverId, receiverType } = this.getReceiverDetails();
    let messageText = this.state.messageInput.trim();
    let textMessage = new CometChat.TextMessage(receiverId, messageText, receiverType);
    textMessage.setId(messageToBeEdited.id);

    const newMessage = Object.assign({}, textMessage, { messageFrom: messageToBeEdited.messageFrom })
    this.props.actionGenerated("messageEdited", newMessage);

    this.setState({ messageInput: "" });
    this.messageInputRef.current.textContent = "";
    this.playAudio();

    this.closeEditPreview();

    CometChat.editMessage(textMessage).then(message => {

      this.props.actionGenerated("messageEdited", { ...message });

    }).catch(error => {
      console.log("Message editing failed with error:", error);
    });
  }

  closeEditPreview = () => {
    this.props.actionGenerated("clearEditPreview");
  }

  startTyping = (timer, metadata) => {

    let typingInterval = timer || 5000;
    
    //if typing indicator is disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "show_typing_indicators") === false) {
      return false;
    }
    
    if(this.isTyping) {
      return false;
    }

    let { receiverId, receiverType } = this.getReceiverDetails();
    let typingMetadata = metadata || undefined;

    let typingNotification = new CometChat.TypingIndicator(receiverId, receiverType, typingMetadata);
    CometChat.startTyping(typingNotification);
    
    this.isTyping = setTimeout(() => {

      this.endTyping(null, null);
      
    }, typingInterval);
  }

  endTyping = (event, metadata) => {

    //fixing synthetic issue
    if (event) {
      event.persist();
    }

    //if typing indicator is disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "show_typing_indicators") === false) {
      return false;
    }

    let { receiverId, receiverType } = this.getReceiverDetails();

    let typingMetadata = metadata || undefined;

    let typingNotification = new CometChat.TypingIndicator(receiverId, receiverType, typingMetadata);
    CometChat.endTyping(typingNotification);

    clearTimeout(this.isTyping);
    this.isTyping = null;
  }

  toggleStickerPicker = () => {

    const stickerViewer = this.state.stickerViewer;
    this.setState({ stickerViewer: !stickerViewer, emojiViewer: false })
  }

  toggleEmojiPicker = () => {

    const emojiViewer = this.state.emojiViewer;
    this.setState({ emojiViewer: !emojiViewer, stickerViewer: false});
  }

  toggleCreatePoll = () => {

    const createPoll = this.state.createPoll;
    this.setState({ createPoll: !createPoll });
  }

  toggleCollaborativeDocument = () => {

    const { receiverId, receiverType } = this.getReceiverDetails();
    
    CometChat.callExtension("document", "POST", "v1/create", {
      "receiver": receiverId,
      "receiverType": receiverType
    }).then(response => {
      // Response with document url
    }).catch(error => {
      // Some error occured
    });
  }

  toggleCollaborativeBoard = () => {

    const { receiverId, receiverType } = this.getReceiverDetails();

    CometChat.callExtension("whiteboard", "POST", "v1/create", {
      "receiver": receiverId,
      "receiverType": receiverType,
    }).then(response => {
      // Response with board_url
    }).catch(error => {
      // Some error occured
    });
  }

  closeCreatePoll = () => {

    this.toggleCreatePoll();
    this.toggleFilePicker();
  }

  actionHandler = (action, message) => {

    switch(action) {
      
      case enums.ACTIONS["POLL_CREATED"]:
        this.toggleCreatePoll();
        this.toggleFilePicker();
      break;
      case "sendSticker":
        this.sendSticker(message);
      break;
      case "closeSticker":
        this.toggleStickerPicker();
        break;
      default:
      break;
    }
  }

  sendSticker = (stickerMessage) => {

    const { receiverId, receiverType } = this.getReceiverDetails();

    const customData = { "sticker_url": stickerMessage.stickerUrl, "sticker_name": stickerMessage.stickerName };
    const customType = enums.CUSTOM_TYPE_STICKER;

    const conversationId = this.getConversationId();

    const customMessage = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);
    if (this.props.parentMessageId) {
      customMessage.setParentMessageId(this.props.parentMessageId);
    }
    customMessage.setSender(this.props.loggedInUser);
    customMessage.setReceiver(this.props.type);
    customMessage.setConversationId(conversationId);
    customMessage._composedAt = getUnixTimestamp();
    customMessage._id = ID();

    this.props.actionGenerated(enums.ACTIONS["MESSAGE_COMPOSED"], [customMessage]);

    this.playAudio();

    CometChat.sendCustomMessage(customMessage).then(message => {

      const newMessageObj = { ...message, "_id": customMessage._id };
      this.props.actionGenerated(enums.ACTIONS["MESSAGE_SENT"], newMessageObj);

    }).catch(error => {

      console.log("custom message sending failed with error", error);

      const newMessageObj = { ...customMessage, "error": error };
      this.props.actionGenerated(enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"], newMessageObj);

    });
  }

  sendReplyMessage = (messageInput) => {

    let { receiverId, receiverType } = this.getReceiverDetails();

    const conversationId = this.getConversationId();

    let textMessage = new CometChat.TextMessage(receiverId, messageInput, receiverType);
    if (this.props.parentMessageId) {
      textMessage.setParentMessageId(this.props.parentMessageId);
    }
    textMessage.setSender(this.props.loggedInUser);
    textMessage.setReceiver(this.props.type);
    textMessage.setConversationId(conversationId);
    textMessage._composedAt = getUnixTimestamp();
    textMessage._id = ID();

    this.props.actionGenerated(enums.ACTIONS["MESSAGE_COMPOSED"], [textMessage]);

    this.playAudio();
    this.setState({ replyPreview: null })

    CometChat.sendMessage(textMessage).then(message => {

      const newMessageObj = { ...message, "_id": textMessage._id };
      this.props.actionGenerated(enums.ACTIONS["MESSAGE_SENT"], newMessageObj);

    }).catch(error => {

      console.log("Message sending failed with error:", error);
      const newMessageObj = { ...textMessage, "error": error };
      this.props.actionGenerated(enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"], newMessageObj);

    });
  }

  clearReplyPreview = () => {
    this.setState({replyPreview: null})
  }

  sendReaction = (event) => {

    const typingInterval = 1000;

    const typingMetadata = { "type": enums.LIVE_REACTION_KEY, "reaction": this.props.reaction };

    this.startTyping(typingInterval, typingMetadata);
    this.props.actionGenerated("sendReaction");

    event.persist();

    setTimeout(() => {

      this.endTyping(null, typingMetadata);
      this.props.actionGenerated("stopReaction");

    }, typingInterval);
  }

  reactToMessages = (emoji) => {

    //const message = this.state.messageToReact;
    CometChat.callExtension("reactions", "POST", "v1/react", {
      msgId: this.state.messageToReact.id,
      emoji: emoji.colons,
    }).then(response => {

      if (response.hasOwnProperty("success") && response["success"] === true) {
        this.toggleEmojiPicker();
      }

    }).catch(error => {
      // Some error occured
    });

  }

  render() {

    let liveReactionBtn = null;
    const liveReactionText = Translator.translate("LIVE_REACTION", this.props.lang);
    if (enums.LIVE_REACTIONS.hasOwnProperty(this.props.reaction)) {

      const reactionName = this.props.reaction;
      const imgSrc = enums.LIVE_REACTIONS[reactionName];
      liveReactionBtn = (
        <div title={liveReactionText} css={reactionBtnStyle(imgSrc)} className="button__reactions" onClick={this.sendReaction}>
          <img src={require(`${imgSrc}`)} alt={reactionName} />
        </div>
      );
    }
     
    let disabledState = false;
    if(this.props.item.blockedByMe) {
      disabledState = true;
    }

    const docText = Translator.translate("ATTACH_FILE", this.props.lang);
    let docs = (
      <div 
      title={docText}
      css={fileItemStyle()} 
      className="filelist__item item__file" 
      onClick={() => { this.openFileDialogue("file") }}>
        <img src={docIcon} alt={docText} />
        <input onChange={this.onFileChange} type="file" id="file" ref={this.fileUploaderRef} />
      </div>
    );

    const videoText = Translator.translate("ATTACH_VIDEO", this.props.lang);
    const audioText = Translator.translate("ATTACH_AUDIO", this.props.lang);
    const imageText = Translator.translate("ATTACH_IMAGE", this.props.lang);
    let avp = (
      <React.Fragment>
        <div title={videoText} css={fileItemStyle()} className="filelist__item item__video" onClick={() => { this.openFileDialogue("video") }}>
          <img src={videoIcon} alt={videoText} />
          <input onChange={this.onVideoChange} accept="video/*" type="file" ref={this.videoUploaderRef} />
        </div>
        <div title={audioText} css={fileItemStyle()} className="filelist__item item__audio" onClick={() => { this.openFileDialogue("audio") }}>
          <img src={audioIcon} alt={audioText} />
          <input onChange={this.onAudioChange} accept="audio/*" type="file" ref={this.audioUploaderRef} />
        </div>
        <div title={imageText} css={fileItemStyle()} className="filelist__item item__image" onClick={() => { this.openFileDialogue("image") }}>
          <img src={imageIcon} alt={imageText} />
          <input onChange={this.onImageChange} accept="image/*" type="file" ref={this.imageUploaderRef} />
        </div>
      </React.Fragment>
    );

    const pollText = Translator.translate("CREATE_POLL", this.props.lang);
    let createPollBtn = (
      <div
      title={pollText}
      css={fileItemStyle()}
      className="filelist__item item__poll"
      onClick={this.toggleCreatePoll}>
        <img src={pollIcon} alt={pollText} />
      </div>
    );

    const collaborativeDocText = Translator.translate("COLLABORATE_USING_DOCUMENT", this.props.lang);
    let collaborativeDocBtn = (
      <div
      title={collaborativeDocText}
      css={fileItemStyle()}
      className="filelist__item item__document"
      onClick={this.toggleCollaborativeDocument}>
        <img src={documentIcon} alt={collaborativeDocText} />
      </div>
    );

    const collaborativeBoardText = Translator.translate("COLLABORATE_USING_WHITEBOARD", this.props.lang);
    let collaborativeBoardBtn = (
      <div
      title={collaborativeBoardText}
      css={fileItemStyle()}
      className="filelist__item item__whiteboard"
      onClick={this.toggleCollaborativeBoard}>
        <img src={whiteboardIcon} alt={collaborativeBoardText} />
      </div>
    );

    const emojiText = Translator.translate("EMOJI", this.props.lang);
    let emojiBtn = (
      <div 
      title={emojiText}
      css={emojiButtonStyle()}
      className="button__emoji" 
      onClick={() => {
      this.toggleEmojiPicker();
      this.setState({ messageToReact: ""  });}}>
        <img src={insertEmoticon} alt={emojiText} />
      </div>
    );

    const StickerText = Translator.translate("STICKER", this.props.lang);
    let stickerBtn = (
      <div
      title={StickerText}
      css={stickerBtnStyle()}
      className="button__sticker"
      onClick={this.toggleStickerPicker} > <img src={stickerIcon} alt={StickerText} /></div>
    );

    const sendMessageText = Translator.translate("SEND_MESSAGE", this.props.lang);
    let sendBtn = (
      <div title={sendMessageText} css={sendButtonStyle()} className="button__send" onClick={this.sendTextMessage}>
        <img src={sendBlue} alt={sendMessageText} />
      </div>
    );

    //if photos, videos upload are disabled for chat widget in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "send_photos_videos") === false) {
      avp = null;
    }

    //if files upload are disabled for chat widget in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "send_files") === false) {
      docs = null;
    }

    //if polls are disabled for chat widget in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "allow_creating_polls") === false || this.props.parentMessageId) {
      createPollBtn = null;
    }

    //if collaborative_document are disabled for chat widget in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "enable_collaborative_document") === false || this.props.parentMessageId) {
      collaborativeDocBtn = null;
    }

    //if collaborative_document are disabled for chat widget in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "enable_collaborative_whiteboard") === false || this.props.parentMessageId) {
      collaborativeBoardBtn = null;
    }

    //if emojis are disabled for chat widget in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "send_emojis") === false) {
      emojiBtn = null;
    }

    //if live reactions is disabled for chat widget in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "share_live_reactions") === false
    || this.state.messageInput.length) {
      liveReactionBtn = null;
    }

    //if stickers is disabled for chat widget in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "show_stickers") === false) {
      stickerBtn = null;
    }

    if (!this.state.messageInput.length) {
      sendBtn = null;
    }

    const attachText = Translator.translate("ATTACH", this.props.lang);
    let attach = (
      <div css={stickyAttachmentStyle()} className="input__sticky__attachment">
        <div css={stickyAttachButtonStyle()} className="attachment__icon" onClick={this.toggleFilePicker} title={attachText}>
          <img src={roundedPlus} alt={attachText} />
        </div>
        <div css={filePickerStyle(this.state)} className="attachment__filepicker" dir={Translator.getDirection(this.props.lang)}>
          <div css={fileListStyle()} className="filepicker__filelist">
            {avp}
            {docs}
            {createPollBtn}
            {collaborativeDocBtn}
            {collaborativeBoardBtn}
          </div>
        </div>
      </div>
    );

    if (avp === null && docs === null && createPollBtn === null && collaborativeDocBtn === null && collaborativeBoardBtn === null) {
      attach = null;
    }

    let createPoll = null; 
    if (this.state.createPoll) {
      createPoll = (
        <CometChatCreatePoll
        theme={this.props.theme}
        item={this.props.item}
        type={this.props.type}
        open={this.state.createPoll}
        close={this.closeCreatePoll}
        lang={this.props.lang}
        widgetsettings={this.props.widgetsettings}
        actionGenerated={this.actionHandler} />
      );
    }

    let editPreview = null;
    if (this.state.messageToBeEdited) {

      let messageText = this.state.messageToBeEdited.text;

      //xss extensions data
      const xssData = checkMessageForExtensionsData(this.state.messageToBeEdited, "xss-filter");
      if (xssData
        && xssData.hasOwnProperty("sanitized_text")
        && xssData.hasOwnProperty("hasXSS")
        && xssData.hasXSS === "yes") {
        messageText = xssData.sanitized_text;
      }

      //datamasking extensions data
      const maskedData = checkMessageForExtensionsData(this.state.messageToBeEdited, "data-masking");
      if (maskedData
        && maskedData.hasOwnProperty("data")
        && maskedData.data.hasOwnProperty("sensitive_data")
        && maskedData.data.hasOwnProperty("message_masked")
        && maskedData.data.sensitive_data === "yes") {
        messageText = maskedData.data.message_masked;
      }

      //profanity extensions data
      const profaneData = checkMessageForExtensionsData(this.state.messageToBeEdited, "profanity-filter");
      if (profaneData
        && profaneData.hasOwnProperty("profanity")
        && profaneData.hasOwnProperty("message_clean")
        && profaneData.profanity === "yes") {
        messageText = profaneData.message_clean;
      }

      editPreview = (
        <div css={editPreviewContainerStyle(this.props, keyframes)}>
          <div css={previewHeadingStyle()}>
            <div css={previewTextStyle()}>{Translator.translate("EDIT_MESSAGE", this.props.lang)}</div>
            <span css={previewCloseStyle(closeIcon)} onClick={this.closeEditPreview}></span>
          </div>
          <div>{messageText}</div>
        </div>
      );
    }

    let smartReplyPreview = null;
    if(this.state.replyPreview) {

      const message = this.state.replyPreview;

      const smartReplyData = checkMessageForExtensionsData(message, "smart-reply");
      if (smartReplyData && smartReplyData.hasOwnProperty("error") === false) {

        const options = [smartReplyData["reply_positive"], smartReplyData["reply_neutral"], smartReplyData["reply_negative"]];
        smartReplyPreview = (
          <CometChatSmartReplyPreview {...this.props} options={options} clicked={this.sendReplyMessage} close={this.clearReplyPreview} />
        );

      }
    }

    let stickerViewer = null;
    if (this.state.stickerViewer) {
      stickerViewer = (
        <CometChatStickerKeyboard 
        theme={this.props.theme}
        item={this.props.item}
        type={this.props.type}
        lang={this.props.lang}
        widgetsettings={this.props.widgetsettings}
        actionGenerated={this.actionHandler} />
      );
    }

    let emojiViewer = null;
    if (this.state.emojiViewer) {
      emojiViewer = (
        <CometChatEmojiKeyboard lang={this.props.lang} emojiClicked={this.emojiClicked} />
      );
    }

    return (
      <div css={chatComposerStyle(this.props)} className="chat__composer">
        {editPreview}
        {smartReplyPreview}
        {stickerViewer}
        {emojiViewer}
        <div css={composerInputStyle()} className="composer__input">
          <div tabIndex="-1" css={inputInnerStyle(this.props, this.state)} className="input__inner">
            <div
            css={messageInputStyle(disabledState)}
            className="input__message-input"
            contentEditable="true"
            placeholder={Translator.translate("ENTER_YOUR_MESSAGE_HERE", this.props.lang)}
            dir={Translator.getDirection(this.props.lang)}
            onInput={this.changeHandler}
            onBlur={event => this.endTyping(event)}
            onKeyDown={this.sendMessageOnEnter}
            ref={this.messageInputRef}></div>
            <div css={inputStickyStyle(this.props, disabledState)} className="input__sticky">
              {attach}
              <div css={stickyButtonStyle(this.props, this.state)} className="input__sticky__buttons">
                {stickerBtn}
                {emojiBtn}
                {sendBtn}
                {liveReactionBtn}
              </div>
            </div>
          </div>
        </div>
        {createPoll}
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatMessageComposer.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatMessageComposer.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatMessageComposer;
