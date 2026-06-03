import { CometChatDateRoot } from './CometChatDateRoot';
import { CometChatDateText } from './CometChatDateText';

/**
 * CometChatDate — compound component for formatted date/time display.
 *
 * Usage:
 * ```tsx
 * <CometChatDate.Root timestamp={1713200000}>
 *   <CometChatDate.Text />
 * </CometChatDate.Root>
 * ```
 */
export const CometChatDate = {
  Root: CometChatDateRoot,
  Text: CometChatDateText,
} as const;
