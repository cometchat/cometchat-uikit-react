import React, { useCallback, useMemo, useRef } from 'react';
import type {
  CometChatMessageHeaderRootProps,
  CometChatMessageHeaderContextValue,
} from './CometChatMessageHeader.types';
import { CometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import { useCometChatMessageHeader } from './useCometChatMessageHeader';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { usePublishEvent } from '../../hooks/usePublishEvent';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import { CometChatMessageHeaderBackButton } from './CometChatMessageHeaderBackButton';
import { CometChatMessageHeaderAvatar } from './CometChatMessageHeaderAvatar';
import { CometChatMessageHeaderTitle } from './CometChatMessageHeaderTitle';
import { CometChatMessageHeaderSubtitle } from './CometChatMessageHeaderSubtitle';
import { CometChatMessageHeaderCallButtons } from './CometChatMessageHeaderCallButtons';
import { CometChatMessageHeaderSearchButton } from './CometChatMessageHeaderSearchButton';
import { CometChatMessageHeaderSummaryButton } from './CometChatMessageHeaderSummaryButton';
import { CometChatMessageHeaderOverflowMenu } from './CometChatMessageHeaderOverflowMenu';
import { useLocale } from '../../context/locale/LocaleContext';
import { useGlobalConfig } from '../../context/GlobalConfigContext';
import './CometChatMessageHeader.css';

/**
 * CometChatMessageHeaderRoot — container + context provider.
 *
 * Provides message header context to all sub-components.
 * If no children are provided, renders the default layout:
 * BackButton (optional) + Content (Avatar + Title + Subtitle) + Trailing (CallButtons + Menu).
 *
 * Call logic is fully delegated to CometChatCallButtons (rendered by CometChatMessageHeaderCallButtons).
 */
export const CometChatMessageHeaderRoot: React.FC<CometChatMessageHeaderRootProps> = ({
  user,
  group,
  hideUserStatus: hideUserStatusProp,
  hideBackButton = false,
  showSearchOption = true,
  showConversationSummaryButton = false,
  enableAutoSummaryGeneration = false,
  summaryGenerationMessageCount = 1000,
  hideVoiceCallButton = false,
  hideVideoCallButton = false,
  callSettingsBuilder,
  onBack,
  onItemClick,
  onSearchOptionClicked,
  onSummaryClick,
  onVoiceCallClick,
  onVideoCallClick,
  onError,
  className,
  children,
}) => {
  const globalConfig = useGlobalConfig();
  const hideUserStatus = hideUserStatusProp ?? globalConfig.hideUserStatus ?? false;
  const hookResult = useCometChatMessageHeader({
    user,
    group,
    hideUserStatus,
    ...(onError !== undefined && { onError }),
  });

  const { getLocalizedString } = useLocale();

  const publish = usePublishEvent();

  const onSummaryClickRef = useRef(onSummaryClick);
  onSummaryClickRef.current = onSummaryClick;

  // Default summary click handler: publishes ui:panel/show event
  const defaultSummaryClick = useCallback(() => {
    publish({ type: 'ui:panel/show', position: 'messageListFooter', panel: 'conversationSummary' });
  }, [publish]);

  const effectiveSummaryClick = onSummaryClick ?? defaultSummaryClick;

  useCometChatEvents(
    event => {
      if (
        event.type === 'ui:active-chat/changed' &&
        enableAutoSummaryGeneration &&
        showConversationSummaryButton
      ) {
        const activeChatEvent = event as {
          type: 'ui:active-chat/changed';
          unreadMessageCount?: number;
        };
        if (
          activeChatEvent.unreadMessageCount !== undefined &&
          activeChatEvent.unreadMessageCount >= 15
        ) {
          (onSummaryClickRef.current ?? defaultSummaryClick)();
        }
      }
    },
    [enableAutoSummaryGeneration, showConversationSummaryButton, defaultSummaryClick]
  );

  // Derive display values
  const displayName = user ? user.getName() : group ? group.getName() : '';
  const avatarImage = user ? user.getAvatar() : group ? group.getIcon() : '';
  const avatarName = user ? user.getName() : group ? group.getName() : '';
  const isUserConversation = !!user;
  const isGroupConversation = !!group;

  // Handle item click (content area)
  const handleItemClick = useCallback(() => {
    const entity = user ?? group;
    if (entity && onItemClick) {
      onItemClick(entity);
    }
  }, [user, group, onItemClick]);

  const handleItemKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleItemClick();
      }
    },
    [handleItemClick]
  );

  // Build ARIA label
  const ariaLabel = useMemo(() => {
    if (user) {
      const statusText =
        hookResult.userStatus === 'online'
          ? getLocalizedString('message_header_online')
          : getLocalizedString('message_header_offline');
      return `${displayName}, ${statusText}`;
    }
    if (group) {
      const memberText =
        hookResult.groupMemberCount === 1
          ? getLocalizedString('message_header_member')
          : getLocalizedString('message_header_members');
      return `${displayName}, ${String(hookResult.groupMemberCount)} ${memberText}`;
    }
    return 'Message header';
  }, [
    user,
    group,
    displayName,
    hookResult.userStatus,
    hookResult.groupMemberCount,
    getLocalizedString,
  ]);

  // Build context value (no longer includes call state/actions)
  const contextValue: CometChatMessageHeaderContextValue = useMemo(
    () => ({
      user: user ?? null,
      group: group ?? null,
      userStatus: hookResult.userStatus,
      lastActiveAt: hookResult.lastActiveAt,
      isTyping: hookResult.isTyping,
      typingText: hookResult.typingText,
      groupMemberCount: hookResult.groupMemberCount,
      hideUserStatus,
      displayName,
      avatarImage,
      avatarName,
      isUserConversation,
      isGroupConversation,
      // Callbacks
      onBack,
      onItemClick,
      onSearchOptionClicked,
      onSummaryClick: effectiveSummaryClick,
      summaryGenerationMessageCount,
    }),
    [
      user,
      group,
      hookResult,
      hideUserStatus,
      displayName,
      avatarImage,
      avatarName,
      isUserConversation,
      isGroupConversation,
      onBack,
      onItemClick,
      onSearchOptionClicked,
      effectiveSummaryClick,
      summaryGenerationMessageCount,
    ]
  );

  const rootClasses = ['cometchat-message-header', 'cometchat-message-header', className]
    .filter(Boolean)
    .join(' ');

  // Determine trailing section content — call buttons hidden when calling is not enabled
  const callingEnabled = CometChatUIKit.getSettings()?.isCallingEnabled() ?? false;
  const effectiveHideVoiceCall = hideVoiceCallButton || !callingEnabled;
  const effectiveHideVideoCall = hideVideoCallButton || !callingEnabled;
  const showCallButtons = !effectiveHideVoiceCall || !effectiveHideVideoCall;
  const showOverflowMenu = showSearchOption && showConversationSummaryButton;
  const showSearchOnly = showSearchOption && !showConversationSummaryButton;
  const showSummaryOnly = showConversationSummaryButton && !showSearchOption;

  return (
    <CometChatMessageHeaderContext.Provider value={contextValue}>
      <div className={rootClasses} role="banner" aria-label={ariaLabel}>
        {children ?? (
          <>
            {/* Back Button */}
            {!hideBackButton && <CometChatMessageHeaderBackButton />}

            {/* Main Content (clickable) */}
            <div
              className={'cometchat-message-header__content'}
              role="button"
              tabIndex={0}
              aria-label={`${displayName}. ${getLocalizedString('accessibility_click_for_details')}`}
              onClick={handleItemClick}
              onKeyDown={handleItemKeyDown}
            >
              {/* Leading: Avatar + Status */}
              <CometChatMessageHeaderAvatar />

              {/* Body: Title + Subtitle */}
              <div className={'cometchat-message-header__body'}>
                <CometChatMessageHeaderTitle />
                <CometChatMessageHeaderSubtitle />
              </div>
            </div>

            {/* Trailing: Call Buttons + Menu */}
            <div className={'cometchat-message-header__trailing'}>
              {showCallButtons && (
                <CometChatMessageHeaderCallButtons
                  onVoiceCallClick={onVoiceCallClick}
                  onVideoCallClick={onVideoCallClick}
                  onError={onError}
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  callSettingsBuilder={callSettingsBuilder}
                  hideVoiceCallButton={effectiveHideVoiceCall}
                  hideVideoCallButton={effectiveHideVideoCall}
                />
              )}

              {/* Menu Section */}
              <div className={'cometchat-message-header__menu-buttons'}>
                {showOverflowMenu && <CometChatMessageHeaderOverflowMenu />}
                {showSearchOnly && <CometChatMessageHeaderSearchButton />}
                {showSummaryOnly && <CometChatMessageHeaderSummaryButton />}
              </div>
            </div>
          </>
        )}
      </div>
    </CometChatMessageHeaderContext.Provider>
  );
};

CometChatMessageHeaderRoot.displayName = 'CometChatMessageHeaderRoot';
