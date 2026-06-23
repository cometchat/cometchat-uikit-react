import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import * as ComposerManager from './CometChatMessageComposerManager';
import { composerReducer, initialComposerState } from './CometChatMessageComposer.reducer';
import type { CometChatComposerContentToDisplay } from './CometChatMessageComposer.types';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';

const TYPING_TIMEOUT_MS = 500;

export interface CometChatUseCometChatMessageComposerOptions {
  user?: CometChat.User;
  group?: CometChat.Group;
  parentMessageId?: number;
  initialText?: string;
  /** Controlled text value. When provided, the hook syncs its text state to this value. */
  text?: string;
  messageToEdit?: CometChat.TextMessage | null;
  messageToReply?: CometChat.BaseMessage | null;
  disableTypingEvents?: boolean;
  disableSoundForMessage?: boolean;
  customSoundForMessage?: string;
  onSendButtonClick?: (message: CometChat.BaseMessage, mode?: 'send' | 'edit') => void;
  /**
   * Override the internal SDK sendTextMessage call.
   * When provided, this function is called INSTEAD of CometChat.sendMessage().
   * Use this to implement optimistic updates (e.g., via MessageList.sendTextMessage).
   * The function receives the text and returns a muid string.
   */
  sendTextMessageOverride?: (text: string) => string;
  onError?: ((error: CometChat.CometChatException) => void) | null;
  onClosePreview?: () => void;
  onTextChange?: (text: string) => void;
  /** Called when a file attachment is added. */
  onAttachmentAdded?: (file: File) => void;
  /** Called when a file attachment is removed. */
  onAttachmentRemoved?: (file: File) => void;
  /** Called when a mention is selected from the suggestions list. */
  onMentionSelected?: (user: CometChat.User | CometChat.GroupMember) => void;
  /** Get the list of mentioned users in the current message (from mentions hook). */
  getMentionedUsers?: () => { uid: string; name: string }[];
  /** Clear the mentioned users list after send (from mentions hook). */
  clearMentionedUsers?: () => void;
}

/**
 * useCometChatMessageComposer — data hook for the message composer.
 *
 * Manages text state, send/edit operations, typing indicators,
 * and SDK listener lifecycle. Does not render any UI.
 */
export function useCometChatMessageComposer(options: CometChatUseCometChatMessageComposerOptions) {
  const {
    user,
    group,
    parentMessageId,
    initialText,
    text: controlledText,
    messageToEdit,
    messageToReply,
    disableTypingEvents,
    onSendButtonClick,
    sendTextMessageOverride,
    onError,
    onClosePreview,
    onTextChange,
    onAttachmentAdded,
    onAttachmentRemoved,
    onMentionSelected,
    getMentionedUsers,
    clearMentionedUsers,
  } = options;

  const [state, dispatch] = useReducer(composerReducer, {
    ...initialComposerState,
    text: initialText ?? '',
  });

  const instanceId = useId();
  const publish = usePublishEvent();
  const IframeContext = useCometChatFrameContext();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  const getCurrentWindow = useCallback(() => {
    return IframeContext.iframeWindow ?? window;
  }, [IframeContext.iframeWindow]);

  const receiverId = user?.getUid() ?? group?.getGuid() ?? '';
  const receiverType = user ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;

  // --- Reset composer when conversation changes ---
  const prevReceiverIdRef = useRef(receiverId);
  useEffect(() => {
    if (prevReceiverIdRef.current !== receiverId) {
      prevReceiverIdRef.current = receiverId;
      dispatch({ type: 'RESET' });
      clearMentionedUsers?.();
    }
  }, [receiverId, clearMentionedUsers]);

  // --- Sync edit/reply from props ---
  useEffect(() => {
    if (messageToEdit !== undefined) {
      dispatch({ type: 'SET_EDIT_MESSAGE', message: messageToEdit ?? null });
      if (messageToEdit) {
        publish({
          type: 'ui:compose/edit',
          message: messageToEdit,
          status: CometChatMessageStatus.inprogress,
          parentMessageId: parentMessageId ?? null,
        });
      }
    }
  }, [messageToEdit]); // eslint-disable-line react-hooks/exhaustive-deps -- publish and parentMessageId are stable

  useEffect(() => {
    if (messageToReply !== undefined) {
      dispatch({ type: 'SET_REPLY_MESSAGE', message: messageToReply ?? null });
    }
  }, [messageToReply]);

  // Sync controlled text prop
  useEffect(() => {
    if (controlledText !== undefined) {
      dispatch({ type: 'SET_TEXT', text: controlledText });
    }
  }, [controlledText]);

  const handleError = useCallback(
    (error: unknown) => {
      onError?.(error as CometChat.CometChatException);
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', error: message });
    },
    [onError]
  );

  // Safe wrapper for CometChat.isInitialized() — guards against SDK throwing
  // when called in environments where the SDK is not set up (e.g., Storybook).
  const isSdkInitialized = useCallback((): boolean => {
    try {
      return CometChat.isInitialized();
    } catch {
      return false;
    }
  }, []);

  const setText = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_TEXT', text });
      onTextChange?.(text);
    },
    [onTextChange]
  );

  const startTyping = useCallback(() => {
    if (disableTypingEvents || !receiverId) return;
    if (!isSdkInitialized()) return;
    // Check logged-in user synchronously via getLoggedinUser promise
    CometChat.getLoggedinUser()
      .then(u => {
        if (u) ComposerManager.startTypingIndicator(receiverId, receiverType);
      })
      .catch(() => {
        /* ignore — SDK may not be ready */
      });
  }, [disableTypingEvents, isSdkInitialized, receiverId, receiverType]);

  const endTyping = useCallback(() => {
    if (disableTypingEvents || !receiverId) return;
    if (!isSdkInitialized()) return;
    CometChat.getLoggedinUser()
      .then(u => {
        if (u) ComposerManager.endTypingIndicator(receiverId, receiverType);
      })
      .catch(() => {
        /* ignore — SDK may not be ready */
      });
  }, [disableTypingEvents, isSdkInitialized, receiverId, receiverType]);

  useEffect(() => {
    if (state.text.trim().length > 0) {
      startTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        endTyping();
      }, TYPING_TIMEOUT_MS);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      endTyping();
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [state.text, startTyping, endTyping]);

  const sendMessage = useCallback(
    async (textOverride?: string, richTextHtml?: string) => {
      // Guard against double-sends (e.g., Enter key + button click race)
      if (isSendingRef.current) return;
      isSendingRef.current = true;

      // The markdown is what gets stored in message.setText() — the bubble's
      // formatter pipeline converts it back to HTML on render.
      let textToSend = textOverride ?? state.text;
      if (richTextHtml) {
        const { CometChatRichTextFormatter } =
          await import('../../formatters/CometChatRichTextFormatter');
        const formatter = new CometChatRichTextFormatter();
        textToSend = formatter.format(richTextHtml);
      }
      const trimmedText = textToSend.trim();
      if (!trimmedText) {
        isSendingRef.current = false;
        return;
      }

      // Standalone mode: no user/group or SDK not initialized.
      // Still clear text and call onSendButtonClick if provided.
      if (!receiverId || !isSdkInitialized()) {
        if (onSendButtonClick) {
          onSendButtonClick(null as unknown as CometChat.BaseMessage, 'send');
        }
        dispatch({ type: 'SET_TEXT', text: '' });
        dispatch({ type: 'SET_SEND_STATE', sendState: 'idle' });
        isSendingRef.current = false;
        return;
      }

      dispatch({ type: 'SET_SEND_STATE', sendState: 'sending' });
      endTyping();

      // Declared outside try so it's accessible in catch for error attachment
      let textMessage: CometChat.TextMessage | null = null;

      try {
        // If an override is provided, use it for optimistic updates (e.g., MessageList.sendTextMessage)
        // The override handles the SDK call internally and returns immediately with a muid.
        if (sendTextMessageOverride) {
          sendTextMessageOverride(trimmedText);
          dispatch({ type: 'SET_TEXT', text: '' });
          dispatch({ type: 'SET_SEND_STATE', sendState: 'idle' });
          dispatch({ type: 'SET_REPLY_MESSAGE', message: null });
          isSendingRef.current = false;
          return;
        }

        // Build the full message object — same one used for both optimistic display AND SDK call.
        textMessage = new CometChat.TextMessage(receiverId, trimmedText, receiverType);
        const muid = `_${Math.random().toString(36).slice(2, 11)}`;
        textMessage.setMuid(muid);
        textMessage.setSentAt(Math.floor(Date.now() / 1000));
        if (parentMessageId) {
          textMessage.setParentMessageId(parentMessageId);
        }
        // Set sender from logged-in user cache
        try {
          const loggedInUser = await CometChat.getLoggedinUser();
          if (loggedInUser) textMessage.setSender(loggedInUser);
        } catch {
          /* non-fatal */
        }

        // Set quoted message (reply-to) — capture before clearing state
        const replyMessage = state.messageToReply;
        if (replyMessage) {
          (
            textMessage as unknown as { setQuotedMessage: (msg: CometChat.BaseMessage) => void }
          ).setQuotedMessage(replyMessage);
          (
            textMessage as unknown as { setQuotedMessageId: (id: number) => void }
          ).setQuotedMessageId(replyMessage.getId());
        }

        if (getMentionedUsers) {
          const mentioned = getMentionedUsers();
          if (mentioned.length > 0) {
            const userObjects = mentioned.map(
              u => new CometChat.User({ uid: u.uid, name: u.name })
            );
            textMessage.setMentionedUsers(userObjects);
          }
        }

        dispatch({ type: 'SET_TEXT', text: '' });
        dispatch({ type: 'SET_SEND_STATE', sendState: 'idle' });
        dispatch({ type: 'SET_REPLY_MESSAGE', message: null });

        // Publish inprogress so the message list can show it immediately
        publish({
          type: 'ui:message/sent',
          message: textMessage,
          status: CometChatMessageStatus.inprogress,
        });

        // Send the SAME message to the SDK (muid is preserved on the response)
        const confirmedMessage = await (CometChat.sendMessage(
          textMessage
        ) as Promise<CometChat.TextMessage>);

        if (onSendButtonClick) {
          onSendButtonClick(confirmedMessage, 'send');
        }

        publish({
          type: 'ui:message/sent',
          message: confirmedMessage,
          status: CometChatMessageStatus.success,
        });
        if (replyMessage) {
          publish({
            type: 'ui:compose/reply',
            message: confirmedMessage,
            status: CometChatMessageStatus.success,
            parentMessageId: parentMessageId ?? null,
          });
        }
        clearMentionedUsers?.();
        isSendingRef.current = false;
      } catch (error) {
        // Attach error to the message (v6 pattern) so the bubble shows moderation footer
        try {
          if (textMessage) {
            const existingMetadata = textMessage.getMetadata() as Record<string, unknown>;
            textMessage.setMetadata({ ...existingMetadata, error });
          }
        } catch {
          /* non-fatal */
        }
        Object.defineProperty(textMessage, '_ccError', {
          value: error,
          writable: true,
          configurable: true,
        });

        publish({
          type: 'ui:message/sent',
          message: textMessage ?? new CometChat.TextMessage(receiverId, trimmedText, receiverType),
          status: CometChatMessageStatus.error,
        });
        dispatch({ type: 'SET_SEND_STATE', sendState: 'error' });
        handleError(error);
        isSendingRef.current = false;
      }
    },
    [
      state.text,
      state.messageToReply,
      receiverId,
      receiverType,
      parentMessageId,
      sendTextMessageOverride,
      onSendButtonClick,
      endTyping,
      handleError,
      isSdkInitialized,
      publish,
      getMentionedUsers,
      clearMentionedUsers,
    ]
  );

  // --- Send media message ---
  const sendMediaMessage = useCallback(
    async (file: File, fileType: string) => {
      if (!receiverId) return;
      if (!isSdkInitialized()) return;

      // --- File type validation ---
      // If the user selected a specific media type (image, video, audio),
      // validate that the file matches. "file" type accepts anything.
      if (fileType !== 'file') {
        const isHeic =
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        if (!isHeic) {
          const actualFileType = file.type.split('/')[0]; // e.g., "image", "video", "audio"
          if (actualFileType !== fileType) {
            dispatch({
              type: 'SET_VALIDATION_ERROR',
              show: true,
              text: 'message_composer_wrong_file_type',
            });
            return;
          }
        }
      }

      dispatch({ type: 'SET_SEND_STATE', sendState: 'sending' });
      onAttachmentAdded?.(file);

      // Declared outside try so it's accessible in catch for error attachment
      let mediaMessage: CometChat.MediaMessage | null = null;

      try {
        // Build the full message object — same one for both optimistic display AND SDK call
        mediaMessage = new CometChat.MediaMessage(receiverId, file, fileType, receiverType);
        const muid = `_${Math.random().toString(36).slice(2, 11)}`;
        mediaMessage.setMuid(muid);
        mediaMessage.setSentAt(Math.floor(Date.now() / 1000));
        if (parentMessageId) {
          mediaMessage.setParentMessageId(parentMessageId);
        }
        mediaMessage.setMetadata({
          file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
        // Set sender
        try {
          const loggedInUser = await CometChat.getLoggedinUser();
          if (loggedInUser) mediaMessage.setSender(loggedInUser);
        } catch {
          /* non-fatal */
        }

        // Set quoted message (reply-to)
        const replyMessage = state.messageToReply;
        if (replyMessage) {
          (
            mediaMessage as unknown as { setQuotedMessage: (msg: CometChat.BaseMessage) => void }
          ).setQuotedMessage(replyMessage);
          (
            mediaMessage as unknown as { setQuotedMessageId: (id: number) => void }
          ).setQuotedMessageId(replyMessage.getId());
        }

        // Clear composer immediately
        dispatch({ type: 'SET_SEND_STATE', sendState: 'idle' });
        dispatch({ type: 'SET_REPLY_MESSAGE', message: null });

        // Publish inprogress
        publish({
          type: 'ui:message/sent',
          message: mediaMessage,
          status: CometChatMessageStatus.inprogress,
        });

        // Send the SAME message to the SDK
        const confirmedMessage = await (CometChat.sendMediaMessage(
          mediaMessage
        ) as Promise<CometChat.MediaMessage>);

        if (onSendButtonClick) {
          onSendButtonClick(confirmedMessage, 'send');
        }

        publish({
          type: 'ui:message/sent',
          message: confirmedMessage,
          status: CometChatMessageStatus.success,
        });
        if (replyMessage) {
          publish({
            type: 'ui:compose/reply',
            message: confirmedMessage,
            status: CometChatMessageStatus.success,
            parentMessageId: parentMessageId ?? null,
          });
        }
      } catch (error) {
        // Attach error directly to the message (v6 pattern: message.setMetadata({ ...meta, error }))
        try {
          if (mediaMessage) {
            const existingMetadata = mediaMessage.getMetadata() as Record<string, unknown>;
            mediaMessage.setMetadata({ ...existingMetadata, error });
          }
        } catch {
          /* non-fatal */
        }
        Object.defineProperty(mediaMessage, '_ccError', {
          value: error,
          writable: true,
          configurable: true,
        });

        publish({
          type: 'ui:message/sent',
          message:
            mediaMessage ?? new CometChat.MediaMessage(receiverId, file, fileType, receiverType),
          status: CometChatMessageStatus.error,
        });
        onAttachmentRemoved?.(file);
        dispatch({ type: 'SET_SEND_STATE', sendState: 'error' });
        handleError(error);
      }
    },
    [
      state.messageToReply,
      receiverId,
      receiverType,
      parentMessageId,
      onSendButtonClick,
      onAttachmentAdded,
      onAttachmentRemoved,
      handleError,
      isSdkInitialized,
      publish,
    ]
  );

  const editMessage = useCallback(
    async (richTextHtml?: string) => {
      if (!state.textMessageToEdit) return;
      if (!isSdkInitialized()) return;

      let textToSend = state.text;
      if (richTextHtml) {
        const { CometChatRichTextFormatter } =
          await import('../../formatters/CometChatRichTextFormatter');
        const formatter = new CometChatRichTextFormatter();
        textToSend = formatter.format(richTextHtml);
      }
      const trimmedText = textToSend.trim();
      if (!trimmedText) return;

      const messageToEdit = state.textMessageToEdit;

      // Capture mentioned users BEFORE clearing
      const mentionedUsersForSend = getMentionedUsers ? getMentionedUsers() : [];

      if (mentionedUsersForSend.length > 0) {
        const userObjects = mentionedUsersForSend.map(
          u => new CometChat.User({ uid: u.uid, name: u.name })
        );
        messageToEdit.setMentionedUsers(userObjects);
      }

      dispatch({ type: 'SET_TEXT', text: '' });
      dispatch({ type: 'SET_EDIT_MESSAGE', message: null });
      dispatch({ type: 'SET_SEND_STATE', sendState: 'idle' });
      clearMentionedUsers?.();

      try {
        const message = await ComposerManager.editTextMessage(
          messageToEdit.getId(),
          trimmedText,
          mentionedUsersForSend
        );

        if (onSendButtonClick) {
          onSendButtonClick(message, 'edit');
        }

        publish({
          type: 'ui:compose/edit',
          message,
          status: CometChatMessageStatus.success,
          parentMessageId: parentMessageId ?? null,
        });
      } catch (error) {
        publish({
          type: 'ui:compose/edit',
          message: messageToEdit,
          status: CometChatMessageStatus.error,
          parentMessageId: parentMessageId ?? null,
        });
        handleError(error);
      }
    },
    [
      state.textMessageToEdit,
      state.text,
      onSendButtonClick,
      handleError,
      isSdkInitialized,
      publish,
      parentMessageId,
      getMentionedUsers,
      clearMentionedUsers,
    ]
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      setText(state.text + emoji);
      dispatch({ type: 'SET_CONTENT_TO_DISPLAY', content: 'none' });
    },
    [state.text, setText]
  );

  const setContentToDisplay = useCallback((content: CometChatComposerContentToDisplay) => {
    dispatch({ type: 'SET_CONTENT_TO_DISPLAY', content });
  }, []);

  const closePreview = useCallback(() => {
    const editingMessage = state.textMessageToEdit;
    const replyingMessage = state.messageToReply;
    dispatch({ type: 'SET_EDIT_MESSAGE', message: null });
    dispatch({ type: 'SET_REPLY_MESSAGE', message: null });
    if (editingMessage) {
      publish({
        type: 'ui:compose/edit',
        message: editingMessage,
        status: CometChatMessageStatus.cancelled,
        parentMessageId: parentMessageId ?? null,
      });
    }
    if (replyingMessage) {
      publish({
        type: 'ui:compose/reply',
        message: replyingMessage,
        status: CometChatMessageStatus.cancelled,
        parentMessageId: parentMessageId ?? null,
      });
    }
    onClosePreview?.();
  }, [state.textMessageToEdit, state.messageToReply, parentMessageId, publish, onClosePreview]);

  const setRecording = useCallback(
    (isRecording: boolean) => {
      dispatch({ type: 'SET_RECORDING', isRecording });
      // Broadcast recording start so other composer instances stop their recording
      if (isRecording) {
        publish({
          type: 'ui:compose/recording-started',
          composerInstanceId: instanceId,
        });
      }
    },
    [publish, instanceId]
  );

  const setDragging = useCallback((isDragging: boolean) => {
    dispatch({ type: 'SET_DRAGGING', isDragging });
  }, []);

  const dismissValidationError = useCallback(() => {
    dispatch({ type: 'SET_VALIDATION_ERROR', show: false, text: null });
  }, []);

  const setEditDirty = useCallback((isDirty: boolean) => {
    dispatch({ type: 'SET_EDIT_DIRTY', isDirty });
  }, []);

  // --- Derived state ---
  // canSend when text has content OR recording is active.
  // Disabled while a send is in progress.
  // Note: state.text uses ' ' as a sentinel for structural content (lists, blockquotes)
  // that has no visible text yet — still counts as having content.
  // In edit mode, the text must differ from the original message text OR formatting must have changed.
  const isInEditMode = state.textMessageToEdit !== null;
  const canSend =
    (state.text.length > 0 || state.isRecording) &&
    state.sendState !== 'sending' &&
    (!isInEditMode ||
      state.text !== (state.textMessageToEdit?.getText() ?? '') ||
      state.isEditDirty);
  const isInReplyMode = state.messageToReply !== null;
  const showVoiceButton = state.text.length === 0;

  // --- SDK listeners ---
  useEffect(() => {
    if (!isSdkInitialized()) return;

    const listenerId = `CometChatMessageComposer_msg_${instanceId}`;
    const cleanup = ComposerManager.attachMessageListener(listenerId, {
      onMessageEdited: () => {
        // If the message being edited was updated externally, close edit mode
      },
      onMessageDeleted: msg => {
        // If the message being edited/replied to was deleted, close preview
        if (state.textMessageToEdit?.getId() === msg.getId()) {
          dispatch({ type: 'SET_EDIT_MESSAGE', message: null });
        }
        if (state.messageToReply?.getId() === msg.getId()) {
          dispatch({ type: 'SET_REPLY_MESSAGE', message: null });
        }
      },
    });
    return cleanup;
  }, [instanceId, state.textMessageToEdit, state.messageToReply, isSdkInitialized]);

  useEffect(() => {
    if (!isSdkInitialized()) return;

    const listenerId = `CometChatMessageComposer_conn_${instanceId}`;
    const cleanup = ComposerManager.attachConnectionListener(listenerId, () => {
      // Connection restored — clear any error state
      dispatch({ type: 'SET_ERROR', error: null });
    });
    return cleanup;
  }, [instanceId, isSdkInitialized]);

  // --- Subscribe to compose commands (from message list / context menu) ---
  // Thread-scoping: a thread composer (parentMessageId set) only reacts to events
  // that carry a matching parentMessageId. The main composer ignores thread events.
  useCometChatEvents(
    (event: CometChatEvent) => {
      switch (event.type) {
        case 'ui:compose/edit': {
          if (event.status !== CometChatMessageStatus.inprogress) break;
          // Thread-scoping: match parentMessageId (same logic as reply)
          const editEventParentId = event.parentMessageId;
          if (parentMessageId) {
            // Thread composer: only accept events for this thread
            if (!editEventParentId || editEventParentId !== parentMessageId) break;
          } else {
            // Main composer: ignore events from threads
            if (editEventParentId) break;
          }
          const msg = event.message;
          if (msg.getType() === CometChat.MESSAGE_TYPE.TEXT) {
            dispatch({ type: 'SET_EDIT_MESSAGE', message: msg as CometChat.TextMessage });
          }
          break;
        }

        case 'ui:compose/reply': {
          if (event.status !== CometChatMessageStatus.inprogress) break;
          // Thread-scoping: match parentMessageId
          const eventParentId = event.parentMessageId;
          if (parentMessageId) {
            if (!eventParentId || eventParentId !== parentMessageId) break;
          } else {
            if (eventParentId) break;
          }
          dispatch({ type: 'SET_REPLY_MESSAGE', message: event.message });
          break;
        }

        case 'ui:compose/text': {
          setText(event.text);
          // Focus the input with cursor at the end of the text
          requestAnimationFrame(() => {
            const el = inputRef.current;
            if (el) {
              el.focus();
              // Move cursor to end of contentEditable
              const range = getCurrentDocument().createRange();
              const sel = getCurrentWindow().getSelection();
              range.selectNodeContents(el);
              range.collapse(false); // collapse to end
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          });
          break;
        }

        case 'ui:compose/recording-started': {
          // Another composer instance started recording — stop our own recording
          if (event.composerInstanceId !== instanceId && state.isRecording) {
            dispatch({ type: 'SET_RECORDING', isRecording: false });
            dispatch({ type: 'SET_CONTENT_TO_DISPLAY', content: 'none' });
          }
          break;
        }

        default:
          break;
      }
    },
    [parentMessageId, setText, instanceId, state.isRecording]
  );

  return {
    state,
    dispatch,
    canSend,
    isInEditMode,
    isInReplyMode,
    showVoiceButton,
    setText,
    sendMessage,
    sendMediaMessage,
    editMessage,
    insertEmoji,
    setContentToDisplay,
    closePreview,
    setRecording,
    setDragging,
    dismissValidationError,
    setEditDirty,
    startTyping,
    endTyping,
    inputRef,
    onMentionSelected,
  };
}
