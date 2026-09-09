import { useCallback, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { usePublishEvent } from './usePublishEvent';
import { useLocale } from './useLocale';
import { localizeWithFallback } from '../utils/localizeWithFallback';
import { isPermissionError, isLimitError, readLimitFromError } from '../utils/pinSaveUtils';
import { getPinSaveLimits } from '../utils/pinSaveLimits';
import type { PinSaveConfirmAction } from '../components/base/CometChatPinSaveConfirmDialog';

/** The four pin/save actions. */
export type PinSaveAction = 'pin' | 'unpin' | 'save' | 'unsave';

/**
 * The message-level actions that ask before acting — the removing directions only.
 *
 * Narrowed out of `PinSaveConfirmAction`, which also covers `unpin-conversation`:
 * that one belongs to `usePinConversationActions` and can never reach `execute`
 * here. Deriving it keeps the dialog's copy map and this hook in step while making
 * the impossible case a type error rather than a cast.
 */
export type PinSaveConfirmMessageAction = Extract<PinSaveConfirmAction, 'unpin' | 'unsave'>;

/** Actions that ask before acting — the removing directions only. */
const CONFIRMED_ACTIONS = new Set<PinSaveAction>(['unpin', 'unsave']);

const isConfirmedAction = (action: PinSaveAction): action is PinSaveConfirmMessageAction =>
  CONFIRMED_ACTIONS.has(action);

/** The action a confirmation is currently open for, and its target. */
export interface PinSaveConfirmState {
  action: PinSaveConfirmMessageAction;
  message: CometChat.BaseMessage;
}

export interface UsePinSaveActionsOptions {
  /** UID of the logged-in user — recorded as `pinnedBy` on an optimistic pin. */
  loggedInUserUid: string;
  /**
   * Surface a toast. Every surface that hosts these actions must provide one.
   * Failures pass `'error'` so they read as red rather than as confirmation.
   */
  showToast: (text: string, variant?: 'default' | 'error') => void;
}

export interface UsePinSaveActionsReturn {
  /** True while an SDK call is in flight. */
  isBusy: boolean;
  /** Non-null while a confirmation should be shown. */
  confirmState: PinSaveConfirmState | null;
  /** Go ahead with the pending action. */
  confirm: () => void;
  /** Dismiss without acting. */
  cancel: () => void;
  /** Entry points wired into the message options. */
  requestPin: (message: CometChat.BaseMessage) => void;
  requestUnpin: (message: CometChat.BaseMessage) => void;
  requestSave: (message: CometChat.BaseMessage) => void;
  requestUnsave: (message: CometChat.BaseMessage) => void;
}

/** Snapshot of the three pin/save attributes, for revert-on-error. */
interface AttrSnapshot {
  pinnedAt: number | undefined;
  pinnedBy: string | undefined;
  savedAt: number | undefined;
}

function snapshot(message: CometChat.BaseMessage): AttrSnapshot {
  return {
    pinnedAt: message.getPinnedAt(),
    pinnedBy: message.getPinnedBy(),
    savedAt: message.getSavedAt(),
  };
}

/**
 * Apply attributes to a message. Passing `undefined` CLEARS the field rather than
 * zeroing it — the presence of the attribute is what "is pinned"/"is saved" means,
 * so a stale 0 would read as pinned-at-the-epoch.
 */
function applyAttrs(message: CometChat.BaseMessage, attrs: Partial<AttrSnapshot>): void {
  // The SDK setters accept `number | string | null | undefined` and CLEAR the
  // attribute on a nullish value — exactly what unpin/unsave need.
  if ('pinnedAt' in attrs) message.setPinnedAt(attrs.pinnedAt);
  if ('pinnedBy' in attrs) message.setPinnedBy(attrs.pinnedBy);
  if ('savedAt' in attrs) message.setSavedAt(attrs.savedAt);
}

const isPinAction = (action: PinSaveAction): boolean => action === 'pin' || action === 'unpin';

/**
 * usePinSaveActions — the optimistic → SDK → toast → revert-on-error flow shared
 * by every surface that offers pin/save (message list, thread view, and the
 * Pinned/Saved panels).
 *
 * Pin and Save act immediately — they are additive, and the toast acknowledges
 * them. Unpin and Unsave ask first: an unpin removes the message from the pinned
 * list for everyone in the conversation, which is worth a beat.
 *
 */
export function usePinSaveActions(options: UsePinSaveActionsOptions): UsePinSaveActionsReturn {
  const { loggedInUserUid, showToast } = options;
  const publish = usePublishEvent();
  const { getLocalizedString } = useLocale();

  const [isBusy, setIsBusy] = useState(false);
  const [confirmState, setConfirmState] = useState<PinSaveConfirmState | null>(null);
  /**
   * Targets with a call in flight, keyed `messageId:pin|save`.
   */
  const inFlight = useRef(new Set<string>());

  const loc = useCallback(
    (key: string, fallback: string): string =>
      localizeWithFallback(getLocalizedString, key, fallback),
    [getLocalizedString]
  );

  const publishChange = useCallback(
    (action: PinSaveAction, message: CometChat.BaseMessage) => {
      if (isPinAction(action)) {
        publish({ type: 'ui:message/pin-changed', message, pinned: message.isPinned() });
      } else {
        publish({ type: 'ui:message/save-changed', message, saved: message.isSaved() });
      }
    },
    [publish]
  );

  const toastError = useCallback(
    (action: PinSaveAction, error: unknown) => {
      if (isPermissionError(error)) {
        showToast(
          loc('action_permission_denied', "You don't have permission to perform this action."),
          'error'
        );
        return;
      }

      // The cap is server-owned. Show the warmed app-settings value (resolved at init), falling
      // back to the number in the error text when the setting is unknown.
      if (isLimitError(error)) {
        const limits = getPinSaveLimits();
        const cap =
          (isPinAction(action) ? limits.pinnedMessages : limits.savedMessages) ??
          readLimitFromError(error);
        if (cap !== null) {
          const template = isPinAction(action)
            ? loc(
                'pin_limit_reached',
                'You can only pin {limit} messages. Unpin one to pin another.'
              )
            : loc('save_limit_reached', 'You can save up to {limit} messages.');
          showToast(template.replace('{limit}', String(cap)), 'error');
          return;
        }
      }

      showToast(loc('pin_save_generic_error', 'Something went wrong. Please try again.'), 'error');
    },
    [showToast, loc]
  );

  const toastSuccess = useCallback(
    (action: PinSaveAction) => {
      switch (action) {
        case 'pin':
          showToast(loc('toast_message_pinned', 'Message pinned'));
          break;
        case 'unpin':
          showToast(loc('toast_message_unpinned', 'Message unpinned'));
          break;
        case 'save':
          showToast(loc('toast_message_saved', 'Message saved'));
          break;
        case 'unsave':
          showToast(loc('toast_message_unsaved', 'Message unsaved'));
          break;
      }
    },
    [showToast, loc]
  );

  const execute = useCallback(
    async (action: PinSaveAction, message: CometChat.BaseMessage): Promise<void> => {
      const messageId = message.getId();
      const key = `${String(messageId)}:${isPinAction(action) ? 'pin' : 'save'}`;
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);
      setIsBusy(true);

      try {
        const call =
          action === 'pin'
            ? CometChat.pinMessage(messageId)
            : action === 'unpin'
              ? CometChat.unpinMessage(messageId)
              : action === 'save'
                ? CometChat.saveMessage(messageId)
                : CometChat.unsaveMessage(messageId);
        // Typed as non-null, but a defensive widen: an absent payload must not
        // fall into the catch and report failure for a change the server took.
        const updated = (await call) as CometChat.BaseMessage | undefined;

        // Prefer the server's own timestamps — re-pinning rewrites `pinnedBy` to
        // the latest pinner, and only the server knows the real `pinnedAt`. The
        // locally-derived values are the fallback for a response that carries no
        // payload, so a confirmed action still shows up.
        const authoritative = updated ? snapshot(updated) : null;
        const nowInSeconds = Math.floor(Date.now() / 1000);

        // Only the family this action owns. Copying all three would let a save
        // response that carries no pin fields clear a live pin — the same
        // "field omitted vs field cleared" trap `carryPinSaveForward` guards.
        switch (action) {
          case 'pin':
            applyAttrs(message, {
              pinnedAt: authoritative?.pinnedAt ?? nowInSeconds,
              pinnedBy: authoritative?.pinnedBy ?? loggedInUserUid,
            });
            break;
          case 'unpin':
            applyAttrs(message, { pinnedAt: undefined, pinnedBy: undefined });
            break;
          case 'save':
            applyAttrs(message, { savedAt: authoritative?.savedAt ?? nowInSeconds });
            break;
          case 'unsave':
            applyAttrs(message, { savedAt: undefined });
            break;
        }

        // Publish the SERVER's message when there is one. Every listening reducer
        // looks the row up by id and copies the pin/save fields onto whatever
        // object it currently holds, so this reconciles the live state even when a
        // realtime event swapped our `message` out for a clone mid-flight — in
        // which case mutating `message` above wrote to an orphan.
        publishChange(action, updated ?? message);
        toastSuccess(action);
      } catch (error) {
        // Nothing to undo: no surface was told anything happened. The message is
        // exactly as it was before the click.
        toastError(action, error);
      } finally {
        inFlight.current.delete(key);
        // Still busy while any OTHER target is mid-call — the confirm dialog's
        // spinner reflects "a call is running", not "this call is running".
        setIsBusy(inFlight.current.size > 0);
      }
    },
    [loggedInUserUid, publishChange, toastSuccess, toastError]
  );

  const request = useCallback(
    (action: PinSaveAction, message: CometChat.BaseMessage) => {
      if (isConfirmedAction(action)) {
        setConfirmState({ action, message });
        return;
      }
      // Pin and Save act straight away — additive, and the toast acknowledges it.
      void execute(action, message);
    },
    [execute]
  );

  const confirm = useCallback(() => {
    if (!confirmState) return;
    const { action, message } = confirmState;
    void execute(action, message).finally(() => {
      setConfirmState(null);
    });
  }, [confirmState, execute]);

  const cancel = useCallback(() => {
    setConfirmState(null);
  }, []);

  const requestPin = useCallback(
    (m: CometChat.BaseMessage) => {
      request('pin', m);
    },
    [request]
  );
  const requestUnpin = useCallback(
    (m: CometChat.BaseMessage) => {
      request('unpin', m);
    },
    [request]
  );
  const requestSave = useCallback(
    (m: CometChat.BaseMessage) => {
      request('save', m);
    },
    [request]
  );
  const requestUnsave = useCallback(
    (m: CometChat.BaseMessage) => {
      request('unsave', m);
    },
    [request]
  );

  return {
    isBusy,
    confirmState,
    confirm,
    cancel,
    requestPin,
    requestUnpin,
    requestSave,
    requestUnsave,
  };
}
