import React from 'react';
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
  // If any convenience props are provided, we need to render custom children
  const hasConvenienceProps =
    leadingView !== undefined ||
    titleView !== undefined ||
    subtitleView !== undefined ||
    trailingView !== undefined ||
    auxiliaryButtonView !== undefined;

  if (!hasConvenienceProps) {
    // No convenience props — let Root render its own default layout
    return <CometChatMessageHeaderRoot {...rootProps} />;
  }

  const showCallButtons = !rootProps.hideVoiceCallButton || !rootProps.hideVideoCallButton;

  // Render with convenience props injected into the default layout structure
  return (
    <CometChatMessageHeaderRoot {...rootProps}>
      {!rootProps.hideBackButton && <CometChatMessageHeaderBackButton />}
      {leadingView !== undefined ? leadingView : <CometChatMessageHeaderAvatar />}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {titleView !== undefined ? titleView : <CometChatMessageHeaderTitle />}
        {subtitleView !== undefined ? subtitleView : <CometChatMessageHeaderSubtitle />}
      </div>
      {trailingView !== undefined ? (
        trailingView
      ) : (
        <>
          {showCallButtons && <CometChatMessageHeaderCallButtons />}
          {auxiliaryButtonView !== undefined ? (
            <CometChatMessageHeaderAuxiliaryButtons>
              {auxiliaryButtonView}
            </CometChatMessageHeaderAuxiliaryButtons>
          ) : (
            <CometChatMessageHeaderOverflowMenu />
          )}
        </>
      )}
    </CometChatMessageHeaderRoot>
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
