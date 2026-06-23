import { useState, useEffect, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatar, usePublishEvent, useLocale } from '@cometchat/chat-uikit-react';
import './CometChatJoinGroup.css';

interface CometChatJoinGroupProps {
  group: CometChat.Group;
  loggedInUser: CometChat.User;
  onClose: () => void;
  onGroupJoined?: (group: CometChat.Group) => void;
}

export const CometChatJoinGroup = ({
  group,
  loggedInUser,
  onClose,
  onGroupJoined,
}: CometChatJoinGroupProps) => {
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const publish = usePublishEvent();
  const { getLocalizedString } = useLocale();

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [group]);

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowError(false);
    setPassword(e.target.value);
  };

  const handleJoinGroup = () => {
    if (isJoining || !password) return;

    setIsJoining(true);
    CometChat.joinGroup(group.getGuid(), group.getType() as CometChat.GroupType, password)
      .then((joinedGroup: CometChat.Group) => {
        onGroupJoined?.(joinedGroup);
        onClose();

        setTimeout(() => {
          publish({
            type: 'ui:group/member-joined',
            joinedGroup,
            joinedUser: loggedInUser,
          });
        }, 100);
      })
      .catch((error: unknown) => {
        setShowError(true);
        setIsJoining(false);
        console.error('Failed to join group:', error);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJoinGroup();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="cometchat-join-group__backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cometchat-join-group-title"
    >
      <div className="cometchat-join-group">
        <div className="cometchat-join-group__header">
          <div className="cometchat-join-group__title" id="cometchat-join-group-title">
            {getLocalizedString('group_password')}
          </div>
          <div
            className="cometchat-join-group__close-button"
            onClick={onClose}
            role="button"
            tabIndex={0}
            aria-label="Close"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClose();
              }
            }}
          />
        </div>
        <div className="cometchat-join-group__content">
          <div className="cometchat-join-group__avatar">
            <CometChatAvatar image={group.getIcon()} name={group.getName()} size="large" />
          </div>
          <div className="cometchat-join-group__info">
            <div className="cometchat-join-group__name">
              {group.getName()}
            </div>
            <div className="cometchat-join-group__members">
              {`${group.getMembersCount()} ${getLocalizedString('members')}`}
            </div>
          </div>
        </div>
        <div className="cometchat-join-group__input-wrapper">
          <label className="cometchat-join-group__input-label" htmlFor="cometchat-join-group-password">
            {getLocalizedString('group_password')}
          </label>
          <input
            ref={inputRef}
            id="cometchat-join-group-password"
            type="password"
            autoComplete="current-password"
            className="cometchat-join-group__input"
            placeholder={getLocalizedString('enter_your_password')}
            value={password}
            onChange={onPasswordChange}
            onKeyDown={handleKeyDown}
          />
          {showError && (
            <div className="cometchat-join-group__error" role="alert">
              {getLocalizedString('invalid_password')}
            </div>
          )}
        </div>
        <button
          className="cometchat-join-group__submit-button"
          type="button"
          onClick={handleJoinGroup}
          disabled={isJoining || !password}
        >
          {getLocalizedString('continue')}
        </button>
      </div>
    </div>
  );
};
