import { isMissedCall, isSentByMe, verifyCallUser } from "../Utils/utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatList } from "../../BaseComponents/CometChatList/CometChatList";
import { CometChatListItem } from "../../BaseComponents/CometChatListItem/CometChatListItem";
import { useCometChatCallLogs } from "./useCometChatCallLogs";
import {
  CallWorkflow,
  MessageStatus,
  States,
} from "../../../Enums/Enums";
import { CometChatLocalize, getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIKitCalls } from "../../../CometChatUIKit/CometChatCalls";
import { CometChatDate } from "../../BaseComponents/CometChatDate/CometChatDate";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { CometChatOutgoingCall } from "../CometChatOutgoingCall/CometChatOutgoingCall";
import { CometChatOngoingCall } from "../CometChatOngoingCall/CometChatOngoingCall";
import { CometChatMessageEvents } from "../../../events/CometChatMessageEvents";
import { CometChatCallEvents } from "../../../events/CometChatCallEvents";
import emptyIcon from "../../../assets/call-logs_empty_state.svg";
import emptyIconDark from "../../../assets/call-logs_empty_state_dark.svg";
import errorIcon from "../../../assets/list_error_state_icon.svg"
import errorIconDark from "../../../assets/list_error_state_icon_dark.svg"
import { getThemeMode, sanitizeCalendarObject } from "../../../utils/util";
import { useCometChatErrorHandler } from "../../../CometChatCustomHooks";
import { CalendarObject } from "../../../utils/CalendarObject";
import { JSX } from 'react';
interface CallLogsProps {
  /**
   * Object representing the active call that is currently selected.
   */
  activeCall?: any;

  /**
   * Allows filtering and customizing call logs using available parameters.
   * @defaultValue Default request builder having the limit set to 30.
   */
  callLogRequestBuilder?: any;

  /**
  *  Format for displaying the call initiation time in call logs.
  */
  callInitiatedDateTimeFormat?: CalendarObject,
  /**
   * Callback function triggered when a call log list item is clicked.
   * @returns void
   */
  onItemClick?: (call:any)=>void;

  /**
   * Callback function triggered when the call button in the trailing view is clicked.
   * @returns void
   */
  onCallButtonClicked?: (call:any)=>void;

  /**
   * Callback function triggered when the component encounters an error.
   * 
   * @param error - An instance of CometChat.CometChatException representing the error.
   * @returns void
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * A custom view to display when call logs are being loaded.
   */
  loadingView?: JSX.Element;

  /**
   * A custom view to display when no call logs are available.
   */
  emptyView?: JSX.Element;

  /**
   * A custom view to display when an error occurs while fetching the call logs.
   */
  errorView?: JSX.Element;

  /**
   * A function that renders a JSX element to display the item view.
   *
   * @param call - An instance of `any` representing the CallLog.
   * @returns A JSX element to be rendered as the item view.
   */
  itemView?: (call: any) => JSX.Element;

  /**
   * A function that renders a JSX element to display the leading view.
   *
   * @param call - An instance of `any` representing the callLog.
   * @returns A JSX element to be rendered as the leading view.
   */
  leadingView?: (call: any) => JSX.Element;

  /**
   * A function that renders a JSX element to display the title view.
   *
   * @param call - An instance of `any` representing the callLog.
   * @returns A JSX element to be rendered as the title view.
   */
  titleView?: (call: any) => JSX.Element;

  /**
   * A function that renders a JSX element to display the subtitle view.
   *
   * @param call - An instance of `any` representing the callLog.
   * @returns A JSX element to be rendered as the subtitle view.
   */
  subtitleView?: (call: any) => JSX.Element;

  /**
   * A function that renders a JSX element to display the trailing view.
   *
   * @param call - An instance of `any` representing the callLog.
   * @returns A JSX element to be rendered as the trailing view.
   */
  trailingView?: (call: any) => JSX.Element;
  /**
   * Controls the visibility of the scrollbar in the list.
   * @defaultValue `false`
   */
  showScrollbar?: boolean;
}

const defaultProps: CallLogsProps = {
  itemView: undefined,
  subtitleView: undefined,
  trailingView: undefined,
  emptyView: undefined,
  errorView: undefined,
  loadingView: undefined,
  callLogRequestBuilder: undefined,
  onItemClick: undefined,
  onCallButtonClicked: undefined,
  onError: (error: CometChat.CometChatException) => {
    console.log(error);
  },
  activeCall: undefined,
  showScrollbar:false

};

const CometChatCallLogs = (props: CallLogsProps) => {
  const {
    itemView,
    subtitleView,
    leadingView,
    titleView,
    trailingView,
    errorView,
    emptyView,
    loadingView,
    activeCall,
    callLogRequestBuilder,
    onItemClick,
    onCallButtonClicked,
    onError,
    callInitiatedDateTimeFormat,
    showScrollbar
  } = { ...defaultProps, ...props, };
  const titleRef = useRef<string>(getLocalizedString("call_logs_title"));

  const [callList, setCallList] = useState<any[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [callListState, setCallListState] = useState(States.loading);

  const [showOutgoingCallScreen, setShowOutgoingCallScreen] = useState(false);
  const [callInitiated, setCallInitiated] = useState<
    CometChat.Call | undefined
  >(undefined);
  const [call, setCall] = useState<CometChat.Call | undefined>(undefined);
  const [sessionId, setSessionId] = useState(null);
  const [showOngoingCall, setShowOngoingCall] = useState(false);

  const listenerId = "callLogsScreen_" + new Date().getTime();
  const requestBuilder = useRef<any>(null);

  const initiatedCallRef = useRef<CometChat.Call | undefined>(undefined);
  initiatedCallRef.current = callInitiated;

  const onErrorCallback = useCometChatErrorHandler(onError);

  /**
   * Sets up the CallLogRequestBuilder or creates a new one if not provided.
   */
  const setCallLogRequestBuilder = useCallback((): any => {
    try {
      if (callLogRequestBuilder) {
        return callLogRequestBuilder.build();
      } else {
        const authToken = loggedInUser!.getAuthToken();
        return new CometChatUIKitCalls.CallLogRequestBuilder()
          .setLimit(30)
          .setCallCategory("call")
          .setAuthToken(authToken)
          .build();
      }
    } catch (e) {
      onErrorCallback(e, 'setCallLogRequestBuilder');
    }
  }, [callLogRequestBuilder, loggedInUser, onErrorCallback]);

  /**
   * Fetches the next set of call logs using the request builder.
   *
   * @returns A list of fetched call logs.
   */
  const fetchNextCallList = useCallback(async (): Promise<any[]> => {
    try {
      const calls = await requestBuilder?.current?.fetchNext();
      return calls;
    } catch (e) {
      onErrorCallback(e, 'fetchNextCallList');
      throw e;
    }
  }, [requestBuilder, onErrorCallback]);

  /**
   * Fetches and updates the call list.
   */
  const getCallList = useCallback(async () => {
    try {
      const calls = await fetchNextCallList();
      if (calls && calls.length) {
        setCallList((prevCallList) => {
          return [...prevCallList, ...calls];
        });
        setCallListState(States.loaded);
      } else {
        if (callList.length === 0) {
          setCallListState(States.empty);
        }
      }
    } catch (e) {
      if (callList.length === 0) {
        setCallListState(States.error);
      }
      onErrorCallback(e, 'getCallList');
    }
  }, [
    fetchNextCallList,
    callList,
    setCallList,
    setCallListState,
    onErrorCallback,
  ]);

  /**
   * Cancels an outgoing call and sends a rejection request to the server.
   */
  const cancelOutgoingCall = useCallback(() => {
    CometChat.rejectCall(
      call?.getSessionId()!,
      CometChatUIKitConstants.calls.cancelled
    )
      .then(() => {
        setCall(undefined);
        setShowOutgoingCallScreen(false);
        CometChatMessageEvents.ccMessageSent.next({
          message: call!,
          status: MessageStatus.success,
        });
      })
      .catch((error: CometChat.CometChatException) => {
        setShowOutgoingCallScreen(false);
        onErrorCallback(error, 'cancelOutgoingCall');
      });
  }, [call, setCall, setShowOutgoingCallScreen, onErrorCallback]);

  /**
   * Initiates a new call of a specified type (audio or video) to the given user.
   *
   * @param type - The type of call (audio or video).
   * @param uid - The user ID of the call receiver.
   */
  const initiateCall = useCallback(
    (type: string, uid: string) => {
      const receiverType: string =
        CometChatUIKitConstants.MessageReceiverType.user;
      const receiverId: string = uid;
      let callType: string = "";
      if (type === CometChat.CALL_TYPE.VIDEO) {
        callType = CometChat.CALL_TYPE.VIDEO;
      } else {
        callType = CometChat.CALL_TYPE.AUDIO;
      }
      const callTmp: CometChat.Call = new CometChat.Call(
        receiverId,
        callType,
        receiverType
      );
      CometChat.initiateCall(callTmp)
        .then((outgoingCall: CometChat.Call) => {
          setCallInitiated(outgoingCall);
          setCall(outgoingCall);
          setShowOutgoingCallScreen(true);
          CometChatMessageEvents.ccMessageSent.next({
            message: outgoingCall,
            status: MessageStatus.inprogress,
          });
        })
        .catch((error: CometChat.CometChatException) => {
          onErrorCallback(error, 'initiateCall');
        });
    },
    [setCall, setShowOutgoingCallScreen, onErrorCallback, setCallInitiated]
  );

  /**
   * Handles click events on a call item and either invokes `onItemClick` or initiates a call.
   *
   * @param call - The selected call item.
   */
  const handleItemClick = useCallback(
    (call: any) => {
      try {
        if (onItemClick) {
          onItemClick(call);
        }
      } catch (e) {
        onErrorCallback(e, 'handleItemClick');
      }
    },
    [onItemClick, onErrorCallback]
  );

  /**
   * Handles click events on the info icon of a call item and either invokes `onCallButtonClicked` or initiates a call.
   *
   * @param call - The selected call item.
   */
  const handleInfoClick = useCallback(
    (call: any) => {
      try {
        if (onCallButtonClicked) {
          onCallButtonClicked(call);
        } else {
          const entity = verifyCallUser(call, loggedInUser!);
          if (entity.uid) {
            initiateCall(call?.type, entity.uid);
          }
        }
      } catch (e) {
        onErrorCallback(e, 'handleInfoClick');
      }
    },
    [onCallButtonClicked, onErrorCallback, loggedInUser, initiateCall]
  );

  /**
   * Determines if the provided call matches the active call.
   *
   * @param call - The call to check.
   * @returns Whether the call matches the active call.
   */
  const getActiveCall = useCallback(
    (call: any) => {
      try {
        if (activeCall) {
          if (activeCall.getSessionID() === call.getSessionID()) {
            return true;
          }
        }
        return false;
      } catch (e) {
        onErrorCallback(e, 'getActiveCall');
        return false;
      }
    },
    [activeCall, onErrorCallback]
  );

  /**
   * Opens the ongoing call screen for the provided call object.
   *
   * @param callObj - The ongoing call object.
   */
  const openOngoingCallScreen = useCallback(
    (callObj: any) => {
      try {
        setShowOutgoingCallScreen(false);
        setCall(callObj);
        setSessionId(callObj?.getSessionId());
        setShowOngoingCall(true);
      } catch (e) {
        onErrorCallback(e, 'openOngoingCallScreen');
      }
    },
    [setShowOutgoingCallScreen, setCall, setSessionId, setShowOngoingCall]
  );

  /**
   * Attaches call listeners for handling outgoing call events.
   */
  const attachListeners = useCallback(() => {
    try {
      CometChat.addCallListener(
        listenerId,
        new CometChat.CallListener({
          onOutgoingCallRejected: (callObj: CometChat.Call) => {
            if (
              initiatedCallRef.current &&
              callObj.getSessionId() == initiatedCallRef.current.getSessionId()
            ) {
              setCall(undefined);
              setShowOutgoingCallScreen(false);
              setShowOngoingCall(false);
              setCallInitiated(undefined);
            }
          },
          onOutgoingCallAccepted: (callObj: CometChat.Call) => {
            if (
              initiatedCallRef.current &&
              callObj.getSessionId() == initiatedCallRef.current.getSessionId()
            ) {
              setCall(undefined);
              openOngoingCallScreen(callObj);
              setShowOutgoingCallScreen(false);
              setCallInitiated(undefined);
            }
          },
        })
      );
    } catch (e) {
      onErrorCallback(e, 'attachListeners');
    }
  }, [listenerId, openOngoingCallScreen, onErrorCallback]);

  /**
   * Closes the ongoing call screen by resetting the session and call-related states.
   *
   * @callback closeCallScreen
   * @returns {void}
   */
  const closeCallScreen = useCallback(() => {
    setShowOngoingCall(false);
    setSessionId(null);
    setCall(undefined);
  }, [setShowOngoingCall, setSessionId, setCall]);

  /**
   * Subscribes to call-related events. If a call ends, it triggers the closing of the call screen.
   *
   * @callback subscribeToEvents
   * @returns {void}
   */
  const subscribeToEvents = useCallback(() => {
    try {
      const ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe(
        () => {
          closeCallScreen();
        }
      );

      return () => {
        try {
          ccCallEnded?.unsubscribe();
        } catch (error: any) {
          onErrorCallback(error, 'subscribeToEvents');
        }
      }
    } catch (e) {
      onErrorCallback(e, 'subscribeToEvents');
    }
  }, [closeCallScreen, onErrorCallback])

  /**
   * Detaches the call listeners by removing the call listener with the provided listener ID.
   *
   * @callback detachListeners
   * @returns {void}
   */
  const detachListeners = useCallback(() => {
    try {
      CometChat.removeCallListener(listenerId);
    } catch (e) {
      onErrorCallback(e, 'detachListeners');
    }
  }, [listenerId, onErrorCallback]);
   /**
    * Function for displaying the call initiation time in call logs.
    * @returns CalendarObject
     */
   function getDateFormat():CalendarObject{
    const defaultFormat = {
      yesterday: `DD MMM, hh:mm A`,
      otherDays: `DD MMM, hh:mm A`,
      today: `DD MMM, hh:mm A`
    };

        var globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject)
        var componentCalendarFormat = sanitizeCalendarObject(callInitiatedDateTimeFormat)
        
          const finalFormat = {
            ...defaultFormat,
            ...globalCalendarFormat,
            ...componentCalendarFormat
          };
          return finalFormat;
  }

  /**
   * Creates a subtitle view for the default list item view
   */
  const getListItemSubtitleView = useCallback(
    (item: any): JSX.Element => {
      try {
        const missedCall = isMissedCall(item, loggedInUser!);
        const isCallSentByMe = isSentByMe(item, loggedInUser!)

        if (subtitleView) {
          return <>{subtitleView(item)}</>;
        }

        const iconClass = isCallSentByMe
        ? "cometchat-call-logs__list-item-subtitle-icon-outgoing-call" :
        missedCall ? "cometchat-call-logs__list-item-subtitle-icon-missed-call"
          : "cometchat-call-logs__list-item-subtitle-icon-incoming-call";

        return (
          <>
            <div className={`cometchat-call-logs__list-item-subtitle`}>
              <div
                className={`cometchat-call-logs__list-item-subtitle-icon ${iconClass}`}
              />
              <div className="cometchat-call-logs__list-item-subtitle-text">
                {" "}
                <CometChatDate
                  timestamp={item.initiatedAt}
                  calendarObject={getDateFormat()}
                />
              </div>
            </div>
          </>
        );
      } catch (e) {
        onErrorCallback(e, 'getListItemSubtitleView');
        return <></>;
      }
    },
    [subtitleView, loggedInUser]
  );

  /**
   * Creates a tail view for the default list item view
   */
  const getListItemTailView = useCallback(
    (item: any): JSX.Element => {
      try {
        const callType = item.type;
        if (trailingView) {
          return <>{trailingView(item)}</>;
        }
        return (
          <div
            className={`cometchat-call-logs__list-item-trailing-view
          ${callType === CometChat.CALL_TYPE.VIDEO ? "cometchat-call-logs__list-item-trailing-view-video" : "cometchat-call-logs__list-item-trailing-view-audio"}`}
            onClick={(e) => {
              if (e.stopPropagation) {
                e.stopPropagation();
              }
              handleInfoClick?.(item)
            }}
          />
        );
      } catch (e) {
        onErrorCallback(e, 'getListItemTailView');
        return <></>;
      }
    },
    [trailingView, onCallButtonClicked, handleInfoClick]
  );

  /**
   * Creates `listItem` prop of the `CometChatList` component
   */
  const getListItem = useMemo(() => {
    return function (item: any, index: number): any {
      try {
        const isActive = activeCall?.getSessionID() === item?.getSessionID()

        if (itemView) {
          return itemView(item);
        } else {
          return (
            <div className={`cometchat-call-logs__list-item ${isActive ? "cometchat-call-logs__list-item-active" : ""}`} key={String(index)}>
              <CometChatListItem

                title={verifyCallUser(item, loggedInUser!)?.getName()}
                avatarURL={
                  verifyCallUser(item, loggedInUser!)?.avatar ||
                  verifyCallUser(item, loggedInUser!)?.icon
                }
                avatarName={verifyCallUser(item, loggedInUser!)?.getName()}
                onListItemClicked={(e) => onItemClick && onItemClick?.(item)}
                subtitleView={getListItemSubtitleView(item)}
                trailingView={getListItemTailView(item)}
                titleView={titleView?.(item)}
                leadingView={leadingView?.(item)}
              />
            </div>
          );
        }
      } catch (e) {
        onErrorCallback(e, 'getListItem');
      }
    };
  }, [
    itemView,
    loggedInUser,
    getActiveCall,
    getListItemSubtitleView,
    getListItemTailView,
    handleItemClick,
  ]);

  /**
   * Renders the loading state view with shimmer effect
   *
   * @remarks
   * If a custom `loadingView` is provided, it will be used. Otherwise, the default shimmer effect is displayed.
   *
   * @returns A JSX element representing the loading state
   */
  const getLoadingView = () => {
    try {
      if (loadingView) {
        return loadingView;
      }
      return (
        <div className='cometchat-call-logs__shimmer'>
          {[...Array(15)].map((_, index) => (
            <div key={index} className='cometchat-call-logs__shimmer-item'>
              <div className='cometchat-call-logs__shimmer-item-avatar'></div>
              <div className='cometchat-call-logs__shimmer-item-body'>
                <div className='cometchat-call-logs__shimmer-item-body-title-wrapper'>
                  <div className='cometchat-call-logs__shimmer-item-body-title'></div>
                  <div className='cometchat-call-logs__shimmer-item-body-subtitle'></div>
                </div>

                <div className='cometchat-call-logs__shimmer-item-body-tail'></div>
              </div>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      onErrorCallback(e, 'getLoadingView');
    }
  };

  /**
   * Renders the empty state view when there are no call-logs to display
   *
   * @remarks
   * If a custom `emptyView` is provided, it will be used. Otherwise, a default empty state view with a message is displayed.
   *
   * @returns A JSX element representing the empty state
   */
  const getEmptyView = () => {
    try {
      const isDarkMode = getThemeMode() == "dark" ? true : false;

      if (emptyView) {
        return emptyView;
      }
      return (
        <div className='cometchat-call-logs__empty-state-view'>
          <div className='cometchat-call-logs__empty-state-view-icon'>
            <img src={isDarkMode ? emptyIconDark : emptyIcon} alt="" />
          </div>
          <div className='cometchat-call-logs__empty-state-view-body'>
            <div className='cometchat-call-logs__empty-state-view-body-title'>
              {getLocalizedString("call_logs_empty_title")}
            </div>
            <div className='cometchat-call-logs__empty-state-view-body-description'>
              {getLocalizedString("call_logs_empty_subtitle")}
            </div>
          </div>
        </div>
      );
    } catch (e) {
      onErrorCallback(e, 'getEmptyView');
    }
  };

  /**
   * Renders the error state view when an error occurs
   *
   * @remarks
   * If a custom `errorView` is provided, it will be used. Otherwise, a default error message is displayed.
   *
   * @returns A JSX element representing the error state
   */
  const getErrorView = () => {
    try {
      const isDarkMode = getThemeMode() == "dark" ? true : false;


      if (errorView) {
        return errorView;
      }

      return (
        <div className='cometchat-call-logs__error-state-view'>
          <div className='cometchat-call-logs__error-state-view-icon'>
            <img src={isDarkMode ? errorIconDark : errorIcon} alt="" />
          </div>
          <div className='cometchat-call-logs__error-state-view-body'>
            <div className='cometchat-call-logs__error-state-view-body-title'>
              {getLocalizedString("call_logs_error_title")}
            </div>
            <div className='cometchat-call-logs__error-state-view-body-description'>
              {getLocalizedString("call_logs_error_subtitle")}
            </div>
          </div>
        </div>
      );
    } catch (e) {
      onErrorCallback(e, 'getErrorView');
    }
  };

  useCometChatCallLogs(
    loggedInUser,
    setLoggedInUser,
    requestBuilder,
    setCallLogRequestBuilder,
    getCallList,
    attachListeners,
    subscribeToEvents,
    detachListeners,
    onErrorCallback
  );

  /* This function updates and returns the call builder with required configs and listeners attached. */
  function getCallBuilder(): typeof CometChatUIKitCalls.CallSettings {
    let audioOnlyCall: boolean =
      call?.getType() === CometChatUIKitConstants.MessageTypes.audio
        ? true
        : false
    let callsBuilder = new CometChatUIKitCalls.CallSettingsBuilder()
      .enableDefaultLayout(true)
      .setIsAudioOnlyCall(audioOnlyCall);

    const sessionID = sessionId;
    callsBuilder.setCallListener(
      new CometChatUIKitCalls.OngoingCallListener({
        onCallEnded: () => {
          CometChatUIKitCalls.endSession();
          CometChat.clearActiveCall();
          CometChatCallEvents.ccCallEnded.next(null as any);
          closeCallScreen();
        },
        onCallEndButtonPressed: () => {
          CometChat.endCall(sessionID!)
            .then((call: CometChat.Call) => {
              CometChatUIKitCalls.endSession();
              CometChatCallEvents.ccCallEnded.next(call);
              closeCallScreen()
            })
            .catch((err: CometChat.CometChatException) => {
              onErrorCallback(err, 'getCallBuilder');
            });
        },
        onError: (error: unknown) => {
          onErrorCallback(error, 'getCallBuilder');
        },
      })
    );
    return callsBuilder;

  }


  return (
    <div className='cometchat' style={{ width: "100%", height: "100%" }}>
      <div className={`cometchat-call-logs ${!showScrollbar ? "cometchat-call-logs-hide-scrollbar" : ""}`}>
        {showOutgoingCallScreen ? (
          <div className='cometchat-call-logs__outgoing-call'>
            <CometChatOutgoingCall
              call={call!}
              onCallCanceled={cancelOutgoingCall}
            />
          </div>
        ) : null}

        {showOngoingCall ? (
          <div className='cometchat-call-logs__ongoing-call'>
            <CometChatOngoingCall
              sessionID={sessionId!}
              callWorkflow={CallWorkflow.defaultCalling}
              callSettingsBuilder={getCallBuilder()}
            />
          </div>

        ) : null}

        <CometChatList
          showScrollbar={showScrollbar}
          title={titleRef.current}
          hideSearch={true}
          list={callList}
          onScrolledToBottom={getCallList}
          listItemKey='getSessionID'
          itemView={getListItem}
          emptyView={getEmptyView()}
          errorView={getErrorView()}
          loadingView={getLoadingView()}
          state={callListState}
          showSectionHeader={false}
        />
      </div>
    </div>
  );
};

export { CometChatCallLogs };
