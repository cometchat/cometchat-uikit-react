import { CometChatChangeScopeRoot } from './CometChatChangeScopeRoot';
import { CometChatChangeScopeHeader } from './CometChatChangeScopeHeader';
import { CometChatChangeScopeList } from './CometChatChangeScopeList';
import { CometChatChangeScopeOption } from './CometChatChangeScopeOption';
import { CometChatChangeScopeActions } from './CometChatChangeScopeActions';
import { CometChatChangeScopeErrorMessage } from './CometChatChangeScopeErrorMessage';

/**
 * CometChatChangeScope — compound component.
 *
 * Presents a dialog for changing a group member's scope
 * (admin, moderator, participant).
 *
 * Usage:
 * ```tsx
 * <CometChatChangeScope.Root
 *   options={scopeOptions}
 *   defaultSelection="participant"
 *   onScopeChanged={handleChange}
 *   onClose={handleClose}
 * >
 *   <CometChatChangeScope.Header />
 *   <CometChatChangeScope.ScopeList>
 *     {scopeOptions.map((opt) => (
 *       <CometChatChangeScope.ScopeOption key={opt.id} option={opt} />
 *     ))}
 *   </CometChatChangeScope.ScopeList>
 *   <CometChatChangeScope.ErrorMessage />
 *   <CometChatChangeScope.Actions />
 * </CometChatChangeScope.Root>
 * ```
 */
export const CometChatChangeScope = {
  Root: CometChatChangeScopeRoot,
  Header: CometChatChangeScopeHeader,
  ScopeList: CometChatChangeScopeList,
  ScopeOption: CometChatChangeScopeOption,
  Actions: CometChatChangeScopeActions,
  ErrorMessage: CometChatChangeScopeErrorMessage,
} as const;
