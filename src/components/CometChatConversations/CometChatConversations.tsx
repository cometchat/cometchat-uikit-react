import React from 'react';
import { CometChatConversationsRoot } from './CometChatConversationsRoot';
import { CometChatConversationsList } from './CometChatConversationsList';
import { CometChatConversationsItem } from './CometChatConversationsItem';
import { CometChatConversationsHeader } from './CometChatConversationsHeader';
import { CometChatConversationsSearchBar } from './CometChatConversationsSearchBar';
import { CometChatConversationsEmptyState } from './CometChatConversationsEmptyState';
import { CometChatConversationsErrorState } from './CometChatConversationsErrorState';
import { CometChatConversationsLoadingState } from './CometChatConversationsLoadingState';
import { useCometChatConversationsContext } from './CometChatConversations.context';
import type {
  CometChatConversationsProps,
  CometChatConversationsConvenienceProps,
} from './CometChatConversations.types';

/**
 * Internal component that reads context and renders the default layout
 * with convenience props injected. Must be rendered inside CometChatConversationsRoot.
 */
const CometChatConversationsDefaultLayout: React.FC<CometChatConversationsConvenienceProps> = ({
  leadingView,
  titleView,
  subtitleView,
  trailingView,
  itemView,
  headerView,
  loadingView,
  errorView,
  emptyView,
  searchView,
}) => {
  const { fetchState, conversations, showSearchBar } = useCometChatConversationsContext();

  return (
    <>
      {headerView !== undefined ? headerView : <CometChatConversationsHeader />}
      {showSearchBar &&
        (searchView !== undefined ? searchView : <CometChatConversationsSearchBar />)}
      {fetchState === 'loading' &&
        (loadingView !== undefined ? (
          <CometChatConversationsLoadingState>{loadingView}</CometChatConversationsLoadingState>
        ) : (
          <CometChatConversationsLoadingState />
        ))}
      {fetchState === 'error' &&
        (errorView !== undefined ? (
          <CometChatConversationsErrorState>{errorView}</CometChatConversationsErrorState>
        ) : (
          <CometChatConversationsErrorState />
        ))}
      {fetchState === 'empty' &&
        (emptyView !== undefined ? (
          <CometChatConversationsEmptyState>{emptyView}</CometChatConversationsEmptyState>
        ) : (
          <CometChatConversationsEmptyState />
        ))}
      {(fetchState === 'loaded' || conversations.length > 0) && (
        <CometChatConversationsList
          {...(itemView
            ? { itemView }
            : leadingView || titleView || subtitleView || trailingView
              ? {
                  itemView: conversation => (
                    <CometChatConversationsItem
                      conversation={conversation}
                      leadingView={leadingView?.(conversation)}
                      titleView={titleView?.(conversation)}
                      subtitleView={subtitleView?.(conversation)}
                      trailingView={trailingView?.(conversation)}
                    />
                  ),
                }
              : {})}
        />
      )}
    </>
  );
};

/**
 * CometChatConversations — Direct flat API component.
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatConversations
 *   onItemClick={handleConversationClick}
 *   subtitleView={(conversation) => <CustomSubtitle conversation={conversation} />}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatConversations.Root selectionMode="multiple" onSelect={handleSelect}>
 *   <CometChatConversations.Header />
 *   <CometChatConversations.SearchBar />
 *   <CometChatConversations.List />
 * </CometChatConversations.Root>
 * ```
 */
const CometChatConversationsComponent: React.FC<CometChatConversationsProps> = ({
  leadingView,
  titleView,
  subtitleView,
  trailingView,
  itemView,
  headerView,
  loadingView,
  errorView,
  emptyView,
  searchView,
  ...rootProps
}) => {
  const hasConvenienceProps =
    leadingView !== undefined ||
    titleView !== undefined ||
    subtitleView !== undefined ||
    trailingView !== undefined ||
    itemView !== undefined ||
    headerView !== undefined ||
    loadingView !== undefined ||
    errorView !== undefined ||
    emptyView !== undefined ||
    searchView !== undefined;

  if (!hasConvenienceProps) {
    return <CometChatConversationsRoot {...rootProps} />;
  }

  return (
    <CometChatConversationsRoot {...rootProps}>
      <CometChatConversationsDefaultLayout
        {...{
          ...(leadingView !== undefined && { leadingView }),
          ...(titleView !== undefined && { titleView }),
          ...(subtitleView !== undefined && { subtitleView }),
          ...(trailingView !== undefined && { trailingView }),
          ...(itemView !== undefined && { itemView }),
          ...(headerView !== undefined && { headerView }),
          ...(loadingView !== undefined && { loadingView }),
          ...(errorView !== undefined && { errorView }),
          ...(emptyView !== undefined && { emptyView }),
          ...(searchView !== undefined && { searchView }),
        }}
      />
    </CometChatConversationsRoot>
  );
};

CometChatConversationsComponent.displayName = 'CometChatConversations';

/**
 * CometChatConversations — Compound component namespace with flat API.
 *
 * - `<CometChatConversations ... />` — flat API with convenience props
 * - `<CometChatConversations.Root>...</CometChatConversations.Root>` — compound composition
 */
export const CometChatConversations = Object.assign(CometChatConversationsComponent, {
  Root: CometChatConversationsRoot,
  List: CometChatConversationsList,
  Item: CometChatConversationsItem,
  Header: CometChatConversationsHeader,
  SearchBar: CometChatConversationsSearchBar,
  EmptyState: CometChatConversationsEmptyState,
  ErrorState: CometChatConversationsErrorState,
  LoadingState: CometChatConversationsLoadingState,
});
