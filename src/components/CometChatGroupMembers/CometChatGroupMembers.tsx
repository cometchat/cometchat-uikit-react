import React from 'react';
import { CometChatGroupMembersRoot } from './CometChatGroupMembersRoot';
import { CometChatGroupMembersList } from './CometChatGroupMembersList';
import { CometChatGroupMembersItem } from './CometChatGroupMembersItem';
import { CometChatGroupMembersHeader } from './CometChatGroupMembersHeader';
import { CometChatGroupMembersSearchBar } from './CometChatGroupMembersSearchBar';
import { CometChatGroupMembersEmptyState } from './CometChatGroupMembersEmptyState';
import { CometChatGroupMembersErrorState } from './CometChatGroupMembersErrorState';
import { CometChatGroupMembersLoadingState } from './CometChatGroupMembersLoadingState';
import { useCometChatGroupMembersContext } from './CometChatGroupMembers.context';
import type {
  CometChatGroupMembersProps,
  CometChatGroupMembersConvenienceProps,
} from './CometChatGroupMembers.types';

/**
 * Internal component that reads context and renders the default layout
 * with convenience props injected. Must be rendered inside CometChatGroupMembersRoot.
 */
const CometChatGroupMembersDefaultLayout: React.FC<CometChatGroupMembersConvenienceProps> = ({
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
  const { fetchState, members, hideSearch } = useCometChatGroupMembersContext();

  return (
    <>
      {headerView !== undefined ? headerView : <CometChatGroupMembersHeader />}
      {!hideSearch && <CometChatGroupMembersSearchBar />}
      {fetchState === 'loading' &&
        (loadingView !== undefined ? (
          <CometChatGroupMembersLoadingState>{loadingView}</CometChatGroupMembersLoadingState>
        ) : (
          <CometChatGroupMembersLoadingState />
        ))}
      {fetchState === 'error' &&
        (errorView !== undefined ? (
          <CometChatGroupMembersErrorState>{errorView}</CometChatGroupMembersErrorState>
        ) : (
          <CometChatGroupMembersErrorState />
        ))}
      {fetchState === 'empty' &&
        (emptyView !== undefined ? (
          <CometChatGroupMembersEmptyState>{emptyView}</CometChatGroupMembersEmptyState>
        ) : (
          <CometChatGroupMembersEmptyState />
        ))}
      {(fetchState === 'loaded' || members.length > 0) && (
        <CometChatGroupMembersList
          {...(itemView
            ? { itemView }
            : leadingView || titleView || subtitleView || trailingView
              ? {
                  itemView: member => (
                    <CometChatGroupMembersItem
                      member={member}
                      leadingView={leadingView?.(member)}
                      titleView={titleView?.(member)}
                      subtitleView={subtitleView?.(member)}
                      trailingView={trailingView?.(member)}
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
 * CometChatGroupMembers — Direct flat API component.
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatGroupMembers
 *   group={group}
 *   onItemClick={handleMemberClick}
 *   subtitleView={(member) => <CustomSubtitle member={member} />}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatGroupMembers.Root group={group} selectionMode="multiple">
 *   <CometChatGroupMembers.Header title="Group Members" />
 *   <CometChatGroupMembers.SearchBar />
 *   <CometChatGroupMembers.List />
 * </CometChatGroupMembers.Root>
 * ```
 */
const CometChatGroupMembersComponent: React.FC<CometChatGroupMembersProps> = ({
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
    return <CometChatGroupMembersRoot {...rootProps} />;
  }

  return (
    <CometChatGroupMembersRoot {...rootProps}>
      <CometChatGroupMembersDefaultLayout
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
    </CometChatGroupMembersRoot>
  );
};

CometChatGroupMembersComponent.displayName = 'CometChatGroupMembers';

export const CometChatGroupMembers = Object.assign(CometChatGroupMembersComponent, {
  Root: CometChatGroupMembersRoot,
  List: CometChatGroupMembersList,
  Item: CometChatGroupMembersItem,
  Header: CometChatGroupMembersHeader,
  SearchBar: CometChatGroupMembersSearchBar,
  EmptyState: CometChatGroupMembersEmptyState,
  ErrorState: CometChatGroupMembersErrorState,
  LoadingState: CometChatGroupMembersLoadingState,
});
