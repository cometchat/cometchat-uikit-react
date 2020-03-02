import React from "react";
import "./style.scss";
import Avatar from "../Avatar";



class ReceiverAudioBubble extends React.Component {
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

      <div className=" cp-receiver-audio-container" >
        <div className="cp-float-left">
          {this.state.message.receiverType === 'group' ? <div className="cp-float-left">
            <Avatar src={this.state.message.sender}></Avatar>

          </div> : ""}
        </div>
        <div className="cp-float-left cp-receiver-audio-wrapper">
          {this.state.message.receiverType === 'group' ? <div className="text-muted">{this.state.message.sender.name}</div> : ""}
          <div className=" cp-receiver-audio" >
            <audio controls>
              <source src={this.state.message.data.url} type="audio/ogg" />
              <source src={this.state.message.data.url} type="audio/mpeg" />
            </audio>
          </div>
          <div className="cp-time text-muted"> {new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>

        </div>
      </div>

    );
  }
}



export default ReceiverAudioBubble;
export const receiverAudioBubble=ReceiverAudioBubble;

ReceiverAudioBubble.defaultProps = {

};
