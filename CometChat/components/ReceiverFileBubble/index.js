import React from "react";
import "./style.scss";
import Avatar from "../Avatar";
import blueFile from "./resources/file-blue.svg";




class ReceiverFileBubble extends React.Component {
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

      <div className=" cp-receiver-file-container" >
        <div className="cp-float-left">
          {this.state.message.receiverType === 'group' ? <div className="cp-float-left">
            <Avatar src={this.state.message.sender}></Avatar>

          </div> : ""}
        </div>
        <div className="cp-float-left cp-receiver-file-wrapper">
          {this.state.message.receiverType === 'group' ? <div className="text-muted">{this.state.message.sender.name}</div> : ""}
          <div className=" cp-receiver-file" >
            <div>
              <a href={this.state.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{this.state.message.data.attachments[0].name} <img src={blueFile} alt="file"/></a>

            </div>
            <p>{this.state.message.data.attachments[0].extension}</p>


          </div>
          <div className="cp-time text-muted"> {new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>

        </div>

      </div>

    );
  }
}



export default ReceiverFileBubble;
export const receiverFileBubble=ReceiverFileBubble;

ReceiverFileBubble.defaultProps = {

};
