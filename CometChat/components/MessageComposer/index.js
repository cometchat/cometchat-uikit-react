import React from "react";
import "./style.scss";
import roundedPlus from "./resources/rounded-plus-grey-icon.svg";
import sendBlue from "./resources/send-blue-icon.svg";
import imageUpload from "./resources/image-blue.svg";
import audioUpload from "./resources/audio-blue.svg";
import videoUpload from "./resources/video-blue.svg";
import fileUpload from "./resources/file-blue.svg";
import { CometChat } from "@cometchat-pro/chat"


class MessageComposer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      conversation: {},
      showMediaComposer: false,
      fileList: []
    }


  }
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  handleSendMessageOnEnter = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      var receiverID;
      if (this.state.type === "user") {
        receiverID = this.state.item.uid;
      } else {
        receiverID = this.state.item.guid;
      }
      var messageText = e.target.value;
      var receiverType = this.state.type;
      var textMessage = new CometChat.TextMessage(
        receiverID,
        messageText,
        receiverType
      );

      CometChat.sendMessage(textMessage).then(
        message => {
          document.getElementById("messageInput").value = '';
          if (this.state.onMessageSent) {
            this.state.onMessageSent(message);
          }
        },
        error => {
          console.log("Message sending failed with error:", error);
        }
      );
    }

  }
  onImageChange = (e, messageType) => {
    this.sendMediaMessage(e,messageType) 
  }
  onFileChange = (e, messageType) => {
    this.sendMediaMessage(e,messageType)   
    
  }
  onAudioChange = (e, messageType) => {
    this.sendMediaMessage(e,messageType)   
    
  }
  onVideoChange = (e, messageType) => {
    this.sendMediaMessage(e,messageType)   
    
  }
  sendMediaMessage=(e,messageType)=>{
    if (e.target.files[0]) {
      var receiverID;
      var receiverType;
      if (this.state.type === "user") {
        receiverID = this.state.item.uid;
        receiverType="user";
      } else {
        receiverID = this.state.item.guid;
        receiverType="group";
      }
      var textMessage = new CometChat.MediaMessage(
        receiverID,
        e.target.files[0],
        messageType,
        receiverType
      );

      CometChat.sendMessage(textMessage).then(
        message => {
          if (this.state.onMessageSent) {
            this.state.onMessageSent(message);
          }
          this.setState({ fileList: [] })
        },
        error => {
          console.log("Message sending failed with error:", error);
        }
      );
    }
  }
  openFileDialouge = (fileType) => {
    switch (fileType) {
      case "image":
        this.refs.imageUploader.click();
        break;
        case "file":
          this.refs.fileUploader.click();
        break;
        case "audio":
          this.refs.audioUploader.click();
        break;
        case "video":
          this.refs.videoUploader.click();
        break;
    
      default:
        break;
    }
  }
  browseMediaMessage = () => {
    const currentState = this.state.showMediaComposer;
    this.setState({ showMediaComposer: !currentState });
  }
  handleSendMessage = () => {
    let message = document.getElementById("messageInput").value
    document.getElementById("messageInput").value = '';
    if (message) {
      var receiverID;
      if (this.state.type === "user") {
        receiverID = this.state.item.uid;
      } else {
        receiverID = this.state.item.guid;
      }
      var messageText = message;
      var receiverType = this.state.type;
      var textMessage = new CometChat.TextMessage(
        receiverID,
        messageText,
        receiverType
      );

      CometChat.sendMessage(textMessage).then(
        message => {
          if (this.state.onMessageSent) {
            this.state.onMessageSent(message);
          }

        },
        error => {
          console.log("Message sending failed with error:", error);
        }
      );
    }

  }
  render() {
    return (
      <div className="cp-message-composer" >
        <div className="cp-media-button ">
          <button onClick={this.browseMediaMessage} ><img src={roundedPlus} alt="media" /></button>
        </div>
        <div className={this.state.showMediaComposer ? 'cp-show-media' : 'cp-hide-media'}>
          <button onClick={() => { this.openFileDialouge("image") }} data-toggle="tooltip" title="Image">
          <input onChange={(e) => this.onImageChange(e, "image")} accept="image/*" type="file" id="image" ref="imageUploader" style={{ display: "none" }} />
          <img src={imageUpload} alt="media"></img>
          <p>Image</p>
          </button>
          <button onClick={() => { this.openFileDialouge("file") }} data-toggle="tooltip" title="File">
            <input onChange={(e) => this.onFileChange(e, "file")} type="file" id="file" ref="fileUploader" style={{ display: "none" }} />
            <img src={fileUpload} alt="media"></img>
            <p>File</p>
            </button>

          <button onClick={() => { this.openFileDialouge("audio") }} data-toggle="tooltip" title="Audio"  >
          <input onChange={(e) => this.onAudioChange(e, "audio")} accept="audio/*" type="file" id="image" ref="audioUploader" style={{ display: "none" }} />
           <img src={audioUpload} alt="media"></img>
           <p>Audio</p>
          </button>
          <button onClick={() => { this.openFileDialouge("video") }} data-toggle="tooltip" title="Video" >
          <input onChange={(e) => this.onVideoChange(e, "video")} accept="video/*" type="file" id="image" ref="videoUploader" style={{ display: "none" }} />
          <img src={videoUpload} alt="media"></img>
          <p>Video</p>
          </button>
        </div>
        <input type="text" placeholder="Messages" id="messageInput" onKeyDown={this.handleSendMessageOnEnter}></input>
        <div className="cp-send-button ">
          <button onClick={this.handleSendMessage}><img src={sendBlue} alt="media" /></button></div>

      </div>
    );
  }
}



export default MessageComposer;
export const messageComposer=MessageComposer;

MessageComposer.defaultProps = {

};
