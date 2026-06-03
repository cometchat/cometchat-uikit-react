import React, { useCallback } from 'react';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { CometChatPopover } from '../base/CometChatPopover';
import { useLocale } from '../../context/locale/LocaleContext';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import { preloadAIAssistantChat } from '../../plugins/ai/CometChatAIPlugin';
import aiIcon from '../../assets/ai_fill.svg';
import aiSuggestReplyIcon from '../../assets/ai_suggest_reply.svg';
import aiConversationSummaryIcon from '../../assets/ai_conversation_summary.svg';
import './CometChatMessageComposer.css';

/** AI action menu option. */
interface AIMenuOption {
  id: string;
  title: string;
  iconURL: string;
  onClick: () => void;
}

/**
 * CometChatMessageComposerAIButton — AI sparkle button in the composer toolbar.
 *
 * Opens a popover with AI action options:
 * - Suggest a reply — publishes ui:panel/show to show Smart Replies in the MessageList footer
 * - Conversation summary — publishes ui:panel/show to show Conversation Summary in the MessageList footer
 *
 * In , clicking these options triggered ccShowPanel which injected components into the
 * MessageList footer. In we publish ui:panel/show events that the CometChatMessageListAIFooter
 * listens to and renders the appropriate panel.
 */
export const CometChatMessageComposerAIButton: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { contentToDisplay, setContentToDisplay } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();
  const publish = usePublishEvent();

  const isActive = contentToDisplay === 'ai';

  const handleToggle = useCallback(() => {
    if (isActive) {
      setContentToDisplay('none');
    } else {
      setContentToDisplay('ai');
    }
  }, [isActive, setContentToDisplay]);

  const handleClose = useCallback(() => {
    setContentToDisplay('none');
  }, [setContentToDisplay]);

  // --- Menu Options ---
  // Clicking these publishes ui:panel/show events which the MessageList footer listens to.
  // SmartReplies / ConversationSummary into the MessageList footer area.
  const menuOptions: AIMenuOption[] = React.useMemo(() => {
    const options: AIMenuOption[] = [];

    options.push({
      id: 'smart-replies',
      title: getLocalizedString('ai_smart_replies_title') || 'Suggest a reply',
      iconURL: aiSuggestReplyIcon,
      onClick: () => {
        publish({ type: 'ui:panel/show', position: 'messageListFooter', panel: 'smartReplies' });
        handleClose();
      },
    });

    options.push({
      id: 'conversation-summary',
      title: getLocalizedString('ai_conversation_summary_title') || 'Conversation summary',
      iconURL: aiConversationSummaryIcon,
      onClick: () => {
        publish({
          type: 'ui:panel/show',
          position: 'messageListFooter',
          panel: 'conversationSummary',
        });
        handleClose();
      },
    });

    return options;
  }, [getLocalizedString, publish, handleClose]);

  const btnClass = [
    'cometchat-message-composer__ai-button',
    isActive ? 'cometchat-message-composer__ai-button--active' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // --- Render popover content (menu only — panels render in MessageList footer) ---
  const renderPopoverContent = () => {
    return (
      <div className={'cometchat-message-composer__ai-menu'}>
        <ul className={'cometchat-message-composer__ai-menu-list'} role="menu">
          {menuOptions.map(option => (
            <li key={option.id} role="menuitem">
              <button
                type="button"
                className={'cometchat-message-composer__ai-menu-item'}
                onClick={option.onClick}
              >
                <img
                  src={option.iconURL}
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  draggable={false}
                  className={'cometchat-message-composer__ai-menu-item-icon'}
                />
                <span className={'cometchat-message-composer__ai-menu-item-title'}>
                  {option.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <CometChatPopover.Root
      placement="top"
      closeOnOutsideClick
      isOpen={isActive}
      onClose={handleClose}
    >
      <CometChatPopover.Trigger>
        <button
          type="button"
          className={btnClass}
          onClick={handleToggle}
          onMouseEnter={() => void preloadAIAssistantChat()}
          onFocus={() => void preloadAIAssistantChat()}
          aria-label={getLocalizedString('ai_button_hover') || 'AI'}
          aria-expanded={isActive}
          aria-haspopup="menu"
        >
          <img
            src={aiIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__button-icon'}
          />
        </button>
      </CometChatPopover.Trigger>
      <CometChatPopover.Content>{renderPopoverContent()}</CometChatPopover.Content>
    </CometChatPopover.Root>
  );
};

CometChatMessageComposerAIButton.displayName = 'CometChatMessageComposerAIButton';
