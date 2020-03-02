import React from "react";
import "./style.scss";
import Avatar from "../Avatar";




class ReceiverMessageBubble extends React.Component {
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

      <div className=" cp-receiver-message-container" >
        {this.state.message.receiverType === 'group'?<div className="cp-float-left">
          <Avatar src={this.state.message.sender}></Avatar>

        </div>:""}
        <div className="cp-float-left cp-receiver-message-wrapper">
        {this.state.message.receiverType === 'group'? <div className="text-muted">{this.state.message.sender.name}</div>:""}
         
          <div className=" cp-receiver-message" >
            {this.state.message.text}
          </div>
          <div className="cp-time text-muted"> {new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>

        </div>

      </div>

    );
  }
}



export default ReceiverMessageBubble;
export const receiverMessageBubble=ReceiverMessageBubble;

ReceiverMessageBubble.defaultProps = {

};
