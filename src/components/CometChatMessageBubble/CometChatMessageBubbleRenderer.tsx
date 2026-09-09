import React, { useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import type { CometChatMessageBubbleRendererProps } from './CometChatMessageBubble.types';
import { CometChatMessageBubble } from './CometChatMessageBubble';
import { CometChatMessageReplyPreview } from './CometChatMessageReplyPreview';
import { CometChatModerationView } from '../base/CometChatModerationView';
import { usePluginRegistry } from '../../hooks/usePluginRegistry';
import { useThreadSubscriptionState } from '../../hooks/useThreadSubscription';
import { usePinSaveFeatures } from '../../hooks/usePinSaveFeatures';
import { isPinned, isSaved } from '../../utils/pinSaveUtils';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/locale/LocaleContext';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import {
  isMessageModerated,
  isPermissionDeniedError,
  isMessagePendingModeration,
  getReceiptStatus,
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
  group,
  messageAlignment = 1, // 1 = standard (incoming left, outgoing right)
  index,
  total,
  batchPosition,
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
  hideThreadSubscriptionOption = false,
  hideEditMessageOption = false,
  hideDeleteMessageOption = false,
  hideCopyMessageOption = false,
  hideReactionOption = false,
  hideMessageInfoOption = false,
  hideFlagMessageOption = false,
  hideMessagePrivatelyOption = false,
  hideTranslateMessageOption = false,
  showMarkAsUnreadOption = false,
  hidePinMessageOption = false,
  hideUnpinMessageOption = false,
  hideSaveMessageOption = false,
  hideUnsaveMessageOption = false,
  optionsLayout = 'nested',
  forceShowAvatar: forceShowAvatarProp,
  headerView: headerViewProp,
  bubbleVariant,
  onPinMessage,
  onUnpinMessage,
  onSaveMessage,
  onUnsaveMessage,
  messageSentAtDateTimeFormat,
  hideModerationView = false,
  isAgentChat = false,
  textFormatters,
}) => {
  // A bubble only renders inside an authenticated surface (message list, pinned/
  // saved panels), all of which mount after login. Read and narrow up front — the
  // rest of the renderer (alignment, moderation, plugin context) needs a real user,
  // and failing loud here beats a downstream `undefined.getUid()`. Guarding before
  // any hook keeps the hook order stable. Mirrors how usePluginRegistry throws.
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  if (!loggedInUser) {
    throw new Error(
      'CometChatMessageBubbleRenderer requires a logged-in user; render it inside an authenticated session.'
    );
  }

  const registry = usePluginRegistry();
  // Subscribing here (rather than reading the module cache inside the option
  // factory) is what makes a late flag resolution recompute the memoized options.
  const pinSaveFeatures = usePinSaveFeatures();
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

  /**
   * The alignment plugins see, which drives their *palette* — every core plugin
   * decides its incoming/outgoing look from `context.alignment === 'right'`.
   *
   * When `bubbleVariant` forces a palette apart from layout (the Pinned panel
   * left-aligns every row but keeps outgoing colours), plugins have to follow the
   * variant, not the position. Without this the container turns purple while the
   * text and the audio play button stay grey.
   *
   * Layout still uses `alignment` — only the palette is redirected.
   */
  const paletteAlignment: CometChatMessageBubbleAlignment = useMemo(() => {
    if (bubbleVariant === 'outgoing') return 'right';
    if (bubbleVariant === 'incoming') return 'left';
    return alignment;
  }, [bubbleVariant, alignment]);

  const plugin = useMemo(() => registry.findPlugin(message), [registry, message]);

  // Thread subscription applies in both 1:1 and group conversations, so every
  // bubble tracks its own state. The hook reads the flag off the message itself
  // and re-seeds when a re-fetch swaps the object.
  const isThreadSubscribed = useThreadSubscriptionState(message);

  const pluginContext: CometChatMessagePluginContext = useMemo(
    () => ({
      loggedInUser,
      group,
      alignment: paletteAlignment,
      batchPosition,
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
      onPinMessage,
      onUnpinMessage,
      onSaveMessage,
      onUnsaveMessage,
      showToast,
      disableTruncation,
      publish,
      textFormatters,
      // The kit's default formatter set, for plugins rendering text/captions.
      getTextFormatters: () => registry.getTextFormatters(),
      // Option visibility toggles
      hideReplyOption,
      hideReplyInThreadOption,
      hideThreadSubscriptionOption,
      hideEditMessageOption,
      hideDeleteMessageOption,
      hideCopyMessageOption,
      hideReactionOption,
      hideMessageInfoOption,
      hideFlagMessageOption,
      hideMessagePrivatelyOption,
      hideTranslateMessageOption,
      showMarkAsUnreadOption,
      hidePinMessageOption,
      hideUnpinMessageOption,
      hideSaveMessageOption,
      hideUnsaveMessageOption,
      optionsLayout,
      pinSaveFeatures,
    }),
    [
      loggedInUser,
      group,
      paletteAlignment,
      batchPosition,
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
      onPinMessage,
      onUnpinMessage,
      onSaveMessage,
      onUnsaveMessage,
      showToast,
      disableTruncation,
      publish,
      textFormatters,
      registry,
      hideReplyOption,
      hideReplyInThreadOption,
      hideThreadSubscriptionOption,
      hideEditMessageOption,
      hideDeleteMessageOption,
      hideCopyMessageOption,
      hideReactionOption,
      hideMessageInfoOption,
      hideFlagMessageOption,
      hideMessagePrivatelyOption,
      hideTranslateMessageOption,
      showMarkAsUnreadOption,
      hidePinMessageOption,
      hideUnpinMessageOption,
      hideSaveMessageOption,
      hideUnsaveMessageOption,
      optionsLayout,
      pinSaveFeatures,
    ]
  );

  /**
   * The context the option list is built from.
   *
   * Deliberately separate from `pluginContext`: every reply in a thread resolves
   * to the same parent id, so one follow/unfollow flips `isThreadSubscribed` for
   * every bubble in the panel. Folding it into `pluginContext` would rebuild
   * `contentView` — re-running `plugin.renderBubble` for all of them — even
   * though the flag only ever changes a context-menu label.
   */
  const optionsContext = useMemo<CometChatMessagePluginContext>(
    () => ({ ...pluginContext, isThreadSubscribed }),
    [pluginContext, isThreadSubscribed]
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

    let base = plugin?.getOptions ? plugin.getOptions(message, optionsContext) : [];

    if (isBlocked) {
      const allowedIds = new Set<string>([
        CometChatUIKitConstants.MessageOption.deleteMessage,
        CometChatUIKitConstants.MessageOption.copyMessage,
      ]);
      base = base.filter(opt => allowedIds.has(opt.id));
    }

    return base;
  }, [plugin, message, optionsContext, isBlocked]);

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
        // Palette, not position — matches the bubble it sits inside.
        alignment={paletteAlignment === 'right' ? 'right' : 'left'}
        onClick={() => onReplyPreviewClick?.(quotedMessage)}
        isModerated={isBlocked}
        {...(pluginContext.textFormatters !== undefined && {
          textFormatters: pluginContext.textFormatters,
        })}
      />
    );
  }, [plugin, message, pluginContext, paletteAlignment, onReplyPreviewClick, isBlocked]);

  // Deleted messages keep the timestamp but hide the
  // receipt icon and the thread footer. Without the isDeleted gate here, a message
  // deleted in realtime keeps its non-zero replyCount and would still render the
  // "N replies" footer under the tombstone.
  const isDeleted = Boolean(message.getDeletedAt());

  const effectiveHideThreadView = Boolean(hideThreadView) || isBlocked || isAgentChat || isDeleted;

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

  // --- Batch chrome overrides (R6.2, R6.3, R6.4) ---
  // When a message is part of a multi-attachment batch, suppress certain visual
  // elements based on its position within the batch group:
  // - first: show avatar + sender name; suppress statusInfo
  // - middle: hide avatar, suppress sender name + statusInfo
  // - last: hide avatar, suppress sender name; show statusInfo
  // - single: no overrides (default behavior)
  const batchHideAvatar =
    batchPosition === 'middle' || batchPosition === 'last' ? true : hideAvatar;
  const batchHeaderView =
    batchPosition === 'middle' || batchPosition === 'last' ? null : pluginHeaderView;
  // An errored message (RBAC/moderation failure) must surface its status even when
  // it sits mid-batch — otherwise the failure is invisible.
  const hasError = !isDeleted && getReceiptStatus(message) === 'error';
  // A pinned or saved attachment must surface its indicator even mid-batch —
  // otherwise the only place the state is visible is a row that batching hides.
  // Attachments in one batch are pinned/saved independently, so a batch can show
  // the meta row on some children and not others.
  const hasPinOrSaveIndicator = isPinned(message) || isSaved(message);
  const isBatchStatusSuppressed =
    (batchPosition === 'first' || batchPosition === 'middle') &&
    !hasError &&
    !hasPinOrSaveIndicator;
  const batchStatusInfoView = isBatchStatusSuppressed ? null : pluginStatusInfoView;

  return (
    <CometChatMessageBubble
      message={message}
      alignment={alignment}
      contentView={contentView}
      group={group}
      options={options}
      hideAvatar={batchHideAvatar}
      forceShowAvatar={forceShowAvatarProp ?? isAgentChat}
      {...(bubbleVariant !== undefined && { bubbleVariant })}
      hideTimestamp={hideTimestamp}
      hideThreadView={effectiveHideThreadView}
      hideReceipts={Boolean(hideReceipts) || isDeleted}
      disableInteraction={disableInteraction}
      quickOptionsCount={effectiveQuickOptionsCount}
      leadingView={pluginLeadingView}
      headerView={headerViewProp !== undefined ? headerViewProp : batchHeaderView}
      statusInfoView={batchStatusInfoView}
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
