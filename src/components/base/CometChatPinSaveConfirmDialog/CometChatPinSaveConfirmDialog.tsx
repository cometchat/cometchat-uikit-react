import React from 'react';
import { CometChatConfirmDialog } from '../CometChatConfirmDialog/CometChatConfirmDialog';
import { useLocale } from '../../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../../utils/localizeWithFallback';
import unpinIcon from '../../../assets/unpin.svg';
import unsaveIcon from '../../../assets/unsave.svg';

/**
 * The pin/save actions that ask before acting.
 *
 * Only the removing directions. Pin and Save are additive and self-evident, so
 * they act immediately; the unpins and unsave take something away — unpinning a
 * message removes it for everyone in the conversation — and are worth a beat.
 */
export type PinSaveConfirmAction = 'unpin' | 'unsave' | 'unpin-conversation';

export interface CometChatPinSaveConfirmDialogProps {
  /** Which action is being confirmed. Drives all copy. */
  action: PinSaveConfirmAction;
  onConfirm: () => void;
  onCancel: () => void;
  /** Disables the confirm button while the SDK call is in flight. */
  isBusy?: boolean;
}

/** Icon shown in the dialog's circle, reusing the existing option icons. */
const ICONS: Record<PinSaveConfirmAction, string> = {
  unpin: unpinIcon,
  unsave: unsaveIcon,
  'unpin-conversation': unpinIcon,
};

const COPY: Record<PinSaveConfirmAction, { titleKey: string; bodyKey: string; ctaKey: string }> = {
  unpin: {
    titleKey: 'unpin_message_confirm_title',
    bodyKey: 'unpin_message_confirm_body',
    ctaKey: 'unpin_message_confirm_cta',
  },
  unsave: {
    titleKey: 'unsave_message_confirm_title',
    bodyKey: 'unsave_message_confirm_body',
    ctaKey: 'unsave_message_confirm_cta',
  },
  'unpin-conversation': {
    titleKey: 'unpin_conversation_confirm_title',
    bodyKey: 'unpin_conversation_confirm_body',
    ctaKey: 'unpin_conversation_confirm_cta',
  },
};

const FALLBACKS: Record<PinSaveConfirmAction, { title: string; body: string; cta: string }> = {
  unpin: {
    title: 'Unpin Message',
    body: 'Do you want to unpin this message from this conversation?',
    cta: 'Unpin',
  },
  unsave: {
    title: 'Unsave Message',
    body: 'Do you want to unsave this message?',
    cta: 'Unsave',
  },
  'unpin-conversation': {
    title: 'Unpin Conversation',
    body: 'Do you want to unpin this conversation?',
    cta: 'Unpin',
  },
};

/**
 * Confirmation for unpinning a message or conversation, and for unsaving.
 *
 * Uses the brand-primary confirm button, not the danger variant: neither action
 * destroys anything, and both are undone by pinning or saving again.
 */
export const CometChatPinSaveConfirmDialog: React.FC<CometChatPinSaveConfirmDialogProps> = ({
  action,
  onConfirm,
  onCancel,
  isBusy = false,
}) => {
  const { getLocalizedString } = useLocale();

  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);

  const keys = COPY[action];
  const fallback = FALLBACKS[action];

  return (
    <CometChatConfirmDialog.Root isOpen={true} onClose={onCancel} variant="info">
      <CometChatConfirmDialog.Icon
        icon={
          <img
            className={'cometchat-confirm-dialog__icon-default'}
            src={ICONS[action]}
            alt=""
            aria-hidden="true"
            decoding="async"
            width={36}
            height={36}
            draggable={false}
          />
        }
      />
      <CometChatConfirmDialog.Content
        title={loc(keys.titleKey, fallback.title)}
        messageText={loc(keys.bodyKey, fallback.body)}
      />
      <CometChatConfirmDialog.Actions
        cancelButtonText={loc('cancel', 'Cancel')}
        confirmButtonText={loc(keys.ctaKey, fallback.cta)}
        onConfirm={onConfirm}
        onCancel={onCancel}
        isLoading={isBusy}
      />
    </CometChatConfirmDialog.Root>
  );
};

CometChatPinSaveConfirmDialog.displayName = 'CometChatPinSaveConfirmDialog';
