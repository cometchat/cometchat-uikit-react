import React, { useEffect, JSX } from "react";
import { CometChat } from "@cometchat-pro/chat";

function Hooks(
    loggedInUser: any,
    setLoggedInUser: Function,
    subscribeToEvents: any,
    attachListeners: any,
    onErrorCallback: any,
    ccBackBtnElement: JSX.IntrinsicElements["cometchat-button"],
    onBackRef:  React.MutableRefObject<() => void>,
    setSubTitle: any
) {
    useEffect(
        () => {
            CometChat.getLoggedinUser().then(
                (userObject: CometChat.User | null) => {
                    if (userObject) {
                        setLoggedInUser(userObject);
                    }
                }, (error: CometChat.CometChatException) => {
                    onErrorCallback(error);
                }
            );
        },
        [setLoggedInUser, onErrorCallback]
    );

    useEffect(
        () => {
            setSubTitle();
        },
        [setSubTitle]
    );

    useEffect(()=>{
        const removeListenerFns : (() => void)[] = [];
        if(loggedInUser){
            removeListenerFns.push(subscribeToEvents());
            removeListenerFns.push(attachListeners());
        }
        return () => {
            for (let i = 0; i < removeListenerFns.length; i++) {
                return removeListenerFns[i]();
            }
        }
    }, [loggedInUser, attachListeners, subscribeToEvents]);

    useEffect(
        () => {
            if (!ccBackBtnElement) return;
            const eventName = "cc-button-clicked";
            const onBackClicked = () => onBackRef.current?.();
            ccBackBtnElement.addEventListener(eventName, onBackClicked);
            return () => {
                ccBackBtnElement.removeEventListener(eventName, onBackClicked);
            }
        },
        [ccBackBtnElement, onBackRef]
    );
}

export { Hooks };
