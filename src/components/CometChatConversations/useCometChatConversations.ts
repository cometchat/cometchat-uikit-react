/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-type-conversion */
import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationsManager } from './CometChatConversationsManager';
import { conversationsReducer, initialConversationsState } from './CometChatConversations.reducer';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import type {
  CometChatUseCometChatConversationsOptions,
  CometChatUseCometChatConversationsReturn,
} from './CometChatConversations.types';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { useCometChatConversationsEvents } from './useCometChatConversationsEvents';
import { usePublishEvent } from '../../hooks/usePublishEvent';

/**
 * useCometChatConversations — orchestration hook for the conversations list data layer.
 *
 * Creates the Manager, attaches SDK listeners, dispatches reducer actions,
 * and exposes a clean API to the Provider.
 */
export function useCometChatConversations(
  options: CometChatUseCometChatConversationsOptions = {}
): CometChatUseCometChatConversationsReturn {
  const {
    conversationsRequestBuilder,
    searchRequestBuilder,
    searchKeyword = '',
    hideUserStatus = false,
    disableSoundForMessages = false,
    customSoundForMessages,
    selectionMode = 'none',
    activeConversation,
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  } = options;

  const [state, dispatch] = useReducer(conversationsReducer, initialConversationsState);
  const managerRef = useRef<CometChatConversationsManager | null>(null);
  const fetchIdRef = useRef<string>('');
  const instanceId = useId();
  const anchorIndexRef = useRef<number | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [conversationToBeDeleted, setConversationToBeDeleted] =
    useState<CometChat.Conversation | null>(null);
  const publish = usePublishEvent();

  // --- Get logged-in user ---
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(user => {
        if (user) {
          setLoggedInUserId(user.getUid());
        }
      })
      .catch(() => {
        // Silently fail — receipts just won't show
      });
  }, []);

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      if (onError) onError(error as CometChat.CometChatException);
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'FETCH_ERROR', error: message });
    },
    [onError]
  );

  // --- Build request builder with search ---
  const buildRequestBuilder = useCallback(
    (search: string): CometChat.ConversationsRequestBuilder => {
      let builder: CometChat.ConversationsRequestBuilder;

      if (search && searchRequestBuilder) {
        builder = searchRequestBuilder;
      } else if (conversationsRequestBuilder) {
        builder = conversationsRequestBuilder;
      } else {
        builder = new CometChat.ConversationsRequestBuilder().setLimit(30);
      }

      return builder;
    },
    [conversationsRequestBuilder, searchRequestBuilder]
  );

  // --- Fetch next page ---
  const fetchNext = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.fetchState === 'loading') return;

    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'FETCH_START' });

    try {
      const conversations = await managerRef.current.fetchNext();
      // Guard against stale fetches
      if (fetchIdRef.current !== currentFetchId) return;

      const hasMore = conversations.length > 0;
      dispatch({ type: 'FETCH_SUCCESS', conversations, hasMore });

      // Emit onEmpty if first fetch returned no results
      if (!hasMore && state.conversations.length === 0) {
        onEmpty?.();
      }
    } catch (error: unknown) {
      if (fetchIdRef.current !== currentFetchId) return;
      handleError(error);
    }
  }, [state.hasMore, state.fetchState, state.conversations.length, handleError, onEmpty]);

  // --- Initialize Manager + first fetch ---
  const initializeAndFetch = useCallback(
    (search: string) => {
      const builder = buildRequestBuilder(search);
      managerRef.current = new CometChatConversationsManager(builder);
      dispatch({ type: 'RESET' });
      // Trigger fetch after reset
      const currentFetchId = `fetch_${String(Date.now())}`;
      fetchIdRef.current = currentFetchId;
      dispatch({ type: 'FETCH_START' });

      managerRef.current
        .fetchNext()
        .then(conversations => {
          if (fetchIdRef.current !== currentFetchId) return;
          const hasMore = conversations.length > 0;
          dispatch({ type: 'FETCH_SUCCESS', conversations, hasMore });
          if (!hasMore) onEmpty?.();
        })
        .catch((error: unknown) => {
          if (fetchIdRef.current !== currentFetchId) return;
          handleError(error);
        });
    },
    [buildRequestBuilder, handleError, onEmpty]
  );

  // --- Initial fetch on mount and when builders change ---
  useEffect(() => {
    initializeAndFetch(searchKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsRequestBuilder, searchRequestBuilder, searchKeyword]);

  // --- Set search text (triggers re-fetch) ---
  const setSearchText = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_SEARCH_TEXT', searchText: text });
      initializeAndFetch(text);
    },
    [initializeAndFetch]
  );

  // --- Ref to hold current conversations for use in event handlers without re-attaching listeners ---
  const conversationsRef = useRef(state.conversations);
  conversationsRef.current = state.conversations;

  // --- Message listener (real-time updates) ---
  useEffect(() => {
    const listenerId = `CometChatConversations_msg_${instanceId}`;

    /**
     * Determines whether a message should be hidden from this conversation list
     * based on the request builder's agentic filters (onlyAgentic / hideAgentic).
     */
    const shouldHideMessage = (message: CometChat.BaseMessage): boolean => {
      const builder = conversationsRequestBuilder;
      if (!builder) return false;

      const builtRequest = builder.build();
      const isOnlyAgentic = builtRequest.getOnlyAgentic?.() || false;
      const isHideAgentic = builtRequest.getHideAgentic?.() || false;

      if (!isOnlyAgentic && !isHideAgentic) return false;

      const messageReceiverType = message.getReceiverType();

      if (messageReceiverType === 'group') {
        // Group messages are never agentic — hide them from onlyAgentic lists
        if (isOnlyAgentic) return true;
      } else {
        const messageReceiver = message.getReceiver() as CometChat.User;
        const messageSender = message.getSender();
        const senderRole = messageSender?.getRole?.() ?? '';
        const receiverRole = messageReceiver?.getRole?.() ?? '';
        const isAgenticConversation = senderRole === '@agentic' || receiverRole === '@agentic';

        if (isOnlyAgentic && !isAgenticConversation) return true;
        if (isHideAgentic && isAgenticConversation) return true;
      }

      return false;
    };

    const handleNewMessage = (message: CometChat.BaseMessage) => {
      if (shouldHideMessage(message)) return;

      // Check if this message should update the conversation (respects dashboard settings)
      if (!CometChatConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
        return;
      }

      // Mark as delivered for messages from other users (v6 parity)
      const senderUid = message.getSender?.()?.getUid?.();
      if (
        senderUid &&
        loggedInUserId &&
        senderUid !== loggedInUserId &&
        !message.getDeliveredAt()
      ) {
        CometChat.markAsDelivered(message).catch(() => {
          /* non-fatal */
        });
      }

      CometChat.CometChatHelper.getConversationFromMessage(message)
        .then((conversation: CometChat.Conversation) => {
          // Increment unread count if message is from someone else
          const senderUid = message.getSender?.()?.getUid?.();
          if (senderUid && loggedInUserId && senderUid !== loggedInUserId && !message.getReadAt()) {
            const convId = conversation.getConversationId();
            const existingConv = conversationsRef.current.find(
              c => c.getConversationId() === convId
            );
            const baseCount = existingConv
              ? (existingConv.getUnreadMessageCount() ?? 0)
              : (conversation.getUnreadMessageCount() ?? 0);
            conversation.setUnreadMessageCount(baseCount + 1);

            if (!disableSoundForMessages) {
              CometChatSoundManager.play('incomingMessage', customSoundForMessages);
            }
          }
          dispatch({ type: 'MOVE_TO_TOP', conversation });
        })
        .catch(() => {
          CometChatLogger.warn('CometChatConversations', 'Failed to get conversation from message');
        });
    };

    const handleReceiptUpdate = (receipt: CometChat.MessageReceipt, isRead: boolean) => {
      const messageId = receipt.getMessageId?.();
      if (!messageId) return;

      // Use ref to get the latest conversations without re-attaching the listener
      const currentConversations = conversationsRef.current;

      const targetIdx = currentConversations.findIndex(c => {
        const lastMsg = c.getLastMessage();
        return lastMsg && String(lastMsg.getId()) === String(messageId);
      });

      if (targetIdx === -1) return;

      const targetConv = currentConversations[targetIdx]!;
      const lastMsg = targetConv.getLastMessage();
      if (!lastMsg) return;

      // Update the receipt status on the message object
      if (isRead) {
        lastMsg.setReadAt(receipt.getReadAt());
        targetConv.setUnreadMessageCount(0);
      } else {
        lastMsg.setDeliveredAt(receipt.getDeliveredAt());
      }

      // Dispatch to force re-render with new array reference
      dispatch({ type: 'UPDATE_CONVERSATION', conversation: targetConv });
    };

    const cleanup = CometChatConversationsManager.attachMessageListener(listenerId, {
      onTextMessageReceived: handleNewMessage,
      onMediaMessageReceived: handleNewMessage,
      onCustomMessageReceived: handleNewMessage,
      onCardMessageReceived: handleNewMessage,
      onMessageEdited: (message: CometChat.BaseMessage) => {
        CometChat.CometChatHelper.getConversationFromMessage(message)
          .then((conversation: CometChat.Conversation) => {
            dispatch({ type: 'UPDATE_CONVERSATION', conversation });
          })
          .catch(() => {
            /* skip */
          });
      },
      onMessageDeleted: (message: CometChat.BaseMessage) => {
        CometChat.CometChatHelper.getConversationFromMessage(message)
          .then((conversation: CometChat.Conversation) => {
            dispatch({ type: 'UPDATE_CONVERSATION', conversation });
          })
          .catch(() => {
            /* skip */
          });
      },
      onMessagesDelivered: (receipt: CometChat.MessageReceipt) => {
        if (receipt.getReceiverType() === 'user') {
          handleReceiptUpdate(receipt, false);
        }
      },
      onMessagesRead: (receipt: CometChat.MessageReceipt) => {
        if (receipt.getReceiverType() === 'user') {
          handleReceiptUpdate(receipt, true);
        }
      },
      onMessagesDeliveredToAll: (receipt: CometChat.MessageReceipt) => {
        handleReceiptUpdate(receipt, false);
      },
      onMessagesReadByAll: (receipt: CometChat.MessageReceipt) => {
        handleReceiptUpdate(receipt, true);
      },
    });

    return cleanup;
  }, [
    instanceId,
    loggedInUserId,
    disableSoundForMessages,
    customSoundForMessages,
    conversationsRequestBuilder,
  ]);

  // --- User status listener ---
  useEffect(() => {
    if (hideUserStatus) return;

    const listenerId = `CometChatConversations_user_${instanceId}`;
    const cleanup = CometChatConversationsManager.attachUserStatusListener(listenerId, {
      onUserOnline: (user: CometChat.User) => {
        const uid = user.getUid();
        const conv = conversationsRef.current.find(c => {
          const convWith = c.getConversationWith();
          return convWith && 'getUid' in convWith && convWith.getUid() === uid;
        });
        if (conv) {
          const convUser = conv.getConversationWith() as CometChat.User;
          if (convUser.getBlockedByMe?.() || convUser.getHasBlockedMe?.()) return;
          convUser.setStatus('online');
          dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
        }
      },
      onUserOffline: (user: CometChat.User) => {
        const uid = user.getUid();
        const conv = conversationsRef.current.find(c => {
          const convWith = c.getConversationWith();
          return convWith && 'getUid' in convWith && convWith.getUid() === uid;
        });
        if (conv) {
          const convUser = conv.getConversationWith() as CometChat.User;
          if (convUser.getBlockedByMe?.() || convUser.getHasBlockedMe?.()) return;
          convUser.setStatus('offline');
          dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
        }
      },
    });

    return cleanup;
  }, [instanceId, hideUserStatus]);

  // --- Group listener ---
  useEffect(() => {
    const listenerId = `CometChatConversations_group_${instanceId}`;
    const cleanup = CometChatConversationsManager.attachGroupListener(listenerId, {
      onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
        // If logged-in user joined (or created) a group, add the conversation to the top
        if (loggedInUserId && joinedUser.getUid() === loggedInUserId) {
          CometChat.getConversation(joinedGroup.getGuid(), 'group')
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'ADD_CONVERSATION', conversation });
            })
            .catch(() => {
              /* skip */
            });
        } else {
          // Another user joined — update the conversation's last message (action message)
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
      onGroupMemberLeft: (message, leavingUser, group) => {
        if (loggedInUserId && leavingUser.getUid() === loggedInUserId) {
          const convId = `group_${group.getGuid()}`;
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
        } else {
          // Another user left — update the conversation's last message
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
      onGroupMemberKicked: (message, kickedUser, _kickedBy, kickedFrom) => {
        if (loggedInUserId && kickedUser.getUid() === loggedInUserId) {
          const convId = `group_${kickedFrom.getGuid()}`;
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
        } else {
          // Another user was kicked — update the conversation's last message
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
      onGroupMemberBanned: (message, bannedUser, _bannedBy, bannedFrom) => {
        if (loggedInUserId && bannedUser.getUid() === loggedInUserId) {
          const convId = `group_${bannedFrom.getGuid()}`;
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
        } else {
          // Another user was banned — update the conversation's last message
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
      onMemberAddedToGroup: (message, _addedBy, addedUser, addedTo) => {
        // If the logged-in user was added to a group, add the conversation to the top
        if (loggedInUserId && addedUser.getUid() === loggedInUserId) {
          CometChat.getConversation(addedTo.getGuid(), 'group')
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'ADD_CONVERSATION', conversation });
            })
            .catch(() => {
              /* skip */
            });
        } else {
          // Another user was added — update the conversation's last message (action message)
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
    });

    return cleanup;
  }, [instanceId, loggedInUserId]);

  // --- Connection recovery ---
  useEffect(() => {
    const listenerId = `CometChatConversations_conn_${instanceId}`;
    const cleanup = CometChatConversationsManager.attachConnectionListener(listenerId, {
      onConnected: () => {
        CometChatLogger.info(
          'CometChatConversations',
          'Connection recovered, re-fetching conversations'
        );
        initializeAndFetch(state.searchText);
      },
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, initializeAndFetch]);

  // --- Active conversation sync ---
  useEffect(() => {
    const convId = activeConversation?.getConversationId() ?? null;
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', conversationId: convId });
  }, [activeConversation]);

  // --- UI Events subscription (cross-component communication) ---
  useCometChatConversationsEvents({
    dispatch,
    conversationsRef,
    loggedInUserId,
  });

  // --- Selection actions ---
  const selectConversation = useCallback(
    (conversation: CometChat.Conversation) => {
      dispatch({ type: 'SELECT_CONVERSATION', conversation });
      onSelect?.(conversation, true);
    },
    [onSelect]
  );

  const deselectConversation = useCallback(
    (conversationId: string) => {
      const conversation = state.selectedConversationsMap.get(conversationId);
      dispatch({ type: 'DESELECT_CONVERSATION', conversationId });
      if (conversation) onSelect?.(conversation, false);
    },
    [onSelect, state.selectedConversationsMap]
  );

  const selectRange = useCallback(
    (conversations: CometChat.Conversation[]) => {
      dispatch({ type: 'SELECT_RANGE', conversations });
      conversations.forEach(c => {
        if (!state.selectedConversationIds.includes(c.getConversationId())) {
          onSelect?.(c, true);
        }
      });
    },
    [onSelect, state.selectedConversationIds]
  );

  const deselectRange = useCallback(
    (conversationIds: string[]) => {
      conversationIds.forEach(id => {
        const conversation = state.selectedConversationsMap.get(id);
        if (conversation) onSelect?.(conversation, false);
      });
      dispatch({ type: 'DESELECT_RANGE', conversationIds });
    },
    [onSelect, state.selectedConversationsMap]
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', conversationId });
  }, []);

  // --- Delete conversation ---
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      const conversation = state.conversations.find(c => c.getConversationId() === conversationId);
      if (!conversation) return;

      const conversationWith = conversation.getConversationWith();
      const conversationType = conversation.getConversationType();

      let conversationWithId: string;
      if (conversationType === 'user') {
        conversationWithId = (conversationWith as CometChat.User).getUid();
      } else {
        conversationWithId = (conversationWith as CometChat.Group).getGuid();
      }

      try {
        await CometChatConversationsManager.deleteConversation(
          conversationWithId,
          conversationType
        );
        dispatch({ type: 'REMOVE_CONVERSATION', conversationId });
        publish({ type: 'ui:conversation/deleted', conversation });
      } catch (error: unknown) {
        handleError(error);
      }
    },
    [state.conversations, publish, handleError]
  );

  // --- Handle item click with selection logic ---
  const handleItemClick = useCallback(
    (conversation: CometChat.Conversation, event?: { shiftKey?: boolean }) => {
      const convId = conversation.getConversationId();
      const clickedIndex = state.conversations.findIndex(c => c.getConversationId() === convId);
      const isShiftClick = event?.shiftKey === true;

      if (selectionMode === 'multiple') {
        if (isShiftClick && anchorIndexRef.current !== null) {
          // Shift-click range selection
          const anchorIndex = anchorIndexRef.current;
          const startIndex = Math.min(anchorIndex, clickedIndex);
          const endIndex = Math.max(anchorIndex, clickedIndex);
          const conversationsInRange = state.conversations.slice(startIndex, endIndex + 1);
          selectRange(conversationsInRange);
        } else {
          // Regular click: toggle individual, set as anchor
          anchorIndexRef.current = clickedIndex;

          if (state.selectedConversationIds.includes(convId)) {
            deselectConversation(convId);
          } else {
            selectConversation(conversation);
          }
        }
      } else if (selectionMode === 'single') {
        // Single selection: clear previous, select new
        if (!state.selectedConversationIds.includes(convId)) {
          dispatch({ type: 'CLEAR_SELECTION' });
          selectConversation(conversation);
        }
      }

      onItemClick?.(conversation);
    },
    [
      state.conversations,
      state.selectedConversationIds,
      selectionMode,
      selectConversation,
      deselectConversation,
      selectRange,
      onItemClick,
    ]
  );

  return {
    // State
    conversations: state.conversations,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    error: state.error,
    selectedConversationIds: state.selectedConversationIds,
    selectedConversationsMap: state.selectedConversationsMap,
    activeConversationId: state.activeConversationId,
    searchText: state.searchText,
    typingIndicatorMap: state.typingIndicatorMap,
    loggedInUserId,
    // Actions
    fetchNext,
    setSearchText,
    selectConversation,
    deselectConversation,
    selectRange,
    deselectRange,
    clearSelection,
    setActiveConversation,
    handleItemClick,
    deleteConversation,
    setConversationToBeDeleted,
    conversationToBeDeleted,
  };
}
