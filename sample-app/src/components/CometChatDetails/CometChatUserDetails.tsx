import { useState, useEffect } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatar, CometChatConfirmDialog, usePublishEvent, useCometChatEvents, useLocale } from '@cometchat/chat-uikit-react';
import type { CometChatEvent } from '@cometchat/chat-uikit-react';
import blockIcon from '../../assets/block.svg';
import deleteIcon from '../../assets/delete.svg';
import './CometChatDetails.css';

interface CometChatUserDetailsProps {
  user: CometChat.User;
  onHide: () => void;
  onUserBlocked?: () => void;
  onUserUnblocked?: () => void;
  onConversationDeleted?: () => void;
}

export const CometChatUserDetails = ({
  user,
  onHide,
  onUserBlocked,
  onUserUnblocked,
  onConversationDeleted,
}: CometChatUserDetailsProps) => {
  const { getLocalizedString } = useLocale();
  const [isBlocked, setIsBlocked] = useState(user.getBlockedByMe?.() ?? false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const publish = usePublishEvent();

  useEffect(() => {
    setIsBlocked(user.getBlockedByMe?.() ?? false);
  }, [user]);

  useCometChatEvents((event: CometChatEvent) => {
    if (event.type === 'ui:user/blocked' && event.user.getUid() === user.getUid()) {
      setIsBlocked(true);
    }
    if (event.type === 'ui:user/unblocked' && event.user.getUid() === user.getUid()) {
      setIsBlocked(false);
    }
  }, [user.getUid()]);

  const handleBlock = async () => {
    try {
      await CometChat.blockUsers([user.getUid()]);
      user.setBlockedByMe(true);
      setIsBlocked(true);
      setShowBlockDialog(false);
      publish({ type: 'ui:user/blocked', user });
      onUserBlocked?.();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleUnblock = async () => {
    try {
      await CometChat.unblockUsers([user.getUid()]);
      user.setBlockedByMe(false);
      setIsBlocked(false);
      publish({ type: 'ui:user/unblocked', user });
      onUserUnblocked?.();
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const handleDeleteConversation = async () => {
    try {
      const conversation = await CometChat.getConversation(user.getUid(), 'user');
      await CometChat.deleteConversation(user.getUid(), 'user');
      publish({ type: 'ui:conversation/deleted', conversation });
      setShowDeleteDialog(false);
      onConversationDeleted?.();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const actionItems = [
    {
      name: isBlocked ? getLocalizedString('user_details_unblock') : getLocalizedString('user_details_block'),
      icon: blockIcon,
      id: 'block_unblock_user',
      type: 'alert' as const,
      onClick: () => {
        if (isBlocked) {
          handleUnblock();
        } else {
          setShowBlockDialog(true);
        }
      },
    },
    {
      name: getLocalizedString('delete_chat'),
      icon: deleteIcon,
      id: 'delete_chat',
      type: 'alert' as const,
      onClick: () => setShowDeleteDialog(true),
    },
  ];

  return (
    <>
      {showBlockDialog && (
        <div className="cometchat-block-user-dialog__backdrop">
          <CometChatConfirmDialog.Root isOpen={true} onClose={() => setShowBlockDialog(false)}>
            <CometChatConfirmDialog.Icon />
            <CometChatConfirmDialog.Content title={getLocalizedString('block_contact')} messageText={getLocalizedString('confirm_block_contact')} />
            <CometChatConfirmDialog.Actions confirmButtonText={getLocalizedString('user_details_block')} onConfirm={handleBlock} onCancel={() => setShowBlockDialog(false)} />
          </CometChatConfirmDialog.Root>
        </div>
      )}
      {showDeleteDialog && (
        <div className="cometchat-delete-chat-dialog__backdrop">
          <CometChatConfirmDialog.Root isOpen={true} onClose={() => setShowDeleteDialog(false)}>
            <CometChatConfirmDialog.Icon />
            <CometChatConfirmDialog.Content title={getLocalizedString('delete_chat')} messageText={getLocalizedString('confirm_delete_chat')} />
            <CometChatConfirmDialog.Actions confirmButtonText={getLocalizedString('delete_chat')} onConfirm={handleDeleteConversation} onCancel={() => setShowDeleteDialog(false)} />
          </CometChatConfirmDialog.Root>
        </div>
      )}

      <div className="side-component-header">
        <div className="side-component-header__text">{getLocalizedString('user_info')}</div>
        <div className="side-component-header__icon" onClick={onHide} />
      </div>
      <div className="side-component-content">
        <div className="side-component-content__group">
          <div className="side-component-content__avatar">
            <CometChatAvatar image={user.getAvatar?.()} name={user.getName()} size="large" />
          </div>
          <div className="side-component-content__title__wrapper">
            <div className="side-component-content__title">{user.getName()}</div>
            {!isBlocked && !user.getHasBlockedMe?.() && (
              <div className="side-component-content__description">
                {user.getStatus?.() === 'online' ? getLocalizedString('call_logs_user_status_online') : getLocalizedString('call_logs_user_status_offline')}
              </div>
            )}
          </div>
        </div>

        <div className="side-component-content__action">
          {actionItems.map((item) => (
            <div
              key={item.id}
              className="side-component-content__action-item"
              onClick={item.onClick}
            >
              <img src={item.icon} alt="" className="side-component-content__action-item-icon" />
              <div className="side-component-content__action-item-text">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
