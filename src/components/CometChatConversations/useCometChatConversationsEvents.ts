/**
 * useCometChatConversationsEvents — UI event subscriptions for the conversations list.
 *
 * Subscribes to UI events published by other components (composer, message list,
 * group members, etc.) and dispatches the appropriate reducer actions to keep
 * the conversations list in sync.
 *
 * This mirrors to CometChatMessageEvents, CometChatGroupEvents,
 * CometChatUserEvents, CometChatCallEvents, and CometChatConversationEvents.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import type { CometChatConversationsAction } from './CometChatConversations.reducer';
import { CometChatConversationsManager } from './CometChatConversationsManager';
import { isOfflineOn } from '../../utils/offline/gate';
import { foldOntoListedRow, receiverKeyOf, rowFromMessageOffline } from './conversationsOffline';

export interface UseCometChatConversationsEventsOptions {
  dispatch: React.Dispatch<CometChatConversationsAction>;
  conversationsRef: React.RefObject<CometChat.Conversation[]>;
  loggedInUserId: string | null;
  /**
   * Offline (ON) handler for a pin/unpin from another device, an admin or the
   * sweep: matched by (type, with), may fetch a chat not on screen (UIK-CONV-01).
   */
  onRemotePinEvent?: (conversation: CometChat.Conversation, pinned: boolean) => void;
}

export function useCometChatConversationsEvents(
  options: UseCometChatConversationsEventsOptions
): void {
  const { dispatch, conversationsRef, loggedInUserId, onRemotePinEvent } = options;

  /**
   * Offline (ON) path of an acked own send. The SDK's copy may have no receiver,
   * so the row is never rebuilt from it alone (see {@link rowFromMessageOffline}).
   * A chat not listed yet (a first message) is asked for by its receiver.
   */
  const placeSentMessageOffline = (message: CometChat.BaseMessage) => {
    rowFromMessageOffline(message, conversationsRef.current)
      .then(async row => {
        if (row) return row;
        const key = receiverKeyOf(message);
        if (!key) return null;
        return CometChat.getConversation(message.getReceiverId(), key.type);
      })
      .then(fetched => {
        if (!fetched) return;
        // An own ack never touches a listed chat's unread count (it may land in a
        // chat the user is not viewing) and never replaces a newer preview (R7).
        const conversation = foldOntoListedRow(fetched, message, conversationsRef.current, 0);
        if (!conversation) return;
        dispatch({ type: 'MOVE_TO_TOP', conversation });
      })
      .catch(() => {
        /* skip */
      });
  };

  /** Offline (ON) path of an update to a chat that is listed; others are not this list's. */
  const updateRowOffline = (
    message: CometChat.BaseMessage,
    adjust?: (row: CometChat.Conversation) => void
  ) => {
    rowFromMessageOffline(message, conversationsRef.current)
      .then(conversation => {
        if (!conversation) return;
        adjust?.(conversation);
        dispatch({ type: 'UPDATE_CONVERSATION', conversation });
      })
      .catch(() => {
        /* skip */
      });
  };

  useCometChatEvents(
    (event: CometChatEvent) => {
      switch (event.type) {
        // =====================================================================
        // Active chat changed — track fresh chat state (no messages yet)
        // =====================================================================

        case 'ui:active-chat/changed': {
          // the conversation might not exist yet (disable delete chat, etc.)
          // We don't clear unread count here — that's handled by ui:conversation/read.
          break;
        }

        // =====================================================================
        // Message UI Events
        // =====================================================================

        case 'ui:message/sent': {
          if (event.status !== CometChatMessageStatus.success) break;
          const msg = event.message;
          if (!CometChatConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(msg)) {
            break;
          }
          if (isOfflineOn()) {
            placeSentMessageOffline(msg);
            break;
          }
          CometChat.CometChatHelper.getConversationFromMessage(msg)
            .then((conversation: CometChat.Conversation) => {
              // Reset unread count — user just sent a message in this conversation
              conversation.setUnreadMessageCount(0);
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
          break;
        }

        case 'ui:compose/edit': {
          if (event.status !== CometChatMessageStatus.success) break;
          const msg = event.message;
          if (isOfflineOn()) {
            updateRowOffline(msg);
            break;
          }
          CometChat.CometChatHelper.getConversationFromMessage(msg)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'UPDATE_CONVERSATION', conversation });
            })
            .catch(() => {
              /* skip */
            });
          break;
        }

        case 'ui:message/deleted': {
          const msg = event.message;
          if (isOfflineOn()) {
            updateRowOffline(msg);
            break;
          }
          CometChat.CometChatHelper.getConversationFromMessage(msg)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'UPDATE_CONVERSATION', conversation });
            })
            .catch(() => {
              /* skip */
            });
          break;
        }

        case 'ui:message/read': {
          const msg = event.message;
          if (isOfflineOn()) {
            updateRowOffline(msg, row => {
              row.setUnreadMessageCount(0);
            });
            break;
          }
          CometChat.CometChatHelper.getConversationFromMessage(msg)
            .then((conversation: CometChat.Conversation) => {
              conversation.setUnreadMessageCount(0);
              dispatch({ type: 'UPDATE_CONVERSATION', conversation });
            })
            .catch(() => {
              /* skip */
            });
          break;
        }

        // =====================================================================
        // Conversation UI Events
        // =====================================================================

        // Pin/unpin — from another device, from an admin, or this tab's own
        // optimistic flip. All three are idempotent: the reducer reads the state
        // off the conversation rather than toggling.
        case 'conversation/pinned':
        case 'conversation/unpinned':
          // Offline (ON): matched by (type, with); a chat not on screen is
          // fetched and inserted (UIK-CONV-01). Read the gate per event.
          if (onRemotePinEvent && isOfflineOn()) {
            onRemotePinEvent(event.conversation, event.type === 'conversation/pinned');
            break;
          }
          dispatch({ type: 'CONVERSATION_PIN_CHANGED', conversation: event.conversation });
          break;
        case 'ui:conversation/pin-changed': {
          dispatch({ type: 'CONVERSATION_PIN_CHANGED', conversation: event.conversation });
          break;
        }

        case 'ui:conversation/updated': {
          dispatch({ type: 'UPDATE_CONVERSATION', conversation: event.conversation });
          break;
        }

        case 'ui:conversation/read': {
          dispatch({ type: 'RESET_UNREAD_COUNT', conversationId: event.conversationId });
          break;
        }

        case 'ui:conversation/deleted': {
          const convId = event.conversation.getConversationId();
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
          break;
        }

        // =====================================================================
        // Group UI Events
        // =====================================================================

        case 'ui:group/created': {
          CometChat.getConversation(event.group.getGuid(), 'group')
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'ADD_CONVERSATION', conversation });
            })
            .catch(() => {
              /* skip */
            });
          break;
        }

        case 'ui:group/deleted': {
          const convId = `group_${event.group.getGuid()}`;
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
          break;
        }

        case 'ui:group/left': {
          const convId = `group_${event.group.getGuid()}`;
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
          break;
        }

        case 'ui:group/member-added': {
          // Use the last action message to update last message and place at top
          const lastActionMsg = event.messages[event.messages.length - 1];
          if (lastActionMsg) {
            dispatch({
              type: 'UPDATE_LAST_MESSAGE_AND_PLACE_AT_TOP',
              message: lastActionMsg as CometChat.BaseMessage,
              group: event.group,
            });
          }
          break;
        }

        case 'ui:group/member-kicked':
        case 'ui:group/member-banned': {
          // Use the action message to update last message and place at top
          const actionMsg = event.message as CometChat.BaseMessage;
          dispatch({
            type: 'UPDATE_LAST_MESSAGE_AND_PLACE_AT_TOP',
            message: actionMsg,
            group: event.group,
          });
          break;
        }

        case 'ui:group/member-unbanned': {
          // Unban action message — update last message and place at top
          if (event.message) {
            dispatch({
              type: 'UPDATE_LAST_MESSAGE_AND_PLACE_AT_TOP',
              message: event.message as CometChat.BaseMessage,
              group: event.group,
            });
          }
          break;
        }

        case 'ui:group/member-scope-changed': {
          const scopeActionMsg = event.message as CometChat.BaseMessage;
          dispatch({
            type: 'UPDATE_LAST_MESSAGE_AND_PLACE_AT_TOP',
            message: scopeActionMsg,
            group: event.group,
          });
          break;
        }

        case 'ui:group/member-joined': {
          CometChat.getConversation(event.joinedGroup.getGuid(), 'group')
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
          break;
        }

        // =====================================================================
        // User UI Events
        // =====================================================================

        case 'ui:user/blocked': {
          const blockedUid = event.user.getUid();
          const convId = `user_${blockedUid}`;
          // Remove the conversation for the blocked user
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
          break;
        }

        case 'ui:user/unblocked': {
          // Update the conversation if it exists
          const unblockedUid = event.user.getUid();
          const conversations = conversationsRef.current;
          const target = conversations.find(c => {
            const convWith = c.getConversationWith();
            return 'getUid' in convWith && convWith.getUid() === unblockedUid;
          });
          if (target) {
            dispatch({ type: 'UPDATE_CONVERSATION', conversation: target });
          }
          break;
        }

        // =====================================================================
        // Call UI Events
        // =====================================================================

        case 'ui:call/outgoing':
        case 'ui:call/accepted':
        case 'ui:call/rejected': {
          const call = event.call;
          CometChat.CometChatHelper.getConversationFromMessage(call)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
          break;
        }

        case 'ui:call/ended': {
          const endedCall = event.call;
          if (endedCall) {
            CometChat.CometChatHelper.getConversationFromMessage(endedCall)
              .then((conversation: CometChat.Conversation) => {
                dispatch({ type: 'MOVE_TO_TOP', conversation });
              })
              .catch(() => {
                /* skip */
              });
          }
          break;
        }

        // =====================================================================
        // Call SDK Events (real-time from other participants)
        // =====================================================================

        case 'call/incoming':
        case 'call/accepted':
        case 'call/rejected':
        case 'call/cancelled':
        case 'call/ended': {
          const call = event.call;
          if (
            !CometChatConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(
              call as unknown as CometChat.BaseMessage
            )
          ) {
            break;
          }
          CometChat.CometChatHelper.getConversationFromMessage(call)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
          break;
        }

        case 'typing/started': {
          const indicator = event.indicator;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const senderUid = indicator.getSender()?.getUid() ?? '';
          if (senderUid === loggedInUserId) break; // Ignore own typing
          const receiverType = indicator.getReceiverType();
          const id = receiverType === 'group' ? indicator.getReceiverId() : senderUid;
          if (id) {
            dispatch({ type: 'ADD_TYPING_INDICATOR', id, indicator });
          }
          break;
        }

        case 'typing/ended': {
          const indicator = event.indicator;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const senderUid = indicator.getSender()?.getUid() ?? '';
          if (senderUid === loggedInUserId) break;
          const receiverType = indicator.getReceiverType();
          const id = receiverType === 'group' ? indicator.getReceiverId() : senderUid;
          if (id) {
            dispatch({ type: 'REMOVE_TYPING_INDICATOR', id });
          }
          break;
        }

        default:
          break;
      }
    },
    [loggedInUserId]
  );
}
