import { CometChat } from "@cometchat-pro/chat";
import { useEffect } from "react";
import { CometChatUIKitConstants } from "uikit-resources-lerna";

function Hooks(
    loggedInUser: any,
	setLoggedInUser: any,
    call: CometChat.Call,
	subscribeToEvents: Function,
    attachListeners: Function,
    removeListener: Function,
    acceptCallButtonRef: any,
    rejectCallButtonRef: any,
    showCall: any,
    callRef: any,
    acceptIncomingCall: Function,
    rejectIncomingCall: Function,
    showIncomingCallScreen: boolean
) {
    useEffect(
        () => {
            CometChat.getLoggedinUser().then(
                (user: CometChat.User | null)=>{
                    if(user){
                        setLoggedInUser(user);
                    }
                }
            )
        }, []
    );

    useEffect(
        () => {
            let unsubscribeFromEvents : () => void;
            if(loggedInUser){
                unsubscribeFromEvents = subscribeToEvents();
                attachListeners();
            }
            return () => {
                removeListener();
                unsubscribeFromEvents?.();
            }
        }, [loggedInUser]
    )

    useEffect(
        () => {
            callRef.current = call;
            showCall(callRef.current);
        }, [call]
    )

    useEffect(
        () => {
            const acceptCallButton = acceptCallButtonRef?.current;
            const rejectCallButton = rejectCallButtonRef?.current;

            if(!acceptCallButton && !rejectCallButton) return;

            const acceptCall = () => {
                acceptIncomingCall();
            }
            const rejectCall = () => {
                rejectIncomingCall(CometChatUIKitConstants.calls.rejected);
            }
            
            if(showIncomingCallScreen){
                acceptCallButton?.addEventListener("cc-button-clicked", acceptCall);
                rejectCallButton?.addEventListener("cc-button-clicked", rejectCall);
            }else{
                acceptCallButton?.removeEventListener("cc-button-clicked", acceptCall);
                rejectCallButton?.removeEventListener("cc-button-clicked", rejectCall);
            }
            return () => {
                acceptCallButton?.removeEventListener("cc-button-clicked", acceptCall);
                rejectCallButton?.removeEventListener("cc-button-clicked", rejectCall);
            }
        }, [showIncomingCallScreen, acceptIncomingCall, rejectIncomingCall]
    );

}

export { Hooks };