import React from "react";
import classNames from "classnames";
import { Picker } from "emoji-mart";

import "emoji-mart/css/emoji-mart.css";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat"

import roundedPlus from "./resources/rounded-plus-grey-icon.svg";
import insertEmoticon from "./resources/insert_emoticon.svg"
import sendBlue from "./resources/send-blue-icon.svg";

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
    emojiViewer: false
  }

  pasteHtmlAtCaret(html, selectPastedContent) {
    var sel, range;
    if (window.getSelection) {
      // IE9 and non-IE
      sel = window.getSelection();
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

  onImageChange = (e, messageType) => {

    if(!e.target.files[0]) {
      return false;
    }
    
    const imageInput = e.target.files[0];
    this.sendMediaMessage(imageInput, messageType)   
  }

  onFileChange = (e, messageType) => {

    if(!e.target.files[0]) {
      return false;
    }

    const fileInput = e.target.files[0];
    this.sendMediaMessage(fileInput, messageType)   
  }

  onAudioChange = (e, messageType) => {

    if(!e.target.files[0]) {
      return false;
    }

    const audioInput = e.target.files[0];
    this.sendMediaMessage(audioInput, messageType)   
  }

  onVideoChange = (e, messageType) => {

    if(!e.target.files[0]) {
      return false;
    }

    const videoInput = e.target.files[0];
    this.sendMediaMessage(videoInput, messageType)   
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

    CometChat.sendMessage(message).then(message => {
      this.messageSending = false;
      this.props.actionGenerated("messageComposed", [message])
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

    const filePickerClassName = classNames({
      "cc1-chat-win-file-popup": true,
      "active": (this.state.showFilePicker)
    });

    const inputClassName= classNames({
      "cc1-chat-win-inpt-box": true,
      "selectable-text": true,
      "disabled": disabled
    })

    return (

      <div className="cc1-chat-win-inpt-ext-wrap">
        <div className="cc1-chat-win-inpt-int-wrap">
          <div tabIndex="-1" className="cc1-chat-win-inpt-wrap">
              <div
              className={inputClassName}
              contentEditable="true"
              placeholder="Enter your message here"
               dir="ltr"
              onInput={this.changeHandler}
              onKeyDown={this.sendMessageOnEnter}
              ref={this.messageInputRef}></div>
              <div className="cc1-chat-win-inpt-box-sticky">
                <div className="cc1-chat-win-inpt-attach-wrap">
                  <div className="cc1-chat-win-inpt-attach" onClick={this.toggleFilePicker}>
                    <span><img src={roundedPlus} alt="Click to upload a file" /></span>
                  </div>
                  <div className={filePickerClassName}>
                    <div className="cc1-chat-win-file-type-list">
                      <span className="cc1-chat-win-file-type-listitem video" onClick={() => { this.openFileDialogue("video") }}>
                      <input onChange={(e) => this.onVideoChange(e, "video")} accept="video/*" type="file" ref={this.videoUploaderRef} />
                      </span>
                      <span className="cc1-chat-win-file-type-listitem audio" onClick={() => { this.openFileDialogue("audio") }}>
                      <input onChange={(e) => this.onAudioChange(e, "audio")} accept="audio/*" type="file" ref={this.audioUploaderRef} />
                      </span>
                      <span className="cc1-chat-win-file-type-listitem image" onClick={() => { this.openFileDialogue("image") }}>
                        <input onChange={(e) => this.onImageChange(e, "image")} accept="image/*" type="file" ref={this.imageUploaderRef} />
                      </span>
                      <span className="cc1-chat-win-file-type-listitem file" onClick={() => { this.openFileDialogue("file") }}>
                      <input onChange={(e) => this.onFileChange(e, "file")} type="file" id="file" ref={this.fileUploaderRef} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="cc1-chat-win-inpt-icon-wrap" ref={node => {this.node = node;}}>
                    {emojiPicker}
                    <div 
                    className="cc1-chat-win-inpt-insert-emoji"
                    onClick={this.toggleEmojiPicker}><img src={insertEmoticon} alt="Insert Emoticon" /></div>
                    <div className="cc1-chat-win-inpt-send-btn" onClick={this.sendTextMessage}><img src={sendBlue} alt="Send Message" /></div>
                </div>
              </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MessageComposer;