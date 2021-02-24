import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from 'prop-types';
import { CometChat } from "@cometchat-pro/chat";

import { CallScreenManager } from "./controller";

import { CometChatAvatar } from "../../Shared";

import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";
import { outgoingCallAlert } from "../../../resources/audio";

import {
  callScreenWrapperStyle,
  callScreenContainerStyle,
  headerStyle,
  headerDurationStyle,
  headerNameStyle,
  thumbnailWrapperStyle,
  thumbnailStyle,
  headerIconStyle,
  iconWrapperStyle,
  iconStyle,
  errorContainerStyle
} from "./style";

import callIcon from "./resources/call-end-white-icon.svg";

class CometChatOutgoingCall extends React.PureComponent {

  constructor(props) {

    super(props);

    this.callScreenFrame = React.createRef();

    this.state = {
      errorScreen: false,
      errorMessage: null,
      outgoingCallScreen: false,
      callInProgress: null,
    }

    this.outgoingAlert = new Audio(outgoingCallAlert);
  }

  playOutgoingAlert = () => {

    //if audio sound is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_sound_for_calls") === false) {
      return false;
    }

    this.outgoingAlert.currentTime = 0;
    if (typeof this.outgoingAlert.loop == 'boolean') {
      this.outgoingAlert.loop = true;
    } else {
      this.outgoingAlert.addEventListener('ended', function () {
        this.currentTime = 0;
        this.play();
      }, false);
    }
    this.outgoingAlert.play();
  }

  pauseOutgoingAlert = () => {

    //if audio sound is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "enable_sound_for_calls") === false) {
      return false;
    }
    
    this.outgoingAlert.pause();
  }

  componentDidMount() {

    this.CallScreenManager = new CallScreenManager();
    this.CallScreenManager.attachListeners(this.callScreenUpdated);
  }

  componentDidUpdate(prevProps) {

    if (prevProps.outgoingCall !== this.props.outgoingCall && this.props.outgoingCall) {

      this.playOutgoingAlert(); 

      let call = this.props.outgoingCall;
      this.setState({ outgoingCallScreen: true, callInProgress: call, errorScreen: false, errorMessage: null });
    }

    //incoming call accepted
    if (prevProps.incomingCall !== this.props.incomingCall && this.props.incomingCall) {

      this.setState({ outgoingCallScreen: false, callInProgress: this.props.incomingCall, errorScreen: false, errorMessage: null });

      setTimeout(() => {
        this.startCall(this.props.incomingCall);
      }, 5);
      
    }
  }

  componentWillUnmount() {
    this.CallScreenManager.removeListeners();
    this.CallScreenManager = null;
  }

  callScreenUpdated = (key, call) => {

    switch(key) {

      case enums.INCOMING_CALL_CANCELLED:
        this.incomingCallCancelled(call);
      break;
      case enums.OUTGOING_CALL_ACCEPTED://occurs at the caller end
        this.outgoingCallAccepted(call);
      break;
      case enums.OUTGOING_CALL_REJECTED://occurs at the caller end, callee rejects the call
        this.outgoingCallRejected(call);
      break;
      default:
      break;
    }
  }

  incomingCallCancelled = (call) => {

    this.setState({ outgoingCallScreen: false, callInProgress: null });
  }

  outgoingCallAccepted = (call) => {
    
    if (this.state.outgoingCallScreen === true) {

      this.pauseOutgoingAlert();
      this.setState({ outgoingCallScreen: false, callInProgress: call, errorScreen: false, errorMessage: null });
      this.startCall(call);

    }
  }

  outgoingCallRejected = (call) => {
    
    this.pauseOutgoingAlert();

    if (call.hasOwnProperty("status") && call.status === CometChat.CALL_STATUS.BUSY) {

      //show busy message.
      const errorMessage = `${call.sender.name} ${Translator.translate("ON_ANOTHER_CALL", this.props.lang)}`;
      this.setState({ errorScreen: true, errorMessage: errorMessage});

    } else {

      this.props.actionGenerated("outgoingCallRejected", call);
      this.setState({ outgoingCallScreen: false, callInProgress: null });
    }
  }

  startCall = (call) => {

    const sessionId = call.getSessionId();
    const callType = call.type;

    const callSettings = new CometChat.CallSettingsBuilder()
                        .setSessionID(sessionId)
                        .enableDefaultLayout(true)
                        .setMode(CometChat.CALL_MODE.DEFAULT)
                        .setIsAudioOnlyCall(callType === CometChat.CALL_TYPE.AUDIO ? true : false)
                        .setLocalizedStringObject({
                          "SELECT_VIDEO_SOURCE": Translator.translate("SELECT_VIDEO_SOURCE", this.props.lang),
                          "SELECT_INPUT_AUDIO_SOURCE": Translator.translate("SELECT_INPUT_AUDIO_SOURCE", this.props.lang),
                          "SELECT_OUTPUT_AUDIO_SOURCE": Translator.translate("SELECT_OUTPUT_AUDIO_SOURCE", this.props.lang)
                        }).build();


    const el = this.callScreenFrame;
    CometChat.startCall(
      callSettings,
      el,
      new CometChat.OngoingCallListener({
        onUserJoined: user => {

          /* Notification received here if another user joins the call. */
          //console.log("User joined call:", enums.USER_JOINED, user);
          /* this method can be use to display message or perform any actions if someone joining the call */

          //call initiator gets the same info in outgoingcallaccpeted event
          if (call.callInitiator.uid !== this.props.loggedInUser.uid && call.callInitiator.uid !== user.uid) {

            const callMessage = { 
              "category": call.category, 
              "type": call.type, 
              "action": call.action, 
              "status": call.status, 
              "callInitiator": call.callInitiator,
              "callReceiver": call.callReceiver,
              "receiverId": call.receiverId,
              "receiverType": call.receiverType,
              "sentAt": call.sentAt,
              "sender": { ...user }
            };
            this.props.actionGenerated("userJoinedCall", callMessage);
          }
        },
        onUserLeft: user => {
          /* Notification received here if another user left the call. */
          //console.log("User left call:", enums.USER_LEFT, user);
          /* this method can be use to display message or perform any actions if someone leaving the call */

          //call initiator gets the same info in outgoingcallaccpeted event
          if (call.callInitiator.uid !== this.props.loggedInUser.uid && call.callInitiator.uid !== user.uid) {

            const callMessage = {
              "category": call.category,
              "type": call.type,
              "action": "left",
              "status": call.status,
              "callInitiator": call.callInitiator,
              "callReceiver": call.callReceiver,
              "receiverId": call.receiverId,
              "receiverType": call.receiverType,
              "sentAt": call.sentAt,
              "sender": { ...user }
            };

            this.props.actionGenerated("userLeftCall", callMessage);
          }
        },
        onCallEnded: endedCall => {
          
          /* Notification received here if current ongoing call is ended. */
          this.setState({ showOutgoingScreen: false, callInProgress: null });
          this.props.actionGenerated("callEnded", endedCall);
          /* hiding/closing the call screen can be done here. */
        }
      })
    );
  }

  //cancelling an outgoing call
  cancelCall = () => {

    this.pauseOutgoingAlert();

    //if user busy error, just close the callscreen, no need to reject the call
    if (this.state.errorScreen) {

      this.props.actionGenerated("callError", this.state.errorMessage);
      this.setState({ errorScreen: false, errorMessage: null, outgoingCallScreen: false, callInProgress: null });

    } else {

      CometChat.rejectCall(this.state.callInProgress.sessionId, CometChat.CALL_STATUS.CANCELLED).then(call => {

        this.props.actionGenerated("outgoingCallCancelled", call);
        this.setState({ outgoingCallScreen: false, callInProgress: null });

      }).catch(error => {

        this.props.actionGenerated("callError", error);
        this.setState({ outgoingCallScreen: false, callInProgress: null });
      });

    }
  }

  render() {

    let callScreen = null, outgoingCallScreen = null, errorScreen = null;
    if (this.state.callInProgress) {

      let avatar = null;
      if (this.props.type === CometChat.RECEIVER_TYPE.USER) {

        avatar = (<CometChatAvatar user={this.state.callInProgress.receiver} />);

      } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {

        avatar = (<CometChatAvatar group={this.state.callInProgress.receiver} />);
      }

      if (this.state.errorScreen) {
        errorScreen = (
          <div css={errorContainerStyle()} className="callscreen__error__wrapper"><div>{this.state.errorMessage}</div></div>
        );
      }

      if (this.state.outgoingCallScreen) {
        outgoingCallScreen = (
          <div css={callScreenContainerStyle()} className="callscreen__container">
            <div css={headerStyle()} className="callscreen__header">
              <span css={headerDurationStyle()} className="header__calling">{ Translator.translate("CALLING", this.props.lang) }</span>
              <h6 css={headerNameStyle()} className="header__name">{this.state.callInProgress.receiver.name}</h6>
            </div>
            <div css={thumbnailWrapperStyle()} className="callscreen__thumbnail__wrapper">
              <div css={thumbnailStyle()} className="callscreen__thumbnail">{avatar}</div>
            </div>
            {errorScreen}
            <div css={headerIconStyle()} className="callscreen__icons">
              <div css={iconWrapperStyle()} className="icon__block" onClick={this.cancelCall}>
                <div css={iconStyle(callIcon, 0)} className="icon icon__end"></div>
              </div>
            </div>
          </div>
        );
      }
    }

    if (this.state.callInProgress) {

      callScreen = (
        <div css={callScreenWrapperStyle(this.props, keyframes)} className="callscreen__wrapper" ref={el => { this.callScreenFrame = el; }}>
          {outgoingCallScreen}
        </div>
      );
    }

    return callScreen;
  }
}

// Specifies the default values for props:
CometChatOutgoingCall.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
  incomingCall: null,
  outgoingCall: null,
};

CometChatOutgoingCall.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  incomingCall: PropTypes.object,
  outgoingCall: PropTypes.object
}

export default CometChatOutgoingCall;
