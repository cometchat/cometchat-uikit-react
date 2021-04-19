import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from 'prop-types';
import { CometChat } from "@cometchat-pro/chat";

import { CallScreenManager } from "./controller";

import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";
import { SoundManager } from "../../../util/SoundManager";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

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

  static contextType = CometChatContext;

  constructor(props) {

    super(props);

    this.callScreenFrame = React.createRef();

    this.state = {
      errorScreen: false,
      errorMessage: null,
      outgoingCallScreen: false,
      callInProgress: null,
    }

    CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
      console.error(error);
    });
  }

  componentDidMount() {

    this.CallScreenManager = new CallScreenManager();
    this.CallScreenManager.attachListeners(this.callScreenUpdated);

    SoundManager.setWidgetSettings(this.props.widgetsettings);
  }

  componentWillUnmount() {
    this.CallScreenManager.removeListeners();
    this.CallScreenManager = null;
  }

  callScreenUpdated = (key, call) => {

    switch (key) {

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

  outgoingCallAccepted = (call) => {

    if (this.state.outgoingCallScreen === true) {

      this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_ACCEPTED"], call);

      SoundManager.pause(enums.CONSTANTS.AUDIO["OUTGOING_CALL"]);
      this.setState({ outgoingCallScreen: false, callInProgress: call, errorScreen: false, errorMessage: null });
      this.startOneOnOneCall(call);
      if(this.context) {
        this.context.setCallInProgress(call, enums.CONSTANTS["OUTGOING_DEFAULT_CALLING"]);
      }
      
    }
  }

  outgoingCallRejected = (call) => {

    SoundManager.pause(enums.CONSTANTS.AUDIO["OUTGOING_CALL"]);
    if (call.hasOwnProperty("status") && call.status === CometChat.CALL_STATUS.BUSY) {
      
      //show busy message.
      const errorMessage = `${call.sender.name} ${Translator.translate("ON_ANOTHER_CALL", this.props.lang)}`;
      this.setState({ errorScreen: true, errorMessage: errorMessage });

    } else {
      
      this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_REJECTED"], call);
      this.setState({ outgoingCallScreen: false, callInProgress: null, errorScreen: false, errorMessage: null });

    }
  }

  startCall = (call) => {

    SoundManager.play(enums.CONSTANTS.AUDIO["OUTGOING_CALL"]);
    this.setState({ outgoingCallScreen: true, callInProgress: call, errorScreen: false, errorMessage: null });
  }

  startOneOnOneCall = (call) => {

    const sessionId = call.getSessionId();
    const callType = (call.type === CometChat.CALL_TYPE.AUDIO ? true : false);

    const callSettings = new CometChat.CallSettingsBuilder()
      .setSessionID(sessionId)
      .enableDefaultLayout(true)
      .setMode(CometChat.CALL_MODE.DEFAULT)
      .setIsAudioOnlyCall(callType)
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
          /* this method can be use to display message or perform any actions if someone joining the call */
          //call initiator gets the same info in outgoingcallaccpeted event
          if (call.callInitiator.uid !== this.loggedInUser.uid && call.callInitiator.uid !== user.uid) {

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
            this.props.actionGenerated(enums.ACTIONS["USER_JOINED_CALL"], callMessage);
          }
        },
        onUserLeft: user => {
          /* Notification received here if another user left the call. */
          /* this method can be use to display message or perform any actions if someone leaving the call */
          //call initiator gets the same info in outgoingcallaccpeted event
          if (call.callInitiator.uid !== this.loggedInUser.uid && call.callInitiator.uid !== user.uid) {

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

            this.props.actionGenerated(enums.ACTIONS["USER_LEFT_CALL"], callMessage);
          }
        },
        onCallEnded: endedCall => {

          /* Notification received here if current ongoing call is ended. */
          this.setState({ showOutgoingScreen: false, callInProgress: null });
          if (this.context) {
            this.context.setCallInProgress(null, "");
          }
          this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_ENDED"], endedCall);
          /* hiding/closing the call screen can be done here. */
        }
      })
    );
  }

  //cancelling an outgoing call
  cancelCall = () => {

    SoundManager.pause(enums.CONSTANTS.AUDIO["OUTGOING_CALL"]);
    //if user busy error, just close the callscreen, no need to reject the call
    if (this.state.errorScreen) {

      this.setState({ errorScreen: false, errorMessage: null, outgoingCallScreen: false, callInProgress: null });
      this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_CANCELLED"]);

    } else {

      CometChat.rejectCall(this.state.callInProgress.sessionId, CometChat.CALL_STATUS.CANCELLED).then(call => {

        this.setState({ outgoingCallScreen: false, callInProgress: null });
        this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_CANCELLED"]);

      }).catch(error => {

        this.setState({ outgoingCallScreen: false, callInProgress: null });

      });
    }
  }

  render() {

    let callScreen = null, outgoingCallScreen = null, errorScreen = null;
    if (this.state.callInProgress) {

      let avatar = (<CometChatAvatar user={this.state.callInProgress.receiver} />);
      if (this.state.errorScreen) {
        errorScreen = (
          <div css={errorContainerStyle()} className="callscreen__error__wrapper"><div>{this.state.errorMessage}</div></div>
        );
      }

      if (this.state.outgoingCallScreen) {
        outgoingCallScreen = (
          <div css={callScreenContainerStyle()} className="callscreen__container">
            <div css={headerStyle()} className="callscreen__header">
              <span css={headerDurationStyle()} className="header__calling">{Translator.translate("CALLING", this.props.lang)}</span>
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
  outgoingCall: null,
};

CometChatOutgoingCall.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object,
  outgoingCall: PropTypes.object
}

export default CometChatOutgoingCall;