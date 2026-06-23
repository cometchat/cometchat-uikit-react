import React from 'react';
import { CometChatNotificationFeedRoot } from './CometChatNotificationFeedRoot';
import { CometChatNotificationFeedList } from './CometChatNotificationFeedList';
import { CometChatNotificationFeedItem } from './CometChatNotificationFeedItem';
import { CometChatNotificationFeedHeader } from './CometChatNotificationFeedHeader';
import { CometChatNotificationFeedFilterChips } from './CometChatNotificationFeedFilterChips';
import { CometChatNotificationFeedEmptyState } from './CometChatNotificationFeedEmptyState';
import { CometChatNotificationFeedErrorState } from './CometChatNotificationFeedErrorState';
import { CometChatNotificationFeedLoadingState } from './CometChatNotificationFeedLoadingState';
import { useCometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import type {
  CometChatNotificationFeedProps,
  CometChatNotificationFeedConvenienceProps,
} from './CometChatNotificationFeed.types';

/**
 * Internal component that reads context and renders the default layout
 * with convenience props injected. Must be rendered inside CometChatNotificationFeedRoot.
 */
const CometChatNotificationFeedDefaultLayout: React.FC<
  CometChatNotificationFeedConvenienceProps
> = ({ headerView, loadingView, errorView, emptyView, itemView }) => {
  const { screenState, items } = useCometChatNotificationFeedContext();

  return (
    <>
      {headerView !== undefined ? headerView : <CometChatNotificationFeedHeader />}
      <CometChatNotificationFeedFilterChips />
      {screenState === 'loading' &&
        (loadingView !== undefined ? (
          <CometChatNotificationFeedLoadingState>
            {loadingView}
          </CometChatNotificationFeedLoadingState>
        ) : (
          <CometChatNotificationFeedLoadingState />
        ))}
      {screenState === 'error' &&
        (errorView !== undefined ? (
          <CometChatNotificationFeedErrorState>{errorView}</CometChatNotificationFeedErrorState>
        ) : (
          <CometChatNotificationFeedErrorState />
        ))}
      {screenState === 'empty' &&
        (emptyView !== undefined ? (
          <CometChatNotificationFeedEmptyState>{emptyView}</CometChatNotificationFeedEmptyState>
        ) : (
          <CometChatNotificationFeedEmptyState />
        ))}
      {(screenState === 'loaded' || items.length > 0) && (
        <CometChatNotificationFeedList {...(itemView ? { itemView } : {})} />
      )}
    </>
  );
};

/**
 * CometChatNotificationFeed — Direct flat API component.
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatNotificationFeed
 *   onItemClick={handleNotificationClick}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatNotificationFeed.Root>
 *   <CometChatNotificationFeed.Header />
 *   <CometChatNotificationFeed.FilterChips />
 *   <CometChatNotificationFeed.List />
 * </CometChatNotificationFeed.Root>
 * ```
 */
const CometChatNotificationFeedComponent: React.FC<CometChatNotificationFeedProps> = ({
  headerView,
  loadingView,
  errorView,
  emptyView,
  itemView,
  ...rootProps
}) => {
  const hasConvenienceProps =
    headerView !== undefined ||
    loadingView !== undefined ||
    errorView !== undefined ||
    emptyView !== undefined ||
    itemView !== undefined;

  if (!hasConvenienceProps) {
    return <CometChatNotificationFeedRoot {...rootProps} />;
  }

  return (
    <CometChatNotificationFeedRoot {...rootProps}>
      <CometChatNotificationFeedDefaultLayout
        {...{
          ...(headerView !== undefined && { headerView }),
          ...(loadingView !== undefined && { loadingView }),
          ...(errorView !== undefined && { errorView }),
          ...(emptyView !== undefined && { emptyView }),
          ...(itemView !== undefined && { itemView }),
        }}
      />
    </CometChatNotificationFeedRoot>
  );
};

CometChatNotificationFeedComponent.displayName = 'CometChatNotificationFeed';

/**
 * CometChatNotificationFeed — Compound component namespace with flat API.
 *
 * - `<CometChatNotificationFeed ... />` — flat API with convenience props
 * - `<CometChatNotificationFeed.Root>...</CometChatNotificationFeed.Root>` — compound composition
 */
export const CometChatNotificationFeed = Object.assign(CometChatNotificationFeedComponent, {
  Root: CometChatNotificationFeedRoot,
  List: CometChatNotificationFeedList,
  Item: CometChatNotificationFeedItem,
  Header: CometChatNotificationFeedHeader,
  FilterChips: CometChatNotificationFeedFilterChips,
  EmptyState: CometChatNotificationFeedEmptyState,
  ErrorState: CometChatNotificationFeedErrorState,
  LoadingState: CometChatNotificationFeedLoadingState,
});
