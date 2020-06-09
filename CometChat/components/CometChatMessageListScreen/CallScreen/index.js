import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../../util/controller";

import { CallScreenManager } from "./controller";
import * as enums from '../../../util/enums.js';

import { SvgAvatar } from '../../../util/svgavatar';

import Avatar from "../../Avatar";

class CallScreen extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      showCallScreen: false,
      showIncomingScreen: false,
      showOutgoingScreen: false,
      showIframeScreen: false
    }
  }

  componentDidMount() {

    this.CallScreenManager = new CallScreenManager();
    this.CallScreenManager.attachListeners(this.callScreenUpdated);
  }

  componentDidUpdate(prevProps, prevState) {

    if(prevProps.outgoingCall !== this.props.outgoingCall) {

      this.CallScreenManager.removeListeners();
      this.CallScreenManager = new CallScreenManager();
      this.CallScreenManager.attachListeners(this.callScreenUpdated);

      this.setState({
        showCallScreen: true,
        showIncomingScreen: false,
        showOutgoingScreen: true,
        showIframeScreen: false,
        callIProgress: this.props.outgoingCall
      });
    }
  }

  componentWillUnmount() {
    this.CallScreenManager.removeListeners();
    this.CallScreenManager = null;
  }

  callScreenUpdated = (key, call) => {

    switch(key) {

      case enums.INCOMING_CALL_RECEIVED://occurs at the callee end
        if (!this.state.callIProgress) {
          this.setState({
            showCallScreen: true, 
            showIncomingScreen: true, 
            callIProgress: call 
          });
        }
        this.props.actionGenerated("callStarted", call);
      break;
      case enums.OUTGOING_CALL_ACCEPTED://occurs at the caller end
        this.onCallAccepted(call);
      break;
      case enums.OUTGOING_CALL_REJECTED://occurs at the caller end, callee rejects the call
        this.onCallDismiss(call);
      break;
      case enums.INCOMING_CALL_CANCELLED://occurs(call dismissed) at the callee end, caller cancels the call
        this.onCallDismiss(call);
      break;
      case enums.CALL_ENDED:
      break;
      default:
      break;
    }

  }

  onCallDismiss = (call) => {
    this.setState({
      showCallScreen: false,
      showIncomingScreen: false,
      showOutgoingScreen: false,
      showIframeScreen: false,
      callIProgress: undefined
    });
    this.props.actionGenerated("callEnded", call);
  }

  onCallAccepted = (call) => {

    this.setState({
      showCallScreen: true,
      showIncomingScreen: false,
      showOutgoingScreen: false,
      showIframeScreen: true,
      callIProgress: call
    });

    const el = document.getElementById("cp-call-screen-container");
    CometChat.startCall(
      call.getSessionId(),
      el,
      new CometChat.OngoingCallListener({
        onUserJoined: user => {
          /* Notification received here if another user joins the call. */
          //console.log("[CallScreen] onCallAccepted User joined call:", user);
          /* this method can be use to display message or perform any actions if someone joining the call */
        },
        onUserLeft: user => {
          /* Notification received here if another user left the call. */
          //console.log("[CallScreen] onCallAccepted User left call:", user);
          /* this method can be use to display message or perform any actions if someone leaving the call */
        },
        onCallEnded: call => {
          /* Notification received here if current ongoing call is ended. */
          //console.log("[CallScreen] onCallAccepted call ended:", call);
          this.setState({
            showCallScreen: false,
            showIncomingScreen: false,
            showOutgoingScreen: false,
            showIframeScreen: false,
            callIProgress: undefined
          });
          this.props.actionGenerated("callEnded", call);
          /* hiding/closing the call screen can be done here. */
        }
      })
  );
  }

  //answering incoming call, occurs at the callee end
  acceptCall = () => {

    CometChatManager.acceptCall(this.state.callIProgress.sessionId).then(call => {

      this.setState({
        showCallScreen: true,
        showIncomingScreen: false,
        showOutgoingScreen: false,
        showIframeScreen: true,
      });
      
      const el = document.getElementById("cp-call-screen-container");
      CometChat.startCall(
        call.getSessionId(),
        el,
        new CometChat.OngoingCallListener({
          onUserJoined: user => {
            /* Notification received here if another user joins the call. */
            //console.log("User joined call:", enums.USER_JOINED, user);
            /* this method can be use to display message or perform any actions if someone joining the call */
          },
          onUserLeft: user => {
            /* Notification received here if another user left the call. */
            //console.log("User left call:", enums.USER_LEFT, user);
            /* this method can be use to display message or perform any actions if someone leaving the call */
          },
          onCallEnded: call => {
            /* Notification received here if current ongoing call is ended. */
            //console.log("call ended:", enums.CALL_ENDED, call);
            this.setState({
              showCallScreen: false,
              showIncomingScreen: false,
              showOutgoingScreen: false,
              showIframeScreen: false,
              callIProgress: undefined
            });
            this.props.actionGenerated("callEnded", call);
            /* hiding/closing the call screen can be done here. */
          }
        })
      );

    }).catch(error => {
      console.log("[CallScreen] acceptCall -- error", error);
    });

  }

  //rejecting/cancelling an incoming call, occurs at the callee end
  rejectCall = (callStatus) => {
    CometChatManager.rejectCall(this.state.callIProgress.sessionId, callStatus).then(call => {

      this.setState({
        showCallScreen: false,
        showIncomingScreen: false,
        showOutgoingScreen: false,
        showIframeScreen: false,
        callIProgress: undefined
      });

      this.props.actionGenerated("callEnded", call);

    }).catch(error => {

      this.setState({
        showCallScreen: false,
        showIncomingScreen: false,
        showOutgoingScreen: false,
        showIframeScreen: false,
        callIProgress: undefined
      });

      this.props.actionGenerated("callEnded", error);
    });
  }

  render() {

    let callScreen =  null, iframeScreen, incomingCallScreen, outgoingCallScreen;
    if(this.state.showIncomingScreen) {

      if(this.props.type === "user" && !this.state.callIProgress.sender.getAvatar()) {

        const uid = this.state.callIProgress.sender.getUid();
        const char = this.state.callIProgress.sender.getName().charAt(0).toUpperCase();
        
        this.state.callIProgress.sender.setAvatar(SvgAvatar.getAvatar(uid, char));

      } else if(this.props.type === "group" && !this.state.callIProgress.sender.getIcon()) {

        const guid = this.state.callIProgress.sender.getGuid();
        const char = this.state.callIProgress.sender.getName().charAt(0).toUpperCase();

        this.state.callIProgress.sender.setIcon(SvgAvatar.getAvatar(guid, char));
      }

      let avatar;
      if(this.props.type === "user") {
        avatar = (<Avatar image={this.state.callIProgress.sender.avatar} />);
      } else if(this.props.type === "group") {
        avatar = (<Avatar image={this.state.callIProgress.sender.icon} />);
      }

      incomingCallScreen = (
        <div className="cp-incoming-call-screen">
          <div className="m-a">Calling...</div>
          <div className="m-a cp-call-title">{this.state.callIProgress.sender.name}</div>
          <div className="m-a">{avatar}</div>
          <div className="m-a" style={{ display: "flex", width: '25%' }}>
            <div className="m-a p-xl cp-accept-button" onClick={this.acceptCall}>ACCEPT</div>
            <div className="m-a p-xl cp-reject-button" onClick={() => this.rejectCall(CometChat.CALL_STATUS.REJECTED)}>REJECT</div>
          </div>
        </div>
      );
    }

    if(this.state.showOutgoingScreen) {

      if(this.props.type === "user" && !this.state.callIProgress.receiver.getAvatar()) {

        const uid = this.state.callIProgress.receiver.getUid();
        const char = this.state.callIProgress.receiver.getName().charAt(0).toUpperCase();
        
        this.state.callIProgress.receiver.setAvatar(SvgAvatar.getAvatar(uid, char));

      } else if(this.props.type === "group" && !this.state.callIProgress.receiver.getIcon()) {

        const guid = this.state.callIProgress.receiver.getGuid();
        const char = this.state.callIProgress.receiver.getName().charAt(0).toUpperCase();

        this.state.callIProgress.receiver.setIcon(SvgAvatar.getAvatar(guid, char));
      }

      let avatar;
      if(this.props.type === "user") {
        avatar = (<Avatar image={this.state.callIProgress.receiver.avatar} />);
      } else if(this.props.type === "group") {
        avatar = (<Avatar image={this.state.callIProgress.receiver.icon} />);
      }

      outgoingCallScreen = (
        <div className="cp-outgoing-call-screen">
          <div className="m-a">Calling...</div>
          <div className="m-a cp-call-title">{this.state.callIProgress.receiver.name}</div>
          <div className="m-a">{avatar}</div>
          <div className="m-a" style={{ display: "flex", width: '25%' }}>
            <div className="m-a p-xl cp-reject-button" onClick={() => this.rejectCall(CometChat.CALL_STATUS.CANCELLED)}>CANCEL</div>
          </div>
        </div>
      );
    }

    if(this.state.showIframeScreen) {
      iframeScreen = (<div id="cp-call-screen-container" className="cp-call-screen-container" style={{ zIndex: 100000 }}></div>);
    }

    if(this.state.showCallScreen) {
      callScreen = (
        <div className="cp-call-screen-container">
        {iframeScreen}
        {incomingCallScreen}
        {outgoingCallScreen}
        </div>
      );
    }
    return callScreen;
  }
}

export default CallScreen;