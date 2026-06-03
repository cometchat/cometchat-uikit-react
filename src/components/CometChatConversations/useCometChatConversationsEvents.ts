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

export interface UseCometChatConversationsEventsOptions {
  dispatch: React.Dispatch<CometChatConversationsAction>;
  conversationsRef: React.RefObject<CometChat.Conversation[]>;
  loggedInUserId: string | null;
}

export function useCometChatConversationsEvents(
  options: UseCometChatConversationsEventsOptions
): void {
  const { dispatch, conversationsRef, loggedInUserId } = options;

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
