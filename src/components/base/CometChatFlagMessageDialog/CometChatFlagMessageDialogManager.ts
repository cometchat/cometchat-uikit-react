import { CometChat, FlagReason } from '@cometchat/chat-sdk-javascript';

/**
 * Fetches flag reasons from the CometChat SDK.
 * Isolated from React — pure SDK interaction.
 */
export async function getFlagReasons(): Promise<FlagReason[]> {
  return CometChat.getFlagReasons();
}
