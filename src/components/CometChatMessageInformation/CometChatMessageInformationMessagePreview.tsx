import React, { useContext, useMemo } from 'react';
import type { CometChatMessageInformationMessagePreviewProps } from './CometChatMessageInformation.types';
import { useCometChatMessageInformationContext } from './CometChatMessageInformation.context';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { useLocale } from '../../context/locale/LocaleContext';
import type { CometChatMessagePluginContext } from '../../plugins/plugin.types';
import './CometChatMessageInformation.css';

/**
 * CometChatMessageInformation.MessagePreview — renders the message bubble preview.
 *
 * Uses the plugin registry to resolve the correct plugin for the message,
 * calls renderBubble() to produce the inner content, and wraps it in
 * CometChatMessageBubble with receipts/avatar hidden.
 *
 * Falls back to a simple text preview if the plugin registry is not available
 * (e.g., in Storybook without CometChatProvider).
 */
export const CometChatMessageInformationMessagePreview: React.FC<
  CometChatMessageInformationMessagePreviewProps
> = ({ className }) => {
  const { message, showScrollbar } = useCometChatMessageInformationContext();
  const { getLocalizedString } = useLocale();

  // Try to get plugin registry — may be null in Storybook
  const registry = useContext(CometChatPluginRegistryContext);

  // Resolve plugin and render bubble content
  const contentView = useMemo(() => {
    if (!registry) return null;

    const plugin = registry.findPlugin(message);
    if (!plugin) return null;

    const sender = message.getSender();
    const pluginContext: CometChatMessagePluginContext = {
      loggedInUser: sender,
      alignment: 'right', // Always show as outgoing in the info panel
      theme: 'light',
      getLocalizedString,
    };

    try {
      return plugin.renderBubble(message, pluginContext);
    } catch {
      return null;
    }
  }, [registry, message, getLocalizedString]);

  const sectionClass = [
    'cometchat-message-information__message-preview',
    !showScrollbar ? 'cometchat-message-information__message-preview--hide-scrollbar' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // If we have a plugin-rendered contentView, use the real MessageBubble
  if (contentView) {
    return (
      <div className={sectionClass}>
        <CometChatMessageBubble
          message={message}
          alignment="right"
          contentView={contentView}
          hideAvatar
          hideSenderName
          hideReceipts
          hideThreadView
          disableInteraction
        />
      </div>
    );
  }

  // Fallback: simple text preview (Storybook / no plugin registry)
  const messageType = message.getType();
  let previewText = '';

  if (messageType === 'text') {
    const textMsg = message as unknown as { getText: () => string };
    previewText = textMsg.getText();
  } else if (messageType === 'image') {
    previewText = '📷 Photo';
  } else if (messageType === 'video') {
    previewText = '🎥 Video';
  } else if (messageType === 'audio') {
    previewText = '🎵 Audio';
  } else if (messageType === 'file') {
    previewText = '📎 File';
  } else {
    previewText = getLocalizedString('message_fallback_text');
  }

  return (
    <div className={sectionClass}>
      <div className={'cometchat-message-information__message-preview-content'}>{previewText}</div>
    </div>
  );
};
