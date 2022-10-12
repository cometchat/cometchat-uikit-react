import { CometChatMessageEvents } from "../../";

class CometChatHelper {
  static sentMessage(sentMessage, messageStatus) {
    CometChatMessageEvents.emit(sentMessage, {
      ...messageStatus,
    });
  }

  static updateMessage() {}
}

export { CometChatHelper };
