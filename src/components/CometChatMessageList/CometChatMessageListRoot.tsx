import React, { useMemo } from 'react';
import { useCometChatMessageList } from './useCometChatMessageList';
import { CometChatMessageListProvider } from './CometChatMessageList.context';
import { CometChatMessageListView } from './CometChatMessageListView';
import { CometChatMessageListLoadingState } from './CometChatMessageListLoadingState';
import { CometChatMessageListErrorState } from './CometChatMessageListErrorState';
import { CometChatMessageListEmptyState } from './CometChatMessageListEmptyState';
import { CometChatMessageListAIFooter } from './CometChatMessageListAIFooter';
import type { CometChatMessageListRootProps } from './CometChatMessageList.types';
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
    </CometChatMessageListProvider>
  );
};

CometChatMessageListRoot.displayName = 'CometChatMessageList.Root';
