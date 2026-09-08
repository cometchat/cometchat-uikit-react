import { useEffect, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageListManager } from './CometChatMessageListManager';
import type { CometChatMessageListManagerOptions } from './CometChatMessageList.types';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';
import {
  isMessageForConversation,
  isThreadReplyForConversation,
  isReactionForConversation,
} from './CometChatMessageList.utils';
import { playIncomingSound } from './CometChatMessageList.sound';
import {
  applyIncomingReplySubscription,
  writeThreadSubscribed,
  mirrorThreadSubscribed,
} from '../../utils/CometChatThreadSubscription';
import { noop, extractGroupFromEvent } from './messageListHelpers';
import type { MessageListRefs, MessageListDispatch } from './messageListRefs';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import {
  startStreamingMessage,
  isStreaming as isStreamingActive,
  subscribeToStreamState,
  getStreamState,
} from '../CometChatAIAssistantChat/CometChatAIStreamingService';
import { createStreamingMessage } from '../../utils/CometChatStreamingMessageFactory';

// ---------------------------------------------------------------------------
// Real-time event handling sub-hook
// ---------------------------------------------------------------------------

export interface UseMessageListEventsOptions {
  user: CometChat.User | undefined;
  group: CometChat.Group | undefined;
  loggedInUser: CometChat.User;
  messagesRequestBuilder: CometChat.MessagesRequestBuilder | undefined;
  /** The thread's parent message (thread view), for stamping realtime replies. */
  parentMessage: CometChat.BaseMessage | undefined;
  parentMessageId: number | undefined;
  messageTypes: string[] | undefined;
  messageCategories: string[];
  disableSoundForMessages: boolean;
  customSoundForMessages: string | undefined;
  scrollToBottomOnNewMessages: boolean;
  hideReceipts: boolean;
}

/**
 * Real-time event handling via useCometChatEvents.
 *
 * Subscribes to SDK events and dispatches the appropriate reducer actions.
 * Handles: message received/edited/deleted, receipts, reactions, group actions,
 * and connection recovery.
 */
export function useMessageListEvents(
  options: UseMessageListEventsOptions,
  refs: MessageListRefs,
  dispatch: MessageListDispatch
): void {
  const {
    user,
    group,
    loggedInUser,
    messagesRequestBuilder,
    parentMessage,
    parentMessageId,
    messageTypes,
    messageCategories,
    disableSoundForMessages,
    customSoundForMessages,
    scrollToBottomOnNewMessages,
    hideReceipts,
  } = options;

  const publish = usePublishEvent();

  useCometChatEvents(
    (event: CometChatEvent) => {
      const currentState = refs.stateRef.current;
      const opts = refs.optionsRef.current;

      switch (event.type) {
        // --- Message received ---
        case 'message/text-received':
        case 'message/media-received':
        case 'message/custom-received':
        case 'message/interactive-received':
        case 'message/card-received':
        case 'message/ai-assistant-received': {
          const msg = event.message as CometChat.BaseMessage;

          // When an agentic message arrives (AI response), collect it in pendingMessagesMap.
          // When streaming ends, processPendingMessages() will replace the run_started bubble.
          if (
            opts.isAgentChat &&
            msg.getCategory() === CometChatUIKitConstants.MessageCategory.agentic
          ) {
            // Extract runId from the message
            const msgWithData = msg as unknown as {
              getAssistantMessageData?: () => { getRunId?: () => string };
              getToolArgumentMessageData?: () => { getRunId?: () => string };
              getToolResultMessageData?: () => { getRunId?: () => string };
            };
            const assistantData = msgWithData.getAssistantMessageData?.();
            const toolArgData = msgWithData.getToolArgumentMessageData?.();
            const toolResultData = msgWithData.getToolResultMessageData?.();
            const runId =
              assistantData?.getRunId?.() ??
              toolArgData?.getRunId?.() ??
              toolResultData?.getRunId?.() ??
              '';

            if (runId) {
              // Store in pending map
              refs.pendingMessagesMap[runId] ??= [];
              refs.pendingMessagesMap[runId].push(msg);

              const chatId = user?.getUid() ?? group?.getGuid() ?? '';
              if (!isStreamingActive(chatId)) {
                dispatch({
                  type: 'PROCESS_PENDING_MESSAGES',
                  pendingMessagesMap: refs.pendingMessagesMap,
                });
                refs.pendingMessagesMap = {};
              }
              break;
            }
          }

          // Check if this message belongs to the current conversation.
          // isMessageForConversation excludes messages from the logged-in user
          // (they normally go through the optimistic send flow). However, messages
          // sent by the logged-in user from another tab/device/backend arrive via
          // SDK events and must still be appended if they're not already in the
          // optimistic queue or confirmed message list.
          const isFromLoggedInUser = msg.getSender().getUid() === loggedInUser.getUid();
          const isForConversation = isMessageForConversation(
            msg,
            user,
            group,
            parentMessageId,
            loggedInUser.getUid()
          );

          // For own messages: check if it's already tracked (pending or confirmed).
          // If not, it came from another tab/device — treat it as a received message.
          let isOwnMessageFromElsewhere = false;
          if (isFromLoggedInUser && !isForConversation) {
            const alreadyInMessagesById = currentState.messages.some(
              m => m.getId() === msg.getId()
            );
            // Check for an in-flight pending entry by muid so we don't
            // double-render a send that is still round-tripping.
            const msgMuid = msg.getMuid() || '';
            const alreadyInMessagesByMuid =
              msgMuid !== '' && currentState.messages.some(m => m.getMuid() === msgMuid);
            isOwnMessageFromElsewhere =
              !alreadyInMessagesById &&
              !alreadyInMessagesByMuid &&
              isMessageForConversation(msg, user, group, parentMessageId, loggedInUser.getUid(), {
                excludeSender: false,
              });
          }

          if (isForConversation || isOwnMessageFromElsewhere) {
            // Case 2 — the author is auto-subscribed to their own message's thread by
            // default. An own message arriving over the socket (sent from another tab/
            // device) carries threadSubscribed:false / no flag, which we don't trust;
            // derive the flag from the known default instead. Type-agnostic — covers
            // text/media/custom/interactive/card (poll, collaborative, sticker, …).
            // Placed before the reply reconciliation so a thread reply's parent-inherit
            // still wins in a thread view (Case 4 is unchanged).
            if (isFromLoggedInUser) {
              writeThreadSubscribed(msg, true);
            }
            // A socket-delivered reply carries threadSubscribed:false / no flag. In a thread
            // view we hold the authoritative parent, so stamp the reply with the
            // thread's current state (and handle a mention that subscribes me)
            // before it is appended and rendered. A no-op for non-thread messages.
            applyIncomingReplySubscription({
              reply: msg,
              parentMessage,
              loggedInUserUid: loggedInUser.getUid(),
              publish,
            });

            // hasReachedLatest check is done by the reducer
            dispatch({
              type: 'MESSAGE_RECEIVED',
              message: msg,
              fromLoggedInUser: isOwnMessageFromElsewhere,
            });

            if (!isFromLoggedInUser && !msg.getDeliveredAt()) {
              refs.managerRef.current?.markAsDelivered(msg).catch(noop);
            }

            // If this is our own message (from another tab/device) AND we had
            // manually marked unread in this session, clear that state and mark
            // the conversation as read. The banner stays visible.
            if (isOwnMessageFromElsewhere && currentState.markedUnreadByUser) {
              refs.managerRef.current?.markConversationAsRead().catch(noop);
              dispatch({ type: 'SET_MARKED_UNREAD_BY_USER', value: false });
              dispatch({ type: 'SET_UNREAD_COUNT', count: 0 });
              dispatch({ type: 'SET_CONVERSATION_READ' });
            }

            if (!disableSoundForMessages && !isOwnMessageFromElsewhere) {
              playIncomingSound(customSoundForMessages);
            }

            // Mark as read if at bottom and at latest, but NOT if user manually
            // marked unread, and NEVER on our own messages (from another tab/device
            // or our own optimistic send bouncing back).
            if (
              !isOwnMessageFromElsewhere &&
              currentState.isAtBottom &&
              currentState.hasReachedLatest &&
              !currentState.markedUnreadByUser
            ) {
              refs.managerRef.current?.markAsRead(msg).catch(noop);
              // Set readAt locally so markConversationAsReadIfUnread won't re-trigger
              const now = Math.floor(Date.now() / 1000);
              msg.setReadAt(now);
              // Publish ui:message/read so other components (thread header, conversations list) can react
              publish({ type: 'ui:message/read', message: msg });
              opts.onMessageRead?.(msg);
            }

            // scrollToBottomOnNewMessages force-scroll
            if (scrollToBottomOnNewMessages) {
              dispatch({ type: 'SET_AT_BOTTOM', isAtBottom: true });
            }
          } else if (isThreadReplyForConversation(msg, user, group)) {
            // Thread reply — update reply count on parent
            if (!disableSoundForMessages) {
              playIncomingSound(customSoundForMessages);
            }
            dispatch({
              type: 'UPDATE_REPLY_COUNT',
              parentMessageId: msg.getParentMessageId(),
            });

            // Case 3 — a reply from someone else that @mentions me subscribes me
            // to the thread. The reply isn't displayed in the main list (no parent
            // held), so this only flips the mounted surfaces via the mirror.
            applyIncomingReplySubscription({
              reply: msg,
              parentMessage,
              loggedInUserUid: loggedInUser.getUid(),
              publish,
            });
          }
          break;
        }

        // --- Message edited ---
        case 'message/edited': {
          const msg = event.message;
          const isForConv = isMessageForConversation(
            msg,
            user,
            group,
            parentMessageId,
            loggedInUser.getUid()
          );
          const isOwnEdit = msg.getSender().getUid() === loggedInUser.getUid();
          // Include own edits (sender exclusion in isMessageForConversation would reject them)
          if (isForConv || isOwnEdit) {
            // Clone to ensure a new reference for React re-render
            const clonedMsg = Object.assign(
              Object.create(Object.getPrototypeOf(msg) as object),
              msg
            ) as CometChat.BaseMessage;
            dispatch({ type: 'MESSAGE_EDITED', message: clonedMsg });
          }

          // Edit-mention — an edited thread reply that @mentions me subscribes me to the
          // parent (server-side), whoever edited it (mine or someone else's) and whether
          // the mention was just added or preserved. Runs regardless of panel open, via
          // the same reconciliation as an arriving reply — but with
          // ownAuthorshipSubscribes:false, since editing my own message does NOT
          // re-subscribe me (only a mention does). A no-op on top-level / non-thread
          // edits, so a top-level mention never subscribes.
          if (isForConv || isThreadReplyForConversation(msg, user, group)) {
            applyIncomingReplySubscription({
              reply: msg,
              parentMessage,
              loggedInUserUid: loggedInUser.getUid(),
              publish,
              ownAuthorshipSubscribes: false,
            });
          }
          break;
        }

        // --- Pin / Save ---
        // Pin is broadcast to every member; save is private to the acting user's
        // own devices. The `ui:*` variants are this tab's optimistic flip, which
        // mutates the message in place and so still needs a dispatch to re-render.
        // All four are idempotent — state is read off the message, never toggled.
        case 'message/pinned':
        case 'message/unpinned':
        case 'ui:message/pin-changed': {
          dispatch({ type: 'MESSAGE_PIN_SAVE_UPDATE', message: event.message, scope: 'pin' });
          break;
        }

        case 'message/saved':
        case 'message/unsaved':
        case 'ui:message/save-changed': {
          dispatch({ type: 'MESSAGE_PIN_SAVE_UPDATE', message: event.message, scope: 'save' });
          break;
        }

        // --- Message deleted ---
        case 'message/deleted': {
          const msg = event.message;
          // Include own deletes (sender exclusion in isMessageForConversation would reject them)
          if (
            isMessageForConversation(msg, user, group, parentMessageId, loggedInUser.getUid()) ||
            msg.getSender().getUid() === loggedInUser.getUid()
          ) {
            dispatch({ type: 'MESSAGE_DELETED', message: msg });
            opts.onMessageDeleted?.(msg);
          }
          break;
        }

        // --- Message moderated ---
        // Server-pushed update when AI/manual moderation changes a message's
        // moderationStatus (approved / disapproved). replace in place by id,
        // but the reducer guards against downgrading a disapproved message.
        case 'message/moderated': {
          const msg = event.message;
          if (
            isMessageForConversation(msg, user, group, parentMessageId, loggedInUser.getUid()) ||
            msg.getSender().getUid() === loggedInUser.getUid()
          ) {
            dispatch({ type: 'MESSAGE_MODERATED', message: msg });
          }
          break;
        }

        // --- Receipts (gated by hideReceipts) ---
        case 'receipt/delivered':
        case 'receipt/read':
        case 'receipt/delivered-to-all':
        case 'receipt/read-by-all': {
          if (hideReceipts) {
            break;
          }
          const receipt = event.receipt;
          const isBroadcast =
            event.type === 'receipt/delivered-to-all' || event.type === 'receipt/read-by-all';
          const inGroupChat = group != null;

          // Filter by conversation kind: groups only use broadcast receipts,
          // 1:1 chats only use per-user receipts.
          if (inGroupChat !== isBroadcast) {
            break;
          }

          // Filter by conversation target: skip receipts that belong to a
          // different chat (SDK fires listeners globally per connection).
          const receiptReceiverType = receipt.getReceiverType();
          if (inGroupChat) {
            const receiver = receipt.getReceiver() as unknown;
            const guid =
              typeof receiver === 'string'
                ? receiver
                : (receiver as { getGuid?: () => string } | null)?.getGuid?.();
            if (receiptReceiverType !== 'group' || guid !== group.getGuid()) {
              break;
            }
          } else if (user) {
            const receiver = receipt.getReceiver() as unknown;
            const receiverUid = typeof receiver === 'string' ? receiver : undefined;
            const senderUid = receipt.getSender().getUid();
            if (receiverUid !== loggedInUser.getUid() || senderUid !== user.getUid()) {
              break;
            }
          }

          const receiptType =
            event.type === 'receipt/delivered' || event.type === 'receipt/delivered-to-all'
              ? 'delivered'
              : 'read';
          dispatch({
            type: 'RECEIPT_UPDATE',
            receiptType,
            messageId: parseInt(receipt.getMessageId(), 10),
            timestamp: receiptType === 'delivered' ? receipt.getDeliveredAt() : receipt.getReadAt(),
            loggedInUserId: loggedInUser.getUid(),
          });
          break;
        }

        // --- Reactions ---
        case 'reaction/added':
        case 'reaction/removed': {
          const reactionEvent = event.event;
          if (isReactionForConversation(reactionEvent, user, group, parentMessageId)) {
            const rawMessageId = reactionEvent.getReaction().getMessageId();
            // SDK may return string despite number type annotation
            const messageId =
              typeof rawMessageId === 'string' ? parseInt(rawMessageId, 10) : rawMessageId;
            const existingMsg = currentState.messages.find(
              m => String(m.getId()) === String(messageId)
            );
            if (existingMsg) {
              const action =
                event.type === 'reaction/added'
                  ? CometChat.REACTION_ACTION.REACTION_ADDED
                  : CometChat.REACTION_ACTION.REACTION_REMOVED;
              const updatedMsg = CometChat.CometChatHelper.updateMessageWithReactionInfo(
                existingMsg,
                reactionEvent.getReaction(),
                action
              ) as CometChat.BaseMessage;
              dispatch({
                type: 'REACTION_UPDATE',
                messageId,
                reactions: updatedMsg.getReactions(),
              });
            }
          }
          break;
        }

        // --- Group actions ---
        case 'group/member-joined':
        case 'group/member-left':
        case 'group/member-kicked':
        case 'group/member-banned':
        case 'group/member-unbanned':
        case 'group/member-added':
        case 'group/member-scope-changed': {
          const actionMsg = event.action;
          const eventGroup = extractGroupFromEvent(event);

          // Update group reference
          if (eventGroup && group?.getGuid() === eventGroup.getGuid()) {
            refs.groupRef.current = eventGroup;
            dispatch({ type: 'UPDATE_GROUP_REFERENCE', group: eventGroup });

            // Add action message to list
            dispatch({
              type: 'MESSAGE_RECEIVED',
              message: actionMsg as CometChat.BaseMessage,
            });

            // Scroll/unread behavior same as regular messages
            if (scrollToBottomOnNewMessages || currentState.isAtBottom) {
              dispatch({ type: 'SET_AT_BOTTOM', isAtBottom: true });
            }
          }
          break;
        }

        // --- Connection recovery ---
        case 'connection/connected': {
          // Do NOT reset/clear the list — that causes a blank screen.
          const messages = currentState.messages;
          const manager = refs.managerRef.current;
          if (!manager || messages.length === 0) {
            // No messages loaded yet — fall back to full re-init
            refs.generationRef.current += 1;
            dispatch({ type: 'RESET' });

            const reconnectOpts: CometChatMessageListManagerOptions = {
              messageTypes,
              messageCategories,
            };
            if (user) reconnectOpts.user = user;
            if (group) reconnectOpts.group = group;
            if (messagesRequestBuilder) reconnectOpts.builder = messagesRequestBuilder;
            if (parentMessageId) reconnectOpts.parentMessageId = parentMessageId;
            if (opts.isAgentChat) reconnectOpts.isAgentChat = true;

            const newManager = new CometChatMessageListManager(reconnectOpts);
            refs.managerRef.current = newManager;

            if (refs.initializeRef.current) {
              refs.initializeRef.current();
            }
            break;
          }

          // Get the last message ID and fetch newer messages from there
          const lastMsg = messages[messages.length - 1];
          const lastMsgId = lastMsg ? lastMsg.getId() : 0;
          if (lastMsgId > 0) {
            manager.initNextRequest(lastMsgId);
            const gen = refs.generationRef.current;

            const fetchMissed = async () => {
              try {
                const newMessages = await manager.fetchNext();
                if (refs.generationRef.current !== gen) return;

                if (newMessages.length > 0) {
                  dispatch({
                    type: 'FETCH_NEXT_SUCCESS',
                    messages: newMessages,
                    hasMoreNewer: newMessages.length >= 30,
                  });

                  // If no more newer messages, we've caught up
                  if (newMessages.length < 30) {
                    dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
                  }
                }
              } catch {
                // On failure, fall back to full re-init
                refs.generationRef.current += 1;
                dispatch({ type: 'RESET' });

                const fallbackOpts: CometChatMessageListManagerOptions = {
                  messageTypes,
                  messageCategories,
                };
                if (user) fallbackOpts.user = user;
                if (group) fallbackOpts.group = group;
                if (messagesRequestBuilder) fallbackOpts.builder = messagesRequestBuilder;
                if (parentMessageId) fallbackOpts.parentMessageId = parentMessageId;
                if (opts.isAgentChat) fallbackOpts.isAgentChat = true;

                const newManager = new CometChatMessageListManager(fallbackOpts);
                refs.managerRef.current = newManager;

                if (refs.initializeRef.current) {
                  refs.initializeRef.current();
                }
              }
            };

            void fetchMissed();
          }
          break;
        }

        // --- Call events ---
        case 'call/incoming':
        case 'call/accepted':
        case 'call/rejected':
        case 'call/cancelled':
        case 'call/ended': {
          const callMsg = event.call;
          if (
            isMessageForConversation(callMsg, user, group, parentMessageId, loggedInUser.getUid(), {
              excludeSender: false,
            })
          ) {
            dispatch({ type: 'MESSAGE_RECEIVED', message: callMsg });
          }
          break;
        }

        // --- UI Events: message sent by local composer (optimistic flow) ---
        case 'ui:message/sent': {
          const msg = event.message;

          // Case 2 — sending any message auto-subscribes the author to its thread.
          // Stamp the outgoing message's own flag so it shows subscribed in realtime,
          // without depending on the send response carrying it. This event is the
          // single same-device display choke point for every send that publishes it
          // (text, media, batch, sticker, custom). An errored send created no thread,
          // so skip it. `msg` is always authored by the logged-in user here.
          if (event.status !== CometChatMessageStatus.error) {
            writeThreadSubscribed(msg, true);
          }

          // inprogress: add the pending message immediately (optimistic display)
          if (event.status === CometChatMessageStatus.inprogress) {
            const isForConv = isMessageForConversation(
              msg,
              user,
              group,
              parentMessageId,
              loggedInUser.getUid(),
              { excludeSender: false, isAgentChat: opts.isAgentChat ?? false }
            );
            if (!isForConv) break;

            // In agent chat, do NOT remove the completed streaming bubble — it holds
            // the previous AI response.
            // In our flow, no SDK message arrives — the streaming bubble IS the final
            // response. The bubble component snapshots its text when streaming ends,
            // so it renders independently of the global stream state.
            // A new streaming bubble is added on 'success' for the next response.

            const muid = msg.getMuid() || '';
            if (muid) {
              const currentState = refs.stateRef.current;

              if (!currentState.hasReachedLatest) {
                break;
              }

              dispatch({ type: 'MESSAGE_SEND_START', muid, message: msg });
              dispatch({ type: 'SET_AT_BOTTOM', isAtBottom: true });
            }
            break;
          }

          if (event.status === CometChatMessageStatus.error) {
            // Scope the errored/rejected message to the list it belongs to so a
            // thread-level rejection doesn't leak into the main list (and vice
            // versa). We check ONLY the thread scoping here — mirroring
            // isMessageForConversation()'s parent logic — and deliberately skip
            // its receiver matching, because the SDK may clear receiverId on
            // failure, which would wrongly reject a valid same-conversation error.
            // parentMessageId, unlike receiverId, is set by the composer before
            // publishing and is not cleared on failure.
            const msgParentId = msg.getParentMessageId() || 0;
            if (parentMessageId) {
              // Thread list: accept only its own thread's messages.
              if (msgParentId !== parentMessageId) break;
            } else if (msgParentId && !(opts.isAgentChat ?? false)) {
              // Main list: reject thread replies (agent chat shows them inline).
              break;
            }

            const errorMuid = msg.getMuid() || '';
            if (errorMuid) {
              dispatch({
                type: 'MESSAGE_SEND_ERROR',
                muid: errorMuid,
                message: msg,
                error: 'Send failed',
              });
            }
            break;
          }

          // Case 4 (same device) — an own threaded send subscribes the author to the
          // parent thread. Mirror the flip on success (a failed send, handled above,
          // created no thread) so the thread header/parent bubble agree — from
          // whichever list (thread or main) is mounted; idempotent, so overlap is
          // harmless. This is the single display-side home for the mirror; the send
          // sites (composer/sticker) no longer do it.
          const sentParentId = msg.getParentMessageId() || 0;
          if (sentParentId) {
            mirrorThreadSubscribed(sentParentId, publish);
          }

          // Check if this message belongs to the current conversation.
          // Pass isAgentChat so thread replies are not rejected in agent chat mode
          const isForConv = isMessageForConversation(
            msg,
            user,
            group,
            parentMessageId,
            loggedInUser.getUid(),
            { excludeSender: false, isAgentChat: opts.isAgentChat ?? false }
          );
          // For error events, skip the conversation check — the SDK may clear
          // receiverId on failure. The message was already added via inprogress.
          if (
            !isForConv &&
            (event.status as CometChatMessageStatus) !== CometChatMessageStatus.error
          ) {
            // Not for this list — but check if it's a thread reply for this conversation
            // (main list needs to update reply count when a thread reply is sent locally)
            if (isThreadReplyForConversation(msg, user, group)) {
              dispatch({ type: 'UPDATE_REPLY_COUNT', parentMessageId: msg.getParentMessageId() });
            }
            break;
          }

          // Replace the pending (optimistic) message with the confirmed one.
          const msgMuid = msg.getMuid() || '';
          const hasByMuid =
            msgMuid !== '' && currentState.messages.some(m => m.getMuid() === msgMuid);

          if (hasByMuid && msgMuid) {
            dispatch({ type: 'MESSAGE_SEND_SUCCESS', muid: msgMuid, confirmedMessage: msg });
          } else {
            // No pending found by muid — check by id to avoid duplicating
            const alreadyByIdInReducer = currentState.messages.some(
              m => m.getId() && String(m.getId()) === String(msg.getId())
            );
            if (!alreadyByIdInReducer) {
              dispatch({ type: 'MESSAGE_RECEIVED', message: msg, fromLoggedInUser: true });
            }
          }

          // In agent chat: after adding the sent message, add a streaming bubble placeholder.
          // The streaming bubble (run_started type) shows "Thinking..." while the AI generates a response.
          if (opts.isAgentChat && currentState.messages.length > 0) {
            const chatId = msg.getReceiverId();
            const msgId = msg.getId() || Date.now();
            startStreamingMessage(chatId, msgId);

            const agentUser = user;
            if (agentUser) {
              const streamingMsg = createStreamingMessage({
                originalMessageId: msgId,
                sender: agentUser,
                receiver: loggedInUser,
                chatId,
              });

              dispatch({
                type: 'ADD_STREAMING_BUBBLE',
                message: streamingMsg,
              });

              // Force scroll to bottom so the "Thinking..." bubble is visible
              dispatch({ type: 'SET_AT_BOTTOM', isAtBottom: true });
            }
          }

          // Auto-scroll if at bottom
          if (currentState.isAtBottom && currentState.hasReachedLatest) {
            dispatch({ type: 'SET_AT_BOTTOM', isAtBottom: true });
          }

          // Clear unread state when the user sends a message
          if (currentState.markedUnreadByUser) {
            refs.managerRef.current?.markConversationAsRead().catch(() => {
              /* non-fatal */
            });
            dispatch({ type: 'SET_MARKED_UNREAD_BY_USER', value: false });
            dispatch({ type: 'SET_UNREAD_COUNT', count: 0 });
            dispatch({ type: 'SET_CONVERSATION_READ' });
          }

          break;
        }

        // --- UI Events: message edited by local composer ---
        // Only react to 'success' status (the confirmed edit from the SDK).
        // 'inprogress' means the composer entered edit mode — no list update needed.
        // 'error'/'cancelled' means the edit failed or was cancelled — no list update.
        case 'ui:compose/edit': {
          if (event.status !== CometChatMessageStatus.success) break;
          const msg = event.message;
          dispatch({ type: 'MESSAGE_EDITED', message: msg });

          // Edit-mention (my OWN edit, same device) — editing my reply to (re)mention
          // me subscribes me to the parent. My own edit publishes ui:compose/edit
          // (someone else's arrives as message/edited over the socket), so the same
          // reconciliation must run here too. Own authorship alone doesn't re-subscribe
          // on an edit (ownAuthorshipSubscribes:false) — only the mention does.
          // isThreadReplyForConversation includes my own messages (receiver match) and
          // is false for top-level, so a top-level edit-mention never subscribes.
          if (isThreadReplyForConversation(msg, user, group)) {
            applyIncomingReplySubscription({
              reply: msg,
              parentMessage,
              loggedInUserUid: loggedInUser.getUid(),
              publish,
              ownAuthorshipSubscribes: false,
            });
          }
          break;
        }

        // --- UI Events: group actions performed locally (from GroupMembers component) ---
        case 'ui:group/member-added':
        case 'ui:group/member-kicked':
        case 'ui:group/member-banned':
        case 'ui:group/member-unbanned':
        case 'ui:group/member-scope-changed':
        case 'ui:group/left': {
          // Only handle if this is the same group
          // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
          if (!group || event.group.getGuid() !== group.getGuid()) break;
          if (parentMessageId) break; // Don't add action messages in thread mode

          // Update group reference
          refs.groupRef.current = event.group;
          dispatch({ type: 'UPDATE_GROUP_REFERENCE', group: event.group });

          // Add action message(s) to the list.
          if (event.type === 'ui:group/member-added') {
            for (const actionMsg of event.messages) {
              dispatch({
                type: 'MESSAGE_RECEIVED',
                message: actionMsg as CometChat.BaseMessage,
                isLocalGroupAction: true,
              });
            }
          } else if ('message' in event) {
            const msg = event.message as CometChat.BaseMessage;
            dispatch({
              type: 'MESSAGE_RECEIVED',
              message: msg,
              isLocalGroupAction: true,
            });
          }

          // Scroll behavior
          if (scrollToBottomOnNewMessages || currentState.isAtBottom) {
            dispatch({ type: 'SET_AT_BOTTOM', isAtBottom: true });
          }
          break;
        }

        // --- UI Events: group ownership changed ---
        case 'ui:group/ownership-changed': {
          // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
          if (!group || event.group.getGuid() !== group.getGuid()) break;
          refs.groupRef.current = event.group;
          dispatch({ type: 'UPDATE_GROUP_REFERENCE', group: event.group });
          break;
        }

        // --- UI Events: call actions performed locally ---
        case 'ui:call/outgoing':
        case 'ui:call/accepted':
        case 'ui:call/rejected': {
          const call = event.call;
          if (
            isMessageForConversation(call, user, group, parentMessageId, loggedInUser.getUid(), {
              excludeSender: false,
            })
          ) {
            dispatch({ type: 'MESSAGE_RECEIVED', message: call });
          }
          break;
        }

        case 'ui:call/ended': {
          if (event.call) {
            const call = event.call;
            if (
              isMessageForConversation(call, user, group, parentMessageId, loggedInUser.getUid(), {
                excludeSender: false,
              })
            ) {
              dispatch({ type: 'MESSAGE_RECEIVED', message: call });
            }
          }
          break;
        }

        default:
          break;
      }
    },
    [
      user?.getUid(),
      group?.getGuid(),
      parentMessageId,
      loggedInUser.getUid(),
      disableSoundForMessages,
      customSoundForMessages,
      scrollToBottomOnNewMessages,
      hideReceipts,
    ]
  );

  // Subscribe to streaming state changes.
  const chatId = user?.getUid() ?? group?.getGuid() ?? '';
  const wasStreamingRef = useRef(false);
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToStreamState(chatId, () => {
      const state = getStreamState(chatId);
      const isCurrentlyStreaming = state.hasStarted && !state.isComplete;

      // process pending messages whenever streaming transitions from
      // active → inactive (whether by run_finished setting isComplete=true, or by
      // stopStreamingMessage deleting the state entirely).
      if (wasStreamingRef.current && !isCurrentlyStreaming) {
        const pendingMap = refs.pendingMessagesMap;
        if (Object.keys(pendingMap).length > 0) {
          dispatch({ type: 'PROCESS_PENDING_MESSAGES', pendingMessagesMap: pendingMap });
          refs.pendingMessagesMap = {};
        }
        // If no pending SDK messages, the streaming bubble keeps its own
        // snapshotted text (handled inside CometChatStreamMessageBubble).
      }

      wasStreamingRef.current = isCurrentlyStreaming;
    });

    return () => {
      unsubscribe();
      refs.pendingMessagesMap = {};
    };
  }, [chatId, dispatch, refs]);
}
