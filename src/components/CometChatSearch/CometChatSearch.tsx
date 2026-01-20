import { JSX, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import { CometChatSearchScope, CometChatSearchFilter, MentionsTargetElement } from "../../Enums/Enums";
import { States } from "../../Enums/Enums";
import { getLocalizedString } from "../../resources/CometChatLocalize/cometchat-localize";
import { CalendarObject } from "../../utils/CalendarObject";
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import CloseIcon from '../../assets/close.svg';
import BackIcon from '../../assets/arrow_back.svg';
import UnreadIcon from '../../assets/unread_filter_icon.svg';
import ChatsIcon from "../../assets/chats_filter_icon.svg";
import GroupsIcon from "../../assets/group_filter_icon.svg";
import PhotoIcon from '../../assets/photo_filter_icon.svg';
import VideoIcon from '../../assets/audio_filter_icon.svg';
import DocumentIcon from '../../assets/file_filter_icon.svg';
import AudioIcon from '../../assets/audio_filter_icon.svg';
import LinkIcon from '../../assets/link_filter_icon.svg';
import MessageIcon from '../../assets/messages_filter_icon.svg';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useCometChatSearchConversationsList } from "./useCometChatSearchConversationsList";
import { useCometChatSearchMessagesList } from "./useCometChatSearchMessagesList";
import { CometChatOption } from "../../modals";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { ChatConfigurator } from "../../utils/ChatConfigurator";


interface SearchState {
  searchText: string;
  conversations: CometChat.Conversation[];
  messages: CometChat.BaseMessage[];
  fetchState: States;
  activeFilters: CometChatSearchFilterItem[];
}
type SearchAction =
  | { type: "setSearchText"; searchText: string }
  | { type: "setResults"; conversations?: CometChat.Conversation[]; messages?: CometChat.BaseMessage[] }
  | { type: "clearResults" }
  | { type: "setFetchState"; fetchState: States }
  | { type: "setActiveFilter"; filterId: CometChatSearchFilter }
  | { type: "resetActiveFilters" };

const initialState: SearchState = {
  searchText: "",
  conversations: [],
  messages: [],
  fetchState: States.loaded,
  activeFilters: [],
};

function searchStateReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "setSearchText":
      return { ...state, searchText: action.searchText };

    case "setResults":
      return {
        ...state,
        conversations: action.conversations ?? state.conversations,
        messages: action.messages ?? state.messages,
        fetchState: States.loaded,
      };

    case "clearResults":
      return { ...state, conversations: [], messages: [] };

    case "setFetchState":
      return { ...state, fetchState: action.fetchState };

    case "setActiveFilter": {
      const newActiveFilters = [...state.activeFilters];
      const filterIndex = newActiveFilters.findIndex(f => f.id === action.filterId);

      if (filterIndex >= 0) {
        newActiveFilters.splice(filterIndex, 1);
      } else {
        if (action.filterId === CometChatSearchFilter.Links) {
          const messageContentFilters = [
            CometChatSearchFilter.Photos,
            CometChatSearchFilter.Videos,
            CometChatSearchFilter.Documents,
            CometChatSearchFilter.Audio,
          ];
          messageContentFilters.forEach(filter => {
            const idx = newActiveFilters.findIndex(f => f.id === filter);
            if (idx >= 0) newActiveFilters.splice(idx, 1);
          });
        } else if (
          [CometChatSearchFilter.Conversations, CometChatSearchFilter.Unread, CometChatSearchFilter.Groups].includes(action.filterId)
        ) {
          const conversationFilters = [
            CometChatSearchFilter.Conversations,
            CometChatSearchFilter.Unread,
            CometChatSearchFilter.Groups,
          ];
          conversationFilters.forEach(filter => {
            const idx = newActiveFilters.findIndex(f => f.id === filter);
            if (idx >= 0) newActiveFilters.splice(idx, 1);
          });
        } else if (
          [CometChatSearchFilter.Photos, CometChatSearchFilter.Videos, CometChatSearchFilter.Documents, CometChatSearchFilter.Audio].includes(action.filterId)
        ) {
          const linksIdx = newActiveFilters.findIndex(f => f.id === CometChatSearchFilter.Links);
          if (linksIdx >= 0) newActiveFilters.splice(linksIdx, 1);
        }

        newActiveFilters.push({
          id: action.filterId,
          title: getFilterTitle(action.filterId),
          active: true,
        });
      }

      return { ...state, activeFilters: newActiveFilters };
    }

    case "resetActiveFilters":
      return { ...state, activeFilters: [] };

    default:
      return state;
  }
}

function getFilterTitle(filterId: CometChatSearchFilter): string {
  switch (filterId) {
    case CometChatSearchFilter.Conversations:
      return getLocalizedString("search_filter_conversations");
    case CometChatSearchFilter.Messages:
      return getLocalizedString("search_filter_messages");
    case CometChatSearchFilter.Unread:
      return getLocalizedString("search_filter_unread");
    case CometChatSearchFilter.Groups:
      return getLocalizedString("search_filter_groups");
    case CometChatSearchFilter.Photos:
      return getLocalizedString("search_filter_photos");
    case CometChatSearchFilter.Videos:
      return getLocalizedString("search_filter_videos");
    case CometChatSearchFilter.Links:
      return getLocalizedString("search_filter_links");
    case CometChatSearchFilter.Documents:
      return getLocalizedString("search_filter_documents");
    case CometChatSearchFilter.Audio:
      return getLocalizedString("search_filter_audio");
    default:
      return "";
  }
}
/**
 * Interface for search filter that matches our component needs
 */
export interface CometChatSearchFilterItem {
  id: CometChatSearchFilter;
  title: string;
  active?: boolean;
}

/**
 * Props for the CometChatSearch component
 */
interface SearchProps {
  /**
   * Callback triggered when the back button is clicked
   * Use this to handle navigation when user clicks the back button
   * 
   * @defaultValue () => {}
   */
  onBack?: () => void;

  /**
   * Whether to hide the back button
   * 
   * @defaultValue false - back button is shown
   */
  hideBackButton?: boolean;

  /**
   * Callback triggered when a conversation is clicked in search results
   * Receives the conversation object and the search keyword that was used
   * 
   * @param conversation - The conversation that was clicked
   * @param searchKeyword - The keyword that was used in the search
   */
  onConversationClicked?: (conversation: CometChat.Conversation, searchKeyword?: string) => void;

  /**
   * Callback triggered when a message is clicked in search results
   * Receives the message object and the search keyword that was used
   * 
   * @param message - The message that was clicked
   * @param searchKeyword - The keyword that was used in the search
   */
  onMessageClicked?: (message: CometChat.BaseMessage, searchKeyword?: string) => void;

  /**
   * Array of search filters to display in the filter bar
   * These allow users to narrow down their search results
   * 
   * @defaultValue All available filters (Audio, Documents, Groups, Photos, Videos, Links, Unread)
   */
  searchFilters?: Array<CometChatSearchFilter>;

  /**
   * Filter that should be active by default when the component loads
   * This allows pre-filtering the search results
   */
  initialSearchFilter?: CometChatSearchFilter;

  /**
   * Scopes to search in (Conversations, Messages, or both)
   * Controls whether to search in conversations, messages, or both
   * 
   * @defaultValue [CometChatSearchScope.All] - searches in both conversations and messages
   */
  searchIn?: Array<CometChatSearchScope>;

  /**
   * Custom view for conversation items in the search results
   * Use this to completely customize how conversation items are rendered
   * 
   * @param conversation - The conversation object to render
   * @returns JSX element representing the conversation item
   */
  conversationItemView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Custom leading view for conversation items (typically avatar/icon)
   * Use this to customize just the leading section of conversation items
   * 
   * @param conversation - The conversation object to render the leading view for
   * @returns JSX element for the leading part of the conversation item
   */
  conversationLeadingView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Custom title view for conversation items
   * Use this to customize how the title of conversation items is displayed
   * 
   * @param conversation - The conversation object to render the title for
   * @returns JSX element for the title of the conversation item
   */
  conversationTitleView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Custom subtitle view for conversation items
   * Use this to customize how the subtitle (typically last message) is displayed
   * 
   * @param conversation - The conversation object to render the subtitle for
   * @returns JSX element for the subtitle of the conversation item
   */
  conversationSubtitleView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Custom trailing view for conversation items (typically timestamp)
   * Use this to customize what appears at the end of conversation items
   * 
   * @param conversation - The conversation object to render the trailing view for
   * @returns JSX element for the trailing part of the conversation item
   */
  conversationTrailingView?: (conversation: CometChat.Conversation) => JSX.Element;

  /**
   * Request builder for conversations search
   * Use this to customize the conversation search request parameters
   * 
   * @defaultValue New instance with default parameters and search keyword
   */
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;

  /**
   * Custom view for message items in the search results
   * Use this to completely customize how message items are rendered
   * 
   * @param message - The message object to render
   * @returns JSX element representing the message item
   */
  messageItemView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Custom leading view for message items (typically sender avatar/icon)
   * Use this to customize just the leading section of message items
   * 
   * @param message - The message object to render the leading view for
   * @returns JSX element for the leading part of the message item
   */
  messageLeadingView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Custom title view for message items (typically sender name)
   * Use this to customize how the title of message items is displayed
   * 
   * @param message - The message object to render the title for
   * @returns JSX element for the title of the message item
   */
  messageTitleView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Custom subtitle view for message items (typically message content)
   * Use this to customize how the subtitle/content is displayed
   * 
   * @param message - The message object to render the subtitle for
   * @returns JSX element for the subtitle of the message item
   */
  messageSubtitleView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Custom trailing view for message items (typically timestamp)
   * Use this to customize what appears at the end of message items
   * 
   * @param message - The message object to render the trailing view for
   * @returns JSX element for the trailing part of the message item
   */
  messageTrailingView?: (message: CometChat.BaseMessage) => JSX.Element;

  /**
   * Request builder for messages search
   * Use this to customize the message search request parameters
   * 
   * @defaultValue New instance with default parameters and search keyword
   */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  /**
   * Custom view for empty state when no search results are found
   * This will be displayed when search returns no results
   */
  emptyView?: JSX.Element;

  /**
   * Custom view for error state when search fails
   * This will be displayed when an error occurs during search
   */
  errorView?: JSX.Element;

  /**
   * Custom view for loading state during search
   * This will be displayed while search is in progress
   */
  loadingView?: JSX.Element;

  /**
   * Custom view for initial state before user enters a search query
   * This will be displayed when the search component first loads
   * 
   * @defaultValue Basic prompt encouraging user to search
   */
  initialView?: JSX.Element;

  /**
   * Format for message sent date/time in the UI
   * Customize how timestamps are displayed in message items
   */
  messageSentAtDateTimeFormat?: CalendarObject;

  /**
   * Custom text formatters for message content
   * Use these to customize how message text is formatted (e.g., emoji, links, mentions)
   */
  textFormatters?: CometChatTextFormatter[];

  /**
   * Whether to hide the group type icon in group conversations
   * 
   * @defaultValue false - group type icons are shown
   */
  hideGroupType?: boolean;

  /**
   * Whether to hide user online/offline status indicators
   * 
   * @defaultValue false - user status is shown
   */
  hideUserStatus?: boolean;

  /**
   * Whether to hide message receipt indicators (sent/delivered/read)
   * 
   * @defaultValue false - receipts are shown
   */
  hideReceipts?: boolean;

  /**
   * User ID to search within specific user's messages
   * When provided, search will be limited to messages with this user
   */
  uid?: string;

  /**
   * Group ID to search within specific group's messages
   * When provided, search will be limited to messages in this group
   */
  guid?: string;

  /**
   * Custom options for conversation items in search results
   * Function that returns array of options (e.g., for context menu)
   * 
   * @param conversation - The conversation to generate options for
   * @returns Array of option objects or null for no options
   */
  conversationOptions?: ((conversation: CometChat.Conversation) => CometChatOption[]) | null;

  /**
   * Custom error handler for search operations
   * Override the default error handling behavior
   * 
   * @param error - The error that occurred during a search operation
   */
  onError?: (error: CometChat.CometChatException) => void;
}

/**
 * CometChatSearch component for searching conversations and messages in CometChat
 */
export function CometChatSearch(props: SearchProps) {
  const {
    onBack = () => { },
    hideBackButton = false,
    onConversationClicked,
    onMessageClicked,
    searchFilters = [CometChatSearchFilter.Audio, CometChatSearchFilter.Documents, CometChatSearchFilter.Groups, CometChatSearchFilter.Photos, CometChatSearchFilter.Videos, CometChatSearchFilter.Links, CometChatSearchFilter.Unread],
    initialSearchFilter,
    searchIn = [],
    conversationItemView,
    conversationLeadingView,
    conversationTitleView,
    conversationSubtitleView,
    conversationTrailingView,
    conversationsRequestBuilder,
    messageItemView,
    messageLeadingView,
    messageTitleView,
    messageSubtitleView,
    messageTrailingView,
    messagesRequestBuilder,
    emptyView,
    errorView,
    loadingView,
    initialView,
    messageSentAtDateTimeFormat,
    textFormatters = ChatConfigurator.getDataSource().getAllTextFormatters({ mentionsTargetElement: MentionsTargetElement.conversation }),
    hideGroupType = false,
    hideUserStatus = false,
    hideReceipts = false,
    uid,
    guid,
    conversationOptions,
    onError
  } = props;


  const errorHandler = useCometChatErrorHandler(onError);
  const [activeFilters, setActiveFilters] = useState<CometChatSearchFilter[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [searchValue, setSearchValue] = useState("");
  const timeoutIdRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filterIconsMap = {
    [CometChatSearchFilter.Audio]: AudioIcon,
    [CometChatSearchFilter.Conversations]: ChatsIcon,
    [CometChatSearchFilter.Documents]: DocumentIcon,
    [CometChatSearchFilter.Groups]: GroupsIcon,
    [CometChatSearchFilter.Links]: LinkIcon,
    [CometChatSearchFilter.Messages]: MessageIcon,
    [CometChatSearchFilter.Photos]: PhotoIcon,
    [CometChatSearchFilter.Unread]: UnreadIcon,
    [CometChatSearchFilter.Videos]: VideoIcon,
  }
  const filterTextMap = {
    [CometChatSearchFilter.Audio]: getLocalizedString("search_filter_audio"),
    [CometChatSearchFilter.Conversations]: getLocalizedString("search_filter_conversations"),
    [CometChatSearchFilter.Documents]: getLocalizedString("search_filter_documents"),
    [CometChatSearchFilter.Groups]: getLocalizedString("search_filter_groups"),
    [CometChatSearchFilter.Links]: getLocalizedString("search_filter_links"),
    [CometChatSearchFilter.Messages]: getLocalizedString("search_filter_messages"),
    [CometChatSearchFilter.Photos]: getLocalizedString("search_filter_photos"),
    [CometChatSearchFilter.Unread]: getLocalizedString("search_filter_unread"),
    [CometChatSearchFilter.Videos]: getLocalizedString("search_filter_videos"),
  }

  useEffect(()=>{
    if(activeFilters.length == 0 && initialSearchFilter) {
       setActiveFilters([initialSearchFilter]);
     }
 },[initialSearchFilter])

  useEffect(() => {
    (async () => {
      try {
        const loggedInUser =   await CometChat.getLoggedInUser();
        setLoggedInUser(loggedInUser ?? CometChatUIKitLoginListener.getLoggedInUser() )
      } catch (error) {
        errorHandler(error, "setLoggedInUser");
      }
    })();
  }, [errorHandler]);

  // Default initial view
  const getDefaultInitialView = useCallback(() => {
    return (
      <div className="cometchat-search__initial-view">
        <div className="cometchat-search__initial-view-icon"></div>
        <span className="cometchat-search__initial-view-title">{getLocalizedString("search_empty_title")}</span>
        <span className="cometchat-search__initial-view-subtitle">{getLocalizedString("search_empty_subtitle")}</span>
      </div>
    );
  }, []);

  /**
   * Renders the loading state view with shimmer effect
   */
  const getLoadingView = useCallback(() => {
    if (loadingView) {
      return loadingView;
    }
    return (
      <div className='cometchat-search__shimmer'>
        {[...Array((activeFilters && activeFilters.length > 0) || !!guid || !!uid ? 7 : 3)].map((_, index) => (
          <div key={index} className='cometchat-search__shimmer-item'>
            <div className='cometchat-search__shimmer-item-avatar'></div>
            <div className='cometchat-search__shimmer-item-body'>
              <div className='cometchat-search__shimmer-item-body-title-wrapper'>
                <div className='cometchat-search__shimmer-item-body-title'></div>
                <div className='cometchat-search__shimmer-item-body-tail'></div>
              </div>
              <div className='cometchat-search__shimmer-item-body-subtitle'></div>
            </div>
          </div>
        ))}
      </div>
    );
  },[activeFilters,loadingView,uid,guid])

  /**
   * Renders the empty state view when there are no messages to display
   */
  const getEmptyView = useCallback(() =>  {
    if (emptyView) {
      return emptyView;
    }
    return (
      <div className='cometchat-search__empty-view'>
        <div className='cometchat-search__empty-view-icon'></div>
        <div className='cometchat-search__empty-view-body'>
          <div className='cometchat-search__empty-view-body-title'>
            {getLocalizedString("search_no_result_title")}
          </div>
          <div className='cometchat-search__empty-view-body-description'>
          {getLocalizedString("search_no_result_subtitle")}

          </div>
        </div>
      </div>
    );
  },[emptyView])

  /**
   * Renders the error state view when an error occurs
   */
  const getErrorView = useCallback(() => {
    if (errorView) {
      return errorView;
    }
    
    return (
      <div className='cometchat-search__error-view'>
        <div className='cometchat-search__error-view-icon'></div>
        <div className='cometchat-search__error-view-body'>
          <div className='cometchat-search__error-view-body-title'>
            {getLocalizedString("search_error_title")}
          </div>
          <div className='cometchat-search__error-view-body-description'>
            {getLocalizedString("search_error_subtitle")}
          </div>
        </div>
      </div>
    );
  },[errorView])

  const { renderConversationsList } = useCometChatSearchConversationsList({
    searchKeyword: searchText,
    onItemClick: onConversationClicked,
    hideUserStatus,
    hideGroupType,
    activeFilters: activeFilters,
    useScrollPagination: guid || uid || activeFilters.length > 0 ? true : false,
    conversationsRequestBuilder,
    itemView: conversationItemView,
    leadingView: conversationLeadingView,
    titleView: conversationTitleView,
    subtitleView: conversationSubtitleView,
    trailingView: conversationTrailingView,
    emptyView:getEmptyView(),
    errorView:getErrorView(),
    loadingView:getLoadingView(),
    onError,
    options: conversationOptions,
    hideReceipts,
    loggedInUser,
    textFormatters
  });

  const { renderMessagesList } = useCometChatSearchMessagesList({
    searchKeyword: searchText,
    onItemClick: onMessageClicked,
    activeFilters: activeFilters,
    alwaysShowSeeMore:  guid || uid || activeFilters.length > 0 ? false : true,
    messagesRequestBuilder,
    textFormatters,
    itemView: messageItemView,
    leadingView: messageLeadingView,
    titleView: messageTitleView,
    subtitleView: messageSubtitleView,
    trailingView: messageTrailingView,
    emptyView:getEmptyView(),
    errorView:getErrorView(),
    loadingView:getLoadingView(),
    messageDateTimeFormat: messageSentAtDateTimeFormat,
    hideError: false,
    onError,
    uid,
    guid
  });
  const shouldRenderConversations = useCallback(() => {
    // If searchIn is empty, search in both conversations and messages
    const effectiveSearchIn = searchIn.length === 0 
      ? [CometChatSearchScope.Conversations, CometChatSearchScope.Messages] 
      : searchIn;

    // Don't render conversations if searchIn doesn't include conversations scope
    if (!effectiveSearchIn.includes(CometChatSearchScope.Conversations)) {
      return false;
    }

    if (!uid && !guid) {
      if (searchText && searchText.trim() != "" && activeFilters.length == 0) {
        return true
      }
      if (activeFilters.length > 0) {
        return activeFilters.includes(CometChatSearchFilter.Conversations) || activeFilters.includes(CometChatSearchFilter.Groups) || activeFilters.includes(CometChatSearchFilter.Unread);
      }
      return false
    }
    else {
      return false
    }
  }, [activeFilters, searchText, uid, guid, searchIn]);
  const shouldRenderMessages = useCallback(() => {
    // If searchIn is empty, search in both conversations and messages
    const effectiveSearchIn = searchIn.length === 0 
      ? [CometChatSearchScope.Conversations, CometChatSearchScope.Messages] 
      : searchIn;

    // Don't render messages if searchIn doesn't include messages scope
    if (!effectiveSearchIn.includes(CometChatSearchScope.Messages)) {
      return false;
    }

    if (uid || guid) {
      return true
    }

    if (searchText && searchText.trim() != "" && activeFilters.length == 0) {
      return true
    }
    if (activeFilters.length > 0) {
      return !activeFilters.includes(CometChatSearchFilter.Conversations) && !activeFilters.includes(CometChatSearchFilter.Groups) && !activeFilters.includes(CometChatSearchFilter.Unread);
    }
    return false
  }, [activeFilters, searchText, uid, guid, searchIn]);
  // Render search results
  const renderResults = () => {
    // If there's no search query and no filters, show initial view
    if ((!searchText || searchText.trim() === "") && activeFilters.length === 0) {
      return initialView || getDefaultInitialView();
    }

    // Check if both sections would be rendered but are empty
    const conversationsRendered = shouldRenderConversations() && renderConversationsList();
    const messagesRendered = shouldRenderMessages() && renderMessagesList();

    // If search/filters are active but no sections are being rendered, show empty view
    if ((searchText.trim() !== "" || activeFilters.length > 0) && 
        !conversationsRendered && !messagesRendered) {
      return getEmptyView();
    }

    // Show search results
    return (
      <div className="cometchat-search__results">
        {conversationsRendered}
        {messagesRendered}
      </div>
    );
  };


  const toggleFilter = (id: CometChatSearchFilter) => {
    if (activeFilters.includes(id)) {
      setActiveFilters(activeFilters.filter((f) => f !== id));
    } else {
      setActiveFilters([...activeFilters, id]);
    }
  };

  const handleClearSearch = () => {
    setSearchText("");
    setSearchValue("");
  };
  
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
      const newSearchText = e.target.value.trim();
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = window.setTimeout(() => {
        setSearchText(newSearchText);
        timeoutIdRef.current = null;
      }, 500);
  }, [conversationsRequestBuilder, messagesRequestBuilder, uid, guid,activeFilters]);

  // Get available filters based on searchIn prop
  const getAvailableFilters = useCallback(() => {
    const conversationFilters = [
      CometChatSearchFilter.Conversations,
      CometChatSearchFilter.Unread,
      CometChatSearchFilter.Groups
    ];

    const messageFilters = [
      CometChatSearchFilter.Messages,
      CometChatSearchFilter.Photos,
      CometChatSearchFilter.Videos,
      CometChatSearchFilter.Documents,
      CometChatSearchFilter.Audio,
      CometChatSearchFilter.Links
    ];

    let availableFilters: CometChatSearchFilter[] = [];

    // If searchIn is empty, search in both conversations and messages
    const effectiveSearchIn = searchIn.length === 0 
      ? [CometChatSearchScope.Conversations, CometChatSearchScope.Messages] 
      : searchIn;

    // Add filters based on searchIn scope
    if (effectiveSearchIn.includes(CometChatSearchScope.Conversations)) {
      availableFilters.push(...conversationFilters);
    }
    if (effectiveSearchIn.includes(CometChatSearchScope.Messages)) {
      availableFilters.push(...messageFilters);
    }

    // Filter the searchFilters prop to only include available filters
    return searchFilters.filter(filter => availableFilters.includes(filter));
  }, [searchIn, searchFilters]);

  const getVisibleFilters = useCallback(() => {
    const availableFilters = getAvailableFilters();
    
    const conversationFilters = [
      CometChatSearchFilter.Conversations,
      CometChatSearchFilter.Unread,
      CometChatSearchFilter.Groups
    ];

    const messageFilters = [
      CometChatSearchFilter.Messages,
      CometChatSearchFilter.Photos,
      CometChatSearchFilter.Videos,
      CometChatSearchFilter.Documents,
      CometChatSearchFilter.Audio,
      CometChatSearchFilter.Links
    ];

    const contentFilters = [
      CometChatSearchFilter.Photos,
      CometChatSearchFilter.Videos,
      CometChatSearchFilter.Documents,
      CometChatSearchFilter.Audio,
      CometChatSearchFilter.Links
    ];

    // If searchIn is empty, search in both conversations and messages
    const effectiveSearchIn = searchIn.length === 0 
      ? [CometChatSearchScope.Conversations, CometChatSearchScope.Messages] 
      : searchIn;

    // Filter out conversation filters if uid or guid is present
    let filteredAvailableFilters = availableFilters;
    if (uid || guid) {
      filteredAvailableFilters = availableFilters.filter(filter => !conversationFilters.includes(filter));
    }

    // If no filters are selected, return filtered available filters
    if (activeFilters.length === 0) {
      return filteredAvailableFilters;
    }

    // Check if Messages filter is selected
    const hasMessagesFilter = activeFilters.includes(CometChatSearchFilter.Messages);
    
    // Check if any content filter is selected
    const selectedContentFilters = activeFilters.filter(filter => contentFilters.includes(filter));
    
    // If Messages is selected along with a content filter, show only Messages and that content filter
    if (hasMessagesFilter && selectedContentFilters.length > 0) {
      return [CometChatSearchFilter.Messages, ...selectedContentFilters].filter(filter => filteredAvailableFilters.includes(filter));
    }
    
    // If only Messages is selected, show Messages and all content filters
    if (hasMessagesFilter) {
      return messageFilters.filter(filter => filteredAvailableFilters.includes(filter));
    }
    
    // If only a content filter is selected (without Messages), show only that filter
    if (selectedContentFilters.length > 0) {
      return selectedContentFilters.filter(filter => filteredAvailableFilters.includes(filter));
    }

    // If any conversation filter is selected, show ALL conversation filters (if conversations are in scope and not filtered out)
    if (effectiveSearchIn.includes(CometChatSearchScope.Conversations) && !uid && !guid) {
      const hasConversationFilter = activeFilters.some(filter => conversationFilters.includes(filter));
      if (hasConversationFilter) {
        return conversationFilters.filter(filter => filteredAvailableFilters.includes(filter));
      }
    }

    // Fallback: return filtered available filters
    return filteredAvailableFilters;
  }, [activeFilters, getAvailableFilters, searchIn, uid, guid]);

  // Auto-focus the search input when component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

  return (
    <div className="cometchat-search">
      <div className="cometchat-search__header">
        {!hideBackButton && (
          <div className="cometchat-search__back-button">
            <CometChatButton
              aria-label="back" iconURL={BackIcon} onClick={onBack}/>
          </div>
        )}
        <div className="cometchat-search__search-bar">
          <div className="cometchat-search__input">
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => handleSearch(e)}
              placeholder={getLocalizedString("search_placeholder")}
              aria-label="Search"
            />
                      {(searchValue || activeFilters.length > 0) && (
            <div className="cometchat-search__input-clear-button">
              <CometChatButton onClick={handleClearSearch}
                aria-label="Clear search" iconURL={CloseIcon} />
            </div>

          )}
          </div>

        </div>
      </div>

      <div className="cometchat-search__body">
        <div className="cometchat-search__body-filters">
          {getVisibleFilters().map((id) => (
            <div
              onClick={() => toggleFilter(id)}
              key={id}
              className={`cometchat-search__body-filter cometchat-search__body-filter-${id}  ${activeFilters.includes(id)
                ? "cometchat-search__body-filter-active"
                : ""
                }`}

            >
              <CometChatButton iconURL={activeFilters.includes(id) ? CloseIcon : filterIconsMap[id]} text={filterTextMap[id]} />

            </div>
          ))}
        </div>
      </div>
      {renderResults()}

    </div>
  );
}
