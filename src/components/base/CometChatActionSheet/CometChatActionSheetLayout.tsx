import React from 'react';
import type { CometChatActionSheetLayoutProps } from './CometChatActionSheet.types';
import './CometChatActionSheet.css';

/**
 * Layout container that arranges action items in list or grid mode.
 */
export const CometChatActionSheetLayout: React.FC<CometChatActionSheetLayoutProps> = ({
  mode = 'list',
  children,
}) => {
  const layoutClass =
    mode === 'grid' ? 'cometchat-action-sheet__layout-grid' : 'cometchat-action-sheet__layout-list';

  return <div className={layoutClass}>{children}</div>;
};
