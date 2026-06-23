import { useState, useEffect, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatar, CometChatGroupMembers, CometChatConfirmDialog, usePublishEvent, useLocale, useCometChatEvents } from '@cometchat/chat-uikit-react';
import type { CometChatEvent } from '@cometchat/chat-uikit-react';
import { CometChatAddMembers } from '../CometChatAddMembers/CometChatAddMembers';
import { CometChatBannedMembers } from './CometChatBannedMembers';
import { CometChatTransferOwnership } from '../CometChatTransferOwnership/CometChatTransferOwnership';
import addMembersIcon from '../../assets/addMembers.svg';
import deleteIcon from '../../assets/delete.svg';
import leaveGroupIcon from '../../assets/leaveGroup.svg';
import './CometChatDetails.css';

interface CometChatGroupDetailsProps {
  group: CometChat.Group;
  loggedInUser: CometChat.User;
  onHide: () => void;
  onGroupLeft?: () => void;
  onGroupDeleted?: () => void;
  onConversationDeleted?: () => void;
  isFreshChat?: boolean;
}

export const CometChatGroupDetails = ({
  group,
  loggedInUser,
  onHide,
  onGroupLeft,
  onGroupDeleted,
  onConversationDeleted,
  isFreshChat = false,
}: CometChatGroupDetailsProps) => {
  const [memberCount, setMemberCount] = useState(group.getMembersCount());
  const [loggedInUserScope, setLoggedInUserScope] = useState<string | undefined>(group.getScope?.());
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteChatDialog, setShowDeleteChatDialog] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showTransferOwnershipDialog, setShowTransferOwnershipDialog] = useState(false);
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const publish = usePublishEvent();
  const [groupTab, setGroupTab] = useState<'view' | 'banned'>('view');
  const groupListenerRef = useRef('GroupDetails_' + Date.now());
  const { getLocalizedString } = useLocale();

  // Listen to UI events for member changes and active chat / message state
  useCometChatEvents((event: CometChatEvent) => {
    if (event.type === 'ui:group/member-added' && event.group.getGuid() === group.getGuid()) {
      setMemberCount(event.group.getMembersCount());
    }
    if (event.type === 'ui:group/member-kicked' && event.group.getGuid() === group.getGuid()) {
      setMemberCount(event.group.getMembersCount());
    }
    if (event.type === 'ui:group/member-banned' && event.group.getGuid() === group.getGuid()) {
      setMemberCount(event.group.getMembersCount());
    }
    // Handle scope changes — update logged-in user's scope in real-time
    if (event.type === 'ui:group/member-scope-changed' && event.group.getGuid() === group.getGuid()) {
      if (event.user.getUid() === loggedInUser.getUid()) {
        setLoggedInUserScope(event.newScope);
      }
    }
    if (event.type === 'ui:group/ownership-changed' && event.group.getGuid() === group.getGuid()) {
      if (event.newOwner.getUid() === loggedInUser.getUid()) {
        setLoggedInUserScope('owner');
      } else if (loggedInUser.getUid() === event.previousOwnerUid) {
        setLoggedInUserScope('admin');
      }
    }
  }, [group, loggedInUser]);

  const isAdminOrOwner = () => {
    return (
      loggedInUserScope === 'admin' || loggedInUserScope === 'owner' || loggedInUser.getUid() === group.getOwner()
    );
  };

  useEffect(() => {
    setMemberCount(group.getMembersCount());
    setLoggedInUserScope(group.getScope?.());

    CometChat.addGroupListener(
      groupListenerRef.current,
      new CometChat.GroupListener({
        onGroupMemberKicked: () => {
          setMemberCount(prev => Math.max(0, prev - 1));
        },
        onGroupMemberBanned: () => {
          setMemberCount(prev => Math.max(0, prev - 1));
        },
        onMemberAddedToGroup: (_msg: any, _added: any, _by: any, inGroup: CometChat.Group) => {
          // Use the SDK count only if it's greater than current (batch add scenario)
          setMemberCount(prev => {
            const sdkCount = inGroup.getMembersCount();
            return sdkCount > prev ? sdkCount : prev + 1;
          });
        },
        onGroupMemberLeft: () => {
          setMemberCount(prev => Math.max(0, prev - 1));
        },
        onGroupMemberJoined: () => {
          setMemberCount(prev => prev + 1);
        },
        onGroupMemberScopeChanged: (_msg: any, changedUser: CometChat.User, newScope: string) => {
          // If the logged-in user's scope was changed, update permissions in real-time
          if (changedUser.getUid() === loggedInUser.getUid()) {
            setLoggedInUserScope(newScope);
          }
        },
      })
    );

    return () => {
      CometChat.removeGroupListener(groupListenerRef.current);
    };
  }, [group, loggedInUser]);

  const handleLeaveGroup = async () => {
    try {
      await CometChat.leaveGroup(group.getGuid());
      // Mark the group as not joined so re-clicking it triggers a join flow
      group.setHasJoined(false);
      // Decrement member count before publishing so the groups list updates correctly
      group.setMembersCount(group.getMembersCount() - 1);
      publish({ type: 'ui:group/left', group });
      setShowLeaveDialog(false);
      onGroupLeft?.();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await CometChat.deleteGroup(group.getGuid());
      publish({ type: 'ui:group/deleted', group });
      setShowDeleteDialog(false);
      onGroupDeleted?.();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleDeleteConversation = async () => {
    try {
      const conversation = await CometChat.getConversation(group.getGuid(), 'group');
      await CometChat.deleteConversation(group.getGuid(), 'group');
      publish({ type: 'ui:conversation/deleted', conversation });
      setShowDeleteChatDialog(false);
      onConversationDeleted?.();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const actionItems = [
    ...(isAdminOrOwner()
      ? [
          {
            name: getLocalizedString('add_members'),
            icon: addMembersIcon,
            id: 'add_members',
            type: 'default' as const,
            onClick: () => setShowAddMembers(true),
            isAllowed: () => true,
          },
        ]
      : []),
    {
      name: getLocalizedString('delete_chat'),
      icon: deleteIcon,
      id: 'delete_chat',
      type: 'alert' as const,
      onClick: () => { if (!isFreshChat) setShowDeleteChatDialog(true); },
      isAllowed: () => true,
      disabled: isFreshChat,
    },
    {
      name: getLocalizedString('leave'),
      icon: leaveGroupIcon,
      id: 'leave_group',
      type: 'alert' as const,
      onClick: () => {
        // Owner must transfer ownership before leaving
        if (loggedInUser.getUid() === group.getOwner()) {
          setShowTransferOwnershipDialog(true);
        } else {
          setShowLeaveDialog(true);
        }
      },
      isAllowed: () => memberCount > 1 || loggedInUser.getUid() !== group.getOwner(),
    },
    {
      name: getLocalizedString('delete_and_exit'),
      icon: deleteIcon,
      id: 'delete_exit',
      type: 'alert' as const,
      onClick: () => setShowDeleteDialog(true),
      isAllowed: () => isAdminOrOwner(),
    },
  ];

  return (
    <>
      {showLeaveDialog && (
        <div className="cometchat-leave-group__backdrop">
          <CometChatConfirmDialog.Root isOpen={true} onClose={() => setShowLeaveDialog(false)}>
            <CometChatConfirmDialog.Icon />
            <CometChatConfirmDialog.Content title={getLocalizedString('leave_group')} messageText={getLocalizedString('confirm_leave_group')} />
            <CometChatConfirmDialog.Actions confirmButtonText={getLocalizedString('leave')} onConfirm={handleLeaveGroup} onCancel={() => setShowLeaveDialog(false)} />
          </CometChatConfirmDialog.Root>
        </div>
      )}
      {showDeleteDialog && (
        <div className="cometchat-delete-group__backdrop">
          <CometChatConfirmDialog.Root isOpen={true} onClose={() => setShowDeleteDialog(false)}>
            <CometChatConfirmDialog.Icon />
            <CometChatConfirmDialog.Content title={getLocalizedString('delete_and_exit')} messageText={getLocalizedString('confirm_delete_and_exit')} />
            <CometChatConfirmDialog.Actions confirmButtonText={getLocalizedString('delete_and_exit')} onConfirm={handleDeleteGroup} onCancel={() => setShowDeleteDialog(false)} />
          </CometChatConfirmDialog.Root>
        </div>
      )}
      {showDeleteChatDialog && (
        <div className="cometchat-delete-chat-dialog__backdrop">
          <CometChatConfirmDialog.Root isOpen={true} onClose={() => setShowDeleteChatDialog(false)}>
            <CometChatConfirmDialog.Icon />
            <CometChatConfirmDialog.Content title={getLocalizedString('delete_chat')} messageText={getLocalizedString('confirm_delete_chat')} />
            <CometChatConfirmDialog.Actions confirmButtonText={getLocalizedString('delete_chat')} onConfirm={handleDeleteConversation} onCancel={() => setShowDeleteChatDialog(false)} />
          </CometChatConfirmDialog.Root>
        </div>
      )}

      <div className="side-component-header">
        <div className="side-component-header__text">{getLocalizedString('group_info')}</div>
        <div className="side-component-header__icon" onClick={onHide} />
      </div>
      <div className="side-component-content">
        <div className="side-component-content__group">
          <div className="side-component-content__avatar">
            <CometChatAvatar image={group.getIcon?.()} name={group.getName()} size="large" />
          </div>
          <div className="side-component-content__title__wrapper">
            <div className="side-component-content__title">{group.getName()}</div>
            <div className="side-component-content__description">
              {memberCount} {getLocalizedString('members')}
            </div>
          </div>
        </div>

        <div className="side-component-content__action">
          {actionItems
            .filter((item) => item.isAllowed())
            .map((item) => (
              <div
                key={item.id}
                className={`side-component-content__action-item${item.disabled ? ' side-component-content__action-item--disabled' : ''}`}
                onClick={item.onClick}
              >
                <img
                  src={item.icon}
                  alt=""
                  className={item.type === 'alert' ? 'side-component-content__action-item-icon' : 'side-component-content__action-item-icon--default'}
                />
                <div className={item.type === 'alert' ? 'side-component-content__action-item-text' : 'side-component-content__action-item-text--default'}>
                  {item.name}
                </div>
              </div>
            ))}
        </div>

        {isAdminOrOwner() && (
          <div className="side-component-group-tabs-wrapper">
            <div className="side-component-group-tabs">
              <div
                className={`side-component-group-tabs__tab ${groupTab === 'view' ? 'side-component-group-tabs__tab-active' : ''}`}
                onClick={() => setGroupTab('view')}
              >
                <div className={`side-component-group-tabs__tab-text ${groupTab === 'view' ? 'side-component-group-tabs__tab-text-active' : ''}`}>
                  {getLocalizedString('view_members')}
                </div>
              </div>
              <div
                className={`side-component-group-tabs__tab ${groupTab === 'banned' ? 'side-component-group-tabs__tab-active' : ''}`}
                onClick={() => setGroupTab('banned')}
              >
                <div className={`side-component-group-tabs__tab-text ${groupTab === 'banned' ? 'side-component-group-tabs__tab-text-active' : ''}`}>
                  {getLocalizedString('banned_members')}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="side-component-group-members-with-tabs">
          {groupTab === 'view' ? (
            <CometChatGroupMembers group={group} />
          ) : (
            <CometChatBannedMembers group={group} />
          )}
        </div>
      </div>

      {showAddMembers && (
        <div className="cometchat-add-members-overlay">
          <CometChatAddMembers
            group={group}
            showBackButton={true}
            onBack={() => setShowAddMembers(false)}
          />
        </div>
      )}

      {showTransferOwnershipDialog && (
        <div className="cometchat-leave-group__backdrop">
          <CometChatConfirmDialog.Root isOpen={true} onClose={() => setShowTransferOwnershipDialog(false)} variant="info" closeOnOutsideClick={false}>
            <CometChatConfirmDialog.Content
              title={getLocalizedString('ownership_transfer')}
              messageText={getLocalizedString('confirm_ownership_transfer')}
            />
            <CometChatConfirmDialog.Actions
              confirmButtonText={getLocalizedString('continue')}
              onConfirm={() => {
                setShowTransferOwnershipDialog(false);
                setShowTransferOwnership(true);
              }}
              onCancel={() => setShowTransferOwnershipDialog(false)}
            />
          </CometChatConfirmDialog.Root>
        </div>
      )}

      {showTransferOwnership && (
        <div className="cometchat-transfer-ownership__backdrop">
          <CometChatTransferOwnership
            group={group}
            onClose={() => setShowTransferOwnership(false)}
            onTransferred={() => {
              setShowTransferOwnership(false);
            }}
          />
        </div>
      )}
    </>
  );
};
