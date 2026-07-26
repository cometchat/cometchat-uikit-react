import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * CometChatMessageComposerManager — SDK functions for composer operations.
 *
 * Pure functions — no React imports, no class state. Testable independently.
 */

/**
 * Send a text message.
 */
export async function sendTextMessage(
  receiverId: string,
  receiverType: string,
  text: string,
  parentMessageId?: number,
  quotedMessage?: CometChat.BaseMessage
): Promise<CometChat.TextMessage> {
  const textMessage = new CometChat.TextMessage(receiverId, text, receiverType);
  if (parentMessageId) {
    textMessage.setParentMessageId(parentMessageId);
  }
  if (quotedMessage) {
    (
      textMessage as unknown as { setQuotedMessage: (msg: CometChat.BaseMessage) => void }
    ).setQuotedMessage(quotedMessage);
  }
  return CometChat.sendMessage(textMessage) as Promise<CometChat.TextMessage>;
}

/**
 * Send a media message (image, video, audio, file).
 */
export async function sendMediaMessage(
  receiverId: string,
  receiverType: string,
  file: File,
  fileType: string,
  parentMessageId?: number,
  quotedMessage?: CometChat.BaseMessage
): Promise<CometChat.MediaMessage> {
  const mediaMessage = new CometChat.MediaMessage(receiverId, file, fileType, receiverType);
  if (parentMessageId) {
    mediaMessage.setParentMessageId(parentMessageId);
  }
  if (quotedMessage) {
    (
      mediaMessage as unknown as { setQuotedMessage: (msg: CometChat.BaseMessage) => void }
    ).setQuotedMessage(quotedMessage);
  }
  return CometChat.sendMediaMessage(mediaMessage) as Promise<CometChat.MediaMessage>;
}

/**
 * Edit an existing text message.
 */
export async function editTextMessage(
  messageId: number,
  text: string,
  mentionedUsers?: { uid: string; name: string }[]
): Promise<CometChat.BaseMessage> {
  const textMessage = new CometChat.TextMessage('', text, '');
  textMessage.setId(messageId);
  if (mentionedUsers && mentionedUsers.length > 0) {
    const userObjects = mentionedUsers.map(u => new CometChat.User({ uid: u.uid, name: u.name }));
    textMessage.setMentionedUsers(userObjects);
  }
  return CometChat.editMessage(textMessage);
}

/**
 * Edit a media message's caption.
 * Creates a MediaMessage with the updated caption and calls editMessage.
 */
export async function editMediaCaption(
  messageId: number,
  caption: string,
  mentionedUsers?: { uid: string; name: string }[]
): Promise<CometChat.BaseMessage> {
  // The SDK's editMessage accepts any BaseMessage subclass. We create a
  // MediaMessage shell with the id and new caption set.
  const mediaMessage = new CometChat.MediaMessage('', null, '', '');
  mediaMessage.setId(messageId);
  mediaMessage.setCaption(caption);
  if (mentionedUsers && mentionedUsers.length > 0) {
    const userObjects = mentionedUsers.map(u => new CometChat.User({ uid: u.uid, name: u.name }));
    mediaMessage.setMentionedUsers(userObjects);
  }
  return CometChat.editMessage(mediaMessage);
}

/**
 * Start typing indicator.
 */
export function startTypingIndicator(receiverId: string, receiverType: string): void {
  try {
    const typingNotification = new CometChat.TypingIndicator(receiverId, receiverType);
    CometChat.startTyping(typingNotification);
  } catch {
    // Silently ignore — SDK may not have a logged-in user yet
  }
}

/**
 * End typing indicator.
 */
export function endTypingIndicator(receiverId: string, receiverType: string): void {
  try {
    const typingNotification = new CometChat.TypingIndicator(receiverId, receiverType);
    CometChat.endTyping(typingNotification);
  } catch {
    // Silently ignore — SDK may not have a logged-in user yet
  }
}

/**
 * Attach message listener. Returns cleanup function.
 */
export function attachMessageListener(
  listenerId: string,
  callbacks: {
    onMessageEdited: (msg: CometChat.BaseMessage) => void;
    onMessageDeleted: (msg: CometChat.BaseMessage) => void;
  }
): () => void {
  CometChat.addMessageListener(
    listenerId,
    new CometChat.MessageListener({
      onMessageEdited: callbacks.onMessageEdited,
      onMessageDeleted: callbacks.onMessageDeleted,
    })
  );
  return () => {
    CometChat.removeMessageListener(listenerId);
  };
}

/**
 * Attach connection listener for reconnect recovery. Returns cleanup function.
 */
export function attachConnectionListener(listenerId: string, onConnected: () => void): () => void {
  CometChat.addConnectionListener(
    listenerId,
    new CometChat.ConnectionListener({
      onConnected,
    })
  );
  return () => {
    CometChat.removeConnectionListener(listenerId);
  };
}
