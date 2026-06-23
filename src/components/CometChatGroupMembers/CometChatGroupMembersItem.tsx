import React, { useCallback, useMemo } from 'react';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { CometChatCheckbox } from '../base/CometChatCheckbox/CometChatCheckbox';
import { CometChatRadioButton } from '../base/CometChatRadioButton/CometChatRadioButton';
import { CometChatContextMenu } from '../base/CometChatContextMenu/CometChatContextMenu';
import { useCometChatGroupMembersContext } from './CometChatGroupMembers.context';
import { useLocale } from '../../context/locale/LocaleContext';
import type { CometChatGroupMembersItemProps } from './CometChatGroupMembers.types';
import type { CometChatContextMenuItemData } from '../base/CometChatContextMenu/CometChatContextMenu.types';
import './CometChatGroupMembers.css';

/**
 * Get the display label for a member scope.
 */
function getScopeLabel(scope: string, getLocalizedString: (key: string) => string): string {
  switch (scope) {
    case 'owner':
      return getLocalizedString('member_scope_owner');
    case 'admin':
      return getLocalizedString('group_members_admin');
    case 'moderator':
      return getLocalizedString('group_members_moderator');
    default:
      return '';
  }
}

/**
 * CometChatGroupMembersItem — Individual group member item with role badge and action menu.
 *
 * Displays: avatar, name, online/offline status, role badge, and context menu
 * with actions (kick/ban/promote/demote) based on logged-in user's scope.
 *
 * Memoized to prevent unnecessary re-renders in large lists.
 */
function CometChatGroupMembersItemInner({
  member,
  hideUserStatus: hideUserStatusProp,
  isActive: isActiveProp,
  leadingView,
  titleView,
  subtitleView,
  trailingView,
}: CometChatGroupMembersItemProps) {
  const ctx = useCometChatGroupMembersContext();
  const { getLocalizedString } = useLocale();
  const uid = member.getUid();
  const name = member.getName();
  const avatar = member.getAvatar();
  const status = member.getStatus();
  const rawScope = member.getScope();
  // Check if this member is the group owner (SDK returns 'admin' for owners)
  const isOwner = ctx.group.getOwner() === uid;
  const scope = isOwner ? 'owner' : rawScope;

  const isActive = isActiveProp ?? ctx.activeMemberId === uid;
  const isSelected = ctx.selectedMemberIds.includes(uid);
  const hideStatus = hideUserStatusProp ?? ctx.hideUserStatus;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      ctx.handleItemClick(member, { shiftKey: e.shiftKey });
    },
    [ctx, member]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ctx.handleItemClick(member, { shiftKey: e.shiftKey });
      }
    },
    [ctx, member]
  );

  const handleCheckboxChange = useCallback(
    (event: { checked: boolean; shiftKey?: boolean | undefined }) => {
      ctx.handleItemClick(member, { shiftKey: event.shiftKey ?? false });
    },
    [ctx, member]
  );

  const handleRadioChange = useCallback(() => {
    ctx.handleItemClick(member);
  }, [ctx, member]);

  // --- Build context menu options based on scope hierarchy ---
  const contextMenuItems: CometChatContextMenuItemData[] = useMemo(() => {
    // If custom options are provided, use those
    if (ctx.options) {
      return ctx.options(member).map(opt => ({
        id: opt.id,
        title: opt.title,
        ...(opt.iconURL ? { iconURL: opt.iconURL } : {}),
        onClick: () => {
          opt.onClick(member);
        },
      }));
    }

    const isLoggedInUserOwner = ctx.group.getOwner() === ctx.loggedInUser?.getUid();
    const myScope = isLoggedInUserOwner ? 'owner' : (ctx.loggedInUserScope ?? 'participant');
    const memberScope = scope;

    // Cannot perform actions on self or on the group owner
    if (!ctx.loggedInUser || ctx.loggedInUser.getUid() === uid || isOwner) {
      return [];
    }

    let canKick = false;
    let canBan = false;
    let canChangeScope = false;

    if (myScope === 'owner') {
      // Owner can kick/ban/changeScope for participant, moderator, admin
      canKick = true;
      canBan = true;
      canChangeScope = true;
    } else if (myScope === 'admin') {
      if (memberScope === 'participant' || memberScope === 'moderator') {
        canKick = true;
        canBan = true;
        canChangeScope = true;
      } else if (memberScope === 'admin') {
        canKick = false;
        canBan = false;
        canChangeScope = true;
      }
      // Admin cannot do anything to owner
    } else if (myScope === 'moderator') {
      if (memberScope === 'participant') {
        canKick = true;
        canBan = true;
        canChangeScope = true;
      }
      // Moderator cannot do anything to other moderators, admins, or owner
    }
    // Participants cannot do anything

    const items: CometChatContextMenuItemData[] = [];

    if (canKick) {
      items.push({
        id: 'kick',
        title: 'Kick',
        onClick: () => {
          void ctx.kickMember(uid);
        },
      });
    }

    if (canBan) {
      items.push({
        id: 'ban',
        title: 'Ban',
        onClick: () => {
          void ctx.banMember(uid);
        },
      });
    }

    // Scope change option — opens CometChatChangeScope dialog
    if (canChangeScope) {
      items.push({
        id: 'change-scope',
        title: 'Change Scope',
        onClick: () => {
          ctx.setMemberToChangeScope(member);
        },
      });
    }

    return items;
  }, [ctx, member, uid, scope, isOwner]);

  const scopeLabel = getScopeLabel(scope, getLocalizedString);

  const classNames = [
    'cometchat-group-members__item',
    isActive ? 'cometchat-group-members__item--active' : '',
    isSelected ? 'cometchat-group-members__item--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      role="option"
      aria-selected={isSelected || isActive}
      aria-label={`${name}${scopeLabel ? `, ${scopeLabel}` : ''}${status === 'online' ? `, ${getLocalizedString('accessibility_online')}` : ''}`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Leading: CometChatAvatar + Status Indicator */}
      {leadingView ?? (
        <div className={'cometchat-group-members__item-avatar'}>
          <CometChatAvatar.Root name={name} image={avatar} size="medium">
            <CometChatAvatar.Image />
            <CometChatAvatar.Initials />
            {!hideStatus && !member.getHasBlockedMe() && (
              <CometChatAvatar.StatusIndicator
                status={status === 'online' ? 'online' : 'offline'}
              />
            )}
          </CometChatAvatar.Root>
        </div>
      )}

      {/* Body: Title + Subtitle */}
      <div className={'cometchat-group-members__item-body'}>
        {titleView ?? <span className={'cometchat-group-members__item-title'}>{name}</span>}
        {subtitleView}
      </div>

      {/* Trailing: Role Badge + Context Menu or Selection Controls */}
      {trailingView !== undefined ? (
        <div className={'cometchat-group-members__item-trailing'}>{trailingView}</div>
      ) : (
        <div className={'cometchat-group-members__item-trailing'}>
          {/* Selection Controls */}
          {ctx.selectionMode === 'multiple' && (
            <div
              onClick={e => {
                e.stopPropagation();
              }}
              onKeyDown={e => {
                e.stopPropagation();
              }}
              role="presentation"
            >
              <CometChatCheckbox
                checked={isSelected}
                onChange={handleCheckboxChange}
                aria-label={getLocalizedString('accessibility_select_item').replace('{name}', name)}
              />
            </div>
          )}
          {ctx.selectionMode === 'single' && (
            <div
              onClick={e => {
                e.stopPropagation();
              }}
              onKeyDown={e => {
                e.stopPropagation();
              }}
              role="presentation"
            >
              <CometChatRadioButton
                name="cometchat-group-members-selection"
                checked={isSelected}
                onChange={handleRadioChange}
                ariaLabel={getLocalizedString('accessibility_select_item').replace('{name}', name)}
              />
            </div>
          )}

          {/* Role Badge — visible by default, hidden on hover when menu is available */}
          {ctx.selectionMode === 'none' && scopeLabel && (
            <span
              className={`cometchat-group-members__item-role-badge cometchat-group-members__item-role-badge--${scope} ${contextMenuItems.length > 0 ? 'cometchat-group-members__item-role-badge--has-menu' : ''}`}
              aria-hidden="true"
            >
              {scopeLabel}
            </span>
          )}

          {/* Context Menu — hidden by default, shown on hover (replaces role badge) */}
          {ctx.selectionMode === 'none' && contextMenuItems.length > 0 && (
            <div
              className={'cometchat-group-members__item-menu'}
              onClick={e => {
                e.stopPropagation();
              }}
              onKeyDown={e => {
                e.stopPropagation();
              }}
              role="presentation"
            >
              <CometChatContextMenu.Root items={contextMenuItems} topMenuSize={0} placement="left">
                <CometChatContextMenu.Trigger>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 14.677c-.12 0-.233-.02-.337-.058a.77.77 0 0 1-.296-.196l-4.494-4.494a.52.52 0 0 1-.213-.523.52.52 0 0 1 .213-.531.527.527 0 0 1 .74 0L12 12.946l4.073-4.073a.52.52 0 0 1 .522-.212.52.52 0 0 1 .531.212.527.527 0 0 1 0 .74l-4.494 4.494a.77.77 0 0 1-.296.196.9.9 0 0 1-.336.058Z"
                      fill="currentColor"
                    />
                  </svg>
                </CometChatContextMenu.Trigger>
                <CometChatContextMenu.Dropdown>
                  {contextMenuItems.map(item => (
                    <CometChatContextMenu.Item key={item.id} item={item} variant="full" />
                  ))}
                </CometChatContextMenu.Dropdown>
              </CometChatContextMenu.Root>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const CometChatGroupMembersItem = React.memo(
  CometChatGroupMembersItemInner,
  (prev, next) =>
    prev.member.getUid() === next.member.getUid() &&
    prev.member.getScope() === next.member.getScope() &&
    prev.member.getName() === next.member.getName() &&
    prev.member.getAvatar() === next.member.getAvatar() &&
    prev.member.getStatus() === next.member.getStatus() &&
    prev.isActive === next.isActive &&
    prev.hideUserStatus === next.hideUserStatus &&
    prev.trailingView === next.trailingView
);

CometChatGroupMembersItem.displayName = 'CometChatGroupMembers.Item';
