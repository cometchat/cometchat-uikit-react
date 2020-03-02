import React from "react";
import "./style.scss";
import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";
import blueFile from "./resources/file-blue.svg";



class SenderFileBubble extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }

  }
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  displayTicks=(message)=>{
    if(message.sentAt && !message.readAt && !message.deliveredAt){
      return greyTick;
    }else if(message.sentAt && !message.readAt && message.deliveredAt){
      return greyDoubleTick
    }else{
      return blueDoubleTick
    }
    
  }
  render() {
    return (

      <div className=" cp-sender-file-container" >
      <div className=" cp-sender-file" >
        <div>
        <a href={this.state.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{this.state.message.data.attachments[0].name} <img src={blueFile} alt="file"/></a>
        </div>
        <p>{this.state.message.data.attachments[0].extension}</p>
     
            </div>
            <div className="cp-time text-muted"> {new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}<span><img src={this.displayTicks(this.state.message)} alt="time"></img></span></div>
      </div>
     
    );
  }
}



export default SenderFileBubble;
export const senderFileBubble=SenderFileBubble;
SenderFileBubble.defaultProps = {

};
