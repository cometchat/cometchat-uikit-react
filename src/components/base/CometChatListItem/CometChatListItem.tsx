import React from 'react';
import { CometChatListItemRoot } from './CometChatListItemRoot';
import { CometChatListItemLeadingView } from './CometChatListItemLeadingView';
import { CometChatListItemTitle } from './CometChatListItemTitle';
import { CometChatListItemSubtitle } from './CometChatListItemSubtitle';
import { CometChatListItemTrailingView } from './CometChatListItemTrailingView';
import { CometChatListItemMenuView } from './CometChatListItemMenuView';
import type { CometChatListItemRootProps } from './CometChatListItem.types';

/**
 * Flat API props for CometChatListItem.
 * Renders Root with slot-based composition via props.
 */
export interface CometChatListItemProps extends Omit<CometChatListItemRootProps, 'children'> {
  /** Content for the leading area (typically an avatar). */
  leadingView?: React.ReactNode;
  /** Title text or custom ReactNode. */
  title?: React.ReactNode;
  /** Subtitle text or custom ReactNode. */
  subtitle?: React.ReactNode;
  /** Content for the trailing area (badge, date, status, etc.). */
  trailingView?: React.ReactNode;
  /** Menu content revealed on hover/focus. */
  menuView?: React.ReactNode;
}

/**
 * CometChatListItem — Flat API component.
 *
 * Usage (flat):
 * ```tsx
 * <CometChatListItem
 *   id="user-1"
 *   onItemClick={handleClick}
 *   leadingView={<CometChatAvatar name="John" image={url} />}
 *   title="John Doe"
 *   subtitle="Online"
 *   trailingView={<span>3:42 pm</span>}
 * />
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatListItem.Root id="user-1" onItemClick={handleClick}>
 *   <CometChatListItem.LeadingView>...</CometChatListItem.LeadingView>
 *   <CometChatListItem.Title>John Doe</CometChatListItem.Title>
 *   <CometChatListItem.Subtitle>Online</CometChatListItem.Subtitle>
 *   <CometChatListItem.TrailingView>...</CometChatListItem.TrailingView>
 *   <CometChatListItem.MenuView>...</CometChatListItem.MenuView>
 * </CometChatListItem.Root>
 * ```
 */
const CometChatListItemComponent: React.FC<CometChatListItemProps> = ({
  leadingView,
  title,
  subtitle,
  trailingView,
  menuView,
  ...rootProps
}) => {
  return (
    <CometChatListItemRoot {...rootProps}>
      {leadingView && <CometChatListItemLeadingView>{leadingView}</CometChatListItemLeadingView>}
      {title && <CometChatListItemTitle>{title}</CometChatListItemTitle>}
      {subtitle && <CometChatListItemSubtitle>{subtitle}</CometChatListItemSubtitle>}
      {trailingView && (
        <CometChatListItemTrailingView>{trailingView}</CometChatListItemTrailingView>
      )}
      {menuView && <CometChatListItemMenuView>{menuView}</CometChatListItemMenuView>}
    </CometChatListItemRoot>
  );
};

CometChatListItemComponent.displayName = 'CometChatListItem';

export const CometChatListItem = Object.assign(CometChatListItemComponent, {
  Root: CometChatListItemRoot,
  LeadingView: CometChatListItemLeadingView,
  Title: CometChatListItemTitle,
  Subtitle: CometChatListItemSubtitle,
  TrailingView: CometChatListItemTrailingView,
  MenuView: CometChatListItemMenuView,
});
