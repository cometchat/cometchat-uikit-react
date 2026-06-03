import React, { useContext, useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatThreadHeaderParentBubbleProps } from './CometChatThreadHeader.types';
import { useCometChatThreadHeaderContext } from './CometChatThreadHeader.context';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import { CometChatDate } from '../base/CometChatDate';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../context/locale/LocaleContext';
import type { CometChatMessageBubbleAlignment } from '../../plugins/plugin.types';
import './CometChatThreadHeader.css';

/**
 * Get a simple text preview fallback when plugin system is not available.
 */
function getSimplePreview(
  message: CometChat.BaseMessage,
  getLocalizedString: (key: string) => string
): string {
  const type = message.getType();

  if (type === 'text') {
    const textMsg = message as CometChat.TextMessage;
    const text = textMsg.getText();
    if (text.length > 100) {
      return text.substring(0, 100) + '...';
    }
    return text || getLocalizedString('text_message_fallback');
  }

  switch (type) {
    case 'image':
      return '📷 Photo';
    case 'video':
      return '🎥 Video';
    case 'audio':
      return '🎵 Audio';
    case 'file':
      return '📎 File';
    default:
      return getLocalizedString('message_fallback_text');
  }
}

/**
 * CometChatThreadHeaderParentBubble — renders the parent message as a bubble.
 *
 * Uses the plugin registry to resolve the correct bubble renderer for the
 * parent message type. Interactions are disabled by default.
 *
 * If the plugin registry is not available (no CometChatProvider wrapping the tree),
 * renders a simplified text preview as a fallback.
 */
export const CometChatThreadHeaderParentBubble: React.FC<
  CometChatThreadHeaderParentBubbleProps
> = ({
  disableInteraction = true,
  messageSentAtDateTimeFormat: messageSentAtDateTimeFormatProp,
  className,
}) => {
  const {
    parentMessage,
    hideDate,
    separatorDateTimeFormat,
    messageSentAtDateTimeFormat: messageSentAtDateTimeFormatCtx,
    showScrollbar,
  } = useCometChatThreadHeaderContext();
  const loggedInUser = useLoggedInUser();
  const { getLocalizedString } = useLocale();

  // Prop takes precedence over context
  const messageSentAtDateTimeFormat =
    messageSentAtDateTimeFormatProp ?? messageSentAtDateTimeFormatCtx;

  // Read plugin registry directly via useContext (returns null if no provider — no throw)
  const registry = useContext(CometChatPluginRegistryContext);

  // Determine alignment based on sender
  const alignment: CometChatMessageBubbleAlignment = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-unnecessary-condition
    if (loggedInUser && parentMessage.getSender()?.getUid() === loggedInUser.getUid()) {
      return 'right';
    }
    return 'left';
  }, [parentMessage, loggedInUser]);

  // Resolve content view from plugin registry
  const contentView = useMemo(() => {
    if (!registry || !loggedInUser) return null;

    const plugin = registry.findPlugin(parentMessage);
    if (!plugin) return null;

    try {
      return plugin.renderBubble(parentMessage, {
        loggedInUser,
        alignment,
        theme: 'light',
        disableInteraction: true,
        getLocalizedString,
      });
    } catch (error) {
      console.error('CometChatThreadHeaderParentBubble: plugin.renderBubble failed', error);
      return null;
    }
  }, [registry, parentMessage, alignment, loggedInUser, getLocalizedString]);

  const wrapperClasses = [
    'cometchat-thread-header__bubble-wrapper',
    !showScrollbar && 'cometchat-thread-header--hide-scrollbar',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Fallback: no plugin registry or no matching plugin — show simple preview
  if (!contentView) {
    return (
      <div className={wrapperClasses}>
        {!hideDate && (
          <div className={'cometchat-thread-header__body-timestamp'}>
            <CometChatDate.Root
              timestamp={parentMessage.getSentAt()}
              variant="separator"
              formatConfig={separatorDateTimeFormat}
            >
              <CometChatDate.Text />
            </CometChatDate.Root>
          </div>
        )}
        <div className={'cometchat-thread-header__bubble-fallback'}>
          {getSimplePreview(parentMessage, getLocalizedString)}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {!hideDate && (
        <div className={'cometchat-thread-header__body-timestamp'}>
          <CometChatDate.Root
            timestamp={parentMessage.getSentAt()}
            variant="separator"
            formatConfig={separatorDateTimeFormat}
          >
            <CometChatDate.Text />
          </CometChatDate.Root>
        </div>
      )}
      <CometChatMessageBubble
        message={parentMessage}
        alignment={alignment}
        contentView={contentView}
        options={[]}
        hideThreadView
        disableInteraction={disableInteraction}
        {...(messageSentAtDateTimeFormat !== undefined && { messageSentAtDateTimeFormat })}
      />
    </div>
  );
};

CometChatThreadHeaderParentBubble.displayName = 'CometChatThreadHeaderParentBubble';
