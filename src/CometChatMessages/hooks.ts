import { useEffect } from "react";
import { CometChat } from "@cometchat-pro/chat";

function Hooks(
    loggedInUser: any,
	setLoggedInUser: Function,
	subscribeToEvents: Function,
	ccHeaderMenuRef: any,
	setOpenDetails: any,
	messageListConfiguration: any,
    user: CometChat.User | null,
    setActiveUser: Function,
    group: CometChat.Group | null,
    setActiveGroup: Function
) {
	useEffect(
        () => {
            CometChat.getLoggedinUser().then(
                (userObject: CometChat.User | null) => {
                    if (userObject) {
                        setLoggedInUser(userObject);
                    }
                }
            );
        },
        [setLoggedInUser]
    );

    useEffect(
        () => {
            const element = ccHeaderMenuRef.current;
            if (!element) return;
            const headerButtonClick = (event: any) => {
                setOpenDetails(true);
            }
            if (!messageListConfiguration?.menu) {
                element.addEventListener("cc-menu-clicked", headerButtonClick);
            } else {
                element.removeEventListener("cc-menu-clicked", headerButtonClick);
            }

            return () => {
                element.removeEventListener("cc-menu-clicked", headerButtonClick);
            }
        }, [messageListConfiguration, ccHeaderMenuRef, setOpenDetails]
    );

    useEffect(()=>{
        if(user){
            setActiveGroup(null);
            setActiveUser(user);
        }
    }, [user, setActiveUser, setActiveGroup]);

    useEffect(()=>{
        if(group){
            setActiveUser(null);
            setActiveGroup(group);
        }
    }, [group, setActiveUser, setActiveGroup]);

    useEffect(()=>{
        let unsubscribeFromEvents : () => void;
        if(loggedInUser){
            unsubscribeFromEvents = subscribeToEvents();
        }
        return () => {
            unsubscribeFromEvents?.();
        }
    }, [loggedInUser, subscribeToEvents]);

}

export { Hooks };
