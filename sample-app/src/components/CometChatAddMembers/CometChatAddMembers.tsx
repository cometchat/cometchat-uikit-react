import { useState, useRef, useCallback, useEffect } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUsers, usePublishEvent, CometChatUIKitUtility, useLocale } from '@cometchat/chat-uikit-react';
import './CometChatAddMembers.css';

interface CometChatAddMembersProps {
  group: CometChat.Group;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const CometChatAddMembers = ({
  group,
  showBackButton = true,
  onBack,
}: CometChatAddMembersProps) => {
  const { getLocalizedString } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [isError, setIsError] = useState(false);
  const [membersCount, setMembersCount] = useState(0);
  const membersToAddRef = useRef<CometChat.GroupMember[]>([]);
  const selectedUsersMapRef = useRef<Map<string, CometChat.User>>(new Map());

  const publish = usePublishEvent();
  const loggedInUserRef = useRef<CometChat.User | null>(null);

  useEffect(() => {
    CometChat.getLoggedinUser().then(user => {
      loggedInUserRef.current = user;
    });
  }, []);

  const createGroupMemberFromUser = useCallback(
    (user: CometChat.User): CometChat.GroupMember => {
      const groupMember = new CometChat.GroupMember(
        user.getUid(),
        CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT as unknown as string
      );
      groupMember.setName(user.getName());
      groupMember.setGuid(group.getGuid());
      groupMember.setAvatar(user.getAvatar());
      groupMember.setStatus(user.getStatus());
      return groupMember;
    },
    [group]
  );

  const handleSelect = useCallback(
    (user: CometChat.User, selected: boolean) => {
      if (selected) {
        selectedUsersMapRef.current.set(user.getUid(), user);
      } else {
        selectedUsersMapRef.current.delete(user.getUid());
      }

      const selectedUsersList = Array.from(selectedUsersMapRef.current.values());
      membersToAddRef.current = selectedUsersList.map((u) => createGroupMemberFromUser(u));

      const count = selectedUsersList.length;
      setMembersCount(count);
      setIsDisabled(count === 0);
    },
    [createGroupMemberFromUser]
  );

  const onAddBtnClick = useCallback(async () => {
    if (membersToAddRef.current.length === 0) return;

    setIsLoading(true);
    setIsError(false);

    const countBeforeAdd = group.getMembersCount();

    try {
      const response = await CometChat.addMembersToGroup(
        group.getGuid(),
        membersToAddRef.current,
        []
      );

      // Determine which members were successfully added
      const addedMembers: CometChat.GroupMember[] = [];
      if (response) {
        for (const member of membersToAddRef.current) {
          if ((response as Record<string, string>)[member.getUid()] === 'success') {
            addedMembers.push(member);
          }
        }
      }

      const loggedInUser = loggedInUserRef.current;
      if (loggedInUser && addedMembers.length > 0) {
        const newCount = countBeforeAdd + addedMembers.length;
        // Update the original group object so all components holding a reference see the correct count
        group.setMembersCount(newCount);

        const groupClone = CometChatUIKitUtility.clone(group);

        const actionMessages = addedMembers.map(addedMember =>
          CometChatUIKitUtility.createActionMessage(
            addedMember,
            'added',
            groupClone,
            loggedInUser
          )
        );

        publish({
          type: 'ui:group/member-added',
          messages: actionMessages,
          group: groupClone,
        });
      }

      setIsLoading(false);
      membersToAddRef.current = [];
      selectedUsersMapRef.current.clear();
      setMembersCount(0);
      setIsDisabled(true);
      onBack?.();
    } catch (error) {
      setIsLoading(false);
      setIsError(true);
      console.error('Error adding members:', error);
    }
  }, [group, onBack, publish]);

  const getButtonText = () => {
    if (membersCount === 0) return getLocalizedString('add_members');
    if (membersCount === 1) return getLocalizedString('add_member');
    return getLocalizedString('add_n_members').replace('{n}', String(membersCount));
  };

  return (
    <div className="cometchat-add-members">
      {showBackButton && (
        <div className="cometchat-add-members__header">
          <button className="cometchat-add-members__back-button" onClick={onBack}>
            ←
          </button>
          <div className="cometchat-add-members__title">{getLocalizedString('add_members')}</div>
        </div>
      )}
      <div className="cometchat-add-members__users-list">
        <CometChatUsers.Root
          selectionMode="multiple"
          onSelect={handleSelect}
        >
          <CometChatUsers.Header />
          <CometChatUsers.SearchBar />
          <CometChatUsers.LoadingState />
          <CometChatUsers.ErrorState />
          <CometChatUsers.EmptyState />
          <CometChatUsers.List />
          <CometChatUsers.SelectedPreview />
        </CometChatUsers.Root>
      </div>
      {isError && (
        <div className="cometchat-add-members__error-view">
          {getLocalizedString('something_went_wrong')}
        </div>
      )}
      <div className={`cometchat-add-members__add-btn-wrapper ${isDisabled ? 'cometchat-add-members__add-btn-wrapper--disabled' : ''}`}>
        <button
          className="cometchat-add-members__add-btn"
          onClick={onAddBtnClick}
          disabled={isDisabled || isLoading}
        >
          {isLoading ? getLocalizedString('adding') : getButtonText()}
        </button>
      </div>
    </div>
  );
};
