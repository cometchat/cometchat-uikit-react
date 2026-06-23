import React from 'react';
import { CometChatDateRoot } from './CometChatDateRoot';
import { CometChatDateText } from './CometChatDateText';
import type { CometChatDateRootProps } from './CometChatDate.types';

export type CometChatDateProps = Omit<CometChatDateRootProps, 'children'>;

const CometChatDateComponent: React.FC<CometChatDateProps> = props => {
  return <CometChatDateRoot {...props} />;
};

CometChatDateComponent.displayName = 'CometChatDate';

export const CometChatDate = Object.assign(CometChatDateComponent, {
  Root: CometChatDateRoot,
  Text: CometChatDateText,
});
