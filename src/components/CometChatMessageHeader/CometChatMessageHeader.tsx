import React, { useMemo } from 'react';
import { CometChatMessageHeaderRoot } from './CometChatMessageHeaderRoot';
import { CometChatMessageHeaderBackButton } from './CometChatMessageHeaderBackButton';
import { CometChatMessageHeaderAvatar } from './CometChatMessageHeaderAvatar';
import { CometChatMessageHeaderTitle } from './CometChatMessageHeaderTitle';
import { CometChatMessageHeaderSubtitle } from './CometChatMessageHeaderSubtitle';
import { CometChatMessageHeaderCallButtons } from './CometChatMessageHeaderCallButtons';
import { CometChatMessageHeaderSearchButton } from './CometChatMessageHeaderSearchButton';
import { CometChatMessageHeaderSummaryButton } from './CometChatMessageHeaderSummaryButton';
import { CometChatMessageHeaderOverflowMenu } from './CometChatMessageHeaderOverflowMenu';
import { CometChatMessageHeaderAuxiliaryButtons } from './CometChatMessageHeaderAuxiliaryButtons';
import type { CometChatMessageHeaderProps } from './CometChatMessageHeader.types';
import { CometChatMessageHeaderViewsContext } from './CometChatMessageHeader.context';

/**
 * CometChatMessageHeader — Direct flat API component.
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatMessageHeader
 *   user={selectedUser}
 *   onBack={handleBack}
 *   subtitleView={<CustomSubtitle />}
 *   auxiliaryButtonView={<CustomButtons />}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatMessageHeader.Root user={selectedUser}>
 *   <CometChatMessageHeader.BackButton />
 *   <CometChatMessageHeader.Avatar />
 *   <CometChatMessageHeader.Title />
 *   <CometChatMessageHeader.Subtitle />
 *   <CometChatMessageHeader.CallButtons />
 * </CometChatMessageHeader.Root>
 * ```
 */
const CometChatMessageHeaderComponent: React.FC<CometChatMessageHeaderProps> = ({
  leadingView,
  titleView,
  subtitleView,
  trailingView,
  auxiliaryButtonView,
  ...rootProps
}) => {
  const views = useMemo(
    () => ({ leadingView, titleView, subtitleView, trailingView, auxiliaryButtonView }),
    [leadingView, titleView, subtitleView, trailingView, auxiliaryButtonView]
  );

  // Root's default layout places the views (see CometChatMessageHeaderViewsContext).
  return (
    <CometChatMessageHeaderViewsContext.Provider value={views}>
      <CometChatMessageHeaderRoot {...rootProps} />
    </CometChatMessageHeaderViewsContext.Provider>
  );
};

CometChatMessageHeaderComponent.displayName = 'CometChatMessageHeader';

export const CometChatMessageHeader = Object.assign(CometChatMessageHeaderComponent, {
  Root: CometChatMessageHeaderRoot,
  BackButton: CometChatMessageHeaderBackButton,
  Avatar: CometChatMessageHeaderAvatar,
  Title: CometChatMessageHeaderTitle,
  Subtitle: CometChatMessageHeaderSubtitle,
  CallButtons: CometChatMessageHeaderCallButtons,
  SearchButton: CometChatMessageHeaderSearchButton,
  SummaryButton: CometChatMessageHeaderSummaryButton,
  OverflowMenu: CometChatMessageHeaderOverflowMenu,
  AuxiliaryButtons: CometChatMessageHeaderAuxiliaryButtons,
});
