import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatIncomingCall, CometChatSearch, CometChatConfirmDialog, usePublishEvent, useCometChatEvents, useLocale } from '@cometchat/chat-uikit-react';
import blockIcon from '../../assets/block.svg';
import type {
  CometChatSearchConversationClickEvent,
  CometChatSearchMessageClickEvent,
  CometChatEvent,
} from '@cometchat/chat-uikit-react';
import { useAppContext } from '../../context/AppContext';
import { CometChatTabs, type TabItem } from '../CometChatSelector/CometChatTabs';
import { CometChatSelector } from '../CometChatSelector/CometChatSelector';
import { CometChatMessages } from '../CometChatMessages/CometChatMessages';
import { CometChatEmptyStateView } from '../CometChatMessages/CometChatEmptyStateView';
import { CometChatSideComponent } from '../CometChatDetails/CometChatSideComponent';
import { CometChatThreadPanel } from '../CometChatThreadPanel/CometChatThreadPanel';
import { CometChatNewChatView } from '../CometChatNewChat/CometChatNewChatView';
import { CometChatCreateGroup } from '../CometChatCreateGroup/CometChatCreateGroup';
import { CometChatCallLogDetails } from '../CometChatCallLog/CometChatCallLogDetails';
import { CometChatJoinGroup } from '../CometChatJoinGroup/CometChatJoinGroup';
import '../../styles/App.css';

/**
 * Lazy-load CometChatAIAssistantChat — only loaded when an @agentic user is selected.
 * Mirrors v6: messageUser.getRole() == "@agentic" → render CometChatAIAssistantChat
 */
const LazyCometChatAIAssistantChat = lazy(() =>
  import('@cometchat/chat-uikit-react').then(m => ({
    default: m.CometChatAIAssistantChat,
  }))
);

interface CometChatHomeProps {
  loggedInUser: CometChat.User;
  onLogout: () => void;
}

export const CometChatHome = ({ loggedInUser, onLogout }: CometChatHomeProps) => {
  const { appState, setAppState } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>('chats');
  const [selectedItem, setSelectedItem] = useState<
    CometChat.Conversation | CometChat.User | CometChat.Group | undefined
  >();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCallLog, setSelectedCallLog] = useState<any>(undefined);
  const publish = usePublishEvent();
  const [sidePanel, setSidePanel] = useState<{ visible: boolean; type: 'user' | 'group' }>({
    visible: false,
    type: 'user',
  });
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showScopedSearch, setShowScopedSearch] = useState(false);
  const [isFreshChat, setIsFreshChat] = useState(false);
  const [joinGroupInfo, setJoinGroupInfo] = useState<{ visible: boolean; group?: CometChat.Group }>({
    visible: false,
  });
  const [kickedBannedAlert, setKickedBannedAlert] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });
  const { getLocalizedString } = useLocale();

  useCometChatEvents((event: CometChatEvent) => {
    if (event.type === 'ui:open-chat' && event.user) {
      const uid = event.user.getUid();
      if (uid === loggedInUser.getUid()) return; 

      setSidePanel({ visible: false, type: 'user' });

      void CometChat.getConversation(uid, 'user').then(
        (conversation: CometChat.Conversation) => {
          setAppState({ type: 'updateSelectedItem', payload: conversation });
          setSelectedItem(conversation);
        },
        () => {
          setAppState({ type: 'updateSelectedItemUser', payload: event.user });
          setSelectedItem(event.user);
        }
      );
    }
    if (event.type === 'ui:conversation/deleted') {
      const deletedConvId = event.conversation.getConversationId();
      if (
        selectedItem &&
        'getConversationId' in selectedItem &&
        (selectedItem as CometChat.Conversation).getConversationId() === deletedConvId
      ) {
        setSidePanel({ visible: false, type: 'user' });
        setSelectedItem(undefined);
      }
    }
    // Track whether the active chat has messages (for delete chat button)
    if (event.type === 'ui:active-chat/changed') {
      setIsFreshChat(!event.message);
    }
    if (event.type === 'ui:message/sent') {
      setIsFreshChat(false);
    }
    if (
      event.type === 'message/text-received' ||
      event.type === 'message/media-received' ||
      event.type === 'message/custom-received' ||
      event.type === 'message/interactive-received'
    ) {
      setIsFreshChat(false);
    }
  }, [loggedInUser]);

  // --- SDK Group listener for kicked/banned (shows modal when user is removed) ---
  useEffect(() => {
    const listenerId = `CometChatHome_group_${Date.now()}`;

    const getSelectedGroupGuid = (): string | undefined => {
      if (!selectedItem) return undefined;
      if ('getGuid' in selectedItem) return (selectedItem as CometChat.Group).getGuid();
      if ('getConversationWith' in selectedItem) {
        const convWith = (selectedItem as CometChat.Conversation).getConversationWith();
        if (convWith && 'getGuid' in convWith) return (convWith as CometChat.Group).getGuid();
      }
      return undefined;
    };

    CometChat.addGroupListener(
      listenerId,
      new CometChat.GroupListener({
        onGroupMemberKicked: (
          _message: CometChat.Action,
          kickedUser: CometChat.User,
          _kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          if (kickedUser.getUid() === loggedInUser.getUid()) {
            const selectedGuid = getSelectedGroupGuid();
            if (selectedGuid === kickedFrom.getGuid()) {
              setKickedBannedAlert({ visible: true, message: getLocalizedString('you_have_been_kicked') });
            }
          }
        },
        onGroupMemberBanned: (
          _message: CometChat.Action,
          bannedUser: CometChat.User,
          _bannedBy: CometChat.User,
          bannedFrom: CometChat.Group
        ) => {
          if (bannedUser.getUid() === loggedInUser.getUid()) {
            const selectedGuid = getSelectedGroupGuid();
            if (selectedGuid === bannedFrom.getGuid()) {
              setKickedBannedAlert({ visible: true, message: getLocalizedString('you_have_been_banned') });
            }
          }
        },
      })
    );

    return () => {
      CometChat.removeGroupListener(listenerId);
    };
  }, [loggedInUser, selectedItem, getLocalizedString]);

  const handleKickedBannedDismiss = useCallback(() => {
    setKickedBannedAlert({ visible: false, message: '' });
    setSidePanel({ visible: false, type: 'user' });
    setSelectedItem(undefined);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeTab === 'chats' && appState.selectedItem) {
      setSelectedItem(appState.selectedItem);
    } else if (activeTab === 'users' && appState.selectedItemUser) {
      setSelectedItem(appState.selectedItemUser);
    } else if (activeTab === 'groups' && appState.selectedItemGroup) {
      setSelectedItem(appState.selectedItemGroup);
    } else if (activeTab === 'calls') {
      // Calls tab manages its own selection internally
      setSelectedItem(undefined);
    } else {
      setSelectedItem(undefined);
    }
  }, [activeTab]);

  const onTabClicked = (tabItem: TabItem) => {
    setSidePanel({ visible: false, type: 'user' });
    setAppState({ type: 'updateGoToMessageId', payload: undefined });
    setSelectedCallLog(undefined);
    setShowGlobalSearch(false);
    setShowScopedSearch(false);
    setActiveTab(tabItem.id);
  };

  const onSelectorItemClicked = (
    e: CometChat.Conversation | CometChat.User | CometChat.Group,
    type: string
  ) => {
    setSidePanel({ visible: false, type: 'user' });
    setAppState({ type: 'updateGoToMessageId', payload: undefined });
    setAppState({ type: 'updateThreadedMessage', payload: undefined });
    setShowScopedSearch(false);
    setShowNewChat(false);

    if (type === 'updateSelectedItem') {
      setAppState({ type: 'updateSelectedItem', payload: e as CometChat.Conversation });
      setSelectedItem(e);
    } else if (type === 'updateSelectedItemUser') {
      setAppState({ type: 'updateSelectedItemUser', payload: e as CometChat.User });
      setSelectedItem(e);
    } else if (type === 'updateSelectedItemGroup') {
      const group = e as CometChat.Group;
      if (!group.getHasJoined()) {
        if (group.getType() === 'public') {
          // Auto-join public groups
          CometChat.joinGroup(group.getGuid(), group.getType() as CometChat.GroupType)
            .then((joinedGroup: CometChat.Group) => {
              setAppState({ type: 'updateSelectedItemGroup', payload: joinedGroup });
              setSelectedItem(joinedGroup);
              publish({
                type: 'ui:group/member-joined',
                joinedGroup,
                joinedUser: loggedInUser,
              });
            })
            .catch((error: unknown) => {
              console.error('Failed to join public group:', error);
            });
        } else if (group.getType() === 'password') {
          // Show password dialog for password-protected groups
          setJoinGroupInfo({ visible: true, group });
        }
      } else {
        setAppState({ type: 'updateSelectedItemGroup', payload: group });
        setSelectedItem(group);
      }
    } else if (type === 'updateSelectedItemCall') {
      setSelectedCallLog(e);
    }
  };

  const getMessageUser = (): CometChat.User | undefined => {
    if (selectedItem instanceof CometChat.User) {
      return selectedItem;
    }
    if (selectedItem && 'getConversationType' in selectedItem) {
      const conv = selectedItem as CometChat.Conversation;
      if (conv.getConversationType?.() === 'user') {
        return conv.getConversationWith?.() as CometChat.User;
      }
    }
    return undefined;
  };

  const getMessageGroup = (): CometChat.Group | undefined => {
    if (selectedItem instanceof CometChat.Group) {
      return selectedItem;
    }
    if (selectedItem && 'getConversationType' in selectedItem) {
      const conv = selectedItem as CometChat.Conversation;
      if (conv.getConversationType?.() === 'group') {
        return conv.getConversationWith?.() as CometChat.Group;
      }
    }
    return undefined;
  };

  const messageUser = getMessageUser();
  const messageGroup = getMessageGroup();
  const hasActiveChat = messageUser || messageGroup;

  /**
   * Mirrors v6: messageUser.getRole() == "@agentic"
   * When true, render CometChatAIAssistantChat instead of CometChatMessages.
   */
  const isAgenticUser = messageUser?.getRole() === '@agentic';

  const onBack = () => {
    setSelectedItem(undefined);
    setSidePanel({ visible: false, type: 'user' });
    setAppState({ type: 'updateSelectedItem', payload: undefined });
    setAppState({ type: 'updateSelectedItemUser', payload: undefined });
    setAppState({ type: 'updateSelectedItemGroup', payload: undefined });
  };

  const onHeaderClicked = () => {
    // Mutual exclusion: opening details closes thread and scoped search
    setAppState({ type: 'updateThreadedMessage', payload: undefined });
    setShowScopedSearch(false);
    if (messageUser) {
      setSidePanel({ visible: true, type: 'user' });
    } else if (messageGroup) {
      setSidePanel({ visible: true, type: 'group' });
    }
  };

  const onHideSidePanel = () => {
    setSidePanel({ visible: false, type: 'user' });
  };

  const onConversationDeleted = () => {
    setSidePanel({ visible: false, type: 'user' });
    setSelectedItem(undefined);
    setAppState({ type: 'updateSelectedItem', payload: undefined });
    setAppState({ type: 'updateSelectedItemUser', payload: undefined });
    setAppState({ type: 'updateSelectedItemGroup', payload: undefined });
  };

  const getActiveItem = () => {
    if (
      (activeTab === 'chats' && selectedItem && 'getConversationId' in (selectedItem as any)) ||
      (activeTab === 'users' && selectedItem instanceof CometChat.User) ||
      (activeTab === 'groups' && selectedItem instanceof CometChat.Group)
    ) {
      return selectedItem;
    }
    return undefined;
  };

  const showSidebar = !isMobile || !hasActiveChat;
  const showMessages = !isMobile || hasActiveChat;

  // --- Global search handlers ---

  const onSearchConversationClick = (event: CometChatSearchConversationClickEvent) => {
    const conversation = event.conversation;
    setAppState({ type: 'updateGoToMessageId', payload: undefined });
    setAppState({ type: 'updateThreadedMessage', payload: undefined });
    setSidePanel({ visible: false, type: 'user' });
    setAppState({ type: 'updateSelectedItem', payload: conversation });
    setSelectedItem(conversation);
  };

  const onSearchMessageClick = async (event: CometChatSearchMessageClickEvent) => {
    const message = event.message;

    try {
      const conversation =
        await CometChat.CometChatHelper.getConversationFromMessage(message);

      if (!conversation) return;

      setAppState({ type: 'updateSelectedItem', payload: conversation });
      setSelectedItem(conversation);
      setSidePanel({ visible: false, type: 'user' });

      if (message.getParentMessageId()) {
        const parentMsg = await CometChat.getMessageDetails(
          String(message.getParentMessageId())
        );
        if (parentMsg) {
          setAppState({ type: 'updateThreadSearchMessage', payload: message });
          setAppState({ type: 'updateThreadedMessage', payload: parentMsg });
          setAppState({ type: 'updateThreadGoToMessageId', payload: message.getId() });
          setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) });
        }
      } else {
        setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
        setAppState({ type: 'updateThreadedMessage', payload: undefined });
        setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) });
      }
    } catch (error) {
      console.error('Error navigating to search result:', error);
    }
  };

  return (
    <div className="cometchat-root">
      {/* Kicked/Banned alert modal */}
      <CometChatConfirmDialog.Root
        isOpen={kickedBannedAlert.visible}
        onClose={handleKickedBannedDismiss}
        variant="danger"
        closeOnOutsideClick={false}
      >
        <CometChatConfirmDialog.Icon icon={<img className="cometchat-confirm-dialog__icon-default" src={blockIcon} alt="" aria-hidden="true" width={36} height={36} draggable={false} />} />
        <CometChatConfirmDialog.Content
          title={getLocalizedString('no_longer_part_of_group')}
          messageText={kickedBannedAlert.message}
        />
        <CometChatConfirmDialog.Actions>
          <div className="cometchat-confirm-dialog__actions-cancel" style={{ flex: 1 }}>
            <button onClick={handleKickedBannedDismiss}>{getLocalizedString('understood')}</button>
          </div>
        </CometChatConfirmDialog.Actions>
      </CometChatConfirmDialog.Root>

      {showSidebar && (
        <div className="conversations-wrapper">
          <div className="selector-wrapper">
            <CometChatSelector
              activeTab={activeTab}
              activeItem={getActiveItem()}
              loggedInUser={loggedInUser}
              onSelectorItemClicked={onSelectorItemClicked}
              onLogout={onLogout}
              onNewChatClicked={() => setShowNewChat(true)}
              onCreateGroupClicked={() => setShowCreateGroup(true)}
              onSearchClicked={() => setShowGlobalSearch(true)}
            />
          </div>
          {showGlobalSearch && (
            <div className="selector-wrapper-search">
              <CometChatSearch
                hideBackButton={false}
                onBack={() => setShowGlobalSearch(false)}
                onConversationClicked={onSearchConversationClick}
                onMessageClicked={(event: CometChatSearchMessageClickEvent) => { void onSearchMessageClick(event); }}
              />
            </div>
          )}
          <CometChatTabs onTabClicked={onTabClicked} activeTab={activeTab} tabNames={{
            chats: getLocalizedString('chats'),
            calls: getLocalizedString('calls'),
            users: getLocalizedString('users'),
            groups: getLocalizedString('groups'),
          }} />
        </div>
      )}

      {showMessages && !(appState.threadSearchMessage && appState.threadedMessage) && (
        <div className="messages-wrapper">
          {showNewChat ? (
            <CometChatNewChatView
              onBack={() => setShowNewChat(false)}
              onUserSelected={(user) => {
                setShowNewChat(false);
                setSidePanel({ visible: false, type: 'user' });
                setAppState({ type: 'updateSelectedItemUser', payload: user });
                setAppState({ type: 'updateSelectedItemGroup', payload: undefined });
                setSelectedItem(user);
              }}
              onGroupSelected={(group) => {
                setShowNewChat(false);
                setSidePanel({ visible: false, type: 'group' });
                setAppState({ type: 'updateSelectedItemUser', payload: undefined });
                if (!group.getHasJoined()) {
                  if (group.getType() === 'public') {
                    CometChat.joinGroup(group.getGuid(), group.getType() as CometChat.GroupType)
                      .then((joinedGroup: CometChat.Group) => {
                        setAppState({ type: 'updateSelectedItemGroup', payload: joinedGroup });
                        setSelectedItem(joinedGroup);
                        publish({
                          type: 'ui:group/member-joined',
                          joinedGroup,
                          joinedUser: loggedInUser,
                        });
                      })
                      .catch((error: unknown) => {
                        console.error('Failed to join public group:', error);
                      });
                  } else if (group.getType() === 'password') {
                    setJoinGroupInfo({ visible: true, group });
                  }
                } else {
                  setAppState({ type: 'updateSelectedItemGroup', payload: group });
                  setSelectedItem(group);
                }
              }}
            />
          ) : isAgenticUser && messageUser ? (
            /**
             * @agentic user selected — render AI assistant chat.
             */
            <Suspense>
              <LazyCometChatAIAssistantChat
                user={messageUser}
                onBackButtonClicked={onBack}
                showBackButton={isMobile}
                streamingSpeed={30}
              />
            </Suspense>
          ) : hasActiveChat ? (
            <CometChatMessages
              user={messageUser}
              group={messageGroup}
              onBack={onBack}
              onHeaderClicked={onHeaderClicked}
              onSearchClicked={() => {
                setAppState({ type: 'updateThreadedMessage', payload: undefined });
                setSidePanel({ visible: false, type: 'user' });
                setShowScopedSearch(true);
              }}
              onThreadRepliesClick={(message) => {
                setSidePanel({ visible: false, type: 'user' });
                setShowScopedSearch(false);
                setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
                setAppState({ type: 'updateThreadedMessage', payload: message });
              }}
              goToMessageId={appState.threadSearchMessage ? undefined : appState.goToMessageId}
            />
          ) : activeTab === 'calls' && selectedCallLog ? (
            <CometChatCallLogDetails
              selectedItem={selectedCallLog}
              onBack={() => setSelectedCallLog(undefined)}
            />
          ) : (
            <CometChatEmptyStateView activeTab={activeTab} />
          )}
        </div>
      )}

      {/* Right panel: thread OR scoped search OR details (mutually exclusive) */}
      {appState.threadedMessage && hasActiveChat && (
        <div className={`cometchat-thread-panel-wrapper${appState.threadSearchMessage ? ' cometchat-thread-panel-wrapper--threaded' : ''}`}>
          <CometChatThreadPanel
            key={appState.threadedMessage.getId()}
            parentMessage={appState.threadedMessage}
            user={messageUser}
            group={messageGroup}
            loggedInUser={loggedInUser}
            onClose={() => {
              setAppState({ type: 'updateThreadedMessage', payload: undefined });
              setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
              setAppState({ type: 'updateGoToMessageId', payload: undefined });
            }}
            onSubtitleClicked={() => {
              // Navigate to parent message in main list, then close thread
              const parentId = appState.threadedMessage?.getId();
              setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
              if (parentId) {
                setAppState({ type: 'updateGoToMessageId', payload: String(parentId) });
              }
              setAppState({ type: 'updateThreadedMessage', payload: undefined });
            }}
            goToMessageId={appState.threadSearchMessage ? Number(appState.goToMessageId) || appState.threadGoToMessageId : appState.threadGoToMessageId}
          />
        </div>
      )}

      {showScopedSearch && !appState.threadedMessage && hasActiveChat && (
        <div className="side-component-wrapper">
          <CometChatSearch
            uid={messageUser?.getUid()}
            guid={messageGroup?.getGuid()}
            hideBackButton={false}
            onBack={() => setShowScopedSearch(false)}
            onMessageClicked={(event: CometChatSearchMessageClickEvent) => {
              const message = event.message;
              if (message.getParentMessageId()) {
                // Thread message — open thread and scroll to it
                void (async () => {
                  try {
                    const parentMsg = await CometChat.getMessageDetails(
                      String(message.getParentMessageId())
                    );
                    if (parentMsg) {
                      setShowScopedSearch(false);
                      setAppState({ type: 'updateThreadSearchMessage', payload: message });
                      setAppState({ type: 'updateThreadedMessage', payload: parentMsg });
                      setAppState({ type: 'updateThreadGoToMessageId', payload: message.getId() });
                      setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) });
                    }
                  } catch (error) {
                    console.error('Error fetching parent message:', error);
                  }
                })();
              } else {
                setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) });
              }
            }}
          />
        </div>
      )}

      {sidePanel.visible && !appState.threadedMessage && !showScopedSearch && (
        <CometChatSideComponent
          type={sidePanel.type}
          user={messageUser}
          group={messageGroup}
          loggedInUser={loggedInUser}
          onHide={onHideSidePanel}
          onConversationDeleted={onConversationDeleted}
          onGroupLeft={onConversationDeleted}
          onGroupDeleted={onConversationDeleted}
          isFreshChat={isFreshChat}
        />
      )}

      {showCreateGroup && (
        <CometChatCreateGroup
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(group) => {
            setShowCreateGroup(false);
            setSidePanel({ visible: false, type: 'group' });
            setAppState({ type: 'updateSelectedItemGroup', payload: group });
            setSelectedItem(group);
            publish({ type: 'ui:group/created', group });
          }}
        />
      )}
      
      {/* Incoming call listener — renders at root level */}
      <CometChatIncomingCall />

      {/* Join password-protected group dialog */}
      {joinGroupInfo.visible && joinGroupInfo.group && (
        <CometChatJoinGroup
          group={joinGroupInfo.group}
          loggedInUser={loggedInUser}
          onClose={() => setJoinGroupInfo({ visible: false })}
          onGroupJoined={(joinedGroup) => {
            setJoinGroupInfo({ visible: false });
            setSidePanel({ visible: false, type: 'group' });
            setAppState({ type: 'updateSelectedItemGroup', payload: joinedGroup });
            setSelectedItem(joinedGroup);
          }}
        />
      )}
    </div>
  );
};
