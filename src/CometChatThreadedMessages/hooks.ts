import { CometChat } from "@cometchat-pro/chat";
import { useEffect } from "react";

function Hooks(
    loggedInUser: any,
    setLoggedInUser: any,
    addListener: Function,
	subscribeToEvents: Function,
    onErrorCallback: Function
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
        if(loggedInUser){
            const removeListener = addListener();
            const unsubscribeFromEvents = subscribeToEvents();
            return () => {
                removeListener();
                unsubscribeFromEvents();
            };
        }
    }, [loggedInUser, addListener, subscribeToEvents]);

}

export { Hooks };