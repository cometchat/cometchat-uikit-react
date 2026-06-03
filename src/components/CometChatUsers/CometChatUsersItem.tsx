import React, { useCallback } from 'react';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { CometChatCheckbox } from '../base/CometChatCheckbox/CometChatCheckbox';
import { CometChatRadioButton } from '../base/CometChatRadioButton/CometChatRadioButton';
import { CometChatContextMenu } from '../base/CometChatContextMenu/CometChatContextMenu';
import { useCometChatUsersContext } from './CometChatUsers.context';
import { useLocale } from '../../context/locale/LocaleContext';
import type { CometChatUsersItemProps } from './CometChatUsers.types';
import type { CometChatContextMenuItemData } from '../base/CometChatContextMenu/CometChatContextMenu.types';
import './CometChatUsers.css';

/**
 * CometChatUsersItem — Individual user item (avatar, name, status, trailing).
 *
 * Uses base components: CometChatAvatar, CometChatCheckbox, CometChatRadioButton.
 * Memoized to prevent unnecessary re-renders in large lists.
 */
function CometChatUsersItemInner({
  user,
  hideUserStatus: hideUserStatusProp,
  isActive: isActiveProp,
  leadingView,
  titleView,
  subtitleView,
  trailingView,
}: CometChatUsersItemProps) {
  const ctx = useCometChatUsersContext();
  const { getLocalizedString } = useLocale();
  const uid = user.getUid();
  const name = user.getName();
  const avatar = user.getAvatar();
  const status = user.getStatus();

  const isActive = isActiveProp ?? ctx.activeUserId === uid;
  const isSelected = ctx.selectedUserIds.includes(uid);
  const hideStatus = hideUserStatusProp ?? ctx.hideUserStatus;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      ctx.handleItemClick(user, { shiftKey: e.shiftKey });
    },
    [ctx, user]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ctx.handleItemClick(user, { shiftKey: e.shiftKey });
      }
    },
    [ctx, user]
  );

  const handleCheckboxChange = useCallback(
    (event: { checked: boolean; shiftKey?: boolean | undefined }) => {
      ctx.handleItemClick(user, { shiftKey: event.shiftKey ?? false });
    },
    [ctx, user]
  );

  const handleRadioChange = useCallback(() => {
    ctx.handleItemClick(user);
  }, [ctx, user]);

  const classNames = [
    'cometchat-users__item',
    isActive ? 'cometchat-users__item--active' : '',
    isSelected ? 'cometchat-users__item--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      role="option"
      aria-selected={isSelected || isActive}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Leading: CometChatAvatar + Status Indicator */}
      {leadingView ?? (
        <div className={'cometchat-users__item-avatar'}>
          <CometChatAvatar.Root name={name} image={avatar} size="medium">
            <CometChatAvatar.Image />
            <CometChatAvatar.Initials />
            {!hideStatus && (
              <CometChatAvatar.StatusIndicator
                status={status === 'online' ? 'online' : 'offline'}
              />
            )}
          </CometChatAvatar.Root>
        </div>
      )}

      {/* Body: Title + Subtitle */}
      <div className={'cometchat-users__item-body'}>
        {titleView ?? <span className={'cometchat-users__item-title'}>{name}</span>}
        {subtitleView}
      </div>

      {/* Trailing: CometChatCheckbox / CometChatRadioButton or custom */}
      {trailingView !== undefined ? (
        <div className={'cometchat-users__item-trailing'}>{trailingView}</div>
      ) : ctx.selectionMode === 'multiple' ? (
        <div
          className={'cometchat-users__item-trailing'}
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
      ) : ctx.selectionMode === 'single' ? (
        <div
          className={'cometchat-users__item-trailing'}
          onClick={e => {
            e.stopPropagation();
          }}
          onKeyDown={e => {
            e.stopPropagation();
          }}
          role="presentation"
        >
          <CometChatRadioButton
            name="cometchat-users-selection"
            checked={isSelected}
            onChange={handleRadioChange}
            ariaLabel={getLocalizedString('accessibility_select_item').replace('{name}', name)}
          />
        </div>
      ) : null}

      {/* Hover menu: CometChatContextMenu for user options */}
      {ctx.options && (
        <div
          className={'cometchat-users__item-menu'}
          onClick={e => {
            e.stopPropagation();
          }}
          onKeyDown={e => {
            e.stopPropagation();
          }}
          role="presentation"
        >
          <CometChatContextMenu.Root
            items={ctx.options(user).map(
              (opt): CometChatContextMenuItemData => ({
                id: opt.id,
                title: opt.title,
                ...(opt.iconURL ? { iconURL: opt.iconURL } : {}),
                onClick: () => {
                  opt.onClick(user);
                },
              })
            )}
            topMenuSize={0}
            placement="left"
          />
        </div>
      )}
    </div>
  );
}

export const CometChatUsersItem = React.memo(
  CometChatUsersItemInner,
  (prev, next) =>
    prev.user.getUid() === next.user.getUid() &&
    prev.user.getStatus() === next.user.getStatus() &&
    prev.user.getName() === next.user.getName() &&
    prev.user.getAvatar() === next.user.getAvatar() &&
    prev.isActive === next.isActive &&
    prev.hideUserStatus === next.hideUserStatus
);

CometChatUsersItem.displayName = 'CometChatUsers.Item';
