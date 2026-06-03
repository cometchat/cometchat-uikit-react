import { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatar, usePublishEvent, CometChatUIKitUtility, useLocale } from '@cometchat/chat-uikit-react';
import '../../styles/CometChatDetails/CometChatBannedMembers.css';

interface CometChatBannedMembersProps {
  group: CometChat.Group;
}

export const CometChatBannedMembers = ({ group }: CometChatBannedMembersProps) => {
  const { getLocalizedString } = useLocale();
  const [bannedMembers, setBannedMembers] = useState<CometChat.GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestRef = useRef<any>(null);
  const publish = usePublishEvent();
  const loggedInUserRef = useRef<CometChat.User | null>(null);

  useEffect(() => {
    CometChat.getLoggedinUser().then(user => { loggedInUserRef.current = user; });
  }, []);

  const fetchBannedMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!requestRef.current) {
        requestRef.current = new CometChat.BannedMembersRequestBuilder(group.getGuid())
          .setLimit(30)
          .build();
      }
      const members = await requestRef.current.fetchNext();
      setBannedMembers((prev) => {
        const combined = [...prev, ...members];
        const unique = combined.filter(
          (m, i, arr) => arr.findIndex((m2) => m2.getUid() === m.getUid()) === i
        );
        return unique;
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching banned members:', error);
      setIsLoading(false);
    }
  }, [group]);

  useEffect(() => {
    requestRef.current = null;
    setBannedMembers([]);
    fetchBannedMembers();
  }, [group]);

  const handleUnban = async (member: CometChat.GroupMember) => {
    try {
      await CometChat.unbanGroupMember(group.getGuid(), member.getUid());
      setBannedMembers((prev) => prev.filter((m) => m.getUid() !== member.getUid()));

      // Publish ui:group/member-unbanned with proper action message
      const loggedInUser = loggedInUserRef.current;
      if (loggedInUser) {
        const actionMessage = CometChatUIKitUtility.createActionMessage(
          member,
          'unbanned',
          group,
          loggedInUser
        );
        actionMessage.setMessage(`${loggedInUser.getName()} unbanned ${member.getName()}`);
        publish({
          type: 'ui:group/member-unbanned',
          message: actionMessage,
          user: member as unknown as CometChat.User,
          group: CometChatUIKitUtility.clone(group),
        });
      }
    } catch (error) {
      console.error('Error unbanning member:', error);
    }
  };

  if (isLoading && bannedMembers.length === 0) {
    return (
      <div className="cometchat-banned-members">
        <div className="cometchat-banned-members__loading">{getLocalizedString('loading')}</div>
      </div>
    );
  }

  if (bannedMembers.length === 0) {
    return (
      <div className="cometchat-banned-members">
        <div className="cometchat-banned-members__empty">
          <div className="cometchat-banned-members__empty-icon" />
          <div className="cometchat-banned-members__empty-text">{getLocalizedString('no_banned_members')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cometchat-banned-members">
      {bannedMembers.map((member) => (
        <div key={member.getUid()} className="cometchat-banned-members__item">
          <div className="cometchat-banned-members__item-avatar">
            <CometChatAvatar.Root image={member.getAvatar()} name={member.getName()} size="medium">
              <CometChatAvatar.Image />
              <CometChatAvatar.Initials />
            </CometChatAvatar.Root>
          </div>
          <div className="cometchat-banned-members__item-name">{member.getName()}</div>
          <button
            className="cometchat-banned-members__item-unban"
            onClick={() => handleUnban(member)}
          >
            {getLocalizedString('unban')}
          </button>
        </div>
      ))}
    </div>
  );
};
