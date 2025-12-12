import {
  JSX,
  useCallback,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  useCometChatErrorHandler,
  useRefSync,
} from "../../CometChatCustomHooks";
import { ChatConfigurator } from "../../utils/ChatConfigurator";
import { CometChat, ConversationsRequest } from "@cometchat/chat-sdk-javascript";
import { CometChatCheckbox } from "../BaseComponents/CometChatCheckbox/CometChatCheckbox";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatRadioButton } from "../BaseComponents/CometChatRadioButton/CometChatRadioButton";
import { ConversationsManager } from "./controller";
import { useCometChatConversations } from "./useCometChatConversations";
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatUIKitUtility } from "../../CometChatUIKit/CometChatUIKitUtility";
import { MessageReceiptUtils } from "../../utils/MessageReceiptUtils";
import { ConversationUtils } from "../../utils/ConversationUtils";
import { MentionsTargetElement, Placement, Receipts, SelectionMode, States, TitleAlignment } from "../../Enums/Enums";
import { CometChatActionsIcon, CometChatOption } from "../../modals";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { getLocalizedString, CometChatLocalize } from "../../resources/CometChatLocalize/cometchat-localize";
import { isMissedCall } from "../Calling/Utils/utils";
import { CometChatDate } from "../BaseComponents/CometChatDate/CometChatDate";
import { PollsConstants } from "../Extensions/Polls/PollsConstants";
import { StickersConstants } from "../Extensions/Stickers/StickersConstants";
import { CollaborativeWhiteboardConstants } from "../Extensions/CollaborativeWhiteboard/CollaborativeWhiteboardConstants";
import { CollaborativeDocumentConstants } from "../Extensions/CollaborativeDocument/CollaborativeDocumentConstants";
import emptyIcon from "../../assets/conversations_empty_state.svg";
import emptyIconDark from "../../assets/conversations_empty_state_dark.svg";
import errorIcon from "../../assets/list_error_state_icon.svg"
import errorIconDark from "../../assets/list_error_state_icon_dark.svg"
import { CometChatSoundManager } from "../../resources/CometChatSoundManager/CometChatSoundManager";
import { CometChatConfirmDialog } from "../BaseComponents/CometChatConfirmDialog/CometChatConfirmDialog";
import { CometChatContextMenu } from "../BaseComponents/CometChatContextMenu/CometChatContextMenu";
import { getThemeMode, isURL, sanitizeCalendarObject } from "../../utils/util";
import { CometChatConversationEvents } from "../../events/CometChatConversationEvents";
import CometChatToast from "../BaseComponents/CometChatToast/CometChatToast";
import { CometChatUIKit } from "../../CometChatUIKit/CometChatUIKit";
import { CalendarObject } from "../../utils/CalendarObject";
import { MessageUtils } from "../../utils/MessageUtils";
type Message =
  | CometChat.TextMessage
  | CometChat.MediaMessage
  | CometChat.CustomMessage
  | CometChat.Action
  | CometChat.Call;

interface ConversationsProps {
  /**
   * Disables the display of message read receipts.
   *
   * @remarks If set to `true`, the receipt status of the sent message won't be displayed.
   * @defaultValue `false`
   */
  hideReceipts?: boolean;

  /**
   * Hides the default and the custom error view passed in the `errorView` prop.
   *
   * @defaultValue `false`
   */
  hideError?: boolean;

  /**
   * Hides the delete conversation option in the default context menu.
   *
   * @defaultValue `false`
   */
  hideDeleteConversation?: boolean;

  /**
   * Hides the user's online/offline status indicator.
   *
   * @defaultValue `false`
   */
  hideUserStatus?: boolean;

  /**
   * Hides the group type icon.
   *
   * @defaultValue `false`
   */
  hideGroupType?: boolean;

  /**
   * A request builder to fetch conversations.
   *
   * @defaultValue Default request builder with the limit set to 30.
   */
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;

  /**
   * Specifies the conversation to highlight in the list.
   */
  activeConversation?: CometChat.Conversation;

  /**
   * Allows the user to pass custom formatters for text.
   *
   * These formatters should be an array of `CometChatTextFormatter` instances, enabling customized text rendering and processing.
   */
  textFormatters?: CometChatTextFormatter[];

  /**
   * Determines the selection mode for the component.
   *
   * @defaultValue `SelectionMode.none`
   */
  selectionMode?: SelectionMode;

  /**
   * A function that returns a list of actions available when hovering over a conversation item.
   * @param conversation - An instance of `CometChat.Conversation` representing the conversation.
   * @returns An array of `CometChatOption` objects.
   */
  options?: ((conversation: CometChat.Conversation) => CometChatOption[]) | null;
  /**
   * Format for displaying the timestamp of the last message in the conversations list.
   */
  lastMessageDateTimeFormat?: CalendarObject;

  /**
   * Disables sound for incoming messages.
   *
   * @defaultValue `false`
   */
  disableSoundForMessages?: boolean;

  /**
   * Custom audio sound for incoming messages.
   */
  customSoundForMessages?: string;

  /**
   * Callback function triggered when the component encounters an error.
   *
   * @param error - An instance of `CometChat.CometChatException` representing the error.
   * @returns void
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * Callback function invoked when a conversation item is clicked.
   *
   * @param conversation - An instance of `CometChat.Conversation` representing the clicked conversation.
   * @returns void
   */
  onItemClick?: (conversation: CometChat.Conversation) => void;

  /**
   * Callback function invoked when a conversation item is selected.
   *
   * @param conversation - An instance of `CometChat.Conversation` representing the selected conversation.
   * @param selected - A boolean indicating whether the item is selected.
   * @returns void
   * @remarks This prop works only if `selectionMode` is not set to `SelectionMode.none`.
   */
  onSelect?: (conversation: CometChat.Conversation, selected: boolean) => void;

  /**
   * A custom component to render in the top-right corner of the Conversations UI.
   */
  headerView?: JSX.Element;

  /**
   * A custom component to display during the loading state.
   */
  loadingView?: JSX.Element;

  /**
   * A custom component to display when there are no conversations available.
   */
  emptyView?: JSX.Element;

  /**
   * A custom component to display when an error occurs.
   */
  errorView?: JSX.Element;

  /**
   * A custom view to render each conversation in the list.
   *
   * @param conversation - An instance of `CometChat.Conversation` representing the conversation.
   * @returns A JSX element to be rendered as the conversation item.
   */
  itemView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * A function that renders a JSX element to display the leading view.
   *
   * @param conversation - An instance of `CometChat.Conversation` representing the conversation.
   * @returns A JSX element to be rendered as the leading view.
   */
  leadingView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * A function that renders a JSX element to display the title view.
   *
   * @param conversation - An instance of `CometChat.Conversation` representing the conversation.
   * @returns A JSX element to be rendered as the title view.
   */
  titleView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * A custom view to render the subtitle for each conversation.
   *
   * @param conversation - An instance of `CometChat.Conversation` representing the conversation.
   * @returns A JSX element to be rendered as the subtitle view.
   */
  subtitleView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * A custom view to render at the end of each conversation item.
   *
   * @param conversation - An instance of `CometChat.Conversation` representing the conversation.
   * @returns A JSX element to be rendered as the trailing view.
   */
  trailingView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
  * A custom search bar component to display in the Conversations header.
  */
  searchView?: JSX.Element;

  /**
   * Callback triggered when the search bar is clicked.
   */
  onSearchBarClicked?: () => void;

  /**
   * Determines whether to display the search bar in the Conversations header.
   *
   * @defaultValue `false`
   */
  showSearchBar?: boolean;

  /** Controls the visibility of the scrollbar in the list.
  * @defaultValue `false`
  */
  showScrollbar?: boolean;
}

type State = {
  conversationList: CometChat.Conversation[];
  fetchState: States;
  typingIndicatorMap: Map<string, CometChat.TypingIndicator>;
  conversationToBeDeleted: CometChat.Conversation | null;
  loggedInUser: CometChat.User | null;
  isFirstReload: boolean;
  unreadMentions: boolean;
};

export type Action =
  {
    type: "addConversationOfTheGroupAtTheTop";
    conversation: CometChat.Conversation;
  }
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
  | { type: "setLoggedInUser"; loggedInUser: CometChat.User | null }
  | { type: "setIsFirstReload"; isFirstReload: boolean };

/**
 * Checks if `message` is a base message
 *
 * @remarks
 * `CometChat.BaseMessage` is private hence, can't use it with `instanceOf`.
 * This function is identical to `message instanceOf CometChat.BaseMessage` if `CometChat.BaseMessage` wasn't private
 *
 * @param message - A pontential Base message object
 * @returns Is `message` a base message
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

function stateReducer(state: State, action: Action): State {
  let newState = state;
  const { type } = action;
  switch (type) {
    case "appendConversations":
      if (action.conversations.length > 0) {
        let conversations: CometChat.Conversation[] = [];
        if (action.removeOldConversation) {
          state.conversationList = [];
          conversations = action.conversations;
        } else {
          conversations = [
            ...state.conversationList,
            ...action.conversations.filter(
              (newConversation) =>
                !state.conversationList.some(
                  (existingConversation) =>
                    existingConversation.getConversationId() === newConversation.getConversationId()
                )
            ),
          ];
        }
        newState = { ...state, conversationList: conversations };
      }
      break;
    case "setConversationList": {
      const { typingIndicatorMap } = state;
      const { conversationList } = action;
      const newTypingIndicatorMap = new Map<
        string,
        CometChat.TypingIndicator
      >();
      for (let i = 0; i < conversationList.length; i++) {
        const convWith = conversationList[i].getConversationWith();
        const convWithId =
          convWith instanceof CometChat.User
            ? convWith?.getUid()
            : convWith.getGuid();
        if (typingIndicatorMap.has(convWithId)) {
          newTypingIndicatorMap.set(
            convWithId,
            typingIndicatorMap.get(convWithId)!
          );
        }
      }
      newState = {
        ...state,
        conversationList,
        typingIndicatorMap: newTypingIndicatorMap,
      };
      break;
    }
    case "setFetchState":
      newState = { ...state, fetchState: action.fetchState };
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
    case "addConversationOfTheGroupAtTheTop": {
      const { conversation } = action;
      const { conversationList } = state;
      if(conversation){
        newState = { ...state, conversationList: [conversation, ...conversationList] };
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
        // conversation.setUnreadMessageCount(conversation.getUnreadMessageCount() + conv.getUnreadMessageCount());
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
    case "addTypingIndicator": {
      // Make sure sender is not the logged-in user before executing this block
      const { typingIndicator } = action;
      const senderId = typingIndicator.getSender()?.getUid();
      const isReceiverTypeGroup =
        typingIndicator.getReceiverType() ===
        CometChatUIKitConstants.MessageReceiverType.group;
      const receiverId = typingIndicator.getReceiverId();
      let id: string | undefined;
      const { conversationList, typingIndicatorMap } = state;
      for (let i = 0; i < conversationList.length; i++) {
        const convWith = conversationList[i].getConversationWith();
        if (isReceiverTypeGroup) {
          if (
            convWith instanceof CometChat.Group &&
            convWith.getGuid() === receiverId
          ) {
            id = convWith.getGuid();
            break;
          }
        } else if (
          convWith instanceof CometChat.User &&
          convWith?.getUid() === senderId && !convWith.getBlockedByMe() && !convWith.getHasBlockedMe()
        ) {
          id = convWith?.getUid();
          break;
        }
      }
      if (id !== undefined) {
        const newTypingIndicatorMap = new Map<
          string,
          CometChat.TypingIndicator
        >(typingIndicatorMap);
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
      if (
        typingIndicator.getReceiverType() ===
        CometChatUIKitConstants.MessageReceiverType.user
      ) {
        if (typingIndicatorMap.has(senderId)) {
          id = senderId;
        }
      } else if (
        typingIndicatorMap.get(receiverId)?.getSender()?.getUid() === senderId
      ) {
        id = receiverId;
      }
      if (id !== undefined) {
        const newTypingIndicatorMap = new Map<
          string,
          CometChat.TypingIndicator
        >(typingIndicatorMap);
        newTypingIndicatorMap.delete(id);
        newState = { ...state, typingIndicatorMap: newTypingIndicatorMap };
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
      if (!ConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
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
      if (!ConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
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
      } else {
        conversation.setUnreadMessageCount(0);
        // conversation.setUnreadMentionInMessageCount(0);
        const newConversationList = [conversation, ...conversationList];
        newState = { ...state, conversationList: newConversationList };
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

      if (!ConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
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
    case "setLoggedInUser":
      newState = { ...state, loggedInUser: action.loggedInUser };
      break;
    case "setIsFirstReload":
      newState = { ...state, isFirstReload: action.isFirstReload };
      break;

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const x: never = type;
    }
  }
  return newState;
}

/**
 * Renders a scrollable list of conversations that has been created in a CometChat app
 */
export function CometChatConversations(props: ConversationsProps) {
  const {
    headerView,
    conversationsRequestBuilder = null,
    onError,
    itemView = null,
    subtitleView = null,
    trailingView,
    activeConversation = null,
    selectionMode = SelectionMode.none,
    hideReceipts = false,
    options = null,
    loadingView,
    emptyView,
    errorView,
    hideError = false,
    onItemClick = null,
    onSelect = null,
    textFormatters = [],
    leadingView,
    titleView,
    hideDeleteConversation = false,
    hideUserStatus = false,
    hideGroupType = false,
    disableSoundForMessages = false,
    customSoundForMessages = null,
    lastMessageDateTimeFormat,
    showSearchBar = false,
    searchView,
    onSearchBarClicked,
    showScrollbar = false,
  } = props;

  const [state, dispatch] = useReducer(stateReducer, {
    conversationList: [],
    fetchState: States.loading,
    typingIndicatorMap: new Map(),
    conversationToBeDeleted: null,
    loggedInUser: null,
    isFirstReload: false,
    unreadMentions: false,
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const confirmDialogTitleRef = useRef<string>(getLocalizedString("conversation_delete_title"));
  const confirmDialogMessageRef = useRef<string>(getLocalizedString("conversation_delete_subtitle"));
  const cancelButtonTextRef = useRef<string>(getLocalizedString("conversation_delete_confirm_no"));
  const confirmButtonTextRef = useRef<string>(getLocalizedString("conversation_delete_confirm_yes"));
  const titleRef = useRef<string>(getLocalizedString("conversation_chat_title"));

  const conversationsManagerRef = useRef<ConversationsManager | null>(null);
  const fetchNextIdRef = useRef("");
  const errorHandler = useCometChatErrorHandler(onError);
  const attachListenerOnFetch = useRef<boolean>(false);
  const [activeConversationState, setActiveConversationState] = useState(activeConversation);
  const customSoundForMessagesRef = useRefSync(customSoundForMessages);
  const conversationListRef = useRef<CometChat.Conversation[]>([]);

  (() => {
    if (state.isFirstReload) {
      attachListenerOnFetch.current = true;
      state.isFirstReload = false;
    }
  })();

  /**
   * Initiates a fetch request and appends the fetched conversations to the `conversationList` state
   *
   * @remarks
   * This function also updates the `fetchState` state
   *
   * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `conversationList` state
   */
  const fetchNextAndAppendConversations = useCallback(
    async (fetchId: string, isConnected: boolean = false): Promise<void> => {
      try {
        const conversationManager = conversationsManagerRef.current;
        if (!conversationManager) {
          return;
        }
        const conversations = await conversationManager.fetchNext();

        if (conversations.length !== 0 && fetchNextIdRef.current === fetchId) {
          let removeOldConversation = isConnected
            ? true
            : false;
          dispatch({
            type: "appendConversations",
            conversations,
            removeOldConversation,
          });
          conversationListRef.current = removeOldConversation ? conversations : [...conversationListRef.current, ...conversations]

        }
        if (attachListenerOnFetch.current) {
          ConversationsManager.attachConnestionListener(() => {
            conversationsManagerRef.current = new ConversationsManager({
              conversationsRequestBuilder,
              errorHandler

            });
            fetchNextAndAppendConversations(
              (fetchNextIdRef.current =
                "initialFetchNext_" + String(Date.now())),
              true
            );
          });
        }
        if (conversations.length == 0 && conversationListRef.current.length == 0) {
          dispatch({ type: "setFetchState", fetchState: States.empty });
        }
        if (attachListenerOnFetch.current) {
          attachListenerOnFetch.current = false
        }
      } catch (error) {
        if (conversationListRef.current.length <= 0) {
          dispatch({ type: "setFetchState", fetchState: States.error });
        }
        errorHandler(error, "fetchNextAndAppendConversations");
      }
    },
    [dispatch]
  );

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

  const hideConversation = useCallback(
    (conversationsRequest: ConversationsRequest | null, message: CometChat.BaseMessage): boolean => {
      try {

        if (
          conversationsRequest &&
          conversationsRequest.getConversationType() &&
          message.getReceiverType() !==
            conversationsRequest.getConversationType()
        ) return true;

        const isOnlyAgentic = conversationsRequest?.getOnlyAgentic() || false;
        const hideAgentic = conversationsRequest?.getHideAgentic() || false;

        const messageReceiverType = message.getReceiverType();

        if (messageReceiverType === CometChatUIKitConstants.MessageReceiverType.group) {
          if (isOnlyAgentic) return true;
        }
        else {
          const messageReceiver = message.getReceiver() as CometChat.User;
          const messageSender = message.getSender();
          if (messageSender.getRole() !== "@agentic" && messageReceiver.getRole() !== "@agentic" && isOnlyAgentic) {
            return true;
          }
          else if ((messageSender.getRole() === "@agentic" || messageReceiver.getRole() === "@agentic") && hideAgentic) {
            return true;
          }
        }
        return false;
      } catch (error) {
        errorHandler(error, "hideConversation");
        return false;
      }
  }, [errorHandler]);

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
        if (hideConversation(conversationsRequestBuilder?.build() || null, message)) {
          return;
        }

        if (!isAMessage(message)) {
          return;
        }
        if (!ConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
          return;
        }
        if (message.getSender().getUid() != state.loggedInUser?.getUid()) {
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
    [dispatch, state.loggedInUser, getIncrementUnreadCountBoolFromMetaData, hideConversation, conversationsRequestBuilder]
  );
  /**
 * Function to close toast
 */
  const closeToast = () => {
    setShowToast(false);
  }

  /**
   * Removes or updates the conversation in the `conversationList` state
   */
  const refreshSingleConversation = useCallback(
    async (message: CometChat.BaseMessage, removeConversation: boolean = false): Promise<void> => {

      try {
        const targetIdx = state.conversationList.findIndex((conv) => {
          return conv.getConversationId() === message.getConversationId();
        });
        if (targetIdx >= 0) {
          const conversation = state.conversationList[targetIdx];
          if (removeConversation) {
            dispatch({ type: "removeConversation", conversation: conversation });
          }
          else {
            updateConversationList(conversation, message);
          }
        } else {
          CometChat.CometChatHelper.getConversationFromMessage(message).then(
            (conversation) => {
              updateConversationList(conversation, message);
            }
          );

        }
      } catch (error) {
        errorHandler(error, "refreshSingleConversation");
      }
    },
    [errorHandler, updateConversationList, state.conversationList]
  );

  /**
   * Handles new received messages
   */
  const onMessageReceived = useCallback(
    async (message: CometChat.BaseMessage): Promise<void> => {
      try {
        let shouldRefreshConversation = true;
        if (
          message.getSender().getUid() !== state.loggedInUser?.getUid() &&
          !message.getDeliveredAt()
        ) {
          CometChat.markAsDelivered(message);
        }
        if (
          !disableSoundForMessages && !hideConversation(conversationsRequestBuilder?.build() || null, message) &&
          !(
            (message.getCategory() ===
              CometChatUIKitConstants.MessageCategory.custom &&
              !getIncrementUnreadCountBoolFromMetaData(message)) ||
            (activeConversation &&
              activeConversation.getConversationId() ===
              message.getConversationId())
          )
        ) {
          CometChatSoundManager.play(
            CometChatSoundManager.Sound.incomingMessageFromOther!,
            customSoundForMessagesRef.current
          );
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
      state.loggedInUser,
      activeConversationState,
      getIncrementUnreadCountBoolFromMetaData,
      disableSoundForMessages,
      customSoundForMessagesRef,
      hideConversation,
      conversationsRequestBuilder
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

  /**
   * Handles new typing indicators
   */
  const setTypingIndicator = useCallback(
    (
      typingIndicator: CometChat.TypingIndicator,
      typingStarted: boolean
    ): void => {
      try {

        if (
          state.loggedInUser?.getUid() === typingIndicator.getSender()?.getUid()
        ) {
          return;
        }
        if (typingStarted) {
          dispatch({ type: "addTypingIndicator", typingIndicator });
        } else {
          dispatch({ type: "removeTypingIndicator", typingIndicator });
        }
      } catch (error) {
        errorHandler(error, "setTypingIndicator")
      }
    },
    [state.loggedInUser]
  );


  /**
   * Get avatar URL for the default list item view
   */
  function getListItemAvatarURL(conversation: CometChat.Conversation): string {
    try {
      const convWith = conversation.getConversationWith();
      return convWith instanceof CometChat.User
        ? convWith.getAvatar()
        : convWith.getIcon();
    } catch (error) {
      errorHandler(error, "getListItemAvatarURL");
      throw error;
    }
  }

  /**
   * Creates subtitle thread view
   */
  function getSubtitleThreadView(
    conversation: CometChat.Conversation
  ): JSX.Element | null {
    try {
      const lastMessage = conversation.getLastMessage();
      if (!isAMessage(lastMessage) || !lastMessage.getParentMessageId()) {
        // parentMessageId is falsy, it is not a valid parent message id
        return null;
      }
      return (
        <div className='cometchat-conversations__subtitle-icon cometchat-conversations__subtitle-icon-thread' />
      );
    } catch (error) {
      errorHandler(error, "getSubtitleThreadView");
      throw error;
    }
  }

  /**
   * Determines if the subtitle receipt should be displayed for a conversation.
   *
   * @param {CometChat.Conversation} conversation - The conversation object for which to check the subtitle receipt.
   * @returns {boolean} - Returns true if the subtitle receipt should be displayed, otherwise false.
   */
  function shouldDisplaySubtitleReceipt(
    conversation: CometChat.Conversation
  ): boolean {
    try {
      const lastMessage = conversation.getLastMessage();
      const convWith = conversation.getConversationWith();
      const id =
        convWith instanceof CometChat.User
          ? convWith?.getUid()
          : convWith.getGuid();
      return (
        !hideReceipts &&
        isAMessage(lastMessage) &&
        !lastMessage.getDeletedAt() &&
        lastMessage.getCategory() !==
        CometChatUIKitConstants.MessageCategory.action &&
        lastMessage.getSender()?.getUid() === state.loggedInUser?.getUid() &&
        (lastMessage.getCategory() != CometChatUIKitConstants.MessageCategory.custom || (lastMessage.getCategory() == CometChatUIKitConstants.MessageCategory.custom &&
          lastMessage.getType() !== CometChatUIKitConstants.calls.meeting)) &&
        state.typingIndicatorMap.get(id) === undefined
      );
    } catch (error) {
      errorHandler(error, "shouldDisplaySubtitleReceipt");
      return false;
    }
  }

  /**
   * Creates subtitle receipt view
   */
  function getSubtitleReadReceiptView(
    conversation: CometChat.Conversation
  ): JSX.Element | null {
    try {
      let lastMessageCategory = conversation.getLastMessage() ? (conversation.getLastMessage() as CometChat.BaseMessage).getCategory() : "";
      if (!shouldDisplaySubtitleReceipt(conversation) || lastMessageCategory === CometChatUIKitConstants.MessageCategory.interactive) {
        return null;
      }

      const receipt = MessageReceiptUtils.getReceiptStatus(conversation.getLastMessage())
      let messageStatus = "";

      if (receipt === Receipts.error) {
        messageStatus = "error";
      }
      else if (receipt === Receipts.sent) {
        messageStatus = "sent";
      }
      else if (receipt === Receipts.delivered) {
        messageStatus = "delivered";
      } else if (receipt === Receipts.read) {
        messageStatus = "read";
      } else {
        messageStatus = "wait"
      }




      return (
        <div className={`
        cometchat-receipts cometchat-conversations__subtitle-receipts cometchat-conversations__subtitle-receipts-${messageStatus} cometchat-receipts-${messageStatus}`}
        >
        </div>
      );
    } catch (error) {
      errorHandler(error, "getSubtitleReadReceiptView");
      throw error;
    }
  }
  const preserveEntities = (input: string): string => {
    return input
      .replace(/&/g, "&amp;")
      .replace(/&(?!amp;|lt;|gt;|quot;|#39;|#\d+;)/g, "&amp;")
      .replace(/&amp;(?!lt;|gt;|quot;|#39;|#\d+;)/g, "&amp;");
  };

  /**
   * Creates subtitle text
   */
  function getSubtitleText(
    conversation: CometChat.Conversation
  ): string | JSX.Element {
    try {

      const convWith = conversation.getConversationWith();
      const id =
        convWith instanceof CometChat.Group
          ? convWith.getGuid()
          : convWith?.getUid();
      const typingIndicator = state.typingIndicatorMap.get(id);
      if (typingIndicator !== undefined) {
        if (convWith instanceof CometChat.Group) {
          return <div className="cometchat-conversations__subtitle-typing">

            {
              typingIndicator.getSender().getName()
            }
            {": "}
            {
              getLocalizedString(
                "conversation_subtitle_typing"
              )
            }
          </div>;
        } else {

          return <div className="cometchat-conversations__subtitle-typing">{getLocalizedString("conversation_subtitle_typing")}</div>;
        }
      }
      if (state.loggedInUser) {
        let iconName = ""
        const lastMessage = conversation.getLastMessage();
        const isGroupSubtitle = lastMessage && conversation?.getConversationType() != CometChat.RECEIVER_TYPE.USER;
        const isMessageFromLoggedInUser = lastMessage?.getSender().getUid() == state.loggedInUser?.getUid();
        const getLastMessageSenderName = isMessageFromLoggedInUser ? getLocalizedString("conversation_subtitle_you_message") : lastMessage?.getSender().getName()
        let subtitle =
          ChatConfigurator.getDataSource().getLastConversationMessage(
            conversation,
            state.loggedInUser!,
            {
              mentionsTargetElement: MentionsTargetElement.conversation,
              textFormattersList: textFormatters
            }
          );
        if (
          lastMessage &&
          lastMessage.getCategory() ===
          CometChatUIKitConstants.MessageCategory.call
        ) {
          iconName = getIconNameByCallType(lastMessage)

          if (iconName.includes("video")) {
            subtitle = getLocalizedString("conversation_subtitle_video_call")
          } else {
            subtitle = getLocalizedString("conversation_subtitle_voice_call")
          }
        }
        
        if (lastMessage &&
          lastMessage.getCategory() !==
          CometChatUIKitConstants.MessageCategory.call &&
          lastMessage.getType()
        ) {
          iconName = getIconNameByMessageType(lastMessage);
        }

        if (lastMessage?.getDeletedAt()) {
          subtitle = getLocalizedString("conversation_subtitle_deleted_message");
        }
        if (isAgentChat(conversation)) {
          return (
            <div
              className="cometchat-conversations__subtitle-text-wrapper"
            >
              <div
                className={`cometchat-conversations__subtitle-text`}
              >
                {getLocalizedString("conversation_start")}
              </div>
            </div>
          )
        }

        let iconClass = iconName ? `cometchat-conversations__subtitle-icon-${iconName}` : "cometchat-conversations__subtitle-icon-none";
        if(iconName === "unsupported") {
          iconClass += ` cometchat-conversations__subtitle-icon-${lastMessage?.getType()}`;
        }

        return (
          <div
            className="cometchat-conversations__subtitle-text-wrapper"
          >
            {isGroupSubtitle &&
              lastMessage.getCategory() != CometChatUIKitConstants.MessageCategory.action &&
              (lastMessage.getCategory() != CometChatUIKitConstants.MessageCategory.custom || (lastMessage.getCategory() == CometChatUIKitConstants.MessageCategory.custom &&
                lastMessage.getType() !== CometChatUIKitConstants.calls.meeting)) && <span className={`cometchat-conversations__subtitle-text-sender`}>{getLastMessageSenderName}:</span>}
            <div
              className={`cometchat-conversations__subtitle-icon ${iconClass}`}
            />
            <div
              className={`cometchat-conversations__subtitle-text`}
              dangerouslySetInnerHTML={{ __html:  subtitle }}
            >

            </div>
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
   * Determines the icon class name based on the type of a call message.
   * 
   * This function checks whether the call was missed and assigns an icon accordingly.
   * @param {CometChat.Call} message - The call message object containing details about the call.
   * @returns {string} The name of the icon to be used based on the call type.
   */
  function getIconNameByCallType(message: CometChat.Call): string {
    try {

      let iconName = ""
      let isMissedCallMessage = isMissedCall(message as CometChat.Call, state.loggedInUser!);

      if (isMissedCallMessage) {
        if (message.getType() === CometChatUIKitConstants.MessageTypes.audio) {
          iconName = "incoming-audio-call"
        } else {
          iconName = "incoming-video-call"
        }
      } else {
        if (message.getType() === CometChatUIKitConstants.MessageTypes.audio) {
          iconName = "outgoing-audio-call"
        } else {
          iconName = "outgoing-video-call"
        }
      }

      return iconName
    } catch (error) {
      errorHandler(error, "getIconNameByCallType");
      return "";
    }
  }


  /**
   * Determines the icon class name based on the type of the message.
   * For text messages, it checks if the message is a URL (starting with http, https, or www)
   * and assigns the "link" icon. For other text messages, it assigns the "text" icon.
   *
   * @param {CometChat.BaseMessage} message - The message object containing information like type and content.
   * @returns {string} The name of the icon to be used based on the message type.
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
          iconName = "unsupported";
          break;
      }
      if (message.getDeletedAt() || message.getCategory() === CometChatUIKitConstants.MessageCategory.interactive) {
        iconName = "deleted";
      }
      return iconName
    } catch (error) {
      errorHandler(error, "getIconNameByMessageType");
      return "";
    }
  }

  /**
   * Creates subtitle text view
   */
  function getSubtitleTextView(
    conversation: CometChat.Conversation
  ): JSX.Element {
    return (
      <>
        {getSubtitleText(conversation)}
      </>
    );
  }

  function isAgentChat(conversation: CometChat.Conversation) {
    try {
      const convWith = conversation.getConversationWith();
      if (convWith instanceof CometChat.User) {
        return convWith.getRole() === "@agentic";
      }
      return false;
    } catch (error) {
      errorHandler(error, "isAgentChat");
      return false;
    }
  }

  /**
   * Creates subtitle view for the default list item view
   */
  function getListItemSubtitleView(
    conversation: CometChat.Conversation
  ): JSX.Element {

    const convWith = conversation.getConversationWith();
    const id =
      convWith instanceof CometChat.Group
        ? convWith.getGuid()
        : convWith?.getUid();
    const typingIndicator = state.typingIndicatorMap.get(id);

    if (subtitleView !== null) {
      return <>{subtitleView(conversation)}</>;
    }
    return (
      <div
        className='cometchat-conversations__subtitle'
      >
        {(!isAgentChat(conversation) && !typingIndicator) && getSubtitleThreadView(conversation)}
        {!isAgentChat(conversation) && getSubtitleReadReceiptView(conversation)}
        {getSubtitleTextView(conversation)}
      </div>
    );
  }

  /**
   * Sets the `conversationToBeDeleted` state to the given `conversation`
   */
  function deleteOptionCallback(conversation: CometChat.Conversation): void {
    dispatch({ type: "setConversationToBeDeleted", conversation });
  }

  /**
   * Creates menu view for the default list item view
   *
   * @remarks
   * This menu view is shown on mouse over the default list item view.
   * The visibility of view is handled by the default list item view
   */
  function getListItemMenuView(
    conversation: CometChat.Conversation,
  ) {
    try {
      if (selectionMode !== SelectionMode.none) {
        return null;
      }
      let curOptions: CometChatOption[] | null;
      if (!options) {
        const defaultOptions = hideDeleteConversation ? [] : ConversationUtils.getDefaultOptions();
        for (let i = 0; i < defaultOptions.length; i++) {
          if (
            defaultOptions[i].id ===
            CometChatUIKitConstants.ConversationOptions.delete
            && !defaultOptions[i].onClick) {
            defaultOptions[i].onClick = () => deleteOptionCallback(conversation);
          }
        }
        curOptions = defaultOptions;
      } else {
        curOptions = options?.(conversation);
      }
      if (curOptions?.length === 0) {
        return null;
      }
      return (
        <div className="cometchat-conversations__trailing-view-options">
          <CometChatContextMenu
            data={curOptions as unknown as CometChatActionsIcon[]}
            topMenuSize={2}
            placement={Placement.left}
            onOptionClicked={(menu?: CometChatOption | CometChatActionsIcon) => {
              if (menu?.onClick) {
                menu.onClick(conversation)
              }
            }}
          />
        </div>
      );
    } catch (error) {
      errorHandler(error, "getListItemMenuView")
    }
  }
  /**
   * Function for displaying the timestamp of the last message in the conversations list.
   * @returns CalendarObject
   */
  function getDateFormat(): CalendarObject {
    const defaultFormat = {
      today: `hh:mm A`,
      yesterday: `[${getLocalizedString("yesterday")}]`,
      otherDays: "DD/MM/YYYY",
    };

    var globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject)
    var componentCalendarFormat = sanitizeCalendarObject(lastMessageDateTimeFormat)

    const finalFormat = {
      ...defaultFormat,
      ...globalCalendarFormat,
      ...componentCalendarFormat
    };
    return finalFormat;

  }

  /**
   * Creates tail content view for the default list item view
   */
  function getListItemTailContentView(
    conversation: CometChat.Conversation
  ): JSX.Element | null {
    try {
      if (trailingView) {
        return <>{trailingView(conversation)}</>
      }

      switch (selectionMode) {
        case SelectionMode.none: {
          const lastMessage = conversation.getLastMessage();
          if (!lastMessage) {
            return null;
          }
          return (
            <div
              className='cometchat-conversations__trailing-view'
            >
              <div className="cometchat-conversations__trailing-view-date">
                <CometChatDate timestamp={lastMessage.getSentAt()} calendarObject={getDateFormat()} />
              </div>
              <div
                className="cometchat-conversations__trailing-view-badge"
              >
                {conversation.getUnreadMessageCount() > 0 && <div className="cometchat-badge cometchat-conversations__trailing-view-badge-count">
                  {conversation.getUnreadMessageCount() <= 999 ? conversation.getUnreadMessageCount() : `999+`}
                </div>
                }
              </div>
            </div>
          );
        }
        case SelectionMode.single:
          return (
            <div className='cometchat-conversations__single-select'>
              <CometChatRadioButton
                name={CometChatUIKitConstants.radioNames.conversations}
                id={conversation.getConversationId()}
                onRadioButtonChanged={(e) => onSelect?.(conversation, e.checked)}
              />
            </div>
          );
        case SelectionMode.multiple:
          return (
            <div className='cometchat-conversations__multiple-select'>
              <CometChatCheckbox
                onCheckBoxValueChanged={(e) => onSelect?.(conversation, e.checked)}
              />
            </div>
          );
        default:
          return null;
      }
    } catch (error) {
      errorHandler(error, "getListItemTailContentView");
      return null;
    }
  }

  /**
   * Creates `listItem` prop of the `CometChatList` component
   */
  function getListItem(): (
    conversation: CometChat.Conversation
  ) => JSX.Element {
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
          groupType = (conversation.getConversationWith() as CometChat.Group).getType()
        };

        if (conversationType === CometChatUIKitConstants.MessageReceiverType.user) {
          let user = (conversation.getConversationWith() as CometChat.User)
          status = user.getStatus();
          userBlockedFlag = new MessageUtils().getUserStatusVisible(user) || hideUserStatus
        };
        return (
          <div className={`cometchat-conversations__list-item
          ${groupType && !hideGroupType ? `cometchat-conversations__list-item-${groupType}` : ""}
           ${status && !userBlockedFlag ? `cometchat-conversations__list-item-${status}` : ""}
           ${isActive ? `cometchat-conversations__list-item-active` : ""}
           ${isAgentChat(conversation) && "cometchat-conversations__list-item-agent"}
        
        ` }>
          
            <CometChatListItem
              id={conversation.getConversationId()}
              avatarURL={getListItemAvatarURL(conversation)}
              avatarName={conversation.getConversationWith().getName()}
              title={conversation.getConversationWith().getName()}
              titleView={titleView ? titleView(conversation) : undefined}
              leadingView={leadingView ? leadingView(conversation) : undefined}
              onListItemClicked={(e) => onItemClick?.(conversation)}
              subtitleView={getListItemSubtitleView(conversation)}
              menuView={ getListItemMenuView(conversation)}
              trailingView={(!isAgentChat(conversation) || trailingView) &&   getListItemTailContentView(conversation)}
            />
          </div>
        );
      } catch (error) {
        errorHandler(error, "getListItem");
        throw error;
      }
    };
  }

  function handleConfirmClick(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (state.conversationToBeDeleted) {
          const convWith = state.conversationToBeDeleted.getConversationWith();
          const id = convWith instanceof CometChat.Group ? convWith.getGuid() : convWith.getUid();

          await CometChat.deleteConversation(id, state.conversationToBeDeleted.getConversationType());
          setShowToast(true)
          CometChatConversationEvents.ccConversationDeleted.next(CometChatUIKitUtility.clone(state.conversationToBeDeleted));
          dispatch({ type: "removeConversation", conversation: state.conversationToBeDeleted });
          dispatch({ type: "setConversationToBeDeleted", conversation: null });
          return resolve();



        }
      }
      catch (error) {
        errorHandler(error);
        return reject();
      }
    })
  }
  function handleCancelClick() {
    dispatch({ type: "setConversationToBeDeleted", conversation: null });
  }

  /**
   * Creates conversation delete view
   */
  function getConversationDeleteView(): JSX.Element | null {
    if (state.conversationToBeDeleted === null) {
      return null;
    }
    return (
      <div
        className="cometchat-backdrop cometchat-conversations__trailing-view-options-delete-backdrop"
      >
        <CometChatConfirmDialog
          title={confirmDialogTitleRef.current}
          messageText={confirmDialogMessageRef.current}
          cancelButtonText={cancelButtonTextRef.current}
          confirmButtonText={confirmButtonTextRef.current}
          onSubmitClick={handleConfirmClick}
          onCancelClick={handleCancelClick}
        />
      </div>
    );
  }


  /**
   * Renders the loading state view with shimmer effect
   *
   * @remarks
   * If a custom `loadingView` is provided, it will be used. Otherwise, the default shimmer effect is displayed.
   *
   * @returns A JSX element representing the loading state
   */
  const getLoadingView = () => {
    if (loadingView) {
      return loadingView;
    }
    return (
      <div className='cometchat-conversations__shimmer'>
        {[...Array(15)].map((_, index) => (
          <div key={index} className='cometchat-conversations__shimmer-item'>
            <div className='cometchat-conversations__shimmer-item-avatar'></div>
            <div className='cometchat-conversations__shimmer-item-body'>
              <div className='cometchat-conversations__shimmer-item-body-title-wrapper'>
                <div className='cometchat-conversations__shimmer-item-body-title'></div>
                <div className='cometchat-conversations__shimmer-item-body-tail'></div>
              </div>

              <div className='cometchat-conversations__shimmer-item-body-subtitle'></div>
            </div>

          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders the empty state view when there are no call-logs to display
   *
   * @remarks
   * If a custom `emptyView` is provided, it will be used. Otherwise, a default empty state view with a message is displayed.
   *
   * @returns A JSX element representing the empty state
   */
  const getEmptyView = () => {
    const isDarkMode = getThemeMode() == "dark" ? true : false;
    if (emptyView) {
      return emptyView;
    }
    return (
      <div className='cometchat-conversations__empty-state-view'>
        <div
          className='cometchat-conversations__empty-state-view-icon'
        >
          <img src={isDarkMode ? emptyIconDark : emptyIcon} alt="" />
        </div>
        <div className='cometchat-conversations__empty-state-view-body'>
          <div className='cometchat-conversations__empty-state-view-body-title'>
            {getLocalizedString("conversation_empty_title")}
          </div>
          <div className='cometchat-conversations__empty-state-view-body-description'>
            {getLocalizedString("conversation_empty_subtitle")}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders the error state view when an error occurs
   *
   * @remarks
   * If a custom `errorView` is provided, it will be used. Otherwise, a default error message is displayed.
   *
   * @returns A JSX element representing the error state
   */
  const getErrorView = () => {
    const isDarkMode = getThemeMode() == "dark" ? true : false;

    if (errorView) {
      return errorView;
    }

    return (
      <div className='cometchat-conversations__error-state-view'>
        <div className='cometchat-conversations__error-state-view-icon'>
          <img src={isDarkMode ? errorIconDark : errorIcon} alt="" />
        </div>
        <div className='cometchat-conversations__error-state-view-body'>
          <div className='cometchat-conversations__error-state-view-body-title'>
            {getLocalizedString("conversation_error_title")}
          </div>
          <div className='cometchat-conversations__error-state-view-body-description'>
            {getLocalizedString("conversation_error_subtitle")}
          </div>
        </div>
      </div>
    );
  };


  useCometChatConversations({
    conversationsRequestBuilder,
    conversationsManagerRef,
    fetchNextAndAppendConversations,
    fetchNextIdRef,
    dispatch,
    errorHandler,
    refreshSingleConversation,
    onMessageReceived,
    setReceipts,
    setTypingIndicator,
    loggedInUser: state.loggedInUser,
    activeConversation,
    setActiveConversationState,
    hideUserStatus,
    hideConversation
  });

  return (
    <div className="cometchat" style={{ width: "100%", height: "100%" }}>
      <div
        className={`cometchat-conversations ${!showScrollbar ? 'cometchat-conversations-hide-scrollbar' : ''}`}
      >
        <CometChatList
          showScrollbar={showScrollbar}
          title={titleRef.current}
          hideSearch={!showSearchBar}
          searchView={searchView}
          onSearchBarClicked={onSearchBarClicked}
          list={state.conversationList}
          listItemKey='getConversationId'
          itemView={getListItem()}
          onScrolledToBottom={() =>
            fetchNextAndAppendConversations(
              (fetchNextIdRef.current =
                "onScrolledToBottom_" + String(Date.now()))
            )
          }
          showSectionHeader={false}
          state={state.fetchState}
          loadingView={getLoadingView()}
          emptyView={getEmptyView()}
          errorView={getErrorView()}
          hideError={hideError}
          headerView={headerView}
        />
        {getConversationDeleteView()}
        {showToast ? <CometChatToast text={getLocalizedString("conversation_deleted")} onClose={closeToast} /> : null}
      </div>
    </div>
  );
}