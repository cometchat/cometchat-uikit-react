import React from "react";

/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";

import { Picker } from "emoji-mart";
import { CometChat } from "@cometchat-pro/chat";

import "emoji-mart/css/emoji-mart.css";

import ReplyPreview from "../ReplyPreview";
import CometChatCreatePoll from "../CometChatCreatePoll";
import StickerView from "../StickerView";

import { validateWidgetSettings } from "../../util/common";
import * as enums from '../../util/enums.js';

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
  attachmentIconStyle,
  filePickerStyle,
  fileListStyle,
  fileItemStyle,
  stickyButtonStyle,
  emojiButtonStyle,
  sendButtonStyle,
  reactionBtnStyle,
  stickerBtnStyle
} from "./style";

import roundedPlus from "./resources/rounded-plus-grey-icon.svg";
import videoIcon from "./resources/video_upload_icon.svg";
import audioIcon from "./resources/audio_upload_icon.svg";
import docIcon from "./resources/document_upload_icon.svg";
import imageIcon from "./resources/images_upload_icon.svg";
import insertEmoticon from "./resources/smiley.png"
import sendBlue from "./resources/send-blue-icon.svg";
import pollIcon from "./resources/poll.png";
import stickerIcon from "./resources/sticker.png"
import closeIcon from "./resources/clear.png";

import { outgoingMessageAlert } from "../../resources/audio/";


class MessageComposer extends React.PureComponent {

  constructor(props) {

    super(props);
  
		this.imageUploaderRef = React.createRef();
		this.fileUploaderRef = React.createRef();
		this.audioUploaderRef = React.createRef();
    this.videoUploaderRef = React.createRef();
    this.messageInputRef = React.createRef();
    this.messageSending = false;

    this.node = React.createRef();
    this.isTyping = false;

    this.state = {
      showFilePicker: false,
      messageInput: "",
      messageType: "",
      emojiViewer: false,
      createPoll: false,
      messageToBeEdited: "",
      replyPreview: null,
      stickerViewer: false
    }

    this.audio = new Audio(outgoingMessageAlert);
	}

  componentDidUpdate(prevProps) {

    if (prevProps.messageToBeEdited !== this.props.messageToBeEdited) {

      const messageToBeEdited = this.props.messageToBeEdited;

      this.setState({ "messageInput": messageToBeEdited, "messageToBeEdited": messageToBeEdited });
      
      const element = this.messageInputRef.current;
      if (messageToBeEdited) {

        element.focus();
        this.pasteHtmlAtCaret(messageToBeEdited.text, false);

      } else {
        element.textContent = "";
      }
    }

    if (prevProps.replyPreview !== this.props.replyPreview) {

      //const message = this.props.replyPreview;
      this.setState({ replyPreview: this.props.replyPreview });  
    }

    if (prevProps.item !== this.props.item) {

      //const message = this.props.replyPreview;
      this.setState({ stickerViewer: false });
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
        el.innerHTML = html;
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
    reader.addEventListener("load", () => { // Setting up base64 URL on image

      const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
      this.sendMediaMessage(newFile, "image");

    }, false);

    reader.readAsArrayBuffer(uploadedFile)  
  }

  onFileChange = (e) => {

    if (!this.fileUploaderRef.current.files["0"]) {
      return false;
    }

    const uploadedFile = this.fileUploaderRef.current.files["0"];

    var reader = new FileReader(); // Creating reader instance from FileReader() API
    reader.addEventListener("load", () => { // Setting up base64 URL on image

      const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
      this.sendMediaMessage(newFile, "file");

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
      this.sendMediaMessage(newFile, "audio");

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
      this.sendMediaMessage(newFile, "video");

    }, false);

    reader.readAsArrayBuffer(uploadedFile);  
  }

  getReceiverDetails = () => {

    let receiverId;
    let receiverType;

    if (this.props.type === "user") {

      receiverId = this.props.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;

    } else if (this.props.type === "group") {

      receiverId = this.props.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    return { "receiverId": receiverId, "receiverType": receiverType };
  }

  sendMediaMessage = (messageInput, messageType) => {

    this.toggleFilePicker();

    if(this.messageSending) {
      return false;
    }

    this.messageSending = true;

    const { receiverId, receiverType } = this.getReceiverDetails();

    let mediaMessage = new CometChat.MediaMessage(receiverId, messageInput, messageType, receiverType);
    if(this.props.parentMessageId) {
      mediaMessage.setParentMessageId(this.props.parentMessageId);
    }

    this.endTyping();
    console.log("sendMediaMessage mediaMessage", mediaMessage);
    CometChat.sendMessage(mediaMessage).then(response => {

      console.log("sendMediaMessage response", response);
      this.messageSending = false;
      this.playAudio();
      this.props.actionGenerated("messageComposed", [response]);

    }).catch(error => {

      this.messageSending = false;
      console.log("Message sending failed with error:", error);
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
      this.setState({emojiViewer: false});
    }

    if(!this.state.messageInput.trim().length) {
      return false;
    }

    if(this.messageSending) {
      return false;
    }

    this.messageSending = true;

    if (this.state.messageToBeEdited) {
      this.editMessage();
      return false;
    }
    
    let { receiverId, receiverType } = this.getReceiverDetails();
    let messageInput = this.state.messageInput.trim();
    let textMessage = new CometChat.TextMessage(receiverId, messageInput, receiverType);
    if(this.props.parentMessageId) {
      textMessage.setParentMessageId(this.props.parentMessageId);
    }

    this.endTyping();
    
    CometChat.sendMessage(textMessage).then(message => {

      this.setState({messageInput: ""});
      this.messageSending = false;
      this.messageInputRef.current.textContent = "";
      this.playAudio();
      this.props.actionGenerated("messageComposed", [message]);

    }).catch(error => {

      console.log("Message sending failed with error:", error);
      this.messageSending = false;
    });
  }

  editMessage = () => {

    const messageToBeEdited = this.props.messageToBeEdited;

    let { receiverId, receiverType } = this.getReceiverDetails();
    
    let messageText = this.state.messageInput.trim();
    let textMessage = new CometChat.TextMessage(receiverId, messageText, receiverType);
    textMessage.setId(messageToBeEdited.id);

    this.endTyping();

    CometChat.editMessage(textMessage).then(message => {
      
      this.setState({ messageInput: "" });
      this.messageSending = false;
      this.messageInputRef.current.textContent = "";
      this.playAudio();
      

      this.closeEditPreview();
      
      this.props.actionGenerated("messageEdited", message);

    }).catch(error => {

      this.messageSending = false;
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

      this.endTyping();
      
    }, typingInterval);
  }

  endTyping = (metadata) => {

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
    this.setState({ stickerViewer: !stickerViewer })
  }

  toggleEmojiPicker = () => {

    if (!this.state.emojiViewer) {
      // attach/remove event handler
      document.addEventListener('click', this.handleOutsideClick, false);
    } else {
      document.removeEventListener('click', this.handleOutsideClick, false);
    }

    const emojiViewer = this.state.emojiViewer;
    this.setState({emojiViewer: !emojiViewer})
  }
  
  handleOutsideClick = (event) => {
    // ignore clicks on the component itself
    
    if (this.node && this.node.contains(event.target)) {
      return;
    }
    
    this.toggleEmojiPicker();
  }

  toggleCreatePoll = () => {

    const createPoll = this.state.createPoll;
    this.setState({ createPoll: !createPoll });
  }

  closeCreatePoll = () => {

    this.toggleCreatePoll();
    this.toggleFilePicker();
  }

  actionHandler = (action, message) => {

    switch(action) {
      
      case "pollCreated":
        this.toggleCreatePoll();
        this.toggleFilePicker();

        //temporary check; custom data listener working for sender too
        if (this.props.type === "user") {
          this.props.actionGenerated("pollCreated", [message]);
        }
        
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

    this.messageSending = true;

    const { receiverId, receiverType } = this.getReceiverDetails();

    const customData = { "sticker_url": stickerMessage.stickerUrl, "sticker_name": stickerMessage.stickerName };
    const customType = enums.CUSTOM_TYPE_STICKER;

    const customMessage = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);
    CometChat.sendCustomMessage(customMessage).then(message => {

      this.messageSending = false;
      this.playAudio();
      this.props.actionGenerated("messageComposed", [message]);

    }).catch(error => {

      this.messageSending = false;
      console.log("custom message sending failed with error", error);

    });

  }

  sendReplyMessage = (messageInput) => {

    let { receiverId, receiverType } = this.getReceiverDetails();
    let textMessage = new CometChat.TextMessage(receiverId, messageInput, receiverType);
    if (this.props.parentMessageId) {
      textMessage.setParentMessageId(this.props.parentMessageId);
    }

    CometChat.sendMessage(textMessage).then(message => {

      this.playAudio();
      this.setState({ replyPreview: null })
      this.props.actionGenerated("messageComposed", [message]);

    }).catch(error => {

      console.log("Message sending failed with error:", error);
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

      this.endTyping(typingMetadata);
      this.props.actionGenerated("stopReaction");

    }, typingInterval);
  }

  render() {

    let liveReactionBtn = null;
    if (enums.LIVE_REACTIONS.hasOwnProperty(this.props.reaction)) {

      const reactionName = this.props.reaction;
      const imgSrc = enums.LIVE_REACTIONS[reactionName];
      liveReactionBtn = (
        <div css={reactionBtnStyle(imgSrc)} className="button__reactions" onClick={this.sendReaction}>
          <img src={require(`${imgSrc}`)} alt={reactionName} />
        </div>
      );
    }

    let emojiPicker = null;
    if(this.state.emojiViewer) {
      emojiPicker = (
        <Picker 
        title="Pick your emoji" 
        emoji="point_up"
        native
        onClick={this.emojiClicked}
        style={{position: "absolute", bottom: "20px", right: "50px", "zIndex": "2", "width": "280px"}} />
      );
    }
     
    let disabled = false;
    if(this.props.item.blockedByMe) {
      disabled = true;
    }

    let docs = (
      <span title="Attach File" css={fileItemStyle(this.props, docIcon)} className="filelist__item item__file" onClick={() => { this.openFileDialogue("file") }}>
        <input onChange={this.onFileChange} type="file" id="file" ref={this.fileUploaderRef} />
      </span>
    );

    let avp = (
      <React.Fragment>
        <span title="Attach Video" css={fileItemStyle(this.props, videoIcon)} className="filelist__item item__video" onClick={() => { this.openFileDialogue("video") }}>
          <input onChange={this.onVideoChange} accept="video/*" type="file" ref={this.videoUploaderRef} />
        </span>
        <span title="Attach Audio" css={fileItemStyle(this.props, audioIcon)} className="filelist__item item__audio" onClick={() => { this.openFileDialogue("audio") }}>
          <input onChange={this.onAudioChange} accept="audio/*" type="file" ref={this.audioUploaderRef} />
        </span>
        <span title="Attach Image" css={fileItemStyle(this.props, imageIcon)} className="filelist__item item__image" onClick={() => { this.openFileDialogue("image") }}>
          <input onChange={this.onImageChange} accept="image/*" type="file" ref={this.imageUploaderRef} />
        </span>
      </React.Fragment>
    );

    let createPollBtn = (
      <span
      title="Create Poll"
      css={fileItemStyle(this.props, pollIcon)}
      className="filelist__item item__poll"
      onClick={this.toggleCreatePoll}>&nbsp;</span>
    );

    let emojiBtn = (
      <div 
      title="Emoji"
      css={emojiButtonStyle()}
      className="button__emoji" 
      onClick={this.toggleEmojiPicker}><img src={insertEmoticon} alt="Insert Emoticon" /></div>
    );

    let stickerBtn = (
      <div
      title="Attach sticker"
      css={stickerBtnStyle()}
      className="filelist__item item__sticker"
      onClick={this.toggleStickerPicker}><img src={stickerIcon} alt="Add Sticker" /></div>
    );

    let sendBtn = (
      <div title="Send Message" css={sendButtonStyle()} className="button__send" onClick={this.sendTextMessage}>
        <img src={sendBlue} alt="Send Message" />
      </div>
    );

    if (!this.state.messageInput.length) {
      sendBtn = null;
    }

    //if photos, videos upload are disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "send_photos_videos") === false) {
      avp = null;
    }

    //if files upload are disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "send_files") === false) {
      docs = null;
    }

    //if emojis are disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "send_emojis") === false) {
      emojiBtn = null;
    }

    //if polls are disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "allow_creating_polls") === false) {
      createPollBtn = null;
    }

    //if live reactions is disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "share_live_reactions") === false
    || this.state.messageInput.length) {
      liveReactionBtn = null;
    }

    //if stickers is disabled for chat wigdet in dashboard
    if (validateWidgetSettings(this.props.widgetsettings, "show_stickers") === false) {
      stickerBtn = null;
    }

    if (this.props.parentMessageId) {
      createPollBtn = null;
    }

    let attach = (
      <div css={stickyAttachmentStyle()} className="input__sticky__attachment">
        <div css={attachmentIconStyle(roundedPlus)} className="attachment__icon" onClick={this.toggleFilePicker}>
          <span>&nbsp;</span>
        </div>
        <div css={filePickerStyle(this.state)} className="attachment__filepicker">
          <div css={fileListStyle()} className="filepicker__filelist">
            {avp}
            {docs}
            {createPollBtn}
          </div>
        </div>
      </div>
    );

    if (avp === null && docs === null && createPollBtn === null) {
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
        widgetsettings={this.props.widgetsettings}
        actionGenerated={this.actionHandler} />
      );
    }

    let editPreview = null;
    if (this.state.messageToBeEdited) {
      editPreview = (
        <div css={editPreviewContainerStyle(this.props, keyframes)}>
          <div css={previewHeadingStyle()}>
            <div css={previewTextStyle()}>Edit message</div>
            <span css={previewCloseStyle(closeIcon)} onClick={this.closeEditPreview}></span>
          </div>
          <div>{this.state.messageToBeEdited.text}</div>
        </div>
      );
    }

    let smartReplyPreview = null;
    if(this.state.replyPreview) {

      const message = this.state.replyPreview;
      if (message.hasOwnProperty("metadata")) {

        const metadata = message.metadata;
        if (metadata.hasOwnProperty("@injected")) {

          const injectedObject = metadata["@injected"];
          if (injectedObject.hasOwnProperty("extensions")) {

            const extensionsObject = injectedObject["extensions"];
            if (extensionsObject.hasOwnProperty("smart-reply")) {
              
              const smartReplyObject = extensionsObject["smart-reply"];

              const options = [smartReplyObject["reply_positive"], smartReplyObject["reply_neutral"], smartReplyObject["reply_negative"]];
              
              smartReplyPreview = (
                <ReplyPreview {...this.props} options={options} clicked={this.sendReplyMessage} close={this.clearReplyPreview} />
              );

            }
          }
        }
      }
    }

    let stickerViewer = null;
    if (this.state.stickerViewer) {
      stickerViewer = (
        <StickerView 
        theme={this.props.theme}
        item={this.props.item}
        type={this.props.type}
        widgetsettings={this.props.widgetsettings}
        actionGenerated={this.actionHandler} />
      );
    }

    return (
      <div css={chatComposerStyle(this.props)} className="chat__composer">
        {editPreview}
        {smartReplyPreview}
        {stickerViewer}
        <div css={composerInputStyle()} className="composer__input">
          <div tabIndex="-1" css={inputInnerStyle(this.props)} className="input__inner">
            <div
            css={messageInputStyle(disabled)}
            className="input__message-input"
            contentEditable="true"
            placeholder="Enter your message here"
            dir="ltr"
            onInput={this.changeHandler}
            onBlur={this.endTyping}
            onKeyDown={this.sendMessageOnEnter}
            ref={this.messageInputRef}></div>
            <div css={inputStickyStyle(this.props)} className="input__sticky">
              {attach}
              <div css={stickyButtonStyle()} className="input__sticky__buttons" ref={node => {this.node = node;}}>
                {stickerBtn}
                {emojiPicker}
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

export default MessageComposer;