import React, { useCallback, useMemo, useState } from 'react';
import { CometChat, CometChatException } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessageComposerAttachmentButtonProps,
  TrayItemKind,
} from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { CometChatPopover } from '../base/CometChatPopover';
import type { CometChatActionSheetItemData } from '../base/CometChatActionSheet/CometChatActionSheet.types';
import { useLocale } from '../../context/locale/LocaleContext';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import { CometChatCreatePoll } from '../CometChatCreatePoll/CometChatCreatePoll';
import addCircleIcon from '../../assets/add_circle.svg';
import addCircleFillIcon from '../../assets/add_circle_fill.svg';
import photoIcon from '../../assets/photo.svg';
import videocamIcon from '../../assets/videocam.svg';
import playCircleIcon from '../../assets/play_circle.svg';
import documentIcon from '../../assets/document_icon.svg';
import pollIcon from '../../assets/poll.svg';
import collaborativeDocumentIcon from '../../assets/collabrative_document.svg';
import collaborativeWhiteboardIcon from '../../assets/collaborative_whiteboard.svg';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerAttachmentButton — attachment menu trigger.
 *
 * Opens an action sheet with attachment options (image, video, audio, file,
 * polls, collaborative document, collaborative whiteboard).
 * Options can be hidden via the hideOptions config.
 * Supports custom attachment options via the attachmentOptions prop on Root.
 */
export const CometChatMessageComposerAttachmentButton: React.FC<
  CometChatMessageComposerAttachmentButtonProps
> = ({ hideOptions, className }) => {
  const {
    contentToDisplay,
    setContentToDisplay,
    sendMediaMessage,
    enableMultipleAttachments,
    stageAttachments,
    attachmentOptions,
    allowedFileTypes,
    user,
    group,
    parentMessageId,
    messageToReply,
    closePreview,
    onError,
    isInEditMode,
  } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const handleToggle = useCallback(() => {
    setContentToDisplay(contentToDisplay === 'attachments' ? 'none' : 'attachments');
  }, [contentToDisplay, setContentToDisplay]);

  const handleFileSelect = useCallback(
    (type: string) => {
      const input = getCurrentDocument().createElement('input');
      input.type = 'file';
      input.accept =
        allowedFileTypes && allowedFileTypes.length > 0
          ? allowedFileTypes.join(',')
          : type === 'image'
            ? 'image/*'
            : type === 'video'
              ? 'video/*'
              : type === 'audio'
                ? 'audio/*'
                : '*/*';
      if (enableMultipleAttachments) {
        // Multi-attachment: allow selecting several files and route ALL of them
        // to the staging tray (no immediate send).
        input.multiple = true;
        input.onchange = () => {
          const files = input.files ? Array.from(input.files) : [];
          if (files.length > 0) {
            // Force the staged kind to the chosen picker option so a file picked
            // via "File" is always treated as a file (type 'file'), regardless of
            // its actual MIME type — matching the legacy single-attachment behavior.
            stageAttachments(files, type as TrayItemKind);
          }
        };
      } else {
        // Legacy: single-select, send immediately.
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            void sendMediaMessage(file, type);
          }
        };
      }
      input.click();
      setContentToDisplay('none');
    },
    [
      enableMultipleAttachments,
      stageAttachments,
      sendMediaMessage,
      setContentToDisplay,
      getCurrentDocument,
      allowedFileTypes,
    ]
  );

  const handleOpenPoll = useCallback(() => {
    setContentToDisplay('none');
    setShowCreatePoll(true);
  }, [setContentToDisplay]);

  const handleClosePoll = useCallback(() => {
    setShowCreatePoll(false);
  }, []);

  const handlePollCreated = useCallback(() => {
    setShowCreatePoll(false);
  }, []);

  const handleCollaborativeDocument = useCallback(() => {
    setContentToDisplay('none');
    if (!CometChat.isInitialized()) return;
    const receiverId = user?.getUid() ?? group?.getGuid();
    const receiverType = user ? 'user' : 'group';
    if (!receiverId) return;

    const payload: Record<string, unknown> = { receiver: receiverId, receiverType };
    if (parentMessageId) {
      payload.parentMessageId = parentMessageId;
    }
    if (messageToReply) {
      payload.quotedMessageId = messageToReply.getId();
    }

    void CometChat.callExtension('document', 'POST', 'v1/create', payload)
      .then(() => {
        if (messageToReply) {
          closePreview();
        }
      })
      .catch((error: unknown) => {
        if (error instanceof CometChatException) onError?.(error);
      });
  }, [setContentToDisplay, user, group, parentMessageId, messageToReply, closePreview, onError]);

  const handleCollaborativeWhiteboard = useCallback(() => {
    setContentToDisplay('none');
    if (!CometChat.isInitialized()) return;
    const receiverId = user?.getUid() ?? group?.getGuid();
    const receiverType = user ? 'user' : 'group';
    if (!receiverId) return;

    const payload: Record<string, unknown> = { receiver: receiverId, receiverType };
    if (parentMessageId) {
      payload.parentMessageId = parentMessageId;
    }
    if (messageToReply) {
      payload.quotedMessageId = messageToReply.getId();
    }

    void CometChat.callExtension('whiteboard', 'POST', 'v1/create', payload)
      .then(() => {
        if (messageToReply) {
          closePreview();
        }
      })
      .catch((error: unknown) => {
        if (error instanceof CometChatException) onError?.(error);
      });
  }, [setContentToDisplay, user, group, parentMessageId, messageToReply, closePreview, onError]);

  // Build attachment options
  const attachmentItems: CometChatActionSheetItemData[] = useMemo(() => {
    // If custom attachmentOptions are provided, use those instead
    if (attachmentOptions && attachmentOptions.length > 0) {
      return attachmentOptions.map(opt => ({
        id: opt.id,
        title: opt.title,
        icon: opt.iconURL ? (
          <img
            src={opt.iconURL}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__attachment-option-icon'}
          />
        ) : undefined,
        onClick: opt.onClick,
      }));
    }

    const items: CometChatActionSheetItemData[] = [];

    if (!hideOptions?.image) {
      items.push({
        id: 'image',
        title: getLocalizedString('message_composer_attach_image'),
        icon: (
          <img
            src={photoIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__attachment-option-icon'}
          />
        ),
        onClick: () => {
          handleFileSelect('image');
        },
      });
    }
    if (!hideOptions?.video) {
      items.push({
        id: 'video',
        title: getLocalizedString('message_composer_attach_video'),
        icon: (
          <img
            src={videocamIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__attachment-option-icon'}
          />
        ),
        onClick: () => {
          handleFileSelect('video');
        },
      });
    }
    if (!hideOptions?.audio) {
      items.push({
        id: 'audio',
        title: getLocalizedString('message_composer_attach_audio'),
        icon: (
          <img
            src={playCircleIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__attachment-option-icon'}
          />
        ),
        onClick: () => {
          handleFileSelect('audio');
        },
      });
    }
    if (!hideOptions?.file) {
      items.push({
        id: 'file',
        title: getLocalizedString('message_composer_attach_file'),
        icon: (
          <img
            src={documentIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__attachment-option-icon'}
          />
        ),
        onClick: () => {
          handleFileSelect('file');
        },
      });
    }

    // Polls, Collaborative Document, and Collaborative Whiteboard are extension-backed
    // and don't support a parent message, so they're hidden in the thread composer
    // (when a parentMessageId is present).

    // Polls
    if (!hideOptions?.polls && !parentMessageId) {
      items.push({
        id: 'polls',
        title: getLocalizedString('message_composer_polls'),
        icon: (
          <img
            src={pollIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__attachment-option-icon'}
          />
        ),
        onClick: handleOpenPoll,
      });
    }

    // Collaborative Document
    if (!hideOptions?.collaborativeDocument && !parentMessageId) {
      items.push({
        id: 'collaborative-document',
        title: getLocalizedString('messsage_composer_collaborative_document'),
        icon: (
          <img
            src={collaborativeDocumentIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__attachment-option-icon'}
          />
        ),
        onClick: handleCollaborativeDocument,
      });
    }

    // Collaborative Whiteboard
    if (!hideOptions?.collaborativeWhiteboard && !parentMessageId) {
      items.push({
        id: 'collaborative-whiteboard',
        title: getLocalizedString('messsage_composer_collaborative_whiteboard'),
        icon: (
          <img
            src={collaborativeWhiteboardIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__attachment-option-icon'}
          />
        ),
        onClick: handleCollaborativeWhiteboard,
      });
    }

    return items;
  }, [
    hideOptions,
    parentMessageId,
    getLocalizedString,
    handleFileSelect,
    handleOpenPoll,
    handleCollaborativeDocument,
    handleCollaborativeWhiteboard,
    attachmentOptions,
  ]);

  const btnClass = [
    'cometchat-message-composer__attachment-button',
    contentToDisplay === 'attachments'
      ? 'cometchat-message-composer__attachment-button--active'
      : '',
    isInEditMode ? 'cometchat-message-composer__attachment-button--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <CometChatPopover
        placement="top"
        closeOnOutsideClick
        isOpen={contentToDisplay === 'attachments'}
        onClose={() => {
          setContentToDisplay('none');
        }}
        trigger={
          <button
            type="button"
            className={btnClass}
            disabled={isInEditMode}
            onClick={e => {
              e.stopPropagation();
              if (isInEditMode) return;
              handleToggle();
            }}
            aria-label={getLocalizedString('ATTACHMENTS') || 'Attachments'}
            aria-expanded={contentToDisplay === 'attachments'}
          >
            <img
              src={contentToDisplay === 'attachments' ? addCircleFillIcon : addCircleIcon}
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              draggable={false}
              className={'cometchat-message-composer__button-icon'}
            />
          </button>
        }
        content={
          <div className={'cometchat-message-composer__attachment-list'}>
            {attachmentItems.map(item => (
              <button
                key={item.id}
                type="button"
                className={'cometchat-message-composer__attachment-option'}
                onClick={item.disabled ? undefined : item.onClick}
                disabled={item.disabled}
              >
                {item.icon ? (
                  <span className={'cometchat-message-composer__attachment-option-icon-wrapper'}>
                    {item.icon}
                  </span>
                ) : null}
                <span className={'cometchat-message-composer__attachment-option-title'}>
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        }
      />

      {/* Create Poll Modal */}
      {showCreatePoll && (
        <CometChatCreatePoll
          {...(user ? { user } : {})}
          {...(group ? { group } : {})}
          onClose={handleClosePoll}
          onPollCreated={handlePollCreated}
          {...(onError ? { onError } : {})}
        />
      )}
    </>
  );
};
