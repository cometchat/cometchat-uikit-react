import React from "react";
import "./style.scss";
import SenderMessageBubble from "../SenderMessageBubble";
import ReceiverMessageBubble from "../ReceiverMessageBubble"
import SenderImageBubble from "../SenderImageBubble"
import ReceiverImageBubble from "../ReceiverImageBubble"
import SenderFileBubble from "../SenderFileBubble"
import ReceiverFileBubble from "../ReceiverFileBubble"
import SenderAudioBubble from "../SenderAudioBubble"
import ReceiverAudioBubble from "../ReceiverAudioBubble"
import SenderVideoBubble from "../SenderVideoBubble"
import ReceiverVideoBubble from "../ReceiverVideoBubble"
import { CometChatManager } from "./controller";
import { CometChat } from "@cometchat-pro/chat";
import CallMessage from "../CallMessage";
import callBlue from "./resources/call-blue-icon.svg";
import Avatar from "../Avatar";



class CallScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCallScreen: false,
      showIncomingScreen: false,
      showOutgoingScreen: false,
      showIframeScreen: false,
      actionGenerated: (action, payload) => {
        return null;
      }
    }
    this.callScreenElement = React.createRef();

  }
  componentDidMount() {
    console.log("I am called");
    this.cometChatManager = new CometChatManager();

    let listenerID = "UNIQUE_LISTENER_ID_CALL_SCREEN";

    CometChat.addCallListener(
      listenerID,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          if (!this.state.callIProgress) {
            this.setState({ showCallScreen: true, showIncomingScreen: true, callIProgress: call });
          } else {
            //TODO reject the call
          }

        },
        onOutgoingCallAccepted: (call) => {
          console.log(call);
          this.setState({
            showCallScreen: true,
            showIncomingScreen: false,
            showOutgoingScreen: false,
            showIframeScreen: true,
            callIProgress: call
          });
          CometChat.startCall(
            call.getSessionId(),
            document.getElementById("cp-call-screen-container"),
            new CometChat.OngoingCallListener({
              onUserJoined: user => {
                /* Notification received here if another user joins the call. */
                console.log("User joined call:", user);
                /* this method can be use to display message or perform any actions if someone joining the call */
              },
              onUserLeft: user => {
                /* Notification received here if another user left the call. */
                console.log("User left call:", user);
                /* this method can be use to display message or perform any actions if someone leaving the call */
              },
              onCallEnded: call => {
                /* Notification received here if current ongoing call is ended. */
                this.setState({
                  showCallScreen: false,
                  showIncomingScreen: false,
                  showOutgoingScreen: false,
                  showIframeScreen: false,
                  callIProgress: undefined
                });
                this.props.actionGenerated("callEnded", {});
                /* hiding/closing the call screen can be done here. */
              }
            })
          );

        },
        onOutgoingCallRejected: (call) => {
          console.log("here we ate ", call)
          this.setState({
            showCallScreen: false,
            showIncomingScreen: false,
            showOutgoingScreen: false,
            showIframeScreen: false,
            callIProgress: undefined
          });
          this.props.actionGenerated("callEnded", {});
        },
        onIncomingCallCancelled: (call) => {
          this.setState({
            showCallScreen: false,
            showIncomingScreen: false,
            showOutgoingScreen: false,
            showIframeScreen: false,
            callIProgress: undefined
          });
          this.props.actionGenerated("callEnded", {});
        }
      })
    );
  }
  UNSAFE_componentWillReceiveProps(props) {

    if (props.outgoingCall) {
      console.log(props, "asfajfhjkaskfaksf aksf kajsf kas ");
      this.setState({
        showCallScreen: true,
        showIncomingScreen: false,
        showOutgoingScreen: true,
        showIframeScreen: false,
        callIProgress: props.outgoingCall
      });
    }
  }
  // static getDerivedStateFromProps(props, state) {    
  //   if (props.outgoingCall) {
  //     return {
  //       showCallScreen: false,
  //       showIncomingScreen: false,
  //       showOutgoingScreen: true,
  //       showIframeScreen: false,
  //     }
  //   }
  //   return null;
  //   // return props;

  // }
  render() {
    return (this.state.showCallScreen ? <div className="cp-call-screen-container">
      {this.state.showIframeScreen ? <div id="cp-call-screen-container" className="cp-call-screen-container" style={{ zIndex: 100000 }}>

      </div> : null}
      {(this.state.showIncomingScreen ? <div className="cp-incoming-call-screen" >
        <div className="m-a" >
          Calling...
        </div>

        <div className="m-a cp-call-title" >
          {this.state.callIProgress.sender.name}
        </div>
        <div className="m-a" >
          <Avatar src={this.state.callIProgress.sender}></Avatar>
        </div>

        <div className="m-a" style={{ display: "flex", width: '25%' }}>
          <div className="m-a p-xl cp-accept-button" onClick={() => {
            CometChat.acceptCall(this.state.callIProgress.sessionId).then(call => {
              this.setState({
                showCallScreen: true,
                showIncomingScreen: false,
                showOutgoingScreen: false,
                showIframeScreen: true,
              });
              CometChat.startCall(
                call.getSessionId(),
                document.getElementById("cp-call-screen-container"),
                new CometChat.OngoingCallListener({
                  onUserJoined: user => {
                    /* Notification received here if another user joins the call. */
                    console.log("User joined call:", user);
                    /* this method can be use to display message or perform any actions if someone joining the call */
                  },
                  onUserLeft: user => {
                    /* Notification received here if another user left the call. */
                    console.log("User left call:", user);
                    /* this method can be use to display message or perform any actions if someone leaving the call */
                  },
                  onCallEnded: call => {
                    /* Notification received here if current ongoing call is ended. */
                    this.setState({
                      showCallScreen: false,
                      showIncomingScreen: false,
                      showOutgoingScreen: false,
                      showIframeScreen: false,
                      callIProgress: undefined
                    });
                    this.props.actionGenerated("callEnded", {});
                    /* hiding/closing the call screen can be done here. */
                  }
                })
              );
              console.log("callStarted");
            });
          }}>
            ACCEPT
          </div>
          <div className="m-a p-xl cp-reject-button" onClick={() => {
            CometChat.rejectCall(this.state.callIProgress.sessionId, CometChat.CALL_STATUS.REJECTED).then(() => {
              this.setState({
                showCallScreen: false,
                showIncomingScreen: false,
                showOutgoingScreen: false,
                showIframeScreen: false,
                callIProgress: undefined

              })
              this.props.actionGenerated("callEnded", {});
            }, err => {
              this.setState({
                showCallScreen: false,
                showIncomingScreen: false,
                showOutgoingScreen: false,
                showIframeScreen: false,
                callIProgress: undefined
              });
              this.props.actionGenerated("callEnded", {});
            }
            );
          }
          }>
            REJECT
           </div>
        </div>

      </div> : null)}
      {(this.state.showOutgoingScreen ? <div className="cp-outgoing-call-screen" >
        <div className="m-a" >
          Calling...
        </div>

        <div className="m-a cp-call-title" >
          {this.state.callIProgress.receiver.name}
        </div>
        <div className="m-a" >
          <Avatar src={this.state.callIProgress.receiver}></Avatar>
        </div>

        <div className="m-a" style={{ display: "flex", width: '25%' }}>
          <div className="m-a p-xl cp-reject-button" onClick={() => {
            CometChat.rejectCall(this.state.callIProgress.sessionId, CometChat.CALL_STATUS.CANCELLED).then(() => {
              this.setState({
                showCallScreen: false,
                showIncomingScreen: false,
                showOutgoingScreen: false,
                showIframeScreen: false,
                callIProgress: undefined
              });
              this.props.actionGenerated("callEnded", {});
            }, err => {
              this.setState({
                showCallScreen: false,
                showIncomingScreen: false,
                showOutgoingScreen: false,
                showIframeScreen: false,
                callIProgress: undefined
              });
              this.props.actionGenerated("callEnded", {});
            });

          }
          }>
            CANCEL
           </div>
        </div>

      </div> : null)}
    </div > : null)
  }
}

export default CallScreen;