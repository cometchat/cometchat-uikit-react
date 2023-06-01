import { CometChat } from "@cometchat-pro/chat";
import { useEffect } from "react";

function Hooks(
    loggedInUser: any,
	setLoggedInUser: Function,
	subscribeToEvents: Function,
    onErrorCallback: Function,
    setActiveChat: any,
    user: any,
    group: any
) {
    useEffect(
        () => {
            CometChat.getLoggedinUser().then(
                (user) => {
                    setLoggedInUser(user);
                },
                (error: CometChat.CometChatException) => {
                    onErrorCallback(error);
                }
            );
        },
        [setLoggedInUser, onErrorCallback]
    );

    useEffect(()=>{
        let unsubscribeFromEvents : () => void;
        if(loggedInUser){
            unsubscribeFromEvents = subscribeToEvents();
            setActiveChat();
        }
        return () => {
            unsubscribeFromEvents?.();
        }
    }, [loggedInUser, user, group, setActiveChat, subscribeToEvents]);
}

export { Hooks };