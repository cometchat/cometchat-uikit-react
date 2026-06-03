import { useState, useRef, useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatGroupMembers,
  CometChatRadioButton,
  usePublishEvent,
  useLocale,
} from '@cometchat/chat-uikit-react';
import '../../styles/CometChatTransferOwnership/CometChatTransferOwnership.css';

interface CometChatTransferOwnershipProps {
  /** Group to transfer ownership of. */
  group: CometChat.Group;
  /** Called when the panel should close. */
  onClose: () => void;
  /** Called after ownership is successfully transferred. */
  onTransferred?: (group: CometChat.Group, newOwner: CometChat.User) => void;
}

/**
 * CometChatTransferOwnership — panel for transferring group ownership to another member.
 *
 * Displays the group member list with radio buttons + scope labels (excluding the owner).
 * On confirm, calls CometChat.transferGroupOwnership and publishes ui:group/ownership-changed.
 */
export const CometChatTransferOwnership = ({
  group,
  onClose,
  onTransferred,
}: CometChatTransferOwnershipProps) => {
  const publish = usePublishEvent();
  const { getLocalizedString } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const selectedMemberRef = useRef<CometChat.GroupMember | null>(null);

  const handleSelect = useCallback((member: CometChat.GroupMember) => {
    selectedMemberRef.current = member;
    if (isDisabled) setIsDisabled(false);
  }, [isDisabled]);

  const handleTransfer = useCallback(async () => {
    const member = selectedMemberRef.current;
    if (!member) return;

    setIsLoading(true);
    setIsError(false);

    try {
      await CometChat.transferGroupOwnership(group.getGuid(), member.getUid());

      // Update local group reference
      group.setOwner(member.getUid());

      publish({
        type: 'ui:group/ownership-changed',
        group,
        newOwner: member as unknown as CometChat.User,
      });

      onTransferred?.(group, member as unknown as CometChat.User);
      onClose();
    } catch (error) {
      console.error('[CometChatTransferOwnership] transfer error:', error);
      setIsError(true);
      setIsLoading(false);
    }
  }, [group, publish, onClose, onTransferred]);

  const getScopeLabel = (member: CometChat.GroupMember): string => {
    const scope = member.getScope();
    switch (scope) {
      case 'admin':
        return getLocalizedString('group_members_admin') || 'Admin';
      case 'moderator':
        return getLocalizedString('group_members_moderator') || 'Moderator';
      default:
        return getLocalizedString('member_scope_participant') || 'Participant';
    }
  };

  // Custom trailing view: scope label + uncontrolled radio for non-owners, empty for owner
  const trailingView = (member: CometChat.GroupMember) => {
    // Owner row: no radio, no label
    if (group.getOwner() === member.getUid()) {
      return <></>;
    }

    return (
      <div className="cometchat-transfer-ownership__trailing">
        <CometChatRadioButton
          id={`transfer-ownership-${member.getUid()}`}
          name="transfer-ownership"
          value={member.getUid()}
          label={getScopeLabel(member)}
          onChange={() => handleSelect(member)}
          ariaLabel={`Select ${member.getName()} as new owner`}
        />
      </div>
    );
  };

  return (
    <div className="cometchat-transfer-ownership">
      <CometChatGroupMembers
        group={group}
        selectionMode="none"
        trailingView={trailingView}
      />

      <div className="cometchat-transfer-ownership__buttons-wrapper">
        {isError && (
          <div className="cometchat-transfer-ownership__error-view">
            {getLocalizedString('transfer_failed') || 'Transfer failed. Please try again.'}
          </div>
        )}
        <div className="cometchat-transfer-ownership__buttons">
          <button
            type="button"
            className="cometchat-transfer-ownership__cancel-button"
            onClick={onClose}
          >
            {getLocalizedString('cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            className={`cometchat-transfer-ownership__transfer-button ${isDisabled ? 'cometchat-transfer-ownership__transfer-button--disabled' : ''}`}
            disabled={isDisabled || isLoading}
            onClick={() => void handleTransfer()}
          >
            {isLoading
              ? (getLocalizedString('transferring') || 'Transferring...')
              : (getLocalizedString('transfer') || 'Transfer')}
          </button>
        </div>
      </div>
    </div>
  );
};
