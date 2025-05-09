import { useCallback, useEffect, useRef, useState } from "react";
import AudioCallIcon from "./assets/Audio-Call.svg";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatOngoingCall } from "../CometChatOngoingCall/CometChatOngoingCall";
import { useCometChatIncomingCall } from "./useCometChatIncomingCall";
import VideoCallIcon from "./assets/Video-call.svg";
import { CometChatUIKitCalls } from "../../../CometChatUIKit/CometChatCalls";
import { CometChatSoundManager } from "../../../resources/CometChatSoundManager/CometChatSoundManager";
import { StorageUtils } from "../../../utils/Storage";
import { localize } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { CometChatListItem } from "../../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatAvatar } from "../../BaseComponents/CometChatAvatar/CometChatAvatar";
import { CometChatButton } from "../../BaseComponents/CometChatButton/CometChatButton";
import { CometChatCallEvents } from "../../../events/CometChatCallEvents";
import { useCometChatErrorHandler } from "../../../CometChatCustomHooks";
import { JSX } from "react";

interface IncomingCallProps {
  /**
   * The CometChat call object used to initialize and display the incoming call component.
   */
  call?: any;

  /**
   * A builder function for configuring or updating call settings dynamically.
   * 
   * @param call - The current CometChat call object.
   * @returns An instance of CallSettingsBuilder.
   */
  callSettingsBuilder?: (call: CometChat.Call) => typeof CometChatUIKitCalls.CallSettingsBuilder;

  /**
   * Disables the sound for incoming calls.
   * @defaultValue false
   */
  disableSoundForCalls?: boolean;

  /**
   * Specifies a custom sound to play for incoming calls.
   */
  customSoundForCalls?: string;

  /**
   * Callback function triggered when the accept button is clicked. Allows overriding the default behavior.
   * 
   * @param call - An instance of `CometChat.Call` representing the Call.
   * @returns void
   */
  onAccept?: (call: CometChat.Call) => void;

  /**
   * Callback function triggered when the decline button is clicked. Allows overriding the default behavior.
   * 
   * @param call - An instance of `CometChat.Call` representing the Call.
   * @returns void
   */
  onDecline?: (call: CometChat.Call) => void;

  /**
   * Callback function triggered when an error occurs in the incoming call component.
   * @param error - An instance of `CometChat.CometChatException` representing the error.
   * @return void
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * A function that renders a JSX element to display the item view.
   * 
   * @param call - An instance of `CometChat.Call` representing the call.
   * @returns A JSX element to be rendered as the item view.
   */
  itemView?: (call: CometChat.Call) => JSX.Element;

  /**
   * A function that renders a JSX element to display the leading view.
   * 
   * @param call - An instance of `CometChat.Call` representing the call.
   * @returns A JSX element to be rendered as the leading view.
   */
  leadingView?: (call: CometChat.Call) => JSX.Element;

  /**
   * A function that renders a JSX element to display the title view.
   * 
   * @param call - An instance of `CometChat.Call` representing the call.
   * @returns A JSX element to be rendered as the title view.
   */
  titleView?: (call: CometChat.Call) => JSX.Element;

  /**
   * A function that renders a JSX element to display the subtitle view.
   * 
   * @param call - An instance of `CometChat.Call` representing the call.
   * @returns A JSX element to be rendered as the subtitle view.
   */
  subtitleView?: (call: CometChat.Call) => JSX.Element;

  /**
   * A function that renders a JSX element to display the trailing view.
   * 
   * @param call - An instance of `CometChat.Call` representing the call.
   * @returns A JSX element to be rendered as the trailing view.
   */
  trailingView?: (call: CometChat.Call) => JSX.Element;
}


const CometChatIncomingCall = (props: IncomingCallProps) => {
  const {
    call,
    disableSoundForCalls = false,
    customSoundForCalls = "",
    onAccept,
    onDecline,
    subtitleView = null,
    leadingView,
    titleView,
    trailingView,
    itemView,
    onError,
    callSettingsBuilder
  } = props;
  const errorHandler = useCometChatErrorHandler(onError);

  const acceptButtonTextRef = useRef<string>(localize("ACCEPT"));
  const declineButtonTextRef = useRef<string>(localize("DECLINE"));
  const [loggedInUser, setLoggedInuser] = useState<CometChat.User | null>(null);
  const [showIncomingCallScreen, setShowIncomingCallScreen] = useState(false);
  const [showOngoingCallScreen, setShowOngoingCallScreen] = useState(false);
  const [showOutGoingCallScreen, setShowOutGoingCallScreen] = useState(false);
  const callRef = useRef<CometChat.Call | null>(null);
  const sessionIdRef = useRef("");
  const rejectCallButtonRef = useRef(null);
  const acceptCallButtonRef = useRef(null);
  const currentOutgoingCallRef = useRef<CometChat.Call | null>(null);


  let incomingcallListenerId: string = "incomingcall_" + new Date().getTime(),
    subtitleText: string = localize("INCOMING_CALL");

  const playAudio = useCallback(() => {
    try {
      if (customSoundForCalls) {
        CometChatSoundManager.play(
          CometChatSoundManager.Sound.incomingCall!,
          customSoundForCalls
        );
      } else {
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall!);
      }
    } catch (e) {
      errorHandler(e, "playAudio");
    }
  }, [customSoundForCalls]);

  const isCallActive = useCallback(
    (call: CometChat.Call) => {
      let isCurrentCall: boolean = false;
      try {
        if (StorageUtils.getItem(CometChatUIKitConstants.calls.activecall)) {
          let oldCall: any = StorageUtils.getItem(
            CometChatUIKitConstants.calls.activecall
          );
          if (oldCall && oldCall.sessionId === call.getSessionId()) {
            isCurrentCall = true;
          } else {
            isCurrentCall = false;
          }
        } else {
          isCurrentCall = false;
        }
        return isCurrentCall;
      } catch (e) {
        errorHandler(e, "isCallActive");
        return isCurrentCall;
      }
    },
    []
  );

  const rejectIncomingCall = useCallback(
    (reason: string = CometChatUIKitConstants.calls.rejected) => {
      try {
        CometChatSoundManager.pause();
        if (onDecline) {
          onDecline(callRef.current!);
        } else if (typeof callRef?.current?.getSessionId() === "string") {
          CometChat.rejectCall(callRef?.current?.getSessionId(), reason).then(
            (rejectedCall: CometChat.Call) => {
              StorageUtils.setItem(
                CometChatUIKitConstants.calls.activecall,
                rejectedCall
              );
              CometChatCallEvents.ccCallRejected.next(rejectedCall);
              setShowIncomingCallScreen(false);
              callRef.current = null;
            },
            (error: CometChat.CometChatException) => {
              errorHandler(error, "rejectCall");
            }
          );
        }
      } catch (e) {
        errorHandler(e, "rejectIncomingCall");
      }
    },
    [onDecline]
  );

  const showCall = useCallback(
    (call: CometChat.Call) => {
      try {
        if (
          !isCallActive(call) &&
          loggedInUser?.getUid() !== call?.getSender()?.getUid() &&
          callRef.current
        ) {
          if (
            !disableSoundForCalls &&
            !showOngoingCallScreen &&
            !showOutGoingCallScreen
          ) {
            setTimeout(() => {
              playAudio();
            }, 100);
          }
          if (!showOngoingCallScreen && !showOutGoingCallScreen) {
            setShowIncomingCallScreen(true);
          } else if (showOngoingCallScreen || showOutGoingCallScreen) {
            CometChatSoundManager.pause();
            rejectIncomingCall(CometChatUIKitConstants.calls.busy);
            CometChatCallEvents.ccCallRejected.next(call);
          }
        } else if (loggedInUser?.getUid() === call?.getSender()?.getUid()) {
          CometChatSoundManager.pause();
          return;
        } else {
          CometChatSoundManager.pause();
          rejectIncomingCall(CometChatUIKitConstants.calls.busy);
        }
      } catch (e) {
        errorHandler(e, "showCall");
      }
    },
    [
      isCallActive,
      disableSoundForCalls,
      playAudio,
      rejectIncomingCall,
      loggedInUser,
      showOngoingCallScreen,
      showOutGoingCallScreen,
    ]
  );

  const localStorageChange = useCallback((event: any) => {
    try {
      if (event?.key !== CometChatUIKitConstants.calls.activecall) {
        return;
      }
      if (event.newValue || event.oldValue) {
        let call;
        if (event.newValue) {
          call = JSON.parse(event.newValue);
        } else if (event.oldValue) {
          call = JSON.parse(event.oldValue);
        }
        if (callRef.current?.getSessionId() === call?.sessionId) {
          CometChatSoundManager.pause();
          callRef.current = null;
          setShowIncomingCallScreen(false);
        }
      }
      return;
    } catch (error) {
      errorHandler(error, "localStorageChange")
    }
  }, []);

  const closeCallScreen = () => {
    setShowOngoingCallScreen(false);
    setShowOutGoingCallScreen(false)
    callRef.current = null;
    sessionIdRef.current = "";
  };

  const clearStoredActiveCall = () => {
    try {
      const currentActiveCall: CometChat.Call = StorageUtils.getItem(CometChatUIKitConstants.calls.activecall);
      if (currentActiveCall) {
        StorageUtils.removeItem(CometChatUIKitConstants.calls.activecall);
      }
    } catch (e) {
      errorHandler(e, "clearStoredActiveCall");
    }
  }

  const subscribeToEvents = useCallback(() => {
    try {
      const ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe(
        (call: CometChat.Call) => {
          clearStoredActiveCall()
          closeCallScreen();
        }
      );

      const ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe(
        (call: CometChat.Call) => {
          setShowOutGoingCallScreen(true);
          currentOutgoingCallRef.current = call;
        }
      );
      const ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe(
        (call: CometChat.Call) => {
          clearStoredActiveCall()
          if (call?.getSessionId() === callRef.current?.getSessionId() || call?.getSessionId() === currentOutgoingCallRef.current?.getSessionId()) {
            setShowOngoingCallScreen(false);
            setShowOutGoingCallScreen(false);
            currentOutgoingCallRef.current = null;

          } else if (call?.getSessionId() === currentOutgoingCallRef.current?.getSessionId()) {
            currentOutgoingCallRef.current = null;
            setShowOutGoingCallScreen(false);
          } 
        }
      );
      return () => {
        ccCallEnded?.unsubscribe();
        ccOutgoingCall?.unsubscribe();
        ccCallRejected?.unsubscribe();
      };
    } catch (e) {
      errorHandler(e, "subscribeToEvents");
    }
  }, []);

  const getIsActiveCall = () => {
    try {
      return callRef.current || CometChat.getActiveCall() || StorageUtils.getItem(CometChatUIKitConstants.calls.activecall);
    } catch (e) {
      errorHandler(e, "getIsActiveCall");
    }
  }

  const attachListeners = useCallback(() => {
    try {
      StorageUtils.attachChangeDetection(localStorageChange);
      CometChat.addCallListener(
        incomingcallListenerId,
        new CometChat.CallListener({
          onIncomingCallReceived: (call: CometChat.Call) => {
            if (getIsActiveCall()) {
              CometChat.rejectCall(
                call.getSessionId(),
                CometChatUIKitConstants.calls.busy
              ).then(
                (rejectedCall: CometChat.Call) => {
                  CometChatCallEvents.ccCallRejected.next(rejectedCall);
                },
                (error: CometChat.CometChatException) => {
                  errorHandler(error, "rejectCall - onIncomingCallReceived");
                }
              );
              return;
            }
            callRef.current = call;
            showCall(call);
          },
          onIncomingCallCancelled: (call: CometChat.Call) => {
            CometChatSoundManager.pause();
            callRef.current = null;
            setShowIncomingCallScreen(false);
          },
          onOutgoingCallAccepted: (call: CometChat.Call) => {
            CometChatSoundManager.pause();
            if (call.getSender()?.getUid() === loggedInUser?.getUid()) {
              callRef.current = null;
              currentOutgoingCallRef.current = null;
              setShowIncomingCallScreen(false);
            }
          },
          onOutgoingCallRejected: (call: CometChat.Call) => {
            CometChatSoundManager.pause();
            callRef.current = null;
            currentOutgoingCallRef.current = null;
            setShowOutGoingCallScreen(false);
            setShowOngoingCallScreen(false);
            setShowIncomingCallScreen(false);
          },
        })
      );
    } catch (e) {
      errorHandler(e, "attachListeners");
    }
  }, [localStorageChange, showCall, incomingcallListenerId, loggedInUser]);

  const removeListener = useCallback(() => {
    try {
      StorageUtils.detachChangeDetection(localStorageChange);
      CometChat.removeCallListener(incomingcallListenerId);
    } catch (e) {
      errorHandler(e, "removeListener");
    }
  }, [localStorageChange, incomingcallListenerId]);

  const checkForActiveCallAndEndCall = useCallback(() => {
    try {
      let call: CometChat.Call = CometChat.getActiveCall();
      return new Promise((resolve, reject) => {
        if (!call) {
          return resolve({ success: true });
        }
        let sessionID = call?.getSessionId();
        CometChat.endCall(sessionID).then(
          (response: CometChat.Call | null) => {
            return resolve(response);
          },
          (error: CometChat.CometChatException) => {
            return reject(error);
          }
        );
      });
    } catch (e) {
      errorHandler(e, "checkForActiveCallAndEndCall");
    }
  }, []);

  const acceptIncomingCall = useCallback(() => {
    try {
      CometChatSoundManager.pause();
      if (onAccept) {
        onAccept(callRef.current!);
      } else {
        checkForActiveCallAndEndCall()?.then(
          (response) => {
            CometChat.acceptCall(callRef.current!.getSessionId()).then(
              (call: CometChat.Call) => {
                CometChatCallEvents.ccCallAccepted.next(call);
                StorageUtils.setItem(
                  CometChatUIKitConstants.calls.activecall,
                  call
                );
                setShowOngoingCallScreen(true);
                callRef.current = call;
                sessionIdRef.current = call?.getSessionId();
                setShowIncomingCallScreen(false);
              },
              (error: CometChat.CometChatException) => {
                errorHandler(error, "acceptCall");
              }
            );
          },
          (error: CometChat.CometChatException) => {
            errorHandler(error, "checkForActiveCallAndEndCall");
          }
        );
      }
    } catch (e) {
      errorHandler(e, "acceptIncomingCall");
    }
  }, [checkForActiveCallAndEndCall, onAccept]);

  function getCallBuilder(): typeof CometChatUIKitCalls.CallSettings {
    try {
      let audioOnlyCall: boolean =
        callRef.current?.getType() === CometChatUIKitConstants.MessageTypes.audio
          ? true
          : false;
      if (callRef.current?.getType() === CometChatUIKitConstants.calls.meeting) {
        return undefined;
      }
      let callsBuilder = callSettingsBuilder ? callSettingsBuilder(call) : new CometChatUIKitCalls.CallSettingsBuilder().setIsAudioOnlyCall(audioOnlyCall).enableDefaultLayout(true);

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
            CometChat.endCall(sessionIdRef.current)
              .then((call: CometChat.Call) => {
                CometChatUIKitCalls.endSession();
                CometChatCallEvents.ccCallEnded.next(call);
              })
              .catch((err: CometChat.CometChatException) => { });
          },
          onError: (error: any) => {
            errorHandler(error, "OngoingCallListener");
          },
        })
      )
      return callsBuilder;
    } catch (error) {
      errorHandler(error, "getCallBuilder");

    }
  }

  const getCallTypeIcon = () => {
    if (
      callRef.current?.getType() === CometChatUIKitConstants.MessageTypes.audio
    ) {
      return AudioCallIcon;
    } else {
      return VideoCallIcon;
    }
  };

  const ListItemSubtitleView = () => {
    return <>
      {subtitleView ? (
        <div className="cometchat-incoming-call__subtitle">
          {subtitleView(callRef.current!)}
        </div>
      ) : (
        <div className="cometchat-incoming-call__subtitle">
          <div
            className="cometchat-incoming-call__subtitle-icon"
            style={{ WebkitMask: `url(${getCallTypeIcon()}) center center no-repeat` }}
          />
          <div className="cometchat-incoming-call__subtitle-text">
            {subtitleText}
          </div>
        </div>
      )}
    </>
  }

  const ListItemTailView = () => {
    if (trailingView) {
      return trailingView(callRef.current!);
    }
    return <div className="cometchat-incoming-call__avatar">
      <CometChatAvatar
        image={callRef.current?.getSender()?.getAvatar()!}
        name={callRef.current?.getSender()?.getName()!}
      ></CometChatAvatar>
    </div>
  }

  useCometChatIncomingCall(
    loggedInUser,
    setLoggedInuser,
    call,
    attachListeners,
    removeListener,
    acceptCallButtonRef,
    rejectCallButtonRef,
    showCall,
    callRef,
    acceptIncomingCall,
    rejectIncomingCall,
    showIncomingCallScreen,
    subscribeToEvents,
    errorHandler
  );

  return (
    <>
      {callRef.current && showIncomingCallScreen ? (
        <div className="cometchat-incoming-call">
          {itemView ? itemView(callRef.current) : <CometChatListItem
            title={callRef.current?.getSender()?.getName()}
            subtitleView={ListItemSubtitleView()}
            trailingView={ListItemTailView()}
            leadingView={leadingView?.(callRef.current)}
            titleView={titleView?.(callRef.current)}
            avatarURL=""
          />}
          <div className="cometchat-incoming-call__button-group">
            <div className="cometchat-incoming-call__button-decline">
              <CometChatButton
                text={declineButtonTextRef.current}
                onClick={() => rejectIncomingCall(CometChatUIKitConstants.calls.rejected)}
              />
            </div>
            <div className="cometchat-incoming-call__button-accept">
              <CometChatButton
                text={acceptButtonTextRef.current}
                onClick={() => acceptIncomingCall()}
              />
            </div>
          </div>
        </div>
      ) : null}

      {showOngoingCallScreen && callRef.current && !showIncomingCallScreen ? (
        <CometChatOngoingCall
          sessionID={sessionIdRef.current}
          callSettingsBuilder={getCallBuilder()}
        ></CometChatOngoingCall>
      ) : null}
    </>
  );
};
export { CometChatIncomingCall };