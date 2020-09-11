import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { Picker } from "emoji-mart";

import { CometChat } from "@cometchat-pro/chat"

import "emoji-mart/css/emoji-mart.css";

import {
  chatComposerStyle,
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
  sendButtonStyle
} from "./style";

import roundedPlus from "./resources/rounded-plus-grey-icon.svg";
import videoIcon from "./resources/video_upload_icon.svg";
import audioIcon from "./resources/audio_upload_icon.svg";
import docIcon from "./resources/document_upload_icon.svg";
import imageIcon from "./resources/images_upload_icon.svg";
import insertEmoticon from "./resources/insert_emoticon.svg"
import sendBlue from "./resources/send-blue-icon.svg";
import pollIcon from "./resources/poll.png";

import CometChatCreatePoll from "../CometChatCreatePoll";

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
	}

  state = {
    showFilePicker: false,
    messageInput: "",
    messageType: "",
    emojiViewer: false,
    createPoll: false
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

    const elem = event.currentTarget;
    let messageInput = elem.textContent.trim();
    
    if(!messageInput.length) {
      event.currentTarget.textContent = messageInput;
      return false;
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
    console.log("uploadedFile", uploadedFile);

    var reader = new FileReader(); // Creating reader instance from FileReader() API
    reader.addEventListener("load", () => { // Setting up base64 URL on image

      const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
      this.sendMediaMessage(newFile, "image")

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
      this.sendMediaMessage(newFile, "file")

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
      this.sendMediaMessage(newFile, "audio")

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
      this.sendMediaMessage(newFile, "video")

    }, false);

    reader.readAsArrayBuffer(uploadedFile);  
  }

  sendMediaMessage = (messageInput, messageType) => {

    this.toggleFilePicker();

    if(this.messageSending) {
      return false;
    }

    this.messageSending = true;

    let receiverId;
    let receiverType = this.props.type;
    if (this.props.type === "user") {
      receiverId = this.props.item.uid;
    } else if (this.props.type === "group") {
      receiverId = this.props.item.guid;
    }

    let message = new CometChat.MediaMessage(receiverId, messageInput, messageType, receiverType);
    
    if(this.props.parentMessageId) {
      message.setParentMessageId(this.props.parentMessageId);
    }

    CometChat.sendMessage(message).then(response => {
      this.messageSending = false;
      this.props.actionGenerated("messageComposed", [response])
    }).catch(error => {
      console.log("Message sending failed with error:", error);
      this.messageSending = false;
    });
  }

  sendMessageOnEnter = (event) => {

    if(event.keyCode === 13 && !event.shiftKey) {

      event.preventDefault();
      this.messageInputRef.current.textContent = "";
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
    let messageInput = this.state.messageInput.trim();
    
    let receiverId;
    let receiverType = this.props.type;
    if (this.props.type === "user") {
      receiverId = this.props.item.uid;
    } else if (this.props.type === "group") {
      receiverId = this.props.item.guid;
    }

    let textMessage = new CometChat.TextMessage(receiverId, messageInput, receiverType);
    if(this.props.parentMessageId) {
      textMessage.setParentMessageId(this.props.parentMessageId);
    }
    
    CometChat.sendMessage(textMessage).then(message => {
      this.setState({messageInput: ""});
      this.messageSending = false;
      this.messageInputRef.current.textContent = "";
      this.props.actionGenerated("messageComposed", [message]);
    }).catch(error => {
      console.log("Message sending failed with error:", error);
      this.messageSending = false;
    });
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
      default:
      break;
    }
  }

  render() {

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
      <span title="Attach File" css={fileItemStyle(this.props, docIcon)} onClick={() => { this.openFileDialogue("file") }}>
        <input onChange={this.onFileChange} type="file" id="file" ref={this.fileUploaderRef} />
      </span>
    );

    let avp = (
      <React.Fragment>
        <span title="Attach Video" css={fileItemStyle(this.props, videoIcon)} onClick={() => { this.openFileDialogue("video") }}>
          <input onChange={this.onVideoChange} accept="video/*" type="file" ref={this.videoUploaderRef} />
        </span>
        <span title="Attach Audio" css={fileItemStyle(this.props, audioIcon)} onClick={() => { this.openFileDialogue("audio") }}>
          <input onChange={this.onAudioChange} accept="audio/*" type="file" ref={this.audioUploaderRef} />
        </span>
        <span title="Attach Image" css={fileItemStyle(this.props, imageIcon)} onClick={() => { this.openFileDialogue("image") }}>
          <input onChange={this.onImageChange} accept="image/*" type="file" ref={this.imageUploaderRef} />
        </span>
      </React.Fragment>
    );

    let createPollBtn = (
      <span
      title="Create Poll"
      css={fileItemStyle(this.props, pollIcon)}
      onClick={this.toggleCreatePoll}>&nbsp;</span>
    );

    let emojiBtn = (
      <div 
      title="Emoji"
      css={emojiButtonStyle()} 
      onClick={this.toggleEmojiPicker}><img src={insertEmoticon} alt="Insert Emoticon" /></div>
    );

    if(this.props.hasOwnProperty("widgetsettings") 
    && this.props.widgetsettings
    && this.props.widgetsettings.hasOwnProperty("main")) {

      if(this.props.widgetsettings.main.hasOwnProperty("send_photos_videos")
      && this.props.widgetsettings.main["send_photos_videos"] === false) {
        avp = null;
      }

      if(this.props.widgetsettings.main.hasOwnProperty("send_photos_videos")
      && this.props.widgetsettings.main["send_files"] === false) {
        docs = null;
      }

      if(this.props.widgetsettings.main.hasOwnProperty("send_emojis")
      && this.props.widgetsettings.main["send_emojis"] === false) {
        emojiBtn = null;
      }

      if ((this.props.widgetsettings.main.hasOwnProperty("allow_creating_polls") === false)
        || (this.props.widgetsettings.main.hasOwnProperty("allow_creating_polls") 
        && this.props.widgetsettings.main["allow_creating_polls"] === false)) {
        createPollBtn = null;
      }
    }

    let attach = (
      <div css={stickyAttachmentStyle()}>
        <div css={attachmentIconStyle(roundedPlus)} onClick={this.toggleFilePicker}>
          <span>&nbsp;</span>
        </div>
        <div css={filePickerStyle(this.state)}>
          <div css={fileListStyle()}>
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

    return (
      <div css={chatComposerStyle(this.props)}>
        <div css={composerInputStyle()}>
          <div tabIndex="-1" css={inputInnerStyle(this.props)}>
            <div
            css={messageInputStyle(disabled)}
            contentEditable="true"
            placeholder="Enter your message here"
            dir="ltr"
            onInput={this.changeHandler}
            onKeyDown={this.sendMessageOnEnter}
            ref={this.messageInputRef}></div>
            <div css={inputStickyStyle(this.props)}>
              {attach}
              <div css={stickyButtonStyle()} ref={node => {this.node = node;}}>
                {emojiPicker}
                {emojiBtn}
                <div title="Send Message" css={sendButtonStyle()} onClick={this.sendTextMessage}><img src={sendBlue} alt="Send Message" /></div>
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