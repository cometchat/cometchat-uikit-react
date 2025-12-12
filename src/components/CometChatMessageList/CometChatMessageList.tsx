import { BaseMessage, CometChat } from "@cometchat/chat-sdk-javascript";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useCometChatErrorHandler,
  useRefSync,
} from "../../CometChatCustomHooks";
import { Subscription } from "rxjs";

import { ChatConfigurator } from "../../utils/ChatConfigurator";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatMessageBubble } from "../BaseComponents/CometChatMessageBubble/CometChatMessageBubble";
import { CometChatMessageInformation } from "../CometChatMessageInformation/CometChatMessageInformation";
import { useCometChatMessageList } from "./useCometChatMessageList";
import { MessageListManager } from "./CometChatMessageListController";
import { CometChatUIKitUtility } from "../../CometChatUIKit/CometChatUIKitUtility";
import { CometChatActionsIcon, CometChatActionsView, CometChatMessageTemplate } from "../../modals";
import { MessageBubbleAlignment, MessageListAlignment, MessageStatus, PanelAlignment, States } from "../../Enums/Enums";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { CometChatLocalize, getLocalizedString } from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatReactions } from "../Reactions/CometChatReactions/CometChatReactions";
import { CometChatDate } from "../BaseComponents/CometChatDate/CometChatDate";
import { CometChatEmojiKeyboard } from "../BaseComponents/CometChatEmojiKeyboard/CometChatEmojiKeyboard";
import { CometChatAvatar } from "../BaseComponents/CometChatAvatar/CometChatAvatar";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import repliesRightIcon from '../../assets/subdirectory_arrow_right.svg';
import downArrow from '../../assets/dropdown-arrow.svg';
import ErrorStateIcon from '../../assets/list_error_state_icon.svg'
import ErrorStateIconDark from '../../assets/list_error_state_icon_dark.svg'
import { CometChatUIEvents, IDialog, IPanel, IShowOngoingCall } from "../../events/CometChatUIEvents";
import { CometChatCallEvents } from "../../events/CometChatCallEvents";
import { CometChatMessageEvents, IMessages } from "../../events/CometChatMessageEvents";
import { CometChatGroupEvents, IGroupLeft, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberScopeChanged } from "../../events/CometChatGroupEvents";
import CometChatToast from "../BaseComponents/CometChatToast/CometChatToast";
import { createMessageCopyFromBaseMessage, fireClickEvent, getThemeMode, sanitizeCalendarObject, useDebouncedCallback } from "../../utils/util";
import { CometChatSoundManager } from "../../resources/CometChatSoundManager/CometChatSoundManager";
import { CometChatConversationStarter } from "../BaseComponents/CometChatConversationStarter/CometChatConversationStarter";
import { CometChatSmartReplies } from "../BaseComponents/CometChatSmartReplies/CometChatSmartReplies";
import { CalendarObject } from "../../utils/CalendarObject";
import { ComposerId } from "../../utils/MessagesDataSource";
import { JSX } from 'react';
import { useCometChatFrameContext } from "../../context/CometChatFrameContext";
import { MessageUtils } from "../../utils/MessageUtils";
import { startStreamingMessage, streamingState$ } from "../../services/stream-message.service";
import { CometChatFlagMessageDialog } from "../CometChatFlagMessageDialog/CometChatFlagMessageDialog";

/**
 * Props for the MessageList component.
 */
interface MessageListProps {
  /**
   * Enables conversation starters for new chats.
   * @default false
   */
  showConversationStarters?: boolean;

  /**
   * Enables the generation of Smart Replies for incoming messages.
   * @default false
   */
  showSmartReplies?: boolean;

  /**
   * Hides the visibility of the date separator in the message list.
   * @default false
   */
  hideDateSeparator?: boolean;

  /**
   * Hides the sticky date header in the message list.
   * @default false
   */
  hideStickyDate?: boolean;

  /**
   * Hides the visibility of moderation status in the message list.
   * @default false
   */
  hideModerationView?: boolean;

  /**
   * Hides the visibility of receipts in the message list.
   * @default false
   */
  hideReceipts?: boolean;

  /**
   * Hides the default & custom error view passed in `errorView` prop.
   * @default false
   */
  hideError?: boolean;

  /**
   * Hides the option to reply to messages in a thread.
   * @default false
   */
  hideReplyInThreadOption?: boolean;

  /**
   * Hides the reply option for a message.
   * @default false
   */
  hideReplyOption?: boolean;

  /**
   * Hides the option to translate messages.
   * @default false
   */
  hideTranslateMessageOption?: boolean;

  /**
   * Hides the option to edit messages.
   * @default false
   */
  hideEditMessageOption?: boolean;

  /**
   * Hides the option to delete messages.
   * @default false
   */
  hideDeleteMessageOption?: boolean;

  /**
   * Hides the option to react to messages.
   * @default false
   */
  hideReactionOption?: boolean;

  /**
   * Hides the option to message a user privately.
   * @default false
   */
  hideMessagePrivatelyOption?: boolean;

  /**
   * Hides the option to copy messages.
   * @default false
   */
  hideCopyMessageOption?: boolean;

  /**
   * Hides the option to view message information.
   * @default false
   */
  hideMessageInfoOption?: boolean;

  /**
   * Hides avatars for messages.
   * @default false
   */
  hideAvatar?: boolean;

  /**
   * Hides group action messages.
   * @default false
   */
  hideGroupActionMessages?: boolean;

  /**
   * Unique identifier of the parent message for displaying threaded conversations.
   */
  parentMessageId?: number;

  /**
   * A `CometChat.User` object representing the participant of the chat whose details are displayed.
   */
  user?: CometChat.User;

  /**
   * A `CometChat.Group` object representing the group whose chat messages are displayed.
   */
  group?: CometChat.Group;

  /**
   * Instance of the `CometChat.ReactionsRequestBuilder` for managing message reactions.
   */
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;

  /**
   * Instance of the `CometChat.MessagesRequestBuilder` for building the request to fetch messages.
   */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  /**
   * Array of message templates to define how various types of messages should be displayed.
   */
  templates?: CometChatMessageTemplate[];

  /**
   * Array of text formatters for custom styling or formatting of message text bubbles.
   */
  textFormatters?: CometChatTextFormatter[];

  /**
   * Specifies the alignment of messages in the list (e.g., left, right).
   * @default MessageListAlignment.standard
   */
  messageAlignment?: MessageListAlignment;
  /**
   * Automatically scrolls the message list to the bottom when a new message arrives.
   * @default false
   */
  scrollToBottomOnNewMessages?: boolean;

  /**
   * Specifies how many message options are visible in the main menu by default.
   * @default 2
   */
  quickOptionsCount?: number;

  /**
   * Disables the sound effect when new messages arrive.
   * @default true
   */
  disableSoundForMessages?: boolean;

  /**
   * Specifies a custom sound file to play when new messages arrive.
   */
  customSoundForMessages?: string;

  /**
    * Specifies the keywords in incoming messages that will trigger Smart Replies.
    * If set to an empty array [], Smart Replies will be generated for all messages.
    * @default ['what', 'when', 'why', 'who', 'where', 'how', '?']
    */
  smartRepliesKeywords?: string[];

  /**
   * Specifies the delay in milliseconds before Smart Replies are displayed. 
   * Setting it to 0 fetches Smart Replies instantly without delay.
   * @default 10000
   */
  smartRepliesDelayDuration?: number;

  /**
   * Callback function triggered when an error occurs during message fetching.
   *
   * @param error - An instance of `CometChat.CometChatException` representing the error.
   * @returns void
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * Callback function triggered when a thread reply is clicked.
   *
   * @param parentMessageId - The ID of the parent message to which replies belong.
   */
  onThreadRepliesClick?: (message: CometChat.BaseMessage) => void;

  /**
   * Callback function that triggers when a reaction is clicked.
   *
   * @param reaction - The reaction object.
   * @param message - The message associated with the reaction.
   */
  onReactionClick?: (reaction: CometChat.ReactionCount, message: CometChat.BaseMessage) => void;

  /**
   * Callback function that triggers when an item in the reaction list is clicked.
   *
   * @param reaction - The reaction object.
   * @param message - The message associated with the reaction.
   */
  onReactionListItemClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;

  /**
   * Custom empty state view to display when there are no messages.
   */
  emptyView?: JSX.Element;

  /**
   * A custom view displayed when there are no messages.
   */
  errorView?: JSX.Element;

  /**
   * A custom view displayed while messages are being fetched.
   */
  loadingView?: JSX.Element;

  /**
   * A custom header view component for the message list.
   */
  headerView?: JSX.Element;
  /**
   * A custom footer view component for the message list.
   */
  footerView?: JSX.Element;
  /**
 * Format for the date separators in the message list. 
 */
  separatorDateTimeFormat?: CalendarObject;
  /**
  * Format for sticky date headers displayed in the message list.
  */
  stickyDateTimeFormat?: CalendarObject;
  /**
 * Format for the timestamp displayed next to messages.
 */
  messageSentAtDateTimeFormat?: CalendarObject;
  /**
 * Format for timestamps displayed in message details (e.g., delivery or read time).
 */
  messageInfoDateTimeFormat?: CalendarObject;
  /**
   * ID of the message to automatically scroll to when the message list loads.
   * @type {string}
   * @optional
   */
  goToMessageId?: string;

  /**
    * Controls the visibility of the scrollbar in the list.
    * @defaultValue `false`
  */
  showScrollbar?: boolean;

  /**
    * Toggles AI Agent functionality.
    * @defaultValue `false`
  */
  isAgentChat?: boolean;
  /**
   * hides the "Flag Message" option from message actions menu
   * @defaultValue `false`
   */
  hideFlagMessageOption?: boolean;
  /**
   * hides the remark text area in the flag dialog
   * @defaultValue `false`
   */
  hideFlagRemarkField?: boolean;
}

const defaultProps: MessageListProps = {
  disableSoundForMessages: false,
  customSoundForMessages: "",
  parentMessageId: 0,
  user: undefined,
  group: undefined,
  emptyView: undefined,
  errorView: undefined,
  loadingView: undefined,
  hideReceipts: false,
  hideModerationView: false,
  messageAlignment: MessageListAlignment.standard,
  hideDateSeparator: false,
  templates: [],
  messagesRequestBuilder: undefined,
  scrollToBottomOnNewMessages: false,
  onThreadRepliesClick: () => { },
  headerView: undefined,
  footerView: undefined,
  onError: (error: CometChat.CometChatException) => {
    console.log(error);
  },
  hideError: false,
  reactionsRequestBuilder: undefined,
  onReactionClick: undefined,
  onReactionListItemClick: undefined,
  textFormatters: [],
  hideTranslateMessageOption: false,
  hideReplyInThreadOption: false,
  hideReplyOption: false,
  hideReactionOption: false,
  hideEditMessageOption: false,
  hideDeleteMessageOption: false,
  hideMessagePrivatelyOption: false,
  hideCopyMessageOption: false,
  hideMessageInfoOption: false,
  hideAvatar: false,
  hideGroupActionMessages: false,
  hideStickyDate: false,
  quickOptionsCount: 2,
  showConversationStarters: false,
  showSmartReplies: false,
  smartRepliesKeywords: ['what', 'when', 'why', 'who', 'where', 'how', '?'],
  smartRepliesDelayDuration: 10000,
  goToMessageId: "",
  showScrollbar: false,
  isAgentChat: false,
  hideFlagMessageOption: false,
  hideFlagRemarkField: false
};

const CometChatMessageList = (props: MessageListProps) => {
  const {
    parentMessageId,
    user,
    group,
    emptyView,
    errorView,
    loadingView,
    hideReceipts,
    hideModerationView,
    messageAlignment,
    hideDateSeparator,
    templates,
    messagesRequestBuilder,
    scrollToBottomOnNewMessages,
    onThreadRepliesClick,
    headerView,
    footerView,
    onError,
    hideError,
    reactionsRequestBuilder,
    onReactionClick,
    onReactionListItemClick,
    textFormatters,
    hideReplyInThreadOption,
    hideReplyOption,
    hideTranslateMessageOption,
    hideReactionOption,
    hideEditMessageOption,
    hideDeleteMessageOption,
    hideMessagePrivatelyOption,
    hideCopyMessageOption,
    hideMessageInfoOption,
    hideAvatar,
    hideGroupActionMessages,
    hideStickyDate,
    quickOptionsCount,
    disableSoundForMessages,
    customSoundForMessages,
    showConversationStarters,
    showSmartReplies,
    smartRepliesKeywords,
    smartRepliesDelayDuration,
    messageInfoDateTimeFormat,
    messageSentAtDateTimeFormat,
    separatorDateTimeFormat,
    stickyDateTimeFormat,
    goToMessageId,
    showScrollbar,
    isAgentChat,
    hideFlagMessageOption,
    hideFlagRemarkField
  } = { ...defaultProps, ...props };
  /**
   * All the useState useCometChatMessageList are declaired here. These trigger a rerender when updated.
   */
  const [messageList, setMessageList] = useState<BaseMessage[]>([]);
  const [scrollListToBottom, setScrollListToBottom] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [messageListState, setMessageListState] = useState<States>(
    isAgentChat && !parentMessageId ? States.empty : States.loading
  );
  const [showCallScreen, setShowCallscreen] = useState<boolean>(false);
  const [showMessageInfoPopup, setShowMessageInfoPopup] = useState<boolean>(false);
  const [activeMessageInfo, setActiveMessageInfo] =
    useState<CometChat.BaseMessage | null>(null); // should be state.
  const [showFlagMessageDialog, setShowFlagMessageDialog] = useState<boolean>(false);
  const [currentFlagMessage, setCurrentFlagMessage] =
      useState<CometChat.BaseMessage | null>(null); 
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [ongoingCallView, setOngoingCallView] = useState<any>(null);
  const [showNewMessagesBanner, setShowNewMessagesBanner] = useState<boolean>(false);
  const [showFooterPanelView, setShowFooterPanelView] = useState<boolean>(false);
  const [showConversationStarter, setShowConversationStarter] = useState<boolean>(false);
  const [enableSmartReplies, setEnableSmartReplies] = useState<boolean>(false);
  const [showHeaderPanelView, setShowHeaderPanelView] = useState<boolean>(false);
  const [dateHeader, setDateHeader] = useState<number>(0);
  const [showDateHeader, setShowDateHeader] = useState<boolean>(false);
  const [shouldScrollToMessage, setShouldScrollToMessage] = useState<boolean>(true);
  const [hasTargetMessageId, setHasTargetMessageId] = useState<boolean>(goToMessageId ? true : false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const [isMessageInProgress, setIsMessageInProgress] = useState<boolean>(false);
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState<boolean>(isAgentChat && !parentMessageId ? true : false);
  const [shouldScrollDirectly, setShouldScrollDirectly] = useState<boolean>(true);
  const [hasVisibleArea, setHasVisibleArea] = useState<boolean>(false);
  const [scrollToEnd, setScrollToEnd] = useState<boolean>(false);
  const [isFirstScroll, setIsFirstScroll] = useState<boolean>(true);
  const [messageRepliedTo, setMessageRepliedTo] = useState<string>('');
  const [isMessageRepliedToAvailable, setIsMessageRepliedToAvailable] = useState<boolean>(false);
  const [quotedMessageId, setQuotedMessageId] = useState<string>('')
  
  /**
  * All the useRef useCometChatMessageList are declaired here. These do not trigger a rerender. They are used to get the updated values wherever required in the code.
   */
  const uniqueIdRef = useRef<string | null>("");
  const stickyDateHeaderRef = useRef<number>(0);
  const loggedInUserRef = useRef<CometChat.User | null>(null);
  const isFirstReloadRef = useRef<boolean>(false);
  const elementRefs = useRef<any>({});
  const messageListManagerRef = useRef<any>(null);
  const messageIdRef = useRef({ prevMessageId: 0, nextMessageId: 0 });
  const totalMessagesCountRef = useRef<number>(0);
  const UnreadMessagesRef = useRef<CometChat.BaseMessage[]>([]);
  const newMessageTextRef = useRef<string>("");
  const toastTextRef = useRef<string>("");
  const imageModerationDialogRef = useRef<any>(null);
  const userRef = useRefSync<CometChat.User | undefined>(user);
  const groupRef = useRefSync<CometChat.Group | undefined>(group);
  const parentMessageIdRef = useRefSync<number | undefined>(parentMessageId);
  const panelViewRef = useRef<any>(null);
  const headerViewRef = useRef<any>(null);
  const isConnectionReestablishedRef = useRef<boolean>(false);
  const isOnBottomRef = useRef<boolean>(false);
  const showSmartRepliesRef = useRef<boolean>(props.showSmartReplies || false);
  const hasReachedBottomRef = useRef<boolean>(false);
  const hasVisibleAreaRef = useRef<boolean>(false);
  const pendingMessagesMapRef = useRef<{ [runId: string]: (CometChat.AIAssistantMessage | CometChat.AIToolArgumentMessage | CometChat.AIToolResultMessage)[] }>({});
  const isStreamingRef = useRef<boolean>(false);
  var timeoutId: NodeJS.Timeout | null | number = null;
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = () => {
    return IframeContext?.iframeDocument || document;
  }

  const { debouncedCallback: debouncedSetMessageProgress } = useDebouncedCallback(
    () => {
      if(!isStreamingRef.current) setIsMessageInProgress(false);
    },
    500
  );

  useEffect((() => {
    let ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((groupMember) => {
      if (groupMember.group.getGuid() === groupRef.current?.getGuid?.()) {
        groupRef.current = groupMember.group;
      }
    })
    let ccGroupMemberScopeChanged = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe((groupMember) => {
      if (groupMember.group.getGuid() === groupRef.current?.getGuid?.()) {
        groupRef.current = groupMember.group;
      }
    })
    let ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((groupMember) => {
      if (groupMember.userAddedIn.getGuid() === groupRef.current?.getGuid?.()) {
        groupRef.current = groupMember.userAddedIn;
      }
    })
    let ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((groupMember) => {
      if (groupMember.kickedFrom.getGuid() === groupRef.current?.getGuid?.()) {
        groupRef.current = groupMember.kickedFrom;
      }
    })
    let ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((groupMember) => {
      if (groupMember.kickedFrom.getGuid() === groupRef.current?.getGuid?.()) {
        groupRef.current = groupMember.kickedFrom;
      }
    })
    return () => {
      ccOwnershipChanged?.unsubscribe();
      ccGroupMemberScopeChanged?.unsubscribe();
      ccGroupMemberAdded?.unsubscribe();
      ccGroupMemberBanned?.unsubscribe();
      ccGroupMemberKicked?.unsubscribe();
    }
  }), [groupRef]);

  const clearMessageRepliedTo = useCallback(() => {
    setTimeout(() => {
      setIsMessageRepliedToAvailable(false);
    }, 0);
  }, [setIsMessageRepliedToAvailable]);
  
  const triggerScrollToMessage = useCallback((targetId: string, behavior: ScrollBehavior = "auto") => {
    const messageElement = elementRefs.current[targetId]?.current;
    if (messageElement) {
      messageElement.scrollIntoView({
        block: "center",
        behavior: behavior,
      });
    }
  }, [elementRefs]);

  const scrollToMessage = useCallback((quotedMessageId?: string) => {
    const highlightMessage = (messageId: string, scrollBehavior: "smooth" | "auto" = "smooth") => {
      const messageElement = elementRefs.current[messageId]?.current;
      if (!messageElement) return false;
      
      triggerScrollToMessage(messageId, scrollBehavior);
      messageElement.classList.add("cometchat-message-list__bubble-highlight");
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        messageElement.classList.remove("cometchat-message-list__bubble-highlight");
      }, 2000);
      
      return true;
    };
  
    if (quotedMessageId) {
      if (highlightMessage(quotedMessageId, "smooth")) {
        clearMessageRepliedTo();
      }
      return;
    }
  
    if (messageRepliedTo) {
      setScrollListToBottom(false);
      if (highlightMessage(messageRepliedTo, "auto")) {
        clearMessageRepliedTo();
      }
      return;
    }
  
    if (goToMessageId) {
      requestAnimationFrame(() => {
        triggerScrollToMessage(goToMessageId, "auto");
      });
    }
  }, [goToMessageId, messageRepliedTo, elementRefs, triggerScrollToMessage, clearMessageRepliedTo, setScrollListToBottom]);

  /**
      * Function to play an audio notification for new messages if sound is enabled.
      * @returns {void}
      */
  const playAudio: () => void = useCallback(() => {
    try {
      if (!disableSoundForMessages) {
        if (customSoundForMessages) {
          CometChatSoundManager.play(
            CometChatSoundManager.Sound.incomingMessage!,
            customSoundForMessages
          );
        } else {
          CometChatSoundManager.play(
            CometChatSoundManager.Sound.incomingMessage!
          );
        }
      }
    } catch (error: any) {
      errorHandler(error, "playAudio");
    }
  }, [disableSoundForMessages, customSoundForMessages]);
  const renderShimmerBubble = (align: 'start' | 'end', key: string) => {
    return user || align == 'end' ? (
      <div key={key} className="cometchat-message-list__shimmer-body" style={{
        alignSelf: `flex-${align}`
      }}>
        <div className="cometchat-message-list__shimmer-item" />
      </div>
    ) : (
      <div key={key} style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start"
      }}>
        <div className="cometchat-message-list__shimmer-leading-view"></div>

        <div className="cometchat-message-list__shimmer-body" style={{
          alignSelf: `flex-${align}`
        }}>
          <div className="cometchat-message-list__shimmer-item-header" />
          <div className="cometchat-message-list__shimmer-item" />
        </div>
      </div>
    );
  };

  const renderDateShimmer = () => (
    <div className="cometchat-message-list__shimmer-header">
      <div className="cometchat-message-list__shimmer-item" />
    </div>
  );
  const getShimmer = (count: number) => {
    const shimmers = [];
    shimmers.push(<div key="date-shimmer">{renderDateShimmer()}</div>);
    for (let i = 1; i <= count; i++) {
      const align = i % 2 === 0 ? 'start' : 'end';
      shimmers.push(renderShimmerBubble(align, `shimmer-${i}`));
    }
    return <>{shimmers}</>;
  };

  /**
  * All the Private variables are declaired here for internal use.
   */
  const errorHandler = useCometChatErrorHandler(onError);
  let isFetchingPreviousMessages = false,
    threadedAlignment: MessageBubbleAlignment = MessageBubbleAlignment.left;
  const getLoaderHtml: JSX.Element = useMemo(() => {
    if (loadingView) {
      return (
        <div className='cometchat-message-list__loading-state-view'>
          {loadingView}
        </div>
      );
    } else {
      return (
        <div className="cometchat-message-list__shimmer">
          {getShimmer(10)}
        </div>
      );
    }
  }, [loadingView]);

  const getErrorHtml: JSX.Element = useMemo(() => {
    const isDarkMode = getThemeMode() == "dark" ? true : false;

    if (errorView) {
      return (
        <div className='cometchat-message-list__error-state-view'>
          {errorView}
        </div>
      );
    } else {
      return (
        <div className='cometchat-message-list__error-state-view'>
          <img className='cometchat-message-list__error-state-view-icon' src={isDarkMode ? ErrorStateIconDark : ErrorStateIcon}>

          </img>
          <div className='cometchat-message-list__error-state-view-body'>
            <div className='cometchat-message-list__error-state-view-body-title'>
              {getLocalizedString("message_list_error_title")}
            </div>
            <div className='cometchat-message-list__error-state-view-body-description'>
              {getLocalizedString("message_list_error_subtitle")}
            </div>
          </div>
        </div>
      );
    }
  }, [errorView]);

  const getEmptyHtml: JSX.Element | undefined = useMemo(() => {
    if (emptyView) {
      return (
        <div className='cometchat-message-list__empty-state-view'>
          {emptyView}
        </div>
      );
    } else {
      return undefined;
    }
  }, [emptyView]);
  const messagesTemplate = useMemo(() => {
    let messageTemplates: CometChatMessageTemplate[];
    if(templates && templates.length > 0) messageTemplates = templates;
    else {
      const allTemplates = ChatConfigurator.getDataSource().getAllMessageTemplates({
        textFormatters,
        hideGroupActionMessages
      })
      messageTemplates = allTemplates.map((template: CometChatMessageTemplate) => {
        return isAgentChat ? { ...template, replyView: null } : template;
      });
    }
    return messageTemplates;
  }, [templates, isAgentChat]);

  const messagesTypesMap: any = useMemo(() => {
    let messagesTypesArray: { [key: string]: CometChatMessageTemplate } = {};
    messagesTemplate.forEach((el: CometChatMessageTemplate) => {
      messagesTypesArray[el.category + "_" + el.type] = el;
    });
    return messagesTypesArray;
  }, [messagesTemplate]);

  /*
  * isPartOfCurrentChatForUIEvent: To check if the message belongs for this list and is not part of thread even for current list
    it only runs for UI event because it assumes logged in user is always sender
  * @param: message: CometChat.BaseMessage
*/
  const isPartOfCurrentChatForUIEvent: (message: CometChat.BaseMessage) => boolean | undefined = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        const receiverId = message?.getReceiverId();
        const receiverType = message?.getReceiverType();
        if (parentMessageIdRef.current) {
          if (message.getParentMessageId() === parentMessageIdRef.current || message.getId() === parentMessageIdRef.current) {
            return true;
          }
        } else {
          if (message.getParentMessageId() && !isAgentChat) {
            return false
          }

          if (userRef.current) {
            if (receiverType === CometChatUIKitConstants.MessageReceiverType.user && receiverId === userRef.current.getUid()) {
              return true
            }
          } else if (groupRef.current) {
            if (receiverType === CometChatUIKitConstants.MessageReceiverType.group && receiverId === groupRef.current.getGuid()) {
              return true
            }
          }

          return false
        }
      } catch (error) {
        errorHandler(error, "isPartOfCurrentChatForUIEvent")
      }
    },
    []
  );

  /**
 * Function to validate if a transient message belongs to the current message list.
 * It checks if the message is not part of a thread even for the current list.
 * It only runs for SDK event because it needs senderId to check if the message is sent by the same user.
 * @param {CometChat.TransientMessage} message - The transient message to be validated
 * @returns {boolean | undefined} - Returns true if the message belongs to the current list, false otherwise
 */
  const validateTransientMessage: (message: CometChat.TransientMessage) => boolean | undefined = useCallback(
    (message: CometChat.TransientMessage) => {
      try {
        const receiverId = message?.getReceiverId();
        const receiverType = message?.getReceiverType();
        const senderId = message?.getSender()?.getUid();
        if (parentMessageIdRef.current) {
          return false;
        } else {
          if (userRef.current) {
            if (receiverType === CometChatUIKitConstants.MessageReceiverType.user && (receiverId === userRef.current.getUid() || senderId === userRef.current.getUid())) {
              return true
            }
          } else if (groupRef.current) {
            if (receiverType === CometChatUIKitConstants.MessageReceiverType.group && (receiverId === groupRef.current.getGuid())) {
              return true
            }
          }
          return false

        }
      } catch (error) {
        errorHandler(error, "validateTransientMessage")
      }
    }, []
  )

  /**
  * Function for the date separators in the message list. 
  * @returns CalendarObject
  */
  function getSeparatorDateFormat() {
    const defaultFormat = {
      yesterday: getLocalizedString("yesterday"),
      otherDays: `DD MMM, YYYY`,
      today: getLocalizedString("today")
    };

    var globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject)
    var componentCalendarFormat = sanitizeCalendarObject(separatorDateTimeFormat)

    const finalFormat = {
      ...defaultFormat,
      ...globalCalendarFormat,
      ...componentCalendarFormat
    };
    return finalFormat;
  }
  /**
   * Function for displaying sticky date headers  in the message list.
   * @returns CalendarObject
    */
  function getStickyDateFormat() {
    const defaultFormat = {
      yesterday: getLocalizedString("yesterday"),
      otherDays: `DD MMM, YYYY`,
      today: getLocalizedString("today")
    };

    var globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject)
    var componentCalendarFormat = sanitizeCalendarObject(stickyDateTimeFormat)

    const finalFormat = {
      ...defaultFormat,
      ...globalCalendarFormat,
      ...componentCalendarFormat
    };
    return finalFormat;
  }
  /*
    * isPartOfCurrentChatForSDKEvent: To check if the message belongs for this list and is not part of thread even for current list
      it only runs for SDK event because it needs senderId to check if the message is sent by the same user
    * @param: message: CometChat.BaseMessage
  */
  const isPartOfCurrentChatForSDKEvent: (message: CometChat.BaseMessage) => boolean | undefined = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        const receiverId = message?.getReceiverId();
        const receiverType = message?.getReceiverType();
        const senderId = message?.getSender()?.getUid();
        if (parentMessageIdRef.current) {
          if (message.getParentMessageId() === parentMessageIdRef.current
           || (isAgentChat && message.getId() === parentMessageIdRef.current)
          ) {
            return true;
          }
        } else {
          if (message.getParentMessageId() && !isAgentChat) {
            return false
          }
          if (userRef.current) {
            if (receiverType === CometChatUIKitConstants.MessageReceiverType.user && (receiverId === userRef.current.getUid() || senderId === userRef.current.getUid())) {
              return true
            }
          } else if (groupRef.current) {
            if (receiverType === CometChatUIKitConstants.MessageReceiverType.group && (receiverId === groupRef.current.getGuid())) {
              return true
            }
          }

          return false
        }
      } catch (error) {
        errorHandler(error, "isPartOfCurrentChatForSDKEvent")
      }
    }, []
  )

  /*
    * isThreadOfCurrentChatForUIEvent: To check if the message belongs thread of this list,
      it only runs for UI event because it assumes logged in user is always sender
    * @param: message: CometChat.BaseMessage
  */
  const isThreadOfCurrentChatForUIEvent: (message: CometChat.BaseMessage) => boolean | undefined = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        if (!message.getParentMessageId()) {
          return false
        }

        const receiverId = message?.getReceiverId();

        if (userRef.current) {
          if (receiverId === userRef.current.getUid()) {
            return true
          }
        } else if (groupRef.current) {
          if (receiverId === groupRef.current.getGuid()) {
            return true
          }
        }

        return false
      } catch (error) {
        errorHandler(error, "isThreadOfCurrentChatForUIEvent")
      }
    }, []
  );

  /*
    * isThreadOfCurrentChatForSDKEvent: To check if the message belongs thread of this list,
      it only runs for SDK event because it needs senderId to check if the message is sent by the same user
    * @param: message: CometChat.BaseMessage
  */
  const isThreadOfCurrentChatForSDKEvent: (message: CometChat.BaseMessage) => boolean | undefined = useCallback(
    (message: CometChat.BaseMessage) => {
      try {

        if (!message.getParentMessageId()) {
          return false;
        }

        const receiverId = message?.getReceiverId();
        const senderId = message?.getSender()?.getUid();

        if (userRef.current) {
          if (receiverId === userRef.current.getUid() || senderId === userRef.current.getUid()) {
            return true;
          }
        } else if (groupRef.current) {
          if (receiverId === groupRef.current.getGuid()) {
            return true;
          }
        }

        return false;
      } catch (error) {
        errorHandler(error, "isThreadOfCurrentChatForSDKEvent")
      }
    },
    []
  );

  /**
  * Function to retrieve a specific message by its ID from the message list.
  * If the message is not found, the function will return 'undefined'.
  *
  * @param {number} id The ID of the message to be retrieved.
  * @returns {CometChat.BaseMessage | undefined} Returns the message object if found, otherwise 'undefined'.
  */
  const getMessageById: (id: number) => CometChat.BaseMessage | undefined = useCallback(
    (id: number) => {
      try {
        const messageObject = messageList.find(
          (m: CometChat.BaseMessage) =>
            m?.getId()?.toString() === id?.toString()
        );
        return messageObject;
      } catch (error: any) {
        errorHandler(error, "getMessageById");
      }
    },
    [messageList, errorHandler]
  );

  /**
 * Opens the thread view for a given message.
 * @param {CometChat.BaseMessage} message - The message object for which the thread view should be opened.
 * @returns {void}
 */
  const openThreadView: (message: CometChat.BaseMessage) => void = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        if (onThreadRepliesClick) {
          onThreadRepliesClick(message);
        }
      } catch (error: any) {
        errorHandler(error, "openThreadView");
      }
    },
    [onThreadRepliesClick, errorHandler, isOnBottomRef]
  );

  /**
 * Function to monitor the scrollbar position and update the 'isOnBottom' property.
 * This helps in showing the unread messages count in the message list if a new message is received while the scrollbar is not at the bottom.
 * @param {boolean | undefined} isOnBottom - Indicates whether the scrollbar has reached the bottom or not.
 * @returns {void}
 */
  const updateIsOnBottom: (isOnBottom?: boolean | undefined) => void = useCallback(
    (hasScrolled?: boolean) => {
      if (hasScrolled !== undefined) {
        isOnBottomRef.current = hasScrolled;

        if(isOnBottomRef.current == true && messageListState == States.loaded && !showDateHeader){
          setShowDateHeader(true)
        }
        if (isOnBottomRef.current && UnreadMessagesRef.current.length > 0) {
          clearNewMessagesCount();
        }
        if (isOnBottomRef.current && (goToMessageId || messageRepliedTo) && isFirstReloadRef.current) {
          setScrollListToBottom(false);
        }
        else {
          setScrollListToBottom(isOnBottomRef.current);
        }
        setTimeout(() => {
          if (isMessageInProgress) {
            setShowScrollToBottom(false);
          }
          else {
            setShowScrollToBottom(!isOnBottomRef.current);
          }
        }, 100);
      }
    },
    [isOnBottomRef, messageListState, isMessageInProgress]
  );

  /**
* Function to convert the user ID (UID) to the actual name of the mentioned user. This prevents the user's UID from being exposed when the message text is copied.
* @param {CometChat.TextMessage} message - The message object, which contains the text with user mentions represented as UIDs.
* @returns {string} The message text, with  mention replaced by the actual name of the user.
*/
  const getMentionsTextWithoutStyle: (message: CometChat.TextMessage) => string = (message: CometChat.TextMessage) => {
    try {
      const userRegex = /<@uid:(.*?)>/g;
      const channelRegex = /<@all:(.*?)>/g;
      let messageText = message.getText();
      let messageTextTmp = message.getText();
      let userMatch = userRegex.exec(messageText);
      let channelMatch = channelRegex.exec(messageText);
      let mentionedUsers = message.getMentionedUsers();
      while (userMatch !== null) {
        let user;
        for (let i = 0; i < mentionedUsers.length; i++) {
          if (userMatch[1] === mentionedUsers[i].getUid()) {
            user = mentionedUsers[i];
          }
        }
        if (user) {
          messageTextTmp = messageTextTmp.replace(userMatch[0], "@" + user?.getName());
        }
        userMatch = userRegex.exec(messageText);
      }
      while (channelMatch !== null) {
        messageTextTmp = messageTextTmp.replace(
          channelMatch[0],
          "@" +
            (getLocalizedString(
              `message_composer_mention_${channelMatch[1]}`
            ) || channelMatch[1])
        );
        channelMatch = channelRegex.exec(messageText);
      }
      return messageTextTmp;
    } catch (error) {
      errorHandler(error, "getMentionsTextWithoutStyle");
      throw error;
    }
  };

  /**
 * Function to find the message in the list and replace it by matching the muid. This works when we send the message  in the ui before the success of the api for optmistic ui and then replace the message with actual message object by matching muid because message id is not generated before the api success.
 * @param {CometChat.BaseMessage} message - The message object, which needs to be replaced in the list.
 * @returns {void}
 */
  const updateMessageByMuid: (message: CometChat.BaseMessage) => void = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
          const messages = prevMessageList.map((m: CometChat.BaseMessage) => {
            if (m.getMuid() === message.getMuid() && (!getIsMessageModerated(m) || getIsMessageModerated(message))) {
              return message;
            } else {
              return m;
            }
          });
          return messages;
        });
      } catch (error: any) {
        errorHandler(error, "updateMessageByMuid");
      }
    },
    [errorHandler]
  );

  /**
   * Completes the initial message load with a 100ms delay to ensure proper DOM rendering.
   * Prevents race conditions and UI flickering by allowing the current render cycle to finish.
   */
  function markInitialLoadComplete() {
    setTimeout(() => {
      setHasCompletedInitialLoad(true);
      setMessageListState(States.loaded);
      setIsMessageRepliedToAvailable(false);
      setQuotedMessageId('')
    }, 100);
  }

  /**
 * Function to find a message in the list and replace it by matching the message ID. This function is useful when we need to edit, delete or update a message object and update it in the UI in real-time.
 * @param {CometChat.BaseMessage} message - The message object that needs to be replaced in the list.
 * @returns {void}
 */
  const updateMessageByMessageId: (message: CometChat.BaseMessage) => void = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        setScrollListToBottom(false);
        setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
          const messages = prevMessageList.map((m: CometChat.BaseMessage) => {
            if (m?.getQuotedMessageId() === message?.getId()) {
              m.setQuotedMessage(message);
            }
            if (m?.getId() === message?.getId()) {
              return message;
            } else {
              return m;
            }
          });
          return messages;
        });
      } catch (error: any) {
        errorHandler(error, "updateMessageByMessageId");
      }
    },
    [errorHandler]
  );

  /**
   * Function to handle when a message is edited
   * @param {CometChat.BaseMessage} editedMessage - The message that was edited.
   * @returns {void}
   */
  const replaceUpdatedMessage: (message: CometChat.BaseMessage) => void = useCallback(
    (editedMessage: CometChat.BaseMessage) => {
      try {
        if (isPartOfCurrentChatForSDKEvent(editedMessage)) {
          updateMessageByMessageId(editedMessage);
        }
      } catch (error: any) {
        errorHandler(error, "replaceUpdatedMessage");
      }
    },
    [updateMessageByMessageId, errorHandler, isPartOfCurrentChatForSDKEvent]
  );

  /**
   * Function to find a message in the list and replace it, matching either the message ID or MUID based on the boolean flag. The corresponding function for updating the message is then called.
   * @param {CometChat.BaseMessage} message - The message object to be replaced in the list.
   * @param {boolean} replaceByMuid - Optional flag to determine whether replacement should use MUID. If not provided, defaults to `false`.
   * @returns {void}
   */
  const updateMessage: (message: CometChat.BaseMessage, replaceByMuid?: boolean) => void = useCallback(
    (message: CometChat.BaseMessage, replaceByMuid: boolean = false) => {
      try {
        if (replaceByMuid) {
          setScrollListToBottom(true);
          updateMessageByMuid(message);
        } else {
          setScrollListToBottom(false);
          updateMessageByMessageId(message);
        }
      } catch (error: any) {
        errorHandler(error, "updateMessage");
      }
    },
    [
      updateMessageByMuid,
      updateMessageByMessageId,
      errorHandler
    ]
  );

  /**
   * Function to add a selected reaction to a specific message in the list.
   * @param {string} emoji - The reaction to add to the specified message.
   * @param {CometChat.BaseMessage} message - The message object to which the reaction will be added.
   * @returns {void}
   */
  const reactToMessages: (emoji: string, messageObject: CometChat.BaseMessage) => void = useCallback(
    (emoji: string, messageObject: CometChat.BaseMessage) => {
      try {
        const messageId = messageObject?.getId();
        const msgObject = getMessageById(messageId) as CometChat.BaseMessage;
        const reactions = msgObject?.getReactions() || [];
        const emojiObject = reactions?.find((reaction: any) => {
          return reaction?.reaction === emoji;
        });

        if (emojiObject && emojiObject?.getReactedByMe()) {
          const updatedReactions: CometChat.ReactionCount[] = [];
          reactions.forEach((reaction) => {
            if (reaction?.getReaction() === emoji) {
              if (reaction?.getCount() === 1) {
                return;
              } else {
                reaction.setCount(reaction?.getCount() - 1);
                reaction.setReactedByMe(false);
                updatedReactions.push(reaction);
              }
            } else {
              updatedReactions.push(reaction);
            }
          });
          const newMessageObj = CometChatUIKitUtility.clone(msgObject);
          newMessageObj.setReactions(updatedReactions);
          updateMessage(newMessageObj);
          CometChat.removeReaction(messageId, emoji)
            .then((message) => { })
            .catch((error) => {
              updateMessage(msgObject);
              console.log(error);
            });
        } else {
          const updatedReactions = [];
          const reactionAvailable = reactions.find((reaction) => {
            return reaction?.getReaction() === emoji;
          });

          reactions.forEach((reaction) => {
            if (reaction?.getReaction() === emoji) {
              reaction.setCount(reaction?.getCount() + 1);
              reaction.setReactedByMe(true);
              updatedReactions.push(reaction);
            } else {
              updatedReactions.push(reaction);
            }
          });
          if (!reactionAvailable) {
            const react: CometChat.ReactionCount = new CometChat.ReactionCount(emoji, 1, true);
            updatedReactions.push(react);
          }

          const newMessageObj = CometChatUIKitUtility.clone(msgObject);
          newMessageObj.setReactions(updatedReactions);
          updateMessage(newMessageObj);
          if (newMessageObj.getReactions() && newMessageObj.getReactions().length == 1 && isOnBottomRef.current) {
            scrollToBottom()
          }
          CometChat.addReaction(messageId, emoji)
            .then(() => { })
            .catch((error: CometChat.CometChatException) => {
              errorHandler(error, "addReaction");
              updateMessage(msgObject);
            });
        }
      } catch (error) {
        errorHandler(error, "reactToMessages");
      }
    }, [getMessageById, errorHandler, updateMessage]
  );

  /**
   * Default Callback functions for message options.
   */

  /**
   *Function fetches a specific message from the message list using its ID. If the message is found, the selected reaction is added beneath the message.
   * @param {number} id - The ID of the message to be retrieved.
   * @returns {void}
   */
  const onReactMessage: (id: number) => (closePopover: Function) => JSX.Element = useCallback(
    (id: number) => {
      try {
        const messageObject: CometChat.BaseMessage = getMessageById(
          id
        ) as CometChat.BaseMessage;
        return (closePopover: any) => {
          return <CometChatEmojiKeyboard
            onEmojiClick={(args: any) => {
              if (closePopover) {
                closePopover()
              }
              reactToMessages(args, messageObject);
            }}
          />
        }
      } catch (error) {
        errorHandler(error, "onReactMessage");
        throw error;
      }
    },
    [getMessageById, reactToMessages]
  );

  /**
 *Function to retrieve a specific message, identified by its ID, from the message list. If the message is found, the text content of that message will be copied to the clipboard.
 * @param {number} id - The ID of the message to be retrieved.
 * @returns {void}
 */
  const onCopyMessage: (id: number) => void = useCallback(
    (id: number) => {
      try {
        let message: CometChat.TextMessage = getMessageById(id) as CometChat.TextMessage;
        if (message) {
          let text = message.getText();
          if (
            message.getMentionedUsers() &&
            message.getMentionedUsers().length
          ) {
            text = getMentionsTextWithoutStyle(message);
          }
          toastTextRef.current = getLocalizedString("message_list_message_copied");
          setShowToast(true);
          navigator?.clipboard?.writeText(text);
        }
      } catch (error: any) {
        errorHandler(error, "onCopyMessage");
      }
    },
    [getMessageById, errorHandler, setShowToast]
  );

  /**
 * Function to retrieve a specific message by its ID from the message list.
 * If the message is found, the CometChatMessageInformation component will be opened.
 *
 * @param {number} id - The ID of the message to be retrieved.
 * @returns {void}
 */
  const onOpenMessageInfo: (id: number) => void = useCallback(
    (id: number) => {
      try {
        let message: CometChat.BaseMessage | undefined = getMessageById(id);
        if (message) {
          isOnBottomRef.current = false;
          setScrollListToBottom(false);
          setActiveMessageInfo(message);
          setShowMessageInfoPopup(true);
        }
      } catch (error: any) {
        errorHandler(error, "onOpenMessageInfo");
      }
    },
    [errorHandler, isOnBottomRef, getMessageById]
  );
  /**
 * Function to retrieve a specific message by its ID from the message list.
 * If the message is found, the CometChatFlagMessageDialog component will be opened.
 *
 * @param {number} id - The ID of the message to open the flag message dialog for.
 * @returns {void}
 */
  const onOpenFlagMessageDialog: (id: number) => void = useCallback(
    (id: number) => {
      try {
        let message: CometChat.BaseMessage | undefined = getMessageById(id);
        if (message) {
          isOnBottomRef.current = false;
          setScrollListToBottom(false);
          setCurrentFlagMessage(message);
          setShowFlagMessageDialog(true);
        }
      } catch (error: any) {
        errorHandler(error, "onOpenFlagMessageDialog");
      }
    },
    [errorHandler, isOnBottomRef, getMessageById, setScrollListToBottom, setCurrentFlagMessage, setShowFlagMessageDialog]
  );

  /**
 * Function to retrieve a specific message by its ID from the message list.
 * If the message is found, the CometChatThreadedMessages component will be opened.
 *
 * @param {number} id - The ID of the message to be retrieved.
 * @returns {void}
 */
  const onOpenThread: (id: number) => void = useCallback(
    (id: number) => {
      try {
        let messageObject: CometChat.BaseMessage | undefined = getMessageById(id);
        if (messageObject) {
          openThreadView(messageObject);
        }
      } catch (error: any) {
        errorHandler(error, "onOpenThread");
      }
    },
    [openThreadView, errorHandler, getMessageById]
  );

  /**
  * Function to retrieve a specific message by its ID from the message list.
  * If the message is found, the chat will be opened for the particular user of that group to chat privately.
  *
  * @param {number} id - The ID of the message to be retrieved.
  * @returns {void}
  */
  const onMessagePrivately: (id: number) => void = useCallback(
    (id: number) => {
      try {
        const messageObject: CometChat.BaseMessage | undefined = getMessageById(id);
        if (messageObject) {
          const user: CometChat.User = messageObject.getSender();
          CometChatUIEvents.ccOpenChat.next({
            user: user,
          });
        }
      } catch (error: any) {
        errorHandler(error, "onMessagePrivately");
      }
    },
    [getMessageById, errorHandler]
  );

  /**
 * Function to retrieve a specific message by its ID from the message list.
 * If  found, the message would be deleted.
 * @param {number} id - The ID of the message to be retrieved.
 * @returns {void}
 */
  const onDeleteMessage: (id: number) => void = useCallback(
    (id: number) => {
      try {
        let message: CometChat.BaseMessage | undefined = getMessageById(id);
        if (message) {
          const messageId: any = message.getId();
          CometChat.deleteMessage(messageId).then(
            (deletedMessage: CometChat.BaseMessage) => {
              replaceUpdatedMessage(deletedMessage)
              CometChatMessageEvents.ccMessageDeleted.next(deletedMessage);
              toastTextRef.current = getLocalizedString("message_list_message_deleted");
              setShowToast(true);
            },
            (error: CometChat.CometChatException) => {
              errorHandler(error, "onDeleteMessage");
            }
          );
        }
      } catch (error: any) {
        errorHandler(error, "onDeleteMessage");
      }
    },
    [replaceUpdatedMessage, errorHandler, getMessageById]
  );

  /**
* Function to retrieve a specific message by its ID from the message list.
* If found, the Edit preview will be opened to edit that particular message.
* @param {number} id - The ID of the message to be retrieved.
* @returns {void}
*/
  const onEditMessage: (id: number) => void = useCallback(
    (id: number) => {
      try {
        let message: CometChat.BaseMessage | undefined = getMessageById(id);
        if (message) {
          CometChatMessageEvents.ccMessageEdited.next({
            message: message,
            status: MessageStatus.inprogress,
          });
          if(isOnBottomRef.current) setTimeout(() => {
            scrollToBottom()
          }, 100)
        }
      } catch (error: any) {
        errorHandler(error, "onEditMessage");
      }
    },
    [errorHandler, getMessageById]
  );


  /**
   * Function to retrieve a specific message by its ID from the message list.
   * If found, the Reply preview will be opened to reply to a particular message.
   * @param {number} id - The ID of the message to be retrieved.
   * @returns {void}
   */
  const onReply: (id: number) => void = useCallback(
    (id: number) => {
      try {
        let message: CometChat.BaseMessage | undefined = getMessageById(id);
        if (message) {
          CometChatMessageEvents.ccReplyToMessage.next({
            message: message,
            status: MessageStatus.inprogress,
          });
          if(isOnBottomRef.current) setTimeout(() => {
            scrollToBottom()
          }, 100)
        }
      } catch (error: any) {
        errorHandler(error, "onReply");
      }
    },
    [errorHandler, getMessageById]
  );

  /**
 * Function to set a default callback for each message option if none exists. This is called when default CometChatMessageTemplates for supported messages are fetched.
 * @param {(CometChatActionsIcon | CometChatActionsView)[]} options - The array of message options.
 * @param {number} id - Optional parameter. The ID of the option to which the options belong.
 * @returns {(CometChatActionsIcon | CometChatActionsView)[]} - Returns the array of message options with assigned callback functions.
 */
  const setDefaultOptionsCallback: (options: (CometChatActionsIcon | CometChatActionsView)[], id?: number) => (CometChatActionsIcon | CometChatActionsView)[] = useCallback(
    (options: (CometChatActionsIcon | CometChatActionsView)[] = [], id?: number) => {
      try {
        options.forEach(
          (element: CometChatActionsIcon | CometChatActionsView) => {
            switch (element.id) {
              case CometChatUIKitConstants.MessageOption.deleteMessage:
                if (element instanceof CometChatActionsIcon && !element.onClick) {
                  element.onClick = onDeleteMessage;
                }
                break;
              case CometChatUIKitConstants.MessageOption.editMessage:
                if (element instanceof CometChatActionsIcon && !element.onClick) {
                  element.onClick = onEditMessage;
                }
                break;
              case CometChatUIKitConstants.MessageOption.copyMessage:
                if (element instanceof CometChatActionsIcon && !element.onClick) {
                  element.onClick = onCopyMessage;
                }
                break;
              case CometChatUIKitConstants.MessageOption.replyInThread:
                if (element instanceof CometChatActionsIcon && !element.onClick) {
                  element.onClick = onOpenThread;
                }
                break;
              case CometChatUIKitConstants.MessageOption.replyMessage:
                if (element instanceof CometChatActionsIcon && !element.onClick) {
                  element.onClick = onReply;
                }
                break;
              case CometChatUIKitConstants.MessageOption.messageInformation:
                if (element instanceof CometChatActionsIcon && !element.onClick) {
                  element.onClick = onOpenMessageInfo;
                }
                break;
              case CometChatUIKitConstants.MessageOption.flagMessage:
                if (element instanceof CometChatActionsIcon && !element.onClick) {
                  element.onClick = onOpenFlagMessageDialog;
                }
                break;
              case CometChatUIKitConstants.MessageOption.sendMessagePrivately:
                if (element instanceof CometChatActionsIcon && !element.onClick) {
                  element.onClick = onMessagePrivately;
                }
                break;
              case CometChatUIKitConstants.MessageOption.reactToMessage:
                if (element instanceof CometChatActionsView && !element?.customView) {
                  element.customView = onReactMessage(id!);
                }
                setTimeout(() => {
                  fireClickEvent();
                }, 10);
                break;
              default:
                break;
            }
          }
        );
        return options;
      } catch (error: any) {
        errorHandler(error, "setDefaultOptionsCallback");
        return options;
      }
    },
    [
      errorHandler,
      onDeleteMessage,
      onEditMessage,
      onReply,
      onOpenThread,
      onCopyMessage,
      onOpenMessageInfo,
      onMessagePrivately,
      onReactMessage,
    ]
  );

  /**
    * Function to get message options for each message based on the message type.
    * @param {CometChat.BaseMessage} msgObject - The message for which the options are to be retrieved.
    * @returns {Array<CometChatActionsIcon | CometChatActionsView>} - Returns the array of appropriate message options.
    */
  const getMessageOptions: (msgObject: CometChat.BaseMessage) => (CometChatActionsIcon | CometChatActionsView)[] = useCallback(
    (
      msgObject: CometChat.BaseMessage
    ): (CometChatActionsIcon | CometChatActionsView)[] => {
      let options: (CometChatActionsIcon | CometChatActionsView)[] = [];
      if (!msgObject.getId()) {
        return options;
      }
      try {
        if (
          messagesTemplate &&
          messagesTemplate.length > 0 &&
          !msgObject.getDeletedAt() &&
          msgObject.getType() !==
          CometChatUIKitConstants.MessageTypes.groupMember &&
          msgObject?.getCategory() !==
          CometChatUIKitConstants.MessageCategory.call
        ) {
          messagesTemplate.forEach((element: any) => {
            if (
              element.type === msgObject.getType() &&
              element.category === msgObject.getCategory()
            ) {
              options = setDefaultOptionsCallback(
                element?.options?.(
                  loggedInUserRef.current,
                  msgObject,
                  groupRef.current,
                  {
                    hideReplyInThreadOption,
                    hideReplyOption,
                    hideTranslateMessageOption,
                    hideReactionOption,
                    hideEditMessageOption,
                    hideDeleteMessageOption,
                    hideMessagePrivatelyOption,
                    hideCopyMessageOption,
                    hideMessageInfoOption,
                    hideFlagMessageOption
                  }),
                msgObject?.getId()
              );
            }
          });
        }
        return options;
      } catch (error: any) {
        errorHandler(error, "getMessageOptions");
        return options;
      }
    },
    [
      messagesTemplate,
      setDefaultOptionsCallback,
      errorHandler,
      hideReplyInThreadOption,
      hideTranslateMessageOption,
      hideReactionOption,
      hideEditMessageOption,
      hideReplyOption,
      hideDeleteMessageOption,
      hideMessagePrivatelyOption,
      hideCopyMessageOption,
      hideMessageInfoOption,
      hideFlagMessageOption
    ]
  );

  /**
      * Function to set the alignment of the message bubble based on message list alignment and the sender of the message. The MessageBubble then adjusts itself based on the passed alignment.
      * @param {CometChat.BaseMessage} message - Message for which the alignment is to be determined.
      * @returns {MessageBubbleAlignment} - Returns the alignment for the message.
      */
  const setBubbleAlignment: (message: CometChat.BaseMessage) => MessageBubbleAlignment = useCallback(
    (message: CometChat.BaseMessage) => {
      let bubbleAlignment = MessageBubbleAlignment.center;
      try {
        if (
          message?.getType() === CometChatUIKitConstants.MessageTypes.groupMember || message?.getCategory() == CometChatUIKitConstants.MessageCategory.call
        ) {
          bubbleAlignment = MessageBubbleAlignment.center;
        }
        else {
          if (messageAlignment === MessageListAlignment.left) {
            bubbleAlignment = MessageBubbleAlignment.left;
          }
          else if (
            !message.getSender() ||
            (message?.getSender().getUid() === loggedInUserRef.current?.getUid())
          ) {
            bubbleAlignment = MessageBubbleAlignment.right;
          } else {
            bubbleAlignment = MessageBubbleAlignment.left;
          }
        }
        return bubbleAlignment;
      } catch (error: any) {
        errorHandler(error, "setBubbleAlignment");
        return bubbleAlignment;
      }
    },
    [messageAlignment, errorHandler]
  );

  /**
    * Function to return the content view for each item based on its type and category.
    * @param {CometChat.BaseMessage} item - The message for which the content view is to be returned.
    * @returns {any} - Returns the content view or null.
    */
  const getContentView: (item: CometChat.BaseMessage) => any = useCallback((item: CometChat.BaseMessage) => {
    try {
      let _alignment = setBubbleAlignment(item);
      if (
        messagesTypesMap[item?.getCategory() + "_" + item?.getType()] &&
        messagesTypesMap[item?.getCategory() + "_" + item?.getType()]?.contentView
      ) {
        return messagesTypesMap[item?.getCategory() + "_" + item?.getType()].contentView(
          item,
          _alignment
        );
      }
      return null;
    } catch (error: any) {
      errorHandler(error, "getContentView");
      return null;
    }
  },
    [messagesTypesMap, errorHandler, setBubbleAlignment]
  );

  const onReplyPreviewClick = useCallback(
    (messageToReply: CometChat.BaseMessage) => {
      const quotedMessageId = messageToReply.getQuotedMessageId()?.toString();
      if (!quotedMessageId) return;

      // Check if the message already exists in your messageList
      const isAlreadyLoaded = messageList.some(
        (msg) => msg.getId().toString() === quotedMessageId
      );

      if (isAlreadyLoaded) {
        scrollToMessage(quotedMessageId);
      } else {
        setMessageListState(States.loading);
        setIsMessageRepliedToAvailable(true);
        setMessageRepliedTo(quotedMessageId);
        setQuotedMessageId(quotedMessageId);
        setShouldScrollToMessage(true);
      }
    },
    [messageList, scrollToMessage]
  );
  /**
   * Function to return the content view for each item based on its type and category.
   * @param {CometChat.BaseMessage} item - The message for which the content view is to be returned.
   * @returns {any} - Returns the content view or null.
   */
  const getReplyView: (item: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      try {
        let _alignment = setBubbleAlignment(item);
        if (
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()] &&
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()]?.replyView
        ) {
          return messagesTypesMap[item?.getCategory() + "_" + item?.getType()].replyView(
            item,
            _alignment,
            onReplyPreviewClick,
            textFormatters
          );
        }
      } catch (error: any) {
        errorHandler(error, "getReplyView");
        return null;
      }
    },
    [messagesTypesMap, textFormatters, errorHandler, setBubbleAlignment, onReplyPreviewClick]
  );

  /**
     * Function to return the bottom view for each item based on its type and category.
     * @param {CometChat.BaseMessage} item - The message for which the bottom view is to be returned.
     * @returns {any} - Returns the bottom view or null.
     */
  const getBottomView: (item: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      try {
        let _alignment = setBubbleAlignment(item);
         if (
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()] &&
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()]
            ?.bottomView &&
          messagesTypesMap[
            item?.getCategory() + "_" + item?.getType()
          ]?.bottomView(item, _alignment)
        ) {
          return messagesTypesMap[
            item?.getCategory() + "_" + item?.getType()
          ]?.bottomView(item, _alignment);
        } else if (!isAgentChat && getIsMessageModerated(item) && !hideModerationView) {
          return new MessageUtils().getModeratedMessageBottomView();
        }
        return null;
      } catch (error: any) {
        errorHandler(error, "getBottomView");
        return null;
      }
    },
    [messagesTypesMap, errorHandler, setBubbleAlignment, hideModerationView, isAgentChat]
  );

  /**
    * Function to return the header view for each item based on its type and category.
    * @param {CometChat.BaseMessage} item - The message for which the header view is to be returned.
    * @returns {any} - Returns the header view or null.
    */
  const getHeaderView: (item: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      try {
        let view: JSX.Element | null = null;
        if (
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()] &&
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()]?.headerView
        ) {
          view =
            messagesTypesMap[item?.getCategory() + "_" + item?.getType()]?.headerView(item);
        }
        return view;
      } catch (error: any) {
        errorHandler(error, "getHeaderView");
        return null;
      }
    },
    [messagesTypesMap, errorHandler]
  );

  const getIsMessageModerated = (message: CometChat.BaseMessage) => {
    let isModerated = false;

    if(message instanceof CometChat.MediaMessage || message instanceof CometChat.TextMessage){
      isModerated = message.getModerationStatus() === CometChatUIKitConstants.moderationStatus.disapproved && loggedInUserRef.current?.getUid() === message.getSender()?.getUid();
    }
    return isModerated;
  }

  const shouldIncludeBottomViewHeight = (item: CometChat.BaseMessage) => {
    try {
      let _alignment = setBubbleAlignment(item);

      const hasBottomView =
        messagesTypesMap[item?.getCategory() + "_" + item?.getType()] &&
        messagesTypesMap[item?.getCategory() + "_" + item?.getType()]
          ?.bottomView &&
        messagesTypesMap[
          item?.getCategory() + "_" + item?.getType()
        ]?.bottomView(item, _alignment);
      return getIsMessageModerated(item) && !hideModerationView && !hasBottomView;
    } catch (error) {
      errorHandler(error, "shouldIncludeBottomViewHeight");    
    }
  };

  /**
     * Function to return the footer view for each item based on its type and category.
     * @param {CometChat.BaseMessage} item - The message for which the footer view is to be returned.
     * @returns {any} - Returns the footer view or null.
     */
  const getFooterView: (item: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      try {
        let view: JSX.Element | null = null;
        if (
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()] &&
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()]
            ?.footerView
        ) {
          view =
            messagesTypesMap[
              item?.getCategory() + "_" + item?.getType()
            ]?.footerView(item);
        }
        return view;
      } catch (error: any) {
        errorHandler(error, "getFooterView");
        return null;
      }
    },
    [messagesTypesMap, errorHandler]
  );

  /**
       * Function to return the bubble wrapper for each item based on its type and category.
       * @param {CometChat.BaseMessage} item - The message for which the bubble wrapper is to be returned.
       * @returns {JSX.Element | null} - Returns the bubble wrapper or null.
       */
  const getBubbleWrapper: (item: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      let view: JSX.Element | null = null;
      try {
        if (
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()] &&
          messagesTypesMap[item?.getCategory() + "_" + item?.getType()].bubbleView
        ) {
          view =
            messagesTypesMap[item?.getCategory() + "_" + item?.getType()].bubbleView(item);
        }
        return view;
      } catch (error: any) {
        errorHandler(error, "getBubbleWrapper");
        return view;
      }
    },
    [messagesTypesMap, errorHandler]
  );

  /**
     * Function to mark a given message as read.
     * @param {CometChat.BaseMessage} message - The message to be marked as read.
     * @returns {void}
     */
  const markMessageRead: (message: CometChat.BaseMessage) => void = useCallback((message: CometChat.BaseMessage) => {
    CometChat.markAsRead(message).then(
      () => {
        CometChatMessageEvents.ccMessageRead.next(message);
      },
      (error: unknown) => {
        errorHandler(error, "markAsRead");
      }
    );
  }, [errorHandler])

  /**
     * Function to check and mark a message as read if `hideReceipts` is false and the message is not sent by the logged-in user.
     * @param {CometChat.BaseMessage} message - The message to be checked and marked as read.
     * @returns {void}
     */
  const checkAndMarkMessageAsRead: (message: CometChat.BaseMessage) => void = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        if (
          message.getSender().getUid() !== loggedInUserRef.current?.getUid()) {
          markMessageRead(message);
        }
      } catch (error) {
        errorHandler(error, "checkAndMarkMessageAsRead")
      }
    }, [markMessageRead])

  /**
   * Function to clear the count of new messages. If the last unread message exists, it marks it as read.
   * @returns {void}
   */

  const clearNewMessagesCount: () => void = useCallback(() => {
    try {
      isOnBottomRef.current = true;
      const lastMessage: CometChat.BaseMessage =
        UnreadMessagesRef.current[UnreadMessagesRef.current.length - 1];
      if (lastMessage) {
        checkAndMarkMessageAsRead(lastMessage);
      }
      UnreadMessagesRef.current = [];
      if (newMessageTextRef.current) {
        newMessageTextRef.current = "";
      }

      if (showNewMessagesBanner) {
        setShowNewMessagesBanner(false)
      }
    } catch (error) {
      errorHandler(error, "clearNewMessagesCount")
    }
  }, [checkAndMarkMessageAsRead, showNewMessagesBanner])

  /**
    * Function to prepend messages to the beginning of the current message list.
    * @param {CometChat.BaseMessage[]} messages - The messages to be prepended.
    * @returns {Promise<boolean | CometChat.CometChatException>} - Returns a promise that resolves if the operation is successful or rejects with an error if it fails.
    */
  const prependMessages: (messages: CometChat.BaseMessage[]) => Promise<boolean | CometChat.CometChatException> = useCallback(
    (messages: CometChat.BaseMessage[]) => {
      return new Promise((resolve, reject) => {

        if (isPartOfCurrentChatForSDKEvent(messages[0])) {
          try {
            setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
              const existingMessageIds = new Set(prevMessageList.map(message => message.getId()));
              const uniqueMessages = messages.filter(message => !existingMessageIds.has(message.getId()));
              const updatedMessageList = [...uniqueMessages, ...prevMessageList];
              return updatedMessageList;
            });
            totalMessagesCountRef.current = totalMessagesCountRef.current + messages.length;
            setMessageListState(States.loaded);
            setTimeout(() => {
              if (isFirstScroll) {
                setIsFirstScroll(false)
              }
            }, 100);
            resolve(true);
          } catch (error: any) {
            if (messageList?.length <= 0) {
              setMessageListState(States.error);
            }
            errorHandler(error, "prependMessages");
            reject(error);
          }
        } else {
          if (messageList.length === 0) {
            setMessageListState(States.loaded);
          }
          resolve(true);
        }
      });
    },
    [messageList, isPartOfCurrentChatForSDKEvent, errorHandler, isFirstScroll]
  );
  /**
     * Function to fetch previous messages.
     * @returns {Promise<boolean | CometChat.CometChatException>} - Returns a promise that resolves if the operation is successful or rejects with an error if it fails.
     */
  const fetchPreviousMessages: () => Promise<boolean | CometChat.CometChatException> = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      try {
        let messageToScroll: null | CometChat.BaseMessage = null
        if (shouldScrollToMessage && (goToMessageId || quotedMessageId)) {
          setShouldScrollDirectly(false)
          messageToScroll = await CometChat.getMessageDetails(goToMessageId || quotedMessageId);
        }
        setMessageListState(States.loading);

        let unreadMessageCount = 0;

        if (userRef?.current) {
          const unreadCountObject: any =
            await CometChat.getUnreadMessageCountForUser(
              userRef.current?.getUid()
            );
          unreadMessageCount =
            unreadCountObject[userRef.current?.getUid()] || 0;
          if (unreadMessageCount && unreadMessageCount > 0 && (goToMessageId || quotedMessageId)) {
            new CometChat.MessagesRequestBuilder().setLimit(1).setUID(userRef.current?.getUid()).build()
              .fetchPrevious()
              .then((messagesList: CometChat.BaseMessage[]) => {
                if (messagesList[0]) {
                  CometChat.markAsRead(messagesList[0]).then(() => {
                    CometChatMessageEvents.ccMessageRead.next(messagesList[0]);
                    setQuotedMessageId('')
                  })
                }

              })
          }
        }

        if (groupRef?.current) {
          const unreadCountObject: any =
            await CometChat.getUnreadMessageCountForGroup(
              groupRef.current?.getGuid()
            );
          unreadMessageCount =
            unreadCountObject[groupRef.current?.getGuid()] || 0;
          if (unreadMessageCount && unreadMessageCount > 0 && (goToMessageId || quotedMessageId)) {
            new CometChat.MessagesRequestBuilder().setLimit(1).setGUID(groupRef.current?.getGuid()).build()
              .fetchPrevious()
              .then((messagesList: CometChat.BaseMessage[]) => {
                if (messagesList[0]) {
                  CometChat.markAsRead(messagesList[0]).then(() => {
                    CometChatMessageEvents.ccMessageRead.next(messagesList[0]);
                    setQuotedMessageId('')
                  })
                }

              })
          }
        }

        if (!isFetchingPreviousMessages) {
          isFetchingPreviousMessages = true;
          let targetMessageId = (shouldScrollToMessage && (goToMessageId || quotedMessageId))
            ? Number(goToMessageId || quotedMessageId)
            : messageIdRef.current.prevMessageId;

          messageListManagerRef.current.previous = new MessageListManager(
            errorHandler,
            messagesRequestBuilder,
            userRef.current,
            groupRef.current,
            targetMessageId ?? undefined,
            parentMessageIdRef.current,
            hideGroupActionMessages,
            isAgentChat
          );
          messageListManagerRef?.current.previous.fetchPreviousMessages().then(
            (messagesList: CometChat.BaseMessage[]) => {
              if (messageToScroll && isPartOfCurrentChatForSDKEvent(messageToScroll)) {
                messagesList.push(messageToScroll);
              }
              if (isFirstReloadRef.current) {
                if (!parentMessageIdRef.current) {
                  CometChatUIEvents.ccActiveChatChanged.next({
                    user: userRef.current,
                    group: groupRef.current,
                    message: messagesList.length > 0 ? messagesList[messagesList.length - 1] : undefined,
                    unreadMessageCount
                  });
                }
                if (messagesList.length > 0 && showSmartRepliesRef.current) {
                  toggleSmartReplyView(messagesList[messagesList.length - 1])
                }
                if (messagesList.length == 0 && showConversationStarters) {
                  setShowConversationStarter(true);
                }
                else {
                  setShowConversationStarter(false);

                };
                isFirstReloadRef.current = false;
                MessageListManager.attachConnectionListener(() => {
                  isConnectionReestablishedRef.current = true;
                  fetchActionMessages().then(() => {
                    if (shouldScrollToMessage && hasTargetMessageId) {
                      let unreadMessageCount = 0;
                      if (userRef?.current) {
                        CometChat.getUnreadMessageCountForUser(
                          userRef.current?.getUid()
                        ).then((unreadCountObject: any) => {
                          unreadMessageCount =
                            unreadCountObject[userRef.current!.getUid()] || 0;
                          isConnectionReestablishedRef.current = false;
                          if (unreadMessageCount) {
                            newMessageTextRef.current = unreadMessageCount < 999 ? String(unreadMessageCount) : "999+"
                          }
                        })
                      }

                      if (groupRef.current) {
                        CometChat.getUnreadMessageCountForGroup(
                          groupRef.current?.getGuid()
                        ).then((unreadCountObject: any) => {
                          unreadMessageCount =
                            unreadCountObject[groupRef.current!.getGuid()] || 0;
                          isConnectionReestablishedRef.current = false;
                          if (unreadMessageCount) {
                            newMessageTextRef.current = unreadMessageCount < 999 ? String(unreadMessageCount) : "999+"
                          }

                        })
                      }
                    }
                    fetchNextMessages()
                      .then(
                        (success) => {
                          resolve(success);
                          isConnectionReestablishedRef.current = false;
                        },
                        (error) => {
                          reject(error);
                        }
                      )
                      .catch((error: CometChat.CometChatException) => {
                        errorHandler(error, "fetchActionMessages");
                      });
                  });
                });
                setTimeout(() => {
                  if (shouldScrollToMessage && goToMessageId) {
                    messageIdRef.current.nextMessageId = Number(goToMessageId);
                    fetchNextMessages().then(() => {
                      scrollToMessage()
                      setShouldScrollToMessage(false)
                      markInitialLoadComplete()
                    })
                  } else if (messageRepliedTo) {
                    messageIdRef.current.nextMessageId = Number(messageRepliedTo);
                    fetchNextMessages().then(() => {
                      scrollToMessage()
                      setShouldScrollToMessage(false)
                      markInitialLoadComplete()
                    })
                  } else {
                    markInitialLoadComplete()
                  }
                }, 0);
              }
              isFetchingPreviousMessages = false;
              if (messagesList && messagesList.length > 0) {
                let lastMessage: CometChat.BaseMessage =
                  messagesList[messagesList.length - 1];
                let isMyMessage = lastMessage?.getSender().getUid() == loggedInUserRef.current?.getUid()
                if (!lastMessage.getDeliveredAt() && !isMyMessage) {
                  CometChat.markAsDelivered(lastMessage).then(() => {
                    if (lastMessage.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user && !hideReceipts) {
                      messagesList.forEach((m: CometChat.BaseMessage) => {
                        if (
                          m?.getId() <= lastMessage?.getId() &&
                          !isMyMessage &&
                          !m.getDeliveredAt()
                        ) {
                          m.setDeliveredAt(new Date().getTime());
                        }
                        return m;
                      });
                    }
                  });
                }
                if (
                  (!lastMessage.getReadAt() &&
                    (!isMyMessage ||
                      lastMessage.getCategory() === CometChat.MessageCategory.CALL ||
                      lastMessage.getCategory() === CometChat.MessageCategory.ACTION))
                ) {
                  CometChat.markAsRead(lastMessage).then(() => {
                    if (!hideReceipts && lastMessage.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                      messagesList.forEach((m: CometChat.BaseMessage) => {
                        if (
                          m?.getId() <= lastMessage?.getId() &&
                          (!isMyMessage ||
                            m.getCategory() === CometChat.MessageCategory.CALL ||
                            m.getCategory() === CometChat.MessageCategory.ACTION) &&
                          !m.getReadAt()
                        ) {
                          m.setReadAt(new Date().getTime());
                        }
                        return m;
                      });
                    } else {
                      UnreadMessagesRef.current = [];
                    }

                    CometChatMessageEvents.ccMessageRead.next(lastMessage);

                  });

                } else if (!isMyMessage) {
                  CometChatMessageEvents.ccMessageRead.next(lastMessage);

                }

                prependMessages(messagesList).then(
                  (success) => {
                    if (!goToMessageId && !hasCompletedInitialLoad) {
                      markInitialLoadComplete()
                    }
                    resolve(success);
                  },
                  (error) => {
                    reject(error);
                  }
                );
              } else {
                if (messagesList.length === 0) {
                  if (totalMessagesCountRef.current === 0) {
                    setMessageListState(States.empty);
                  } else if ((!goToMessageId) && !hasCompletedInitialLoad) {
                    markInitialLoadComplete()
                  }
                }
                resolve(true);
              }
            },
            (error: CometChat.CometChatException) => {
              isFetchingPreviousMessages = false;
              if (messageList?.length <= 0) {
                setMessageListState(States.error);
              }
              if (error.code != "REQUEST_IN_PROGRESS") {
                errorHandler(error, "fetchPreviousMessages");
                reject(error);
              }
              else {
                setMessageListState(States.loading)
              }
            }
          );
        } else {
          resolve(true);
        }
      } catch (error: any) {
        if (messageList?.length <= 0) {
          setMessageListState(States.error);
        }
        errorHandler(error, "fetchPreviousMessages");
      }
    });
  }, [
    hideReceipts,
    errorHandler,
    prependMessages,
    showConversationStarters,
    scrollToMessage,
    shouldScrollToMessage,
    goToMessageId,
    messageRepliedTo,
    hasCompletedInitialLoad,
    quotedMessageId
  ]);

  /**
 * Adds the selected reply to the composer and closes the view.
 * @returns Void.
 */
  function onSuggestionClicked(reply: string) {
    CometChatUIEvents.ccComposeMessage.next(reply);
    setShowConversationStarter(false);
    setEnableSmartReplies(false);
  }
  /**
   * Retrieves smart replies for the current user or group context.
   * @returns A promise resolving to an array of smart replies.
   */
  const getSmartReplies = (): Promise<string[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        let receiverId: string = userRef.current
          ? userRef.current?.getUid()
          : groupRef.current?.getGuid()!;
        let receiverType: string = userRef.current
          ? CometChatUIKitConstants.MessageReceiverType.user
          : CometChatUIKitConstants.MessageReceiverType.group;
        const response: any = await CometChat.getSmartReplies(
          receiverId,
          receiverType,
        );

        return resolve(Object.values(response));
      } catch (e) {
        errorHandler(e, "getSmartReplies")
        reject(e);
      }
    });
  };
  /**
   * Retrieves conversation starters for the current user or group context.
   * @returns A promise resolving to an array of conversation starters.
   */
  const getConversationStarter = (): Promise<string[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        let receiverId: string = userRef.current
          ? userRef.current?.getUid()
          : group?.getGuid()!;
        let receiverType: string = userRef.current
          ? CometChatUIKitConstants.MessageReceiverType.user
          : CometChatUIKitConstants.MessageReceiverType.group;
        const response = await CometChat.getConversationStarter(
          receiverId,
          receiverType,
        );
        return resolve(response);
      } catch (e) {
        errorHandler(e, "getConversationStarter")
        reject(e);
      }
    });
  };
  /**
   * Loads and displays either conversation starters or smart replies based on current conditions.
   * @returns A JSX element rendering the appropriate suggestions or null if none are applicable.
   */
  function loadFooterViewContent() {
    if (showConversationStarter) {
      return <div className="cometchat-message-list__footer-conversation-starter">
        <CometChatConversationStarter getConversationStarters={getConversationStarter} onSuggestionClicked={onSuggestionClicked} />
      </div>
    }
    if (enableSmartReplies && showSmartRepliesRef.current) {
      return <div className="cometchat-message-list__footer-smart-replies">
        <CometChatSmartReplies getSmartReplies={getSmartReplies} onSuggestionClicked={onSuggestionClicked} closeCallback={() => {
          setEnableSmartReplies(false);
        }} />
      </div>
    }
    return null;
  }

  /**
    * Function to append  to the end of the current message list.
    * @param {CometChat.BaseMessage[]} messages - The messages to be appended.
    * @returns {Promise<boolean | CometChat.CometChatException>} - Returns a promise that resolves if the operation is successful or rejects with an error if it fails.
    */

  const appendMessages: (messages: CometChat.BaseMessage[]) => Promise<boolean | CometChat.CometChatException> = useCallback(
    (messages: CometChat.BaseMessage[]) => {
      return new Promise((resolve, reject) => {
        try {
          setMessageList((prevMessageList: CometChat.BaseMessage[]): CometChat.BaseMessage[] => {
            const updatedMessageList: CometChat.BaseMessage[] = [
              ...prevMessageList,
              ...messages,
            ];
            return updatedMessageList;
          });
          totalMessagesCountRef.current = totalMessagesCountRef.current + messages.length;
          let id = messages[messages.length - 1]?.getId();
          if (id && messageIdRef.current.prevMessageId !== id) {
            messageIdRef.current.nextMessageId = id;
          }

          if (scrollToBottomOnNewMessages) {
            setTimeout(() => {
              setScrollListToBottom(true);
              isOnBottomRef.current = true;
            }, 100);
          } else {
            if (isConnectionReestablishedRef.current) {
              setScrollListToBottom(isOnBottomRef.current);
              let lastMessage: CometChat.BaseMessage =
                messages[messages?.length - 1];
              if (
                isOnBottomRef.current &&
                lastMessage &&
                lastMessage.getSender().getUid() != loggedInUserRef.current?.getUid() &&
                !lastMessage.getReadAt()
              ) {
                CometChat.markAsRead(lastMessage).then(() => {
                  UnreadMessagesRef.current = [];
                  CometChatMessageEvents.ccMessageRead.next(lastMessage);
                });
              }
            } else {
              setScrollListToBottom(false);
            }
            if (!shouldScrollToMessage && !goToMessageId && !messageRepliedTo) {
              UnreadMessagesRef.current.push(...messages);
              newMessageTextRef.current = UnreadMessagesRef.current.length < 999 ? String(UnreadMessagesRef.current.length) : "999+";
            }
            setShowNewMessagesBanner(true);
          }
          setMessageListState(States.loaded);
          resolve(true);
        } catch (error: any) {
          if (messageList?.length <= 0) {
            setMessageListState(States.error);
          }
          errorHandler(error, "appendMessages");
          reject(error);
        }
      });
    },
    [
      errorHandler,
      isOnBottomRef,
      shouldScrollToMessage,
      goToMessageId,
      messageRepliedTo
    ]
  );

  /**
     * Function to fetch action messages.
     * @returns {Promise<boolean | CometChat.CometChatException>} - Returns a promise that resolves if the operation is successful or rejects with an error if it fails.
     */
  const fetchActionMessages: () => Promise<boolean | CometChat.CometChatException> = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        let requestBuilder = new CometChat.MessagesRequestBuilder()
          .setType(CometChatUIKitConstants.MessageCategory.message)
          .setCategory(CometChatUIKitConstants.MessageCategory.action)
          .setMessageId(messageIdRef.current.nextMessageId)
          .setLimit(30);
        if (userRef.current) {
          requestBuilder.setUID(userRef.current.getUid());
        } else if (groupRef.current) {
          requestBuilder.setGUID(groupRef.current.getGuid());
        }
        requestBuilder
          .build()
          .fetchNext()
          .then((messages) => {
            if (messages && messages.length > 0) {
              messages.forEach((message: CometChat.BaseMessage) => {
                replaceUpdatedMessage(
                  (
                    message as CometChat.Action
                  ).getActionOn() as CometChat.BaseMessage
                );
              });
              return resolve(true);
            } else {
              return resolve(true);
            }
          })
          .catch((error: CometChat.CometChatException) => {
            errorHandler(error, "MessagesRequestBuilder");
            if (messageList?.length <= 0) {
              setMessageListState(States.error);
            }
            return reject(error);
          });
      } catch (error) {
        errorHandler(error, "fetchActionMessages")
      }
    });
  }, [errorHandler]);

  /**
      * Function to fetch the next set of messages.
      * @returns {Promise<boolean | CometChat.CometChatException>} - Returns a promise that resolves if the operation is successful or rejects with an error if it fails.
      */

  const fetchNextMessages: () => Promise<boolean | CometChat.CometChatException> = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        if (messageIdRef.current.nextMessageId) {
          if (!messageListManagerRef.current.next) {
            messageListManagerRef.current.next = new MessageListManager(
              errorHandler,
              messagesRequestBuilder,
              userRef.current,
              groupRef.current,
              messageIdRef.current.nextMessageId,
              parentMessageIdRef.current,
              hideGroupActionMessages,
              isAgentChat
            );
          }
          if (!hasCompletedInitialLoad) {
            setMessageListState(States.loading);
          }
          messageListManagerRef?.current.next.fetchNextMessages().then(
            (messagesList: CometChat.BaseMessage[]) => {
              if (messagesList) {
                if (messagesList.length === 0) {
                  hasReachedBottomRef.current = true;
                  if (totalMessagesCountRef.current === 0) {
                    setMessageListState(States.empty);
                  } else if (!hasCompletedInitialLoad) {
                    markInitialLoadComplete()
                  }
                  resolve(true);
                } else {
                  hasReachedBottomRef.current = false;
                  appendMessages(messagesList).then(
                    (success) => {
                      if (!goToMessageId && !messageRepliedTo && !hasCompletedInitialLoad) {
                        markInitialLoadComplete()
                      }
                      resolve(success);
                    },
                    (error) => {
                      reject(error);
                    }
                  );
                }
              } else {
                resolve(true);
              }
            },
            (error: any) => {
              if (messageList?.length <= 0) {
                setMessageListState(States.error);
              }
              errorHandler(error, "fetchNextMessages");
              reject(error);
            }
          );
        } else {
          resolve(true);
        }
      } catch (error: any) {
        errorHandler(error, "fetchNextMessages");
      }
    });
  }, [
    appendMessages,
    errorHandler,
    messageList?.length,
    messagesRequestBuilder,
    hasCompletedInitialLoad,
    goToMessageId,
    messageRepliedTo]);

  /**
   * Function to update the reply count of a message.
   * @param {CometChat.BaseMessage} message - The message for which the reply count is to be updated.
   * @returns {void}
   */

  const updateReplyCount: (message: CometChat.BaseMessage) => void = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        let isReplyCountUpdated = false
        setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
          const messages = prevMessageList.map((m: CometChat.BaseMessage) => {
            if (m?.getId() === message.getParentMessageId()) {
              if (!isReplyCountUpdated) {
                isReplyCountUpdated = true;
                if (m.getReplyCount()) {
                  m.setReplyCount(m.getReplyCount() + 1);
                } else {
                  if (isOnBottomRef.current) {
                    checkAndScrollToBottom(true)
                  }
                  m.setReplyCount(1);
                }
              }
              return m;
            } else {
              return m;
            }
          });
          return messages;
        });
      } catch (error: any) {
        errorHandler(error, "updateReplyCount");
      }
    },
    [errorHandler]
  );

  /**
     * Function to update unread reply count for a specific message.
     * @param {CometChat.BaseMessage} message - The message for which the unread reply count is updated.
     * @returns {void}
     */
  const updateUnreadReplyCount: (message: CometChat.BaseMessage) => void = useCallback((message: CometChat.BaseMessage) => {
    try {
      setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
        let messageList: CometChat.BaseMessage[] = [...prevMessageList];
        let messageKey = messageList.findIndex(
          (m) => m.getId() === message.getParentMessageId()
        );
        if (messageKey > -1) {
          const messageObj: CometChat.BaseMessage = messageList[messageKey];
          messageList.splice(messageKey, 1, messageObj);
          prevMessageList = [...messageList];
        }
        return prevMessageList;
      });
    } catch (error: any) {
      errorHandler(error, "updateUnreadReplyCount");
    }
  }, [errorHandler])
  /**
   * Toggles the visibility of the Smart Reply view based on the provided message.
   * @param message - The CometChat.BaseMessage object to evaluate for smart replies.
   */
  const toggleSmartReplyView = useCallback((message: CometChat.BaseMessage) => {

    try {
      // Immediately close the smart replies if the conditions are met
      if (!message.getSender() || message.getSender().getUid() === loggedInUserRef.current?.getUid()) {
        setEnableSmartReplies(false);
        return; // Exit immediately if the condition is met
      }
      // Clear the existing timeout if the function is triggered again within 10 seconds
      if (timeoutId) {
        clearTimeout(timeoutId as number);
      }

      // Set a new timeout to execute the logic after 10 seconds
      timeoutId = setTimeout(() => {
        // Check if the message is a text message
        if (message instanceof CometChat.TextMessage) {
          const textMessage = message.getText()?.toLocaleLowerCase();
          // Show smart replies if there are no keywords configured
          if (!smartRepliesKeywords || smartRepliesKeywords.length === 0) {
            setEnableSmartReplies(false);
            setEnableSmartReplies(true);
            return;
          }
          if (smartRepliesKeywords.length > 0) {
            // Preprocess the keywords
            const escapedKeywords = smartRepliesKeywords.map((word: string) =>
              word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
            const regex = new RegExp(`(?:\\b(${escapedKeywords.filter(word => word !== '\\?').join('|')})\\b|\\?)`, 'i');
            setEnableSmartReplies(false);
            setEnableSmartReplies(regex.test(textMessage));
          }

        }
      }, smartRepliesDelayDuration);
    } catch (error) {
      errorHandler(error, "toggleSmartReplyView")

    }

  }, [loggedInUserRef, smartRepliesDelayDuration, smartRepliesKeywords, setEnableSmartReplies]);
  /**
     * Function to add a new message to the current message list.
     * @param {CometChat.BaseMessage} message - The message to be added.
     * @returns {void}
     */
  const addMessage: (message: CometChat.BaseMessage) => void = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        if (showSmartRepliesRef.current) {
          toggleSmartReplyView(message);
        }
        setShowConversationStarter(false)
        totalMessagesCountRef.current += 1;
        if (totalMessagesCountRef.current > 0 && messageListState != States.loaded && hasCompletedInitialLoad) {
          setMessageListState(States.loaded);
        }
        if (!hideGroupActionMessages || (hideGroupActionMessages && message.getCategory() !== CometChatUIKitConstants.MessageCategory.action)) {
          setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
            return [...prevMessageList, message];
          });
        }
        if (!message.getSender() || (message.getSender()?.getUid() == loggedInUserRef.current?.getUid())) {
          setScrollListToBottom(true);
        }

      } catch (error: any) {
        errorHandler(error, "addMessage");
      }
    },
    [errorHandler, scrollListToBottom, hasCompletedInitialLoad]
  );

  /**
     * Function to show and increment the count of unread messages.
     * @param {CometChat.BaseMessage} message - The unread message to be counted.
     * @returns {void}
     */
  const showAndIncrementUnreadCount: (message: CometChat.BaseMessage) => void = useCallback((message: CometChat.BaseMessage) => {
    try {
      if (!isOnBottomRef.current && message.getSender() && message.getSender().getUid() != loggedInUserRef.current?.getUid()) {
        let countText = UnreadMessagesRef.current.length > 1
          ? getLocalizedString("message_list_new_messages")
          : getLocalizedString("message_list_new_message");
        UnreadMessagesRef.current.push(message);
        newMessageTextRef.current = UnreadMessagesRef.current.length < 999 ? String(UnreadMessagesRef.current.length) : "999+";
        setShowNewMessagesBanner(true);
      }
    } catch (error) {
      errorHandler(error, "showAndIncrementUnreadCount")
    }
  }, []);


  /**
    * Function to mark all messages up to a certain point as delivered.
    * @param {CometChat.MessageReceipt} message - The receipt message up to which all messages are marked as delivered.
    * @returns {void}
    */

  const markAllMessagAsDelivered: (message: CometChat.MessageReceipt) => void = useCallback(
    (message: CometChat.MessageReceipt) => {
      try {
        setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
          const messages = prevMessageList.map((m: CometChat.BaseMessage) => {
            if (
              parseInt(m?.getId()?.toString()) <=
              parseInt(message.getMessageId()) &&
              m.getSender().getUid() === loggedInUserRef.current?.getUid() &&
              !m.getDeliveredAt()
            ) {
              m.setDeliveredAt(message.getDeliveredAt());
            }
            return m;
          });
          return messages;
        });
      } catch (error: any) {
        errorHandler(error, "markAllMessagAsDelivered");
      }
    },
    [errorHandler]
  );


  /**
     * Function to mark all messages up to a certain point as read.
     * @param {CometChat.MessageReceipt} message - The receipt message up to which all messages are marked as read.
     * @returns {void}
     */
  const markAllMessageAsRead: (message: CometChat.MessageReceipt) => void = useCallback(
    (message: CometChat.MessageReceipt) => {
      try {
        const listToMarkRead: CometChat.BaseMessage[] = [];
        setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
          const messages = prevMessageList.map((m: CometChat.BaseMessage) => {
            if (
              parseInt(m?.getId()?.toString()) <=
              parseInt(message.getMessageId()) &&
              m.getSender().getUid() === loggedInUserRef.current?.getUid() &&
              !m.getReadAt()
            ) {
              m.setReadAt(message.getReadAt());
              if (
                parseInt(m?.getId()?.toString()) ===
                parseInt(message.getMessageId())
              ) {
                listToMarkRead.push(m);
              }
            }
            return m;
          });
          listToMarkRead.forEach((m) => {
            CometChatMessageEvents.ccMessageRead.next(m);
          });
          return messages;
        });
      } catch (error: any) {
        errorHandler(error, "markAllMessageAsRead");
      }
    },
    [errorHandler]
  );

  /**
     * Function to handle the marking of messages as read or delivered
     * @param {CometChat.MessageReceipt} messageReceipt - The receipt message
     * @returns {void}
     */

  const messageReadAndDelivered: (message: CometChat.MessageReceipt) => void = useCallback(
    (messageReceipt: CometChat.MessageReceipt) => {
      try {
        if (messageReceipt.getReceiverType() ===
          CometChatUIKitConstants.MessageReceiverType.user) {
          if (
            messageReceipt.getSender().getUid() === userRef.current?.getUid() &&
            messageReceipt.getReceiver() === loggedInUserRef.current?.getUid()
          ) {
            messageReceipt.getReceiptType() === "delivery"
              ? markAllMessagAsDelivered(messageReceipt)
              : markAllMessageAsRead(messageReceipt);
          }
        }
        else {
          if (messageReceipt.getReceiptType() === "deliveredToAll") {
            markAllMessagAsDelivered(messageReceipt)
          }
          else if (messageReceipt.getReceiptType() === "readByAll") {
            markAllMessageAsRead(messageReceipt);
          }
        }
      } catch (error: any) {
        errorHandler(error, "messageReadAndDelivered");
      }
    },
    [
      markAllMessagAsDelivered,
      markAllMessageAsRead,
      errorHandler]
  );

  /**
    * Function to check whether to scroll to the bottom of the message list
    * @param {boolean} forceScroll - A boolean indicating whether to force the scroll to the bottom
    * @returns {void}
    */
  const checkAndScrollToBottom: (forceScroll?: boolean) => void = useCallback((forceScroll: boolean = false) => {
    try {
      if (forceScroll || scrollToBottomOnNewMessages) {
        setTimeout(() => {
          setScrollListToBottom(true);
          isOnBottomRef.current = true;
          UnreadMessagesRef.current = [];
        }, 100);
        return;
      }
    } catch (error) {
      errorHandler(error, "checkAndScrollToBottom")
    }
  }, [scrollToBottomOnNewMessages]);

  /**
    * Function to handle when a new message is received
    * @param {CometChat.BaseMessage} message - The new message received.
    * @returns {void}
    */
  const messageReceivedHandler: (message: CometChat.BaseMessage) => void = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        if (isPartOfCurrentChatForSDKEvent(message)) {
          playAudio();
          addMessage(message);
          if (scrollToBottomOnNewMessages) {
            checkAndScrollToBottom();
            checkAndMarkMessageAsRead(message);
          } else {
            if (isOnBottomRef.current) {
              checkAndScrollToBottom(true);
              checkAndMarkMessageAsRead(message);
            } else {
              setScrollListToBottom(false);
              showAndIncrementUnreadCount(message);
            }
          }
        } else if (isThreadOfCurrentChatForSDKEvent(message)) {
          playAudio();
          updateReplyCount(message);
          updateUnreadReplyCount(message);
        } else {
          const shouldMarkDelivered = ((message.getReceiver() instanceof CometChat.Group) && group?.getGuid() === (message.getReceiver() as CometChat.Group).getGuid())
          || (message?.getSender().getUid() === user?.getUid());
          if (
            message.getSender().getUid() !== loggedInUserRef.current?.getUid() && shouldMarkDelivered) {
            CometChat.markAsDelivered(message)
          }
        }
      } catch (error) {
        errorHandler(error, "messageReceivedHandler");
      }
    },
    [
      isPartOfCurrentChatForSDKEvent,
      isThreadOfCurrentChatForSDKEvent,
      addMessage,
      scrollToBottomOnNewMessages,
      checkAndScrollToBottom,
      checkAndMarkMessageAsRead,
      showAndIncrementUnreadCount,
      updateReplyCount,
      updateUnreadReplyCount,
      playAudio,
      errorHandler,
    ]
  );

  /**
     * Function to handle when a group action message is received
     * @param {CometChat.Action} actionMessage - The action message received.
     * @param {CometChat.Group} group - The group where the action message is received.
     * @returns {void}
     */

  const groupActionMessageReceived: (message: CometChat.Action, group: CometChat.Group) => void = useCallback(
    (actionMessage: CometChat.Action, group: CometChat.Group) => {
      try {
        if (group?.getGuid() === groupRef?.current?.getGuid()) {
          addMessage(actionMessage);
          if (!isOnBottomRef.current) {
            if (scrollToBottomOnNewMessages) {
              checkAndScrollToBottom();
              checkAndMarkMessageAsRead(actionMessage);
            } else {
              setScrollListToBottom(false);
              showAndIncrementUnreadCount(actionMessage);
            }
          } else {
            checkAndScrollToBottom(true);
            checkAndMarkMessageAsRead(actionMessage);
          }
        }
      } catch (error) {
        errorHandler(error, "groupActionMessageReceived");
      }
    },
    [
      addMessage,
      scrollToBottomOnNewMessages,
      checkAndScrollToBottom,
      showAndIncrementUnreadCount,
      errorHandler,
    ]
  );

  /**
     * Checks if receipt is of the current list.
     * @param {CometChat.ReactionEvent} receipt - The reaction event object.
     * @returns {boolean} - Returns true if the receipt is of the current list, otherwise returns false.
     */
  const isReactionOfThisList: (receipt: CometChat.ReactionEvent) => boolean = useCallback((receipt: CometChat.ReactionEvent) => {
    try {
      const receiverId = receipt?.getReceiverId();
      const receiverType = receipt?.getReceiverType();
      const reactedById = receipt?.getReaction()?.getReactedBy()?.getUid();
      const parentMessageId = receipt?.getParentMessageId();
      const listParentMessageId = parentMessageId && String(parentMessageId);
      if (listParentMessageId) {
        if (parentMessageId === listParentMessageId) {
          return true;
        } else {
          return false
        }
      } else {
        if (receipt.getParentMessageId()) {
          return false
        }

        if (userRef.current) {
          if (receiverType === CometChatUIKitConstants.MessageReceiverType.user && (receiverId === userRef.current?.getUid() || reactedById === userRef.current?.getUid())) {
            return true
          }
        } else if (groupRef.current) {
          if (receiverType === CometChatUIKitConstants.MessageReceiverType.group && (receiverId === groupRef.current?.getGuid())) {
            return true
          }
        }
      }
      return false
    } catch (error) {
      errorHandler(error, "isReactionOfThisList");
      throw error;
    }
  }, [])

  /**
   * Updates the message list with the reaction information of a message.
   * @param message - The message reaction object.
   * @param isAdded - Indicates whether the reaction is added or removed.
   */
  const messageReactionUpdated: (receipt: CometChat.ReactionEvent, isAdded: boolean) => boolean | undefined = useCallback(
    (receipt: CometChat.ReactionEvent, isAdded: boolean) => {
      try {
        if (!isReactionOfThisList(receipt)) {
          return false;
        }

        setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
          const index = prevMessageList.findIndex(
            (i) =>
              i.getId().toString() ===
              receipt.getReaction()?.getMessageId().toString()
          );
          if (index === -1) {
            return prevMessageList;
          }
          const messageObject = prevMessageList[index];
          let action: CometChat.REACTION_ACTION;
          if (isAdded) {
            action = CometChat.REACTION_ACTION.REACTION_ADDED;
          } else {
            action = CometChat.REACTION_ACTION.REACTION_REMOVED;
          }
          const modifiedMessage = CometChat.CometChatHelper.updateMessageWithReactionInfo(messageObject, receipt.getReaction(), action) as CometChat.BaseMessage;
          if (isAdded && modifiedMessage.getReactions() && modifiedMessage.getReactions().length == 1 && isOnBottomRef.current) {
            scrollToBottom()
          }
          return prevMessageList.map((m) => {
            if (m.getId().toString() === modifiedMessage?.getId().toString()) {
              return CometChatUIKitUtility.clone(modifiedMessage)
            } else {
              return m
            }
          });
        });
      } catch (error) {
        errorHandler(error, "messageReactionUpdated")
      }
    }, [isReactionOfThisList]
  );

  /**
 * Function to handle when a call action message is received
 * @param {CometChat.Call} callMessage - The call message received.
 * @returns {void}
 */
  const callActionMessageReceived: (callMessage: CometChat.Call) => void = useCallback(
    (callMessage: CometChat.Call) => {
      try {
        if (
          isPartOfCurrentChatForSDKEvent(callMessage) &&
          ChatConfigurator.names.includes("calling")
        ) {
          addMessage(callMessage);
          if (!isOnBottomRef.current) {
            if (scrollToBottomOnNewMessages) {
              checkAndScrollToBottom();
              checkAndMarkMessageAsRead(callMessage);
            } else {
              setScrollListToBottom(false);
              showAndIncrementUnreadCount(callMessage);
            }
          } else {
            checkAndScrollToBottom(true);
            checkAndMarkMessageAsRead(callMessage);
          }
        }
      } catch (error) {
        errorHandler(error, "callActionMessageReceived");
      }
    },
    [
      isPartOfCurrentChatForSDKEvent,
      addMessage,
      scrollToBottomOnNewMessages,
      checkAndScrollToBottom,
      showAndIncrementUnreadCount,
      errorHandler,
    ]
  );

  /**
   * Function to process pending messages when streaming ends
   * @returns {void}
   */
  const processPendingMessages = useCallback(() => {
    try {
      const pendingMessagesMap = pendingMessagesMapRef.current;

      // Check if there are any pending messages to process
      if (!pendingMessagesMap || Object.keys(pendingMessagesMap).length === 0) {
        return;
      }

      // Process each runId in the pending messages map
      Object.keys(pendingMessagesMap).forEach(runId => {
        const pendingMessages = pendingMessagesMap[runId];

        if (pendingMessages && pendingMessages.length > 0) {
          setMessageList((prevMessageList) => {
            const messageListCopy = [...prevMessageList];
            const runStartedIndex = messageListCopy.findIndex(
              (msg) => {
                try {
                  return (
                    msg.getType() === CometChatUIKitConstants.streamMessageTypes.run_started && Number(msg.getId()) == Number(runId)
                  );
                } catch (error) {
                  return false;
                }
              }
            );

            if (runStartedIndex !== -1) {
              messageListCopy.splice(runStartedIndex, 1, ...(pendingMessages as CometChat.BaseMessage[]));
            }

            const messageToMarkRead = messageListCopy.find((msg) => {
              return Number(msg.getId()) == Number(runId) && msg.getSender().getUid() === loggedInUserRef.current?.getUid() && !msg.getReadAt()
            })
            messageToMarkRead?.setReadAt(CometChatUIKitUtility.getUnixTimestamp());

            return messageListCopy;
          });

          // Clear processed messages from the map
          delete pendingMessagesMapRef.current[runId];
        }
      });
    } catch (error: any) {
      errorHandler(error, "processPendingMessages");
    }
  }, [errorHandler]);

  /**
  * Function to handle the processing of real-time group and call actions.
  * @param {string} key - The key identifying the type of the message category.
  * @param {CometChat.BaseMessage} message - The incoming message.
  * @param {CometChat.Group} group - The group where the message is received (if applicable).
  * @returns {void}
  */
  const handleGroupAndCallActions = useCallback(
    (
      key: string = "",
      message: CometChat.BaseMessage,
      group?: CometChat.Group
    ) => {
      try {
        switch (key) {
          case CometChatUIKitConstants.MessageCategory.action: {
            if (group) {
              groupActionMessageReceived(message as CometChat.Action, group);
            }
            break;
          }
          case CometChatUIKitConstants.MessageCategory.call: {
            callActionMessageReceived(message as CometChat.Call);

            break;
          }
        }
      } catch (error: any) {
        errorHandler(error, "handleGroupAndCallActions");
      }
    },
    [
      groupActionMessageReceived,
      callActionMessageReceived,
      errorHandler,
    ]
  );

  /**
 * Callback to be executed when the message list is scrolled to the bottom.
 * @returns {Promise<boolean | CometChat.CometChatException>} Returns a promise that resolves to a boolean value or a CometChat exception.
 */
  const onBottomCallback: () => Promise<boolean | CometChat.CometChatException> = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        if (UnreadMessagesRef.current.length > 0) {
          clearNewMessagesCount();
        }
        setScrollListToBottom(false);
        if (messageListManagerRef.current && messageListManagerRef.current.previous) {
          messageListManagerRef.current.previous = null;
        }
        fetchNextMessages().then(
          (success) => {
            resolve(success);
          },
          (error) => {
            reject(error);
          }
        );
      } catch (error: any) {
        errorHandler(error, "onBottomCallback");
      }
    });
  }, [
    messageList,
    checkAndMarkMessageAsRead,
    fetchNextMessages,
    clearNewMessagesCount,
    errorHandler,
  ]);

  /**
 * Callback to be executed when the message list is scrolled to the top.
 * @returns {Promise<boolean | CometChat.CometChatException>} Returns a promise that resolves to a boolean value or a CometChat exception.
 */

  const onTopCallback: () => Promise<boolean | CometChat.CometChatException> = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        setScrollListToBottom(false);
        isOnBottomRef.current = false;
        if (messageListManagerRef.current && messageListManagerRef.current.next) {
          messageListManagerRef.current.next = null;
        }
        fetchPreviousMessages().then(
          (success) => {
            resolve(success);
          },
          (error) => {
            reject(error);
          }
        );
      } catch (error: any) {
        errorHandler(error, "onTopCallback");
      }
    });
  }, [fetchPreviousMessages, errorHandler, isOnBottomRef]);

  /**
 * Function to update the view to focus on a specific message.
 * @param {CometChat.BaseMessage} message - The message to focus on.
 * @returns {void}
 */
  const updateView: (message: CometChat.BaseMessage) => void = useCallback(
    (message: CometChat.BaseMessage) => {
      try {
        elementRefs.current[message.getId()].current?.scrollIntoView({
          block: "center",
        });
      } catch (error) {
        errorHandler(error, "updateView")
      }
    },
    []
  );

  const resetRequestBuilder = useCallback(() => {
    messageListManagerRef.current.previous = null;
    messageListManagerRef.current.next = null;
    messageIdRef.current = { prevMessageId: 0, nextMessageId: 0 };
    setMessageList([]);
    setHasTargetMessageId(false);
    setShouldScrollToMessage(false);
    fetchPreviousMessages();
  }, [
    fetchPreviousMessages,
    setMessageList,
    setHasTargetMessageId,
    setShouldScrollToMessage
  ]);

  /**
 * Function to scroll the message list to the bottom.
 * @returns {void}
 */
  const scrollToBottom: () => void = useCallback(() => {
    try {
      if (!isOnBottomRef.current && hasTargetMessageId) {
        resetRequestBuilder();
      } else {
        clearNewMessagesCount();
        setScrollListToBottom(true);
        setHasTargetMessageId(false);
      }
      hasReachedBottomRef.current = true;
    } catch (error: any) {
      errorHandler(error, "scrollToBottom");
    }
  }, [
    clearNewMessagesCount,
    errorHandler,
    hasTargetMessageId,
    resetRequestBuilder,
    setHasTargetMessageId
  ]);

  /**
 * Function to reset the count of unread messages in a thread.
 * @param {number | string} parentMessageId - The parent message ID of the thread.
 * @returns {void}
 */

  const resetCountForUnreadMessagesInThread: (parentMessageId: number | string) => void = useCallback(
    (parentMessageId: number | string) => {
      try {
        setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
          return prevMessageList.map((m: CometChat.BaseMessage) => {
            if (m?.getId() === parentMessageId) {
              return m;
            } else {
              return m;
            }
          });
        });
      } catch (error) {
        errorHandler(error, "resetCountForUnreadMessagesInThread")
      }
    },
    []
  );

  function getShowPanel(composerId: ComposerId) {
    return (composerId.parentMessageId && parentMessageId && composerId.parentMessageId === parentMessageId) ||
      (!parentMessageId && (composerId.user === userRef?.current?.getUid() || composerId.group === groupRef.current?.getGuid())) ||
      (!composerId.parentMessageId && !composerId.user && !composerId.group);
  }
  const removeMessagesByType = (type: string) => {
    setMessageList((prevMessageList) => {
      return prevMessageList.filter((message) => message.getType() !== type);
    });
  };

  const createUniqueUUID = useMemo(() => {
    const parentMessageId = parentMessageIdRef.current ? parentMessageIdRef.current + "_" : "";
    const uid = user?.getUid() ? user.getUid() + "_" : "";
    const guid = group?.getGuid() ? group.getGuid() + "_" : "";
    const uuid = uid + guid + parentMessageId + CometChatUIKitUtility.ID();
    const currentId = uid + guid + parentMessageId;
    if (!uniqueIdRef.current || !uniqueIdRef.current.includes(currentId)){
      uniqueIdRef.current = "cometchat-message-list-" + uuid;
    }
    return uniqueIdRef.current;
  }, [user, group, parentMessageIdRef]);

  function getCurrentMessageList() {
    if (!uniqueIdRef.current) {
      return null;
    }
    return document.querySelector(`.${uniqueIdRef.current} .cometchat-list__body`)
  }

  /**
 * Function to subscribe to UI events for handling various scenarios such as showing a dialog, handling group member events, handling message edits, etc.
 * @returns {() => void} A cleanup function to unsubscribe from the events.
 */
  const subscribeToUIEvents: () => (() => void) | undefined = useCallback(() => {
    try {
      let ccMessageEdit: Subscription;
      let ccMessageSent: Subscription;
      let ccGroupMemberAdded: Subscription;
      let ccGroupMemberBanned: Subscription;
      let ccGroupMemberKicked: Subscription;
      let ccGroupMemberScopeChanged: Subscription;
      let ccGroupLeft: Subscription;
      let ccShowOngoingCall: Subscription;
      let ccOutgoingCall: Subscription;
      let ccCallEnded: Subscription;
      let ccCallRejected: Subscription;
      let ccCallAccepted: Subscription;
      let ccShowDialog: Subscription;
      let ccHideDialog: Subscription;
      let ccShowPanel: Subscription;
      let ccHidePanel: Subscription;
      let ccMessageTranslated: Subscription;
      let ccMessageRead: Subscription;
      let onTextMessageReceived: Subscription;
      let onMediaMessageReceived: Subscription;
      let onCustomMessageReceived: Subscription;
      let onMessagesDelivered: Subscription;
      let onMessagesRead: Subscription;
      let onMessagesDeliveredToAll: Subscription;
      let onMessagesReadByAll: Subscription;
      let onMessageDeleted: Subscription;
      let onMessageEdited: Subscription;
      let onMessageReactionAdded: Subscription;
      let onMessageReactionRemoved: Subscription;
      let onFormMessageReceived: Subscription;
      let onSchedulerMessageReceived: Subscription;
      let onCardMessageReceived: Subscription;
      let onCustomInteractiveMessageReceived: Subscription;
      let onMessageModerated: Subscription;
      // let onAIToolResultReceived:Subscription;
      // let onAIToolArgumentsReceived:Subscription;
      let onAIAssistantMessageReceived: Subscription;
      ccShowDialog = CometChatUIEvents.ccShowDialog.subscribe(
        (data: IDialog) => {
          imageModerationDialogRef.current = data.child;
          setShowConfirmDialog(true);
        }
      );
      ccHideDialog = CometChatUIEvents.ccHideDialog.subscribe(() => {
        imageModerationDialogRef.current = null;
        setShowConfirmDialog(false);
      });
      ccShowPanel = CometChatUIEvents.ccShowPanel.subscribe(
        (data: IPanel) => {
          if ((!data.message || ((data.message.getParentMessageId() && parentMessageId && data.message.getParentMessageId() == parentMessageId) || (!parentMessageId && !data.message?.getParentMessageId()))) && (!data.composerId || getShowPanel(data.composerId))) {
            if (data.position === PanelAlignment.messageListFooter) {
              if (panelViewRef.current) {
                panelViewRef.current = null;
                setShowNewMessagesBanner(false);
                setShowFooterPanelView(false);
              }
              setTimeout(() => {
                panelViewRef.current = data.child;
                setShowFooterPanelView(true);
              }, 0);
            }
            else if (data.position === PanelAlignment.messageListHeader) {
              if (headerViewRef.current) {
                headerViewRef.current = null;
                setShowHeaderPanelView(false);
              }

              setTimeout(() => {
                headerViewRef.current = data.child;
                setShowHeaderPanelView(true);
              }, 0);
            }
          }
        }
      );
      ccHidePanel = CometChatUIEvents.ccHidePanel.subscribe(
        (alignment) => {
          if (alignment === PanelAlignment.messageListFooter) {
            panelViewRef.current = null;
            setShowNewMessagesBanner(false);
            setShowFooterPanelView(false);
          }
          else if (alignment === PanelAlignment.messageListHeader) {
            headerViewRef.current = null;
            setShowHeaderPanelView(false);
          }
        }
      );

      ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe(
        (obj: IMessages) => {
          let status = obj.status;
          let message = obj.message;
          let shouldAddMessage = !hasTargetMessageId || (hasTargetMessageId && hasReachedBottomRef.current)
          switch (status) {
            case MessageStatus.inprogress: {
              
              setIsMessageInProgress(true);
              if (isPartOfCurrentChatForUIEvent(message) && shouldAddMessage) {
                removeMessagesByType(CometChatUIKitConstants.streamMessageTypes.run_started);
                addMessage(message);
              }
              break;
            }
            case MessageStatus.success: {
              if (isPartOfCurrentChatForUIEvent(message) && shouldAddMessage) {
                
                if(isAgentChat && totalMessagesCountRef.current > 0) {
                  startStreamingMessage();
                  let msg = createMessageCopyFromBaseMessage(message, user);
                  addMessage(msg);
                }
                if (showNewMessagesBanner) {
                  setShowNewMessagesBanner(false);
                  UnreadMessagesRef.current = [];
                }
                updateMessage(CometChatUIKitUtility.clone(message), true);

              }
              if (isThreadOfCurrentChatForUIEvent(message)) {
                updateReplyCount(CometChatUIKitUtility.clone(message));
              }
              debouncedSetMessageProgress();
              break;
            }
            default:
              updateMessage(message, true);
              if (isThreadOfCurrentChatForUIEvent(message)) {
                updateReplyCount(CometChatUIKitUtility.clone(message));
              }
              debouncedSetMessageProgress();
              break;
          }
        }
      );

      if (!isAgentChat) {
        onCustomMessageReceived = CometChatMessageEvents.onCustomMessageReceived.subscribe((customMessage: CometChat.CustomMessage) => {
          messageReceivedHandler(customMessage);
        });
        ccShowOngoingCall = CometChatUIEvents.ccShowOngoingCall.subscribe(
          (data: IShowOngoingCall) => {
            const shouldShowCallscreen =
              data.child ? true : false;
            const isParentMessageMatch =
              data.message &&
              ((data.message.getParentMessageId() &&
                parentMessageIdRef.current &&
                data.message.getParentMessageId() === parentMessageIdRef.current) ||
                (!parentMessageIdRef.current && !data.message?.getParentMessageId()));

            if (isParentMessageMatch || !data.message) {
              setShowCallscreen(shouldShowCallscreen);
              setOngoingCallView(data.child);
            }
          }
        );
        ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe(
          (call: CometChat.Call) => {
            setShowCallscreen(false);
            setOngoingCallView(null);
            if (!call) {
              return;
            }
            callActionMessageReceived(call);
          }
        );
        ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe(
          (call: CometChat.Call) => {
            callActionMessageReceived(call);
          }
        );
        ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe(
          (call: CometChat.Call) => {
            callActionMessageReceived(call);
          }
        );
        ccCallAccepted = CometChatCallEvents.ccCallAccepted.subscribe(
          (call: CometChat.Call) => {
            callActionMessageReceived(call);
          }
        );
        ccMessageRead = CometChatMessageEvents.ccMessageRead.subscribe(
          (message: CometChat.BaseMessage) => {
            if (isThreadOfCurrentChatForSDKEvent(message) && message.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
              resetCountForUnreadMessagesInThread(message.getParentMessageId());
            }
          }
        );
        ccGroupMemberAdded =
          CometChatGroupEvents.ccGroupMemberAdded.subscribe(
            (item: IGroupMemberAdded) => {
              item.messages.map((message) => {
                groupActionMessageReceived(message, item.userAddedIn);
              });
            }
          );
        ccGroupMemberBanned =
          CometChatGroupEvents.ccGroupMemberBanned.subscribe(
            (item: IGroupMemberKickedBanned) => {
              groupActionMessageReceived(item.message, item.kickedFrom);
            }
          );
        ccGroupMemberKicked =
          CometChatGroupEvents.ccGroupMemberKicked.subscribe(
            (item: IGroupMemberKickedBanned) => {
              groupActionMessageReceived(item.message, item.kickedFrom);
            }
          );
        ccGroupMemberScopeChanged =
          CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(
            (item: IGroupMemberScopeChanged) => {
              groupActionMessageReceived(item.message, item.group);
            }
          );
        ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe(
          (item: IGroupLeft) => {
            groupActionMessageReceived(item.message, item.leftGroup);
          }
        );
        ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe(
          (obj: IMessages) => {
            if (obj?.status === MessageStatus.success) {
              if (isPartOfCurrentChatForUIEvent(obj.message)) {
                toastTextRef.current = getLocalizedString("message_list_message_edited");
                setShowToast(true);
                updateMessage(obj.message, false);
              }
            }
          }
        );

        ccMessageTranslated = CometChatMessageEvents.ccMessageTranslated.subscribe(
          (obj: IMessages) => {
            if (isPartOfCurrentChatForSDKEvent(obj.message)) {
              if (obj?.status === MessageStatus.success) {
                toastTextRef.current = getLocalizedString("message_list_message_translated");
                setShowToast(true);
                updateMessage(obj.message, false);
                setTimeout(() => {
                  updateView(obj.message);
                }, 100);
              }
              else {
                toastTextRef.current = getLocalizedString("message_list_message_already_translated");
                setShowToast(true);
              }
            }
          }
        );


        onTextMessageReceived = CometChatMessageEvents.onTextMessageReceived.subscribe((textMessage: CometChat.TextMessage) => {
          messageReceivedHandler(textMessage);
        });
        onMediaMessageReceived = CometChatMessageEvents.onMediaMessageReceived.subscribe((mediaMessage: CometChat.MediaMessage) => {
          messageReceivedHandler(mediaMessage);

        });

        onMessagesDelivered = CometChatMessageEvents.onMessagesDelivered.subscribe((messageReceipt: CometChat.MessageReceipt) => {
          if (!hideReceipts && messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
            messageReadAndDelivered(messageReceipt);
          }
        });
        onMessagesRead = CometChatMessageEvents.onMessagesRead.subscribe((messageReceipt: CometChat.MessageReceipt) => {
          if (!hideReceipts && messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
            messageReadAndDelivered(messageReceipt);
          }
        });
        onMessagesDeliveredToAll = CometChatMessageEvents.onMessagesDeliveredToAll.subscribe((messageReceipt: CometChat.MessageReceipt) => {
          if (!hideReceipts) {
            messageReadAndDelivered(messageReceipt);
          }
        });
        onMessagesReadByAll = CometChatMessageEvents.onMessagesReadByAll.subscribe((messageReceipt: CometChat.MessageReceipt) => {
          if (!hideReceipts) {
            messageReadAndDelivered(messageReceipt);
          }
        });
        onMessageDeleted = CometChatMessageEvents.onMessageDeleted.subscribe((deletedMessage: CometChat.BaseMessage) => {
          replaceUpdatedMessage(deletedMessage);
        });
        onMessageEdited = CometChatMessageEvents.onMessageEdited.subscribe((editedMessage: CometChat.BaseMessage) => {
          replaceUpdatedMessage(editedMessage);
        });
        onMessageReactionAdded = CometChatMessageEvents.onMessageReactionAdded.subscribe((reactionReceipt) => {
          messageReactionUpdated(reactionReceipt, true);
        });
        onMessageReactionRemoved = CometChatMessageEvents.onMessageReactionRemoved.subscribe((reactionReceipt) => {
          messageReactionUpdated(reactionReceipt, false);
        });
        onFormMessageReceived = CometChatMessageEvents.onFormMessageReceived.subscribe((formMessage: CometChat.InteractiveMessage) => {
          messageReceivedHandler(formMessage);
        });
        onSchedulerMessageReceived = CometChatMessageEvents.onSchedulerMessageReceived.subscribe((schedulerMessage: CometChat.InteractiveMessage) => {
          messageReceivedHandler(schedulerMessage);
        });
        onCardMessageReceived = CometChatMessageEvents.onCardMessageReceived.subscribe((cardMessage: CometChat.InteractiveMessage) => {
          messageReceivedHandler(cardMessage);
        });
        onCustomInteractiveMessageReceived = CometChatMessageEvents.onCustomInteractiveMessageReceived.subscribe((customInteractiveMessage: CometChat.InteractiveMessage) => {
          messageReceivedHandler(customInteractiveMessage);
        });
        onMessageModerated =
        CometChatMessageEvents.onMessageModerated.subscribe(
          (moderatedMessage: CometChat.BaseMessage) => {
            updateMessageByMuid(moderatedMessage);
          }
        );
      }
      else {
        onAIAssistantMessageReceived = CometChatMessageEvents.onAIAssistantMessageReceived.subscribe((message: CometChat.AIAssistantMessage) => {
          try {
            if (!isPartOfCurrentChatForSDKEvent(message)) {
              return;
            }
            // Check if message has getRunId method and get the runId
            const runId = message.getAssistantMessageData().getRunId();
            if (runId) {
              // Store the assistant message in the pending messages map
              if (!pendingMessagesMapRef.current[runId]) {
                pendingMessagesMapRef.current[runId] = [];
              }
              pendingMessagesMapRef.current[runId].push(message);
              if(!isStreamingRef.current) processPendingMessages()
            }
          } catch (error: any) {
            errorHandler(error, "onAIAssistantMessageReceived");
          }
        })
        //   onAIToolArgumentsReceived = CometChatMessageEvents.onAIToolArgumentsReceived.subscribe((message:CometChat.AIToolArgumentMessage)=>{
        //   try {
        //     // Check if message has getRunId method and get the runId
        //     const runId = message.getToolArgumentMessageData()?.getRunId();
        //     if (runId) {
        //       // Store the tool message in the pending messages map
        //       if (!pendingMessagesMapRef.current[runId]) {
        //         pendingMessagesMapRef.current[runId] = [];
        //       }
        //       pendingMessagesMapRef.current[runId].push(message);
        //     }
        //   } catch (error: any) {
        //     errorHandler(error, "onToolMessageReceived");
        //   }
        // })
        //  onAIToolResultReceived = CometChatMessageEvents.onAIToolResultReceived.subscribe((message: CometChat.AIToolResultMessage)=>{
        //   try {
        //     const runId = message.getToolResultMessageData()?.getRunId();
        //     if (runId) {
        //       if (!pendingMessagesMapRef.current[runId]) {
        //         pendingMessagesMapRef.current[runId] = [];
        //       }
        //       pendingMessagesMapRef.current[runId].push(message);
        //     } 
        //   } catch (error: any) {
        //     errorHandler(error, "onToolMessageReceived");
        //   }
        // })
      }
      return () => {
        try {
          ccMessageEdit?.unsubscribe();
          ccMessageSent?.unsubscribe();
          ccGroupMemberAdded?.unsubscribe();
          ccGroupMemberBanned?.unsubscribe();
          ccGroupMemberKicked?.unsubscribe();
          ccGroupMemberScopeChanged?.unsubscribe();
          ccGroupLeft?.unsubscribe();
          ccShowOngoingCall?.unsubscribe();
          ccOutgoingCall?.unsubscribe();
          ccCallEnded?.unsubscribe();
          ccCallRejected?.unsubscribe();
          ccCallAccepted?.unsubscribe();
          ccShowDialog?.unsubscribe();
          ccHideDialog?.unsubscribe();
          ccShowPanel?.unsubscribe();
          ccHidePanel?.unsubscribe();
          ccMessageTranslated?.unsubscribe();
          ccMessageRead?.unsubscribe();
          onTextMessageReceived?.unsubscribe();
          onMessageModerated?.unsubscribe();
          onMediaMessageReceived?.unsubscribe();
          onCustomMessageReceived?.unsubscribe();
          onMessagesDelivered?.unsubscribe();
          onMessagesRead?.unsubscribe();
          onMessagesDeliveredToAll?.unsubscribe();
          onMessagesReadByAll?.unsubscribe();
          onMessageDeleted?.unsubscribe();
          onMessageEdited?.unsubscribe();
          onMessageReactionAdded?.unsubscribe();
          onMessageReactionRemoved?.unsubscribe();
          onFormMessageReceived?.unsubscribe();
          onSchedulerMessageReceived?.unsubscribe();
          onCardMessageReceived?.unsubscribe();
          onCustomInteractiveMessageReceived?.unsubscribe();
          onAIAssistantMessageReceived?.unsubscribe();
          // onAIToolArgumentsReceived?.unsubscribe();
          // onAIToolResultReceived?.unsubscribe();
        } catch (error: any) {
          errorHandler(error, "subscribeToUIEvents");
        }
      };
    } catch (error: any) {
      errorHandler(error, "subscribeToUIEvents");
    }
  }, [
    validateTransientMessage,
    resetCountForUnreadMessagesInThread,
    callActionMessageReceived,
    isThreadOfCurrentChatForSDKEvent,
    updateMessage,
    groupActionMessageReceived,
    isPartOfCurrentChatForUIEvent,
    updateView,
    addMessage,
    isThreadOfCurrentChatForUIEvent,
    updateReplyCount,
    errorHandler,
    showFooterPanelView,
    hasTargetMessageId,
    isAgentChat,
  ]);

  const { debouncedCallback: debouncedUpdateVisibleArea } = useDebouncedCallback(
    () => {
      const messageListBody = getCurrentMessageList();
      if (!messageListBody) return;

      const { scrollTop, scrollHeight, clientHeight } = messageListBody;
      const isVisible = (scrollHeight - scrollTop - clientHeight) > 50;

      if (hasVisibleAreaRef.current !== isVisible) {
        hasVisibleAreaRef.current = isVisible;
        setHasVisibleArea(isVisible);
      }
    },
    100
  );
  /**
   * Fuction to handle realtime date seperator update.
   *
   * @type {void}
   */
  const handleScroll = useCallback(() => {
    try {
      const messageListBody = getCurrentMessageList();
      if (!messageListBody) return;
      debouncedUpdateVisibleArea();
      let firstVisibleMessageId: any = null;
      Object.keys(elementRefs.current).some((messageId) => {
        const element = elementRefs.current[messageId];
        if (element?.current) {
          const rect = element.current.getBoundingClientRect();
          const containerRect = messageListBody.getBoundingClientRect();
          const elementHeight = rect.bottom - rect.top;
          const visibleHeight = Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top);
          if (visibleHeight / elementHeight >= 0.1) {
            firstVisibleMessageId = messageId;
            return true;
          }
        }
        return false;
      });
      if (firstVisibleMessageId) {
        const currentVisibleMessage = getMessageById(firstVisibleMessageId);
        if (currentVisibleMessage) {
          const messageDate = currentVisibleMessage.getSentAt();
          setTimeout(() => {
            if (isDateDifferent(stickyDateHeaderRef.current, messageDate)) {
              setDateHeader(messageDate);
              stickyDateHeaderRef.current = messageDate
            }
          }, 0);
        }
      }
    } catch (error) {
      errorHandler(error, "handleScroll")
    }
  }, [getMessageById, setDateHeader, messageList])

  useEffect(() => {
    try {
      let listElement = getCurrentMessageList();
      if (listElement) {
        listElement.addEventListener("scroll", handleScroll)
      }
      return () => {
        if (listElement) {
          listElement.removeEventListener("scroll", handleScroll);
        }
      }
    } catch (error) {
      errorHandler(error, "addEventListener")
    }

  }, [handleScroll])
  /**
   * Function to close toast
   */
  const closeToast = () => {
    setShowToast(false);
  }

  /**
 * Function to check if two dates are different
 * @param {number | undefined} firstDate - The first date to compare
 * @param {number | undefined} secondDate - The second date to compare
 * @returns {boolean | undefined} Returns true if dates are different, false otherwise
 */
  const isDateDifferent: (firstDate: number | undefined, secondDate: number | undefined) => boolean | undefined = useCallback(
    (firstDate: number | undefined, secondDate: number | undefined) => {
      try {
        let firstDateObj: Date, secondDateObj: Date;
        firstDateObj = new Date(firstDate! * 1000);
        secondDateObj = new Date(secondDate! * 1000);
        return (
          firstDateObj.getDate() !== secondDateObj.getDate() ||
          firstDateObj.getMonth() !== secondDateObj.getMonth() ||
          firstDateObj.getFullYear() !== secondDateObj.getFullYear()
        );
      } catch (error: any) {
        errorHandler(error, "isDateDifferent");
      }
    },
    [errorHandler]
  );

  /**
   * Function to decide whether to show header title or not
   * @param {CometChat.BaseMessage} message - The message for which header title needs to be decided
   * @returns {boolean} Returns true if header title needs to be shown, false otherwise
   */

  const showHeaderTitle: (message: CometChat.BaseMessage) => boolean = useCallback(
    (message: CometChat.BaseMessage) => {
      try {

        if (messageAlignment === MessageListAlignment.left) {
          return true;
        } else {
          if (
            groupRef.current &&
            message?.getCategory() !==
            CometChatUIKitConstants.MessageCategory.action &&
            message?.getSender() &&
            message?.getSender()?.getUid() !== loggedInUserRef.current?.getUid() &&
            messageAlignment === MessageListAlignment.standard
          ) {
            return true;
          } else {
            return false;
          }
        }
      } catch (error) {
        errorHandler(error, "showHeaderTitle");
        throw error;
      }
    },
    [messageAlignment]
  );

  /**
 * Function to get leading view for message bubble
 * @param {CometChat.BaseMessage} message - The message for which leading view needs to be fetched
 * @returns {any} Returns JSX.Element or null for leading view of a message bubble
 */

  const getBubbleLeadingView: (message: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      try {
        if (
          ((item?.getCategory() !==
            CometChatUIKitConstants.MessageCategory.action &&
            item?.getCategory() !== CometChatUIKitConstants.MessageCategory.call &&
            showHeaderTitle(item)) || (item.getCategory() === CometChatUIKitConstants.MessageCategory.agentic) || (item.getType() === CometChatUIKitConstants.streamMessageTypes.run_started)) &&
          !hideAvatar
        ) {
          return (
            <CometChatAvatar
              name={item?.getSender() ? item?.getSender()?.getName() : loggedInUserRef.current?.getName()!}
              image={item?.getSender() ? item?.getSender()?.getAvatar() : loggedInUserRef.current?.getAvatar()!}
            ></CometChatAvatar>
          );
        } else {
          return null;
        }
      } catch (error) {
        errorHandler(error, "getBubbleLeadingView")
      }
    },
    [showHeaderTitle, hideAvatar]
  );

  /**
 * Function to get header date for message bubble
 * @param {CometChat.BaseMessage} item - The message bubble for which header date needs to be fetched
 * @returns {JSX.Element} Returns JSX.Element for header date of a message bubble
 */
  const getBubbleHeaderDate: (item: CometChat.BaseMessage) => JSX.Element = useCallback(
    (item: CometChat.BaseMessage) => {
      return (
        <>
          <CometChatDate
            timestamp={item.getSentAt()}
            calendarObject={getSeparatorDateFormat()}
          ></CometChatDate>
        </>
      );
    },
    [separatorDateTimeFormat]
  );

  /**
 * Function to get header title for message bubble
 * @param {CometChat.BaseMessage} item - The message bubble for which header title needs to be fetched
 * @returns {JSX.Element} Returns JSX.Element for header title of a message bubble
 */

  const getBubbleHeaderTitle: (item: CometChat.BaseMessage) => JSX.Element = useCallback(
    (item: CometChat.BaseMessage) => {
      return (
        <>{item?.getSender()?.getName() || loggedInUserRef.current?.getName()}</>
      );
    },
    []
  );

  /**
 * Function to get the header of a message bubble
 * @param {CometChat.BaseMessage} item - The message bubble for which the header needs to be fetched
 * @returns {any} Returns JSX.Element or null for header view of a message bubble
 */

  const getBubbleHeader: (item: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      try {
        if (getHeaderView(item)) {
          return getHeaderView(item);
        } else {
          if (
            item?.getCategory() !==
            CometChatUIKitConstants.MessageCategory.action &&
            item?.getCategory() !== CometChatUIKitConstants.MessageCategory.call
          ) {
            return showHeaderTitle(item) ? getBubbleHeaderTitle(item) : null
          }
        }

        return null;
      } catch (error) {
        errorHandler(error, "getBubbleHeader");
        return null;
      }
    },
    [
      getBubbleHeaderDate,
      showHeaderTitle,
      getHeaderView,
      getBubbleHeaderTitle,
    ]
  );

  const reactionItemClicked = useCallback((
    reaction: CometChat.Reaction,
    message: CometChat.BaseMessage
  ) => {
    try {
      if (reaction?.getReactedBy()?.getUid() === loggedInUserRef.current?.getUid()) {
        reactToMessages(reaction?.getReaction(), message);
      }
    } catch (error) {
      errorHandler(error, "reactionItemClicked")
    }
  }, [reactToMessages])

  /**
 * Function to get reaction view for message bubble
 * @param {CometChat.BaseMessage} item - The message bubble for which the reaction view needs to be fetched
 * @returns {JSX.Element | null} Returns JSX.Element for reaction view of a message bubble or null
 */
  const getReactionView: (item: CometChat.BaseMessage) => JSX.Element | null = useCallback(
    (item: CometChat.BaseMessage) => {
      const reactions = item?.getReactions() || [];
      const alignment = setBubbleAlignment(item);
      if (reactions && reactions.length > 0) {
        return <CometChatReactions
          messageObject={item}
          alignment={alignment}
          hoverDebounceTime={500}
          onReactionListItemClick={onReactionListItemClick ?? reactionItemClicked}
          reactionsRequestBuilder={reactionsRequestBuilder}
          onReactionClick={(reaction: CometChat.ReactionCount, message: CometChat.BaseMessage) => {
            if (onReactionClick) {
              onReactionClick(reaction, message);
            } else {
              reactToMessages(reaction?.getReaction(), message);
            }
          }
          }
        />
      } else {
        return null;
      }
    }, [reactToMessages, setBubbleAlignment]
  );
  /**
 * Function to get footer view for message bubble
 * @param {CometChat.BaseMessage} item - The message bubble for which the footer view needs to be fetched
 * @returns {any} Returns JSX.Element for footer view of a message bubble
 */
  const getBubbleFooterView: (item: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      if (getFooterView(item)) {
        return getFooterView(item);
      } else {
        if (getIsMessageModerated(item)) {
          return null;
        }
        return getReactionView(item);
      }
    },
    [getReactionView, getFooterView, setBubbleAlignment]
  );

  /**
 * Function to get thread view for message bubble
 * @param {CometChat.BaseMessage} item - The message bubble for which the thread view needs to be fetched
 * @returns {any} Returns JSX.Element for thread view of a message bubble
 */
  const getBubbleThreadView: (item: CometChat.BaseMessage) => any = useCallback(
    (item: CometChat.BaseMessage) => {
      if (getIsMessageModerated(item)) {
        return null;
      }
      if (item?.getReplyCount() && !item?.getDeletedAt()) {
        return (
          <div className="cometchat-message-bubble__thread-view-replies">
            <CometChatButton text={getThreadCount(item)} hoverText={getThreadCount(item)} iconURL={repliesRightIcon} onClick={() => {
              openThreadView(item)
            }} />
          </div>
        );
      }
    },
    [
      setBubbleAlignment,
      openThreadView,
    ]
  );

  /**
* Function to create status view for the message
* @param {CometChat.BaseMessage} item - The message for which the status view needs to be fetched
* @returns {any} - Returns JSX.Element or null for status view of a message
*/

const getStatusInfoView: (item: CometChat.BaseMessage) => any = useCallback(
  (item: CometChat.BaseMessage) => {
    try {
      let _alignment = setBubbleAlignment(item);
      if (
        messagesTypesMap[item?.getCategory() + "_" + item?.getType()] &&
        messagesTypesMap[item?.getCategory() + "_" + item?.getType()]?.statusInfoView
      ) {
        return messagesTypesMap[item?.getCategory() + "_" + item?.getType()]?.statusInfoView(
          item,
          _alignment,
          hideReceipts,
          messageSentAtDateTimeFormat,
          isAgentChat
        );
      }
      else if (item.getCategory() === CometChatUIKitConstants.MessageCategory.custom && item.getType() != CometChatUIKitConstants.streamMessageTypes.run_started) {
        return ChatConfigurator.getDataSource().getStatusInfoView(item, _alignment, hideReceipts, messageSentAtDateTimeFormat)
      }
      else{
        return null;
      }
    } catch (error: any) {
      errorHandler(error, "getStatusInfoView");
      return null;
    }
  },
  [
    hideReceipts,
    messagesTypesMap,
    errorHandler,
    setBubbleAlignment,
    messageSentAtDateTimeFormat,
    isAgentChat
  ]
);

  const MODERATED_MESSAGE_QUICK_OPTIONS_COUNT = 3;

  /**
 * Function to compute quick option count if the message is moderated
 * @param {CometChat.BaseMessage} message - The message for which the count needs to be updated
 * @param {number} baseCount - The default count of quick options
 * @returns {number} - Returns JSX.Element for a message bubble
 */

  const computeQuickOptionsCount = (
    message: CometChat.BaseMessage,
    baseCount?: number | undefined
  ): number | undefined => {
   
    if (getIsMessageModerated(message)) {
      return MODERATED_MESSAGE_QUICK_OPTIONS_COUNT;
    }
    return baseCount;
  };

  /**
 * Function to generate a message bubble
 * @param {CometChat.BaseMessage} item - The message for which the bubble needs to be created
 * @param {number} i - The index of the message
 * @returns {JSX.Element} - Returns JSX.Element for a message bubble
 */

  const getMessageBubbleItem: (item: CometChat.BaseMessage, i: number) => JSX.Element = useCallback(
    (item: CometChat.BaseMessage, i: number) => {
      return (
        <CometChatMessageBubble
          setRef={(ref) => {
            elementRefs.current[item.getId()] = ref;
          }}
          leadingView={getBubbleLeadingView(item)}
          headerView={getBubbleHeader(item)}
          footerView={getBubbleFooterView(item)}
          contentView={getContentView(item)}
          bottomView={getBottomView(item)}
          id={item?.getId() || item?.getMuid()}
          options={getMessageOptions(item)}
          alignment={setBubbleAlignment(item)}
          replyView={getReplyView(item)}
          includeBottomViewHeight={shouldIncludeBottomViewHeight(item)}
          threadView={!isAgentChat && getBubbleThreadView(item)}
          statusInfoView={getStatusInfoView(item)}
          type={item.getDeletedAt() ? CometChatUIKitConstants.MessageTypes.delete : item.getType()}
          category={item.getDeletedAt() ? CometChatUIKitConstants.MessageCategory.action : item.getCategory()}
          topMenuSize={computeQuickOptionsCount(item, quickOptionsCount)}
        ></CometChatMessageBubble>
      );
    },
    [
      getBubbleLeadingView,
      getBubbleHeader,
      getBubbleFooterView,
      getContentView,
      messageAlignment,
      setBubbleAlignment,
      getBubbleThreadView,
      getStatusInfoView,
      getMessageOptions,
      getBottomView,
      quickOptionsCount
    ]
  );

  /**
 * Function to create date for the message bubble
 * @param {CometChat.BaseMessage} item - The message for which the date needs to be fetched
 * @param {number} i - The index of the message
 * @returns {JSX.Element | null} - Returns JSX.Element or null for date of a message bubble
 */
  const getMessageBubbleDateHeader: (item: CometChat.BaseMessage, i: number) => JSX.Element | null = useCallback(
    (item: CometChat.BaseMessage, i: number) => {
      if (
        i != 0 && isDateDifferent(messageList[i - 1]?.getSentAt(), item?.getSentAt()) && !hideDateSeparator
      ) {
        return (
          <div
            className='cometchat-message-list__bubble-date-header'
            key={`${item.getId()}-${item.getSentAt()}`}
          >
            <CometChatDate
              calendarObject={getSeparatorDateFormat()}
              timestamp={item.getSentAt()}
            ></CometChatDate>
          </div>
        );
      } else {
        if ((i == 0 && !isOnBottomRef.current) || ((messageList.length < 10) && i == 0)) {
          setTimeout(() => {
            handleScroll()
          }, 0);
        }
        return null;
      }
    },
    [
      messageList,
      isDateDifferent,
      hideDateSeparator
    ]
  );

  /**
 * Function to create a message bubble
 * @param {CometChat.BaseMessage} m - The message for which the bubble needs to be created
 * @param {number} i - The index of the message
 * @returns {JSX.Element} - Returns JSX.Element for a message bubble
 */
  const getMessageBubble: (m: CometChat.BaseMessage, i: number) => JSX.Element = useCallback(
    (m: CometChat.BaseMessage, i: number) => {
      let _alignment = setBubbleAlignment(m);
      const count = quickOptionsCount ?? 2;
      let style: CSSProperties = {};
      if (_alignment === MessageBubbleAlignment.left) {
        style = {
          width: `calc(100% - ${count * 36}px)`,
          marginRight: "auto"
        };
      } else if (_alignment === MessageBubbleAlignment.right) {
        style = {
          width: `calc(100% - ${count * 36}px)`,
          marginLeft: "auto"
        };
      }
      const moderationStatus = shouldIncludeBottomViewHeight(m)
      ? CometChatUIKitConstants.moderationStatus.disapproved
      : CometChatUIKitConstants.moderationStatus.approved;

      const isHighlighted = goToMessageId === String(m.getId());
      return (
        <>
          {getMessageBubbleDateHeader(m, i)}

          <div
            className={isHighlighted ? "cometchat-message-list__bubble-highlight" : (moderationStatus && !isAgentChat) ? `cometchat-message-list__bubble-moderation-${moderationStatus}` : ""}
            style={{
              width: "100%",
              ...(isAgentChat ? {} : m.getSender() ? {} : style)
            }}
            key={m.getId()}>
            {getBubbleWrapper(m)
              ? getBubbleWrapper(m)
              : getMessageBubbleItem(m, i)}
          </div>
        </>
      );
    },
    [
      getBubbleWrapper,
      getMessageBubbleItem,
      setBubbleAlignment,
      goToMessageId,
      messageRepliedTo,
      isAgentChat
    ]
  );
  /**
 * Function to get the footer of the message list
 * @returns {JSX.Element} - Returns JSX.Element for the footer of the message list
 */
  const getMessageListFooter: () => JSX.Element = useCallback(() => {
    return (
      <>
        {(showConversationStarter || enableSmartReplies) && !showFooterPanelView ? loadFooterViewContent() : null}
        {showFooterPanelView && panelViewRef.current ? panelViewRef.current : null}
        {footerView && !panelViewRef.current ? footerView : null}
      </>
    );
  }, [
    footerView,
    scrollToBottom,
    showFooterPanelView,
    showConversationStarter,
    showConversationStarters,
    enableSmartReplies
  ]);

  /**
 * Function to get the header of the message list
 * @returns {JSX.Element} - Returns JSX.Element for the header of the message list
 */
  const getMessageListHeader: () => JSX.Element = useCallback(() => {
    return (
      <>
        {showHeaderPanelView && headerViewRef.current ? headerViewRef.current : null}
        {headerView && !headerViewRef.current ? headerView : null}
      </>
    );
  }, [
    headerView,
    showHeaderPanelView
  ]);
  /**
 * Function to get the thread count of a message
 * @param {CometChat.BaseMessage} message - The message for which the thread count needs to be fetched
 * @returns {string} - Returns the thread count of the message as a string
 */
  const getThreadCount: (message: CometChat.BaseMessage) => string = (message: CometChat.BaseMessage) => {
    const replyCount = message?.getReplyCount() || 0;
    const suffix = replyCount === 1 ? getLocalizedString("message_list_thread_reply") : getLocalizedString("message_list_thread_replies");
    return `${replyCount} ${suffix}`;
  };

  /**
 * Function to get list item
 * @param {CometChat.BaseMessage} message - The message for which the list item needs to be fetched
 * @param {number} index - The index of the message
 * @returns {JSX.Element} - Returns JSX.Element for a list item
 */

  const getListItem: (message: CometChat.BaseMessage, index: number) => JSX.Element = useMemo(() => {
    return function (message: CometChat.BaseMessage, index: number): JSX.Element {
      return getMessageBubble(message, index);
    };
  }, [getMessageBubble]);

  /**
 * Function to get the current state of the message list
 * @returns {States} - Returns the current state of the message list
 */
  const getCurrentMessageListState: () => States = useCallback(() => {
    return messageListState !== States.error && messageList.length === 0 ? States.empty : messageListState;
  }, [messageListState, messageList]);
  /**
   * Function to hide the message information
   */
  const hideMessageInformation: () => void = () => {
    setShowMessageInfoPopup(false);
  };

  /**
   * Function to hide the flag message dialog
   */
  const hideFlagMessageDialog: () => void = () => {
    setShowFlagMessageDialog(false);
  };
  
  /**
   * Function to flag a message
   * @param {string} messageId - The ID of the message to be flagged
   * @param {string} reasonId - The reason ID for flagging the message
   * @param {string} [remark] - Optional remark for flagging the message
   * @returns {Promise<boolean>} - Returns a promise that resolves to true if the message was flagged successfully, false otherwise
   */
  const flagMessage = useCallback(
    async (messageId: string, reasonId: string, remark?: string) => {
      try{ 
        await CometChat.flagMessage(messageId, { reasonId, remark });
        toastTextRef.current = getLocalizedString("flag_message_reported");
        setShowToast(true);
        return true;
      } catch (error) {
        errorHandler(error, "flagMessage");
        return false;
      }
  }, [errorHandler]);

  /**
 * Function to get the message template based on the message type and category
 * @param {CometChat.BaseMessage} selectedMessage - The message for which the template needs to be fetched
 * @returns {CometChatMessageTemplate} - Returns the template of the selected message
 */
  const getMessageTemplate: (selectedMessage: CometChat.BaseMessage) => CometChatMessageTemplate = (selectedMessage: CometChat.BaseMessage) => {
    return messagesTypesMap[
      `${selectedMessage?.getCategory() + "_" + selectedMessage?.getType()}`
    ];
  };

  useEffect(() => {
    if ((goToMessageId || quotedMessageId) && messageList.length > 0 && messageListState == States.loaded && shouldScrollDirectly) {
      scrollToMessage();
      setHasTargetMessageId(false);
      setShouldScrollToMessage(false);
    }

  }, [goToMessageId, quotedMessageId, shouldScrollDirectly, scrollToMessage, setHasTargetMessageId, setShouldScrollToMessage, messageList, messageListState]);

  /**
   * useEffect to subscribe to streaming state changes
   */
  useEffect(() => {
    const subscription = streamingState$.subscribe((isStreaming) => {
      isStreamingRef.current = isStreaming;
      if (!isStreaming) {
        // Streaming has ended, process pending messages
        processPendingMessages();
        setIsMessageInProgress(false)
      }
      else setIsMessageInProgress(true);
    });

    return () => {
      subscription.unsubscribe();
      // Clear pending messages map when component unmounts
      pendingMessagesMapRef.current = {};
    };
  }, [processPendingMessages]);
  
  /**
   * Custom useCometChatMessageList for CometChatMessageList component.
   */
  useCometChatMessageList(
    loggedInUserRef,
    messageListManagerRef,
    fetchPreviousMessages,
    handleGroupAndCallActions,
    messagesRequestBuilder,
    userRef.current,
    groupRef.current,
    messageIdRef,
    totalMessagesCountRef,
    messageList,
    errorHandler,
    setMessageList,
    setScrollListToBottom,
    panelViewRef,
    isOnBottomRef,
    isFirstReloadRef,
    subscribeToUIEvents,
    showSmartRepliesRef,
    addMessage,
    setDateHeader,
    parentMessageId,
    hideGroupActionMessages,
    showSmartReplies,
    goToMessageId,
    isAgentChat,
    messageRepliedTo
  );
  return (
    <>
      <div className="cometchat" style={{
        height: "inherit",
        width: "100%",
        overflow: 'hidden',
        boxSizing: "border-box"
      }}>
        <div
          className={`cometchat-message-list ${getCurrentMessageListState() !== States.loading && hasCompletedInitialLoad && !isMessageRepliedToAvailable && getCurrentMessageListState() !== States.empty && getCurrentMessageListState() !== States.error && !isAgentChat ? 'cometchat-message-list-loaded' : ""} ${!showScrollbar ? "cometchat-message-list-hide-scrollbar" : ""} ${createUniqueUUID}`}
        >
          {stickyDateHeaderRef.current && showDateHeader && !hideStickyDate && messageList.length > 0 ? <div
            className='cometchat-message-list__date-header'
          >
            <CometChatDate
              timestamp={dateHeader ?? stickyDateHeaderRef.current}
              calendarObject={getStickyDateFormat()}
            ></CometChatDate>
          </div> : null}

          <div
            className="cometchat-message-list__header"
          >
            {getMessageListHeader()}
          </div>
          <div
            className={`cometchat-message-list__body ${
              !isAgentChat && messageList.length > 0
                ? "cometchat-message-list__body--spacing-top"
                : ""
            }`}
          >
            <CometChatList
              showShimmerOnTop={(isAgentChat && !parentMessageId) ? false : isMessageRepliedToAvailable ? true : !hasCompletedInitialLoad}
              showScrollbar={showScrollbar}
              scrolledUpCallback={updateIsOnBottom}
              headerView={undefined}
              hideSearch={true}
              showSectionHeader={false}
              list={messageList}
              itemView={getListItem}
              onScrolledToBottom={isAgentChat ? undefined : onBottomCallback}
              onScrolledToTop={isAgentChat && !parentMessageId ? undefined : onTopCallback}
              listItemKey='getMuid'
              state={getCurrentMessageListState()}
              loadingView={getLoaderHtml}
              hideError={hideError}
              errorView={getErrorHtml}
              emptyView={getEmptyHtml}
              scrollToBottom={isAgentChat ? isFirstScroll : scrollListToBottom}
              scrollToEnd={isAgentChat ? scrollToEnd : false}
            />
          </div>
          {!isMessageInProgress && showScrollToBottom && hasCompletedInitialLoad && hasVisibleArea ? (
            <div
            className="cometchat-message-list__message-indicator">
              <CometChatButton
                text={newMessageTextRef.current}
                iconURL={downArrow}
                onClick={() => {
                  if (isAgentChat) {
                    setScrollToEnd(true)
                    setTimeout(() => {
                      setScrollToEnd(false)
                    }, 1000);
                  }
                  else {
                    setMessageRepliedTo('')
                    setQuotedMessageId('')
                    scrollToBottom()
                  }
                }}
              ></CometChatButton>
            </div>
          ) : null}
          <div
            className="cometchat-message-list__footer"
            >
            {getMessageListFooter()}
          </div>
          {showToast ? <CometChatToast text={toastTextRef.current} onClose={closeToast} /> : null}
        </div>
      </div>
      {showCallScreen ? ongoingCallView : null}
      {showConfirmDialog && imageModerationDialogRef.current
        ? imageModerationDialogRef.current
        : null}
      {showMessageInfoPopup && activeMessageInfo !== null && (
        <div className="cometchat-message-information__popup-wrapper">
          <CometChatMessageInformation
            message={activeMessageInfo}
            onClose={hideMessageInformation}
            messageInfoDateTimeFormat={messageInfoDateTimeFormat}
            messageSentAtDateTimeFormat={messageSentAtDateTimeFormat}
            template={getMessageTemplate(activeMessageInfo)}
            hideReceipts={hideReceipts}
            textFormatters={textFormatters}
            showScrollbar={showScrollbar}
          />
        </div>
      )}

      {showFlagMessageDialog && currentFlagMessage !== null && (
        <div className={`cometchat-message-list__flag-message-dialog-wrapper ${!showScrollbar ? "cometchat-message-list__flag-message-dialog-hide-scrollbar" : ""}`} onClick={hideFlagMessageDialog}>
          <CometChatFlagMessageDialog
            message={currentFlagMessage}
            onSubmit={flagMessage}
            onClose={hideFlagMessageDialog}
            hideFlagRemarkField={hideFlagRemarkField}
          />
        </div>
      )}
    </>
  );
};

export { CometChatMessageList };
