import { CometChatListItemRoot } from './CometChatListItemRoot';
import { CometChatListItemLeadingView } from './CometChatListItemLeadingView';
import { CometChatListItemTitle } from './CometChatListItemTitle';
import { CometChatListItemSubtitle } from './CometChatListItemSubtitle';
import { CometChatListItemTrailingView } from './CometChatListItemTrailingView';
import { CometChatListItemMenuView } from './CometChatListItemMenuView';

/**
 * CometChatListItem — compound component for list rows.
 *
 * Usage:
 * ```tsx
 * <CometChatListItem.Root id="user-1" onItemClick={handleClick}>
 *   <CometChatListItem.LeadingView>
 *     <CometChatAvatar.Root name="John Doe" image={url}>
 *       <CometChatAvatar.Image />
 *       <CometChatAvatar.Initials />
 *     </CometChatAvatar.Root>
 *   </CometChatListItem.LeadingView>
 *   <CometChatListItem.Title>John Doe</CometChatListItem.Title>
 *   <CometChatListItem.Subtitle>Online</CometChatListItem.Subtitle>
 *   <CometChatListItem.TrailingView>
 *     <span>3:42 pm</span>
 *   </CometChatListItem.TrailingView>
 *   <CometChatListItem.MenuView>
 *     <button aria-label="More options">⋮</button>
 *   </CometChatListItem.MenuView>
 * </CometChatListItem.Root>
 * ```
 */
export const CometChatListItem = {
  Root: CometChatListItemRoot,
  LeadingView: CometChatListItemLeadingView,
  Title: CometChatListItemTitle,
  Subtitle: CometChatListItemSubtitle,
  TrailingView: CometChatListItemTrailingView,
  MenuView: CometChatListItemMenuView,
} as const;
