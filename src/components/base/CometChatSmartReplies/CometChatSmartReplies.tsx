import React from 'react';
import { CometChatSmartRepliesRoot } from './CometChatSmartRepliesRoot';
import { CometChatSmartRepliesHeader } from './CometChatSmartRepliesHeader';
import { CometChatSmartRepliesItem } from './CometChatSmartRepliesItem';
import { CometChatSmartRepliesLoading } from './CometChatSmartRepliesLoading';
import { CometChatSmartRepliesError } from './CometChatSmartRepliesError';
import { CometChatSmartRepliesEmpty } from './CometChatSmartRepliesEmpty';
import type { CometChatSmartRepliesRootProps } from './CometChatSmartReplies.types';

export type CometChatSmartRepliesProps = Omit<CometChatSmartRepliesRootProps, 'children'>;

const CometChatSmartRepliesComponent: React.FC<CometChatSmartRepliesProps> = props => {
  return <CometChatSmartRepliesRoot {...props} />;
};

CometChatSmartRepliesComponent.displayName = 'CometChatSmartReplies';

export const CometChatSmartReplies = Object.assign(CometChatSmartRepliesComponent, {
  Root: CometChatSmartRepliesRoot,
  Header: CometChatSmartRepliesHeader,
  Item: CometChatSmartRepliesItem,
  Loading: CometChatSmartRepliesLoading,
  Error: CometChatSmartRepliesError,
  Empty: CometChatSmartRepliesEmpty,
});
