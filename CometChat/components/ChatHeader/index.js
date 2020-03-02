import React from "react";
import "./style.scss";
import Avatar from "../Avatar";
// import callBlue from "./resources/call-blue-icon.svg";
import detailPaneBlue from "./resources/details-pane-blue-icon.svg";
// import videoCallBlue from "./resources/video-call-blue-icon.svg";

class ChatHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      conversation: {},
      toggleUserProfile:false
    }

  }
  toggleUserProfile=()=>{
    this.setState({
      toggleUserProfile:!this.state.toggleUserProfile
    },
    this.state.onActionGenerated('toggelProfile',{toggleUserProfile:!this.state.toggleUserProfile})
    );

  }
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  render() {
    return (
      <div className="cp-chatheader" >
        {
          this.state.type === "user"?<div style={{display:"flex"}}>
          <div className="cp-chat-avatar" >
            <Avatar src={this.state.item ?this.state.item:''}></Avatar>
          </div>
          <div className=" col cp-user-info">
            <div className="cp-username font-bold">
              {(this.state.item ? this.state.item.name : '')} </div>
            <div className="cp-chathead-buttons ">
              {/* <button ><img src={callBlue} alt="call"/></button> */}
              {/* <button ><img src={videoCallBlue} alt="video call"/></button> */}
              <button onClick={this.toggleUserProfile}><img src={detailPaneBlue} alt="details"/></button>
            </div>
            <div className="row cp-userstatus">
              <span className="cp-text-blue" > {(this.state.item ? this.state.item.status : '')} </span>
            </div>
          </div>
        </div>:<div  style={{display:"flex"}}>
          <div className="cp-chat-avatar">
            <Avatar src={this.state.item ?this.state.item:''}></Avatar>
          </div>
          <div className="col cp-user-info">
            <div className="cp-username font-bold">
              {(this.state.item ? this.state.item.name : '')} </div>
            <div className="cp-chathead-buttons ">
              {/* <button ><img src={callBlue} alt="call"/></button> */}
              {/* <button ><img src={videoCallBlue} alt="video call" /></button> */}

              <button onClick={this.toggleUserProfile}><img src={detailPaneBlue} alt="details"/></button>

            </div>


            <div className=" row cp-userstatus">

              <span className="cp-text-blue" > {(this.state.item ? this.state.item.type : '')} </span>
            </div>
          </div>
        </div>
        }

        


      </div>
    );
  }
}



export default ChatHeader;
export const chatHeader=ChatHeader;

ChatHeader.defaultProps = {

};
