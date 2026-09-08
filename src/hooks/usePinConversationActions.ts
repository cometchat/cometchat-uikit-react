import { useCallback, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { usePublishEvent } from './usePublishEvent';
import { useLocale } from './useLocale';
import { localizeWithFallback } from '../utils/localizeWithFallback';
import { isPermissionError, isLimitError, readLimitFromError } from '../utils/pinSaveUtils';
import { getPinSaveLimits } from '../utils/pinSaveLimits';
import { isConversationSystemPinned } from '../components/CometChatConversations/CometChatConversations.utils';
import type { PinSaveConfirmAction } from '../components/base/CometChatPinSaveConfirmDialog';

export type PinConversationAction = 'pin' | 'unpin';

/** The conversation pending confirmation, and which action it is for. */
export interface PinConversationConfirmState {
  action: PinSaveConfirmAction;
  conversation: CometChat.Conversation;
}

export interface UsePinConversationActionsOptions {
  /**
   * Surface a toast. Every surface offering these actions must provide one.
   * Failures pass `'error'` so they read as red rather than as confirmation.
   */
  showToast: (text: string, variant?: 'default' | 'error') => void;
}

export interface UsePinConversationActionsReturn {
  /** True while an SDK call is in flight. */
  isBusy: boolean;
  /** Non-null while a confirmation should be shown. */
  confirmState: PinConversationConfirmState | null;
  /** Go ahead with the pending unpin. */
  confirm: () => void;
  /** Dismiss without acting. */
  cancel: () => void;
  requestPin: (conversation: CometChat.Conversation) => void;
  requestUnpin: (conversation: CometChat.Conversation) => void;
}

/** Snapshot for revert-on-error. */
interface PinSnapshot {
  pinnedAt: number | undefined;
  pinnedBy: string | undefined;
}

function snapshot(conversation: CometChat.Conversation): PinSnapshot {
  return {
    pinnedAt: conversation.getPinnedAt(),
    pinnedBy: conversation.getPinnedBy(),
  };
}

/**
 * Apply pin attributes. `undefined` CLEARS the field rather than zeroing it — the
 * presence of `pinnedAt` is what "is pinned" means, so a stale 0 would read as
 * pinned-at-the-epoch.
 */
function applyAttrs(conversation: CometChat.Conversation, attrs: Partial<PinSnapshot>): void {
  // The SDK setters clear the attribute on a nullish value — what unpin needs.
  if ('pinnedAt' in attrs) conversation.setPinnedAt(attrs.pinnedAt);
  if ('pinnedBy' in attrs) conversation.setPinnedBy(attrs.pinnedBy);
}

/**
 * Identity of a conversation for the pin API.
 *
 * `pinConversation` takes the peer's UID or the group's GUID plus a type — not the
 * conversationId the list is keyed on.
 */
function identityOf(conversation: CometChat.Conversation): { with: string; type: string } | null {
  const type = conversation.getConversationType();
  const peer = conversation.getConversationWith() as
    | { getUid?: () => string; getGuid?: () => string }
    | undefined;
  if (!peer) return null;

  const id = type === 'group' ? peer.getGuid?.() : peer.getUid?.();
  return id ? { with: id, type } : null;
}

/**
 * usePinConversationActions — SDK → apply → toast, the same shape as the message
 * pin/save actions.
 *
 * Pin acts immediately and the toast is the acknowledgement. Unpin asks first,
 * matching unpin/unsave on a message: it is the removing direction, and a pinned
 * conversation is a deliberate placement the user should not lose to a stray click.
 *
 * An admin-global pin offers no unpin at all — the server rejects it.
 */
export function usePinConversationActions(
  options: UsePinConversationActionsOptions
): UsePinConversationActionsReturn {
  const { showToast } = options;
  const publish = usePublishEvent();
  const { getLocalizedString } = useLocale();

  const [isBusy, setIsBusy] = useState(false);
  const [confirmState, setConfirmState] = useState<PinConversationConfirmState | null>(null);
  /**
   * Conversation ids with a call in flight.
   *
   * Keyed rather than a single boolean because one hook instance serves the whole
   * list: a plain flag made pinning one conversation swallow a pin on another a
   * moment later, silently. Keying still blocks a double-click on the same row.
   */
  const inFlight = useRef(new Set<string>());

  const loc = useCallback(
    (key: string, fallback: string): string =>
      localizeWithFallback(getLocalizedString, key, fallback),
    [getLocalizedString]
  );

  const toastError = useCallback(
    (action: PinConversationAction, error: unknown) => {
      if (isPermissionError(error)) {
        showToast(
          loc(
            'pin_conversation_permission_denied',
            "You can't unpin a conversation pinned by an admin."
          ),
          'error'
        );
        return;
      }

      // Server-owned cap — show the warmed app-settings value (resolved at init), falling back to
      // the number in the error text when the setting is unknown.
      if (isLimitError(error)) {
        const cap = getPinSaveLimits().pinnedConversations ?? readLimitFromError(error);
        if (cap !== null) {
          showToast(
            loc(
              'pin_conversation_limit_reached',
              'You can only pin {limit} chats. Unpin one to pin another.'
            ).replace('{limit}', String(cap)),
            'error'
          );
          return;
        }
      }

      showToast(loc('pin_save_generic_error', 'Something went wrong. Please try again.'), 'error');
    },
    [showToast, loc]
  );

  const execute = useCallback(
    async (action: PinConversationAction, conversation: CometChat.Conversation): Promise<void> => {
      const key = conversation.getConversationId();
      if (inFlight.current.has(key)) return;

      const identity = identityOf(conversation);
      if (!identity) {
        showToast(
          loc('pin_save_generic_error', 'Something went wrong. Please try again.'),
          'error'
        );
        return;
      }

      inFlight.current.add(key);
      setIsBusy(true);

      try {
        const call =
          action === 'pin'
            ? CometChat.pinConversation(identity.with, identity.type)
            : CometChat.unpinConversation(identity.with, identity.type);
        const updated = (await call) as CometChat.Conversation | undefined;

        // Applied only now that the server has agreed. The server owns the real timestamp and
        // decides whether a global pin outranks this one; the local clock is the
        // fallback for a response that carries no payload.
        const authoritative = updated ? snapshot(updated) : null;
        if (action === 'pin') {
          applyAttrs(conversation, {
            pinnedAt: authoritative?.pinnedAt ?? Math.floor(Date.now() / 1000),
            ...(authoritative?.pinnedBy !== undefined && { pinnedBy: authoritative.pinnedBy }),
          });
        } else {
          applyAttrs(conversation, { pinnedAt: undefined, pinnedBy: undefined });
        }

        publish({
          type: 'ui:conversation/pin-changed',
          conversation,
          pinned: action === 'pin',
        });
        showToast(
          action === 'pin'
            ? loc('toast_conversation_pinned', 'Conversation pinned')
            : loc('toast_conversation_unpinned', 'Conversation unpinned')
        );
      } catch (error) {
        // Nothing to undo: the row was never told anything happened.
        toastError(action, error);
      } finally {
        inFlight.current.delete(key);
        // Still busy while any OTHER row is mid-call.
        setIsBusy(inFlight.current.size > 0);
      }
    },
    [publish, showToast, loc, toastError]
  );

  const requestPin = useCallback(
    (conversation: CometChat.Conversation) => {
      void execute('pin', conversation);
    },
    [execute]
  );

  const requestUnpin = useCallback(
    (conversation: CometChat.Conversation) => {
      // An admin-global pin cannot be removed by a user; the server rejects it.
      // Surfaces hide the affordance, but guard here too so a programmatic call
      // fails loudly with the right message rather than a generic error.
      if (isConversationSystemPinned(conversation)) {
        showToast(
          loc(
            'pin_conversation_permission_denied',
            "You can't unpin a conversation pinned by an admin."
          ),
          'error'
        );
        return;
      }
      // Asks first, matching unpin/unsave on a message. Pinning stays immediate.
      setConfirmState({ action: 'unpin-conversation', conversation });
    },
    [showToast, loc]
  );

  const confirm = useCallback(() => {
    if (!confirmState) return;
    const { conversation } = confirmState;
    void execute('unpin', conversation).finally(() => {
      setConfirmState(null);
    });
  }, [confirmState, execute]);

  const cancel = useCallback(() => {
    setConfirmState(null);
  }, []);

  return { isBusy, confirmState, confirm, cancel, requestPin, requestUnpin };
}
