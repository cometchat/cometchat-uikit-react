import { useEffect } from "react";
import { CometChat } from "@cometchat-pro/chat";
import { MessageListManager } from "./controller";

function Hooks(
	loggedInUser: any,
	setLoggedInUser: Function,
	messageListManager: any,
	fetchPreviousMessages: Function,
	updateMessage: Function,
	messagesRequestBuilder: CometChat.MessagesRequestBuilder | undefined,
    user: any,
    group: any,
	subscribeToEvents: Function,
	messageIdRef: any,
	messagesCountRef: any,
	messageList: any,
	onErrorCallback: any,
	setMessageList: any,
	setScrollListToBottom: any,
	smartReplyViewRef: any,
	setShowSmartReply: Function
) {
	useEffect(() => {
		CometChat.getLoggedinUser()
			.then(
				(userObject: CometChat.User | null) => {
					if(userObject){
						setLoggedInUser(userObject);
					}
				}, (error: CometChat.CometChatException) => {
					onErrorCallback(error);
				}
			);
	}, []);

    useEffect(() => {
		let unsubscribeEvents : () => void;
		if (loggedInUser) {
			messageListManager.current = {
				previous: new MessageListManager(
					messagesRequestBuilder,
					user, 
					group
				)
			}
			MessageListManager.attachListeners(updateMessage);
			unsubscribeEvents = subscribeToEvents();
			setMessageList([]);
			setScrollListToBottom(true);
			fetchPreviousMessages();
			setShowSmartReply(false);
			smartReplyViewRef.current = null;
		}
		return () => {
			MessageListManager?.removeListeners?.();
			unsubscribeEvents?.();
		}
	}, [messagesRequestBuilder, user, group, loggedInUser]);

	useEffect(()=>{
		messagesCountRef.current = messageList.length;
		if(messageList?.length > 0){
			messageIdRef.current.prevMessageId = messageList[0].id;
			messageIdRef.current.nextMessageId = messageList[messageList.length - 1].id;
		}
	}, [messageList]);

}

export { Hooks };