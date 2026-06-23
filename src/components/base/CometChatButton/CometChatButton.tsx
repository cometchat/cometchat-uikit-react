import React from 'react';
import { CometChatButtonRoot } from './CometChatButtonRoot';
import { CometChatButtonIcon } from './CometChatButtonIcon';
import { CometChatButtonText } from './CometChatButtonText';
import type { CometChatButtonRootProps } from './CometChatButton.types';

/**
 * Flat API props for CometChatButton.
 * Renders Root + optional Icon + optional Text in one call.
 */
export interface CometChatButtonProps extends Omit<CometChatButtonRootProps, 'children'> {
  /** Icon content (SVG component, img, etc.). Rendered inside CometChatButton.Icon. */
  icon?: React.ReactNode;
  /** Text content. Rendered inside CometChatButton.Text. */
  text?: React.ReactNode;
}

/**
 * CometChatButton — Flat API component.
 *
 * Usage (flat):
 * ```tsx
 * <CometChatButton text="Send" variant="primary" onClick={handleClick} />
 * <CometChatButton icon={<SendIcon />} text="Send" variant="primary" />
 * <CometChatButton icon={<CloseIcon />} variant="ghost" onClick={handleClose} />
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatButton.Root variant="primary" onClick={handleClick}>
 *   <CometChatButton.Icon><SendIcon /></CometChatButton.Icon>
 *   <CometChatButton.Text>Send</CometChatButton.Text>
 * </CometChatButton.Root>
 * ```
 */
const CometChatButtonComponent = React.forwardRef<HTMLButtonElement, CometChatButtonProps>(
  ({ icon, text, ...rootProps }, ref) => {
    return (
      <CometChatButtonRoot ref={ref} {...rootProps}>
        {icon && <CometChatButtonIcon>{icon}</CometChatButtonIcon>}
        {text && <CometChatButtonText>{text}</CometChatButtonText>}
      </CometChatButtonRoot>
    );
  }
);

CometChatButtonComponent.displayName = 'CometChatButton';

export const CometChatButton = Object.assign(CometChatButtonComponent, {
  Root: CometChatButtonRoot,
  Icon: CometChatButtonIcon,
  Text: CometChatButtonText,
});
