import React from 'react';
import { CometChatFlagMessageDialogRoot } from './CometChatFlagMessageDialogRoot';
import { CometChatFlagMessageDialogHeader } from './CometChatFlagMessageDialogHeader';
import { CometChatFlagMessageDialogReasons } from './CometChatFlagMessageDialogReasons';
import { CometChatFlagMessageDialogRemark } from './CometChatFlagMessageDialogRemark';
import { CometChatFlagMessageDialogActions } from './CometChatFlagMessageDialogActions';
import type { CometChatFlagMessageDialogRootProps } from './CometChatFlagMessageDialog.types';

export type CometChatFlagMessageDialogProps = Omit<CometChatFlagMessageDialogRootProps, 'children'>;

const CometChatFlagMessageDialogComponent: React.FC<CometChatFlagMessageDialogProps> = props => {
  return <CometChatFlagMessageDialogRoot {...props} />;
};

CometChatFlagMessageDialogComponent.displayName = 'CometChatFlagMessageDialog';

export const CometChatFlagMessageDialog = Object.assign(CometChatFlagMessageDialogComponent, {
  Root: CometChatFlagMessageDialogRoot,
  Header: CometChatFlagMessageDialogHeader,
  Reasons: CometChatFlagMessageDialogReasons,
  Remark: CometChatFlagMessageDialogRemark,
  Actions: CometChatFlagMessageDialogActions,
});
