import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageReceiverType } from "../";
import { CometChatDate, localize } from "../../";

const getUser = uid => {

    return new Promise((resolve, reject) => {

        CometChat.getUser(uid)
            .then(user => resolve(user))
            .catch(error => reject(error));
    })
}

const getGroup = guid => {

    return new Promise((resolve, reject) => {

        CometChat.getGroup(guid)
            .then(group => resolve(group))
            .catch(error => reject(error));
    })
}

export const Hooks = (
    props, 
    setLoggedInUser, 
    setChatWith, 
    setChatWithType, 
    setMessageHeaderStatus,
    setUserPresence,
    messageHeaderManager, 
    messageHeaderCallback, 
	handlers, 
	callbackData
) => {

    //fetch logged in user
	React.useEffect(() => {

		CometChat.getLoggedinUser()
			.then(user => {

                setLoggedInUser(user);
                messageHeaderManager.attachListeners(messageHeaderCallback);
            })
			.catch(error => {});
	}, []);

    const updateMessageHeaderStatusForUser = React.useCallback(user => {

        if (user.status === CometChat.USER_STATUS.OFFLINE && user.lastActiveAt) {

            //const lastActive = user.lastActiveAt * 1000;
            //const messageDate = <CometChatDate timeStamp={user.lastActiveAt} timeFormat="dd:mm:yyyy,hh:mm am/pm" />;
            //const status = `${localize("LAST_ACTIVE_AT")}: ${messageDate}`;
            //setMessageHeaderStatus(status);

            setMessageHeaderStatus(localize("OFFLINE"));
            setUserPresence(CometChat.USER_STATUS.OFFLINE);

        } else if (user.status === CometChat.USER_STATUS.OFFLINE) {
            setMessageHeaderStatus(localize("OFFLINE"));
            setUserPresence(CometChat.USER_STATUS.OFFLINE);
        } else if (user.status === CometChat.USER_STATUS.ONLINE) {
            setMessageHeaderStatus(localize("ONLINE"));
            setUserPresence(CometChat.USER_STATUS.ONLINE);
        }
    }, [setMessageHeaderStatus, setUserPresence]);

    const updateMessageHeaderStatusForGroup = React.useCallback(group => {

		const status = `${group.membersCount} ${localize("MEMBERS")}`;
		setMessageHeaderStatus(status);
        //setUserPresence(CometChat.USER_STATUS.OFFLINE);

    }, [setMessageHeaderStatus]);


    //update receiver user
    React.useEffect(() => {

		if (props.user && props.user.uid) {

            if(props.user.name) {

                setChatWithType(CometChatMessageReceiverType.user);
                setChatWith(props.user);
                updateMessageHeaderStatusForUser(props.user);

            } else {
                getUser(props.user.uid).then(user => {

                    setChatWithType(CometChatMessageReceiverType.user);
                    setChatWith(user);
                    updateMessageHeaderStatusForUser(user);
                });
            }

		} else if (props.group && props.group.guid) {

            if(props.group.name) {

                setChatWithType(CometChatMessageReceiverType.group);
                setChatWith(props.group);
                updateMessageHeaderStatusForGroup(props.group);
            } else {
                getGroup(props.group.guid).then(group => {
                    setChatWithType(CometChatMessageReceiverType.group);
                    setChatWith(group);
                    updateMessageHeaderStatusForGroup(group);
                });
            }
			
		}

	}, [props.user, props.group, setChatWith, setChatWithType, updateMessageHeaderStatusForUser, updateMessageHeaderStatusForGroup]);

    React.useEffect(() => {

		const handler = handlers[callbackData?.name];
		if (!handler) {
			return false;
		}

		return handler(...callbackData?.args);

	}, [callbackData, handlers]);
};