import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageStatus } from '../Enums/Enums';
import { Subject } from 'rxjs';

/**
 * Message event subjects for handling actions related to messages (e.g., message sent, edited, deleted, etc.)
 */

export class CometChatMessageEvents {
    static ccMessageSent: Subject<IMessages> = new Subject<IMessages>();
    static ccMessageEdited: Subject<IMessages> = new Subject<IMessages>();
    static ccReplyToMessage: Subject<IMessages> = new Subject<IMessages>();
    static ccMessageTranslated: Subject<IMessages> = new Subject<IMessages>();
    static ccMessageRead: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
    static ccMessageDeleted: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
    /**
     * Publishes a message event.
     * @param {Subject<any>} event - The event to publish.
     * @param {any} item - The item (message, etc.) associated with the event.
     */

    static publishEvent(event: any, item: any = null) {
        event.next(item);
    }

    /**
    * message events wrapper of SDK listeners (e.g., media message, typing       indicator, read receipts, etc.)
    */
    static onTextMessageReceived: Subject<CometChat.TextMessage> = new Subject<CometChat.TextMessage>();
    static onMessageModerated: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
    static onMediaMessageReceived: Subject<CometChat.MediaMessage> = new Subject<CometChat.MediaMessage>();
    static onCustomMessageReceived: Subject<CometChat.CustomMessage> = new Subject<CometChat.CustomMessage>();
    static onTypingStarted: Subject<CometChat.TypingIndicator> = new Subject<CometChat.TypingIndicator>();
    static onTypingEnded: Subject<CometChat.TypingIndicator> = new Subject<CometChat.TypingIndicator>();
    static onMessagesDelivered: Subject<CometChat.MessageReceipt> = new Subject<CometChat.MessageReceipt>();
    static onMessagesRead: Subject<CometChat.MessageReceipt> = new Subject<CometChat.MessageReceipt>();
    static onMessagesDeliveredToAll: Subject<CometChat.MessageReceipt> = new Subject<CometChat.MessageReceipt>();
    static onMessagesReadByAll: Subject<CometChat.MessageReceipt> = new Subject<CometChat.MessageReceipt>();
    static onMessageEdited: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
    static onMessageDeleted: Subject<CometChat.BaseMessage> = new Subject<CometChat.BaseMessage>();
    static onMessageReactionAdded: Subject<CometChat.ReactionEvent> = new Subject<CometChat.ReactionEvent>();
    static onMessageReactionRemoved: Subject<CometChat.ReactionEvent> = new Subject<CometChat.ReactionEvent>();
    static onCustomInteractiveMessageReceived: Subject<CometChat.InteractiveMessage> = new Subject<CometChat.InteractiveMessage>();
    static onFormMessageReceived: Subject<CometChat.InteractiveMessage> = new Subject<CometChat.InteractiveMessage>();
    static onCardMessageReceived: Subject<CometChat.InteractiveMessage> = new Subject<CometChat.InteractiveMessage>();
    static onSchedulerMessageReceived: Subject<CometChat.InteractiveMessage> = new Subject<CometChat.InteractiveMessage>();
    static onAIAssistantMessageReceived: Subject<CometChat.AIAssistantMessage> = new Subject<CometChat.AIAssistantMessage>();
    static onAIToolResultReceived: Subject<CometChat.AIToolResultMessage> = new Subject<CometChat.AIToolResultMessage>();
     static onAIToolArgumentsReceived: Subject<CometChat.AIToolArgumentMessage> = new Subject<CometChat.AIToolArgumentMessage>();
}
/**
* Interface for message-related events
*/
export interface IMessages {
    message: CometChat.BaseMessage;
    status: MessageStatus;
}
