import { Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Conversation event subjects for handling actions related to conversations (e.g., conversation deletion)
 */
export class CometChatConversationEvents {
    static ccConversationDeleted: Subject<CometChat.Conversation> = new Subject();
    static ccUpdateConversation: Subject<CometChat.Conversation> = new Subject();
    static ccMarkConversationAsRead: Subject<CometChat.Conversation> = new Subject<CometChat.Conversation>();

    /**
      * Publishes a conversation event.
      * @param {Subject<CometChat.Conversation>} event - The event to publish.
      * @param {CometChat.Conversation} conversation - The conversation associated with the event.
      */

    static publishEvent(event: Subject<CometChat.Conversation>, conversation: CometChat.Conversation) {
        event.next(conversation);
    }
}