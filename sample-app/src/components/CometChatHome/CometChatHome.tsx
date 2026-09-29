import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatIncomingCall,
  CometChatSearch,
  CometChatConfirmDialog,
  usePublishEvent,
  useCometChatEvents,
  useLocale,
} from '@cometchat/chat-uikit-react';
import blockIconAsset from '../../assets/block.svg';
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
import { CometChatPinnedMessages, CometChatSavedMessages } from '@cometchat/chat-uikit-react';
import { CometChatSideComponent } from '../CometChatDetails/CometChatSideComponent';
import { CometChatThreadPanel } from '../CometChatThreadPanel/CometChatThreadPanel';
import { CometChatNewChatView } from '../CometChatNewChat/CometChatNewChatView';
import { CometChatCreateGroup } from '../CometChatCreateGroup/CometChatCreateGroup';
import { CometChatCallLogDetails } from '../CometChatCallLog/CometChatCallLogDetails';
import { CometChatJoinGroup } from '../CometChatJoinGroup/CometChatJoinGroup';
import { useSettings } from '../../config/SettingsContext';
import { useFeatureProps } from '../../config/useFeatureProps';
import type { TabName } from '../../config/settings.types';
import { useIsMobile } from '../../hooks/useIsMobile';
import { assetUrl } from '../../utils/assetUrl';

const blockIcon = assetUrl(blockIconAsset);

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
  /**
   * Opens this user's conversation on mount. Only honoured when `autoOpenFirstItem` is true
   */
  defaultUser?: CometChat.User;
  /** Group equivalent of `defaultUser`. */
  defaultGroup?: CometChat.Group;
  /**
   * Whether "X added Y to the group" action messages appear. Undefined leaves the
   * settings-derived default untouched.
   */
  showGroupActionMessages?: boolean;
  /**
   * Selects an initial conversation on mount rather than showing the empty state.
   *
   * @default false
   */
  autoOpenFirstItem?: boolean;
  /** Tab selected on mount. Ignored unless present in `layout.tabs`. */
  defaultActiveTab?: TabName;
}

/**
 * Opens a public group, joining first only if we are not already a member.
 *
 * Two things this gets right that a bare `joinGroup().then(open)` does not:
 *
 * 1. **`ERR_ALREADY_JOINED` is success, not failure.** The backend is telling us the user is
 *    already in the group — which is exactly the state we were trying to reach. Treating it as an
 *    error left the group unopenable: the app only selected the group inside `.then()`, so a
 *    rejection meant a click that did nothing at all, with the reason only in the console. This
 *    bites hardest for a user who *created* the group, since creating already joins you.
 *
 * 2. **The local object is marked joined on success.** call `setHasJoined(true)` and
 *    `setScope('participant')` on the response. Without them the in-memory group
 *    keeps reporting `hasJoined: false`, so the next click on the same group attempts the join
 *    again — and that second attempt is the one that returns ERR_ALREADY_JOINED.
 *
 * Any other join failure still surfaces and leaves the group closed, which is correct: a private
 * group we genuinely cannot enter should not open.
 */
const openPublicGroup = (
  group: CometChat.Group,
  onOpen: (group: CometChat.Group) => void,
  onJoined: (group: CometChat.Group) => void
) => {
  CometChat.joinGroup(group.getGuid(), group.getType() as CometChat.GroupType)
    .then((joinedGroup: CometChat.Group) => {
      // Keep the local object in step with the server so repeat clicks skip the join.
      joinedGroup.setHasJoined?.(true);
      joinedGroup.setScope?.('participant' as CometChat.GroupMemberScope);
      onOpen(joinedGroup);
      onJoined(joinedGroup);
    })
    .catch((error: unknown) => {
      const code = (error as { code?: string })?.code;
      if (code === 'ERR_ALREADY_JOINED') {
        // Already a member — the desired end state. Correct the stale flag and open.
        group.setHasJoined?.(true);
        onOpen(group);
        return;
      }
      console.error('Failed to join public group:', error);
    });
};

export const CometChatHome = ({
  loggedInUser,
  onLogout,
  defaultUser,
  defaultGroup,
  showGroupActionMessages,
  autoOpenFirstItem = false,
  defaultActiveTab,
}: CometChatHomeProps) => {
  const { appState, setAppState } = useAppContext();
  const { layout, chatFeatures } = useSettings();
  const featureProps = useFeatureProps();
  const canCreateGroup = chatFeatures.groupManagement.createGroup;
  const canSearch = chatFeatures.coreMessagingExperience.conversationAndAdvancedSearch;
  const deeperUserEngagement = chatFeatures.deeperUserEngagement;
  const [activeTab, setActiveTab] = useState<string>(() =>
    defaultActiveTab && layout.tabs.includes(defaultActiveTab)
      ? defaultActiveTab
      : (layout.tabs[0] ?? 'chats')
  );
  const [selectedItem, setSelectedItem] = useState<
    CometChat.Conversation | CometChat.User | CometChat.Group | undefined
  >();
  const isMobile = useIsMobile();
  /** Ensures the auto-open effect fires only once per mount. */
  /**
   * Which configuration the automatic selection was last made for.
   *
   * A plain boolean here meant "once per mount", which is right for a shipped app — it reads its
   * settings at startup — but wrong wherever settings change under a live app, as they do in the
   * builder's preview: switching Chat Type re-ran this effect and it returned immediately, so the
   * preview kept whatever chat was already open and the setting looked dead.
   */
  const autoOpenedFor = useRef<string | null>(null);
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
  const [showSavedMessages, setShowSavedMessages] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [showScopedSearch, setShowScopedSearch] = useState(false);
  const [isFreshChat, setIsFreshChat] = useState(false);
  const [joinGroupInfo, setJoinGroupInfo] = useState<{ visible: boolean; group?: CometChat.Group }>(
    {
      visible: false,
    }
  );
  const [kickedBannedAlert, setKickedBannedAlert] = useState<{ visible: boolean; message: string }>(
    {
      visible: false,
      message: '',
    }
  );
  const { getLocalizedString } = useLocale();

  useCometChatEvents(
    (event: CometChatEvent) => {
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
      // Card action dispatcher (§2.9.8). One hookup covers both developer cards and
      // nested agent cards — the UI Kit forwards the raw action; the app performs the behavior.
      if (event.type === 'ui:card/action') {
        const action = event.action;
        switch (action.type) {
          case 'openUrl':
            // Open the URL (webview hint → same tab, else new tab).
            window.open(
              action.url,
              action.openIn === 'webview' ? '_self' : '_blank',
              'noopener,noreferrer'
            );
            break;
          case 'copyToClipboard':
            // Copy the supplied value to the clipboard.
            void navigator.clipboard?.writeText(action.value);
            break;
          case 'downloadFile': {
            // Trigger a file download via a transient anchor.
            const anchor = document.createElement('a');
            anchor.href = action.url;
            if (action.filename) anchor.download = action.filename;
            anchor.rel = 'noopener noreferrer';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            break;
          }
          case 'sendMessage': {
            // Send a text message to the given user/group (defaults to the open chat).
            const receiver = action.receiverUid ?? action.receiverGuid;
            const receiverType = action.receiverGuid ? 'group' : 'user';
            if (receiver) {
              const textMessage = new CometChat.TextMessage(receiver, action.text, receiverType);
              void CometChat.sendMessage(textMessage);
            }
            break;
          }
          case 'chatWithUser':
            // Open a 1:1 chat with the user.
            void CometChat.getUser(action.uid).then(user => {
              publish({ type: 'ui:open-chat', user });
            });
            break;
          case 'chatWithGroup':
            // Open the group chat.
            void CometChat.getGroup(action.guid).then(group => {
              publish({ type: 'ui:open-chat', group });
            });
            break;
          case 'initiateCall': {
            // Start an audio/video call with the user or group.
            const receiver = action.uid ?? action.guid;
            const receiverType = action.guid ? 'group' : 'user';
            if (receiver) {
              const call = new CometChat.Call(receiver, action.callType, receiverType);
              void CometChat.initiateCall(call).then(initiatedCall => {
                publish({ type: 'ui:call/outgoing', call: initiatedCall as CometChat.Call });
              });
            }
            break;
          }
          case 'apiCall':
            // Fire the configured HTTP request.
            void fetch(action.url, {
              method: action.method ?? 'GET',
              headers: action.headers,
              body: action.body ? JSON.stringify(action.body) : undefined,
            });
            break;
          case 'customCallback':
            // App-specific hook — handle by callbackId.
            console.info('[sample-app] card customCallback', action.callbackId, action.payload);
            break;
          default:
            break;
        }
      }
      if (
        event.type === 'message/text-received' ||
        event.type === 'message/media-received' ||
        event.type === 'message/custom-received' ||
        event.type === 'message/interactive-received'
      ) {
        setIsFreshChat(false);
      }
    },
    [loggedInUser]
  );

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
              setKickedBannedAlert({
                visible: true,
                message: getLocalizedString('you_have_been_kicked'),
              });
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
              setKickedBannedAlert({
                visible: true,
                message: getLocalizedString('you_have_been_banned'),
              });
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

  /**
   * Selects a conversation automatically when `autoOpenFirstItem` is set.
   *
   * Prefers an existing conversation with the deep-linked user/group; if none exists yet, opens
   * that user/group directly; otherwise takes the first item from the conversation list.
   *
   * Runs once per configuration rather than once per mount — see `autoOpenedFor` above. Every
   * selection in between belongs to the user and is left alone.
   */
  useEffect(() => {
    const conversationType = layout.chatType === 'group' ? 'group' : 'user';
    // Still once per configuration, so a chat the user picked by hand is never yanked away; a
    // genuine change of chat type or sidebar mode is a new configuration and selects again.
    const configuration = `${conversationType}|${String(layout.withSideBar)}`;
    if (!autoOpenFirstItem || autoOpenedFor.current === configuration) return;
    autoOpenedFor.current = configuration;

    let cancelled = false;

    const openConversation = (conversation: CometChat.Conversation) => {
      if (cancelled) return;
      setSelectedItem(conversation);
      setAppState({ type: 'updateSelectedItem', payload: conversation });
    };

    if (defaultUser && conversationType === 'user') {
      CometChat.getConversation(defaultUser.getUid(), 'user')
        .then(openConversation)
        .catch(() => {
          // No conversation exists with this user yet — open the user itself so the composer
          // is ready for a first message.
          if (cancelled) return;
          setSelectedItem(defaultUser);
          setAppState({ type: 'updateSelectedItemUser', payload: defaultUser });
        });
    } else if (defaultGroup && conversationType === 'group') {
      CometChat.getConversation(defaultGroup.getGuid(), 'group')
        .then(openConversation)
        .catch(() => {
          if (cancelled) return;
          setSelectedItem(defaultGroup);
          setAppState({ type: 'updateSelectedItemGroup', payload: defaultGroup });
        });
    } else if (activeTab === 'chats') {
      new CometChat.ConversationsRequestBuilder()
        .setLimit(30)
        // With no sidebar, apps typically show a single chat type, so the list is filtered to match.
        .setConversationType(layout.withSideBar ? '' : conversationType)
        .build()
        .fetchNext()
        .then((conversationList: CometChat.Conversation[]) => {
          if (cancelled || !conversationList?.[0]) return;
          setSelectedItem(conversationList[0]);
        })
        .catch((error: CometChat.CometChatException) => {
          console.error('Conversations list fetching failed with error:', error);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    autoOpenFirstItem,
    defaultUser,
    defaultGroup,
    activeTab,
    layout.chatType,
    layout.withSideBar,
    setAppState,
  ]);

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
    // Restores the stored selection when the tab changes only; following appState too would re-apply
    // it on every selection and fight the handlers that set selectedItem directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onTabClicked = (tabItem: TabItem) => {
    setSidePanel({ visible: false, type: 'user' });
    setAppState({ type: 'updateGoToMessageId', payload: undefined });
    setSelectedCallLog(undefined);
    setShowGlobalSearch(false);
    setShowScopedSearch(false);
    setShowSavedMessages(false);
    setShowPinnedMessages(false);
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
    setShowPinnedMessages(false);

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
          openPublicGroup(
            group,
            openedGroup => {
              setAppState({ type: 'updateSelectedItemGroup', payload: openedGroup });
              setSelectedItem(openedGroup);
            },
            joinedGroup => {
              publish({ type: 'ui:group/member-joined', joinedGroup, joinedUser: loggedInUser });
            }
          );
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
    // `userInfo` / `groupInfo` gate whether the details panel can be opened at all.
    if (messageUser && !deeperUserEngagement.userInfo) return;
    if (messageGroup && !deeperUserEngagement.groupInfo) return;
    // Mutual exclusion: opening details closes thread, scoped search, and the
    // pinned panel — the details panel is suppressed while pins are open, so
    // leaving it open would swallow the click.
    setAppState({ type: 'updateThreadedMessage', payload: undefined });
    setShowScopedSearch(false);
    setShowPinnedMessages(false);
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
      (activeTab === 'chats' && selectedItem && 'getConversationId' in selectedItem) ||
      (activeTab === 'users' && selectedItem instanceof CometChat.User) ||
      (activeTab === 'groups' && selectedItem instanceof CometChat.Group)
    ) {
      return selectedItem;
    }
    return undefined;
  };

  /**
   * Two independent axes decide the sidebar's fate, and they are handled differently on purpose.
   *
   * The mobile axis unmounts: on a narrow viewport with a chat open the list is genuinely not
   * needed, and unmounting avoids maintaining an offscreen conversation list.
   *
   * The `layout.withSideBar` axis only adds a class, keeping the element mounted.
   */
  const showSidebar = (!isMobile || !hasActiveChat) && !(isMobile && showNewChat);

  const sidebarHiddenByConfig = !layout.withSideBar && !isMobile;

  const showMessages = !isMobile || hasActiveChat || showNewChat;

  /**
   * New chat takes over the whole area right of the conversation list.
   *
   * It is a full-surface picker, so leaving the thread panel, scoped search or details panel
   * mounted beside it both crowds it and leaves state from the conversation being navigated away
   * from visible on screen.
   */
  const showSideSurfaces = !showNewChat;

  // --- Global search handlers ---

  const onSearchConversationClick = (event: CometChatSearchConversationClickEvent) => {
    const conversation = event.conversation;
    setAppState({ type: 'updateGoToMessageId', payload: undefined });
    setAppState({ type: 'updateThreadedMessage', payload: undefined });
    setSidePanel({ visible: false, type: 'user' });
    setAppState({ type: 'updateSelectedItem', payload: conversation });
    setSelectedItem(conversation);
  };

  /**
   * Jump to a message from any list surface — search results, Pinned, Saved.
   */
  const navigateToMessage = async (message: CometChat.BaseMessage) => {
    // Caveat: for a group this rebuilds the peer from the receiver object embedded
    // in the message JSON, so `getMembersCount()` reflects whatever that payload
    // carried. The header reads that number directly, so it can render stale.
    const conversation = await CometChat.CometChatHelper.getConversationFromMessage(message);

    if (!conversation) return;

    setAppState({ type: 'updateSelectedItem', payload: conversation });
    setSelectedItem(conversation);
    setSidePanel({ visible: false, type: 'user' });

    const parentMessageId = message.getParentMessageId();
    if (parentMessageId) {
      const parentMsg = await CometChat.getMessageDetails(String(parentMessageId));
      if (parentMsg) {
        // `threadSearchMessage` is what promotes the thread to the full view
        // instead of docking it beside the conversation.
        setAppState({ type: 'updateThreadSearchMessage', payload: message });
        setAppState({ type: 'updateThreadedMessage', payload: parentMsg });
        setAppState({ type: 'updateThreadGoToMessageId', payload: message.getId() });
        setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) });
      }
      return;
    }

    setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
    setAppState({ type: 'updateThreadedMessage', payload: undefined });
    setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) });
  };

  /** Navigate from the Pinned or Saved panel. */
  const goToMessageFromPanel = async (message: CometChat.BaseMessage) => {
    try {
      setShowScopedSearch(false);
      await navigateToMessage(message);
    } catch (error) {
      console.error('Error navigating to message:', error);
    }
  };

  const onSearchMessageClick = async (event: CometChatSearchMessageClickEvent) => {
    try {
      await navigateToMessage(event.message);
    } catch (error) {
      console.error('Error navigating to search result:', error);
    }
  };

  return (
    /* `cometchat-root--mobile` is what App.css keys the single-pane layout off. It has to come
       from this hook rather than a media query: the hook measures the app container, a media
       query measures the viewport, and an embedded app makes those two different numbers. */
    <div className={`cometchat-root${isMobile ? ' cometchat-root--mobile' : ''}`}>
      {/* Kicked/Banned alert modal */}
      <CometChatConfirmDialog.Root
        isOpen={kickedBannedAlert.visible}
        onClose={handleKickedBannedDismiss}
        variant="danger"
        closeOnOutsideClick={false}
      >
        <CometChatConfirmDialog.Icon
          icon={
            <img
              className="cometchat-confirm-dialog__icon-default"
              src={blockIcon}
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              draggable={false}
            />
          }
        />
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
        <div className={`conversations-wrapper${sidebarHiddenByConfig ? ' hide-sidebar' : ''}`}>
          {showSavedMessages && (
            <div className="saved-messages-wrapper">
              <CometChatSavedMessages
                // The list is only reachable while saving is on, but the per-row unsave button
                // would otherwise survive a mid-session toggle.
                hideUnsaveMessageOption={featureProps.messageList.hideUnsaveMessageOption ?? false}
                onClose={() => setShowSavedMessages(false)}
                onItemClick={message => {
                  // Keep the panel open — it behaves like the conversation list,
                  // so selecting a row just loads that chat beside it.
                  void goToMessageFromPanel(message);
                }}
              />
            </div>
          )}
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
              onSavedMessagesClicked={() => {
                // User-level surface: it takes over the whole messages area and
                // collapses the right panel, like the other full-area views.
                setSidePanel({ visible: false, type: 'user' });
                setShowScopedSearch(false);
                setAppState({ type: 'updateThreadedMessage', payload: undefined });
                setShowSavedMessages(true);
              }}
            />
          </div>
          {canSearch && showGlobalSearch && (
            <div className="selector-wrapper-search">
              <CometChatSearch
                {...featureProps.search}
                hideBackButton={false}
                onBack={() => setShowGlobalSearch(false)}
                onConversationClicked={onSearchConversationClick}
                onMessageClicked={(event: CometChatSearchMessageClickEvent) => {
                  void onSearchMessageClick(event);
                }}
              />
            </div>
          )}
          {!showSavedMessages && (
            <CometChatTabs
              onTabClicked={onTabClicked}
              activeTab={activeTab}
              tabNames={{
                chats: getLocalizedString('chats'),
                calls: getLocalizedString('calls'),
                users: getLocalizedString('users'),
                groups: getLocalizedString('groups'),
              }}
            />
          )}
        </div>
      )}

      {showMessages && !(appState.threadSearchMessage && appState.threadedMessage) && (
        <div className="messages-wrapper">
          {showNewChat ? (
            <CometChatNewChatView
              isFullScreen={isMobile}
              onBack={() => setShowNewChat(false)}
              onUserSelected={user => {
                setShowNewChat(false);
                setSidePanel({ visible: false, type: 'user' });
                // Clear any open thread: it belongs to the conversation being navigated away from.
                setAppState({ type: 'updateThreadedMessage', payload: undefined });
                setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
                setShowScopedSearch(false);
                setAppState({ type: 'updateSelectedItemUser', payload: user });
                setAppState({ type: 'updateSelectedItemGroup', payload: undefined });
                setSelectedItem(user);
              }}
              onGroupSelected={group => {
                setShowNewChat(false);
                setSidePanel({ visible: false, type: 'group' });
                // Clear any open thread: it belongs to the conversation being navigated away from.
                setAppState({ type: 'updateThreadedMessage', payload: undefined });
                setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
                setShowScopedSearch(false);
                setAppState({ type: 'updateSelectedItemUser', payload: undefined });
                if (!group.getHasJoined()) {
                  if (group.getType() === 'public') {
                    openPublicGroup(
                      group,
                      openedGroup => {
                        setAppState({ type: 'updateSelectedItemGroup', payload: openedGroup });
                        setSelectedItem(openedGroup);
                      },
                      joinedGroup => {
                        publish({
                          type: 'ui:group/member-joined',
                          joinedGroup,
                          joinedUser: loggedInUser,
                        });
                      }
                    );
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
                setShowPinnedMessages(false);
                setShowScopedSearch(true);
              }}
              onPinnedMessagesClicked={() => {
                setAppState({ type: 'updateThreadedMessage', payload: undefined });
                setSidePanel({ visible: false, type: 'user' });
                setShowScopedSearch(false);
                setShowPinnedMessages(true);
              }}
              onThreadRepliesClick={message => {
                setSidePanel({ visible: false, type: 'user' });
                setShowScopedSearch(false);
                setShowPinnedMessages(false);
                setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
                setAppState({ type: 'updateThreadedMessage', payload: message });
              }}
              goToMessageId={appState.threadSearchMessage ? undefined : appState.goToMessageId}
              showGroupActionMessages={showGroupActionMessages}
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
      {showSideSurfaces && appState.threadedMessage && hasActiveChat && (
        <div
          className={[
            'cometchat-thread-panel-wrapper',
            appState.threadSearchMessage ? 'cometchat-thread-panel-wrapper--threaded' : '',
            isMobile ? 'cometchat-thread-panel-wrapper--fullscreen' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
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
            goToMessageId={
              appState.threadSearchMessage
                ? Number(appState.goToMessageId) || appState.threadGoToMessageId
                : appState.threadGoToMessageId
            }
          />
        </div>
      )}

      {showSideSurfaces && showPinnedMessages && !appState.threadedMessage && hasActiveChat && (
        <div
          className={`side-component-wrapper${isMobile ? ' side-component-wrapper--fullscreen' : ''}`}
        >
          <CometChatPinnedMessages
            user={messageUser}
            group={messageGroup}
            // Same reasoning as the saved-messages panel above.
            hideUnpinMessageOption={featureProps.messageList.hideUnpinMessageOption ?? false}
            onClose={() => setShowPinnedMessages(false)}
            onItemClick={message => {
              // Jump the main list to the pinned message; a thread reply opens
              // its thread full-width, the same as from search. The panel stays
              // open for non-thread jumps.
              void goToMessageFromPanel(message);
            }}
          />
        </div>
      )}

      {canSearch &&
        showSideSurfaces &&
        showScopedSearch &&
        !appState.threadedMessage &&
        hasActiveChat && (
          <div
            className={`side-component-wrapper${isMobile ? ' side-component-wrapper--fullscreen' : ''}`}
          >
            <CometChatSearch
              {...featureProps.search}
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
                        setAppState({
                          type: 'updateThreadGoToMessageId',
                          payload: message.getId(),
                        });
                        setAppState({
                          type: 'updateGoToMessageId',
                          payload: String(message.getId()),
                        });
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

      {showSideSurfaces &&
        sidePanel.visible &&
        !appState.threadedMessage &&
        !showScopedSearch &&
        !showPinnedMessages && (
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
            isFullScreen={isMobile}
          />
        )}

      {canCreateGroup && showCreateGroup && (
        <CometChatCreateGroup
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={group => {
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
          onGroupJoined={joinedGroup => {
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
