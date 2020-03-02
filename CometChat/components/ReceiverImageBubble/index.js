import React from "react";
import "./style.scss";
import Avatar from "../Avatar";



class ReceiverImageBubble extends React.Component {
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

      <div className=" cp-receiver-image-container" >
        <div className="cp-float-left">
          {this.state.message.receiverType === 'group' ? <div className="cp-float-left">
            <Avatar src={this.state.message.sender}></Avatar>

          </div> : ""}
        </div>
        <div className="cp-float-left cp-receiver-image-wrapper">
          {this.state.message.receiverType === 'group' ? <div className="text-muted">{this.state.message.sender.name}</div> : ""}
          <div className=" cp-receiver-image" >
            <img src={this.state.message.data.url} alt="receiver"></img>
          </div>
          <div className="cp-time text-muted"> {new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>

        </div>

      </div>

    );
  }
}



export default ReceiverImageBubble;
export const receiverImageBubble=ReceiverImageBubble;

ReceiverImageBubble.defaultProps = {

};
