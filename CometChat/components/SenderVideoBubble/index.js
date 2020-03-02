import React from "react";
import "./style.scss";
import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";


class SenderVideoBubble extends React.Component {
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

      <div className=" cp-sender-video-container" >
      <div className=" cp-sender-video" >
      <video controls>
     <source src={this.state.message.data.url} type="video/mp4"/>
     <source src={this.state.message.data.url} type="video/ogg"/>
     </video>
            </div>
            <div className="cp-time text-muted"> {new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}<span><img src={this.displayTicks(this.state.message)} alt="time"></img></span></div>
      </div>
     
    );
  }
}



export default SenderVideoBubble;
export const senderVideoBubble=SenderVideoBubble;

SenderVideoBubble.defaultProps = {

};
