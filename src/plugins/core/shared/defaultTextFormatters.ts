import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { CometChatMarkdownFormatter } from '../../../formatters/CometChatMarkdownFormatter';
import { CometChatMentionsFormatter } from '../../../formatters/CometChatMentionsFormatter';
import { CometChatUrlFormatter } from '../../../formatters/CometChatUrlFormatter';

/**
 * The default display formatter set (markdown → mentions → URLs), shared by every plugin
 * that renders text or captions so each plugin OWNS its formatters (no cross-plugin
 * registry aggregation). Returns FRESH instances per call — formatters are stateful
 * (the mentions formatter holds the message's users).
 */
export function createDefaultTextFormatters(): CometChatTextFormatter[] {
  return [
    new CometChatMarkdownFormatter(),
    new CometChatMentionsFormatter(),
    new CometChatUrlFormatter(),
  ];
}
