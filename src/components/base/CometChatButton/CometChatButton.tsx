import { CometChatButtonRoot } from './CometChatButtonRoot';
import { CometChatButtonIcon } from './CometChatButtonIcon';
import { CometChatButtonText } from './CometChatButtonText';

/**
 * CometChatButton — compound component.
 *
 * Usage:
 * ```tsx
 * <CometChatButton.Root variant="primary" onClick={handleClick}>
 *   <CometChatButton.Icon><SendIcon /></CometChatButton.Icon>
 *   <CometChatButton.Text>Send</CometChatButton.Text>
 * </CometChatButton.Root>
 * ```
 */
export const CometChatButton = {
  Root: CometChatButtonRoot,
  Icon: CometChatButtonIcon,
  Text: CometChatButtonText,
} as const;
