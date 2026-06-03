import React from 'react';
import { CometChatUsersRoot } from './CometChatUsersRoot';
import { CometChatUsersList } from './CometChatUsersList';
import { CometChatUsersItem } from './CometChatUsersItem';
import { CometChatUsersHeader } from './CometChatUsersHeader';
import { CometChatUsersSearchBar } from './CometChatUsersSearchBar';
import { CometChatUsersSectionHeader } from './CometChatUsersSectionHeader';
import { CometChatUsersEmptyState } from './CometChatUsersEmptyState';
import { CometChatUsersErrorState } from './CometChatUsersErrorState';
import { CometChatUsersLoadingState } from './CometChatUsersLoadingState';
import { CometChatUsersSelectedPreview } from './CometChatUsersSelectedPreview';
import { useCometChatUsersContext } from './CometChatUsers.context';
import type { CometChatUsersProps, CometChatUsersConvenienceProps } from './CometChatUsers.types';

/**
 * Internal component that reads context and renders the default layout
 * with convenience props injected. Must be rendered inside CometChatUsersRoot.
 */
const CometChatUsersDefaultLayout: React.FC<CometChatUsersConvenienceProps> = ({
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
  const { hideSearch, showSelectedUsersPreview } = useCometChatUsersContext();

  return (
    <>
      {headerView !== undefined ? headerView : <CometChatUsersHeader />}
      {!hideSearch && <CometChatUsersSearchBar />}
      {showSelectedUsersPreview && <CometChatUsersSelectedPreview />}
      {loadingView !== undefined ? (
        <CometChatUsersLoadingState>{loadingView}</CometChatUsersLoadingState>
      ) : (
        <CometChatUsersLoadingState />
      )}
      {errorView !== undefined ? (
        <CometChatUsersErrorState>{errorView}</CometChatUsersErrorState>
      ) : (
        <CometChatUsersErrorState />
      )}
      {emptyView !== undefined ? (
        <CometChatUsersEmptyState>{emptyView}</CometChatUsersEmptyState>
      ) : (
        <CometChatUsersEmptyState />
      )}
      <CometChatUsersList
        {...(itemView
          ? { itemView }
          : leadingView || titleView || subtitleView || trailingView
            ? {
                itemView: user => (
                  <CometChatUsersItem
                    user={user}
                    leadingView={leadingView?.(user)}
                    titleView={titleView?.(user)}
                    subtitleView={subtitleView?.(user)}
                    trailingView={trailingView?.(user)}
                  />
                ),
              }
            : {})}
      />
    </>
  );
};

/**
 * CometChatUsers — Direct flat API component.
 *
 * Renders a searchable, selectable user list with optional convenience props
 * for customizing views without needing to compose sub-components.
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatUsers
 *   onItemClick={handleUserClick}
 *   leadingView={(user) => <CustomAvatar user={user} />}
 *   subtitleView={(user) => <CustomSubtitle user={user} />}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatUsers.Root selectionMode="multiple" onSelect={handleSelect}>
 *   <CometChatUsers.Header />
 *   <CometChatUsers.SearchBar />
 *   <CometChatUsers.List />
 *   <CometChatUsers.SelectedPreview />
 * </CometChatUsers.Root>
 * ```
 */
const CometChatUsersComponent: React.FC<CometChatUsersProps> = ({
  // Convenience view props
  leadingView,
  titleView,
  subtitleView,
  trailingView,
  itemView,
  headerView,
  loadingView,
  errorView,
  emptyView,
  // Root props (pass-through)
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
    // No convenience props — let Root render its own default layout (no children)
    return <CometChatUsersRoot {...rootProps} />;
  }

  // With convenience props — render Root with children that use context for state checks
  return (
    <CometChatUsersRoot {...rootProps}>
      <CometChatUsersDefaultLayout
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
    </CometChatUsersRoot>
  );
};

CometChatUsersComponent.displayName = 'CometChatUsers';

/**
 * CometChatUsers — Compound component namespace with flat API.
 *
 * - `<CometChatUsers ... />` — flat API with convenience props
 * - `<CometChatUsers.Root>...</CometChatUsers.Root>` — compound composition
 */
export const CometChatUsers = Object.assign(CometChatUsersComponent, {
  Root: CometChatUsersRoot,
  List: CometChatUsersList,
  Item: CometChatUsersItem,
  Header: CometChatUsersHeader,
  SearchBar: CometChatUsersSearchBar,
  SectionHeader: CometChatUsersSectionHeader,
  EmptyState: CometChatUsersEmptyState,
  ErrorState: CometChatUsersErrorState,
  LoadingState: CometChatUsersLoadingState,
  SelectedPreview: CometChatUsersSelectedPreview,
});
