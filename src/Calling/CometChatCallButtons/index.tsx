import { CometChat } from "@cometchat-pro/chat";
import { useCallback, useRef, useState, useContext, CSSProperties } from "react";
import { CometChatCallEvents, CometChatLocalize, CometChatMessageEvents, CometChatUIKitConstants, localize } from "uikit-resources-lerna";
import { CallButtonsStyle, CometChatSoundManager, CometChatUIKitUtility, MessageStatus } from "uikit-utils-lerna";
import { CometChatOngoingCall } from "../CometChatOngoingCall";
import { CometChatOutgoingCall } from "../CometChatOutgoingCall";
import { Hooks } from "./hooks";
import { CometChatContext } from "../../CometChatContext";
import { CallButtonsWrapperStyle, VideoCallButtonStyle, VoiceCallButtonStyle, defaultCallsButtonStyle, getVideoCallButtonTint, getVoiceCallButtonTint, ongoingCallStyle, outgoingCallStyle } from "./style";
import AudioCall2xIcon from './assets/Audio-Call2x.svg';
import VideoCall2xIcon from './assets/VideoCall2xIcon.svg';
import { useRefSync } from "../../CometChatCustomHooks";

interface ICallButtonsProps {
    user?: CometChat.User,
    group?: CometChat.Group,
    voiceCallIconURL?: string,
    voiceCallIconText?: string,
    voiceCallIconHoverText?: string,
    videoCallIconURL?: string,
    videoCallIconText?: string,
    videoCallIconHoverText?: string,
    callButtonsStyle?: CallButtonsStyle,
    onVoiceCallClick?: Function,
    onVideoCallClick?: Function,
    onError?: Function
}

type ButtonStyle = CSSProperties & {
    buttonIconTint? : string,
    buttonTextFont? : string,
    buttonTextColor? : string
};

const defaultProps: ICallButtonsProps = {
    user: undefined,
    group: undefined,
    voiceCallIconURL: AudioCall2xIcon,
    voiceCallIconText: localize("VOICE_CALL"),
    voiceCallIconHoverText: localize("VOICE_CALL"),
    videoCallIconURL: VideoCall2xIcon,
    videoCallIconText: localize("VIDEO_CALL"),
    videoCallIconHoverText: localize("VIDEO_CALL"),
    callButtonsStyle: {
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "0",
        background: "transparent"
    },
    onVoiceCallClick: (user: CometChat.User, group: CometChat.Group) => {},
    onVideoCallClick: (user: CometChat.User, group: CometChat.Group) => {},
    onError: (error: CometChat.CometChatException) => { console.log(error); }
};

const CometChatCallButtons = (props: ICallButtonsProps) => {
    
    const {
        user,
        group,
        voiceCallIconURL,
        voiceCallIconText,
        voiceCallIconHoverText,
        videoCallIconURL,
        videoCallIconText,
        videoCallIconHoverText,
        callButtonsStyle,
        onVoiceCallClick,
        onVideoCallClick,
        onError
    } = props;

    const { theme } = useContext(CometChatContext);
    
    const [loggedInUser, setLoggedInuser] = useState(null);
    
    const callButtonStyleRef = useRef<CallButtonsStyle | null>(null);
    callButtonStyleRef.current = { ...defaultCallsButtonStyle(theme), ...callButtonsStyle};

    const voiceCallButtonStyleRef = useRef<ButtonStyle | null>(null);

    voiceCallButtonStyleRef.current = VoiceCallButtonStyle(callButtonStyleRef?.current);

    const videoCallButtonStyleRef = useRef<ButtonStyle | null>(null);

    videoCallButtonStyleRef.current = VideoCallButtonStyle(callButtonStyleRef?.current);

    const [activeUser, setActiveUser] = useState(user);
    const [activeGroup, setActiveGroup] = useState(group);
    const [showOngoingCall, setShowOngoingCall] = useState(false);
    const [showOutgoingCallScreen, setShowOutgoingCallScreen] = useState(false);
    const [disableButtons, setDisableButtons] = useState(false);

    const audioCallButtonRef = useRef(null);
    const videoCallButtonRef = useRef(null);
    const callRef = useRef<CometChat.Call | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    const onVoiceCallClickRef = useRefSync(onVoiceCallClick);
    const onVideoCallClickRef = useRefSync(onVideoCallClick);
    
    let callbuttonsListenerId: string = "callbuttons_" + new Date().getTime();

    const onErrorCallback = useCallback((error: any) => {
        if (!(error instanceof CometChat.CometChatException)) {
            let errorModel = {
                code: error?.code,
                name: error?.name,
                message: error?.message,
                details: error?.details
            }
            let errorObj = new CometChat.CometChatException(errorModel);
            onError?.(errorObj);
        } else {
            onError?.(error);
        }
    }, [onError]);

    const subscribeToEvents = useCallback(() => {
        try{
            const ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe(
                (call: CometChat.Call) => {
                    setDisableButtons(false);
                }
            )
            const ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe(
                (call: CometChat.Call) => {
                    setDisableButtons(true);
                }
            )
            const ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe(
                (call: CometChat.Call) => {
                    setDisableButtons(false);
                    callRef.current = null;
                    sessionIdRef.current = null;
                    setShowOngoingCall(false);
                    setShowOutgoingCallScreen(false);
                }
            )

            return () => {
                try{
                    ccCallEnded?.unsubscribe();
                    ccCallRejected?.unsubscribe();
                    ccOutgoingCall?.unsubscribe();
                }catch(e){
                    onErrorCallback(e);
                }
            }
        }catch(e){
            onErrorCallback(e);
        }
    }, [onErrorCallback])

    const attachListeners = useCallback(() => {
        try{
            CometChat.addCallListener(
                callbuttonsListenerId,
                new CometChat.CallListener({
                    onIncomingCallReceived: (call: CometChat.Call) => {
                        setDisableButtons(true);
                    },
                    onIncomingCallCancelled: (call: CometChat.Call) => {
                        setDisableButtons(false);
                    },
                    onOutgoingCallRejected: (call: CometChat.Call) => {
                        setShowOutgoingCallScreen(false);
                        setDisableButtons(false);
                        callRef.current = null;
                        sessionIdRef.current = null;
                    },
                    onOutgoingCallAccepted: (call: CometChat.Call) => {
                        setShowOutgoingCallScreen(false);
                        setShowOngoingCall(true);
                        setDisableButtons(true);
                        callRef.current = call;
                        sessionIdRef.current = call.getSessionId();
                    },
                })
            );
        }catch(e){
            onErrorCallback(e);
        }
    }, [onErrorCallback])

    const removeListener = useCallback(() => {
        try{
            CometChat.removeCallListener(callbuttonsListenerId);
        }catch(e){
            onErrorCallback(e);
        }
    }, [onErrorCallback])

    const getCallBuilder = () => {
        let audioOnlyCall: boolean = callRef.current?.getType() == CometChatUIKitConstants.MessageTypes.audio ? true : false;

        const sessionId = sessionIdRef.current;
        if (callRef.current?.getType() == CometChatUIKitConstants.calls.meeting || sessionId == null) {
            return;
        }

        return new CometChat.CallSettingsBuilder()
            .setSessionID(sessionId)
            .enableDefaultLayout(true)
            .setIsAudioOnlyCall(audioOnlyCall)
            .setMode(CometChatUIKitConstants.calls.default)
            .setLocalizedStringObject(CometChatLocalize.getLocale())
    }

    const initiateCall = useCallback((type: string) => {
        try{
            const receiverType: string = activeUser ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
            
            const receiverId: string | undefined = activeUser ? activeUser?.getUid() : activeGroup?.getGuid();
            
            const callObj: CometChat.Call = new CometChat.Call(receiverId, type, receiverType);
            
            CometChat.initiateCall(callObj).then(
                (outgoingCall: CometChat.Call) => {
                    callRef.current = outgoingCall;
                    setShowOutgoingCallScreen(true);
                    CometChatCallEvents.ccOutgoingCall.next(outgoingCall);
                }, (error: CometChat.CometChatException) => {
                    onErrorCallback(error);
                }
            )
        }catch(e){
            onErrorCallback(e);
        }
    }, [activeUser, activeGroup, onErrorCallback])

    const initiateAudioCall = useCallback(() => {
        try{
            if (activeUser) {
                initiateCall(CometChatUIKitConstants.MessageTypes.audio)
            }
        }catch(e){
            onErrorCallback(e);
        }
    }, [activeUser, initiateCall, onErrorCallback])
    
    const sendCustomMessage = useCallback(() => {
        try{
            const receiverType: string = activeUser ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group
            
            const receiverId: string | undefined = activeUser ? activeUser?.getUid() : activeGroup?.getGuid();
            const sessionID = sessionIdRef.current;

            const customData = { 
                "sessionID": sessionID, 
                "sessionId": sessionID, 
                "callType": CometChatUIKitConstants.MessageTypes.video 
            };

            const customType = CometChatUIKitConstants.calls.meeting;
            const conversationId = `group_${sessionID}`;

            const customMessage: any = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);

            customMessage.setSender(loggedInUser);
            customMessage.setMetadata({ incrementUnreadCount: true });
            customMessage.setReceiver((receiverType as any));
            customMessage.setConversationId(conversationId);
            customMessage.sentAt = CometChatUIKitUtility.getUnixTimestamp();
            customMessage.muid = CometChatUIKitUtility.ID();

            CometChatMessageEvents.ccMessageSent.next(
                { 
                    message: customMessage, 
                    status: MessageStatus.inprogress 
                }
            );

            CometChat.sendCustomMessage(customMessage).then(
                (msg) => {
                    CometChatMessageEvents.ccMessageSent.next({
                        message: msg,
                        status: MessageStatus.success
                    })
                }, (error: CometChat.CometChatException) => {
                    onErrorCallback(error);
                }
            );
        }catch(e){
            onErrorCallback(e);
        }
    }, [activeUser, activeGroup, loggedInUser, onErrorCallback])

    const initiateVideoCall = useCallback(() => {
        try{
            if (activeUser) {
                initiateCall(CometChatUIKitConstants.MessageTypes.video)
            }
            if (activeGroup){
                sessionIdRef.current = activeGroup?.getGuid();
                sendCustomMessage();
                setShowOngoingCall(true);
            }
        }catch(e){
            onErrorCallback(e);
        }
    }, [activeUser, activeGroup, sendCustomMessage, onErrorCallback])

    const cancelOutgoingCall = useCallback(() => {
        const call = callRef.current;
        if (!call) {
            return;
        }
        try{
            CometChatSoundManager.pause();
            CometChat.rejectCall(call.getSessionId(), CometChatUIKitConstants.calls.cancelled).then(
                (call: CometChat.Call) => {
                    setDisableButtons(false);
                    setShowOutgoingCallScreen(false);
                    CometChatCallEvents.ccCallRejected.next(call);
                    callRef.current = null;
                }, (error: CometChat.CometChatException) => {
                    onErrorCallback(error);
                }
            );
            setShowOutgoingCallScreen(false);
        }catch(e){
            onErrorCallback(e);
        }
    }, [onErrorCallback])

    const getVoiceCallButtonStyle = useCallback(() => {
        if (!voiceCallButtonStyleRef.current) {
            return;
        }
        voiceCallButtonStyleRef.current.buttonIconTint = getVoiceCallButtonTint(disableButtons, callButtonStyleRef.current ?? undefined, theme);
        return voiceCallButtonStyleRef.current;
    }, [disableButtons, callButtonsStyle])

    const getVideoCallButtonStyle = useCallback(() => {
        if (!videoCallButtonStyleRef.current) {
            return;
        }
        videoCallButtonStyleRef.current.buttonIconTint = getVideoCallButtonTint(disableButtons, callButtonStyleRef.current ?? undefined, theme);
        return videoCallButtonStyleRef.current;
    }, [disableButtons, callButtonsStyle])

    Hooks(
        loggedInUser,
        setLoggedInuser,
        user,
        group,
        subscribeToEvents,
        onErrorCallback,
        attachListeners,
        removeListener,
        setActiveUser,
        setActiveGroup,
        audioCallButtonRef,
        videoCallButtonRef,
        initiateAudioCall,
        initiateVideoCall,
        disableButtons,
        onVoiceCallClickRef,
        onVideoCallClickRef
    )

    const ccBtnDisabledPropSpreadObject = disableButtons ? {disabled: true} : {};

    return (
        <>
            <div className="cc-call-buttons__wrapper" style={CallButtonsWrapperStyle(callButtonStyleRef.current)}>
                <div className="cc-call-buttons" style={{display: 'flex', gap: '16px'}}>
                    {
                        activeUser ?
                        (
                            <cometchat-button
                                {...ccBtnDisabledPropSpreadObject} 
                                buttonStyle={JSON.stringify(getVoiceCallButtonStyle())}
                                text={voiceCallIconText} 
                                hoverText={voiceCallIconHoverText}
                                iconURL={voiceCallIconURL}
                                ref={audioCallButtonRef} 
                            />
                        ) : null
                    }
                    
                    {
                        activeUser || activeGroup ?
                        (
                            <cometchat-button 
                                {...ccBtnDisabledPropSpreadObject}
                                buttonStyle={JSON.stringify(getVideoCallButtonStyle())}
                                text={videoCallIconText} 
                                hoverText={videoCallIconHoverText}
                                iconURL={videoCallIconURL}
                                ref={videoCallButtonRef} 
                            />
                        ) 
                        : 
                        null
                    }
                </div>
            </div>

            {
                showOngoingCall && sessionIdRef.current != null ? 
                    <CometChatOngoingCall 
                        ongoingCallStyle={ongoingCallStyle(theme)} 
                        sessionID={sessionIdRef.current}
                        callSettingsBuilder={getCallBuilder()} 
                    /> :
                    null

            }

            {
                showOutgoingCallScreen && callRef.current ? 
                    <cometchat-backdrop>
                        <CometChatOutgoingCall
                            onCloseClicked={cancelOutgoingCall}
                            outgoingCallStyle={outgoingCallStyle}
                            call={callRef.current}
                        />
                    </cometchat-backdrop> : 
                    null
            }

        </>
    );
};

CometChatCallButtons.defaultProps = defaultProps;
export { CometChatCallButtons };