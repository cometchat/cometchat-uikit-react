import React from 'react';
import { CometChatConversationSummaryRoot } from './CometChatConversationSummaryRoot';
import { CometChatConversationSummaryHeader } from './CometChatConversationSummaryHeader';
import { CometChatConversationSummaryBody } from './CometChatConversationSummaryBody';
import { CometChatConversationSummaryLoading } from './CometChatConversationSummaryLoading';
import { CometChatConversationSummaryError } from './CometChatConversationSummaryError';
import { CometChatConversationSummaryEmpty } from './CometChatConversationSummaryEmpty';
import type { CometChatConversationSummaryRootProps } from './CometChatConversationSummary.types';

export type CometChatConversationSummaryProps = Omit<
  CometChatConversationSummaryRootProps,
  'children'
>;

const CometChatConversationSummaryComponent: React.FC<
  CometChatConversationSummaryProps
> = props => {
  return (
    <CometChatConversationSummaryRoot {...props}>
      <CometChatConversationSummaryHeader />
      <CometChatConversationSummaryLoading />
      <CometChatConversationSummaryError />
      <CometChatConversationSummaryEmpty />
      <CometChatConversationSummaryBody />
    </CometChatConversationSummaryRoot>
  );
};

CometChatConversationSummaryComponent.displayName = 'CometChatConversationSummary';

export const CometChatConversationSummary = Object.assign(CometChatConversationSummaryComponent, {
  Root: CometChatConversationSummaryRoot,
  Header: CometChatConversationSummaryHeader,
  Body: CometChatConversationSummaryBody,
  Loading: CometChatConversationSummaryLoading,
  Error: CometChatConversationSummaryError,
  Empty: CometChatConversationSummaryEmpty,
});
