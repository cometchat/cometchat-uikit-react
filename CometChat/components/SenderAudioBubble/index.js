import React from "react";
import "./style.scss";
import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";


class SenderAudioBubble extends React.Component {
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

      <div className=" cp-sender-audio-container" >
      <div className=" cp-sender-audio" >
      <audio controls>
     <source src={this.state.message.data.url} />
     </audio>
            </div>
            <div className="cp-time text-muted"> {new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}<span><img src={this.displayTicks(this.state.message)} alt="time"></img></span></div>
      </div>
     
    );
  }
}



export default SenderAudioBubble;
export const senderAudioBubble=SenderAudioBubble;

SenderAudioBubble.defaultProps = {

};
