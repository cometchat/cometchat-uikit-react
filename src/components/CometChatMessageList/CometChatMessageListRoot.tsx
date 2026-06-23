import React, { useMemo, useState } from 'react';
import { useCometChatMessageList } from './useCometChatMessageList';
import { CometChatMessageListProvider } from './CometChatMessageList.context';
import { CometChatMessageListView } from './CometChatMessageListView';
import { CometChatMessageListLoadingState } from './CometChatMessageListLoadingState';
import { CometChatMessageListErrorState } from './CometChatMessageListErrorState';
import { CometChatMessageListEmptyState } from './CometChatMessageListEmptyState';
import { CometChatMessageListAIFooter } from './CometChatMessageListAIFooter';
import { CometChatOngoingCall } from '../CometChatOngoingCall/CometChatOngoingCall';
import type { CometChatMessageListRootProps } from './CometChatMessageList.types';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import './CometChatMessageList.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatMessageListRoot — Provider + default layout.
 *
 * Wraps children with the MessageList context. If no children are provided,
 * renders the default layout (LoadingState + ErrorState + EmptyState + View + Footer).
 *
 * Usage (compound):
 * ```tsx
 * <CometChatMessageList.Root user={chatUser} loggedInUser={me}>
 *   <CometChatMessageList.LoadingState />
 *   <CometChatMessageList.ErrorState />
 *   <CometChatMessageList.EmptyState />
 *   <CometChatMessageList.View />
 * </CometChatMessageList.Root>
 * ```
 */
export const CometChatMessageListRoot: React.FC<CometChatMessageListRootProps> = ({
  children,
  className,
  ...hookOptionsProps
}) => {
  const { getLocalizedString } = useLocale();
  const hookReturn = useCometChatMessageList(hookOptionsProps);

  const hasChildren = React.Children.count(children) > 0;

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => hookReturn, [hookReturn]);

  // --- Ongoing call state (for "Join" button in call bubbles) ---
  const [ongoingCallSessionId, setOngoingCallSessionId] = useState<string>('');
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);

  useCometChatEvents(
    event => {
      if (event.type === 'ui:call/join') {
        const joinEvent = event as {
          type: 'ui:call/join';
          sessionId: string;
          message: CometChat.BaseMessage;
        };
        const msg = joinEvent.message as CometChat.CustomMessage;
        const customData = msg.getCustomData() as Record<string, unknown> | undefined;
        const callType = customData?.callType;
        setIsAudioOnly(callType === 'audio');
        setOngoingCallSessionId(joinEvent.sessionId);
      }
      if (event.type === 'ui:call/ended') {
        setOngoingCallSessionId('');
      }
    },
    [hookOptionsProps.user?.getUid(), hookOptionsProps.group?.getGuid()]
  );

  return (
    <CometChatMessageListProvider value={contextValue}>
      <div
        className={['cometchat-message-list', 'cometchat-message-list', className]
          .filter(Boolean)
          .join(' ')}
        role="region"
        aria-label={getLocalizedString('accessibility_message_list')}
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatMessageListLoadingState />
            <CometChatMessageListErrorState />
            <CometChatMessageListEmptyState />
            <CometChatMessageListView />
            <CometChatMessageListAIFooter />
          </>
        )}
      </div>

      {/* OngoingCall — rendered when user clicks "Join" on a call bubble */}
      {ongoingCallSessionId && (
        <CometChatOngoingCall
          sessionID={ongoingCallSessionId}
          isAudioOnly={isAudioOnly}
          isDirectCalling={true}
          onCallEnded={() => {
            CometChat.clearActiveCall();
            setOngoingCallSessionId('');
          }}
        />
      )}
    </CometChatMessageListProvider>
  );
};

CometChatMessageListRoot.displayName = 'CometChatMessageList.Root';
