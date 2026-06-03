import React from 'react';
import { CometChatGroupsRoot } from './CometChatGroupsRoot';
import { CometChatGroupsList } from './CometChatGroupsList';
import { CometChatGroupsItem } from './CometChatGroupsItem';
import { CometChatGroupsHeader } from './CometChatGroupsHeader';
import { CometChatGroupsSearchBar } from './CometChatGroupsSearchBar';
import { CometChatGroupsEmptyState } from './CometChatGroupsEmptyState';
import { CometChatGroupsErrorState } from './CometChatGroupsErrorState';
import { CometChatGroupsLoadingState } from './CometChatGroupsLoadingState';
import { useCometChatGroupsContext } from './CometChatGroups.context';
import type {
  CometChatGroupsProps,
  CometChatGroupsConvenienceProps,
} from './CometChatGroups.types';

/**
 * Internal component that reads context and renders the default layout
 * with convenience props injected. Must be rendered inside CometChatGroupsRoot.
 */
const CometChatGroupsDefaultLayout: React.FC<CometChatGroupsConvenienceProps> = ({
  leadingView,
  titleView,
  subtitleView,
  trailingView,
  itemView,
  headerView,
  loadingView,
  errorView,
  emptyView,
}) => {
  const { fetchState, groups, hideSearch } = useCometChatGroupsContext();

  return (
    <>
      {headerView !== undefined ? headerView : <CometChatGroupsHeader />}
      {!hideSearch && <CometChatGroupsSearchBar />}
      {fetchState === 'loading' &&
        (loadingView !== undefined ? (
          <CometChatGroupsLoadingState>{loadingView}</CometChatGroupsLoadingState>
        ) : (
          <CometChatGroupsLoadingState />
        ))}
      {fetchState === 'error' &&
        (errorView !== undefined ? (
          <CometChatGroupsErrorState>{errorView}</CometChatGroupsErrorState>
        ) : (
          <CometChatGroupsErrorState />
        ))}
      {fetchState === 'empty' &&
        (emptyView !== undefined ? (
          <CometChatGroupsEmptyState>{emptyView}</CometChatGroupsEmptyState>
        ) : (
          <CometChatGroupsEmptyState />
        ))}
      {(fetchState === 'loaded' || groups.length > 0) && (
        <CometChatGroupsList
          {...(itemView
            ? { itemView }
            : leadingView || titleView || subtitleView || trailingView
              ? {
                  itemView: group => (
                    <CometChatGroupsItem
                      group={group}
                      leadingView={leadingView?.(group)}
                      titleView={titleView?.(group)}
                      subtitleView={subtitleView?.(group)}
                      trailingView={trailingView?.(group)}
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
 * CometChatGroups — Direct flat API component.
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatGroups
 *   onItemClick={handleGroupClick}
 *   subtitleView={(group) => <CustomSubtitle group={group} />}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatGroups.Root selectionMode="multiple" onSelect={handleSelect}>
 *   <CometChatGroups.Header />
 *   <CometChatGroups.SearchBar />
 *   <CometChatGroups.List />
 * </CometChatGroups.Root>
 * ```
 */
const CometChatGroupsComponent: React.FC<CometChatGroupsProps> = ({
  leadingView,
  titleView,
  subtitleView,
  trailingView,
  itemView,
  headerView,
  loadingView,
  errorView,
  emptyView,
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
    emptyView !== undefined;

  if (!hasConvenienceProps) {
    return <CometChatGroupsRoot {...rootProps} />;
  }

  return (
    <CometChatGroupsRoot {...rootProps}>
      <CometChatGroupsDefaultLayout
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
        }}
      />
    </CometChatGroupsRoot>
  );
};

CometChatGroupsComponent.displayName = 'CometChatGroups';

export const CometChatGroups = Object.assign(CometChatGroupsComponent, {
  Root: CometChatGroupsRoot,
  List: CometChatGroupsList,
  Item: CometChatGroupsItem,
  Header: CometChatGroupsHeader,
  SearchBar: CometChatGroupsSearchBar,
  EmptyState: CometChatGroupsEmptyState,
  ErrorState: CometChatGroupsErrorState,
  LoadingState: CometChatGroupsLoadingState,
});
