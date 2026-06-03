import React from 'react';
import { CometChatMessageInformationRoot } from './CometChatMessageInformationRoot';
import { CometChatMessageInformationHeader } from './CometChatMessageInformationHeader';
import { CometChatMessageInformationMessagePreview } from './CometChatMessageInformationMessagePreview';
import { CometChatMessageInformationReceiptList } from './CometChatMessageInformationReceiptList';
import { CometChatMessageInformationLoadingState } from './CometChatMessageInformationLoadingState';
import { CometChatMessageInformationErrorState } from './CometChatMessageInformationErrorState';
import { CometChatMessageInformationEmptyState } from './CometChatMessageInformationEmptyState';
import type { CometChatMessageInformationProps } from './CometChatMessageInformation.types';

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
  const hasConvenienceProps =
    headerView !== undefined ||
    receiptListView !== undefined ||
    loadingView !== undefined ||
    errorView !== undefined ||
    emptyView !== undefined;

  if (!hasConvenienceProps) {
    return <CometChatMessageInformationRoot {...rootProps} />;
  }

  return (
    <CometChatMessageInformationRoot {...rootProps}>
      {headerView !== undefined ? headerView : <CometChatMessageInformationHeader />}
      <CometChatMessageInformationMessagePreview />
      {receiptListView !== undefined ? receiptListView : <CometChatMessageInformationReceiptList />}
      {loadingView !== undefined && <CometChatMessageInformationLoadingState />}
      {errorView !== undefined && <CometChatMessageInformationErrorState />}
      {emptyView !== undefined && <CometChatMessageInformationEmptyState />}
    </CometChatMessageInformationRoot>
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
