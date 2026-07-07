
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
      onMessageModerated: (moderatedMessage: any) => {
        CometChatMessageEvents.onMessageModerated.next(moderatedMessage);
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
      onAIAssistantMessageReceived: (message: CometChat.AIAssistantMessage) => {
        CometChatMessageEvents.onAIAssistantMessageReceived.next(message);

      },
      onAIToolResultReceived: (message: CometChat.AIToolResultMessage) => {
        CometChatMessageEvents.onAIToolResultReceived.next(message);
      },
      onAIToolArgumentsReceived: (message: CometChat.AIToolArgumentMessage) => {
        CometChatMessageEvents.onAIToolArgumentsReceived.next(message);
      },
      // Developer cards (category: "card") arrive via this dedicated SDK callback;
      // forward to the UIKit event bus to render them via CometChatCardBubble.
      onCardMessageReceived: (message: CometChat.BaseMessage) => {
        ChatSdkEventInitializer.normalizeCardEntities(message);
        CometChatMessageEvents.onCardMessageReceived.next(
          message as CometChat.InteractiveMessage
        );
      },
    });
  }

  /**
   * Card messages skip the SDK's sender/receiver hydration, so getSender()/getReceiver()
   * can return raw JSON that throws on getUid()/getGuid(). Re-wrap as User/Group instances.
   * Defensive shim — the real fix belongs in the SDK.
   */
  private static normalizeCardEntities(message: CometChat.BaseMessage): void {
    try {
      const msg = message as any;

      const sender = msg?.getSender?.();
      if (sender && typeof sender.getUid !== "function") {
        msg.setSender(new CometChat.User(sender));
      }

      const receiver = msg?.getReceiver?.();
      if (
        receiver &&
        typeof receiver.getUid !== "function" &&
        typeof receiver.getGuid !== "function"
      ) {
        const isGroup =
          msg?.getReceiverType?.() ===
          CometChatUIKitConstants.MessageReceiverType.group;
        if (isGroup) {
          // Group ctor is positional (guid, name, type, ...), not an object.
          const g = new CometChat.Group(
            receiver.guid,
            receiver.name,
            receiver.type,
            undefined,
            receiver.icon,
            receiver.description
          );
          msg.setReceiver(g);
        } else {
          msg.setReceiver(new CometChat.User(receiver));
        }
      }
    } catch {
      // Best-effort normalization; never block delivery of the card.
    }
  }
}
