import React from 'react';
import { CometChatSearchBarRoot } from './CometChatSearchBarRoot';
import { CometChatSearchBarIcon } from './CometChatSearchBarIcon';
import { CometChatSearchBarInput } from './CometChatSearchBarInput';
import { CometChatSearchBarClearButton } from './CometChatSearchBarClearButton';
import type { CometChatSearchBarRootProps } from './CometChatSearchBar.types';

export type CometChatSearchBarProps = Omit<CometChatSearchBarRootProps, 'children'>;

const CometChatSearchBarComponent: React.FC<CometChatSearchBarProps> = props => {
  return (
    <CometChatSearchBarRoot {...props}>
      <CometChatSearchBarIcon />
      <CometChatSearchBarInput />
      <CometChatSearchBarClearButton />
    </CometChatSearchBarRoot>
  );
};

CometChatSearchBarComponent.displayName = 'CometChatSearchBar';

export const CometChatSearchBar = Object.assign(CometChatSearchBarComponent, {
  Root: CometChatSearchBarRoot,
  Icon: CometChatSearchBarIcon,
  Input: CometChatSearchBarInput,
  ClearButton: CometChatSearchBarClearButton,
});
