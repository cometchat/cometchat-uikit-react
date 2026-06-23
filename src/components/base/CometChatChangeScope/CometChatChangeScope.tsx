import React from 'react';
import { CometChatChangeScopeRoot } from './CometChatChangeScopeRoot';
import { CometChatChangeScopeHeader } from './CometChatChangeScopeHeader';
import { CometChatChangeScopeList } from './CometChatChangeScopeList';
import { CometChatChangeScopeOption } from './CometChatChangeScopeOption';
import { CometChatChangeScopeActions } from './CometChatChangeScopeActions';
import { CometChatChangeScopeErrorMessage } from './CometChatChangeScopeErrorMessage';
import type {
  CometChatChangeScopeRootProps,
  CometChatChangeScopeHeaderProps,
  CometChatChangeScopeActionsProps,
} from './CometChatChangeScope.types';

/**
 * Flat API props for CometChatChangeScope.
 * Renders Root + Header + ScopeList + ErrorMessage + Actions in one call.
 */
export interface CometChatChangeScopeProps extends Omit<CometChatChangeScopeRootProps, 'children'> {
  /** Title for the header. */
  title?: CometChatChangeScopeHeaderProps['title'];
  /** Description for the header. */
  description?: CometChatChangeScopeHeaderProps['description'];
  /** Whether to show the scope icon in the header. */
  showIcon?: CometChatChangeScopeHeaderProps['showIcon'];
  /** Submit button text for the actions. */
  submitText?: CometChatChangeScopeActionsProps['submitText'];
  /** Cancel button text for the actions. */
  cancelText?: CometChatChangeScopeActionsProps['cancelText'];
}

/**
 * CometChatChangeScope — Flat API component.
 *
 * Usage (flat):
 * ```tsx
 * <CometChatChangeScope
 *   options={scopeOptions}
 *   defaultSelection="participant"
 *   onScopeChanged={handleChange}
 *   onClose={handleClose}
 *   title="Change Scope"
 *   submitText="Save"
 *   cancelText="Cancel"
 * />
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatChangeScope.Root options={options} onScopeChanged={handleChange} onClose={handleClose}>
 *   <CometChatChangeScope.Header title="Change Scope" />
 *   <CometChatChangeScope.ScopeList />
 *   <CometChatChangeScope.ErrorMessage />
 *   <CometChatChangeScope.Actions submitText="Save" cancelText="Cancel" />
 * </CometChatChangeScope.Root>
 * ```
 */
const CometChatChangeScopeComponent: React.FC<CometChatChangeScopeProps> = ({
  title,
  description,
  showIcon,
  submitText,
  cancelText,
  ...rootProps
}) => {
  return (
    <CometChatChangeScopeRoot {...rootProps}>
      <CometChatChangeScopeHeader title={title} description={description} showIcon={showIcon} />
      <CometChatChangeScopeList />
      <CometChatChangeScopeErrorMessage />
      <CometChatChangeScopeActions submitText={submitText} cancelText={cancelText} />
    </CometChatChangeScopeRoot>
  );
};

CometChatChangeScopeComponent.displayName = 'CometChatChangeScope';

export const CometChatChangeScope = Object.assign(CometChatChangeScopeComponent, {
  Root: CometChatChangeScopeRoot,
  Header: CometChatChangeScopeHeader,
  ScopeList: CometChatChangeScopeList,
  ScopeOption: CometChatChangeScopeOption,
  Actions: CometChatChangeScopeActions,
  ErrorMessage: CometChatChangeScopeErrorMessage,
});
