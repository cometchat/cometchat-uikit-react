import type { ReactNode } from 'react';

/** A scope option (e.g., admin, moderator, participant). */
export interface CometChatChangeScopeOptionData {
  /** Unique identifier (e.g., 'admin'). */
  id: string;
  /** Display label. */
  label: string;
}

/** Props for CometChatChangeScopeRoot. */
export interface CometChatChangeScopeRootProps {
  /** Available scope options. */
  options: CometChatChangeScopeOptionData[];
  /** Currently selected scope id. */
  defaultSelection?: string;
  /** Callback when scope change is confirmed. Returns a Promise for loading/error handling. */
  onScopeChanged?: (scopeId: string) => Promise<void>;
  /** Callback when close/cancel is clicked. */
  onClose?: () => void;
  /** Optional custom className. */
  className?: string;
  children?: ReactNode;
}

/** Props for CometChatChangeScopeHeader. */
export interface CometChatChangeScopeHeaderProps {
  /** Title text. Defaults to localized "Change Scope". */
  title?: string;
  /** Description text. Defaults to localized subtitle. */
  description?: string;
  /** Whether to show the scope icon. Defaults to true. */
  showIcon?: boolean;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatChangeScopeList. */
export interface CometChatChangeScopeListProps {
  /** Optional custom className. */
  className?: string;
  children?: ReactNode;
}

/** Props for CometChatChangeScopeOption. */
export interface CometChatChangeScopeOptionProps {
  /** The scope option data. */
  option: CometChatChangeScopeOptionData;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatChangeScopeActions. */
export interface CometChatChangeScopeActionsProps {
  /** Submit button text. Defaults to localized "Save". */
  submitText?: string;
  /** Cancel button text. Defaults to localized "Cancel". */
  cancelText?: string;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatChangeScopeErrorMessage. */
export interface CometChatChangeScopeErrorMessageProps {
  /** Optional custom className. */
  className?: string;
}

/** Context value exposed by CometChatChangeScopeRoot. */
export interface CometChatChangeScopeContextValue {
  options: CometChatChangeScopeOptionData[];
  selectedId: string;
  defaultSelection: string;
  isLoading: boolean;
  error: string | null;
  selectOption: (id: string) => void;
  confirmChange: () => void;
  cancel: () => void;
  /** Whether the selection has changed from the default. */
  hasChanged: boolean;
}
