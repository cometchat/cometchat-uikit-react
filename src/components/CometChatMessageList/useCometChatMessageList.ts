import { MutableRefObject, createRef, useEffect } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { MessageListManager } from "./CometChatMessageListController";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
/**
 * This Hooks function is a custom React hook designed to manage  functionalities of CometChatMessageList component. It fetches the logged-in user, handles event subscriptions and tracks message IDs for new message retrieval. It plays a key role in maintaining real-time functionality and user interactions in the chat interface.
 **/
function useCometChatMessageList(
	loggedInUserRef: MutableRefObject<CometChat.User | null>,
	messageListManagerRef: MutableRefObject<any>,
	fetchPreviousMessages: () => void,
	updateMessage: (key: string, mesage: CometChat.BaseMessage, group?: CometChat.Group) => void,
	messagesRequestBuilder: CometChat.MessagesRequestBuilder | undefined,
	user: CometChat.User | undefined,
	group: CometChat.Group | undefined,
	messageIdRef: MutableRefObject<any>,
	totalMessagesCountRef: MutableRefObject<any>,
	messageList: CometChat.BaseMessage[],
	errorHandler: (error: unknown,source?:string) => void,
	setMessageList: (messages: CometChat.BaseMessage[]) => void,
	setScrollListToBottom: (scrollToBottom: boolean) => void,
	smartReplyViewRef: MutableRefObject<any>,
	isOnBottomRef: MutableRefObject<boolean>,
	isFirstReloadRef: MutableRefObject<boolean>,
	subscribeToUIEvents: Function,
	showSmartRepliesRef: MutableRefObject<any>,
	addMessage:(message: CometChat.BaseMessage) => void,
	setDateHeader?: Function,
	parentMessageId?: number,
	hideGroupActionMessages?: boolean,
	showSmartReplies?:boolean,
	goToMessageId?:string,
	isAgentChat?:boolean,
	messageRepliedTo?: string

): void {
		/**
	 * useEffect hook to update the smart replies view when the prop changes
	 * **/
	useEffect(()=>{
		showSmartRepliesRef.current = showSmartReplies!
	  },[showSmartReplies])

	/**
	 * useEffect hook to fetch the logged-in user when we first launch the user/group chat and set isFirstReloadRef to true. This state variable is used to add a connection listener when the chat is launched for the first time.
	 * **/
	useEffect(() => {
		CometChat.getLoggedinUser()
			.then(
				(userObject: CometChat.User | null) => {
					isFirstReloadRef.current = true;
					if (userObject) {
						loggedInUserRef.current = userObject;
					}
				}, (error: CometChat.CometChatException) => {
					errorHandler(error,"getLoggedinUser");
				}
			);
	}, [user, group,errorHandler,messageRepliedTo]);
	/**
	* useEffect hook to subscribe to SDK and UI events when the component launches for the first time, or when changing from one chat to another.
	**/

	useEffect(() => {
		try {
			if (setDateHeader) {
				setDateHeader(null)
			}
			let unsubscribeEvents: (() => void) | undefined;
			if (CometChatUIKitLoginListener.getLoggedInUser() && (user || group)) {
			messageIdRef.current = { prevMessageId: 0, nextMessageId: 0 };
            totalMessagesCountRef.current = 0;
				messageListManagerRef.current = {
					previous: new MessageListManager(
						errorHandler,
						messagesRequestBuilder,
						user,
						group,
						undefined,
						undefined,
						hideGroupActionMessages
					)
				}
				if(!parentMessageId || (parentMessageId && isAgentChat)){
					MessageListManager.attachListeners(isAgentChat || false,updateMessage,addMessage,user);
				}
				unsubscribeEvents = subscribeToUIEvents();
				setMessageList([]);
				if(isFirstReloadRef.current && (goToMessageId || messageRepliedTo)){
				setScrollListToBottom(false);
				isOnBottomRef.current = false;
				}
				else{
				setScrollListToBottom(true);
				isOnBottomRef.current = true;
				}
				if(!isAgentChat || (isAgentChat &&  parentMessageId)){
				fetchPreviousMessages();
				}
				smartReplyViewRef.current = null;
			}
			return () => {
				MessageListManager?.removeListeners?.();
				unsubscribeEvents?.();
	
			}
		} catch (error) {
			errorHandler(error,"useEffect")
		}
	}, [user, group,isAgentChat, messageRepliedTo]);
	/**
	 * useEffect hook to store the first and last message ID in the messageList array. These are used to fetch new messages after a particular message when the connection gets reestablished after being interrupted.
	**/
	useEffect(() => {
		try {
			totalMessagesCountRef.current = messageList.length;
		if (messageList?.length > 0) {
			messageIdRef.current.prevMessageId = messageList[0].getId();
			messageIdRef.current.nextMessageId = messageList[messageList.length - 1].getId();
		}
		} catch (error) {
			errorHandler(error,"useEffect")
		}
	}, [messageList]);

}

export { useCometChatMessageList };
