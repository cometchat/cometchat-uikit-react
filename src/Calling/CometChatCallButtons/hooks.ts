import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect } from "react";

function Hooks(
    loggedInUser: any,
	setLoggedInUser: Function,
    user: any,
    group: any,
	subscribeToEvents: Function,
    onErrorCallback: Function,
    attachListeners: Function,
    removeListener: Function,
    setActiveUser: any,
    setActiveGroup: any,
    audioCallButtonRef: any,
    videoCallButtonRef: any,
    initiateAudioCall: Function,
    initiateVideoCall: Function,
    disableButtons: boolean,
    onVoiceCallClickRef : React.MutableRefObject<Function | undefined>,
    onVideoCallClickRef : React.MutableRefObject<Function | undefined>
) {
    useEffect(
        () => {
            CometChat.getLoggedinUser().then(
                (user: CometChat.User | null) => {
                    if(user){
                        setLoggedInUser(user);
                    }
                }, (error: CometChat.CometChatException) => {
                    onErrorCallback(error);
                }
            );
        }, []
    )
    
    useEffect(()=>{
        let unsubscribeFromEvents : () => void;
        if(loggedInUser){
            unsubscribeFromEvents = subscribeToEvents();
            attachListeners();
        }
        return () => {
            unsubscribeFromEvents?.();
            removeListener();
        }
    }, [loggedInUser])
    
    useEffect(
        () => {
            if(user){
                setActiveUser(user);
                setActiveGroup(null);
            }
        }, [user]
    )
    
    useEffect(
        () => {
            if(group){
                setActiveUser(null);
                setActiveGroup(group);
            }
        }, [group]
    )

    useEffect(
        () => {
            const audioCallButton = audioCallButtonRef.current;
            const videoCallButton = videoCallButtonRef.current;

            if(!audioCallButton && !videoCallButton) return;

            const audioCallButtonClicked = () => {
                const onVoiceCallClick = onVoiceCallClickRef.current;
                if (onVoiceCallClick) {
                    onVoiceCallClick();
                }
                else {
                    initiateAudioCall();
                }
            } 

            const videoCallButtonClicked = () => {
                const onVideoCallClick = onVideoCallClickRef.current;
                if (onVideoCallClick) {
                    onVideoCallClick();
                }
                else {
                    initiateVideoCall();
                }
            }

            if(!disableButtons){
                audioCallButton?.addEventListener("cc-button-clicked", audioCallButtonClicked);
                videoCallButton?.addEventListener("cc-button-clicked", videoCallButtonClicked);
            }else{
                audioCallButton?.removeEventListener("cc-button-clicked", audioCallButtonClicked);
                videoCallButton?.removeEventListener("cc-button-clicked", videoCallButtonClicked);
            }

            return () => {
                audioCallButton?.removeEventListener("cc-button-clicked", audioCallButtonClicked);
                videoCallButton?.removeEventListener("cc-button-clicked", videoCallButtonClicked);
            }
        }, [disableButtons, initiateAudioCall, initiateVideoCall, onVoiceCallClickRef, onVideoCallClickRef]
    )

}

export { Hooks };