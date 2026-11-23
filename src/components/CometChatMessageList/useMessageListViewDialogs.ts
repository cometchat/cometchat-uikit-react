import { useCallback, useEffect, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';
import { isOfflineOn, isSdkConnected } from '../../utils/offline/gate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReactTargetState {
  message: CometChat.BaseMessage;
  top: number;
  left: number;
}

export interface UseMessageListViewDialogsOptions {
  loggedInUser: CometChat.User;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /** `false` reports a delete that did not happen; a hook that reports nothing is read as done. */
  deleteMessage: (messageId: number) => Promise<unknown>;
  markMessageAsUnread: (message: CometChat.BaseMessage) => Promise<void>;
  reactToMessage: (messageId: number, emoji: string) => Promise<void>;
  goToMessage: (messageId: number) => Promise<void>;
  getLocalizedString: (key: string) => string;
}

export interface UseMessageListViewDialogsReturn {
  // Toast
  /** Current toast text (empty when hidden) and its visual variant (`error` renders it red). */
  toast: { text: string; variant: 'default' | 'error' };
  showToast: (text: string, variant?: 'default' | 'error') => void;
  hideToast: () => void;
  // Delete
  deleteTarget: CometChat.BaseMessage | null;
  handleDeleteMessage: (message: CometChat.BaseMessage) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  // Flag
  flagTarget: CometChat.BaseMessage | null;
  handleFlagMessage: (message: CometChat.BaseMessage) => void;
  handleFlagClose: () => void;
  handleFlagSubmit: (messageId: string, reasonId: string, remark?: string) => Promise<boolean>;
  // Mark as unread
  handleMarkAsUnread: (message: CometChat.BaseMessage) => void;
  // Emoji picker / reactions
  reactTarget: ReactTargetState | null;
  handleReactToMessage: (message: CometChat.BaseMessage) => void;
  handleReactClose: () => void;
  handleReactionChipClick: (messageId: number, emoji: string) => void;
  // Message info
  messageInfoTarget: CometChat.BaseMessage | null;
  handleMessageInfo: (message: CometChat.BaseMessage) => void;
  handleMessageInfoClose: () => void;
  // Reply preview
  handleReplyPreviewClick: (message: CometChat.BaseMessage) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useMessageListViewDialogs — encapsulates all dialog/overlay state and handlers
 * for the message list view.
 *
 * Handles: delete confirm, flag dialog, emoji picker (with positioning),
 * message info panel, toast, mark-as-unread, reaction chip clicks, reply preview.
 */
export function useMessageListViewDialogs(
  options: UseMessageListViewDialogsOptions
): UseMessageListViewDialogsReturn {
  const {
    loggedInUser,
    scrollContainerRef,
    deleteMessage,
    markMessageAsUnread,
    reactToMessage,
    goToMessage,
    getLocalizedString,
  } = options;

  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  // --- Toast state ---
  const [toast, setToast] = useState<{ text: string; variant: 'default' | 'error' }>({
    text: '',
    variant: 'default',
  });
  const showToast = useCallback((text: string, variant: 'default' | 'error' = 'default') => {
    setToast({ text, variant });
  }, []);
  const hideToast = useCallback(() => {
    setToast({ text: '', variant: 'default' });
  }, []);

  // --- Delete confirm dialog state ---
  const [deleteTarget, setDeleteTarget] = useState<CometChat.BaseMessage | null>(null);
  const handleDeleteMessage = useCallback((message: CometChat.BaseMessage) => {
    setDeleteTarget(message);
  }, []);
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const deleted = await deleteMessage(deleteTarget.getId());
    setDeleteTarget(null);
    // Offline, a delete of an already-sent message is refused and the message stays on
    // screen - no SDK queues one. The toast used to say it had been deleted anyway.
    if (deleted === false) {
      // Name the cause when it is the connection: the same string the message
      // options path already shows for a refused delete, rather than the
      // generic "Looks like something went wrong" (review: delete toast).
      const refusedOffline = isOfflineOn() && !isSdkConnected();
      showToast(
        getLocalizedString(
          refusedOffline ? 'message_list_option_delete_failed' : 'message_list_error_subtitle'
        ),
        'error'
      );
      return;
    }
    showToast(getLocalizedString('message_list_message_deleted'));
  }, [deleteTarget, deleteMessage, getLocalizedString, showToast]);
  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // --- A failed edit ---
  // An edit of an already-sent message is refused offline (no SDK queues one),
  // and the composer leaves edit mode before the request and does not put the
  // text back, as the Android kit does. Nothing told the user the edit had not
  // happened, so the typed text looked like it had been dropped (QA item 3).
  useCometChatEvents(
    event => {
      if (event.type !== 'ui:compose/edit') return;
      if (event.status !== CometChatMessageStatus.error) return;
      showToast(getLocalizedString('message_list_error_subtitle'), 'error');
    },
    [getLocalizedString, showToast]
  );

  // --- Flag dialog state ---
  const [flagTarget, setFlagTarget] = useState<CometChat.BaseMessage | null>(null);
  const handleFlagMessage = useCallback((message: CometChat.BaseMessage) => {
    setFlagTarget(message);
  }, []);
  const handleFlagClose = useCallback(() => {
    setFlagTarget(null);
  }, []);
  const handleFlagSubmit = useCallback(
    async (messageId: string, reasonId: string, remark?: string): Promise<boolean> => {
      try {
        const { CometChat } = await import('@cometchat/chat-sdk-javascript');
        const params: { reasonId: string; remark?: string } = { reasonId };
        if (remark) {
          params.remark = remark;
        }
        await CometChat.flagMessage(messageId, params);
        showToast(getLocalizedString('flag_message_reported'));
        return true;
      } catch {
        return false;
      }
    },
    [getLocalizedString, showToast]
  );

  // --- Mark as unread handler ---
  const handleMarkAsUnread = useCallback(
    (message: CometChat.BaseMessage) => {
      void markMessageAsUnread(message);
    },
    [markMessageAsUnread]
  );

  // --- React to message (emoji picker) state ---
  const [reactTarget, setReactTarget] = useState<ReactTargetState | null>(null);
  const handleReactToMessage = useCallback(
    (message: CometChat.BaseMessage) => {
      const bubbleEl = getCurrentDocument().querySelector(
        `[data-message-id="${String(message.getId())}"]`
      );
      const optionsEl = bubbleEl?.querySelector('[class*="message-bubble__options"]');
      const scrollWrapper = scrollContainerRef.current?.parentElement;

      if (optionsEl && scrollWrapper) {
        const optionsRect = optionsEl.getBoundingClientRect();
        const wrapperRect = scrollWrapper.getBoundingClientRect();
        const isMine = message.getSender().getUid() === loggedInUser.getUid();

        const optionsHeight = optionsRect.height / 2;
        const top = optionsRect.bottom - wrapperRect.top - optionsHeight + 16;

        const KEYBOARD_WIDTH = 320;
        let left: number;

        if (isMine) {
          left = optionsRect.left - wrapperRect.left;
        } else {
          left = optionsRect.left - wrapperRect.left + 8;
        }

        left = Math.max(4, Math.min(left, wrapperRect.width - KEYBOARD_WIDTH - 4));

        const spaceBelow = wrapperRect.bottom - optionsRect.bottom;
        const KEYBOARD_HEIGHT = 375;

        const finalTop =
          spaceBelow < KEYBOARD_HEIGHT
            ? optionsRect.top - wrapperRect.top - KEYBOARD_HEIGHT + optionsHeight - 32
            : top;

        setReactTarget({
          message,
          top: Math.max(4, finalTop),
          left,
        });
      } else {
        setReactTarget({ message, top: 100, left: 50 });
      }
    },
    [loggedInUser, scrollContainerRef, getCurrentDocument]
  );
  const handleReactClose = useCallback(() => {
    setReactTarget(null);
  }, []);

  // --- Reaction chip click (toggle add/remove) ---
  const handleReactionChipClick = useCallback(
    (messageId: number, emoji: string) => {
      void reactToMessage(messageId, emoji);
    },
    [reactToMessage]
  );

  // Close emoji picker on outside click or scroll
  useEffect(() => {
    if (!reactTarget) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const overlay = getCurrentDocument().querySelector('[class*="emoji-picker-overlay"]');
      if (overlay && !overlay.contains(e.target as Node)) {
        setReactTarget(null);
      }
    };

    const handleScroll = () => {
      setReactTarget(null);
    };

    getCurrentDocument().addEventListener('mousedown', handleOutsideClick);
    const scrollEl = scrollContainerRef.current;
    scrollEl?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      getCurrentDocument().removeEventListener('mousedown', handleOutsideClick);
      scrollEl?.removeEventListener('scroll', handleScroll);
    };
  }, [reactTarget, scrollContainerRef, getCurrentDocument]);

  // --- Message info panel state ---
  const [messageInfoTarget, setMessageInfoTarget] = useState<CometChat.BaseMessage | null>(null);
  const handleMessageInfo = useCallback((message: CometChat.BaseMessage) => {
    setMessageInfoTarget(message);
  }, []);
  const handleMessageInfoClose = useCallback(() => {
    setMessageInfoTarget(null);
  }, []);

  // --- Reply preview click (scroll to quoted message) ---
  const handleReplyPreviewClick = useCallback(
    (quotedMessage: CometChat.BaseMessage) => {
      void goToMessage(quotedMessage.getId());
    },
    [goToMessage]
  );

  return {
    toast,
    showToast,
    hideToast,
    deleteTarget,
    handleDeleteMessage,
    handleDeleteConfirm,
    handleDeleteCancel,
    flagTarget,
    handleFlagMessage,
    handleFlagClose,
    handleFlagSubmit,
    handleMarkAsUnread,
    reactTarget,
    handleReactToMessage,
    handleReactClose,
    handleReactionChipClick,
    messageInfoTarget,
    handleMessageInfo,
    handleMessageInfoClose,
    handleReplyPreviewClick,
  };
}
