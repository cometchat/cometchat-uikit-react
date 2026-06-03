import React, { useCallback, useMemo } from 'react';
import { CometChatGroupMembersContext } from './CometChatGroupMembers.context';
import { useCometChatGroupMembers } from './useCometChatGroupMembers';
import { CometChatGroupMembersList } from './CometChatGroupMembersList';
import { CometChatGroupMembersHeader } from './CometChatGroupMembersHeader';
import { CometChatGroupMembersSearchBar } from './CometChatGroupMembersSearchBar';
import { CometChatGroupMembersEmptyState } from './CometChatGroupMembersEmptyState';
import { CometChatGroupMembersErrorState } from './CometChatGroupMembersErrorState';
import { CometChatGroupMembersLoadingState } from './CometChatGroupMembersLoadingState';
import { CometChatChangeScope } from '../base/CometChatChangeScope/CometChatChangeScope';
import type { CometChatChangeScopeOptionData } from '../base/CometChatChangeScope/CometChatChangeScope.types';
import type {
  CometChatGroupMembersRootProps,
  CometChatGroupMembersContextValue,
} from './CometChatGroupMembers.types';
import './CometChatGroupMembers.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupMembersRoot — Provider + default layout.
 *
 * Wraps children with the CometChatGroupMembers context. If no children are provided,
 * renders the default layout (Header + SearchBar + List + state views).
 */
export const CometChatGroupMembersRoot: React.FC<CometChatGroupMembersRootProps> = ({
  group,
  groupMemberRequestBuilder,
  searchRequestBuilder,
  searchKeyword,
  hideUserStatus = false,
  hideSearch = false,
  hideKickMemberOption = false,
  hideBanMemberOption = false,
  hideScopeChangeOption = false,
  selectionMode = 'none',
  options,
  onItemClick,
  onSelect,
  onError,
  onEmpty,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const hookReturn = useCometChatGroupMembers({
    group,
    groupMemberRequestBuilder,
    searchRequestBuilder,
    searchKeyword,
    hideUserStatus,
    selectionMode,
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  });

  const contextValue: CometChatGroupMembersContextValue = useMemo(
    () => ({
      ...hookReturn,
      group,
      selectionMode,
      hideUserStatus,
      hideSearch,
      hideKickMemberOption,
      hideBanMemberOption,
      hideScopeChangeOption,
      options,
    }),
    [
      hookReturn,
      group,
      selectionMode,
      hideUserStatus,
      hideSearch,
      hideKickMemberOption,
      hideBanMemberOption,
      hideScopeChangeOption,
      options,
    ]
  );

  const hasChildren = React.Children.count(children) > 0;

  // --- Change Scope dialog logic ---
  const handleChangeScopeConfirm = useCallback(
    async (newScope: string) => {
      if (!hookReturn.memberToChangeScope) return;
      const uid = hookReturn.memberToChangeScope.getUid();
      await hookReturn.changeScope(uid, newScope);
      hookReturn.setMemberToChangeScope(null);
    },
    [hookReturn]
  );

  const handleChangeScopeClose = useCallback(() => {
    hookReturn.setMemberToChangeScope(null);
  }, [hookReturn]);

  // Compute allowed scopes for the member being changed
  const changeScopeOptions: CometChatChangeScopeOptionData[] = useMemo(() => {
    if (!hookReturn.memberToChangeScope) return [];

    const myScope = hookReturn.loggedInUserScope ?? 'participant';
    const memberScope = hookReturn.memberToChangeScope.getScope();
    let allowedScopes: string[] = [];

    if (myScope === 'owner') {
      allowedScopes = ['participant', 'admin', 'moderator'];
    } else if (myScope === 'admin') {
      if (memberScope === 'participant' || memberScope === 'moderator' || memberScope === 'admin') {
        allowedScopes = ['participant', 'admin', 'moderator'];
      }
    } else if (myScope === 'moderator') {
      if (memberScope === 'participant') {
        allowedScopes = ['participant', 'moderator'];
      }
    }

    if (allowedScopes.includes(memberScope)) {
      allowedScopes = [memberScope, ...allowedScopes.filter(s => s !== memberScope)];
    }

    return allowedScopes.map(s => ({
      id: s,
      label: s.charAt(0).toUpperCase() + s.slice(1),
    }));
  }, [hookReturn.memberToChangeScope, hookReturn.loggedInUserScope]);

  return (
    <CometChatGroupMembersContext.Provider value={contextValue}>
      <div
        className={'cometchat-group-members'}
        role="region"
        aria-label={getLocalizedString('group_members_header')}
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatGroupMembersHeader />
            {!hideSearch && <CometChatGroupMembersSearchBar />}
            {hookReturn.fetchState === 'loading' && <CometChatGroupMembersLoadingState />}
            {hookReturn.fetchState === 'error' && <CometChatGroupMembersErrorState />}
            {hookReturn.fetchState === 'empty' && <CometChatGroupMembersEmptyState />}
            {(hookReturn.fetchState === 'loaded' || hookReturn.members.length > 0) && (
              <CometChatGroupMembersList />
            )}
          </>
        )}

        {/* Change Scope dialog — rendered at Root level to cover entire component */}
        {hookReturn.memberToChangeScope && changeScopeOptions.length > 0 && (
          <div
            className={'cometchat-group-members__backdrop'}
            onClick={handleChangeScopeClose}
            onKeyDown={e => {
              if (e.key === 'Escape') handleChangeScopeClose();
            }}
            role="presentation"
          >
            <div
              onClick={e => {
                e.stopPropagation();
              }}
              onKeyDown={e => {
                e.stopPropagation();
              }}
              role="presentation"
            >
              <CometChatChangeScope.Root
                options={changeScopeOptions}
                defaultSelection={hookReturn.memberToChangeScope.getScope()}
                onScopeChanged={handleChangeScopeConfirm}
                onClose={handleChangeScopeClose}
              >
                <CometChatChangeScope.Header
                  title={getLocalizedString('change_scope_title')}
                  description="You can change scope for the group member to manage group permissions and responsibilities."
                />
                <CometChatChangeScope.ScopeList />
                <CometChatChangeScope.Actions
                  submitText={getLocalizedString('change_scope_confirm_yes')}
                  cancelText={getLocalizedString('change_scope_confirm_no')}
                />
              </CometChatChangeScope.Root>
            </div>
          </div>
        )}
      </div>
    </CometChatGroupMembersContext.Provider>
  );
};

CometChatGroupMembersRoot.displayName = 'CometChatGroupMembers.Root';
