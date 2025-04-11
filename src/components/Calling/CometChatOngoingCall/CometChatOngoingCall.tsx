import { useCallback, useRef, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useCometChatOngoingCall } from "./useCometChatOngoingCall";
import { CometChatUIKitCalls } from "../../../CometChatUIKit/CometChatCalls";
import { CallWorkflow } from "../../../Enums/Enums";
import { CometChatCallEvents } from "../../../events/CometChatCallEvents";

interface OngoingCallProps {
  /* Call settings builder for required call settings. */
  callSettingsBuilder?: typeof CometChatUIKitCalls.CallSettings;
  /* Session Id required for starting the call. */
  sessionID: string;
  /* Callback function which is triggered on any error occured. */
  onError?: Function;
  /* Workflow required for the call to specify the call type. */
  callWorkflow?: CallWorkflow;
}
const defaultProps: OngoingCallProps = {
  sessionID: "",
  callSettingsBuilder: undefined,
  onError: (error: CometChat.CometChatException) => {
    console.log(error);
  },
  callWorkflow: CallWorkflow.defaultCalling,
};

const CometChatOngoingCall = (props: OngoingCallProps) => {
  const [loggedInUser, setLoggedInuser] = useState<CometChat.User | null>(null);
  const callScreenFrameRef = useRef<HTMLDivElement | null>(null);
  const listenerId: string = "callListenerId_" + new Date().getMilliseconds()

  const {
    sessionID,
    callSettingsBuilder,
    onError,
    callWorkflow,
  } = { ...defaultProps, ...props };
  /* Callback function which is triggered on any error occured. */
  const onErrorCallback = useCallback(
    (error: any) => {
      if (!(error instanceof CometChat.CometChatException)) {
        let errorModel = {
          code: error?.code,
          name: error?.name,
          message: error?.message,
          details: error?.details,
        };
        let errorObj = new CometChat.CometChatException(errorModel);
        onError?.(errorObj);
      } else {
        onError?.(error);
      }
    },
    [onError]
  );

  /* This function updates and returns the call builder with required settings. */
  const getCallBuilder = useCallback((): any => {
    let callBuilder = callSettingsBuilder || new CometChatUIKitCalls.CallSettingsBuilder()
      .enableDefaultLayout(true)
      .setIsAudioOnlyCall(false);
    callBuilder.setCallListener(
      new CometChatUIKitCalls.OngoingCallListener({
        onCallEnded: () => {
          if (callWorkflow === CallWorkflow.defaultCalling) {
            CometChatUIKitCalls.endSession();
            CometChat.clearActiveCall();
            CometChatCallEvents.ccCallEnded.next(null as any)
          }
        },
        onCallEndButtonPressed: () => {
          if (callWorkflow === CallWorkflow.defaultCalling) {
            CometChat.endCall(sessionID)
              .then((call: CometChat.Call) => {
                CometChatUIKitCalls.endSession();
                CometChatCallEvents.ccCallEnded.next(call)
              })
              .catch((err: CometChat.CometChatException) => {
                onErrorCallback(err);
              });
          } else {
            CometChatCallEvents.ccCallEnded.next(null as any)
            CometChatUIKitCalls.endSession();
          }
        },
        onError: (error: any) => {
          onErrorCallback(error);
        },
      })
    );
    return callBuilder.build();
  }, [callSettingsBuilder, callWorkflow, onErrorCallback, sessionID]);

  /* Purpose of this function is to start the new call session from the auth token and session id provided. */
  const startCall = useCallback(() => {
    if (loggedInUser) {
      const authToken = loggedInUser!.getAuthToken();
      CometChatUIKitCalls.generateToken(sessionID, authToken).then(
        (res: any) => {
          CometChatUIKitCalls.startSession(
            res?.token,
            getCallBuilder(),
            callScreenFrameRef.current
          );
        },
        (err: any) => {
          onErrorCallback(err);
        }
      );
    } else {
      CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
        const authToken = user!.getAuthToken();
        CometChatUIKitCalls.generateToken(sessionID, authToken).then(
          (res: any) => {
            CometChatUIKitCalls.startSession(
              res?.token,
              getCallBuilder(),
              callScreenFrameRef.current
            );
          },
          (err: any) => {
            onErrorCallback(err);
          }
        );
      });
    }
  }, [sessionID, getCallBuilder, loggedInUser, onErrorCallback]);

  useCometChatOngoingCall(setLoggedInuser, sessionID, startCall);

  return sessionID !== "" ? (
    <div className="cometchat">
      <div
        className="cometchat-ongoing-call"
        ref={callScreenFrameRef}
      >
      </div>
    </div>
  ) : (
    <></>
  );
};

export { CometChatOngoingCall };
