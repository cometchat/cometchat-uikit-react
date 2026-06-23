/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import React, { useCallback, useRef } from 'react';
import type { CometChatCallLogsProps } from './CometChatCallLogs.types';
import { useCometChatCallLogs } from './useCometChatCallLogs';
import { verifyCallUser, isSentByMe, isMissedCall } from './CometChatCallLogs.utils';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { CometChatDate } from '../base/CometChatDate';
import { CometChatCallButtons } from '../CometChatCallButtons/CometChatCallButtons';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import emptyIcon from '../../assets/call-logs_empty_state.svg';
import errorIcon from '../../assets/list_error_state_icon.svg';
import './CometChatCallLogs.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatCallLogs — displays a list of call logs with the ability to initiate calls.
 *
 * Uses CometChatCallButtons for the trailing call action, which handles
 * the entire call flow (outgoing + ongoing) independently.
 */
export const CometChatCallLogs: React.FC<CometChatCallLogsProps> = ({
  activeCall,
  callLogRequestBuilder,
  callInitiatedDateTimeFormat,
  onItemClick,
  onCallButtonClicked,
  onError,
  callSettingsBuilder,
  loadingView,
  emptyView,
  errorView,
  itemView,
  leadingView,
  titleView,
  subtitleView,
  trailingView,
  showScrollbar = false,
}) => {
  const { callList, fetchState, loggedInUser, fetchNext } = useCometChatCallLogs({
    callLogRequestBuilder,
    onError,
    onCallButtonClicked,
  });

  const { getLocalizedString } = useLocale();
  const listRef = useRef<HTMLDivElement>(null);

  // --- Scroll handler for infinite scroll ---
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      void fetchNext();
    }
  }, [fetchNext]);

  // --- Subtitle view ---
  const getSubtitleView = (call: any) => {
    if (subtitleView) return subtitleView(call);
    if (!loggedInUser) return null;

    const sentByMe = isSentByMe(call, loggedInUser);
    const missed = isMissedCall(call, loggedInUser);

    const iconClass = sentByMe
      ? 'cometchat-call-logs__list-item-subtitle-icon-outgoing-call'
      : missed
        ? 'cometchat-call-logs__list-item-subtitle-icon-missed-call'
        : 'cometchat-call-logs__list-item-subtitle-icon-incoming-call';

    const initiatedAt: number = (call.initiatedAt ?? call.getInitiatedAt?.() ?? 0) as number;

    return (
      <div className={'cometchat-call-logs__list-item-subtitle'}>
        <div className={`cometchat-call-logs__list-item-subtitle-icon ${iconClass}`} />
        <div className={'cometchat-call-logs__list-item-subtitle-text'}>
          {initiatedAt > 0 ? (
            <CometChatDate
              timestamp={initiatedAt}
              formatConfig={
                callInitiatedDateTimeFormat ?? {
                  today: 'DD MMM, hh:mm A',
                  yesterday: 'DD MMM, hh:mm A',
                  lastWeek: 'DD MMM, hh:mm A',
                  otherDays: 'DD MMM, hh:mm A',
                }
              }
              variant="body"
            />
          ) : (
            ''
          )}
        </div>
      </div>
    );
  };

  // --- Trailing view (CometChatCallButtons filtered by call type) ---
  const getTrailingView = (call: any) => {
    if (trailingView) return trailingView(call);
    if (!loggedInUser) return null;

    const callType = call.type ?? call.getType?.() ?? 'audio';
    const isVideo = callType === CometChat.CALL_TYPE.VIDEO || callType === 'video';
    const isAudio = !isVideo;

    // Get the user entity from the call log
    const entity = verifyCallUser(call, loggedInUser);
    const uid: string = (entity?.uid ?? entity?.getUid?.()) as string;

    if (!uid) return null;

    // Create a minimal user object for CometChatCallButtons
    // We need to construct a CometChat.User to pass to the component
    const callUser = entity as CometChat.User | undefined;

    if (!callUser) return null;

    // If onCallButtonClicked is provided, use custom handler
    if (onCallButtonClicked) {
      const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCallButtonClicked(call);
      };

      const trailingClass = isVideo
        ? `cometchat-call-logs__list-item-trailing-view cometchat-call-logs__list-item-trailing-view-video`
        : `cometchat-call-logs__list-item-trailing-view cometchat-call-logs__list-item-trailing-view-audio`;

      return (
        <div
          className={trailingClass}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label={
            isVideo
              ? getLocalizedString('accessibility_video_call')
              : getLocalizedString('accessibility_voice_call')
          }
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onCallButtonClicked(call);
            }
          }}
        />
      );
    }

    // Use CometChatCallButtons filtered by call type
    return (
      <div
        onClick={e => {
          e.stopPropagation();
        }}
        role="presentation"
      >
        <CometChatCallButtons
          user={callUser}
          hideVoiceCallButton={isVideo}
          hideVideoCallButton={isAudio}
          callSettingsBuilder={callSettingsBuilder}
          onError={onError}
        />
      </div>
    );
  };

  // --- Render a single list item ---
  const renderListItem = (call: any, index: number) => {
    if (itemView) return <React.Fragment key={index}>{itemView(call)}</React.Fragment>;
    if (!loggedInUser) return null;

    const entity = verifyCallUser(call, loggedInUser);
    const name = entity?.getName?.() ?? entity?.name ?? 'Unknown';
    const avatar =
      entity?.getAvatar?.() ?? entity?.avatar ?? entity?.getIcon?.() ?? entity?.icon ?? '';
    const isActive = activeCall?.getSessionID?.() === call?.getSessionID?.();

    const itemClasses = [
      'cometchat-call-logs__list-item',
      isActive ? 'cometchat-call-logs__list-item-active' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={index}
        className={itemClasses}
        onClick={() => onItemClick?.(call)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter') onItemClick?.(call);
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {leadingView ? (
            leadingView(call)
          ) : (
            <CometChatAvatar.Root name={name} image={avatar} size="medium">
              <CometChatAvatar.Image />
              <CometChatAvatar.Initials />
            </CometChatAvatar.Root>
          )}
          <div
            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {titleView ? (
              titleView(call)
            ) : (
              <div
                style={{
                  font: 'var(--cometchat-font-heading4-medium, 500 16px Roboto)',
                  color: 'var(--cometchat-text-color-primary, #141414)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </div>
            )}
            {getSubtitleView(call)}
          </div>
          {getTrailingView(call)}
        </div>
      </div>
    );
  };

  // --- Loading view ---
  const renderLoadingView = () => {
    if (loadingView) return loadingView;
    return (
      <div className={'cometchat-call-logs__shimmer'}>
        {Array.from({ length: 15 }).map((_, index) => (
          <div key={index} className={'cometchat-call-logs__shimmer-item'}>
            <div className={'cometchat-call-logs__shimmer-item-avatar'} />
            <div className={'cometchat-call-logs__shimmer-item-body'}>
              <div className={'cometchat-call-logs__shimmer-item-body-title-wrapper'}>
                <div className={'cometchat-call-logs__shimmer-item-body-title'} />
                <div className={'cometchat-call-logs__shimmer-item-body-subtitle'} />
              </div>
              <div className={'cometchat-call-logs__shimmer-item-body-tail'} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --- Empty view ---
  const renderEmptyView = () => {
    if (emptyView) return emptyView;
    return (
      <div className={'cometchat-call-logs__empty-state-view'}>
        <div className={'cometchat-call-logs__empty-state-view-icon'}>
          <img src={emptyIcon} alt="" width={120} height={120} />
        </div>
        <div className={'cometchat-call-logs__empty-state-view-body'}>
          <div className={'cometchat-call-logs__empty-state-view-body-title'}>No Call Logs Yet</div>
          <div className={'cometchat-call-logs__empty-state-view-body-description'}>
            Start a call to see your call history here
          </div>
        </div>
      </div>
    );
  };

  // --- Error view ---
  const renderErrorView = () => {
    if (errorView) return errorView;
    return (
      <div className={'cometchat-call-logs__error-state-view'}>
        <img
          src={errorIcon}
          alt=""
          aria-hidden="true"
          className={'cometchat-call-logs__error-state-view-icon'}
        />
        <div className={'cometchat-call-logs__error-state-view-body'}>
          <div className={'cometchat-call-logs__error-state-view-body-title'}>
            {getLocalizedString('component_error_title')}
          </div>
          <div className={'cometchat-call-logs__error-state-view-body-description'}>
            {getLocalizedString('call_logs_error_subtitle')}
          </div>
        </div>
      </div>
    );
  };

  const rootClasses = [
    'cometchat-call-logs',
    !showScrollbar ? 'cometchat-call-logs-hide-scrollbar' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {/* Header */}
      <div className={'cometchat-call-logs__header'}>{getLocalizedString('call_logs_title')}</div>

      {/* Content */}
      {(fetchState === 'loading' || fetchState === 'idle') && renderLoadingView()}
      {fetchState === 'empty' && renderEmptyView()}
      {fetchState === 'error' && renderErrorView()}
      {fetchState === 'loaded' && (
        <div ref={listRef} className={'cometchat-call-logs__list'} onScroll={handleScroll}>
          {callList.map((call, index) => renderListItem(call, index))}
        </div>
      )}
    </div>
  );
};

CometChatCallLogs.displayName = 'CometChatCallLogs';
