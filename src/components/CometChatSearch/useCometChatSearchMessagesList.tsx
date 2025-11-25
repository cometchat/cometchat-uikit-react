import { JSX, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatLocalize, getLocalizedString } from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatSearchFilter, MentionsTargetElement, MessageBubbleAlignment, Placement, States } from "../../Enums/Enums";
import { CometChatActionsIcon, CometChatOption } from "../../modals";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { CometChatDate } from "../BaseComponents/CometChatDate/CometChatDate";
import { CometChatContextMenu } from "../BaseComponents/CometChatContextMenu/CometChatContextMenu";
import { ChatConfigurator } from "../../utils/ChatConfigurator";
import { CalendarObject } from "../../utils/CalendarObject";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import { CometChatMentionsFormatter, CometChatTextHighlightFormatter } from "../../formatters";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import {  hasLink, hasValidMessageSearchCriteria, isMonthDifferent } from "../../utils/SearchUtils";
import { isMessageSentByMe, isURL, sanitizeCalendarObject } from "../../utils/util";
import { CometChatUIKit } from "../../CometChatUIKit/CometChatUIKit";
import { MessageUtils } from "../../utils/MessageUtils";
import { MessagesDataSource } from "../../utils/MessagesDataSource";
import { CometChatUIKitUtility } from "../../CometChatUIKit/CometChatUIKitUtility";
import { LinkPreviewConstants } from "../Extensions/LinkPreview/LinkPreviewConstants";

/**
 * Interface for the props used by the useCometChatSearchMessagesList hook.
 */
interface UseCometChatSearchMessagesListProps {
  /**
   * Search keyword used to filter messages.
   */
  searchKeyword?: string;

  /**
   * Optional request builder to customize the message search query.
   */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  /**
   * Callback function triggered when a message item is clicked.
   * @param message - The selected message.
   * @param searchKeyword - The keyword used during the search (optional).
   */
  onItemClick?: (message: CometChat.BaseMessage, searchKeyword?: string) => void;

  /**
   * Custom renderer for each message item.
   * @param message - The current message.
   */
  itemView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Custom JSX element to display at the start (leading view) of a message item.
   * @param message - The current message.
   */
  leadingView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Custom JSX element to display the title of a message item.
   * @param message - The current message.
   */
  titleView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Custom JSX element to display the subtitle of a message item.
   * @param message - The current message.
   */
  subtitleView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Custom JSX element to display at the end (trailing view) of a message item.
   * @param message - The current message.
   */
  trailingView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Optional array of text formatters to customize message text display.
   */
  textFormatters?: CometChatTextFormatter[];

  /**
   * Format object for displaying the timestamp of messages.
   */
  messageDateTimeFormat?: CalendarObject;

  /**
   * Function to return available options for a message item (e.g., actions or menu items).
   * @param message - The current message.
   */
  options?: ((message: CometChat.BaseMessage) => CometChatOption[]) | null;

  /**
   * Callback triggered when an error occurs during component behavior.
   * @param error - The CometChatException error object.
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * Custom component displayed when there are no messages to show.
   */
  emptyView?: JSX.Element;

  /**
   * Custom component displayed while the message list is loading.
   */
  loadingView?: JSX.Element;

  /**
   * Custom component displayed when an error occurs while fetching messages.
   */
  errorView?: JSX.Element;

  /**
   * Text displayed on the "See More" button.
   */
  seeMoreButtonText?: string;

  /**
   * Whether to always show the "See More" button even if there are no more results.
   */
  alwaysShowSeeMore?: boolean;

  /**
   * Active filters applied to the message search.
   */
  activeFilters?: CometChatSearchFilter[];

  /**
   * User ID to search messages specific to a user.
   */
  uid?: string;

  /**
   * Group ID to search messages specific to a group.
   */
  guid?: string;

  /**
   * If true, hides error views from rendering.
   */
  hideError?: boolean;

  /**
   * Logged-in user object reference.
   */
  loggedInUser?: CometChat.User | null;
}


/**
 * State interface for the hook
 */
interface State {
  messageList: CometChat.BaseMessage[];
  fetchState: States;
  hasMoreResults: boolean;
}

/**
 * Action types for the reducer
 */
type Action =
  | { type: "setMessageList"; messageList: CometChat.BaseMessage[] }
  | { type: "appendMessages"; messages: CometChat.BaseMessage[] }
  | { type: "setFetchState"; fetchState: States }
  | { type: "setHasMoreResults"; hasMoreResults: boolean };

/**
 * Reducer function for state management
 */
function stateReducer(state: State, action: Action): State {
  let newState = state;
  const { type } = action;

  switch (type) {
    case "setMessageList": {
      const { messageList } = action;
      newState = {
        ...state,
        messageList,
      };
      break;
    }

    case "appendMessages": {
      const newMessageList = [...state.messageList, ...action.messages];
      newState = {
        ...state,
        messageList: newMessageList,
      };
      break;
    }

    case "setFetchState":
      newState = { ...state, fetchState: action.fetchState };
      break;

    case "setHasMoreResults":
      newState = { ...state, hasMoreResults: action.hasMoreResults };
      break;

    default: {
      // Ensure exhaustive checking
      const _exhaustiveCheck: never = type;
      return state;
    }
  }

  return newState;
}

function LinkPreviewImage(props: {
  url: string;
  viewClass: string;
  iconClass: string;
}) {
  const { url, viewClass, iconClass } = props;
  const [failed, setFailed] = useState(false);
  if (failed || !url) {
    return (
      <div className={`${viewClass} ${viewClass}-link`}>
        <div className={iconClass}></div>
      </div>
    );
  }
  return (
    <div className={`${viewClass} ${viewClass}-link`}>
      <img src={url} onError={() => setFailed(true)} alt="" loading="lazy" />
    </div>
  );
}

/**
 * Hook for managing and rendering a list of messages in the search component
 */
export function useCometChatSearchMessagesList(props: UseCometChatSearchMessagesListProps) {
  const {
    searchKeyword = "",
    messagesRequestBuilder,
    onItemClick,
    itemView = null,
    subtitleView = null,
    trailingView = null,
    options = null,
    loadingView,
    emptyView,
    errorView,
    textFormatters = [],
    leadingView,
    titleView,
    messageDateTimeFormat,
    onError,
    seeMoreButtonText = getLocalizedString("search_result_see_more"),
    alwaysShowSeeMore = false,
    activeFilters = [],
    uid,
    guid,
    hideError = false,
    loggedInUser
  } = props;

  // Initialize state
  const [messageState, dispatch] = useReducer(stateReducer, {
    messageList: [],
    fetchState: States.loading,
    hasMoreResults: false
  });
  const lastActiveFiltersRef = useRef<CometChatSearchFilter[]>(activeFilters || []);

  const errorHandler = useCometChatErrorHandler(onError);
  const searchRequestRef = useRef<CometChat.MessagesRequest | null>(null);
  const lastSearchKeyword = useRef<string>(searchKeyword);
  const isMoreResultsLoading = useRef<boolean>(false);

  /**
  * Fetch messages based on the search keyword and active filters
  */
  const searchMessages = useCallback(async () => {
    try {
      dispatch({ type: "setFetchState", fetchState: States.loading });

      // Check if valid search criteria are present
      if (!hasValidMessageSearchCriteria(searchKeyword, activeFilters || [])) {
        dispatch({ type: "setMessageList", messageList: [] });
        dispatch({ type: "setFetchState", fetchState: States.empty });
        dispatch({ type: "setHasMoreResults", hasMoreResults: false });
        return;
      }

      // Build the request with filters
      searchRequestRef.current = buildMessagesRequest();
      let limit = activeFilters.length > 0 ? 30 : 3;

      const messages = await searchRequestRef.current.fetchPrevious();

      if (messages.length > 0) {
        const reversedList = messages.reverse();
        dispatch({ type: "setMessageList", messageList: reversedList });
        dispatch({ type: "setFetchState", fetchState: States.loaded });

        // Check if there might be more results
        dispatch({ type: "setHasMoreResults", hasMoreResults: messages.length >= limit });
      } else {
        dispatch({ type: "setFetchState", fetchState: States.empty });
        dispatch({ type: "setHasMoreResults", hasMoreResults: false });
      }
    } catch (error) {
      dispatch({ type: "setFetchState", fetchState: States.error });
      errorHandler(error, "searchMessages");
    }
  }, [searchKeyword, activeFilters, uid, guid, errorHandler]);


  useEffect(() => {
    const hasKeywordChanged = searchKeyword !== lastSearchKeyword.current;

    const haveFiltersChanged = activeFilters &&
      (!lastActiveFiltersRef.current ||
        lastActiveFiltersRef.current.length !== activeFilters.length ||
        !activeFilters.every(filter => lastActiveFiltersRef.current.includes(filter)));

    if (hasKeywordChanged || haveFiltersChanged) {
      lastSearchKeyword.current = searchKeyword;
      lastActiveFiltersRef.current = [...(activeFilters || [])];

      dispatch({ type: "setMessageList", messageList: [] });
      dispatch({ type: "setFetchState", fetchState: States.loading });
      dispatch({ type: "setHasMoreResults", hasMoreResults: false });
      
      searchMessages();
    }
  }, [searchKeyword, activeFilters, searchMessages]);



  /**
   * Load more search results
   */
  const loadMoreResults = async () => {
    if (isMoreResultsLoading.current || !searchRequestRef.current) {
      return;
    }

    isMoreResultsLoading.current = true;

    try {
      const messages = await searchRequestRef.current.fetchPrevious();
      if (messages.length > 0) {
        const reversedList = messages.reverse();
        dispatch({ type: "appendMessages", messages:reversedList });
        let limit = activeFilters.length > 0 ? 30 : 3;

        dispatch({ type: "setHasMoreResults", hasMoreResults: messages.length >= limit });
      } else {
        dispatch({ type: "setHasMoreResults", hasMoreResults: false });
      }

    } catch (error) {
      errorHandler(error, "loadMoreResults");
    } finally {
      isMoreResultsLoading.current = false;
    }
  };

  function getLinkPreviewDetails(linkPreviewObject: any): string | null {
    if (Object.keys(linkPreviewObject).length > 0) {
      return linkPreviewObject["favicon"];
    } else {
      return null;
    }
  }

  function getLinkPreview(message: CometChat.TextMessage): any {
    try {
      if (message?.getMetadata()) {
        const metadata: any = message.getMetadata();
        const injectedObject = metadata[LinkPreviewConstants.injected];
        if (injectedObject && injectedObject?.extensions) {
          const extensionsObject = injectedObject.extensions;
          if (
            extensionsObject &&
            CometChatUIKitUtility.checkHasOwnProperty(
              extensionsObject,
              LinkPreviewConstants.link_preview
            )
          ) {
            const linkPreviewObject =
              extensionsObject[LinkPreviewConstants.link_preview];
            if (
              linkPreviewObject &&
              CometChatUIKitUtility.checkHasOwnProperty(
                linkPreviewObject,
                LinkPreviewConstants.links
              ) &&
              linkPreviewObject[LinkPreviewConstants.links].length
            ) {
              return getLinkPreviewDetails(linkPreviewObject[LinkPreviewConstants.links][0]);
            } else {
              return null;
            }
          } else {
            return null;
          }
        }
      } else {
        return null;
      }
    } catch (error: any) {
      console.log("error in getting link preview details", error);
    }
  }

  /**
   * Get leading view for the list item based on message type
   */
  function getListItemLeadingView(message: CometChat.BaseMessage): JSX.Element {
    try {
      let messageType = message.getType();
      let iconClass = "cometchat-search__messages-leading-view-icon";
      let viewClass = "cometchat-search__messages-leading-view";

      // Add specific class based on message type
      switch (messageType) {
        case CometChatUIKitConstants.MessageTypes.text:
          if (message instanceof CometChat.TextMessage) {
            const metadata = message.getMetadata();
            if (hasLink(metadata)) {
              const previewUrl = getLinkPreview(message);
              if (previewUrl) {
                return <LinkPreviewImage url={previewUrl} viewClass={viewClass} iconClass={iconClass} />;
              }
              else {
                return (
                  <div className={`${viewClass} ${viewClass}-link`}>
                    <div className={iconClass}></div>
                  </div>
                );
              }
            }
            else if (isURL(message.getText())) {
              return (
                <div className={`${viewClass} ${viewClass}-link`}>
                  <div className={iconClass}></div>
                </div>
              );
            }
            else {
              return <></>;
            }
          }
          return <></>;

        case CometChatUIKitConstants.MessageTypes.image:
          return <></>;

        case CometChatUIKitConstants.MessageTypes.file:
          let fileMessage = message as CometChat.MediaMessage;
          let attachment = fileMessage.getAttachments()[0];
          const metadataFile = (fileMessage.getMetadata() as any)?.file as File | undefined;
          const mimeType = attachment?.getMimeType() ?? metadataFile?.type;
          let fileIcon = new MessagesDataSource().getFileType(mimeType)
          return (
            <div className={`${viewClass} ${viewClass}-file`}>
              <img className={iconClass} src={fileIcon}/>
            </div>
          );

        case CometChatUIKitConstants.MessageTypes.video:
          return <></>;

        case CometChatUIKitConstants.MessageTypes.audio:
          return (
            <div className={`${viewClass} ${viewClass}-audio`}>
              <div className={iconClass}></div>
            </div>
          );

        default:
          return <></>
      }
    } catch (error) {
      errorHandler(error, "getListItemLeadingView");
      // Return default view on error
      return (
        <div className="cometchat-search__messages-leading-view">
          <div className="cometchat-search__messages-leading-view-icon"></div>
        </div>
      );
    }
  }
  const regexPatterns = useMemo(() => {
    return textFormatters.map((f) => f.getRegexPatterns()).flat();
  }, [textFormatters]);

  /**
   * Get formatted message text for display
   */
  const getFormattedMessageText = useCallback((message: CometChat.TextMessage): string => {
    try {
      let text = (message as CometChat.TextMessage).getText();
      let finalText = CometChatUIKitUtility.sanitizeText(text);
      let formatters = textFormatters ?? ChatConfigurator.getDataSource().getAllTextFormatters({ mentionsTargetElement: MentionsTargetElement.conversation });

      if (message) {
        let mentionsTextFormatter!: CometChatMentionsFormatter;
        for (let i = 0; i < textFormatters.length; i++) {
          if (searchKeyword && textFormatters[i] instanceof CometChatTextHighlightFormatter) {
            (textFormatters[i] as CometChatTextHighlightFormatter).setText(searchKeyword);
          }
          if (textFormatters[i] instanceof CometChatMentionsFormatter) {
            mentionsTextFormatter = textFormatters[
              i
            ] as unknown as CometChatMentionsFormatter;
            mentionsTextFormatter.setMessage(message);
            if (message.getMentionedUsers().length) {
              mentionsTextFormatter.setCometChatUserGroupMembers(
                message.getMentionedUsers()
              );
            }

            if (!message.getDeletedAt()) {
              const channelRegex = /<@all:(.*?)>/g;
              const text = message.getText();
              const matches = Array.from(text.matchAll(channelRegex));
              const mentionedChannels = matches.map((m) => m[1]);
              mentionsTextFormatter.setCometChatMentionedChannels(
                mentionedChannels
              );
            }
            
            mentionsTextFormatter.setLoggedInUser(
              CometChatUIKitLoginListener.getLoggedInUser()!
            );
          }
          if (mentionsTextFormatter) {
            break;
          }
        }
        if (!mentionsTextFormatter) {
          mentionsTextFormatter =
            ChatConfigurator.getDataSource().getMentionsTextFormatter({
              message,
              alignment: null
            });
          formatters.push(mentionsTextFormatter);
        }

        if (
          message &&
          message instanceof CometChat.TextMessage
        ) {
          for (let i = 0; i < formatters.length; i++) {
            let temp_message = formatters[i].getFormattedText(finalText, { mentionsTargetElement: MentionsTargetElement.conversation });
            if (typeof (temp_message) == "string") {
              finalText = temp_message;
            }
          }
        }
      }
      return finalText;

    }
      catch (error) {
      errorHandler(error, "getFormattedMessageText");
      return message?.getText() || "";
    }
  },[textFormatters, errorHandler,searchKeyword]);

  function getSubtitleThreadView(message: CometChat.BaseMessage): JSX.Element | null {
    try {
      if (!message.getParentMessageId()) {
        return null;
      }
      return (
        <div className='cometchat-search__messages-subtitle-icon-thread' />
      );
    } catch (error) {
      errorHandler(error, "getSubtitleThreadView");
      return null;
    }
  }

  /**
   * Creates subtitle text view
   */
  function getSubtitleTextView(message: CometChat.TextMessage): JSX.Element {
    try {
      let user = loggedInUser ?? CometChatUIKitLoginListener.getLoggedInUser();
      const messageText = getFormattedMessageText(message);
      const isMyMessage = message?.getSender().getUid() == user?.getUid();
      const senderName = isMyMessage ? getLocalizedString("search_message_subtitle_you") : message?.getSender().getName()
      return (
        <>
        {getSubtitleThreadView(message)}
        <div
          className="cometchat-search-messages__subtitle-text"
          dangerouslySetInnerHTML={{ __html: `${!uid && !guid ? senderName + ": " : ""}${messageText}` }}
        />
        </>
      );
    } catch (error) {
      errorHandler(error, "getSubtitleTextView");
      return <></>;
    }
  }

  /**
   * Creates subtitle view for the list item view
   */
  function getListItemSubtitleView(message: CometChat.BaseMessage): JSX.Element {
    if (subtitleView !== null) {
      return <>{subtitleView(message)}</>;
    }
    let subtitle = "";
    if (CometChatUIKitConstants.MessageTypes.text === message.getType()) {
      return (<div className='cometchat-search-messages__subtitle'>
        {getSubtitleTextView(message as CometChat.TextMessage)}
      </div>)
    }
    switch (message.getType()) {
      case CometChatUIKitConstants.MessageTypes.image:
        subtitle = (message as CometChat.MediaMessage).getAttachments() ? (message as CometChat.MediaMessage).getAttachments()[0].getName() : "";
        break

      case CometChatUIKitConstants.MessageTypes.file:
        subtitle = (message as CometChat.MediaMessage).getAttachments() ? (message as CometChat.MediaMessage).getAttachments()[0].getName() : "";
        break

      case CometChatUIKitConstants.MessageTypes.video:
        subtitle = (message as CometChat.MediaMessage).getAttachments() ? (message as CometChat.MediaMessage).getAttachments()[0].getName() : "";
        break

      case CometChatUIKitConstants.MessageTypes.audio:
        subtitle = (message as CometChat.MediaMessage).getAttachments() ? (message as CometChat.MediaMessage).getAttachments()[0].getName() : "";
        break
      default:
        break;
    }
    return (
      <div className='cometchat-search-messages__subtitle'>
        {getSubtitleThreadView(message)}
        {subtitle}
      </div>
    );
  }

  /**
   * Gets the date format for the trailing view
   */
  function getDateFormat(): CalendarObject {
    const defaultFormat = {
      yesterday: "DD MMM, YYYY",
      otherDays: `DD MMM, YYYY`,
      today: "DD MMM, YYYY"
    };

    const globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject);
    const componentCalendarFormat = sanitizeCalendarObject(messageDateTimeFormat);

    return {
      ...defaultFormat,
      ...globalCalendarFormat,
      ...componentCalendarFormat
    };
  }

  /**
   * Creates trailing view for the list item view
   */
  function getListItemTrailingView(message: CometChat.BaseMessage): JSX.Element | null {
    try {
      if (trailingView) {
        return <>{trailingView(message)}</>;
      }
      if (message.getType() != CometChatUIKitConstants.MessageTypes.image && message.getType() != CometChatUIKitConstants.MessageTypes.video) {
        return (
          <CometChatDate timestamp={message.getSentAt()} calendarObject={getDateFormat()} />

        );
      }

      let messageType = message.getType();
      let iconClass = "cometchat-search__messages-trailing-view-icon";
      let viewClass = "cometchat-search__messages-trailing-view";
      let url = "";
      if (message instanceof CometChat.MediaMessage) {
        url = (message as CometChat.MediaMessage).getAttachments() ? (message as CometChat.MediaMessage).getAttachments()[0].getUrl() : "";
      }
      // Add specific class based on message type
      switch (messageType) {

        case CometChatUIKitConstants.MessageTypes.image:

          return (
            <div className={`${viewClass} ${viewClass}-image`}>
              <div className={iconClass}></div>
              <img src={url} className={iconClass} />
            </div>
          );

        case CometChatUIKitConstants.MessageTypes.video:
          return (
            <div className={`${viewClass} ${viewClass}-video`}>
              <video src={url} className={iconClass} preload="metadata" controls={false} onContextMenu={(e) => e.preventDefault()}>
                <track kind="captions" />
              </video>
              <div className="cometchat-search__messages-video-play-button"></div>
            </div>
          );

        default:
          break;
      }


      return (<></>)

    } catch (error) {
      errorHandler(error, "getListItemTrailingView");
      return null;
    }
  }

  /**
   * Creates menu view for the list item view
   */
  function getListItemMenuView(message: CometChat.BaseMessage) {
    try {
      if (!options) {
        return null;
      }

      const curOptions = options(message);

      if (curOptions?.length === 0) {
        return null;
      }

      return (
        <div className="cometchat-search-messages__trailing-view-options">
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
const getMessageTitle = useCallback((message: CometChat.BaseMessage): string => {
  let user = loggedInUser ?? CometChatUIKitLoginListener.getLoggedInUser();
 if(uid || guid){
   return isMessageSentByMe(message, user! ) ? getLocalizedString("search_message_title_you") : message.getSender()?.getName();
 }
 let receiver = message.getReceiver();
 return receiver.getName();

},[uid,guid,loggedInUser])
  /**
   * Creates `listItem` prop of the `CometChatList` component
   */
  const getListItem = useCallback((): (message: CometChat.BaseMessage, index: number) => JSX.Element => {
    if (itemView !== null) {
      return itemView;
    }
    return function (message: CometChat.BaseMessage, index: number) {
      try {

        // Determine if we need to show date separator
        const shouldShowDateSeparator = index === 0 ||
          (index > 0 && isMonthDifferent(message.getSentAt(), messageState.messageList[index - 1].getSentAt()));

        return (
          <>
            {shouldShowDateSeparator && renderDateSeparator(message.getSentAt())}
            <div className="cometchat-search-messages__list-item">
              <CometChatListItem
                id={String(message.getId())}
                title={getMessageTitle(message)}
                titleView={titleView ? titleView(message) : undefined}
                leadingView={leadingView ? leadingView(message) : getListItemLeadingView(message)}
                onListItemClicked={(e) => onItemClick?.(message,searchKeyword)}
                subtitleView={getListItemSubtitleView(message)}
                menuView={getListItemMenuView(message)}
                trailingView={getListItemTrailingView(message)}
              />
            </div>
          </>
        );
      } catch (error) {
        errorHandler(error, "getListItem");
        throw error;
      }
    };
  }, [itemView, loggedInUser, messageState.messageList, titleView, leadingView, onItemClick, subtitleView, options, trailingView, errorHandler,searchKeyword]);

  /**
   * Function to render the "See More" button
   */
  function renderSeeMoreButton() {
    if (!messageState.hasMoreResults || !alwaysShowSeeMore) {
      return null;
    }

    return (
      <div className="cometchat-search-messages__see-more">
        <CometChatButton
          text={seeMoreButtonText}
          onClick={loadMoreResults}
        />
      </div>
    );
  }
  const handleScrollToBottom = useCallback(async () => {
    if (messageState.hasMoreResults && !isMoreResultsLoading.current) {
      return await loadMoreResults();
    }
  }, [messageState.hasMoreResults]);

  /**
   * Determines if the messages list should be rendered
   */
  const shouldRender = useCallback(() => {
    // Always render if filters are active (even without search keyword)
    if (activeFilters && activeFilters.length > 0) {
      return true;
    }
    
    // Don't render if no search keyword and no filters
    if (!searchKeyword || searchKeyword.trim() === "") {
      return false;
    }
    
    // If there's a search keyword, only render if we have results or are still loading
    return messageState.fetchState === States.loading || 
           messageState.messageList.length > 0;
  }, [activeFilters, searchKeyword, messageState.fetchState, messageState.messageList.length]);

  /**
   * Renders the list of messages
   */
  const renderMessagesList = () => {
    // Don't render if conditions aren't met
    if (!shouldRender()) {
      return null;
    }

    return (
      <div className={`cometchat-search__messages ${!alwaysShowSeeMore || activeFilters.length > 0 ? "cometchat-search__messages-full" : ""}`}>
        <CometChatList
          title={getLocalizedString("search_messages_header")}
          hideSearch={true}
          list={messageState.messageList}
          listItemKey='getId'
          itemView={getListItem()}
          showSectionHeader={false}
          state={messageState.fetchState}
          loadingView={loadingView}
          emptyView={emptyView}
          errorView={errorView}
          hideError={hideError}
          onScrolledToBottom={!alwaysShowSeeMore ? handleScrollToBottom : undefined}

        />
        {messageState.messageList.length > 0 && renderSeeMoreButton()}
      </div>
    );
  };

  
  /**
   * Build the messages request with appropriate filters
   */
  const buildMessagesRequest = useCallback(() => {
    let builder: CometChat.MessagesRequestBuilder = messagesRequestBuilder
    ? CometChatUIKitUtility.clone(messagesRequestBuilder)
    : new CometChat.MessagesRequestBuilder();
        builder.hideDeletedMessages(true);
    let limit = alwaysShowSeeMore  ? 3 : 30;
  
  
    if (!messagesRequestBuilder) {
      builder = builder
        .setCategories(ChatConfigurator.getDataSource().getAllMessageCategories())
        .setTypes(ChatConfigurator.getDataSource().getAllMessageTypes()).setLimit(limit);
    }
  
    if (searchKeyword && searchKeyword.trim() !== "") {
      builder = builder.setSearchKeyword(searchKeyword);
    }
  
    if (uid) {
      builder = builder.setUID(uid);
    } else if (guid) {
      builder = builder.setGUID(guid);
    }
  
    if (activeFilters && activeFilters.length > 0) {
      if (activeFilters.includes(CometChatSearchFilter.Links)) {
        builder = builder.hasLinks(true);
      }
  
      const attachmentTypeMap = {
        [CometChatSearchFilter.Photos]: CometChat.AttachmentType.IMAGE,
        [CometChatSearchFilter.Videos]: CometChat.AttachmentType.VIDEO,
        [CometChatSearchFilter.Documents]: CometChat.AttachmentType.FILE,
        [CometChatSearchFilter.Audio]: CometChat.AttachmentType.AUDIO,
      };
  
      for (const [filter, attachmentType] of Object.entries(attachmentTypeMap)) {
        if (activeFilters.includes(filter as CometChatSearchFilter)) {
          builder = builder.setAttachmentTypes([attachmentType]);
          break; 
        }
      }
    }
    return builder.build();
  }, [messagesRequestBuilder, activeFilters, searchKeyword, uid, guid]);

  /**
   * Get date format for the separator
   * @returns CalendarObject with format specifications
   */
  function getDateSeparatorFormat(): CalendarObject {
    const defaultFormat = {
      today: "MMM, YYYY",
      yesterday: "MMM, YYYY",
      otherDays: "MMM, YYYY"
    };

    const globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject);

    return {
      ...defaultFormat,
      ...globalCalendarFormat,
    };
  }

  /**
   * Renders a date separator component
   * @param timestamp - Timestamp to display in the separator
   * @returns JSX element with the formatted date
   */
  function renderDateSeparator(timestamp: number): JSX.Element {
    return (
      <div className="cometchat-search-messages__date-separator">
         <CometChatDate
            timestamp={timestamp}
            calendarObject={getDateSeparatorFormat()}
          />
      </div>
    );
  }
  // Return the functions and values needed by the consuming component
  return {
    renderMessagesList,
    messageState,
    searchMessages,
    loadMoreResults,
    handleScrollToBottom,
    shouldRender
  };
}