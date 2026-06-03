import React, { useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageBubbleRendererProps } from './CometChatMessageBubble.types';
import { CometChatMessageBubble } from './CometChatMessageBubble';
import { CometChatMessageReplyPreview } from './CometChatMessageReplyPreview';
import { CometChatModerationView } from '../base/CometChatModerationView';
import { usePluginRegistry } from '../../hooks/usePluginRegistry';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/locale/LocaleContext';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import {
  isMessageModerated,
  isPermissionDeniedError,
  isMessagePendingModeration,
} from '../../utils/MessageReceiptUtils';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import type {
  CometChatMessageBubbleAlignment,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugins/plugin.types';

/** Quick-options count forced on messages that were moderated / rejected. */
const MODERATED_MESSAGE_QUICK_OPTIONS_COUNT = 3;

/**
 * CometChatMessageBubbleRenderer — resolves the correct plugin for a message,
 * renders the bubble content via plugin.renderBubble(), and passes everything
 * to the existing CometChatMessageBubble wrapper.
 *
 * This is the only component that touches PluginRegistryContext.
 * The existing CometChatMessageBubble stays a pure presentation component.
 *
 * View slot semantics:
 *   undefined (not passed) → bubble uses its built-in default
 *   null → bubble suppresses the slot (renders nothing)
 *   ReactNode / function → bubble renders it (override)
 */
export const CometChatMessageBubbleRenderer: React.FC<CometChatMessageBubbleRendererProps> = ({
  message,
  loggedInUser,
  group,
  messageAlignment = 1, // 1 = standard (incoming left, outgoing right)
  index,
  total,
  onAvatarClick,
  onThreadRepliesClick,
  onDeleteMessage,
  onFlagMessage,
  onMarkAsUnread,
  onEditMessage,
  onReplyMessage,
  onReactToMessage,
  onReactionChipClick,
  onReactorClick,
  onMessageInfo,
  onReplyPreviewClick,
  showToast,
  disableTruncation,
  hideAvatar: hideAvatarProp,
  hideTimestamp,
  hideThreadView,
  hideReceipts,
  disableInteraction,
  quickOptionsCount,
  hideReplyOption = false,
  hideReplyInThreadOption = false,
  hideEditMessageOption = false,
  hideDeleteMessageOption = false,
  hideCopyMessageOption = false,
  hideReactionOption = false,
  hideMessageInfoOption = false,
  hideFlagMessageOption = false,
  hideMessagePrivatelyOption = false,
  hideTranslateMessageOption = false,
  showMarkAsUnreadOption = false,
  messageSentAtDateTimeFormat,
  hideModerationView = false,
  isAgentChat = false,
}) => {
  const registry = usePluginRegistry();
  const { theme } = useTheme();
  const { getLocalizedString } = useLocale();
  const publish = usePublishEvent();

  const alignment: CometChatMessageBubbleAlignment = useMemo(() => {
    const category = message.getCategory() as string;
    if (category === 'action' || category === 'call') return 'center';
    if (messageAlignment === 0) return 'left'; // 0 = CometChatMessageListAlignment.left
    const isSentByMe = message.getSender().getUid() === loggedInUser.getUid();
    return isSentByMe ? 'right' : 'left';
  }, [message, messageAlignment, loggedInUser]);

  const plugin = useMemo(() => registry.findPlugin(message), [registry, message]);

  const pluginContext: CometChatMessagePluginContext = useMemo(
    () => ({
      loggedInUser,
      group,
      alignment,
      theme,
      getLocalizedString,
      onDeleteMessage,
      onFlagMessage,
      onThreadClick: onThreadRepliesClick,
      onMarkAsUnread,
      onEditMessage,
      onReplyMessage,
      onReactToMessage,
      onMessageInfo,
      showToast,
      disableTruncation,
      publish,
      getTextFormatters: () => registry.getTextFormatters(),
      // Option visibility toggles
      hideReplyOption,
      hideReplyInThreadOption,
      hideEditMessageOption,
      hideDeleteMessageOption,
      hideCopyMessageOption,
      hideReactionOption,
      hideMessageInfoOption,
      hideFlagMessageOption,
      hideMessagePrivatelyOption,
      hideTranslateMessageOption,
      showMarkAsUnreadOption,
    }),
    [
      loggedInUser,
      group,
      alignment,
      theme,
      getLocalizedString,
      onDeleteMessage,
      onFlagMessage,
      onThreadRepliesClick,
      onMarkAsUnread,
      onEditMessage,
      onReplyMessage,
      onReactToMessage,
      onMessageInfo,
      showToast,
      disableTruncation,
      publish,
      registry,
      hideReplyOption,
      hideReplyInThreadOption,
      hideEditMessageOption,
      hideDeleteMessageOption,
      hideCopyMessageOption,
      hideReactionOption,
      hideMessageInfoOption,
      hideFlagMessageOption,
      hideMessagePrivatelyOption,
      hideTranslateMessageOption,
      showMarkAsUnreadOption,
    ]
  );

  const contentView = useMemo(() => {
    if (!plugin) return <span>{getLocalizedString('message_type_not_supported')}</span>;
    // console.log(pluginContext.getLocalizedString?.("message_list_collaborative_whiteboard_open"))
    return plugin.renderBubble(message, pluginContext);
  }, [plugin, message, pluginContext, getLocalizedString]);

  const loggedInUid = loggedInUser.getUid();
  const moderationState = {
    moderated: isMessageModerated(message, loggedInUid),
    permissionDenied: isPermissionDeniedError(message, loggedInUid),
    pending: isMessagePendingModeration(message),
  };

  const isBlocked = moderationState.moderated || moderationState.permissionDenied;

  // Get context menu options via plugin, then filter for moderation states.
  const options = useMemo<CometChatMessageOption[]>(() => {
    // Pending messages (optimistic, not yet confirmed by SDK): hide all options.
    if (!message.getId()) {
      return [];
    }

    let base = plugin?.getOptions ? plugin.getOptions(message, pluginContext) : [];

    if (isBlocked) {
      const allowedIds = new Set<string>([
        CometChatUIKitConstants.MessageOption.deleteMessage,
        CometChatUIKitConstants.MessageOption.copyMessage,
      ]);
      base = base.filter(opt => allowedIds.has(opt.id));
    }

    return base;
  }, [plugin, message, pluginContext, isBlocked]);

  // --- View slot resolution ---
  // For each slot: check plugin first. If plugin provides a view, pass it.
  // If plugin returns null, pass null (suppress). If plugin returns undefined
  // or method doesn't exist, either fall through to renderer-level default
  // (for slots that need loggedInUser) or don't pass (let bubble use its default).

  const pluginLeadingView = useMemo<
    ((m: typeof message) => React.ReactNode) | null | undefined
  >(() => {
    if (!plugin?.renderLeadingView) return undefined;
    const result = plugin.renderLeadingView(message, pluginContext);
    if (result === null) return null;
    if (result === undefined) return undefined;
    return () => result;
  }, [plugin, message, pluginContext]);

  const pluginHeaderView = useMemo<
    ((m: typeof message) => React.ReactNode) | null | undefined
  >(() => {
    if (!plugin?.renderHeaderView) return undefined;
    const result = plugin.renderHeaderView(message, pluginContext);
    if (result === null) return null;
    if (result === undefined) return undefined;
    return () => result;
  }, [plugin, message, pluginContext]);

  const pluginStatusInfoView = useMemo<
    ((m: typeof message) => React.ReactNode) | null | undefined
  >(() => {
    if (!plugin?.renderStatusInfoView) return undefined;
    const result = plugin.renderStatusInfoView(message, pluginContext);
    if (result === null) return null;
    if (result === undefined) return undefined;
    return () => result;
  }, [plugin, message, pluginContext]);

  const pluginFooterView = useMemo<
    ((m: typeof message) => React.ReactNode) | null | undefined
  >(() => {
    if (!plugin?.renderFooterView) return undefined;
    const result = plugin.renderFooterView(message, pluginContext);
    if (result === null) return null;
    if (result === undefined) return undefined;
    return () => result;
  }, [plugin, message, pluginContext]);

  const pluginThreadView = useMemo<
    ((m: typeof message) => React.ReactNode) | null | undefined
  >(() => {
    if (!plugin?.renderThreadView) return undefined;
    const result = plugin.renderThreadView(message, pluginContext);
    if (result === null) return null;
    if (result === undefined) return undefined;
    return () => result;
  }, [plugin, message, pluginContext]);

  const pluginBottomView = useMemo<
    ((m: typeof message) => React.ReactNode) | null | undefined
  >(() => {
    // Check plugin first
    if (plugin?.renderBottomView) {
      const result = plugin.renderBottomView(message, pluginContext);
      if (result === null) return null;
      if (result !== undefined) return () => result;
    }
    if (!isBlocked) return undefined;
    if (hideModerationView) return undefined;
    if (moderationState.permissionDenied) {
      return () => (
        <CometChatModerationView message={getLocalizedString('file_type_not_allowed')} />
      );
    }
    return () => <CometChatModerationView />;
  }, [
    plugin,
    message,
    pluginContext,
    isBlocked,
    hideModerationView,
    moderationState.permissionDenied,
    getLocalizedString,
  ]);

  const pluginReplyView = useMemo<React.ReactNode | null | undefined>(() => {
    if (plugin?.renderReplyView) {
      const result = plugin.renderReplyView(message, pluginContext);
      if (result === null) return null;
      if (result !== undefined) return result;
    }
    const quotedMessage =
      (
        message as unknown as { getQuotedMessage?: () => CometChat.BaseMessage | null }
      ).getQuotedMessage?.() ?? null;
    if (!quotedMessage) return undefined;
    return (
      <CometChatMessageReplyPreview
        quotedMessage={quotedMessage}
        loggedInUser={loggedInUser}
        alignment={alignment === 'right' ? 'right' : 'left'}
        onClick={() => onReplyPreviewClick?.(quotedMessage)}
        isModerated={isBlocked}
      />
    );
  }, [plugin, message, pluginContext, loggedInUser, alignment, onReplyPreviewClick, isBlocked]);

  const effectiveHideThreadView = Boolean(hideThreadView) || isBlocked || isAgentChat;

  const effectiveQuickOptionsCount = isBlocked
    ? MODERATED_MESSAGE_QUICK_OPTIONS_COUNT
    : quickOptionsCount;

  const pluginProvidedBottomView = (() => {
    if (!plugin?.renderBottomView) return false;
    const result = plugin.renderBottomView(message, pluginContext);
    return result !== null && result !== undefined;
  })();
  const includeBottomViewHeight = !pluginProvidedBottomView && isBlocked && !hideModerationView;

  const hideAvatar = hideAvatarProp;

  return (
    <CometChatMessageBubble
      message={message}
      alignment={alignment}
      contentView={contentView}
      group={group}
      options={options}
      hideAvatar={hideAvatar}
      forceShowAvatar={isAgentChat}
      hideTimestamp={hideTimestamp}
      hideThreadView={effectiveHideThreadView}
      hideReceipts={hideReceipts}
      disableInteraction={disableInteraction}
      quickOptionsCount={effectiveQuickOptionsCount}
      leadingView={pluginLeadingView}
      headerView={pluginHeaderView}
      statusInfoView={pluginStatusInfoView}
      footerView={pluginFooterView}
      bottomView={pluginBottomView}
      replyView={pluginReplyView}
      threadView={pluginThreadView}
      onAvatarClick={onAvatarClick}
      onThreadRepliesClick={onThreadRepliesClick}
      onReactionChipClick={onReactionChipClick}
      onReactorClick={onReactorClick}
      includeBottomViewHeight={includeBottomViewHeight}
      ariaPosinset={index + 1}
      ariaSetsize={total}
      {...(messageSentAtDateTimeFormat !== undefined && { messageSentAtDateTimeFormat })}
    />
  );
};

CometChatMessageBubbleRenderer.displayName = 'CometChatMessageBubbleRenderer';
