import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat"

import roundedPlus from "./resources/rounded-plus-grey-icon.svg";
import sendBlue from "./resources/send-blue-icon.svg";
import imageUpload from "./resources/image-blue.svg";
import audioUpload from "./resources/audio-blue.svg";
import videoUpload from "./resources/video-blue.svg";
import fileUpload from "./resources/file-blue.svg";

class MessageComposer extends React.PureComponent {

constructor(props) {
	super(props);
		this.imageUploaderRef = React.createRef();
		this.fileUploaderRef = React.createRef();
		this.audioUploaderRef = React.createRef();
		this.videoUploaderRef = React.createRef();
	}

  state = {
    showMediaComposer: false,
    messageTxt: ""
  }
  
  changeHandler = (e) => {
    this.setState({messageTxt: e.target.value});
  }

  browseMediaMessage = () => {
    const currentState = !this.state.showMediaComposer;
    this.setState({ showMediaComposer: currentState });
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
    this.sendMediaMessage(e, messageType);
  }

  onFileChange = (e, messageType) => {
    this.sendMediaMessage(e, messageType)   
  }

  onAudioChange = (e, messageType) => {
    this.sendMediaMessage(e, messageType)   
  }

  onVideoChange = (e, messageType) => {
    this.sendMediaMessage(e, messageType)   
  }

  sendMediaMessage = (e,messageType) => {

    if(!e.target.files[0])
      return false;

    this.browseMediaMessage();

    let receiverID = this.props.item.guid;
    let receiverType = "group";

    if (this.props.type === "user") {
      receiverID = this.props.item.uid;
      receiverType = "user";
    } 

    let textMessage = new CometChat.MediaMessage(receiverID, e.target.files[0], messageType, receiverType);
    CometChat.sendMessage(textMessage).then(
      message => {
        
        this.props.actionGenerated("messageComposed", [message])
      },
      error => {
        console.log("Message sending failed with error:", error);
      }
    );
  }

  sendMessageOnEnter = (e) => {

    if(e.key !== 'Enter')
      return false;

    this.sendTextMessage();
  }

  sendTextMessage = () => {

    if(!this.state.messageTxt.trim().length) {
      return false;
    }

    let receiverID = this.props.item.guid;
    if (this.props.type === "user") {
      receiverID = this.props.item.uid;
    }

    let receiverType = this.props.type;
    let messageText = this.state.messageTxt.trim();
    let textMessage = new CometChat.TextMessage(receiverID, messageText, receiverType);
    CometChat.sendMessage(textMessage).then(
      message => {
        this.setState({messageTxt: ""})
        this.props.actionGenerated("messageComposed", [message]);
      },
      error => {
        console.log("Message sending failed with error:", error);
      }
    );
  }

  render() {

    let disabled = false;
    if(this.props.item.blockedByMe) {
      disabled = true;
    }

    return (
      <div className="cp-message-composer">
        <div className="cp-media-button">
          <button onClick={this.browseMediaMessage} ><img src={roundedPlus} alt="media" /></button>
        </div>
        <div className={this.state.showMediaComposer ? 'cp-show-media' : 'cp-hide-media'}>
          <button onClick={() => { this.openFileDialogue("image") }} data-toggle="tooltip" title="Image">
            <input onChange={(e) => this.onImageChange(e, "image")} accept="image/*" type="file" id="image" ref={this.imageUploaderRef} style={{ display: "none" }} />
            <img src={imageUpload} alt="media"></img>
            <p>Image</p>
          </button>
          <button onClick={() => { this.openFileDialogue("file") }} data-toggle="tooltip" title="File">
            <input onChange={(e) => this.onFileChange(e, "file")} type="file" id="file" ref={this.fileUploaderRef} style={{ display: "none" }} />
            <img src={fileUpload} alt="media"></img>
            <p>File</p>
          </button>
          <button onClick={() => { this.openFileDialogue("audio") }} data-toggle="tooltip" title="Audio"  >
            <input onChange={(e) => this.onAudioChange(e, "audio")} accept="audio/*" type="file" id="image" ref={this.audioUploaderRef} style={{ display: "none" }} />
            <img src={audioUpload} alt="media"></img>
            <p>Audio</p>
          </button>
          <button onClick={() => { this.openFileDialogue("video") }} data-toggle="tooltip" title="Video" >
            <input onChange={(e) => this.onVideoChange(e, "video")} accept="video/*" type="file" id="image" ref={this.videoUploaderRef} style={{ display: "none" }} />
            <img src={videoUpload} alt="media"></img>
            <p>Video</p>
          </button>
        </div>
        <input type="text" 
        disabled={disabled}
        placeholder="Messages" 
        onChange={this.changeHandler} 
        onKeyDown={this.sendMessageOnEnter} 
        value={this.state.messageTxt} />
        <div className="cp-send-button">
          <button onClick={this.sendTextMessage}><img src={sendBlue} alt="media" /></button>
        </div>
      </div>
    );
  }
}

export default MessageComposer;
