import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { CometChatMessageComposerRootProps } from './CometChatMessageComposer.types';
import { CometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { useCometChatMessageComposer } from './useCometChatMessageComposer';
import { CometChatMessageComposerInput } from './CometChatMessageComposerInput';
import { CometChatMessageComposerSendButton } from './CometChatMessageComposerSendButton';
import { CometChatMessageComposerAttachmentButton } from './CometChatMessageComposerAttachmentButton';
import { CometChatMessageComposerEmojiButton } from './CometChatMessageComposerEmojiButton';
import { CometChatMessageComposerVoiceButton } from './CometChatMessageComposerVoiceButton';
import { CometChatMessageComposerStickerButton } from './CometChatMessageComposerStickerButton';
import { CometChatMessageComposerEditPreview } from './CometChatMessageComposerEditPreview';
import { CometChatMessageComposerReplyPreview } from './CometChatMessageComposerReplyPreview';
import { CometChatMessageComposerMentionsList } from './CometChatMessageComposerMentionsList';
import { CometChatMessageComposerTray } from './CometChatMessageComposerTray';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import { CometChatFormattingToolbar } from '../base/CometChatFormattingToolbar/CometChatFormattingToolbar';
import { CometChatLinkDialog } from '../base/CometChatLinkDialog/CometChatLinkDialog';
import { CometChatLinkPopover } from '../base/CometChatLinkPopover/CometChatLinkPopover';
import { CometChatMediaRecorder } from '../base/CometChatMediaRecorder/CometChatMediaRecorder';
import { useCometChatMediaRecorderContext } from '../base/CometChatMediaRecorder/CometChatMediaRecorder.context';
import { CometChatToast } from '../base/CometChatToast/CometChatToast';
import { useRichTextEditor } from '../../utils/RichTextEditor/useRichTextEditor';
import { convertMarkdownToHtml } from '../../utils/RichTextEditor/RichTextEditor';
import { applyListStyles, fixOrderedListContinuation } from '../../utils/RichTextEditor/formats';
import { useCometChatMentions } from './useCometChatMentions';
import { useLocale } from '../../context/locale/LocaleContext';
import sendFillIcon from '../../assets/send_fill.svg';
import uploadIcon from '../../assets/upload-icon.svg';
import './CometChatMessageComposer.css';

/**
 * ComposerValidationError — inline error banner for file validation errors.
 * Auto-dismisses after 4 seconds. Shows localized error text.
 */
const ComposerValidationError: React.FC<{
  textKey: string | null;
  maxCount: number;
  onDismiss: () => void;
}> = ({ textKey, maxCount, onDismiss }) => {
  const { getLocalizedString } = useLocale();

  // Try to use the key as a localization key; fall back to raw text.
  let displayText = textKey ? getLocalizedString(textKey) || textKey : '';
  // The count-exceeded message carries the dynamic per-batch max from settings.
  if (textKey === 'attachment_count_exceeded') {
    displayText = displayText.replace('{count}', String(maxCount));
  }

  if (!displayText) return null;

  // Reuse the shared toast (error/red variant) instead of a bespoke banner.
  return (
    <CometChatToast
      text={displayText}
      variant="error"
      duration={4000}
      showCloseButton={false}
      onClose={onDismiss}
    />
  );
};

/**
 * RecordingSendButton — send button used during voice recording.
 * Calls inlineSend() from the MediaRecorder context to stop recording and submit.
 */
const RecordingSendButton: React.FC = () => {
  const { inlineSend } = useCometChatMediaRecorderContext();
  const { getLocalizedString } = useLocale();
  const btnClass = [
    'cometchat-message-composer__send-button',
    'cometchat-message-composer__send-button--active',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={btnClass}
      onClick={inlineSend}
      aria-label={getLocalizedString('message_composer_send_message_icon_hover')}
    >
      <img
        src={sendFillIcon}
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        draggable={false}
        className={'cometchat-message-composer__send-button-icon'}
      />
    </button>
  );
};

/**
 * CometChatMessageComposer.Root — context provider and root container.
 *
 * Initializes the composer hook, provides context to sub-components.
 * Supports two layout modes: 'compact' (horizontal) and 'multiline' (vertical).
 * When no children are provided, renders the default layout.
 */
export const CometChatMessageComposerRoot: React.FC<CometChatMessageComposerRootProps> = ({
  user,
  group,
  parentMessageId,
  layout = 'compact',
  initialText,
  text: controlledText,
  placeholder: placeholderProp,
  enterKeyBehavior = 'send',
  maxInputHeight = 200,
  enableRichTextEditor = false,
  hideRichTextFormattingOptions = false,
  showBubbleMenuOnSelection = false,
  messageToEdit,
  messageToReply,
  attachmentOptions,
  hideAttachmentOptions,
  showAttachmentPreview = true,
  hideAttachmentButton = false,
  hideEmojiKeyboardButton = false,
  hideVoiceRecordingButton = false,
  hideStickersButton = false,
  hideAIButton = true,
  hideLiveReaction = false,
  hideSendButton = false,
  hideError = false,
  textFormatters,
  disableTypingEvents,
  disableMentions = false,
  disableMentionAll = false,
  mentionAllLabel = 'all',
  mentionsUsersRequestBuilder,
  mentionsGroupMembersRequestBuilder,
  disableSoundForMessage,
  customSoundForMessage,
  enableMultipleAttachments = true,
  disableDragAndDrop = false,
  allowedFileTypes,
  disableAutoFocusOnMobile = true,
  liveReactionIcon,
  attachmentButtonIconView,
  voiceRecordingButtonIconView,
  emojiButtonIconView,
  sendButtonView,
  auxiliaryButtonView,
  headerView,
  showScrollbar = false,
  onTextChange,
  onSendButtonClick,
  sendTextMessageOverride,
  onError,
  onClosePreview,
  onAttachmentAdded,
  onAttachmentRemoved,
  onMentionSelected,
  children,
  className,
}) => {
  // Ref for mentions functions — set after useCometChatMentions is called.
  // The hook reads these at send time (not at initialization).
  const { getLocalizedString: getLocalizedStringComposer } = useLocale();
  const placeholder = placeholderProp ?? getLocalizedStringComposer('message_composer_placeholder');
  const mentionsRef = useRef<{
    getMentionedUsers: () => { uid: string; name: string }[];
    clearMentionedUsers: () => void;
  } | null>(null);

  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  const getCurrentWindow = useCallback(() => {
    return IframeContext.iframeWindow ?? window;
  }, [IframeContext.iframeWindow]);

  const hook = useCometChatMessageComposer({
    ...(user !== undefined && { user }),
    ...(group !== undefined && { group }),
    ...(parentMessageId !== undefined && { parentMessageId }),
    ...(initialText !== undefined && { initialText }),
    ...(controlledText !== undefined && { text: controlledText }),
    ...(messageToEdit !== undefined && { messageToEdit }),
    ...(messageToReply !== undefined && { messageToReply }),
    ...(disableTypingEvents !== undefined && { disableTypingEvents }),
    ...(disableSoundForMessage !== undefined && { disableSoundForMessage }),
    ...(customSoundForMessage !== undefined && { customSoundForMessage }),
    ...(onSendButtonClick !== undefined && { onSendButtonClick }),
    ...(sendTextMessageOverride !== undefined && { sendTextMessageOverride }),
    ...(onError !== undefined && { onError }),
    ...(onClosePreview !== undefined && { onClosePreview }),
    ...(onTextChange !== undefined && { onTextChange }),
    ...(onAttachmentAdded !== undefined && { onAttachmentAdded }),
    ...(onAttachmentRemoved !== undefined && { onAttachmentRemoved }),
    ...(onMentionSelected !== undefined && { onMentionSelected }),
    getMentionedUsers: () => mentionsRef.current?.getMentionedUsers() ?? [],
    clearMentionedUsers: () => mentionsRef.current?.clearMentionedUsers(),
  });

  // Ref to access the rich text editor DOM element for Enter key text sync.
  // This breaks the circular dependency between handleEnterPress and richText.
  const richTextEditorElRef = useRef<HTMLDivElement | null>(null);

  // Ref to the editor's clear() so handleEnterPress can clear immediately without
  // referencing `richText` (which is created after handleEnterPress — same
  // circular dependency the DOM ref above avoids).
  const richTextClearRef = useRef<() => void>(() => {
    /* no-op until richText is created */
  });

  // Ref to store the initial editor HTML when entering edit mode.
  // Used to detect formatting-only changes that don't alter plaintext.
  const editInitialHtmlRef = useRef<string | null>(null);

  // --- Link Dialog state ---
  const [linkDialogState, setLinkDialogState] = React.useState<{
    open: boolean;
    mode: 'add' | 'edit';
    initialText: string;
    initialUrl: string;
    selectedText: string;
  }>({ open: false, mode: 'add', initialText: '', initialUrl: '', selectedText: '' });

  // --- Link Popover state ---
  const [linkPopoverState, setLinkPopoverState] = React.useState<{
    open: boolean;
    url: string;
    text: string;
    position: { top: number; left: number };
  }>({ open: false, url: '', text: '', position: { top: 0, left: 0 } });

  // Saved selection range — captured when link button is clicked, before the
  // dialog opens and steals focus. Restored before inserting the link.
  const savedLinkSelectionRef = useRef<Range | null>(null);

  // Use a ref for the editor link click callback to break the circular dependency
  // (handleEditorLinkClick needs richText, but richText needs handleEditorLinkClick)
  const editorLinkClickRef = useRef<(url: string, text: string, x: number, y: number) => void>(
    () => {
      /* noop until richText is initialized */
    }
  );

  // handleEditorLinkClick must be declared before useRichTextEditor (passed as onLinkClick)
  const handleEditorLinkClick = useCallback((url: string, text: string, x: number, y: number) => {
    editorLinkClickRef.current(url, text, x, y);
  }, []);

  // Rich text editor — managed at Root level so the toolbar and input share the same instance
  const handleEnterPress = useCallback(() => {
    if (hook.isInEditMode) {
      if (!hook.canSend) return; // Don't edit if message hasn't changed
      if (enableRichTextEditor && richTextEditorElRef.current) {
        const currentHtml = richTextEditorElRef.current.innerHTML;
        void hook.editMessage(currentHtml);
      } else {
        void hook.editMessage();
      }
      return;
    }

    // When files are staged, Enter fans out into the batch (with any composer
    // text as the caption) — matching the Send button. This also lets Enter send
    // media with no caption; with an empty composer and no tray, nothing happens.
    const trayHasItems = hook.state.tray.items.length > 0;
    if (trayHasItems) {
      // Mirror the Send button's disabled gating: with a non-empty tray, canSend
      // holds only when every item is `success` and no send is in flight. Block
      // Enter otherwise so a batch can't be sent while items are still
      // uploading/failed/rejected.
      if (!hook.canSend) return;
      if (enableRichTextEditor && richTextEditorElRef.current) {
        const currentHtml = richTextEditorElRef.current.innerHTML;
        void hook.sendBatch(undefined, currentHtml);
        richTextClearRef.current();
      } else {
        void hook.sendBatch();
      }
      return;
    }

    if (enableRichTextEditor && richTextEditorElRef.current) {
      const currentHtml = richTextEditorElRef.current.innerHTML;
      void hook.sendMessage(undefined, currentHtml);
      richTextClearRef.current();
    } else {
      void hook.sendMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only depend on specific hook properties
  }, [
    hook.isInEditMode,
    hook.canSend,
    hook.state.tray.items.length,
    hook.editMessage,
    hook.sendMessage,
    hook.sendBatch,
    enableRichTextEditor,
  ]);

  // Mention callbacks are stored in a ref to break the circular dependency
  // between richText (needs mention callbacks) and mentions (needs richText.insertMention).
  const mentionCallbacksRef = useRef<{
    onStart: (query: string) => void;
    onEnd: () => void;
    onKeyDown: (e: KeyboardEvent) => boolean;
  }>({
    onStart: () => {
      /* noop — replaced by mentionCallbacksRef sync below */
    },
    onEnd: () => {
      /* noop */
    },
    onKeyDown: () => false,
  });

  const richText = useRichTextEditor({
    enabled: enableRichTextEditor,
    placeholder,
    ariaLabel: 'Type a message',
    onUpdate: (html, plainText) => {
      const hasStructuralContent = /<(ol|ul|li|blockquote|pre)[^>]*>/i.test(html);
      hook.setText(hasStructuralContent && plainText.trim() === '' ? ' ' : plainText);
      // Detect formatting changes in edit mode by comparing against the initial editor HTML
      if (hook.isInEditMode && !hook.state.isEditDirty && editInitialHtmlRef.current !== null) {
        if (html !== editInitialHtmlRef.current) {
          hook.setEditDirty(true);
        }
      }
    },
    onLinkClick: handleEditorLinkClick,
    ...(disableMentions && (disableMentionAll || !group)
      ? {}
      : {
          onMentionStart: (query: string) => {
            mentionCallbacksRef.current.onStart(query);
          },
          onMentionEnd: () => {
            mentionCallbacksRef.current.onEnd();
          },
        }),
    onKeyDown: (e: KeyboardEvent) => {
      return mentionCallbacksRef.current.onKeyDown(e);
    },
    // Enter sends message, Shift+Enter inserts newline (when enterKeyBehavior is 'send')
    ...(enterKeyBehavior === 'send' ? { onEnterPress: handleEnterPress } : {}),
  });

  // Keep the richTextEditorElRef in sync with the actual editor ref
  useEffect(() => {
    richTextEditorElRef.current = richText.editorRef.current;
  });

  // Expose the editor's clear() to handleEnterPress (defined before richText).
  richTextClearRef.current = richText.clear;

  // Update the editor link click ref now that richText is available
  // This breaks the circular dependency: handleEditorLinkClick → richText → handleEditorLinkClick
  editorLinkClickRef.current = (url: string, text: string, x: number, y: number) => {
    savedLinkSelectionRef.current = richText.saveSelection();
    // Calculate position relative to the composer container
    // Position popover so its bottom edge sits just above the link
    const composerEl = richText.editorRef.current?.closest('[class*="cometchat-message-composer"]');
    const composerRect = composerEl?.getBoundingClientRect();
    const left = x - (composerRect?.left ?? 0);
    // Use bottom positioning: distance from composer bottom to the link top
    const composerBottom = composerRect?.bottom ?? 0;
    const bottom = composerBottom - y + 24; // gap above the link
    setLinkPopoverState({ open: true, url, text, position: { top: bottom, left: left + 16 } });
  };

  // Clear the rich text editor (and deactivate armed formats) when the
  // conversation changes (user/group prop change).
  const prevUserRef = useRef(user);
  const prevGroupRef = useRef(group);
  useEffect(() => {
    const userChanged = user?.getUid() !== prevUserRef.current?.getUid();
    const groupChanged = group?.getGuid() !== prevGroupRef.current?.getGuid();
    prevUserRef.current = user;
    prevGroupRef.current = group;

    if ((userChanged || groupChanged) && enableRichTextEditor) {
      richText.clear();
      // Re-populate with initialText after clearing
      if (initialText) {
        richText.insertPlainText(initialText);
      }
    }
  }, [user, group, enableRichTextEditor, richText, initialText]);

  // Sync rich text editor with state.text for programmatic changes
  // (e.g., smart reply click, conversation starter click, controlled text prop, initialText).
  const prevTextRef = useRef('');
  useEffect(() => {
    const prevText = prevTextRef.current;
    const currentText = hook.state.text;
    prevTextRef.current = currentText;

    if (!enableRichTextEditor) return;

    // Text cleared (e.g., after send) → clear the editor
    // Skip if we're in edit mode — the edit effect manages the editor content independently
    if (prevText.length > 0 && currentText.length === 0 && !hook.state.textMessageToEdit) {
      richText.clear();
      return;
    }

    // Text set programmatically (e.g., smart reply, compose/text event)
    // Only update the editor if:
    // 1. Text actually changed
    // 2. We're NOT in edit mode (edit mode has its own sync logic below)
    // 3. The editor's current content doesn't already match (avoid loops)
    // 4. The editor doesn't have structural HTML (lists, blockquotes) that would be destroyed
    if (currentText !== prevText && currentText.length > 0 && !hook.state.textMessageToEdit) {
      const editorEl = richText.editorRef.current;
      if (editorEl) {
        // Don't overwrite structural content (lists, blockquotes, code blocks) with plain text
        const hasStructure = editorEl.querySelector('ol, ul, li, blockquote, pre') !== null;
        if (!hasStructure && (editorEl.textContent ?? '') !== currentText) {
          richText.clear();
          richText.insertPlainText(currentText);
          richText.focus('end');
        }
      }
    }
  }, [hook.state.text, hook.state.textMessageToEdit, enableRichTextEditor, richText]);

  // When entering edit mode, populate the rich text editor with the message text.
  // The reducer already sets state.text, but the rich text editor manages its own DOM
  // and doesn't react to state.text changes — we need to explicitly set its content.
  const prevEditMessageRef = useRef(hook.state.textMessageToEdit);
  useEffect(() => {
    const prevEdit = prevEditMessageRef.current;
    const currentEdit = hook.state.textMessageToEdit;
    prevEditMessageRef.current = currentEdit;

    // Act when transitioning INTO edit mode (null → message) OR switching edit targets (message A → message B)
    const isEnteringEdit = !prevEdit && currentEdit;
    const isSwitchingEdit = prevEdit && currentEdit && prevEdit.getId() !== currentEdit.getId();
    if ((isEnteringEdit || isSwitchingEdit) && enableRichTextEditor) {
      const editText =
        currentEdit.getType() === 'text' && 'getText' in currentEdit
          ? currentEdit.getText()
          : (currentEdit as CometChat.MediaMessage).getCaption() || '';
      // Check for rich text HTML metadata
      let htmlContent: string | null = null;
      try {
        const metadata = currentEdit.getMetadata() as Record<string, unknown> | undefined;
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const richTextMeta = metadata?.['richText'] as
          | { html?: string; hasFormatting?: boolean }
          | undefined;
        if (richTextMeta?.html && richTextMeta.hasFormatting) {
          htmlContent = richTextMeta.html;
        }
      } catch {
        // ignore
      }

      // Resolve mentions: replace <@uid:xxx> tokens with styled mention spans
      // Uses the same attributes as insertMention (data-uid, cometchat-mentions class)
      // so that getTextWithMentionFormat and the RichTextFormatter can identify them.
      const resolveMentions = (text: string): string => {
        try {
          const mentionedUsers = currentEdit.getMentionedUsers();

          // Handle SDK mention tokens: <@uid:xxx>
          if (mentionedUsers.length > 0) {
            text = text.replace(/<@uid:(.*?)>/g, (_match: string, uid: string) => {
              const user = mentionedUsers.find(u => u.getUid() === uid);
              const name = user ? user.getName() : uid;
              return `<span contenteditable="false" class="cometchat-mention cometchat-mentions cometchat-mentions-other" data-uid="${uid}" data-mention-type="other">@${name}</span>`;
            });
          }
          // Handle @all/channel mentions: <@all:label>
          text = text.replace(/<@all:(.*?)>/g, (_match: string, label: string) => {
            return `<span contenteditable="false" class="cometchat-mention cometchat-mention--self cometchat-mentions cometchat-mentions-you" data-uid="all" data-mention-type="channel">@${label}</span>`;
          });

          // Fallback: if no SDK tokens were found but mentionedUsers exist,
          // match plain @name patterns against the mentioned users list.
          if (mentionedUsers.length > 0 && !text.includes('data-uid=')) {
            for (const user of mentionedUsers) {
              const name = user.getName();
              const uid = user.getUid();
              // Escape regex special chars in the name
              const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const nameRegex = new RegExp(`@${escapedName}(?!\\w)`, 'g');
              text = text.replace(
                nameRegex,
                `<span contenteditable="false" class="cometchat-mention cometchat-mentions cometchat-mentions-other" data-uid="${uid}" data-mention-type="other">@${name}</span>`
              );
            }
          }

          // Fallback for @all when it appears as plain text (not SDK token)
          if (!text.includes('data-uid="all"') && /(?<!\w)@all(?!\w)/.test(text)) {
            text = text.replace(
              /(?<!\w)@all(?!\w)/g,
              '<span contenteditable="false" class="cometchat-mention cometchat-mention--self cometchat-mentions cometchat-mentions-you" data-uid="all" data-mention-type="channel">@all</span>'
            );
          }
        } catch {
          /* ignore */
        }
        return text;
      };

      if (htmlContent && richText.editorRef.current) {
        // Set rich text HTML directly on the editor DOM (mentions already resolved in HTML)
        // But still resolve mentions if present in the HTML
        const resolvedHtml = resolveMentions(htmlContent);
        richText.editorRef.current.innerHTML = resolvedHtml;
      } else if (editText) {
        // No rich text metadata — convert markdown to HTML for the rich text editor.
        // Protect SDK mention tags from being processed by markdown conversion.
        const sdkMentionRegex = /<@(uid|all):[^>]*>/g;
        const mentionPlaceholders: string[] = [];
        const textWithPlaceholders = editText.replace(sdkMentionRegex, (match: string) => {
          const idx = mentionPlaceholders.length;
          mentionPlaceholders.push(match);
          return `\x00SDKMENTION${String(idx)}\x00`;
        });

        // Convert markdown syntax to HTML (bold, italic, underline, strikethrough, code, lists, blockquotes)
        let formattedHtml = convertMarkdownToHtml(textWithPlaceholders);

        // Restore SDK mention placeholders

        formattedHtml = formattedHtml.replace(
          // eslint-disable-next-line no-control-regex
          /\x00SDKMENTION(\d+)\x00/g,
          (_: string, idx: string) => {
            return mentionPlaceholders[parseInt(idx, 10)] ?? '';
          }
        );

        // Resolve mentions to styled spans
        const resolvedHtml = resolveMentions(formattedHtml);
        if (richText.editorRef.current) {
          richText.editorRef.current.innerHTML = resolvedHtml;
        }
      }
      // Focus the editor at the end
      // Capture the initial editor HTML for dirty-detection (formatting-only changes)
      // Must be captured BEFORE focus to avoid race with onUpdate callback.
      if (richText.editorRef.current) {
        // Apply list styles to ensure nested lists show correct markers (a. i. etc.)
        applyListStyles(richText.editorRef.current);
        fixOrderedListContinuation(richText.editorRef.current);
        editInitialHtmlRef.current = richText.editorRef.current.innerHTML;
      }
      richText.focus('end');
    }
    // When exiting edit mode, clear the editor
    if (prevEdit && !currentEdit && enableRichTextEditor) {
      richText.clear();
      editInitialHtmlRef.current = null;
    }
  }, [hook.state.textMessageToEdit, enableRichTextEditor, richText]);

  // --- Mentions ---
  // Save editor selection when mention popup opens so we can restore it
  const mentionSavedRangeRef = useRef<Range | null>(null);

  const handleInsertMention = useCallback(
    (uid: string, label: string, charsToDelete: number, isSelf?: boolean) => {
      if (enableRichTextEditor) {
        // Restore the saved selection (cursor position at @) before inserting
        if (mentionSavedRangeRef.current) {
          richText.restoreSelection(mentionSavedRangeRef.current);
          mentionSavedRangeRef.current = null;
        }
        richText.insertMention(uid, label, charsToDelete, isSelf);
      }
    },
    [enableRichTextEditor, richText]
  );

  const mentions = useCometChatMentions({
    disableMentions,
    disableMentionAll,
    mentionAllLabel,
    ...(group ? { group } : {}),
    ...(user ? { user } : {}),
    ...(mentionsUsersRequestBuilder !== undefined && {
      usersRequestBuilder: mentionsUsersRequestBuilder,
    }),
    ...(mentionsGroupMembersRequestBuilder !== undefined && {
      groupMembersRequestBuilder: mentionsGroupMembersRequestBuilder,
    }),
    onInsertMention: handleInsertMention,
    ...(hook.onMentionSelected !== undefined && { onMentionSelected: hook.onMentionSelected }),
  });

  // Set the mentions ref so the hook's sendMessage can access getMentionedUsers/clearMentionedUsers
  mentionsRef.current = {
    getMentionedUsers: mentions.getMentionedUsers,
    clearMentionedUsers: mentions.clearMentionedUsers,
  };

  // Seed the mentions hook with existing mentioned users when entering edit mode,
  // so they're preserved when the edited message is sent.
  const prevEditForMentionsRef = useRef(hook.state.textMessageToEdit);
  useEffect(() => {
    const prevEdit = prevEditForMentionsRef.current;
    const currentEdit = hook.state.textMessageToEdit;
    prevEditForMentionsRef.current = currentEdit;

    if (!prevEdit && currentEdit) {
      try {
        const existingMentionedUsers = currentEdit.getMentionedUsers();
        if (existingMentionedUsers.length > 0) {
          mentions.seedMentionedUsers(
            existingMentionedUsers.map(u => ({ uid: u.getUid(), name: u.getName() }))
          );
        }
      } catch {
        /* ignore */
      }
    } else if (prevEdit && !currentEdit) {
      mentions.clearMentionedUsers();
    }
  }, [hook.state.textMessageToEdit, mentions]);

  // Sync mention callbacks ref (breaks circular dep between richText and mentions)
  mentionCallbacksRef.current = {
    onStart: (query: string) => {
      // Save the cursor position so we can restore it on mention selection
      // even if the user clicks outside the editor while the popup is open.
      if (enableRichTextEditor) {
        mentionSavedRangeRef.current = richText.saveSelection();
      }
      mentions.handleMentionStart(query);
    },
    onEnd: () => {
      mentionSavedRangeRef.current = null;
      mentions.handleMentionEnd();
    },
    onKeyDown: mentions.handleKeyDown,
  };

  // Wrap insertEmoji so it uses the rich text editor's insertText when enabled.
  // The hook's insertEmoji only appends to plain text state — the rich text
  // editor ignores state-driven text changes (it owns the DOM directly).
  const handleInsertEmoji = useCallback(
    (emoji: string) => {
      if (enableRichTextEditor) {
        // Use insertPlainText so emoji doesn't inherit bold/italic/etc formatting
        richText.insertPlainText(emoji);
        // Explicitly sync text state after emoji insertion so canSend updates immediately
        if (richText.editorRef.current) {
          hook.setText(richText.editorRef.current.textContent ?? '');
        }
        // Close emoji keyboard
        hook.setContentToDisplay('none');
      } else {
        // Plain text mode: insert at cursor position in the contentEditable div
        const el = hook.inputRef.current;
        if (el) {
          // Get current selection/cursor position
          const selection = getCurrentWindow().getSelection();
          const range = selection?.getRangeAt(0);

          if (range && el.contains(range.startContainer)) {
            // Insert emoji at cursor position
            range.deleteContents();
            const textNode = getCurrentDocument().createTextNode(emoji);
            range.insertNode(textNode);
            // Move cursor after the inserted emoji
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection?.removeAllRanges();
            selection?.addRange(range);
          } else {
            // No cursor in input — append to end
            el.textContent = (el.textContent ?? '') + emoji;
            // Move cursor to end
            const newRange = getCurrentDocument().createRange();
            newRange.selectNodeContents(el);
            newRange.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          }

          // Update text state from the DOM
          hook.setText(el.textContent ?? '');
          // Close emoji keyboard
          hook.setContentToDisplay('none');
          // Focus back on input
          el.focus();
        } else {
          // Fallback: append
          hook.insertEmoji(emoji);
        }
      }
    },
    [enableRichTextEditor, richText, hook, getCurrentDocument, getCurrentWindow]
  );

  const handleLinkClick = useCallback(() => {
    // Save the current selection BEFORE the dialog opens and steals focus.
    // This is critical — without this, the selection is lost when the dialog
    // receives focus and setLink() has no range to insert into.
    const savedRange = richText.saveSelection();

    // Only keep the saved selection if it's inside the composer editor.
    // Text selected elsewhere (message list, conversation list, etc.) must not prefill the dialog
    // and must not be used as the insertion point for the link.
    const editorEl = richText.editorRef.current;
    let selectedText = '';
    if (
      editorEl &&
      savedRange &&
      editorEl.contains(savedRange.startContainer) &&
      editorEl.contains(savedRange.endContainer)
    ) {
      savedLinkSelectionRef.current = savedRange;
      selectedText = savedRange.toString();
    } else {
      savedLinkSelectionRef.current = null;
    }

    const currentUrl = richText.getCurrentLink();
    const currentText = richText.getCurrentLinkText();

    if (currentUrl) {
      setLinkDialogState({
        open: true,
        mode: 'edit',
        initialText: currentText ?? '',
        initialUrl: currentUrl,
        selectedText: '',
      });
    } else {
      setLinkDialogState({
        open: true,
        mode: 'add',
        initialText: '',
        initialUrl: '',
        selectedText,
      });
    }
  }, [richText]);

  const handleLinkDialogSave = useCallback(
    ({ text, url }: { text: string; url: string }) => {
      setLinkDialogState(s => ({ ...s, open: false }));

      // Restore the saved selection so setLink() inserts at the correct position.
      if (savedLinkSelectionRef.current) {
        richText.restoreSelection(savedLinkSelectionRef.current);
        savedLinkSelectionRef.current = null;
      } else {
        // No valid composer selection was saved (e.g., text was selected outside the composer).
        // Focus the editor at the end so setLink() has a valid insertion point.
        richText.focus('end');
      }

      richText.setLink(url, text);
    },
    [richText]
  );

  const handleLinkDialogCancel = useCallback(() => {
    setLinkDialogState(s => ({ ...s, open: false }));
    savedLinkSelectionRef.current = null;
  }, []);

  const handleLinkPopoverEdit = useCallback(({ url, text }: { url: string; text: string }) => {
    setLinkPopoverState(s => ({ ...s, open: false }));
    // The selection was already saved when the link was clicked (editorLinkClickRef).
    // savedLinkSelectionRef.current already holds the correct range inside the anchor.
    // Don't overwrite it here — just open the dialog.
    setLinkDialogState({
      open: true,
      mode: 'edit',
      initialText: text,
      initialUrl: url,
      selectedText: '',
    });
  }, []);

  const handleLinkPopoverRemove = useCallback(() => {
    setLinkPopoverState(s => ({ ...s, open: false }));
    // Restore the saved selection so unlink operates on the correct anchor element
    if (savedLinkSelectionRef.current) {
      richText.restoreSelection(savedLinkSelectionRef.current);
      savedLinkSelectionRef.current = null;
    }
    richText.setLink(null);
  }, [richText]);

  const handleLinkPopoverClose = useCallback(() => {
    setLinkPopoverState(s => ({ ...s, open: false }));
  }, []);

  // Wrap sendMessage so it reads from the rich text editor DOM when enabled.
  // The send button and Enter key both use this — ensures text is always fresh.
  // In rich text mode, passes raw HTML to the hook which converts it to markdown
  const handleSendMessage = useCallback(
    (textOverride?: string) => {
      // When files are staged in the tray, a send fans out into the batch
      // (one MediaMessage per media type sharing a batchId). The composer text,
      // if any, rides along as the caption on the last message of the batch.
      const trayHasItems = hook.state.tray.items.length > 0;

      let sendPromise: Promise<void>;
      if (trayHasItems) {
        if (textOverride !== undefined) {
          sendPromise = hook.sendBatch(textOverride);
        } else if (enableRichTextEditor && richTextEditorElRef.current) {
          sendPromise = hook.sendBatch(undefined, richTextEditorElRef.current.innerHTML);
        } else {
          sendPromise = hook.sendBatch();
        }
      } else if (textOverride !== undefined) {
        sendPromise = hook.sendMessage(textOverride);
      } else if (enableRichTextEditor && richTextEditorElRef.current) {
        const currentHtml = richTextEditorElRef.current.innerHTML;
        sendPromise = hook.sendMessage(undefined, currentHtml);
      } else {
        sendPromise = hook.sendMessage();
      }
      // Clear the rich text editor immediately (not after the send resolves) so
      // the composer feels instant. The HTML was already captured above.
      if (enableRichTextEditor) {
        richText.clear();
      }
      return sendPromise;
    },
    [enableRichTextEditor, hook, richText]
  );

  const contextValue = useMemo(
    () => ({
      // State
      text: hook.state.text,
      textMessageToEdit: hook.state.textMessageToEdit,
      messageToReply: hook.state.messageToReply,
      contentToDisplay: hook.state.contentToDisplay,
      sendState: hook.state.sendState,
      isRecording: hook.state.isRecording,
      isDraggingOver: hook.state.isDraggingOver,
      error: hook.state.error,

      // Validation error
      showValidationError: hook.state.showValidationError,
      validationErrorText: hook.state.validationErrorText,

      // Derived
      canSend: hook.canSend,
      isInEditMode: hook.isInEditMode,
      isInReplyMode: hook.isInReplyMode,
      showVoiceButton: hook.showVoiceButton,
      layout,

      // Actions
      setText: hook.setText,
      sendMessage: handleSendMessage,
      sendMediaMessage: hook.sendMediaMessage,
      editMessage: () => {
        if (enableRichTextEditor && richTextEditorElRef.current) {
          const currentHtml = richTextEditorElRef.current.innerHTML;
          return hook.editMessage(currentHtml);
        }
        return hook.editMessage();
      },
      insertEmoji: handleInsertEmoji,
      setContentToDisplay: hook.setContentToDisplay,
      closePreview: hook.closePreview,
      setRecording: hook.setRecording,
      setDragging: hook.setDragging,
      dismissValidationError: hook.dismissValidationError,
      startTyping: hook.startTyping,
      endTyping: hook.endTyping,

      // Multi-attachment tray + upload manager
      tray: hook.state.tray,
      stageAttachments: hook.mediaUploadManager.startUpload,
      removeAttachment: hook.mediaUploadManager.removeItem,
      retryAttachment: hook.mediaUploadManager.retryItem,
      clearAttachments: hook.mediaUploadManager.clear,
      attachmentsSendable: hook.mediaUploadManager.sendable,
      maxAttachmentCount: hook.mediaUploadManager.maxAttachmentCount,

      // Refs
      inputRef: hook.inputRef,
      richTextEditorRef: richText.editorRef,

      // Config
      ...(user !== undefined && { user }),
      ...(group !== undefined && { group }),
      ...(parentMessageId !== undefined && { parentMessageId }),
      placeholder,
      enterKeyBehavior,
      maxInputHeight,
      enableRichTextEditor,
      hideRichTextFormattingOptions,
      showBubbleMenuOnSelection,
      disableMentions,
      disableMentionAll,
      mentionAllLabel,
      showAttachmentPreview,
      enableMultipleAttachments,
      ...(allowedFileTypes !== undefined && { allowedFileTypes }),
      ...(attachmentOptions !== undefined && { attachmentOptions }),
      ...(textFormatters !== undefined && { textFormatters }),
      // Hide button flags
      hideAttachmentButton,
      hideEmojiKeyboardButton,
      hideVoiceRecordingButton,
      hideStickersButton,
      hideAIButton,
      hideLiveReaction,
      hideSendButton,
      hideError,
      disableAutoFocusOnMobile,
      ...(liveReactionIcon !== undefined && { liveReactionIcon }),
      // Custom icon views
      ...(attachmentButtonIconView !== undefined && { attachmentButtonIconView }),
      ...(voiceRecordingButtonIconView !== undefined && { voiceRecordingButtonIconView }),
      ...(emojiButtonIconView !== undefined && { emojiButtonIconView }),
      ...(auxiliaryButtonView !== undefined && { auxiliaryButtonView }),
      ...(headerView !== undefined && { headerView }),
      showScrollbar,
      ...(onError !== undefined && { onError }),
      ...(onAttachmentAdded !== undefined && { onAttachmentAdded }),
      ...(onAttachmentRemoved !== undefined && { onAttachmentRemoved }),
      ...(onMentionSelected !== undefined && { onMentionSelected }),
      onMentionQueryChange: mentions.handleMentionStart,
      onMentionEnd: mentions.handleMentionEnd,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- individual hook properties are listed
    [
      hook.state,
      hook.canSend,
      hook.isInEditMode,
      hook.isInReplyMode,
      hook.showVoiceButton,
      hook.mediaUploadManager,
      hook.setText,
      handleSendMessage,
      hook.sendMediaMessage,
      hook.editMessage,
      handleInsertEmoji,
      hook.setContentToDisplay,
      hook.closePreview,
      hook.setRecording,
      hook.setDragging,
      hook.dismissValidationError,
      hook.startTyping,
      hook.endTyping,
      hook.inputRef,
      richText.editorRef,
      layout,
      user,
      group,
      parentMessageId,
      placeholder,
      enterKeyBehavior,
      maxInputHeight,
      enableRichTextEditor,
      hideRichTextFormattingOptions,
      showBubbleMenuOnSelection,
      disableMentions,
      disableMentionAll,
      mentionAllLabel,
      showAttachmentPreview,
      enableMultipleAttachments,
      allowedFileTypes,
      attachmentOptions,
      textFormatters,
      hideAttachmentButton,
      hideEmojiKeyboardButton,
      hideVoiceRecordingButton,
      hideStickersButton,
      hideAIButton,
      hideLiveReaction,
      hideSendButton,
      hideError,
      disableAutoFocusOnMobile,
      liveReactionIcon,
      attachmentButtonIconView,
      voiceRecordingButtonIconView,
      emojiButtonIconView,
      sendButtonView,
      auxiliaryButtonView,
      headerView,
      showScrollbar,
      onError,
      onAttachmentAdded,
      onAttachmentRemoved,
      onMentionSelected,
      mentions.handleMentionStart,
      mentions.handleMentionEnd,
    ]
  );

  const rootClass = [
    'cometchat-message-composer',
    `cometchat-message-composer--${layout}`,
    hook.isInEditMode ? 'cometchat-message-composer--edit-mode' : '',
    hook.isInReplyMode ? 'cometchat-message-composer--reply-mode' : '',
    hook.state.isRecording ? 'cometchat-message-composer--recording' : '',
    hook.state.isDraggingOver ? 'cometchat-message-composer--dragging' : '',
    // Plain global class so external CSS (e.g. AI chat) can target the composer
    'cometchat-message-composer',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // Whether to show the formatting toolbar
  const showToolbar = enableRichTextEditor && !hideRichTextFormattingOptions;
  // cursor is inside a code block or inside a link
  const inlineDisabled = richText.formatState.codeBlock || richText.formatState.link;

  // Default layout when no children provided
  const defaultChildren = (
    <>
      {headerView !== undefined ? (
        headerView
      ) : (
        <>
          <CometChatMessageComposerEditPreview />
          <CometChatMessageComposerReplyPreview />
        </>
      )}
      {/* Formatting toolbar — above the body, outside the flex-row */}
      {showToolbar && (
        <CometChatFormattingToolbar
          formatState={richText.formatState}
          inlineFormattingDisabled={inlineDisabled}
          onBold={richText.toggleBold}
          onItalic={richText.toggleItalic}
          onUnderline={richText.toggleUnderline}
          onStrikethrough={richText.toggleStrikethrough}
          onInlineCode={richText.toggleInlineCode}
          onCodeBlock={richText.toggleCodeBlock}
          onBlockquote={richText.toggleBlockquote}
          onOrderedList={richText.toggleOrderedList}
          onBulletList={richText.toggleBulletList}
          onLink={handleLinkClick}
        />
      )}
      {/* Multi-attachment staging tray — rendered above the input area. Self-hides
          when multi-attachment is disabled or the tray is empty. */}
      <CometChatMessageComposerTray />
      <div
        className={['cometchat-message-composer__body', 'cometchat-message-composer__body'].join(
          ' '
        )}
      >
        {layout === 'compact' && !hideAttachmentButton && (
          <div className={'cometchat-message-composer__attachment-button-wrapper'}>
            <CometChatMessageComposerAttachmentButton
              {...(hideAttachmentOptions ? { hideOptions: hideAttachmentOptions } : {})}
            />
          </div>
        )}
        <div
          className={[
            'cometchat-message-composer__input-area',
            'cometchat-message-composer__input-area',
            !showScrollbar ? 'cometchat-message-composer__input-area--hide-scrollbar' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <CometChatMessageComposerInput />
          {/* Mention suggestions — inside input area, positioned above input */}
          {!(disableMentions && (disableMentionAll || !group)) && (
            <CometChatMessageComposerMentionsList
              isOpen={mentions.isOpen}
              searchKeyword={mentions.searchKeyword}
              group={group}
              user={user}
              usersRequestBuilder={mentionsUsersRequestBuilder}
              groupMembersRequestBuilder={mentionsGroupMembersRequestBuilder}
              disableMentions={disableMentions}
              disableMentionAll={disableMentionAll}
              mentionAllLabel={mentionAllLabel}
              onItemClick={mentions.handleItemClick}
              onEmpty={mentions.handleEmpty}
            />
          )}
        </div>
        <div
          className={[
            'cometchat-message-composer__actions',
            'cometchat-message-composer__actions',
          ].join(' ')}
        >
          {layout === 'multiline' && !hideAttachmentButton && (
            <div className={'cometchat-message-composer__attachment-button-wrapper'}>
              <CometChatMessageComposerAttachmentButton
                {...(hideAttachmentOptions ? { hideOptions: hideAttachmentOptions } : {})}
              />
            </div>
          )}
          {!hideEmojiKeyboardButton && (
            <div className={'cometchat-message-composer__emoji-button-wrapper'}>
              <CometChatMessageComposerEmojiButton />
            </div>
          )}
          {!hideStickersButton && (
            <div className={'cometchat-message-composer__sticker-button-wrapper'}>
              <CometChatMessageComposerStickerButton />
            </div>
          )}
          <div
            className={[
              'cometchat-message-composer__voice-button-wrapper',
              !hook.showVoiceButton || hideVoiceRecordingButton
                ? 'cometchat-message-composer__voice-button-wrapper--hidden'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {!hideVoiceRecordingButton && <CometChatMessageComposerVoiceButton />}
          </div>
          {auxiliaryButtonView !== undefined && (
            <div className={'cometchat-message-composer__auxiliary-button-view'}>
              {auxiliaryButtonView}
            </div>
          )}
          <div
            className={[
              'cometchat-message-composer__send-button-wrapper',
              'cometchat-message-composer__send-button-wrapper',
            ].join(' ')}
          >
            {!hideSendButton && (
              <CometChatMessageComposerSendButton>
                {sendButtonView}
              </CometChatMessageComposerSendButton>
            )}
          </div>
        </div>
        {hook.state.isRecording && (
          <div className={'cometchat-message-composer__recording-overlay'}>
            <CometChatMediaRecorder.Root
              autoRecording
              onClose={() => {
                hook.setRecording(false);
                hook.setContentToDisplay('none');
              }}
              onSubmit={blob => {
                hook.setRecording(false);
                hook.setContentToDisplay('none');
                const file = new File([blob], 'voice-recording.wav', {
                  type: blob.type || 'audio/webm',
                });
                void hook.sendMediaMessage(file, 'audio', { isVoiceNote: true });
              }}
              onError={err => {
                onError?.(err);
              }}
            >
              <CometChatMediaRecorder.ErrorView />
              <CometChatMediaRecorder.Controls />
              <CometChatMediaRecorder.RecordingView>
                <CometChatMediaRecorder.Timer />
              </CometChatMediaRecorder.RecordingView>
              <CometChatMediaRecorder.PreviewView>
                <CometChatMediaRecorder.Timer />
              </CometChatMediaRecorder.PreviewView>
              <RecordingSendButton />
            </CometChatMediaRecorder.Root>
          </div>
        )}
      </div>
    </>
  );

  // --- Drag & drop ---
  // Staging respects the per-batch count limit (startUpload trims + toasts).
  // A depth counter avoids flicker as drag events bubble across child elements.
  const dragDepthRef = useRef(0);

  const dragHasFiles = (e: React.DragEvent): boolean =>
    Array.from(e.dataTransfer.types).includes('Files');

  const handleComposerDragEnter = (e: React.DragEvent) => {
    // Attachments can't be added while editing a message.
    if (disableDragAndDrop || hook.isInEditMode || !dragHasFiles(e)) return;
    e.preventDefault();
    dragDepthRef.current += 1;
    if (!hook.state.isDraggingOver) hook.setDragging(true);
  };

  const handleComposerDragOver = (e: React.DragEvent) => {
    if (!dragHasFiles(e)) return;
    e.preventDefault();
    if (disableDragAndDrop || hook.isInEditMode) return;
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleComposerDragLeave = () => {
    if (disableDragAndDrop || hook.isInEditMode) return;
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      hook.setDragging(false);
    }
  };

  const handleComposerDrop = (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files);
    if (disableDragAndDrop || hook.isInEditMode) {
      // Feature off / editing: still cancel the browser default for a file drop so
      // it can't navigate the page away, but don't stage anything.
      if (files.length > 0) e.preventDefault();
      return;
    }
    e.preventDefault();
    dragDepthRef.current = 0;
    hook.setDragging(false);
    if (files.length === 0) return;

    if (enableMultipleAttachments) {
      hook.mediaUploadManager.startUpload(files);
    } else {
      // Legacy single-send: send the first dropped file immediately.
      const file = files[0];
      if (!file) return;
      const primary = (file.type || '').split('/')[0];
      const type =
        primary === 'image'
          ? 'image'
          : primary === 'video'
            ? 'video'
            : primary === 'audio'
              ? 'audio'
              : 'file';
      void hook.sendMediaMessage(file, type);
    }
  };

  // --- Paste media (multi-attachment & legacy single-send) ---
  const handleComposerPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;

    const files: File[] = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length === 0) return;

    // Prevent default only when we have media to handle (don't block text paste).
    e.preventDefault();

    if (enableMultipleAttachments) {
      hook.mediaUploadManager.startUpload(files);
    } else {
      // Legacy single-send: send the first pasted file immediately.
      const file = files[0];
      if (!file) return;
      const primary = (file.type || '').split('/')[0];
      const type =
        primary === 'image'
          ? 'image'
          : primary === 'video'
            ? 'video'
            : primary === 'audio'
              ? 'audio'
              : 'file';
      void hook.sendMediaMessage(file, type);
    }
  };

  return (
    <CometChatMessageComposerContext.Provider value={contextValue}>
      <div
        className={rootClass}
        onPaste={handleComposerPaste}
        onDragEnter={handleComposerDragEnter}
        onDragOver={handleComposerDragOver}
        onDragLeave={handleComposerDragLeave}
        onDrop={handleComposerDrop}
      >
        {/* Validation error toast — positioned above the composer */}
        {hook.state.showValidationError && !hideError && (
          <ComposerValidationError
            textKey={hook.state.validationErrorText}
            maxCount={hook.mediaUploadManager.maxAttachmentCount}
            onDismiss={hook.dismissValidationError}
          />
        )}
        {children ? (
          <div className={'cometchat-message-composer__body'}>{children}</div>
        ) : (
          defaultChildren
        )}
        {/* Drag & drop overlay — shown only while dragging files over the composer. */}
        {!disableDragAndDrop && hook.state.isDraggingOver && (
          <div className={'cometchat-message-composer__drop-overlay'} aria-hidden="true">
            <img
              src={uploadIcon}
              alt=""
              className={'cometchat-message-composer__drop-overlay-icon'}
              draggable={false}
            />
            <span className={'cometchat-message-composer__drop-overlay-text'}>
              {getLocalizedStringComposer('message_composer_drop_files_here')}
            </span>
          </div>
        )}
        {/* Link Popover — inside the composer div for correct absolute positioning */}
        {linkPopoverState.open && (
          <CometChatLinkPopover
            url={linkPopoverState.url}
            text={linkPopoverState.text}
            position={linkPopoverState.position}
            onEdit={handleLinkPopoverEdit}
            onRemove={handleLinkPopoverRemove}
            onClose={handleLinkPopoverClose}
          />
        )}
      </div>
      {/* Link Dialog — rendered via portal to escape composer stacking context */}
      {linkDialogState.open &&
        createPortal(
          <div className={'cometchat-message-composer__link-dialog-overlay'}>
            <CometChatLinkDialog
              mode={linkDialogState.mode}
              initialText={linkDialogState.initialText}
              initialUrl={linkDialogState.initialUrl}
              selectedText={linkDialogState.selectedText}
              onSave={handleLinkDialogSave}
              onCancel={handleLinkDialogCancel}
            />
          </div>,
          getCurrentDocument().querySelector('.cometchat') ?? getCurrentDocument().body
        )}
    </CometChatMessageComposerContext.Provider>
  );
};
