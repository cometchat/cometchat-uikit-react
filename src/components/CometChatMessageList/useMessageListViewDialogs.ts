import { useCallback, useEffect, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';

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
  deleteMessage: (messageId: number) => Promise<void>;
  markMessageAsUnread: (message: CometChat.BaseMessage) => Promise<void>;
  reactToMessage: (messageId: number, emoji: string) => Promise<void>;
  goToMessage: (messageId: number) => Promise<void>;
  getLocalizedString: (key: string) => string;
}

export interface UseMessageListViewDialogsReturn {
  // Toast
  toastText: string;
  showToast: (text: string) => void;
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
  const [toastText, setToastText] = useState('');
  const showToast = useCallback((text: string) => {
    setToastText(text);
  }, []);
  const hideToast = useCallback(() => {
    setToastText('');
  }, []);

  // --- Delete confirm dialog state ---
  const [deleteTarget, setDeleteTarget] = useState<CometChat.BaseMessage | null>(null);
  const handleDeleteMessage = useCallback((message: CometChat.BaseMessage) => {
    setDeleteTarget(message);
  }, []);
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMessage(deleteTarget.getId());
    setDeleteTarget(null);
    setToastText(getLocalizedString('message_list_message_deleted'));
  }, [deleteTarget, deleteMessage, getLocalizedString]);
  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

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
        setToastText(getLocalizedString('flag_message_reported'));
        return true;
      } catch {
        return false;
      }
    },
    [getLocalizedString]
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
    toastText,
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
