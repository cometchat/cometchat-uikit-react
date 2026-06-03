import React from 'react';
import { CometChatMessageListRoot } from './CometChatMessageListRoot';
import { CometChatMessageListView } from './CometChatMessageListView';
import { CometChatMessageListHeader } from './CometChatMessageListHeader';
import { CometChatMessageListEmptyState } from './CometChatMessageListEmptyState';
import { CometChatMessageListErrorState } from './CometChatMessageListErrorState';
import { CometChatMessageListLoadingState } from './CometChatMessageListLoadingState';
import { CometChatMessageListDateSeparator } from './CometChatMessageListDateSeparator';
import { CometChatMessageListAIFooter } from './CometChatMessageListAIFooter';
import { CometChatMessageListFooter } from './CometChatMessageListFooter';
import { CometChatMessageListScrollToBottom } from './CometChatMessageListScrollToBottom';
import type { CometChatMessageListProps } from './CometChatMessageList.types';

// ---------------------------------------------------------------------------
// Flat API Component
// ---------------------------------------------------------------------------

/**
 * CometChatMessageList — flat convenience component.
 *
 * Renders the full default message list layout (Root with default children)
 * in one line. All props are passed to Root; sub-components read them from context.
 *
 * Convenience props (`loadingView`, `emptyView`, `errorView`, `headerView`,
 * `footerView`) are intercepted here and passed as children to the
 * corresponding sub-components, following the same pattern as
 * CometChatMessageHeader.
 *
 * ```tsx
 * <CometChatMessageList
 *   user={chatUser}
 *   loggedInUser={me}
 *   hideReplyInThreadOption
 *   onThreadRepliesClick={(msg) => openThread(msg)}
 *   loadingView={<CustomShimmer />}
 *   emptyView={<CustomEmpty />}
 * />
 * ```
 *
 * For full compound composition control, use the sub-components:
 *
 * ```tsx
 * <CometChatMessageList.Root user={chatUser} loggedInUser={me}>
 *   <CometChatMessageList.LoadingState />
 *   <CometChatMessageList.ErrorState />
 *   <CometChatMessageList.EmptyState />
 *   <CometChatMessageList.View />
 * </CometChatMessageList.Root>
 * ```
 */
const CometChatMessageListComponent: React.FC<CometChatMessageListProps> = ({
  loadingView,
  emptyView,
  errorView,
  headerView,
  footerView,
  ...rootProps
}) => {
  // If any convenience props are provided, render explicit children layout
  const hasConvenienceProps =
    loadingView !== undefined ||
    emptyView !== undefined ||
    errorView !== undefined ||
    headerView !== undefined ||
    footerView !== undefined;

  if (!hasConvenienceProps) {
    // No convenience props — let Root render its own default layout
    return <CometChatMessageListRoot {...rootProps} />;
  }

  // Render with convenience props injected into the default layout structure
  return (
    <CometChatMessageListRoot {...rootProps}>
      <CometChatMessageListLoadingState>{loadingView}</CometChatMessageListLoadingState>
      <CometChatMessageListErrorState>{errorView}</CometChatMessageListErrorState>
      <CometChatMessageListEmptyState>{emptyView}</CometChatMessageListEmptyState>
      {headerView && <CometChatMessageListHeader>{headerView}</CometChatMessageListHeader>}
      <CometChatMessageListView />
      {footerView && <CometChatMessageListFooter>{footerView}</CometChatMessageListFooter>}
      <CometChatMessageListAIFooter />
    </CometChatMessageListRoot>
  );
};

CometChatMessageListComponent.displayName = 'CometChatMessageList';

// ---------------------------------------------------------------------------
// Namespace Export (callable + sub-components)
// ---------------------------------------------------------------------------

/**
 * CometChatMessageList — compound component namespace with flat API.
 *
 * - `<CometChatMessageList ... />` — flat API (renders default layout)
 * - `<CometChatMessageList.Root>...</CometChatMessageList.Root>` — compound composition
 */
export const CometChatMessageList = Object.assign(CometChatMessageListComponent, {
  Root: CometChatMessageListRoot,
  View: CometChatMessageListView,
  Header: CometChatMessageListHeader,
  Footer: CometChatMessageListFooter,
  ScrollToBottom: CometChatMessageListScrollToBottom,
  EmptyState: CometChatMessageListEmptyState,
  ErrorState: CometChatMessageListErrorState,
  LoadingState: CometChatMessageListLoadingState,
  DateSeparator: CometChatMessageListDateSeparator,
  AIFooter: CometChatMessageListAIFooter,
});
