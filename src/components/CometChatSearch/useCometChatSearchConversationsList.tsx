import { JSX, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import { MessageReceiptUtils } from "../../utils/MessageReceiptUtils";
import { CometChatLocalize, getLocalizedString } from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatSearchFilter, MentionsTargetElement, MessageStatus, Placement, Receipts, States } from "../../Enums/Enums";
import { CometChatActionsIcon, CometChatOption } from "../../modals";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { isMissedCall } from "../Calling/Utils/utils";
import { CometChatDate } from "../BaseComponents/CometChatDate/CometChatDate";
import { PollsConstants } from "../Extensions/Polls/PollsConstants";
import { StickersConstants } from "../Extensions/Stickers/StickersConstants";
import { CollaborativeWhiteboardConstants } from "../Extensions/CollaborativeWhiteboard/CollaborativeWhiteboardConstants";
import { CollaborativeDocumentConstants } from "../Extensions/CollaborativeDocument/CollaborativeDocumentConstants";
import { CometChatContextMenu } from "../BaseComponents/CometChatContextMenu/CometChatContextMenu";
import { getThemeMode, isURL, sanitizeCalendarObject, encryptName } from "../../utils/util";
import { ChatConfigurator } from "../../utils/ChatConfigurator";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import { CometChatCallEvents } from "../../events/CometChatCallEvents";
import { CometChatMessageEvents } from "../../events/CometChatMessageEvents";
import { CometChatConversationEvents } from "../../events/CometChatConversationEvents";
import { CometChatGroupEvents } from "../../events/CometChatGroupEvents";
import { CometChatUserEvents } from "../../events/CometChatUserEvents";
import { CometChatUIKit } from "../../CometChatUIKit/CometChatUIKit";
import { SearchConversationsManager } from "./SearchConversationsManager";
import { CalendarObject } from "../../utils/CalendarObject";
import { CometChatUIKitUtility } from "../../CometChatUIKit/CometChatUIKitUtility";
import { MessageUtils } from "../../utils/MessageUtils";

type Message =
  | CometChat.TextMessage
  | CometChat.MediaMessage
  | CometChat.CustomMessage
  | CometChat.Action
  | CometChat.Call;

/**
 * Interface for the hook props
 */
/**
 * Interface for the props used by the useCometChatSearchConversationsList hook.
 */
interface UseCometChatSearchConversationsListProps {
  /**
   * Search keyword used to filter the conversations.
   */
  searchKeyword?: string;

  /**
   * Optional request builder to customize the conversation query.
   */
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder | null;

  /**
   * Callback function triggered when a conversation item is clicked.
   * @param conversation - The selected conversation.
   * @param searchKeyword - The keyword used during the search (optional).
   */
  onItemClick?: (conversation: CometChat.Conversation, searchKeyword?: string) => void;

  /**
   * Custom renderer for each conversation item.
   * @param conversation - The current conversation.
   */
  itemView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Custom JSX element to display at the start (leading view) of a conversation item.
   * @param conversation - The current conversation.
   */
  leadingView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Custom JSX element to display the title of a conversation item.
   * @param conversation - The current conversation.
   */
  titleView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Custom JSX element to display the subtitle of a conversation item.
   * @param conversation - The current conversation.
   */
  subtitleView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Custom JSX element to display at the end (trailing view) of a conversation item.
   * @param conversation - The current conversation.
   */
  trailingView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Optional array of text formatters to customize conversation text display.
   */
  textFormatters?: CometChatTextFormatter[];

  /**
   * Format object for displaying timestamps of the last message.
   */
  lastMessageDateTimeFormat?: CalendarObject;

  /**
   * If true, message read receipts will be hidden.
   */
  hideReceipts?: boolean;

  /**
   * If true, user online/offline status indicators will be hidden.
   */
  hideUserStatus?: boolean;

  /**
   * If true, the group type icon will be hidden.
   */
  hideGroupType?: boolean;

  /**
   * Function to return available options for a conversation item (e.g., context menu actions).
   * @param conversation - The current conversation.
   */
  options?: ((conversation: CometChat.Conversation) => CometChatOption[]) | null;

  /**
   * Callback triggered when an error occurs during component behavior.
   * @param error - The CometChatException error object.
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * The currently active conversation to be visually highlighted.
   */
  activeConversation?: CometChat.Conversation | null;

  /**
   * Custom component displayed when there are no conversations.
   */
  emptyView?: JSX.Element;

  /**
   * Custom component displayed while the conversations list is loading.
   */
  loadingView?: JSX.Element;

  /**
   * Custom component displayed when an error occurs while fetching conversations.
   */
  errorView?: JSX.Element;

  /**
   * Text displayed on the "See More" button.
   */
  seeMoreButtonText?: string;

  /**
   * Whether to always show the "See More" button even when no more results are available.
   */
  alwaysShowSeeMore?: boolean;

  /**
   * Active filters applied to the search results.
   */
  activeFilters?: CometChatSearchFilter[];

  /**
   * Enables scroll-based pagination instead of a "See More" button.
   */
  useScrollPagination?: boolean;

  /**
   * If true, hides error UI even when an error occurs.
   */
  hideError?: boolean;

  /**
   * The logged-in user object.
   */
  loggedInUser?: CometChat.User | null;
}


/**
 * State interface for the hook
 */
interface State {
  conversationList: CometChat.Conversation[];
  fetchState: States;
  typingIndicatorMap: Map<string, CometChat.TypingIndicator>;
  hasMoreResults: boolean;
  conversationToBeDeleted: CometChat.Conversation | null;
}

/**
 * Action types for the reducer
 */

export type Action =
  | {
    type: "appendConversations";
    conversations: CometChat.Conversation[];
    removeOldConversation?: boolean;
  }
  | { type: "setConversationList"; conversationList: CometChat.Conversation[] }
  | { type: "setFetchState"; fetchState: States }
  | {
    type: "setConversationToBeDeleted";
    conversation: CometChat.Conversation | null;
  }
  | { type: "removeConversation"; conversation: CometChat.Conversation }
  | { type: "updateConversationWithUser"; user: CometChat.User }
  | {
    type: "fromUpdateConversationListFn";
    conversation: CometChat.Conversation;
  }
  | { type: "addTypingIndicator"; typingIndicator: CometChat.TypingIndicator }
  | {
    type: "removeTypingIndicator";
    typingIndicator: CometChat.TypingIndicator;
  }
  | { type: "updateConversationLastMessage"; message: CometChat.BaseMessage }
  | {
    type: "updateConversationLastMessageAndPlaceAtTheTop";
    message: CometChat.BaseMessage;
  }
  | {
    type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop";
    group: CometChat.Group;
    message: CometChat.Action;
  }
  | { type: "removeConversationOfTheGroup"; group: CometChat.Group }
  | { type: "removeConversationOfTheUser"; user: CometChat.User }
  | {
    type: "updateConversationLastMessageResetUnreadCountAndPlaceAtTheTop";
    message: CometChat.BaseMessage;
    conversation: CometChat.Conversation;
  }
  | {
    type: "resetUnreadCountAndSetReadAtIfLastMessage";
    message: CometChat.BaseMessage;
  }
  | {
    type: "setLastMessageReadOrDeliveredAt";
    updateReadAt: boolean;
    messageReceipt: CometChat.MessageReceipt;
  }
  | { type: "setHasMoreResults"; hasMoreResults: boolean };

/**
 * Checks if `message` is a base message
 */
function isAMessage(message: unknown): message is Message {
  return (
    message instanceof CometChat.TextMessage ||
    message instanceof CometChat.MediaMessage ||
    message instanceof CometChat.CustomMessage ||
    message instanceof CometChat.InteractiveMessage ||
    message instanceof CometChat.Action ||
    message instanceof CometChat.Call
  );
}

/**
 * Reducer function for state management
 */
function stateReducer(state: State, action: Action): State {
  let newState = state;
  const { type } = action;

  switch (type) {
    case "setConversationList": {
      const { typingIndicatorMap } = state;
      const { conversationList } = action;
      const newTypingIndicatorMap = new Map<string, CometChat.TypingIndicator>();

      for (let i = 0; i < conversationList.length; i++) {
        const convWith = conversationList[i].getConversationWith();
        const convWithId = convWith instanceof CometChat.User
          ? convWith?.getUid()
          : convWith.getGuid();

        if (typingIndicatorMap.has(convWithId)) {
          newTypingIndicatorMap.set(convWithId, typingIndicatorMap.get(convWithId)!);
        }
      }

      newState = {
        ...state,
        conversationList,
        typingIndicatorMap: newTypingIndicatorMap,
      };
      break;
    }

    case "appendConversations": {
      const newConversationList = [
        ...state.conversationList,
        ...action.conversations.filter(newConv =>
          !state.conversationList.some(
            existingConv => existingConv.getConversationId() === newConv.getConversationId()
          )
        )
      ];

      newState = {
        ...state,
        conversationList: newConversationList,
      };
      break;
    }

    case "setFetchState":
      newState = { ...state, fetchState: action.fetchState };
      break;

    case "updateConversationWithUser": {
      const { user } = action;
      const { conversationList } = state;
      const targetUid = user.getUid();
      const targetIdx = conversationList.findIndex((conv) => {
        const convWith = conv.getConversationWith();
        return (
          convWith instanceof CometChat.User && convWith?.getUid() === targetUid
        );
      });

      if (targetIdx > -1) {
        const newConversationList = conversationList.map((conv, i) => {
          if (i === targetIdx) {
            const newConv = CometChatUIKitUtility.clone(conv);
            newConv.setConversationWith(user);
            return newConv;
          }
          return conv;
        });

        newState = { ...state, conversationList: newConversationList };
      }
      break;
    }

    case "addTypingIndicator": {
      const { typingIndicator } = action;
      const senderId = typingIndicator.getSender()?.getUid();
      const isReceiverTypeGroup = typingIndicator.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group;
      const receiverId = typingIndicator.getReceiverId();
      let id: string | undefined;
      const { conversationList, typingIndicatorMap } = state;

      for (let i = 0; i < conversationList.length; i++) {
        const convWith = conversationList[i].getConversationWith();
        if (isReceiverTypeGroup) {
          if (convWith instanceof CometChat.Group && convWith.getGuid() === receiverId) {
            id = convWith.getGuid();
            break;
          }
        } else if (convWith instanceof CometChat.User && convWith?.getUid() === senderId) {
          id = convWith?.getUid();
          break;
        }
      }

      if (id !== undefined) {
        const newTypingIndicatorMap = new Map<string, CometChat.TypingIndicator>(typingIndicatorMap);
        newTypingIndicatorMap.set(id, typingIndicator);
        newState = { ...state, typingIndicatorMap: newTypingIndicatorMap };
      }
      break;
    }

    case "removeTypingIndicator": {
      const { typingIndicatorMap } = state;
      const { typingIndicator } = action;
      const senderId = typingIndicator.getSender()?.getUid();
      const receiverId = typingIndicator.getReceiverId();
      let id: string | undefined;

      if (typingIndicator.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user) {
        if (typingIndicatorMap.has(senderId)) {
          id = senderId;
        }
      } else if (typingIndicatorMap.get(receiverId)?.getSender()?.getUid() === senderId) {
        id = receiverId;
      }

      if (id !== undefined) {
        const newTypingIndicatorMap = new Map<string, CometChat.TypingIndicator>(typingIndicatorMap);
        newTypingIndicatorMap.delete(id);
        newState = { ...state, typingIndicatorMap: newTypingIndicatorMap };
      }
      break;
    }

    case "setHasMoreResults":
      newState = { ...state, hasMoreResults: action.hasMoreResults };
      break;

    case "setConversationToBeDeleted":
      newState = { ...state, conversationToBeDeleted: action.conversation };
      break;
    case "removeConversation": {
      const { typingIndicatorMap, conversationList } = state;
      const targetConvId = action.conversation.getConversationId();
      const targetIdx = conversationList.findIndex(
        (conv) => conv.getConversationId() === targetConvId
      );
      if (targetIdx > -1) {
        const convWith = conversationList[targetIdx].getConversationWith();
        const convWithId =
          convWith instanceof CometChat.User
            ? convWith?.getUid()
            : convWith.getGuid();
        let newTypingIndicatorMap: Map<string, CometChat.TypingIndicator>;
        if (typingIndicatorMap.has(convWithId)) {
          newTypingIndicatorMap = new Map(typingIndicatorMap);
          newTypingIndicatorMap.delete(convWithId);
        } else {
          newTypingIndicatorMap = typingIndicatorMap;
        }
        const newConversationList = state.conversationList.filter(
          (conv, i) => i !== targetIdx
        );
        newState = {
          ...state,
          conversationList: newConversationList,
          typingIndicatorMap: newTypingIndicatorMap,
          fetchState: newConversationList.length == 0 ? States.empty : States.loaded
        };
      }
      break;
    }
    case "fromUpdateConversationListFn": {
      const { conversation } = action;
      const targetId = conversation.getConversationId();
      const conversations = state.conversationList.filter((conv) => {
        if (conv.getConversationId() !== targetId) {
          return true;
        }
        return false;
      });
      newState = {
        ...state,
        conversationList: [conversation, ...conversations],
      };
      break;
    }
    case "setLastMessageReadOrDeliveredAt": {
      const { conversationList } = state;
      const { messageReceipt, updateReadAt } = action;
      let targetMessageId = "";
      if (messageReceipt && typeof messageReceipt.getMessageId === 'function') {
        targetMessageId = messageReceipt.getMessageId();
      }
      const targetIdx = conversationList.findIndex((conv) => {
        if (conv.getConversationWith() instanceof CometChat.User) {
          const lastMessage = conv.getLastMessage();
          if (
            isAMessage(lastMessage) &&
            String(lastMessage.getId()) === targetMessageId
          ) {
            return updateReadAt
              ? !lastMessage.getReadAt()
              : !lastMessage.getDeliveredAt();
          }
        }
        return false;
      });
      if (targetIdx > -1) {
        newState = {
          ...state,
          conversationList: conversationList.map((conv, i) => {
            if (i === targetIdx) {
              const newConv = CometChatUIKitUtility.clone(conv);
              const lastMessage = newConv.getLastMessage();
              if (isAMessage(lastMessage)) {
                if (updateReadAt) {
                  lastMessage.setReadAt(messageReceipt?.getReadAt());
                  newConv.setUnreadMessageCount(0);
                } else {
                  lastMessage.setDeliveredAt(messageReceipt?.getDeliveredAt());
                }
              }
              return newConv;
            }
            return conv;
          }),
        };
      }
      break;
    }

    case "updateConversationLastMessage": {
      const { message } = action;
      const targetMessageId = message?.getId();
      const { conversationList } = state;
      const targetIdx = conversationList.findIndex((conv) => {
        const lastMessage = conv.getLastMessage();
        return (
          isAMessage(lastMessage) && lastMessage.getId() === targetMessageId
        );
      });
      if (targetIdx > -1) {
        newState = {
          ...state,
          conversationList: conversationList.map((conv, i) => {
            if (i === targetIdx) {
              const newConv = CometChatUIKitUtility.clone(conv);
              newConv.setLastMessage(message);
              return newConv;
            }
            return conv;
          }),
        };
      }
      break;
    }
    case "updateConversationLastMessageAndGroupAndPlaceAtTheTop": {
      const { conversationList } = state;
      const { group, message } = action;
      const targetConversationId = message.getConversationId();
      if (!SearchConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
        return state;
      }
      const targetIdx = conversationList.findIndex(
        (conv) => conv.getConversationId() === targetConversationId
      );
      if (targetIdx > -1) {
        const newConv = CometChatUIKitUtility.clone(
          conversationList[targetIdx]
        );
        newConv.setConversationWith(group);
        newConv.setLastMessage(message);
        newState = {
          ...state,
          conversationList: [
            newConv,
            ...conversationList.filter((conv, i) => i !== targetIdx),
          ],
        };
      }
      break;
    }
    case "removeConversationOfTheGroup": {
      const { conversationList, typingIndicatorMap } = state;
      const targetGuidId = action.group.getGuid();
      const targetIdx = conversationList.findIndex((conv) => {
        const convWith = conv.getConversationWith();
        return (
          convWith instanceof CometChat.Group &&
          convWith.getGuid() === targetGuidId
        );
      });
      if (targetIdx > -1) {
        const convWith = conversationList[targetIdx].getConversationWith();
        const convWithId =
          convWith instanceof CometChat.User
            ? convWith?.getUid()
            : convWith.getGuid();
        let newTypingIndicatorMap: Map<string, CometChat.TypingIndicator>;
        if (typingIndicatorMap.has(convWithId)) {
          newTypingIndicatorMap = new Map(typingIndicatorMap);
          newTypingIndicatorMap.delete(convWithId);
        } else {
          newTypingIndicatorMap = typingIndicatorMap;
        }
        const newConversationList = conversationList.filter(
          (conv, i) => i !== targetIdx
        );
        newState = {
          ...state,
          conversationList: newConversationList,
          typingIndicatorMap: newTypingIndicatorMap,
        };
      }
      break;
    }
    case "removeConversationOfTheUser": {
      const { conversationList, typingIndicatorMap } = state;
      const targetUid = action.user.getUid();
      const targetIdx = conversationList.findIndex((conv) => {
        const convWith = conv.getConversationWith();
        return (
          convWith instanceof CometChat.User && convWith?.getUid() === targetUid
        );
      });
      if (targetIdx > -1) {
        const convWith = conversationList[targetIdx].getConversationWith();
        const convWithId =
          convWith instanceof CometChat.User
            ? convWith?.getUid()
            : convWith.getGuid();
        let newTypingIndicatorMap: Map<string, CometChat.TypingIndicator>;
        if (typingIndicatorMap.has(convWithId)) {
          newTypingIndicatorMap = new Map(typingIndicatorMap);
          newTypingIndicatorMap.delete(convWithId);
        } else {
          newTypingIndicatorMap = typingIndicatorMap;
        }
        const newConversationList = conversationList.filter(
          (conv, i) => i !== targetIdx
        );
        newState = {
          ...state,
          conversationList: newConversationList,
          typingIndicatorMap: newTypingIndicatorMap,
        };
      }
      break;
    }
    case "updateConversationLastMessageResetUnreadCountAndPlaceAtTheTop": {
      const { conversationList } = state;
      const { message, conversation } = action;
      const targetConvId = message.getConversationId();
      if (!SearchConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
        return state;
      }
      const targetIdx = conversationList.findIndex(
        (conv) => conv.getConversationId() === targetConvId
      );
      if (targetIdx > -1) {
        const targetConversation = CometChatUIKitUtility.clone(
          conversationList[targetIdx]
        );
        targetConversation.setLastMessage(message);
        targetConversation.setUnreadMessageCount(0);
        // targetConversation.setUnreadMentionInMessageCount(0);
        const newConversationList = conversationList.filter(
          (conv, i) => i !== targetIdx
        );
        newState = {
          ...state,
          conversationList: [targetConversation, ...newConversationList],
        };
      }
      break;
    }
    case "resetUnreadCountAndSetReadAtIfLastMessage": {
      const { conversationList } = state;
      const { message } = action;
      const messageReadAt = message.getReadAt() || Date.now();
      const targetIdx = conversationList.findIndex((conv) => {
        return conv.getConversationId() === message.getConversationId();
      });
      if (targetIdx > -1) {
        let msg = conversationList[targetIdx].getLastMessage();

        newState = {
          ...state,
          conversationList: conversationList.map((conv, i) => {
            if (i === targetIdx && msg?.getId() == message?.getId()) {
              const newConv = CometChatUIKitUtility.clone(conv);
              newConv.setUnreadMessageCount(0);
              if (newConv.getLastMessage()) {
                newConv.getLastMessage().setReadAt(messageReadAt);
              }

              return newConv;
            }
            return conv;
          }),
        };
      }
      break;
    }
    case "updateConversationLastMessageAndPlaceAtTheTop": {
      const { message } = action;
      const targetMessageId = message?.getId();
      const { conversationList } = state;

      if (!SearchConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
        return state;
      }
      const targetIdx = conversationList.findIndex((conv) => {
        const lastMessage = conv.getLastMessage();
        return (
          isAMessage(lastMessage) && lastMessage.getId() === targetMessageId
        );
      });
      if (targetIdx > -1) {
        const newConv = CometChatUIKitUtility.clone(
          conversationList[targetIdx]
        );
        newConv.setLastMessage(message);
        newState = {
          ...state,
          conversationList: [
            newConv,
            ...conversationList.filter((conv, i) => i !== targetIdx),
          ],
        };
      }
      break;
    }

    default: {
      // Ensure exhaustive checking
      const _exhaustiveCheck: never = type;
      return state;
    }
  }

  return newState;
}

/**
 * Checks if valid search criteria are present
 * Returns true if search keyword exists OR if valid filters are active
 */

function hasValidSearchCriteria(searchKeyword: string, filters: CometChatSearchFilter[]): boolean {
  // Check if search keyword exists
  if (searchKeyword && searchKeyword.trim() !== "") {
    return true;
  }

  // Valid filters are Unread, Groups, and Conversations
  const validFilters = [
    CometChatSearchFilter.Unread,
    CometChatSearchFilter.Groups,
    CometChatSearchFilter.Conversations
  ];

  // If no filters are selected, return false
  if (filters.length === 0) {
    return false;
  }

  // Check if ALL filters are valid types (every filter must be in the validFilters array)
  // If any invalid filter is present, return false
  return filters.every(filter => validFilters.includes(filter));
}

/**
 * Hook for managing and rendering a list of conversations in the search component
 */
export function useCometChatSearchConversationsList(props: UseCometChatSearchConversationsListProps) {
  const {
    searchKeyword = "",
    conversationsRequestBuilder,
    onItemClick,
    itemView = null,
    subtitleView = null,
    trailingView = null,
    hideReceipts = false,
    options = null,
    loadingView,
    emptyView,
    errorView,
    textFormatters = [],
    leadingView,
    titleView,
    hideGroupType = false,
    hideUserStatus = false,
    lastMessageDateTimeFormat,
    onError,
    activeConversation = null,
    seeMoreButtonText = getLocalizedString("search_result_see_more"),
    alwaysShowSeeMore = false,
    activeFilters = [],
    useScrollPagination = false,
    hideError = false,
    loggedInUser
  } = props;

  // Initialize state
  const [conversationState, dispatch] = useReducer(stateReducer, {
    conversationList: [],
    fetchState: States.loading,
    typingIndicatorMap: new Map(),
    hasMoreResults: false,
    conversationToBeDeleted: null,
  });

  const errorHandler = useCometChatErrorHandler(onError);
  const [activeConversationState, setActiveConversationState] = useState(activeConversation);
  const searchRequestRef = useRef<CometChat.ConversationsRequest | null>(null);
  const lastSearchKeyword = useRef<string>(searchKeyword);
  const lastActiveFilters = useRef<CometChatSearchFilter[]>(activeFilters);
  const isMoreResultsLoading = useRef<boolean>(false);
  const fetchIdRef = useRef<string>("");



  const getIncrementUnreadCountBoolFromMetaData = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        const metaDataGetterName = "getMetadata";
        const incrementUnreadCountFieldName = "incrementUnreadCount";
        let metaData: Object;
        return (
          metaDataGetterName in message &&
          typeof message![metaDataGetterName] === "function" &&
          (metaData = message![metaDataGetterName]!()) &&
          typeof metaData === "object" &&
          incrementUnreadCountFieldName in metaData &&
          Boolean(metaData["incrementUnreadCount"])
        ) || (message instanceof CometChat.CustomMessage && message.willUpdateConversation());
      } catch (error) {
        errorHandler(error, "getIncrementUnreadCountBoolFromMetaData")
      }
    },
    []
  );

  /**
   * Updates the unreadCount of `conversation` & moves it to the top of the `conversationList`
   */
  const updateConversationList = useCallback(
    (
      conversation: CometChat.Conversation,
      newMessage: CometChat.BaseMessage
    ): void => {
      try {

        const message = newMessage || conversation.getLastMessage();
        // Exit if conversation type passed in ConversationsRequestBuilder doesn't match the message receiver type.
        if (conversationsRequestBuilder && conversationsRequestBuilder.build().getConversationType() && message.getReceiverType() !== conversationsRequestBuilder.build().getConversationType()) {
          return;
        }

        if (!isAMessage(message)) {
          return;
        }
        if (!SearchConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
          return;
        }
        if (message.getSender().getUid() != loggedInUser?.getUid()) {
          conversation.setUnreadMessageCount(
            (conversation.getUnreadMessageCount() ?? 0) + 1);
        }

        if (message instanceof CometChat.Action &&
          message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
          conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group) {
          const isSameGroup = (message.getReceiver() as CometChat.Group).getGuid() ===
            (message.getActionFor() as CometChat.Group).getGuid();
          if (isSameGroup) {
            let updatedGroup = conversation.getConversationWith() as CometChat.Group;
            updatedGroup.setMembersCount((message.getActionFor() as CometChat.Group).getMembersCount());
            conversation.setConversationWith(updatedGroup);
          }
        }
        conversation.setLastMessage(message);
        dispatch({ type: "fromUpdateConversationListFn", conversation });
      } catch (error) {
        errorHandler(error, "updateConversationList")
      }
    },
    [dispatch, loggedInUser, getIncrementUnreadCountBoolFromMetaData]
  );

  /**
    * Removes or updates the conversation in the `conversationList` state
    */
  const refreshSingleConversation = useCallback(
    async (message: CometChat.BaseMessage, removeConversation: boolean = false): Promise<void> => {

      try {
        const targetIdx = conversationState.conversationList.findIndex((conv) => {
          return conv.getConversationId() === message.getConversationId();
        });
        if (targetIdx >= 0) {
          const conversation = conversationState.conversationList[targetIdx];
          if (removeConversation) {
            dispatch({ type: "removeConversation", conversation: conversation });
          }
          else {
            updateConversationList(conversation, message);
          }
        }
      } catch (error) {
        errorHandler(error, "refreshSingleConversation");
      }
    },
    [errorHandler, updateConversationList, conversationState.conversationList]
  );
  /**
   * Handles new received messages
   */
  const onMessageReceived = useCallback(
    async (message: CometChat.BaseMessage): Promise<void> => {
      try {
        let shouldRefreshConversation = true;
        if (
          message.getSender().getUid() !== loggedInUser?.getUid() &&
          !message.getDeliveredAt()
        ) {
          CometChat.markAsDelivered(message);
        }
        if (!CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnCustomMessages() && message.getCategory() === CometChatUIKitConstants.MessageCategory.custom) {
          shouldRefreshConversation = false;
        }
        if (!CometChatUIKit.conversationUpdateSettings?.shouldUpdateOnGroupActions() && message.getCategory() === CometChatUIKitConstants.MessageCategory.action) {
          shouldRefreshConversation = false;
        }

        if (shouldRefreshConversation) {
          refreshSingleConversation(message);
        }
      }
      catch (error) {
        errorHandler(error);
      }

    },
    [
      hideReceipts,
      refreshSingleConversation,
      errorHandler,
      loggedInUser,
      activeConversationState,
      getIncrementUnreadCountBoolFromMetaData
    ]
  );

  /**
   * Updates `readAt` or `deliveredAt` of a conversation's last message
   */
  const setReceipts = useCallback(
    (messageReceipt: CometChat.MessageReceipt, updateReadAt: boolean): void => {
      dispatch({
        type: "setLastMessageReadOrDeliveredAt",
        updateReadAt,
        messageReceipt,
      });
    },
    [dispatch]
  );



  // Attach user status listener
  useEffect(() => {
    if (!hideUserStatus) {
      const listenerId = "search_conversations_user_listener";

      CometChat.addUserListener(
        listenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: CometChat.User) => {
            dispatch({ type: "updateConversationWithUser", user: onlineUser });
          },
          onUserOffline: (offlineUser: CometChat.User) => {
            dispatch({ type: "updateConversationWithUser", user: offlineUser });
          }
        })
      );

      return () => {
        CometChat.removeUserListener(listenerId);
      };
    }
  }, [hideUserStatus]);

  // Attach typing indicators
  useEffect(() => {
    const listenerId = "search_conversations_typing_listener";

    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
          if (loggedInUser?.getUid() !== typingIndicator.getSender()?.getUid()) {
            dispatch({ type: "addTypingIndicator", typingIndicator });
          }
        },
        onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
          if (loggedInUser?.getUid() !== typingIndicator.getSender()?.getUid()) {
            dispatch({ type: "removeTypingIndicator", typingIndicator });
          }
        }
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerId);
    };
  }, [loggedInUser]);

  // events




  useEffect(
    /**
     * Attaches an SDK user listener
     *
     * @returns - Function to remove the added SDK user listener
     */
    () => {

      if (!hideUserStatus) {
        return SearchConversationsManager.attachUserListener((user: CometChat.User) => dispatch({ type: "updateConversationWithUser", user }));
      }

    }, [dispatch]);

  useEffect(
    /**
     * Attaches an SDK group listener
     *
     * @returns - Function to remove the added SDK group listener
     */
    () => {
      return SearchConversationsManager.attachGroupListener(refreshSingleConversation, loggedInUser!);
    }, [refreshSingleConversation, loggedInUser]);

  useEffect(
    /**
     * Attaches an SDK message received listener
     *
     * @returns - Function to remove the added SDK message received listener
     */
    () => {
      return SearchConversationsManager.attachMessageReceivedListener(onMessageReceived);
    }, [onMessageReceived]);

  useEffect(
    /**
     * Attaches an SDK message modified listener
     *
     * @returns - Function to remove the added SDK message modified listener
     */
    () => {
      return SearchConversationsManager.attachMessageModifiedListener((message: CometChat.BaseMessage) => {
        dispatch({ type: "updateConversationLastMessage", message });
      })
    }, [dispatch]);

  useEffect(
    /**
     * Attaches an SDK message receipt listener
     *
     * @returns - Function to remove the added SDK message receipt listener
     */
    () => {
      return SearchConversationsManager.attachMessageReceiptListener(setReceipts);
    }, [setReceipts]);




  useEffect(() => {
    try {
      /**
     * Subscribes to Conversations UI events
     */
      const ccConversationDeleted =
        CometChatConversationEvents.ccConversationDeleted.subscribe(
          (conversation: CometChat.Conversation) => {
            if (conversation) {
              dispatch({ type: "removeConversation", conversation });
              dispatch({ type: "setConversationToBeDeleted", conversation: null });
            }
          }
        );
      return () => {
        ccConversationDeleted.unsubscribe();
      }
    } catch (error) {
      errorHandler(error, "ccConversationDeleted")
    }
  }, [dispatch])


  useEffect(
    /**
     * Subscribes to User, Group, Message & Call UI events
     */
    () => {
      try {
        let builder = conversationsRequestBuilder;

        var builtBuilder:CometChat.ConversationsRequest;
        if(builder){
          builtBuilder = builder.build();
        }
        const groupMemberScopeChangedSub = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(item => {
          dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message: item.message });
        });
        const groupMemberAddedSub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(item => {
          const message = item.messages[item.messages.length - 1];
          if (message) {
            dispatch({ type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.userAddedIn, message });
          }
        });
        const groupMemberKickedSub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(item => {
          dispatch({ type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.kickedFrom, message: item.message });
        });
        const groupMemberBannedSub = CometChatGroupEvents.ccGroupMemberBanned.subscribe(item => {
          dispatch({ type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.kickedFrom, message: item.message });
        });
        const groupDeletedSub = CometChatGroupEvents.ccGroupDeleted.subscribe(group => {
          dispatch({ type: "removeConversationOfTheGroup", group });
        });
        const groupLeftSub = CometChatGroupEvents.ccGroupLeft.subscribe(item => {
          if (!SearchConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(item.message)) {
            return;
          }
          dispatch({ type: "removeConversationOfTheGroup", group: item.leftGroup });
        });
        const userBlockedSub = CometChatUserEvents.ccUserBlocked.subscribe(user => {
          if (builtBuilder && !builtBuilder?.isIncludeBlockedUsers()) {
            dispatch({ type: "removeConversationOfTheUser", user });
          } else {
            dispatch({ type: "updateConversationWithUser", user });
          }
        });
        const userUnBlockedSub = CometChatUserEvents.ccUserUnblocked.subscribe(user => {
          if (builtBuilder && builtBuilder?.isIncludeBlockedUsers()) {
            dispatch({ type: "updateConversationWithUser", user });
          }
        });
        const messageEditedSub = CometChatMessageEvents.ccMessageEdited.subscribe(item => {
          if (item.status === MessageStatus.success) {
            dispatch({ type: "updateConversationLastMessage", message: item.message });
          }
        });
        const messageSentSub = CometChatMessageEvents.ccMessageSent.subscribe(item => {
          if (item.status === MessageStatus.success) {
            if (builtBuilder && builtBuilder?.getConversationType() && item.message.getReceiverType() !== builtBuilder?.getConversationType()) {
              return;
            }
            CometChat.CometChatHelper.getConversationFromMessage(item.message).then(conversation => {
              setActiveConversationState(conversation);
              dispatch({ type: "updateConversationLastMessageResetUnreadCountAndPlaceAtTheTop", message: item.message, conversation: conversation });
            });
          }
        });
        const messageDeletedSub = CometChatMessageEvents.ccMessageDeleted.subscribe(message => {
          dispatch({ type: "updateConversationLastMessage", message: CometChatUIKitUtility.clone(message) }); // Cloning message since I don't know if the developer is passing a cloned copy
        });
        const messageReadSub = CometChatMessageEvents.ccMessageRead.subscribe(message => {
          dispatch({ type: "resetUnreadCountAndSetReadAtIfLastMessage", message });
        });
        const callAcceptedSub = CometChatCallEvents.ccCallAccepted.subscribe(message => {
          dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message });
        });
        const outgoingCallSub = CometChatCallEvents.ccOutgoingCall.subscribe(message => {
          dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message });
        });
        const callRejectedSub = CometChatCallEvents.ccCallRejected.subscribe(message => {
          dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message });
        });
        const callEndedSub = CometChatCallEvents.ccCallEnded.subscribe(message => {
          dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message });
        });
        return () => {
          groupMemberScopeChangedSub.unsubscribe();
          groupMemberAddedSub.unsubscribe();
          groupMemberKickedSub.unsubscribe();
          groupMemberBannedSub.unsubscribe();
          groupDeletedSub.unsubscribe();
          groupLeftSub.unsubscribe();
          userBlockedSub.unsubscribe();
          userUnBlockedSub.unsubscribe();
          messageEditedSub.unsubscribe();
          messageSentSub.unsubscribe();
          messageDeletedSub.unsubscribe();
          messageReadSub.unsubscribe();
          callAcceptedSub.unsubscribe();
          outgoingCallSub.unsubscribe();
          callRejectedSub.unsubscribe();
          callEndedSub.unsubscribe();
        };
      } catch (error) {
        errorHandler(error, "useEffect")
      }
    }, [dispatch]);

  // Set active conversation
  useEffect(() => {
    setActiveConversationState(activeConversation);
  }, [activeConversation]);

  // Handle search keyword or active filter changes
  useEffect(() => {
    const hasKeywordChanged = searchKeyword !== lastSearchKeyword.current;
    const haveFiltersChanged = !arraysEqual(activeFilters, lastActiveFilters.current);

    if (hasKeywordChanged || haveFiltersChanged) {
      lastSearchKeyword.current = searchKeyword;
      lastActiveFilters.current = [...activeFilters];

      // Reset the search state and start a new search
      dispatch({ type: "setConversationList", conversationList: [] });
      searchConversations();
    }
  }, [searchKeyword, activeFilters]);

  // Helper function to compare arrays
  const arraysEqual = useCallback((a: any[], b: any[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;

    // Use Set for O(1) lookups for primitive values
    if (a.every(item => typeof item === 'string' || typeof item === 'number')) {
      const setA = new Set(a);
      return b.every(item => setA.has(item));
    }

    return a.every((item, index) => item === b[index]);
  }, []);

  /**
   * Build the conversations request with appropriate filters
   */
  const buildConversationsRequest = useCallback(() => {
    let builder: CometChat.ConversationsRequestBuilder = conversationsRequestBuilder
    ? CometChatUIKitUtility.clone(conversationsRequestBuilder)
    : new CometChat.ConversationsRequestBuilder();

    if (searchKeyword && searchKeyword.trim() !== "") {
      const encryptedKeyword = encryptName(searchKeyword);
      builder = builder.setSearchKeyword(encryptedKeyword);
    }

    const limit = useScrollPagination ? 30 : 3;

    if(!conversationsRequestBuilder){
      builder = builder.setLimit(limit);
    }
    if (activeFilters.includes(CometChatSearchFilter.Unread)) {
      builder = builder.setUnread(true);
    }

    if (activeFilters.includes(CometChatSearchFilter.Groups)) {
      builder = builder.setConversationType(CometChatUIKitConstants.MessageReceiverType.group);
    }

    return  builder.build();
  }, [conversationsRequestBuilder, searchKeyword, activeFilters,useScrollPagination]);


  /**
   * Fetch conversations based on the search keyword and active filters
   */
  const searchConversations = useCallback(async () => {
    try {
      dispatch({ type: "setFetchState", fetchState: States.loading });

      // Check if valid search criteria are present
      if (!hasValidSearchCriteria(searchKeyword, activeFilters)) {
        dispatch({ type: "setConversationList", conversationList: [] });
        dispatch({ type: "setFetchState", fetchState: States.empty });
        dispatch({ type: "setHasMoreResults", hasMoreResults: false });
        return;
      }

      // Build the request with filters
      searchRequestRef.current = buildConversationsRequest();
      fetchIdRef.current = "initialFetch_" + Date.now();

      const conversations = await searchRequestRef.current.fetchNext();

      if (conversations.length > 0) {
        dispatch({ type: "setConversationList", conversationList: conversations });
        dispatch({ type: "setFetchState", fetchState: States.loaded });
        let limit = activeFilters.length > 0 ? 30 : 3;

        dispatch({ type: "setHasMoreResults", hasMoreResults: conversations.length >= limit });
      } else {
        dispatch({ type: "setFetchState", fetchState: States.empty });
        dispatch({ type: "setHasMoreResults", hasMoreResults: false });
      }
    } catch (error) {
      dispatch({ type: "setFetchState", fetchState: States.error });
      errorHandler(error, "searchConversations");
    }
  }, [searchKeyword, activeFilters, errorHandler, buildConversationsRequest]);


  /**
   * Load more search results
   */
  const loadMoreResults = async () => {
    if (isMoreResultsLoading.current || !searchRequestRef.current) {
      return;
    }

    isMoreResultsLoading.current = true;
    const currentFetchId = "moreResults_" + Date.now();
    fetchIdRef.current = currentFetchId;

    try {
      const conversations = await searchRequestRef.current.fetchNext();

      // Check if this is still the latest fetch request
      if (fetchIdRef.current === currentFetchId && conversations.length > 0) {
        dispatch({ type: "appendConversations", conversations });

        // Check if there might be more results
        let limit = activeFilters.length > 0 ? 30 : 3;

        dispatch({ type: "setHasMoreResults", hasMoreResults: conversations.length >= limit });
      } else if (conversations.length === 0) {
        dispatch({ type: "setHasMoreResults", hasMoreResults: false });
      }


    } catch (error) {
      errorHandler(error, "loadMoreResults");
    } finally {
      isMoreResultsLoading.current = false;
    }
  };

  /**
   * Handle scroll to bottom event for pagination
   */
  const handleScrollToBottom = useCallback(async () => {
    if (conversationState.hasMoreResults && !isMoreResultsLoading.current) {
      return await loadMoreResults();
    }
  }, [conversationState.hasMoreResults]);

  /**
   * Get avatar URL for the list item view
   */
  function getListItemAvatarURL(conversation: CometChat.Conversation): string {
    try {
      const convWith = conversation.getConversationWith();
      return convWith instanceof CometChat.User
        ? convWith.getAvatar()
        : convWith.getIcon();
    } catch (error) {
      errorHandler(error, "getListItemAvatarURL");
      return "";
    }
  }

  /**
   * Creates subtitle thread view
   */
  function getSubtitleThreadView(conversation: CometChat.Conversation): JSX.Element | null {
    try {
      const lastMessage = conversation.getLastMessage();
      if (!isAMessage(lastMessage) || !lastMessage.getParentMessageId()) {
        return null;
      }
      return (
        <div className='cometchat-search__conversations-subtitle-icon cometchat-search__conversations-subtitle-icon-thread' />
      );
    } catch (error) {
      errorHandler(error, "getSubtitleThreadView");
      return null;
    }
  }

  /**
   * Determines if the subtitle receipt should be displayed for a conversation.
   */
  function shouldDisplaySubtitleReceipt(conversation: CometChat.Conversation): boolean {
    try {
      const lastMessage = conversation.getLastMessage();
      const convWith = conversation.getConversationWith();
      const id = convWith instanceof CometChat.User
        ? convWith?.getUid()
        : convWith.getGuid();

      return (
        !hideReceipts &&
        isAMessage(lastMessage) &&
        !lastMessage.getDeletedAt() &&
        lastMessage.getCategory() !== CometChatUIKitConstants.MessageCategory.action &&
        lastMessage.getSender()?.getUid() === loggedInUser?.getUid() &&
        (lastMessage.getCategory() != CometChatUIKitConstants.MessageCategory.custom ||
          (lastMessage.getCategory() == CometChatUIKitConstants.MessageCategory.custom &&
            lastMessage.getType() !== CometChatUIKitConstants.calls.meeting)) &&
        conversationState.typingIndicatorMap.get(id) === undefined
      );
    } catch (error) {
      errorHandler(error, "shouldDisplaySubtitleReceipt");
      return false;
    }
  }

  /**
   * Creates subtitle receipt view
   */
  function getSubtitleReadReceiptView(conversation: CometChat.Conversation): JSX.Element | null {
    try {
      let lastMessageCategory = conversation.getLastMessage()
        ? (conversation.getLastMessage() as CometChat.BaseMessage).getCategory()
        : "";

      if (!shouldDisplaySubtitleReceipt(conversation) ||
        lastMessageCategory === CometChatUIKitConstants.MessageCategory.interactive) {
        return null;
      }

      const receipt = MessageReceiptUtils.getReceiptStatus(conversation.getLastMessage());
      let messageStatus = "";
      if (receipt === Receipts.error) {
        messageStatus = "error";
      }
      else if (receipt === Receipts.sent) {
        messageStatus = "sent";
      } else if (receipt === Receipts.delivered) {
        messageStatus = "delivered";
      } else if (receipt === Receipts.read) {
        messageStatus = "read";
      }
      else {
        messageStatus = "wait"
      }

      return (
        <div className={`
          cometchat-receipts cometchat-search__conversations-subtitle-receipts 
          cometchat-search__conversations-subtitle-receipts-${messageStatus} 
          cometchat-receipts-${messageStatus}`}
        />
      );
    } catch (error) {
      errorHandler(error, "getSubtitleReadReceiptView");
      return null;
    }
  }
  
  /**
   * Determines the icon class name based on the type of a call message.
   */
  function getIconNameByCallType(message: CometChat.Call): string {
    try {
      let iconName = "";
      let isMissedCallMessage = isMissedCall(message as CometChat.Call, loggedInUser!);

      if (isMissedCallMessage) {
        if (message.getType() === CometChatUIKitConstants.MessageTypes.audio) {
          iconName = "incoming-audio-call";
        } else {
          iconName = "incoming-video-call";
        }
      } else {
        if (message.getType() === CometChatUIKitConstants.MessageTypes.audio) {
          iconName = "outgoing-audio-call";
        } else {
          iconName = "outgoing-video-call";
        }
      }

      return iconName;
    } catch (error) {
      errorHandler(error, "getIconNameByCallType");
      return "";
    }
  }

  /**
   * Determines the icon class name based on the type of the message.
   */
  function getIconNameByMessageType(message: CometChat.BaseMessage): string {
    try {
      let iconName = "";
      switch (message.getType()) {
        case CometChatUIKitConstants.MessageTypes.text:
          const messageText = (message as CometChat.TextMessage).getText();
          if (isURL(messageText)) {
            iconName = "link";
          }
          break;
        case CometChatUIKitConstants.MessageTypes.image:
          iconName = "image";
          break;
        case CometChatUIKitConstants.MessageTypes.file:
          iconName = "file";
          break;
        case CometChatUIKitConstants.MessageTypes.video:
          iconName = "video";
          break;
        case CometChatUIKitConstants.MessageTypes.audio:
          iconName = "audio";
          break;
        case PollsConstants.extension_poll:
          iconName = "poll";
          break;
        case StickersConstants.sticker:
          iconName = "sticker";
          break;
        case CollaborativeWhiteboardConstants.extension_whiteboard:
          iconName = "collaborative-whiteboard";
          break;
        case CollaborativeDocumentConstants.extension_document:
          iconName = "collaborative-document";
          break;
        default:
          iconName = "";
          break;
      }

      if (message.getDeletedAt() || message.getCategory() === CometChatUIKitConstants.MessageCategory.interactive) {
        iconName = "deleted";
      }

      return iconName;
    } catch (error) {
      errorHandler(error, "getIconNameByMessageType");
      return "";
    }
  }

  /**
   * Creates subtitle text
   */
  function getSubtitleText(conversation: CometChat.Conversation): string | JSX.Element {
    try {

      const convWith = conversation.getConversationWith();
      const id = convWith instanceof CometChat.Group
        ? convWith.getGuid()
        : convWith?.getUid();
      const typingIndicator = conversationState.typingIndicatorMap.get(id);

      if (typingIndicator !== undefined) {
        if (convWith instanceof CometChat.Group) {
          return (
            <div className="cometchat-search__conversations-subtitle-typing">
              {typingIndicator.getSender().getName()}
              {": "}
              {getLocalizedString("conversation_subtitle_typing")}
            </div>
          );
        } else {
          return (
            <div className="cometchat-search__conversations-subtitle-typing">
              {getLocalizedString("conversation_subtitle_typing")}
            </div>
          );
        }
      }

      // Use loggedInUser prop first, fallback to loggedInUser
      const currentLoggedInUser = loggedInUser || loggedInUser;

      if (currentLoggedInUser) {
        let iconName = "";
        const lastMessage = conversation.getLastMessage();
        const isGroupSubtitle = lastMessage &&
          conversation?.getConversationType() != CometChat.RECEIVER_TYPE.USER;
        const isMessageFromLoggedInUser = lastMessage?.getSender().getUid() == currentLoggedInUser.getUid();
        const getLastMessageSenderName = isMessageFromLoggedInUser
          ? getLocalizedString("conversation_subtitle_you_message")
          : lastMessage?.getSender().getName();

        let subtitle = ChatConfigurator.getDataSource().getLastConversationMessage(
          conversation,
          currentLoggedInUser,
          {
            mentionsTargetElement: MentionsTargetElement.conversation,
            textFormattersList: textFormatters
          }
        );

        if (lastMessage &&
          lastMessage.getCategory() === CometChatUIKitConstants.MessageCategory.call) {
          iconName = getIconNameByCallType(lastMessage as CometChat.Call);

          if (iconName.includes("video")) {
            subtitle = getLocalizedString("conversation_subtitle_video_call");
          } else {
            subtitle = getLocalizedString("conversation_subtitle_voice_call");
          }
        }

        if (lastMessage &&
          lastMessage.getCategory() !== CometChatUIKitConstants.MessageCategory.call &&
          lastMessage.getType()) {
          iconName = getIconNameByMessageType(lastMessage);
        }

        if (lastMessage?.getDeletedAt()) {
          subtitle = getLocalizedString("conversation_subtitle_deleted_message");
        }

        return (
          <div className="cometchat-search__conversations-subtitle-text-wrapper">
            {isGroupSubtitle &&
              lastMessage.getCategory() != CometChatUIKitConstants.MessageCategory.action &&
              (lastMessage.getCategory() != CometChatUIKitConstants.MessageCategory.custom ||
                (lastMessage.getCategory() == CometChatUIKitConstants.MessageCategory.custom &&
                  lastMessage.getType() !== CometChatUIKitConstants.calls.meeting)) &&
              <span className={`cometchat-search__conversations-subtitle-text-sender`}>
                {getLastMessageSenderName}:
              </span>
            }
            <div
              className={`cometchat-search__conversations-subtitle-icon ${iconName
                ? `cometchat-search__conversations-subtitle-icon-${iconName}`
                : "cometchat-search__conversations-subtitle-icon-none"
                }`}
            />
            <div
              className={`cometchat-search__conversations-subtitle-text`}
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          </div>
        );
      }

      return "";
    } catch (error) {
      errorHandler(error, "getSubtitleText");
      return "";
    }
  }

  /**
   * Creates subtitle text view
   */
  function getSubtitleTextView(conversation: CometChat.Conversation): JSX.Element {
    return <>{getSubtitleText(conversation)}</>;
  }

  /**
   * Creates subtitle view for the list item view
   */
  function getListItemSubtitleView(conversation: CometChat.Conversation): JSX.Element {
    const convWith = conversation.getConversationWith();
    const id = convWith instanceof CometChat.Group
      ? convWith.getGuid()
      : convWith?.getUid();
    const typingIndicator = conversationState.typingIndicatorMap.get(id);

    if (subtitleView !== null) {
      return <>{subtitleView(conversation)}</>;
    }

    return (
      <div className='cometchat-search__conversations-subtitle'>
        {!typingIndicator && getSubtitleThreadView(conversation)}
        {getSubtitleReadReceiptView(conversation)}
        {getSubtitleTextView(conversation)}
      </div>
    );
  }

  /**
   * Gets the date format for the trailing view
   */
  function getDateFormat(): CalendarObject {
    const defaultFormat = {
      today: `hh:mm A`,
      yesterday: `[${getLocalizedString("yesterday")}]`,
      otherDays: "DD MMM, YYYY",
    };

    const globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject);
    const componentCalendarFormat = sanitizeCalendarObject(lastMessageDateTimeFormat);

    return {
      ...defaultFormat,
      ...globalCalendarFormat,
      ...componentCalendarFormat
    };
  }

  /**
   * Creates tail content view for the list item view
   */
  function getListItemTailContentView(conversation: CometChat.Conversation): JSX.Element | null {
    try {
      if (trailingView) {
        return <>{trailingView(conversation)}</>;
      }

      const lastMessage = conversation.getLastMessage();
      if (!lastMessage) {
        return null;
      }

      return (
        <div className='cometchat-search__conversations-trailing-view'>
          <div className="cometchat-search__conversations-trailing-view-date">
            <CometChatDate timestamp={lastMessage.getSentAt()} calendarObject={getDateFormat()} />
          </div>
          <div className="cometchat-search__conversations-trailing-view-badge">
            {conversation.getUnreadMessageCount() > 0 &&
              <div className="cometchat-badge cometchat-search__conversations-trailing-view-badge-count">
                {conversation.getUnreadMessageCount() <= 999
                  ? conversation.getUnreadMessageCount()
                  : `999+`}
              </div>
            }
          </div>
        </div>
      );
    } catch (error) {
      errorHandler(error, "getListItemTailContentView");
      return null;
    }
  }

  /**
   * Creates menu view for the list item view
   */
  function getListItemMenuView(conversation: CometChat.Conversation) {
    try {
      if (!options) {
        return null;
      }

      const curOptions = options(conversation);

      if (curOptions?.length === 0) {
        return null;
      }

      return (
        <div className="cometchat-search__conversations-trailing-view-options">
          <CometChatContextMenu
            data={curOptions as unknown as CometChatActionsIcon[]}
            topMenuSize={2}
            placement={Placement.left}
            onOptionClicked={() => {
              curOptions && curOptions.forEach((option: CometChatOption) => {
                if (option && option.id) {
                  option.onClick?.(parseInt(String(option.id)));
                }
              });
            }}
          />
        </div>
      );
    } catch (error) {
      errorHandler(error, "getListItemMenuView");
      return null;
    }
  }

  /**
   * Creates `listItem` prop of the `CometChatList` component
   */
  const getListItem = useCallback(() => {
    if (itemView !== null) {
      return itemView;
    }

    return function (conversation: CometChat.Conversation) {
      try {
        const isActive = conversation.getConversationId() === activeConversationState?.getConversationId();
        let conversationType = conversation.getConversationType();
        let groupType;
        let status;
        let userBlockedFlag = false;

        if (conversationType === CometChatUIKitConstants.MessageReceiverType.group) {
          groupType = (conversation.getConversationWith() as CometChat.Group).getType();
        }

        if (conversationType === CometChatUIKitConstants.MessageReceiverType.user) {
          const user = (conversation.getConversationWith() as CometChat.User);
          status = user.getStatus();
          userBlockedFlag = new MessageUtils().getUserStatusVisible(user) || hideUserStatus;
        }

        return (
          <div className={`cometchat-search__conversations-list-item
            ${groupType && !hideGroupType ? `cometchat-search__conversations-list-item-${groupType}` : ""}
            ${status && !userBlockedFlag ? `cometchat-search__conversations-list-item-${status}` : ""}
            ${isActive ? `cometchat-search__conversations-list-item-active` : ""}
          `}>
            <CometChatListItem
              id={conversation.getConversationId()}
              avatarURL={getListItemAvatarURL(conversation)}
              avatarName={conversation.getConversationWith().getName()}
              title={conversation.getConversationWith().getName()}
              titleView={titleView ? titleView(conversation) : undefined}
              leadingView={leadingView ? leadingView(conversation) : undefined}
              onListItemClicked={(e) => onItemClick?.(conversation,searchKeyword)}
              subtitleView={getListItemSubtitleView(conversation)}
              menuView={getListItemMenuView(conversation)}
              trailingView={getListItemTailContentView(conversation)}
            />
          </div>
        );
      } catch (error) {
        errorHandler(error, "getListItem");
        throw error;
      }
    };
  }, [itemView, activeConversationState, titleView, leadingView, onItemClick, hideGroupType, hideUserStatus, options, trailingView, errorHandler, loggedInUser,searchKeyword]);

  /**
   * Function to render the "See More" button
   */
  function renderSeeMoreButton() {
    // Don't show see more button if using scroll pagination or when filters are active
    if (useScrollPagination || activeFilters.length > 0) {
      return null;
    }

    if (!conversationState.hasMoreResults && !alwaysShowSeeMore) {
      return null;
    }

    return (
      <div className="cometchat-search-conversations__see-more">
        <CometChatButton
          text={seeMoreButtonText}
          onClick={loadMoreResults}
        />
      </div>
    );
  }

  /**
   * Determines if the conversations list should be rendered
   */
  const shouldRender = useCallback(() => {
    // Always render if filters are active (even without search keyword)
    if (activeFilters.length > 0) {
      return true;
    }
    
    // Don't render if no search keyword and no filters
    if (!searchKeyword || searchKeyword.trim() === "") {
      return false;
    }
    
    // If there's a search keyword, only render if we have results or are still loading
    return conversationState.fetchState === States.loading || 
           conversationState.conversationList.length > 0;
  }, [activeFilters, searchKeyword, conversationState.fetchState, conversationState.conversationList.length]);

  /**
   * Renders the list of conversations
   */
  const renderConversationsList = () => {
    // Don't render if conditions aren't met
    if (!shouldRender()) {
      return null;
    }

    return (
      <div className={`cometchat-search__conversations ${useScrollPagination || activeFilters.length > 0 ? "cometchat-search__conversations-full" : ""}`} >
        <CometChatList
          title={getLocalizedString("search_conversation_header")}
          hideSearch={true}
          list={conversationState.conversationList}
          listItemKey='getConversationId'
          itemView={getListItem()}
          showSectionHeader={false}
          state={conversationState.fetchState}
          loadingView={loadingView}
          emptyView={emptyView}
          errorView={errorView}
          hideError={hideError}
          onScrolledToBottom={useScrollPagination ? handleScrollToBottom : undefined}
        />
        {conversationState.conversationList.length > 0 && renderSeeMoreButton()}
      </div>
    );
  };

  // Return the functions and values needed by the consuming component
  return {
    renderConversationsList,
    getListItem,
    conversationState,
    searchConversations,
    loadMoreResults,
    handleScrollToBottom,
    shouldRender
  };
}
