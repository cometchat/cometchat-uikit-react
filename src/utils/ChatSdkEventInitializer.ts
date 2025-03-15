
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatMessageEvents } from "../events/CometChatMessageEvents";
import { CometChatUIKitConstants } from "../constants/CometChatUIKitConstants";

export class ChatSdkEventInitializer {
    private static messageListenerId = `message_listener_${new Date().getTime()}`;
    public static attachListeners() {
        CometChat.addMessageListener(
            this.messageListenerId,
            this.getMessageListenerObject()
        );
    }

    public static detachListeners() {
        CometChat.removeMessageListener(this.messageListenerId);
    }

    private static getMessageListenerObject() {
        return new CometChat.MessageListener({
            onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
                CometChatMessageEvents.onTextMessageReceived.next(textMessage);
            },
            onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
                CometChatMessageEvents.onMediaMessageReceived.next(mediaMessage);
            },

            onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
                CometChatMessageEvents.onCustomMessageReceived.next(customMessage);
            },
            onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
                CometChatMessageEvents.onTypingStarted.next(typingIndicator);
            },
            onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
                CometChatMessageEvents.onTypingEnded.next(typingIndicator);
            },
            onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
                CometChatMessageEvents.onMessagesDelivered.next(messageReceipt);
            },
            onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
                CometChatMessageEvents.onMessagesRead.next(messageReceipt);
            },
            onMessagesDeliveredToAll: (messageReceipt: CometChat.MessageReceipt) => {
                CometChatMessageEvents.onMessagesDeliveredToAll.next(messageReceipt);

            },
            onMessagesReadByAll: (messageReceipt: CometChat.MessageReceipt) => {
                CometChatMessageEvents.onMessagesReadByAll.next(messageReceipt);

            },
            onMessageEdited: (message: CometChat.BaseMessage) => {
                CometChatMessageEvents.onMessageEdited.next(message);
            },
            onMessageDeleted: (message: CometChat.BaseMessage) => {
                CometChatMessageEvents.onMessageDeleted.next(message);
            },
            onTransientMessageReceived: (message: CometChat.TransientMessage) => {
                CometChatMessageEvents.onTransientMessageReceived.next(message);
            },
            onMessageReactionAdded: (reaction: CometChat.ReactionEvent) => {
                CometChatMessageEvents.onMessageReactionAdded.next(reaction);
            },
            onMessageReactionRemoved: (reaction: CometChat.ReactionEvent) => {
                CometChatMessageEvents.onMessageReactionRemoved.next(reaction);
            },
            onSchedulerMessageReceived: (message: CometChat.InteractiveMessage) => {
                CometChatMessageEvents.onSchedulerMessageReceived.next(message);

            },
            onInteractiveMessageReceived: (
                message: CometChat.InteractiveMessage
            ) => {
                switch (message.getType()) {
                    case CometChatUIKitConstants.MessageTypes.form:
                        CometChatMessageEvents.onFormMessageReceived.next(message);
                        break;
                    case CometChatUIKitConstants.MessageTypes.card:
                        CometChatMessageEvents.onCardMessageReceived.next(message);
                        break;
                    default:
                        CometChatMessageEvents.onCustomInteractiveMessageReceived.next(message);
                        break;
                }
            },
        });
    }
}
