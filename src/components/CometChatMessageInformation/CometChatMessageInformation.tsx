import React, { useMemo } from 'react';
import { CometChatMessageInformationRoot } from './CometChatMessageInformationRoot';
import { CometChatMessageInformationHeader } from './CometChatMessageInformationHeader';
import { CometChatMessageInformationMessagePreview } from './CometChatMessageInformationMessagePreview';
import { CometChatMessageInformationReceiptList } from './CometChatMessageInformationReceiptList';
import { CometChatMessageInformationLoadingState } from './CometChatMessageInformationLoadingState';
import { CometChatMessageInformationErrorState } from './CometChatMessageInformationErrorState';
import { CometChatMessageInformationEmptyState } from './CometChatMessageInformationEmptyState';
import type { CometChatMessageInformationProps } from './CometChatMessageInformation.types';
import { CometChatMessageInformationViewsContext } from './CometChatMessageInformation.context';

/**
 * CometChatMessageInformation — Direct flat API component.
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatMessageInformation
 *   message={selectedMessage}
 *   onClose={() => setShowInfo(false)}
 *   headerView={<CustomHeader />}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatMessageInformation.Root message={selectedMessage} onClose={handleClose}>
 *   <CometChatMessageInformation.Header />
 *   <CometChatMessageInformation.MessagePreview />
 *   <CometChatMessageInformation.ReceiptList />
 * </CometChatMessageInformation.Root>
 * ```
 */
const CometChatMessageInformationComponent: React.FC<CometChatMessageInformationProps> = ({
  headerView,
  receiptListView,
  loadingView,
  errorView,
  emptyView,
  ...rootProps
}) => {
  const views = useMemo(
    () => ({ headerView, receiptListView, loadingView, errorView, emptyView }),
    [headerView, receiptListView, loadingView, errorView, emptyView]
  );

  // Root's default layout places the views (see CometChatMessageInformationViewsContext).
  return (
    <CometChatMessageInformationViewsContext.Provider value={views}>
      <CometChatMessageInformationRoot {...rootProps} />
    </CometChatMessageInformationViewsContext.Provider>
  );
};

CometChatMessageInformationComponent.displayName = 'CometChatMessageInformation';

export const CometChatMessageInformation = Object.assign(CometChatMessageInformationComponent, {
  Root: CometChatMessageInformationRoot,
  Header: CometChatMessageInformationHeader,
  MessagePreview: CometChatMessageInformationMessagePreview,
  ReceiptList: CometChatMessageInformationReceiptList,
  LoadingState: CometChatMessageInformationLoadingState,
  ErrorState: CometChatMessageInformationErrorState,
  EmptyState: CometChatMessageInformationEmptyState,
});
