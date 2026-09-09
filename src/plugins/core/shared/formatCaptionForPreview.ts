import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMarkdownFormatter } from '../../../formatters/CometChatMarkdownFormatter';
import { CometChatMentionsFormatter } from '../../../formatters/CometChatMentionsFormatter';

/**
 * Format a media message caption for conversation subtitle preview.
 * Same pipeline as the text plugin's getLastMessagePreview:
 * markdown strip → mention resolution → newline collapse.
 */
export function formatCaptionForPreview(
  caption: string,
  message: CometChat.BaseMessage,
  loggedInUser: CometChat.User
): string {
  if (!caption) return '';

  const markdownFormatter = new CometChatMarkdownFormatter();
  let formatted = markdownFormatter.stripMarkdownForConversation(caption);

  const mentionsFormatter = new CometChatMentionsFormatter();
  const mentionedUsers = message.getMentionedUsers();
  mentionsFormatter.setLoggedInUser(loggedInUser);
  if (mentionedUsers.length > 0) {
    mentionsFormatter.setUsers(mentionedUsers);
  }
  formatted = mentionsFormatter.formatSdkMentions(formatted, mentionedUsers);

  formatted = formatted.replace(/\n/g, ' ').trim();

  return formatted;
}
