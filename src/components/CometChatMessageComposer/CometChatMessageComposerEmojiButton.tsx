import React, { useCallback } from 'react';
import type { CometChatMessageComposerEmojiButtonProps } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { CometChatPopover } from '../base/CometChatPopover';
import { CometChatEmojiKeyboard } from '../base/CometChatEmojiKeyboard';
import { useLocale } from '../../context/locale/LocaleContext';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import moodIcon from '../../assets/mood.svg';
import moodFillIcon from '../../assets/mood_fill.svg';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerEmojiButton — emoji keyboard trigger.
 *
 * Opens the CometChatEmojiKeyboard in a popover.
 */
export const CometChatMessageComposerEmojiButton: React.FC<
  CometChatMessageComposerEmojiButtonProps
> = ({ className }) => {
  const { contentToDisplay, setContentToDisplay, insertEmoji } =
    useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  const getCurrentWindow = useCallback(() => {
    return IframeContext.iframeWindow ?? window;
  }, [IframeContext.iframeWindow]);

  const handleToggle = useCallback(() => {
    setContentToDisplay(contentToDisplay === 'emojiKeyboard' ? 'none' : 'emojiKeyboard');
  }, [contentToDisplay, setContentToDisplay]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      insertEmoji(emoji);
      // After emoji insertion, the popover will close and try to restore focus
      // to the emoji button. Override that by focusing the input after a microtask.
      // This ensures our focus call runs AFTER the popover's focus restoration.
      requestAnimationFrame(() => {
        const input = getCurrentDocument().querySelector<HTMLDivElement>(
          '[role="textbox"][contenteditable="true"]'
        );
        if (input) {
          input.focus();
          // Move cursor to end
          const sel = getCurrentWindow().getSelection();
          if (sel) {
            const range = getCurrentDocument().createRange();
            range.selectNodeContents(input);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      });
    },
    [insertEmoji, getCurrentDocument, getCurrentWindow]
  );

  const btnClass = [
    'cometchat-message-composer__emoji-button',
    contentToDisplay === 'emojiKeyboard' ? 'cometchat-message-composer__emoji-button--active' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CometChatPopover
      placement="top"
      closeOnOutsideClick
      isOpen={contentToDisplay === 'emojiKeyboard'}
      onClose={() => {
        setContentToDisplay('none');
      }}
      trigger={
        <button
          type="button"
          className={btnClass}
          onClick={e => {
            e.stopPropagation();
            handleToggle();
          }}
          aria-label={getLocalizedString('EMOJI') || 'Emoji'}
          aria-expanded={contentToDisplay === 'emojiKeyboard'}
          aria-haspopup="dialog"
        >
          <img
            src={contentToDisplay === 'emojiKeyboard' ? moodFillIcon : moodIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__button-icon'}
          />
        </button>
      }
      content={<CometChatEmojiKeyboard onEmojiClick={handleEmojiClick} />}
    />
  );
};
