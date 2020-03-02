import React from "react";
import "./style.scss";
import Avatar from "../Avatar";


class ReceiverVideoBubble extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }

  }
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  render() {
    return (

      <div className=" cp-receiver-video-container" >
         <div className="cp-float-left">
          {this.state.message.receiverType === 'group' ? <div className="cp-float-left">
            <Avatar src={this.state.message.sender}></Avatar>

          </div> : ""}
        </div>
        <div className="cp-float-left cp-receiver-video-wrapper">
          {this.state.message.receiverType === 'group' ? <div className="text-muted">{this.state.message.sender.name}</div> : ""}
          <div className=" cp-receiver-video" >
          <video controls>
     <source src={this.state.message.data.url} type="video/mp4"/>
     <source src={this.state.message.data.url} type="video/ogg"/>
     </video>
          </div>
          <div className="cp-time text-muted"> {new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>

        </div>
  
      </div>
     
    );
  }
}



export default ReceiverVideoBubble;
export const receiverVideoBubble=ReceiverVideoBubble;

ReceiverVideoBubble.defaultProps = {

};
