import React from "react";
import "./style.scss";
import Avatar from "../Avatar";
import BadgeCount from "../BadgeCount";
import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";


class ConversationView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      conversation: {},
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
  displayLastMessage=(lastMessage)=>{
    if (lastMessage.text) {
      return lastMessage.text
    }else if(lastMessage.type === 'image'){
      return 'Image'
    }else if(lastMessage.type === 'file'){
      return 'File'
    }else if(lastMessage.type === 'audio'){
      return 'Audio'
    }else if(lastMessage.type === 'video'){
      return 'Video'
    }

  }
  render() {
    return (
      <div className="cp-conversationview" onClick={() => { if (this.props.onClick) this.props.onClick(this.state.conversation) }}>
        {(() => {
          switch (this.state.conversation.conversationType) {
            case "user": return (<div className="row">
              <div className="col-xs-1 cp-conversation-avatar">
                <Avatar src={this.state.conversation.conversationWith}></Avatar>
              </div>
              <div className="col cp-user-info">
                <div className="row cp-no-padding">
                  <div className="col-lg-9 col-sm-9 cp-no-padding"><div className="cp-username  cp-ellipsis font-bold">
                    {this.state.conversation.conversationWith.name} </div></div>
                  <div className="col-lg-3 col-sm-3 cp-no-padding"><div className="cp-time text-muted"> {new Date(this.state.conversation.lastMessage.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div></div>
                </div>
                <div className="row cp-userstatus">
                  <div className="col cp-no-padding">
                   
                    {this.state.conversation.lastMessage ? <div className={"text-muted cp-ellipsis "} >{this.displayLastMessage(this.state.conversation.lastMessage.data)} </div> : <div className={"text-muted cp-ellipsis "} >Tap to start a conversation.</div>
                    }
                  </div>
                  <div className="col cp-no-padding">
                    <BadgeCount count={this.state.conversation.unreadMessageCount}></BadgeCount>
                  </div>
                </div>
              </div>
            </div>);
            case "group": return (<div className="row">
              <div className="col-xs-1 cp-conversation-avatar">
                <Avatar src={this.state.conversation.conversationWith}></Avatar>
              </div>
              <div className="col cp-user-info">
                <div className="row cp-no-padding">
                  <div className="col-lg-9 col-sm-9 cp-no-padding">
                    <div className="cp-username  cp-ellipsis font-bold">{this.state.conversation.conversationWith.name}</div>
                  </div>
                  <div className="col-lg-3 col-sm-3 cp-no-padding">
                    <div className="cp-time text-muted"> {new Date(this.state.conversation.lastMessage.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>
                  </div>
                </div>
                <div className="row cp-userstatus">
                  <div className="col cp-no-padding">
                    {this.state.conversation.lastMessage ? <div className={"text-muted cp-ellipsis "} >{this.displayLastMessage(this.state.conversation.lastMessage.data)} </div> : <div className={"text-muted cp-ellipsis "} >Tap to start a conversation.</div>
                    }
                  </div>
                  <div className="col cp-no-padding">
                    <BadgeCount count={this.state.conversation.unreadMessageCount}></BadgeCount>
                  </div>
                </div>
              </div>
            </div>);
            default: return null;
          }
        })()}
      </div>
    );
  }
}
export default ConversationView;
export const conversationView=ConversationView;

ConversationView.defaultProps = {
  conversation: {}
};
