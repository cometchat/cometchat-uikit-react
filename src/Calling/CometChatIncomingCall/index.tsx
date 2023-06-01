import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import React, { useCallback, useRef, useState, useContext } from "react";
import { CometChatCallEvents, CometChatLocalize, CometChatUIKitConstants, localize } from "uikit-resources-lerna";
import { CometChatSoundManager, IncomingCallStyle, StorageUtils } from "uikit-utils-lerna";
import { CometChatOngoingCall } from "../CometChatOngoingCall";
import { Hooks } from "./hooks";
import { CometChatContext } from "../../CometChatContext";
import { AcceptButtonStyle, DeclineButtonStyle, IconStyle, IncomingCallButtonsStyle, IncomingCallLabelStyle, IncomingCallListItemStyle, IncomingCallSubtitleStyle, IncomingCallTailViewStyle, IncomingCallWrapperStyle, defaultAvatarStyle, defaultIncomingCallStyle, defaultListItemStyle, defaultOngoingCallStyle } from "./style";
import AudioCallIcon from './assets/Audio-Call.svg';
import VideoCallIcon from './assets/Video-call.svg';

interface IIncomingCallProps {
    call: CometChat.Call,
    disableSoundForCalls?: boolean,
    customSoundForCalls?: string,
    onAccept?: Function,
    onDecline?: Function,
    acceptButtonText?: string,
    declineButtonText?: string,
    subtitleView?: any,
    onError?: Function
    listItemStyle?: ListItemStyle,
    avatarStyle?: AvatarStyle,
    incomingCallStyle?: IncomingCallStyle
}

const CometChatIncomingCall = (props: IIncomingCallProps) => {
    
    const {
        call,
        disableSoundForCalls = false,
        customSoundForCalls = "",
        onAccept,
        onDecline,
        acceptButtonText = localize("ACCEPT"),
        declineButtonText = localize("DECLINE"),
        subtitleView = null,
        listItemStyle = {
            height: "100%",
            width: "100%"
        },
        avatarStyle = {
            borderRadius: "16px",
            width: "38px",
            height: "38px",
        },
        incomingCallStyle = {
            width: "fit-content",
            height: "fit-content",
        },
        onError = (error: CometChat.CometChatException) => { console.log(error); }
    } = props;

    const { theme } = useContext(CometChatContext);
    
    
    const [loggedInUser, setLoggedInuser] = useState<CometChat.User | null>(null);
    const [showIncomingCallScreen, setShowIncomingCallScreen] = useState(false);
    const [showOngoingCallScreen, setShowOngoingCallScreen] = useState(false);

    const listItemStyleRef = useRef<ListItemStyle | null>(null);
    const avatarStyleRef = useRef<AvatarStyle | null>(null);
    const incomingCallStyleRef = useRef<IncomingCallStyle | null>(null);
    const callRef = useRef<CometChat.Call | null>(null);
    const sessionIdRef = useRef("");
    const rejectCallButtonRef = useRef(null);
    const acceptCallButtonRef = useRef(null);

    callRef.current = call;

    avatarStyleRef.current = { ...defaultAvatarStyle(theme), ...avatarStyle };
    
    incomingCallStyleRef.current = { ...defaultIncomingCallStyle(theme), ...incomingCallStyle };

    listItemStyleRef.current = { ...defaultListItemStyle(incomingCallStyleRef?.current, theme), ...listItemStyle };

    const acceptButtonStyleRef = useRef({});

    acceptButtonStyleRef.current = AcceptButtonStyle(incomingCallStyleRef?.current)
    
    const declineButtonStyleRef = useRef({});

    declineButtonStyleRef.current = DeclineButtonStyle(incomingCallStyleRef?.current)

    const ongoingCallStyleRef = useRef({});
    ongoingCallStyleRef.current = { ...defaultOngoingCallStyle(theme) };

    const iconStyleRef = useRef<any>(null);

    iconStyleRef.current = IconStyle(incomingCallStyleRef?.current);
    
    let incomingcallListenerId: string = "incomingcall_" + new Date().getTime(),
        subtitleText: string = localize("INCOMING_CALL");

    const onErrorCallback = useCallback((error: any) => {
        if (!(error instanceof CometChat.CometChatException)) {
            let errorModel = {
                code: error?.code,
                name: error?.name,
                message: error?.message,
                details: error?.details
            }
            let errorObj = new CometChat.CometChatException(errorModel);
            onError!(errorObj);
        } else {
            onError!(error);
        }
    }, [onError]);

    const playAudio = useCallback(() => {
        try{
            CometChatSoundManager.pause();
            if (customSoundForCalls) {
                CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall, customSoundForCalls)
            } else {
                CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall)
            }
        }catch(e){
            onErrorCallback(e);
        }
    }, [customSoundForCalls, onErrorCallback])

    const isCallActive = useCallback((call: CometChat.Call) => {
        let isCurrentCall: boolean = false;
        try{
            if (StorageUtils.getItem(CometChatUIKitConstants.calls.activecall)) {
                let oldCall: any = StorageUtils.getItem(CometChatUIKitConstants.calls.activecall);
                if (oldCall && oldCall.sessionId == call.getSessionId()) {
                    isCurrentCall = true;
                } else {
                    isCurrentCall = false;
                }
            } else {
                isCurrentCall = false;
            }
            return isCurrentCall;
        }catch(e){
            onErrorCallback(e);
            return isCurrentCall;
        }
    }, [onErrorCallback])

    const rejectIncomingCall = useCallback((reason: string = CometChatUIKitConstants.calls.rejected) => {
        try{
            CometChatSoundManager.pause();
            if(onDecline){
                onDecline();
            }else if (typeof callRef?.current?.getSessionId() === "string") {
                CometChat.rejectCall(callRef?.current?.getSessionId(), reason).then(
                    (rejectedCall: CometChat.Call) => {
                        StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, rejectedCall);
                        CometChatCallEvents.ccCallRejected.next(rejectedCall);
                        setShowIncomingCallScreen(false);
                        setShowOngoingCallScreen(false);
                        callRef.current = null;
                    }, (error: CometChat.CometChatException) => {
                        onErrorCallback(error);
                    }
                );
            }
        }catch(e){
            onErrorCallback(e);
        }
    }, [onDecline, onErrorCallback])

    const showCall = useCallback((call: CometChat.Call) => {
        try{
            if (!isCallActive(call) && loggedInUser?.getUid() !== call?.getSender()?.getUid() && callRef.current) {
                if (!disableSoundForCalls) {
                    setTimeout(()=>{
                        playAudio();
                    })
                }
                callRef.current = call;
                setShowIncomingCallScreen(true);
            } else {
                CometChatSoundManager.pause();
                rejectIncomingCall(CometChatUIKitConstants.calls.busy);
            }
        }catch(e){
            onErrorCallback(e);
        }
        
    },[isCallActive, disableSoundForCalls, playAudio, rejectIncomingCall, onErrorCallback, loggedInUser])

    const localStorageChange = (event: any) => {
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
    };

    const subscribeToEvents = useCallback(() => {
        try{
            const ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe(
                (call: CometChat.Call) => {
                    setShowOngoingCallScreen(false);
                    callRef.current = null;
                    sessionIdRef.current = "";
                }
            )

            return () => {
                try {
                    ccCallEnded?.unsubscribe();
                } catch (error: any) {
                    onErrorCallback(error);
                }
            }
        }catch(e){
            onErrorCallback(e);
        }
    }, [onErrorCallback])

    const attachListeners = useCallback(() => {
        try{
            StorageUtils.attachChangeDetection(localStorageChange);
            CometChat.addCallListener(
                incomingcallListenerId,
                new CometChat.CallListener({
                    onIncomingCallReceived: (call: CometChat.Call) => {
                        callRef.current = call;
                        showCall(call);
                    },
                    onIncomingCallCancelled: (call: CometChat.Call) => {
                        CometChatSoundManager.pause();
                        callRef.current = null;
                        setShowIncomingCallScreen(false);
                    },
                })
            );
        }catch(e){
            onErrorCallback(e);
        }
    }, [localStorageChange, showCall, onErrorCallback])

    const removeListener = useCallback(() => {
        try{
            StorageUtils.detachChangeDetection(localStorageChange);
            CometChat.removeCallListener(incomingcallListenerId);
        }catch(e){
            onErrorCallback(e);
        }
    }, [localStorageChange, onErrorCallback])

    const checkForActiveCallAndEndCall = useCallback(() => {
        try{
            let call: CometChat.Call = CometChat.getActiveCall();
            return new Promise((resolve, reject) => {
                if (!call) {
                    return resolve({ success: true });
                }
                let sessionID = call?.getSessionId();
                CometChat.endCall(sessionID).then(
                    (response: CometChat.Call | null) => {
                        return resolve(response);
                    }, (error: CometChat.CometChatException) => {
                        return reject(error);
                    }
                );
            });
        }catch(e){
            onErrorCallback(e);
        }
    }, [onErrorCallback]);
    
    const acceptIncomingCall = useCallback(() => {
        try{
            CometChatSoundManager.pause();
            if(onAccept){
                onAccept();
            }else{
                checkForActiveCallAndEndCall()?.then(
                    (response) => {
                        CometChat.acceptCall(call!.getSessionId()).then(
                            (call: CometChat.Call) => {
                                CometChatCallEvents.ccCallAccepted.next(call);
                                StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, call);
                                setShowOngoingCallScreen(true);
                                callRef.current = call;
                                sessionIdRef.current = call?.getSessionId();
                                setShowIncomingCallScreen(false);
                            }, (error: CometChat.CometChatException) => {
                                onErrorCallback(error);
                            }
                        );
                    }, (error: CometChat.CometChatException) => {
                        onErrorCallback(error);
                    }
                );
            }
        }catch(e){

        }
    }, [checkForActiveCallAndEndCall, onErrorCallback, onAccept])

    const getCallBuilder = () => {
        let audioOnlyCall: boolean = callRef.current?.getType() == CometChatUIKitConstants.MessageTypes.audio ? true : false
        return new CometChat.CallSettingsBuilder()
            .setSessionID(sessionIdRef.current)
            .enableDefaultLayout(true)
            .setIsAudioOnlyCall(audioOnlyCall)
            .setMode(CometChat.CALL_MODE.DEFAULT)
            .setLocalizedStringObject(CometChatLocalize.getLocale())
    }

    const getCallTypeIcon = () => {
        if (callRef.current?.getType() == CometChatUIKitConstants.MessageTypes.audio) {
            return AudioCallIcon;
        } else {
            return VideoCallIcon;
        }
    }

    Hooks(
        loggedInUser,
        setLoggedInuser,
        call,
        subscribeToEvents,
        attachListeners,
        removeListener,
        acceptCallButtonRef,
        rejectCallButtonRef,
        showCall,
        callRef,
        acceptIncomingCall,
        rejectIncomingCall,
        showIncomingCallScreen
    )

    return (
        <>
            {
                callRef.current && showIncomingCallScreen ?
                    <div className="cc-incomingcall__wrapper" style={IncomingCallWrapperStyle(incomingCallStyleRef?.current)}>
                        <div className="cc-incomingcall__listitem" style={IncomingCallListItemStyle}>
                            <cometchat-list-item title={call?.getSender()?.getName()} listItemStyle={JSON.stringify(listItemStyleRef.current)} hideSeparator={true}>
                                {
                                    subtitleView ? 
                                        <div slot="subtitleView" className="cc-incomingcall__subtitleview">
                                            {subtitleView}
                                        </div> :
                                        <div slot="subtitleView" className="cc-incomingcall__subtitleview" style={IncomingCallSubtitleStyle}>
                                            <div className="cc-call__icon">
                                                <cometchat-icon iconStyle={JSON.stringify(iconStyleRef.current)} URL={getCallTypeIcon()}></cometchat-icon>
                                            </div>
                                            <cometchat-label className="cc-call__type" text={subtitleText} labelStyle={JSON.stringify(IncomingCallLabelStyle(incomingCallStyleRef?.current))}></cometchat-label>
                                        </div>
                                }

                                <div slot="tailView"  className="cc-incomingcall__tailview" style={IncomingCallTailViewStyle}>
                                    <div className="tail__view">
                                        <div className="cc-incomingcall__avatar">
                                            <cometchat-avatar avatarStyle={JSON.stringify(avatarStyleRef.current)} image={call?.getSender()?.getAvatar()} name={call?.getSender()?.getName()}></cometchat-avatar>
                                        </div>
                                    </div>
                                </div>

                            </cometchat-list-item>
                        </div>
                        <div className="cc-incomingcall-buttons" style={IncomingCallButtonsStyle}>
                            <cometchat-button ref={rejectCallButtonRef} buttonStyle={JSON.stringify(declineButtonStyleRef.current)} text={declineButtonText}></cometchat-button>
                            <cometchat-button ref={acceptCallButtonRef} buttonStyle={JSON.stringify(acceptButtonStyleRef.current)} text={acceptButtonText}></cometchat-button>
                        </div>
                    </div> :
                    null    
            }

            {
                showOngoingCallScreen && callRef.current && !showIncomingCallScreen ?
                    <CometChatOngoingCall ongoingCallStyle={ongoingCallStyleRef.current} sessionID={sessionIdRef.current} callSettingsBuilder={getCallBuilder()}></CometChatOngoingCall> :
                    null
            }
            
        </>
    );
};

export { CometChatIncomingCall };