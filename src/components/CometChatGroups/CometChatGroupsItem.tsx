import React, { useCallback } from 'react';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { CometChatCheckbox } from '../base/CometChatCheckbox/CometChatCheckbox';
import { CometChatRadioButton } from '../base/CometChatRadioButton/CometChatRadioButton';
import { CometChatContextMenu } from '../base/CometChatContextMenu/CometChatContextMenu';
import { useCometChatGroupsContext } from './CometChatGroups.context';
import { useLocale } from '../../context/locale/LocaleContext';
import type { CometChatGroupsItemProps } from './CometChatGroups.types';
import type { CometChatContextMenuItemData } from '../base/CometChatContextMenu/CometChatContextMenu.types';
import './CometChatGroups.css';

/**
 * CometChatGroupsItem — Individual group item (avatar, name, type icon, member count, trailing).
 *
 * Uses base components: CometChatAvatar, CometChatCheckbox, CometChatRadioButton.
 * Memoized to prevent unnecessary re-renders in large lists.
 */
function CometChatGroupsItemInner({
  group,
  isActive: isActiveProp,
  leadingView,
  titleView,
  subtitleView,
  trailingView,
}: CometChatGroupsItemProps) {
  const ctx = useCometChatGroupsContext();
  const { getLocalizedString } = useLocale();
  const guid = group.getGuid();
  const name = group.getName();
  const icon = group.getIcon();
  const groupType = group.getType();
  const membersCount = group.getMembersCount();

  const isActive = isActiveProp ?? ctx.activeGroupId === guid;
  const isSelected = ctx.selectedGroupIds.includes(guid);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      ctx.handleItemClick(group, { shiftKey: e.shiftKey });
    },
    [ctx, group]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ctx.handleItemClick(group, { shiftKey: e.shiftKey });
      }
    },
    [ctx, group]
  );

  const handleCheckboxChange = useCallback(
    (event: { checked: boolean; shiftKey?: boolean | undefined }) => {
      ctx.handleItemClick(group, { shiftKey: event.shiftKey ?? false });
    },
    [ctx, group]
  );

  const handleRadioChange = useCallback(() => {
    ctx.handleItemClick(group);
  }, [ctx, group]);

  const getTypeAriaLabel = (): string => {
    switch (groupType) {
      case 'public':
        return 'Public group';
      case 'private':
        return 'Private group';
      case 'password':
        return 'Password protected group';
      default:
        return 'Group';
    }
  };

  const classNames = [
    'cometchat-groups__item',
    isActive ? 'cometchat-groups__item--active' : '',
    isSelected ? 'cometchat-groups__item--selected' : '',
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
      {/* Leading: CometChatAvatar + Group type status badge */}
      {leadingView ?? (
        <div className={'cometchat-groups__item-avatar'}>
          <CometChatAvatar.Root name={name} image={icon} size="medium">
            <CometChatAvatar.Image />
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
          {!ctx.hideGroupType && groupType === 'private' && (
            <span
              className={`cometchat-groups__item-type-badge cometchat-groups__item-type-badge--private`}
              aria-label={getTypeAriaLabel()}
              role="img"
            >
              <span className={'cometchat-groups__item-type-badge-icon--shield'} />
            </span>
          )}
          {!ctx.hideGroupType && groupType === 'password' && (
            <span
              className={`cometchat-groups__item-type-badge cometchat-groups__item-type-badge--password`}
              aria-label={getTypeAriaLabel()}
              role="img"
            >
              <span className={'cometchat-groups__item-type-badge-icon--lock'} />
            </span>
          )}
        </div>
      )}

      {/* Body: Title + Subtitle (member count) */}
      <div className={'cometchat-groups__item-body'}>
        {titleView ?? <span className={'cometchat-groups__item-title'}>{name}</span>}
        {subtitleView ?? (
          <span className={'cometchat-groups__item-subtitle'}>
            <span className={'cometchat-groups__item-member-count'}>
              {membersCount}{' '}
              {membersCount === 1
                ? getLocalizedString('message_header_member')
                : getLocalizedString('message_header_members')}
            </span>
          </span>
        )}
      </div>

      {/* Trailing: CometChatCheckbox / CometChatRadioButton or custom */}
      {trailingView !== undefined ? (
        <div className={'cometchat-groups__item-trailing'}>{trailingView}</div>
      ) : ctx.selectionMode === 'multiple' ? (
        <div
          className={'cometchat-groups__item-trailing'}
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
          className={'cometchat-groups__item-trailing'}
          onClick={e => {
            e.stopPropagation();
          }}
          onKeyDown={e => {
            e.stopPropagation();
          }}
          role="presentation"
        >
          <CometChatRadioButton
            name="cometchat-groups-selection"
            checked={isSelected}
            onChange={handleRadioChange}
            ariaLabel={getLocalizedString('accessibility_select_item').replace('{name}', name)}
          />
        </div>
      ) : null}

      {/* Hover menu: CometChatContextMenu for group options */}
      {ctx.options && (
        <div
          className={'cometchat-groups__item-menu'}
          onClick={e => {
            e.stopPropagation();
          }}
          onKeyDown={e => {
            e.stopPropagation();
          }}
          role="presentation"
        >
          <CometChatContextMenu.Root
            items={ctx.options(group).map(
              (opt): CometChatContextMenuItemData => ({
                id: opt.id,
                title: opt.title,
                ...(opt.iconURL ? { iconURL: opt.iconURL } : {}),
                onClick: () => {
                  opt.onClick(group);
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

export const CometChatGroupsItem = React.memo(
  CometChatGroupsItemInner,
  (prev, next) =>
    prev.group.getGuid() === next.group.getGuid() &&
    prev.group.getName() === next.group.getName() &&
    prev.group.getIcon() === next.group.getIcon() &&
    prev.group.getMembersCount() === next.group.getMembersCount() &&
    prev.group.getType() === next.group.getType() &&
    prev.isActive === next.isActive
);

CometChatGroupsItem.displayName = 'CometChatGroups.Item';
