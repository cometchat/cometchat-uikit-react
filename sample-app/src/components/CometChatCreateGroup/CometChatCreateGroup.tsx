import { useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useLocale } from '@cometchat/chat-uikit-react';
import './CometChatCreateGroup.css';

interface CometChatCreateGroupProps {
  onClose: () => void;
  onGroupCreated?: (group: CometChat.Group) => void;
}

export const CometChatCreateGroup = ({
  onClose,
  onGroupCreated,
}: CometChatCreateGroupProps) => {
  const { getLocalizedString } = useLocale();
  const [groupType, setGroupType] = useState<string>('public');
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Creates the group.
   *
   * Deliberately not reliant on form submission. This component renders inside the Chat Builder,
   * whose settings panel wraps the whole preview in an antd `<Form>` — so our `<form>` ends up
   * nested inside another one. Nested forms are invalid HTML and browsers disagree about which
   * form a submit button belongs to; when the outer one wins, the click became a native
   * submission and the page reloaded without ever creating the group.
   *
   * The button below is `type="button"` with an onClick, so the click path never involves form
   * submission at all. The `onSubmit` binding stays so that pressing Enter in a field still works
   * in the standalone app, and it calls `preventDefault` defensively.
   */
  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    const guid = `group_${Date.now()}`;
    const group = new CometChat.Group(guid, groupName, groupType, groupPassword);

    try {
      const createdGroup = await CometChat.createGroup(group);
      onGroupCreated?.(createdGroup);
      onClose();
    } catch (error) {
      console.error('Group creation failed:', error);
      setIsCreating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="cometchat-create-group__backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cometchat-create-group-title"
    >
      <form className="cometchat-create-group" onSubmit={handleSubmit}>
        <div
          className="cometchat-create-group__close-button"
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
        <div className="cometchat-create-group__title" id="cometchat-create-group-title">
          {getLocalizedString('sample_new_group')}
        </div>
        <div className="cometchat-create-group__content">
          <div className="cometchat-create-group__type-wrapper">
            <span className="cometchat-create-group__type-text">{getLocalizedString('sample_type')}</span>
            <div className="cometchat-create-group__type-content" role="radiogroup" aria-label="Group type">
              <div
                className={`cometchat-create-group__type ${groupType === 'public' ? 'cometchat-create-group__type--selected' : ''}`}
                onClick={() => setGroupType('public')}
                role="radio"
                aria-checked={groupType === 'public'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setGroupType('public');
                }}
              >
                {getLocalizedString('sample_public')}
              </div>
              <div
                className={`cometchat-create-group__type ${groupType === 'private' ? 'cometchat-create-group__type--selected' : ''}`}
                onClick={() => setGroupType('private')}
                role="radio"
                aria-checked={groupType === 'private'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setGroupType('private');
                }}
              >
                {getLocalizedString('sample_private')}
              </div>
              <div
                className={`cometchat-create-group__type ${groupType === 'password' ? 'cometchat-create-group__type--selected' : ''}`}
                onClick={() => setGroupType('password')}
                role="radio"
                aria-checked={groupType === 'password'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setGroupType('password');
                }}
              >
                {getLocalizedString('sample_password')}
              </div>
            </div>
          </div>

          <div className="cometchat-create-group__name-wrapper">
            <label htmlFor="cometchat-create-group-name">{getLocalizedString('sample_name')}</label>
            <input
              id="cometchat-create-group-name"
              type="text"
              className="cometchat-create-group__input"
              placeholder={getLocalizedString('sample_enter_group_name')}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {groupType === 'password' && (
            <div className="cometchat-create-group__password-wrapper">
              <label htmlFor="cometchat-create-group-password">{getLocalizedString('sample_password')}</label>
              <input
                id="cometchat-create-group-password"
                autoComplete="new-password"
                type="password"
                className="cometchat-create-group__input"
                placeholder={getLocalizedString('sample_enter_group_password')}
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                required
              />
            </div>
          )}
        </div>
        <button
          className="cometchat-create-group__submit-button"
          /* Not `type="submit"` — see handleSubmit. */
          type="button"
          onClick={handleSubmit}
          disabled={isCreating}
        >
          {isCreating ? getLocalizedString('sample_creating') : getLocalizedString('sample_create_group')}
        </button>
      </form>
    </div>
  );
};
