import React, { useMemo } from 'react';
import { CometChatGroupsContext } from './CometChatGroups.context';
import { useCometChatGroups } from './useCometChatGroups';
import { CometChatGroupsList } from './CometChatGroupsList';
import { CometChatGroupsHeader } from './CometChatGroupsHeader';
import { CometChatGroupsSearchBar } from './CometChatGroupsSearchBar';
import { CometChatGroupsEmptyState } from './CometChatGroupsEmptyState';
import { CometChatGroupsErrorState } from './CometChatGroupsErrorState';
import { CometChatGroupsLoadingState } from './CometChatGroupsLoadingState';
import type {
  CometChatGroupsRootProps,
  CometChatGroupsContextValue,
} from './CometChatGroups.types';
import './CometChatGroups.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupsRoot — Provider + default layout.
 *
 * Wraps children with the CometChatGroups context. If no children are provided,
 * renders the default layout (Header + SearchBar + List + state views).
 */
export const CometChatGroupsRoot: React.FC<CometChatGroupsRootProps> = ({
  groupsRequestBuilder,
  searchRequestBuilder,
  searchKeyword,
  hideGroupType = false,
  hideSearch = false,
  selectionMode = 'none',
  activeGroup,
  options,
  onItemClick,
  onSelect,
  onError,
  onEmpty,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const hookReturn = useCometChatGroups({
    groupsRequestBuilder,
    searchRequestBuilder,
    searchKeyword,
    selectionMode,
    activeGroup,
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  });

  const contextValue: CometChatGroupsContextValue = useMemo(
    () => ({
      ...hookReturn,
      selectionMode,
      hideGroupType,
      hideSearch,
      options,
    }),
    [hookReturn, selectionMode, hideGroupType, hideSearch, options]
  );

  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatGroupsContext.Provider value={contextValue}>
      <div
        className={'cometchat-groups'}
        role="region"
        aria-label={getLocalizedString('group_title')}
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatGroupsHeader />
            {!hideSearch && <CometChatGroupsSearchBar />}
            {hookReturn.fetchState === 'loading' && <CometChatGroupsLoadingState />}
            {hookReturn.fetchState === 'error' && <CometChatGroupsErrorState />}
            {hookReturn.fetchState === 'empty' && <CometChatGroupsEmptyState />}
            {(hookReturn.fetchState === 'loaded' || hookReturn.groups.length > 0) && (
              <CometChatGroupsList />
            )}
          </>
        )}
      </div>
    </CometChatGroupsContext.Provider>
  );
};

CometChatGroupsRoot.displayName = 'CometChatGroups.Root';
