import {
  JSX,
  useCallback,
  useReducer,
  useRef,
  useState,
} from "react";

import { CometChat, User } from "@cometchat/chat-sdk-javascript";
import { CometChatCheckbox } from "../BaseComponents/CometChatCheckbox/CometChatCheckbox";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatRadioButton } from "../BaseComponents/CometChatRadioButton/CometChatRadioButton";
import { useCometChatUsers } from "./useCometChatUsers";
import { UsersManager } from "./controller";
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";
import { SelectionMode, States } from "../../Enums/Enums";
import { CometChatOption } from "../../modals/CometChatOption";
import {getLocalizedString} from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatContextMenu } from "../BaseComponents/CometChatContextMenu/CometChatContextMenu";
import { CometChatActionsIcon, CometChatActionsView } from "../../modals";
import emptyIcon from "../../assets/user_empty.svg";
import emptyIconDark from "../../assets/user_empty_dark.svg";
import errorIcon from "../../assets/list_error_state_icon.svg"
import errorIconDark from "../../assets/list_error_state_icon_dark.svg"
import { getThemeMode } from "../../utils/util";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { MessageUtils } from "../../utils/MessageUtils";

export interface UsersProps {
  /**
   * Hides the default search bar.
   *
   * @defaultValue `false`
   */
  hideSearch?: boolean;

  /**
   * Displays an alphabetical section header for the user list.
   *
   * @defaultValue `true`
   */
  showSectionHeader?: boolean;

  /**
   * Hides both the default and custom error view passed in `errorView` prop.
   *
   * @defaultValue `false`
   */
  hideError?: boolean;

  /**
   * Disables the loading state while fetching users.
   *
   * @defaultValue `false`
   */
  disableLoadingState?: boolean;

  /**
   * Hides the user's online/offline status indicator.
   *
   * @remarks If set to `true`, the status indicator of the default list item view is not displayed.
   * @defaultValue `false`
   */
  hideUserStatus?: boolean;

  /**
   * User to highlight.
   *
   * @remarks This prop is used if `activeUser` prop is not provided.
   */
  activeUser?: CometChat.User;

  /**
   * Request builder to fetch users.
   *
   * @defaultValue Default request builder having the limit set to `30`.
   */
  usersRequestBuilder?: CometChat.UsersRequestBuilder;

  /**
   * Request builder with search parameters to fetch users.
   *
   * @remarks If the search input is not empty, the search keyword of this request builder is set to the text in the search input.
   */
  searchRequestBuilder?: CometChat.UsersRequestBuilder;

  /**
   * The search keyword used to filter the user list.
   *
   * @defaultValue `""`
   */
  searchKeyword?: string;

  /**
   * The property on the user object used to extract the section header character.
   *
   * @remarks This property will be used to extract the section header character from the user object.
   * @defaultValue `getName`
   */
  sectionHeaderKey?: keyof CometChat.User;

  /**
   * A function that returns a list of actions available when hovering over a user item.
   * @param user - An instance of `CometChat.User` representing the selected user.
   * @returns An array of `CometChatOption` objects.
   */
  options?: (user: CometChat.User) => CometChatOption[];

  /**
   * Selection mode to use for the default trailing view.
   *
   * @defaultValue `SelectionMode.none`
   */
  selectionMode?: SelectionMode;

  /**
   * Callback function invoked when a user is selected.
   *
   * @remarks This prop works only if `selectionMode` is not set to `SelectionMode.none`.
   * @param user - An instance of `CometChat.User` representing the selected user.
   * @param selected - A boolean indicating whether the user is selected.
   * @returns void
   */
  onSelect?: (user: CometChat.User, selected: boolean) => void;

  /**
   * Callback function invoked when a user item is clicked.
   *
   * @param user - An instance of `CometChat.User` representing the clicked user.
   * @returns void
   */
  onItemClick?: (user: CometChat.User) => void;

  /**
   * Callback function invoked when an error occurs in the component.
   * @param error - An instance of `CometChat.CometChatException` representing the error.
   * @returns void
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * Callback function to be executed when the user list is empty.
   * @returns void
   */
  onEmpty?: () => void;

  /**
   * A custom component to render in the top-right corner of the user list.
   */
  headerView?: JSX.Element;

  /**
   * A custom view to display during the loading state.
   */
  loadingView?: JSX.Element;

  /**
   * A custom view to display when an error occurs.
   */
  errorView?: JSX.Element;

  /**
   * A custom view to display when no users are available in the list.
   */
  emptyView?: JSX.Element;

  /**
   * A custom view to render for each user in the fetched list.
   *
   * @param user - An instance of `CometChat.User` representing the user.
   * @returns A JSX element to be rendered as the user item.
   */
  itemView?: (user: CometChat.User) => JSX.Element;

  /**
   * A function that renders a JSX element to display the leading view.
   *
   * @param user - An instance of `CometChat.User` representing the user.
   * @returns A JSX element to be rendered as the leading view.
   */
  leadingView?: (user: CometChat.User) => JSX.Element;

  /**
   * A custom function to render the title view of a user.
   *
   * @param user - An instance of `CometChat.User` representing the user.
   * @returns A JSX element to be rendered as the title view.
   */
  titleView?: (user: CometChat.User) => JSX.Element;

  /**
   * A custom view to render the subtitle for each user.
   *
   * @param user - An instance of `CometChat.User` representing the user.
   * @returns A JSX element to be rendered as the subtitle view.
   */
  subtitleView?: (user: CometChat.User) => JSX.Element;

  /**
   * A function that renders a JSX element to display the trailing view.
   *
   * @param user - An instance of `CometChat.User` representing the user.
   * @returns A JSX element to be rendered as the trailing view.
   */
  trailingView?: (user: CometChat.User) => JSX.Element;

  /**
   * Controls the visibility of the scrollbar in the list list.
   * 
   * @defaultValue `false`
   */
    showScrollbar?: boolean;
}

type State = {
  searchText: string;
  userList: CometChat.User[];
  fetchState: States;
  isFirstReload: boolean;
  disableLoadingState: boolean;
};

export type Action =
  | { type: "setSearchText"; searchText: State["searchText"] }
  | {
    type: "appendUsers";
    users: CometChat.User[];
    removeOldUsers?: boolean;
    usersManager?: UsersManager | null;
    onEmpty?: () => void;
  }
  | { type: "setFetchState"; fetchState: States }
  | { type: "setUserList"; userList: CometChat.User[] }
  | { type: "updateUser"; user: CometChat.User }
  | { type: "setIsFirstReload"; isFirstReload: boolean };

function stateReducer(state: State, action: Action): State {
  let newState = state;
  const { type } = action;
  switch (type) {
    case "setSearchText":
      newState = { ...state, searchText: action.searchText };
      break;
    case "appendUsers":
      let users: CometChat.User[] = [];
      if (action.removeOldUsers) {
        if (!state.disableLoadingState) {
          state.userList = [];
        }
        users = action.users;
        if (!state.disableLoadingState) {
          newState = { ...state, userList: users };
        }
      } else {
        if (
          action.usersManager &&
          [0].includes(action.usersManager?.getCurrentPage()) &&
          !action.users.length
        ) {
          if (!action.users.length && action.onEmpty) {
            setTimeout(() => {
              action.onEmpty!();
            });
            newState = {
              ...state,
              fetchState: States.empty,
            };
          }
        } else if (action.users.length !== 0) {
          newState = {
            ...state,
            userList:
              action.usersManager?.getCurrentPage() == 1
                ? [...action.users]
                : [...state.userList, ...action.users],
          };
        }
      }
      break;
    case "setUserList":
      newState = { ...state, userList: action.userList };
      break;
    case "setFetchState":
      newState = { ...state, fetchState: action.fetchState };
      break;
    case "updateUser": {
      const { userList } = state;
      const { user: targetUser } = action;
      const targetUserUid = targetUser.getUid();
      const targetIdx = userList.findIndex(
        (user) => user.getUid() === targetUserUid
      );
      if (targetIdx > -1) {
        newState = {
          ...state,
          userList: userList.map((user, i) => {
            return i === targetIdx ? targetUser : user;
          }),
        };
      }
      break;
    }
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
 * Renders a scrollable list of users that has been created in a CometChat app
 */
export function CometChatUsers(props: UsersProps) {
  const {
    hideSearch = false,
    itemView = null,
    showSectionHeader = true,
    sectionHeaderKey = "getName",
    loadingView, // Will use the default provided by CometChatList if undefined
    hideError = false,
    errorView, // Will use the default provided by CometChatList if undefined
    emptyView, // Will use the default provided by CometChatList if undefined
    subtitleView = null,
    hideUserStatus = false,
    headerView,
    options = null,
    selectionMode = SelectionMode.none,
    onSelect, // Won't use if undefined
    usersRequestBuilder = null,
    searchRequestBuilder = null,
    onItemClick, // Won't use if undefined
    onError,
    activeUser = null,
    searchKeyword = "",
    onEmpty,
    disableLoadingState = false,
    leadingView,
    titleView,
    trailingView,
    showScrollbar = false,
  } = props;

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [state, dispatch] = useReducer(stateReducer, {
    searchText: "",
    userList: [],
    fetchState: States.loading,
    isFirstReload: false,
    disableLoadingState: disableLoadingState,
  });
  const titleRef = useRef<string>(getLocalizedString("user_title"));
  const searchPlaceholderTextRef = useRef<string>(getLocalizedString("user_search_placeholder"));
  const errorHandler = useCometChatErrorHandler(onError);
  const usersManagerRef = useRef<UsersManager | null>(null);
  const fetchNextIdRef = useRef("");
  const attachListenerOnFetch = useRef<boolean>(false);
  const isConnectionReestablished = useRef<boolean>(false);
  const usersSearchText = useRef<string>("");
  let isJustMounted = useRef<boolean>(true);
  (() => {
    if (state.searchText && state.searchText !== usersSearchText.current) {
      usersSearchText.current = state.searchText;
    }
    if (state.isFirstReload) {
      attachListenerOnFetch.current = true;
      state.isFirstReload = false;
    }
  })();

  /**
   * Initiates a fetch request and appends the fetched users to the `userList` state
   *
   * @remarks
   * This function also updates the `fetchState` state
   *
   * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `userList` state
   */
  const fetchNextAndAppendUsers = useCallback(
    async (fetchId: string): Promise<void> => {
      const usersManager = usersManagerRef.current;
      if (!usersManager) {
        return;
      }
      let initialState =
        isConnectionReestablished.current ||
          (disableLoadingState && !isJustMounted)
          ? States.loaded
          : States.loading;
      dispatch({ type: "setFetchState", fetchState: initialState });
      try {
        const newUsers = await usersManager.fetchNext();
        if (fetchId !== fetchNextIdRef.current) {
          return;
        }
        let removeOldUsers = isConnectionReestablished.current ? true : false;
        dispatch({
          type: "appendUsers",
          users: newUsers,
          removeOldUsers,
          usersManager,
          onEmpty,
        });
        if (attachListenerOnFetch.current) {
          UsersManager.attachConnestionListener(() => {
            const requestBuilder =
              usersRequestBuilder === null
                ? new CometChat.UsersRequestBuilder().setLimit(30)
                : usersRequestBuilder;
            usersManagerRef.current = new UsersManager({
              searchText: usersSearchText.current,
              usersRequestBuilder: requestBuilder,
              searchRequestBuilder,
              usersSearchText
            });
            isConnectionReestablished.current = true;
          });
          attachListenerOnFetch.current = false;
        }
        if (!isConnectionReestablished.current) {
          dispatch({ type: "setFetchState", fetchState: States.loaded });
        } else {
          isConnectionReestablished.current = false;
        }
      } catch (error: unknown) {
        if (fetchId === fetchNextIdRef.current && state.userList?.length <= 0) {
          dispatch({ type: "setFetchState", fetchState: States.error });
        }
        errorHandler(error, 'fetchNextAndAppendUsers');
      }
      isJustMounted.current = false;
    },
    [errorHandler, dispatch]
  );

  /**
   * Updates the `searchText` state
   */
  const onSearch = useCallback(
    (newSearchText: string): void => {
      try {
        const trimmedText = newSearchText.trim();
        if (
          newSearchText.length === 0 ||
          trimmedText.length > 0
        ) {
          usersSearchText.current = "";
          dispatch({ type: "setSearchText", searchText: trimmedText });
        }
        // dispatch({type: "setSearchText", searchText: newSearchText});
      } catch (error) {
        errorHandler(error, 'onSearch');
      }
    },
    [dispatch]
  );

  /**
   * Update the user object if found in the `userList` state
   */
  const updateUser = useCallback(
    (user: CometChat.User): void => {
      dispatch({ type: "updateUser", user });
    },
    [dispatch]
  );

  /**
   * Creates tail view for the default list item view
   */
  function getDefaultListItemTailView(
    user: CometChat.User
  ): JSX.Element | null {
    try {
      if (trailingView) {
        return trailingView(user)
      }
      if (
        selectionMode !== SelectionMode.single &&
        selectionMode !== SelectionMode.multiple
      ) {
        return null;
      }
      let tailViewContent: JSX.Element;
      if (selectionMode === SelectionMode.single) {
        tailViewContent = (
          <CometChatRadioButton
            name={CometChatUIKitConstants.radioNames.users}
            id={user.getUid()}
            onRadioButtonChanged={(e) => onSelect?.(user, e.checked)}
          />
        );
      } else {
        tailViewContent = (
          <CometChatCheckbox
            key={user.getUid()}
            checked={selectedUsers.includes(user.getUid()) ? true : false}
            onCheckBoxValueChanged={(e) => {
              onSelect?.(user, e.checked);
              setSelectedUsers((prevState) => {
                if (e.checked) {
                  return [...prevState, user.getUid()];
                } else {
                  const filteredUsers = prevState.filter((userItr) => {
                    return userItr !== user.getUid();
                  })
                  return [...filteredUsers];
                }
              })
            }}
          />
        );
      }
      return (
        <>{tailViewContent}</>
      );
    } catch (error) {
      errorHandler(error, 'getDefaultListItemTailView')
      return null;
    }
  }

  /**
   * Creates menu view for the default list item view
   *
   * @remarks
   * This menu view is shown on mouse over the default list item view.
   * The visibility of this view is handled by the default list item view
   */
  function getDefaultListItemMenuView(
    user: CometChat.User
  ): JSX.Element | null {
    try {
      let curOptions: CometChatOption[] | undefined;
      if (!(curOptions = options?.(user))?.length) {
        return null;
      }
      return (
        <CometChatContextMenu
          data={curOptions as unknown as (CometChatActionsIcon | CometChatActionsView)[]}
          onOptionClicked={(data: CometChatOption) => data.onClick?.()}
        />
      );
    } catch (error) {
      errorHandler(error, 'getDefaultListItemMenuView');
      return null;
    }
  }

  /**
   * Creates `listItem` prop of the `CometChatList` component
   */
  function getListItem(): (user: CometChat.User) => JSX.Element {
    if (itemView) {
      return itemView;
    }
    return function (user: CometChat.User): JSX.Element {
      try {
        const status = user.getStatus();
        const isActive = activeUser?.getUid() === user.getUid();
        let userBlockedFlag = new MessageUtils().getUserStatusVisible(user) || hideUserStatus;        
        return (
          <div
            className={`cometchat-users__list-item ${userBlockedFlag ? "" : `cometchat-users__list-item-${status}`} ${isActive ? `cometchat-users__list-item-active` : ""}`}
          >
            <CometChatListItem
              stopEventPropagation={true}
              id={user.getUid()}
              avatarURL={user.getAvatar()}
              avatarName={user.getName()}
              title={user.getName()}
              titleView={titleView?.(user)}
              leadingView={leadingView?.(user)}
              subtitleView={subtitleView?.(user)}
              trailingView={getDefaultListItemTailView(user)}
              menuView={getDefaultListItemMenuView(user)}
              onListItemClicked={(e) => {
                onItemClick?.(user);
                setSelectedUsers((prevState) => {
                  let userFound = false;
                  const filteredUsers = prevState.filter((userItr) => {
                    if (userItr === user.getUid()) {
                      userFound = true;
                    }
                    return userItr !== user.getUid();
                  })
                  if (userFound) {
                    return [...filteredUsers];
                  } else {
                    return [...prevState, user.getUid()];
                  }
                })
              }}
            />
          </div>
        );
      } catch (error) {
        errorHandler(error, 'getListItem');
        return (<></>);
      }
    };
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
    try {
      if (loadingView) {
        return loadingView
      }
      return <div className="cometchat-users__shimmer">
        {[...Array(15)].map((_, index) => (
          <div key={index} className="cometchat-users__shimmer-item">
            <div className="cometchat-users__shimmer-item-avatar"></div>
            <div className="cometchat-users__shimmer-item-title"></div>
          </div>
        ))}
      </div>
    } catch (error) {
      errorHandler(error, 'getLoadingView');
    }
  }

  /**
   * Renders the empty state view when there are no groups to display
   *
   * @remarks
   * If a custom `emptyView` is provided, it will be used. Otherwise, a default empty state view with a message is displayed.
   *
   * @returns A JSX element representing the empty state
   */
  const getEmptyView = () => {
    try {
      const isDarkMode = getThemeMode() == "dark" ? true : false;
      if (emptyView) {
        return emptyView
      }
      return (
        <div className="cometchat-users__empty-state-view">
          <div className="cometchat-users__empty-state-view-icon">
            <img src={isDarkMode ? emptyIconDark : emptyIcon} alt="" />
          </div>
          <div className="cometchat-users__empty-state-view-body">
            <div className="cometchat-users__empty-state-view-body-title">{getLocalizedString("user_empty_title")}</div>
            <div className="cometchat-users__empty-state-view-body-description">{getLocalizedString("user_empty_subtitle")}</div>
          </div>
        </div>
      )
    } catch (error) {
      errorHandler(error, 'getEmptyView');
    }
  }

  /**
   * Renders the error state view when an error occurs
   *
   * @remarks
   * If a custom `errorView` is provided, it will be used. Otherwise, a default error message is displayed.
   *
   * @returns A JSX element representing the error state
   */
  const getErrorView = () => {
    try {
      const isDarkMode = getThemeMode() == "dark" ? true : false;

      if (errorView) {
        return errorView
      }

      return (
        <div className="cometchat-users__error-state-view">
          <div className="cometchat-users__error-state-view-icon">
            <img src={isDarkMode ? errorIconDark : errorIcon} alt="" />
          </div>
          <div className="cometchat-users__error-state-view-body">
            <div className="cometchat-users__error-state-view-body-title">{getLocalizedString("user_error_title")}</div>
            <div className="cometchat-users__error-state-view-body-description">{getLocalizedString("user_error_subtitle")}
            </div>
          </div>
        </div>
      )
    } catch (error) {
      errorHandler(error, 'getErrorView');
    }
  }

  useCometChatUsers({
    usersManagerRef,
    fetchNextAndAppendUsers,
    searchText: state.searchText,
    usersRequestBuilder,
    searchRequestBuilder,
    dispatch,
    updateUser,
    fetchNextIdRef,
    searchKeyword,
    disableLoadingState,
    usersSearchText,
    hideUserStatus,
    errorHandler,
  });
  return (
    <div className="cometchat" style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <div
        className={`cometchat-users ${!showScrollbar ? "cometchat-users-hide-scrollbar" : ""}`}
      >
        <CometChatList
          showScrollbar={showScrollbar}
          title={titleRef.current}
          hideSearch={state.fetchState === States.error || hideSearch}
          searchPlaceholderText={searchPlaceholderTextRef.current}
          searchText={state.searchText}
          onSearch={onSearch}
          list={state.userList}
          itemView={getListItem()}
          onScrolledToBottom={() =>
            fetchNextAndAppendUsers(
              (fetchNextIdRef.current =
                "onScrolledToBottom_" + String(Date.now()))
            )
          }
          showSectionHeader={showSectionHeader}
          sectionHeaderKey={sectionHeaderKey}
          listItemKey='getUid'
          state={
            state.fetchState === States.loaded &&
              state.userList.length === 0 &&
              !onEmpty
              ? States.empty
              : state.fetchState
          }
          loadingView={getLoadingView()}
          hideError={hideError}
          emptyView={getEmptyView()}
          errorView={getErrorView()}
          headerView={headerView}
        />
      </div>
    </div>
  );
}
