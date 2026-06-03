import React, { useMemo } from 'react';
import type { CometChatReactionListRootProps } from './CometChatReactionList.types';
import { CometChatReactionListContext } from './CometChatReactionList.context';
import {
  useCometChatReactionList,
  type CometChatUseCometChatReactionListOptions,
} from './useCometChatReactionList';
import { CometChatReactionListTabs } from './CometChatReactionListTabs';
import { CometChatReactionListItems } from './CometChatReactionListItems';
import { CometChatReactionListLoadingState } from './CometChatReactionListLoadingState';
import { CometChatReactionListErrorState } from './CometChatReactionListErrorState';
import { CometChatReactionListEmptyState } from './CometChatReactionListEmptyState';
import './CometChatReactionList.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * Default layout rendered when no children are provided.
 * Shows tabs + items, with loading/error/empty states.
 */
const DefaultLayout: React.FC = () => {
  return (
    <>
      <CometChatReactionListTabs />
      <CometChatReactionListLoadingState />
      <CometChatReactionListErrorState />
      <CometChatReactionListEmptyState />
      <CometChatReactionListItems />
    </>
  );
};

/**
 * CometChatReactionList.Root — context provider and root container.
 *
 * Initializes the reaction list hook, provides context to sub-components.
 * When no children are provided, renders the default layout (Tabs + Items).
 */
export const CometChatReactionListRoot: React.FC<CometChatReactionListRootProps> = ({
  message,
  reactionsRequestBuilder,
  onItemClick,
  onEmpty,
  onError,
  children,
  className,
}) => {
  const hookOptions: CometChatUseCometChatReactionListOptions = { message };
  if (reactionsRequestBuilder !== undefined)
    hookOptions.reactionsRequestBuilder = reactionsRequestBuilder;
  if (onItemClick !== undefined) hookOptions.onItemClick = onItemClick;
  if (onEmpty !== undefined) hookOptions.onEmpty = onEmpty;
  if (onError !== undefined) hookOptions.onError = onError;

  const { getLocalizedString } = useLocale();
  const hookReturn = useCometChatReactionList(hookOptions);

  const contextValue = useMemo(
    () => ({
      ...hookReturn,
      message,
    }),
    [hookReturn, message]
  );

  const hasChildren = React.Children.count(children) > 0;

  const rootClass = ['cometchat-reaction-list', className ?? ''].filter(Boolean).join(' ');

  return (
    <CometChatReactionListContext.Provider value={contextValue}>
      <div
        className={rootClass}
        role="dialog"
        aria-label={getLocalizedString('accessibility_reaction_list')}
        aria-modal="false"
      >
        {hasChildren ? children : <DefaultLayout />}
      </div>
    </CometChatReactionListContext.Provider>
  );
};
