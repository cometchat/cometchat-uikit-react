import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/CometChatLocalize';
import type { TranslateFunction } from '../../../resources/CometChatLocalize/localize.types';

/**
 * Generate localized action message text from a CometChat.Action message.
 *
 * Handles 7 group action types: ADDED, JOINED, LEFT, KICKED, BANNED, UNBANNED, SCOPE_CHANGE.
 *
 * Reusable by GroupAction plugin and future Calling plugin.
 *
 * @param message - The SDK action message (CometChat.Action or BaseMessage with action properties).
 * @param t - The translation function from useLocale(). Falls back to English keys if not provided.
 * @returns Localized action text, or empty string if the message cannot be parsed.
 */
export function getActionMessageText(
  message: CometChat.BaseMessage,
  t?: TranslateFunction
): string {
  const translate = t ?? CometChatLocalize.getSharedInstance()?.t ?? ((key: string) => key);
  const actionMsg = message as unknown as Record<string, unknown>;

  if (!('actionBy' in actionMsg) || !('actionOn' in actionMsg)) {
    return '';
  }

  const action = actionMsg.action as string | undefined;
  if (!action) return '';

  // For actions other than JOINED/LEFT, both actionBy and actionOn must have names
  if (
    action !== CometChatUIKitConstants.groupMemberAction.JOINED &&
    action !== CometChatUIKitConstants.groupMemberAction.LEFT
  ) {
    const byEntity = actionMsg.actionBy as Record<string, unknown> | undefined;
    const onEntity = actionMsg.actionOn as Record<string, unknown> | undefined;
    if (!byEntity?.name || !onEntity?.name) {
      return '';
    }
  }

  // For SCOPE_CHANGE, the new scope must be present in data.extras.scope.new
  if (action === CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE) {
    const data = actionMsg.data as Record<string, unknown> | undefined;
    const extras = data?.extras as Record<string, unknown> | undefined;
    const scope = extras?.scope as Record<string, unknown> | undefined;
    if (!scope?.new) {
      return '';
    }
  }

  const byEntity = actionMsg.actionBy as Record<string, unknown>;
  const onEntity = actionMsg.actionOn as Record<string, unknown>;
  const byString = (byEntity.name as string) || '';
  const forString =
    action !== CometChatUIKitConstants.groupMemberAction.JOINED &&
    action !== CometChatUIKitConstants.groupMemberAction.LEFT
      ? (onEntity.name as string) || ''
      : '';

  switch (action) {
    case CometChatUIKitConstants.groupMemberAction.ADDED:
      return `${byString} ${translate('message_list_action_added')} ${forString}`;

    case CometChatUIKitConstants.groupMemberAction.JOINED:
      return `${byString} ${translate('message_list_action_joined')}`;

    case CometChatUIKitConstants.groupMemberAction.LEFT:
      return `${byString} ${translate('message_list_action_left')}`;

    case CometChatUIKitConstants.groupMemberAction.KICKED:
      return `${byString} ${translate('message_list_action_kicked')} ${forString}`;

    case CometChatUIKitConstants.groupMemberAction.BANNED:
      return `${byString} ${translate('message_list_action_banned')} ${forString}`;

    case CometChatUIKitConstants.groupMemberAction.UNBANNED:
      return `${byString} ${translate('message_list_action_unbanned')} ${forString}`;

    case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE: {
      const data = actionMsg.data as Record<string, unknown>;
      const extras = data.extras as Record<string, unknown>;
      const scope = extras.scope as Record<string, unknown>;
      const newScope = scope.new as string;
      const localizedScope = translate(`member_scope_${newScope}`) || newScope;
      return `${byString} ${translate('message_list_action_made')} ${forString} ${localizedScope}`;
    }

    default:
      return '';
  }
}
