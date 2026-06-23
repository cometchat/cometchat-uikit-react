import React, { useMemo } from 'react';
import { CometChatUsersContext } from './CometChatUsers.context';
import { useCometChatUsers } from './useCometChatUsers';
import { CometChatUsersList } from './CometChatUsersList';
import { CometChatUsersHeader } from './CometChatUsersHeader';
import { CometChatUsersSearchBar } from './CometChatUsersSearchBar';
import { CometChatUsersEmptyState } from './CometChatUsersEmptyState';
import { CometChatUsersErrorState } from './CometChatUsersErrorState';
import { CometChatUsersLoadingState } from './CometChatUsersLoadingState';
import { CometChatUsersSelectedPreview } from './CometChatUsersSelectedPreview';
import type { CometChatUsersRootProps, CometChatUsersContextValue } from './CometChatUsers.types';
import './CometChatUsers.css';
import { useLocale } from '../../context/locale/LocaleContext';
import { useGlobalConfig } from '../../context/GlobalConfigContext';

/**
 * CometChatUsersRoot — Provider + default layout.
 *
 * Wraps children with the CometChatUsers context. If no children are provided,
 * renders the default layout (Header + SearchBar + List + state views).
 */
export const CometChatUsersRoot: React.FC<CometChatUsersRootProps> = ({
  usersRequestBuilder,
  searchRequestBuilder,
  searchKeyword,
  hideUserStatus: hideUserStatusProp,
  selectionMode = 'none',
  activeUser,
  sectionHeaderKey = 'getName',
  hideSearch = false,
  showSectionHeader = true,
  showSelectedUsersPreview = false,
  showScrollbar = false,
  options,
  onItemClick,
  onSelect,
  onError,
  onEmpty,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const globalConfig = useGlobalConfig();
  const hideUserStatus = hideUserStatusProp ?? globalConfig.hideUserStatus ?? false;
  const hookReturn = useCometChatUsers({
    usersRequestBuilder,
    searchRequestBuilder,
    searchKeyword,
    hideUserStatus,
    selectionMode,
    activeUser,
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  });

  const contextValue: CometChatUsersContextValue = useMemo(
    () => ({
      ...hookReturn,
      selectionMode,
      hideUserStatus,
      sectionHeaderKey,
      hideSearch,
      showSectionHeader,
      showSelectedUsersPreview,
      showScrollbar,
      options,
    }),
    [
      hookReturn,
      selectionMode,
      hideUserStatus,
      sectionHeaderKey,
      hideSearch,
      showSectionHeader,
      showSelectedUsersPreview,
      showScrollbar,
      options,
    ]
  );

  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatUsersContext.Provider value={contextValue}>
      <div
        className={'cometchat-users'}
        role="region"
        aria-label={getLocalizedString('user_title')}
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatUsersHeader />
            {!hideSearch && <CometChatUsersSearchBar />}
            {showSelectedUsersPreview && <CometChatUsersSelectedPreview />}
            <CometChatUsersLoadingState />
            <CometChatUsersErrorState />
            <CometChatUsersEmptyState />
            {(hookReturn.fetchState === 'loaded' || hookReturn.users.length > 0) && (
              <CometChatUsersList />
            )}
          </>
        )}
      </div>
    </CometChatUsersContext.Provider>
  );
};

CometChatUsersRoot.displayName = 'CometChatUsers.Root';
