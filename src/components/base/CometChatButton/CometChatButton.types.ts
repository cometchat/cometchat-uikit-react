import type { ReactNode, ButtonHTMLAttributes } from 'react';

/** Visual variant of the button. */
export type CometChatButtonVariant = 'primary' | 'secondary' | 'ghost';

/** Size variant of the button. */
export type CometChatButtonSize = 'sm' | 'md' | 'lg';

/** Props for CometChatButton.Root. */
export interface CometChatButtonRootProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** Visual variant. Defaults to 'primary'. */
  variant?: CometChatButtonVariant;
  /** Size variant. Defaults to 'md'. */
  size?: CometChatButtonSize;
  /** Whether the button is in a loading state. */
  isLoading?: boolean;
  /** Accessible label for the loading state. */
  loadingLabel?: string;
  /** Tooltip text shown on hover (maps to native title attribute). */
  hoverText?: string;
  /** Children (CometChatButton.Icon, CometChatButton.Text, or custom content). */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatButton.Icon. */
export interface CometChatButtonIconProps {
  /** Icon content — accepts ReactNode (SVG component, img, etc.). */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatButton.Text. */
export interface CometChatButtonTextProps {
  /** Text content. */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Context value for CometChatButton. */
export interface CometChatButtonContextValue {
  variant: CometChatButtonVariant;
  size: CometChatButtonSize;
  isLoading: boolean;
  disabled: boolean;
}
