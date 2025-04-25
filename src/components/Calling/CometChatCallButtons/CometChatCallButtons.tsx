import { useCallback, useRef, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatOutgoingCall } from "../CometChatOutgoingCall/CometChatOutgoingCall";
import { CometChatOngoingCall } from "../CometChatOngoingCall/CometChatOngoingCall";
import { useCallButtons } from "./useCallButtons";
import { useCometChatErrorHandler, useRefSync } from "../../../CometChatCustomHooks";
import { CometChatUIKitCalls } from "../../../CometChatUIKit/CometChatCalls";
import { CometChatSoundManager } from "../../../resources/CometChatSoundManager/CometChatSoundManager";
import { CometChatUIKitUtility } from "../../../CometChatUIKit/CometChatUIKitUtility";
import { localize } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { CallWorkflow, MessageStatus } from "../../../Enums/Enums";
import { CometChatButton } from "../../BaseComponents/CometChatButton/CometChatButton";
import audioCall from "../../../assets/audio_call_button.svg";
import videoCall from "../../../assets/video_call_button.svg";
import { OutgoingCallConfiguration } from "../OutgoingCallConfiguration";
import { CometChatCallEvents } from "../../../events/CometChatCallEvents";
import { CometChatMessageEvents } from "../../../events/CometChatMessageEvents";

interface CallButtonsProps {
  /**
   * Boolean flag to hide the video call button.
   */
  hideVideoCallButton?: boolean;

  /**
   * Boolean flag to hide the voice call button.
   */
  hideVoiceCallButton?: boolean;

  /**
   * Builder for checking and updating call settings.
   * @param isAudioOnlyCall - Whether it's an audio-only call.
   * @param user - The user object for the call (optional).
   * @param group - The group object for the call (optional).
   */
  callSettingsBuilder?: (isAudioOnlyCall: boolean, user?: CometChat.User, group?: CometChat.Group) => typeof CometChatUIKitCalls.CallSettingsBuilder;

  /**
   * Configuration object for managing outgoing call settings, such as call parameters, UI behaviors, or any pre-call settings.
   */
  outgoingCallConfiguration?: OutgoingCallConfiguration;

  /**
   * Callback function triggered when an error occurs in the call buttons component.
   * @param error - An instance of `CometChat.CometChatException` representing the error.
   * @returns void
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;
}

interface CallButtonsUserProps extends CallButtonsProps {
  /**
   * A CometChat.User object representing the user in which the call will be initiated.
   */
  user?: CometChat.User;

  /**
   * A CometChat.Group object representing the group in which the call will be initiated.
   * @default null
   */
  group?: CometChat.Group | null;
}

interface CallButtonsGroupProps extends CallButtonsProps {
  /**
   * A CometChat.User object representing the user in which the call will be initiated.
   * @default null
   */
  user?: CometChat.User | null;

  /**
   * A CometChat.Group object representing the group in which the call will be initiated.
   */
  group?: CometChat.Group;
}


type CallButtonsPropsType = CallButtonsUserProps | CallButtonsGroupProps

const defaultProps = {
  onVoiceCallClick: undefined,
  onVideoCallClick: undefined,
  callSettingsBuilder: undefined,
  outgoingCallConfiguration: new OutgoingCallConfiguration({}),

  onError: (error: CometChat.CometChatException) => {
    console.log(error);
  },
};

const CometChatCallButtons = (props: CallButtonsPropsType) => {
  const {
    user,
    group,
    onVoiceCallClick,
    onVideoCallClick,
    callSettingsBuilder,
    onError,
    outgoingCallConfiguration,
    hideVideoCallButton = false,
    hideVoiceCallButton = false,
  } = { ...defaultProps, ...props };
  const errorHandler = useCometChatErrorHandler(onError);

  const [loggedInUser, setLoggedInuser] = useState<CometChat.User | null>(null);
  const [activeUser, setActiveUser] = useState(user);
  const [activeGroup, setActiveGroup] = useState(group);
  const [showOngoingCall, setShowOngoingCall] = useState(false);
  const [showOutgoingCallScreen, setShowOutgoingCallScreen] = useState(false);
  const [disableButtons, setDisableButtons] = useState(false);

  const callRef = useRef<CometChat.Call | null>(null);
  const sessionIdRef = useRef<string>("");
  const isGroupAudioCallRef = useRef<boolean>(false);
  const onVoiceCallClickRef = useRefSync(onVoiceCallClick);
  const onVideoCallClickRef = useRefSync(onVideoCallClick);

  let callbuttonsListenerId: string = "callbuttons_" + new Date().getTime();
  const subscribeToEvents = useCallback(() => {
    try {
      const ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe(
        () => {
          setDisableButtons(false);
        }
      );
      const ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe(
        () => {
          setDisableButtons(true);
        }
      );
      const ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe(() => {
        setDisableButtons(false);
        callRef.current = null;
        sessionIdRef.current = "";
        setShowOngoingCall(false);
        setShowOutgoingCallScreen(false);
      });

      return () => {
        ccCallEnded?.unsubscribe();
        ccCallRejected?.unsubscribe();
        ccOutgoingCall?.unsubscribe();

      };
    } catch (e) {
      errorHandler(e, "subscribeToEvents");
    }
  }, []);

  /* The purpose of this function is to attach the required call listners. */
  const attachListeners = useCallback(() => {
    try {
      CometChat.addCallListener(
        callbuttonsListenerId,
        new CometChat.CallListener({
          onIncomingCallReceived: () => {
            setDisableButtons(true);
          },
          onIncomingCallCancelled: () => {
            setDisableButtons(false);
          },
          onOutgoingCallRejected: () => {
            setShowOutgoingCallScreen(false);
            setDisableButtons(false);
            callRef.current = null;
            sessionIdRef.current = "";
          },
          onOutgoingCallAccepted: (call: CometChat.Call) => {
            if (call.getSender()?.getUid() === loggedInUser?.getUid()
              || call.getSessionId() !== callRef.current?.getSessionId()
            ) {
              setShowOutgoingCallScreen(false);
              setDisableButtons(false);
              callRef.current = null;
              sessionIdRef.current = "";
              return;
            }
            sessionIdRef.current = call.getSessionId();
            setShowOutgoingCallScreen(false);
            setShowOngoingCall(true);
            setDisableButtons(true);
            callRef.current = call;
          },
        })
      );
    } catch (e) {
      errorHandler(e, "attachListeners");
    }
  }, [callbuttonsListenerId]);

  /* This function removes the call listeners on component unmount. */
  const removeListener = useCallback(() => {
    try {
      CometChat.removeCallListener(callbuttonsListenerId);
    } catch (e) {
      errorHandler(e, "removeListener");

    }
  }, [callbuttonsListenerId]);

  /* This function closes the call and resets the states. */
  const closeCallScreen = () => {
    setDisableButtons(false);
    callRef.current = null;
    sessionIdRef.current = "";
    setShowOngoingCall(false);
    setShowOutgoingCallScreen(false);
  };

  /* This function updates and returns the call builder with required configs and listeners attached. */
  function getCallBuilder(): typeof CometChatUIKitCalls.CallSettings {
    try {
      let audioOnlyCall: boolean =
        activeUser ? callRef.current?.getType() === CometChatUIKitConstants.MessageTypes.audio
          ? true
          : false : isGroupAudioCallRef.current;
      let callsBuilder = callSettingsBuilder ? callSettingsBuilder(audioOnlyCall, user!, group!) : new CometChatUIKitCalls.CallSettingsBuilder()
        .enableDefaultLayout(true)
        .setIsAudioOnlyCall(audioOnlyCall);

      const sessionId = sessionIdRef.current;
      callsBuilder.setCallListener(
        new CometChatUIKitCalls.OngoingCallListener({
          onCallEnded: () => {
            if (
              callRef.current?.getReceiverType() ===
              CometChatUIKitConstants.MessageReceiverType.user
            ) {
              CometChatUIKitCalls.endSession();
              CometChat.clearActiveCall();
              CometChatCallEvents.ccCallEnded.next(null as any);
              closeCallScreen();
            }
          },
          onCallEndButtonPressed: () => {
            if (
              callRef.current?.getReceiverType() ===
              CometChatUIKitConstants.MessageReceiverType.user
            ) {
              CometChat.endCall(sessionId)
                .then((call: CometChat.Call) => {
                  CometChatUIKitCalls.endSession();
                  CometChatCallEvents.ccCallEnded.next(call);
                  closeCallScreen()
                })
                .catch((err: CometChat.CometChatException) => {
                  errorHandler(err, "endCall");
                });
            } else {
              closeCallScreen();
            }
          },
          onError: (error: unknown) => {
            errorHandler(error, "callSettingsBuilder");
          },
        })
      );
      return callsBuilder;
    } catch (error) {
      errorHandler(error, "getCallBuilder");

    }

  }

  /* This function initiates the call process on click of call buttons. */
  const initiateCall = useCallback(
    (type: string) => {
      try {
        const receiverType: string = activeUser
          ? CometChatUIKitConstants.MessageReceiverType.user
          : CometChatUIKitConstants.MessageReceiverType.group;

        const receiverId: string | undefined = activeUser
          ? activeUser?.getUid()
          : activeGroup?.getGuid();

        const callObj: CometChat.Call = new CometChat.Call(
          receiverId,
          type,
          receiverType
        );

        CometChat.initiateCall(callObj).then(
          (outgoingCall: CometChat.Call) => {
            callRef.current = outgoingCall;
            setShowOutgoingCallScreen(true);
            CometChatCallEvents.ccOutgoingCall.next(outgoingCall);
          },
          (error: CometChat.CometChatException) => {
            errorHandler(error, "initiateCall")
          }
        );
      } catch (e) {
        errorHandler(e, "initiateCall")
      }
    },
    [activeUser, activeGroup]
  );

  /* This function initiates the audio call on click of the button. */
  const initiateAudioCall = useCallback(() => {
    try {
      if (activeUser) {
        initiateCall(CometChatUIKitConstants.MessageTypes.audio);
      }
      if (activeGroup) {
        isGroupAudioCallRef.current = true;
        sessionIdRef.current = activeGroup?.getGuid();
        sendCustomMessage(CometChatUIKitConstants.MessageTypes.audio);
        setShowOngoingCall(true);
      }
    } catch (e) {
      errorHandler(e, "initiateAudioCall")
    }
  }, [activeUser, initiateCall]);

  /* This function sends the custom message on group after the call is started. */
  const sendCustomMessage = useCallback((callType?: string) => {
    try {
      const receiverType: string = activeUser
        ? CometChatUIKitConstants.MessageReceiverType.user
        : CometChatUIKitConstants.MessageReceiverType.group;

      const receiverId: string | undefined = activeUser
        ? activeUser?.getUid()
        : activeGroup?.getGuid();
      const sessionID = sessionIdRef.current;

      const customData = {
        sessionID: sessionID,
        sessionId: sessionID,
        callType: callType,
      };

      const customType = CometChatUIKitConstants.calls.meeting;
      const conversationId = `group_${sessionID}`;

      const customMessage: any = new CometChat.CustomMessage(
        receiverId,
        receiverType,
        customType,
        customData
      );

      customMessage.setMetadata({ incrementUnreadCount: true });
      customMessage.shouldUpdateConversation(true);
      customMessage.setSender(loggedInUser!);
      customMessage.setConversationId(conversationId);
      customMessage.sentAt = CometChatUIKitUtility.getUnixTimestamp();
      customMessage.muid = CometChatUIKitUtility.ID();

      CometChatMessageEvents.ccMessageSent.next({
        message: customMessage,
        status: MessageStatus.inprogress,
      });

      CometChat.sendCustomMessage(customMessage).then(
        (m) => {
          CometChatMessageEvents.ccMessageSent.next({
            message: m,
            status: MessageStatus.success,
          });
        },
        (error: CometChat.CometChatException) => {
          errorHandler(error, "sendCustomMessage")
        }
      );
    } catch (e) {
      errorHandler(e, "sendCustomMessage")
    }
  }, [activeUser, activeGroup, loggedInUser]);

  /* This function initiates the video call on click of the button. */
  const initiateVideoCall = useCallback(() => {
    try {
      if (activeUser) {
        initiateCall(CometChatUIKitConstants.MessageTypes.video);
      }
      if (activeGroup) {
        isGroupAudioCallRef.current = false;
        sessionIdRef.current = activeGroup?.getGuid();
        sendCustomMessage(CometChatUIKitConstants.MessageTypes.video);
        setShowOngoingCall(true);
      }
    } catch (e) {
      errorHandler(e, "initiateVideoCall")
    }
  }, [activeUser, activeGroup, sendCustomMessage, initiateCall]);

  /* This function cancels/rejects the call on click of button. */
  const cancelOutgoingCall = useCallback(() => {
    const call = callRef.current;
    if (!call) {
      return;
    }
    try {
      CometChatSoundManager.pause();
      CometChat.rejectCall(
        call.getSessionId(),
        CometChatUIKitConstants.calls.cancelled
      ).then(
        (call: CometChat.Call) => {
          setDisableButtons(false);
          setShowOutgoingCallScreen(false);
          CometChatCallEvents.ccCallRejected.next(call);
          callRef.current = null;
        },
        (error: CometChat.CometChatException) => {
          errorHandler(error, "rejectCall")
        }
      );
      setShowOutgoingCallScreen(false);
    } catch (e) {
      errorHandler(e, "cancelOutgoingCall")
    }
  }, []);

  const { audioCallButtonClicked, videoCallButtonClicked } = useCallButtons(
    loggedInUser,
    setLoggedInuser,
    user,
    group,
    errorHandler,
    attachListeners,
    removeListener,
    setActiveUser,
    setActiveGroup,
    initiateAudioCall,
    initiateVideoCall,
    onVoiceCallClickRef,
    onVideoCallClickRef,
    subscribeToEvents
  );
  const ccBtnDisabledPropSpreadObject = disableButtons
    ? { disabled: true }
    : {};

  return (
    <>
      <div className="cometchat-call-button">
        {(activeUser || activeGroup) && !hideVoiceCallButton ? (
          <div className="cometchat-call-button__voice">
            <CometChatButton
              {...ccBtnDisabledPropSpreadObject}
              hoverText={localize("VOICE_CALL")}
              iconURL={audioCall}
              onClick={audioCallButtonClicked}
            />
          </div>
        ) : null}

        {(activeUser || activeGroup) && !hideVideoCallButton ? (
          <div className="cometchat-call-button__video">
            <CometChatButton
              {...ccBtnDisabledPropSpreadObject}
              hoverText={localize("VIDEO_CALL")}
              iconURL={videoCall}
              onClick={videoCallButtonClicked}
            />
          </div>
        ) : null}
      </div>

      {showOngoingCall && sessionIdRef.current != null ? (
        <CometChatOngoingCall
          sessionID={sessionIdRef.current}
          callSettingsBuilder={getCallBuilder()}
          callWorkflow={activeGroup ? CallWorkflow.directCalling : CallWorkflow.defaultCalling}
        />
      ) : null}

      {showOutgoingCallScreen && callRef.current ? (
        <div className="cometchat-backdrop cometchat-outgoing-call__backdrop">
          <CometChatOutgoingCall
            onCallCanceled={outgoingCallConfiguration?.onCallCanceled ?? cancelOutgoingCall}
            call={callRef.current}
            customSoundForCalls={outgoingCallConfiguration?.customSoundForCalls}
            disableSoundForCalls={outgoingCallConfiguration?.disableSoundForCalls}
            onError={outgoingCallConfiguration?.onError}
            titleView={outgoingCallConfiguration?.titleView?.(callRef.current)}
            subtitleView={outgoingCallConfiguration?.subtitleView?.(callRef.current)}
            avatarView={outgoingCallConfiguration?.avatarView?.(callRef.current)}
            cancelButtonView={outgoingCallConfiguration?.cancelButtonView?.(callRef.current)}
          />
        </div>
      ) : null}
    </>
  );
};

export { CometChatCallButtons };
