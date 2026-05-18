import {
  JSX,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import { CometChat, User } from "@cometchat/chat-sdk-javascript";
import { CometChatCheckbox } from "../BaseComponents/CometChatCheckbox/CometChatCheckbox";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatRadioButton } from "../BaseComponents/CometChatRadioButton/CometChatRadioButton";
import { CometChatAvatar } from "../BaseComponents/CometChatAvatar/CometChatAvatar";
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
import closeIcon from "../../assets/close.svg";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";

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

  /**
   * Shows a preview of selected users when selectionMode is multiple.
   * 
   * @remarks
   * When enabled, displays a preview section with chips showing selected users.
   * Each chip displays avatar, name, and a close button to remove the user.
   * 
   * @defaultValue `false`
   */
  showSelectedUsersPreview?: boolean;

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
            if (i === targetIdx) {
              if (!targetUser.getHasBlockedMe() && user.getHasBlockedMe()) {
                targetUser.setHasBlockedMe(true);
              }
              if (!targetUser.getBlockedByMe() && user.getBlockedByMe()) {
                targetUser.setBlockedByMe(true);
              }
              return targetUser;
            }
            return user;
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
    showSelectedUsersPreview = false,
  } = props;

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  // Store full user objects for selected users to persist across searches
  const selectedUsersMapRef = useRef<Map<string, CometChat.User>>(new Map());
  // Track the anchor index for shift-click range selection (Gmail-style)
  const lastClickedIndexRef = useRef<number | null>(null);
  // Track the anchor user UID to maintain consistency across re-renders and list changes
  const lastClickedUserUidRef = useRef<string | null>(null);
  // Ref to measure the selected users preview height
  const selectedUsersPreviewRef = useRef<HTMLDivElement | null>(null);
  // Ref to the wrapper div to scope DOM queries to this component instance
  const usersWrapperRef = useRef<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(stateReducer, {
    searchText: "",
    userList: [],
    fetchState: States.loading,
    isFirstReload: false,
    disableLoadingState: disableLoadingState,
  });

  // Enhanced helper function to update selected users and maintain the map with optimized performance
  const updateSelectedUsers = useCallback((newSelectedUsers: string[], usersToAdd?: CometChat.User[], usersToRemove?: CometChat.User[]) => {
    // Always update the state - the React state comparison will handle optimization
    setSelectedUsers(newSelectedUsers);
    
    // Optimized map updates with batch operations
    if (usersToAdd && usersToAdd.length > 0) {
      // Batch add operations
      usersToAdd.forEach(user => {
        selectedUsersMapRef.current.set(user.getUid(), user);
      });
    }
    
    if (usersToRemove && usersToRemove.length > 0) {
      // Batch remove operations
      usersToRemove.forEach(user => {
        selectedUsersMapRef.current.delete(user.getUid());
      });
    } else if (!usersToAdd || usersToAdd.length === 0) {
      // Only run cleanup if we're not adding users and might have stale entries
      const mapSize = selectedUsersMapRef.current.size;
      if (mapSize > newSelectedUsers.length) {
        // Use Set for O(1) lookups instead of array.includes() which is O(n)
        const newSelectedUsersSet = new Set(newSelectedUsers);
        const keysToDelete: string[] = [];
        
        // Collect keys to delete first to avoid modifying map during iteration
        selectedUsersMapRef.current.forEach((_, uid) => {
          if (!newSelectedUsersSet.has(uid)) {
            keysToDelete.push(uid);
          }
        });
        
        // Batch delete operations
        keysToDelete.forEach(uid => {
          selectedUsersMapRef.current.delete(uid);
        });
      }
    }
  }, []);

  /**
   * Helper function to update anchor point and maintain consistency
   * Ensures anchor point is correctly updated for all click types and handles edge cases
   */
  const updateAnchorPoint = useCallback((user: CometChat.User, index: number) => {
    // Validate index is within bounds
    if (index < 0 || index >= state.userList.length) {
      // Invalid index, clear anchor
      lastClickedIndexRef.current = null;
      lastClickedUserUidRef.current = null;
      return;
    }
    
    // Update both index and UID for consistency across re-renders
    lastClickedIndexRef.current = index;
    lastClickedUserUidRef.current = user.getUid();
  }, [state.userList]);

  /**
   * Helper function to get current anchor index, handling edge cases
   * Returns null if no valid anchor exists
   */
  const getCurrentAnchorIndex = useCallback((): number | null => {
    // If no anchor is set, return null
    if (lastClickedIndexRef.current === null || lastClickedUserUidRef.current === null) {
      return null;
    }
    
    // Check if the stored index is still valid
    const storedIndex = lastClickedIndexRef.current;
    if (storedIndex < 0 || storedIndex >= state.userList.length) {
      // Index is out of bounds, try to find user by UID
      const userIndex = state.userList.findIndex(u => u.getUid() === lastClickedUserUidRef.current);
      if (userIndex !== -1) {
        // Update the index to the new position
        lastClickedIndexRef.current = userIndex;
        return userIndex;
      } else {
        // User no longer exists in the list, clear anchor
        lastClickedIndexRef.current = null;
        lastClickedUserUidRef.current = null;
        return null;
      }
    }
    
    // Verify the user at the stored index matches the stored UID
    const userAtIndex = state.userList[storedIndex];
    if (userAtIndex && userAtIndex.getUid() === lastClickedUserUidRef.current) {
      return storedIndex;
    } else {
      // User moved or list changed, try to find by UID
      const userIndex = state.userList.findIndex(u => u.getUid() === lastClickedUserUidRef.current);
      if (userIndex !== -1) {
        // Update the index to the new position
        lastClickedIndexRef.current = userIndex;
        return userIndex;
      } else {
        // User no longer exists, clear anchor
        lastClickedIndexRef.current = null;
        lastClickedUserUidRef.current = null;
        return null;
      }
    }
  }, [state.userList]);

  /**
   * Handles shift-click range selection logic
   * Shared between checkbox and list item click handlers
   */
  const handleShiftClickRangeSelection = useCallback((user: CometChat.User, clickedIndex: number) => {
    // Get current anchor index using the improved helper function
    const anchorIndex = getCurrentAnchorIndex();
    
    // Handle edge case where no anchor exists - treat as regular click
    if (anchorIndex === null) {
      // No anchor point exists, treat shift-click as regular click and set as new anchor
      updateAnchorPoint(user, clickedIndex);
      const isCurrentlySelected = selectedUsers.includes(user.getUid());
      
      if (isCurrentlySelected) {
        onSelect?.(user, false);
        updateSelectedUsers(selectedUsers.filter(uid => uid !== user.getUid()), undefined, [user]);
      } else {
        onSelect?.(user, true);
        updateSelectedUsers([...selectedUsers, user.getUid()], [user]);
      }
      return;
    }

    // Use Set for O(1) lookups instead of array.includes() which is O(n)
    const selectedUsersSet = new Set(selectedUsers);
    const isClickedUserSelected = selectedUsersSet.has(user.getUid());
    
    if (isClickedUserSelected) {
      // Deselection logic - deselect clicked user and all users below it in current view
      const usersToDeselect = state.userList.slice(clickedIndex).filter(u => selectedUsersSet.has(u.getUid()));
      usersToDeselect.forEach(u => {
        onSelect?.(u, false);
      });
      // Update state: keep only users before the clicked index that are still selected
      const finalSelectedUsers = selectedUsers.filter(uid => {
        const userIndex = state.userList.findIndex(u => u.getUid() === uid);
        return userIndex !== -1 && userIndex < clickedIndex;
      });
      updateSelectedUsers(finalSelectedUsers, undefined, usersToDeselect);
    } else {
      // Range extension logic - combine existing selections with new ranges instead of replacing them
      const startIndex = Math.min(anchorIndex, clickedIndex);
      const endIndex = Math.max(anchorIndex, clickedIndex);
      
      const usersInRange = state.userList.slice(startIndex, endIndex + 1);
      const uidsInRange = usersInRange.map(u => u.getUid());
            
      // Select all users in range that aren't already selected
      const usersToAdd: CometChat.User[] = [];
      usersInRange.forEach(u => {
        if (!selectedUsersSet.has(u.getUid())) {
          onSelect?.(u, true);
          usersToAdd.push(u);
        }
      });
            
      // Combine existing selections with new range instead of replacing
      const combinedSelection = new Set([...selectedUsers, ...uidsInRange]);
      const finalSelection = Array.from(combinedSelection);

      updateSelectedUsers(finalSelection, usersToAdd);
    }
    
    // NOTE: Do NOT update anchor point after shift-click operations
    // The anchor should remain as the last individually clicked user (non-shift click)
    // as per requirement 1.4: "THE User_List SHALL maintain the anchor point as the last individually clicked user (non-shift click)"
  }, [state.userList, selectedUsers, onSelect, updateSelectedUsers, getCurrentAnchorIndex, updateAnchorPoint]);

  /**
   * Handles list item click events with support for shift-click range selection
   * Enhanced with optimized selection state management
   */
  const handleListItemClick = useCallback((user: CometChat.User, e: { id?: string; shiftKey?: boolean; metaKey?: boolean }) => {
    const clickedIndex = state.userList.findIndex(u => u.getUid() === user.getUid());
    const isShiftClick = e?.shiftKey === true;
    
    if (selectionMode === SelectionMode.multiple) {
      if (isShiftClick && getCurrentAnchorIndex() !== null) {
        // Handle shift-click range selection
        handleShiftClickRangeSelection(user, clickedIndex);
      } else {
        // Regular Click or Ctrl/Cmd+Click: Toggle individual without clearing others, set as anchor
        updateAnchorPoint(user, clickedIndex);
        const isCurrentlySelected = selectedUsers.includes(user.getUid());
        
        if (isCurrentlySelected) {
          onSelect?.(user, false);
          updateSelectedUsers(selectedUsers.filter(uid => uid !== user.getUid()), undefined, [user]);
        } else {
          onSelect?.(user, true);
          updateSelectedUsers([...selectedUsers, user.getUid()], [user]);
        }
      }
    } else {
      // Non-multiple selection mode - original behavior with enhanced state management
      onItemClick?.(user);
      const userFound = selectedUsers.includes(user.getUid());
      if (userFound) {
        updateSelectedUsers(selectedUsers.filter(uid => uid !== user.getUid()), undefined, [user]);
      } else {
        updateSelectedUsers([...selectedUsers, user.getUid()], [user]);
      }
    }
  }, [state.userList, selectedUsers, selectionMode, onSelect, onItemClick, updateSelectedUsers, handleShiftClickRangeSelection, getCurrentAnchorIndex, updateAnchorPoint]);

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
   * Creates tail view for the default list item view.
   * Used as the trailing selection control (radio/checkbox) for each user and
   * handles both regular selection and shift-click range selection behavior.
   */
  const getDefaultListItemTailView = useCallback((
    user: CometChat.User
  ): JSX.Element | null => {
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
              const clickedIndex = state.userList.findIndex(u => u.getUid() === user.getUid());
              const isShiftClick = e?.shiftKey === true;
              
              if (isShiftClick && getCurrentAnchorIndex() !== null) {
                // Handle shift-click range selection for checkbox clicks
                handleShiftClickRangeSelection(user, clickedIndex);
              } else {
                // Regular click: Toggle individual, set as anchor
                // Always update anchor point for non-shift clicks to ensure proper range selection behavior
                updateAnchorPoint(user, clickedIndex);
                onSelect?.(user, e.checked);
                
                // Use optimized selection state update
                if (e.checked) {
                  updateSelectedUsers([...selectedUsers, user.getUid()], [user]);
                } else {
                  updateSelectedUsers(selectedUsers.filter((userItr) => userItr !== user.getUid()), undefined, [user]);
                }
              }
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
  }, [trailingView, selectionMode, onSelect, selectedUsers, state.userList, handleShiftClickRangeSelection, updateSelectedUsers, getCurrentAnchorIndex, updateAnchorPoint, errorHandler]);

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
              onListItemClicked={(e) => handleListItemClick(user, e)}
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

  // Enhanced selection persistence across search and filter operations
  // Memoized function to get selected users list with optimized performance
  const getSelectedUsersList = useCallback((): CometChat.User[] => {
    // Return all selected users from the persistent map, regardless of current search results
    // Use direct iteration for better performance with large selections
    const result: CometChat.User[] = [];
    for (const uid of selectedUsers) {
      const user = selectedUsersMapRef.current.get(uid);
      if (user) {
        result.push(user);
      }
    }
    return result;
  }, [selectedUsers]);

  // Adjust list body padding when preview is visible to prevent blank space
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const updateListPadding = () => {
      if (!usersWrapperRef.current) return;
      
      const listBody = usersWrapperRef.current.querySelector('.cometchat-list__body') as HTMLDivElement | null;
      if (!listBody) return;

      if (showSelectedUsersPreview && selectionMode === SelectionMode.multiple) {
        const selectedUsersList = getSelectedUsersList();
        if (selectedUsersList.length > 0 && selectedUsersPreviewRef.current) {
          const previewHeight = selectedUsersPreviewRef.current.offsetHeight;
          listBody.style.paddingBottom = `${previewHeight}px`;
        } else {
          listBody.style.paddingBottom = '0px';
        }
      } else {
        listBody.style.paddingBottom = '0px';
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready, with a fallback timeout
    const scheduleUpdate = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          updateListPadding();
        });
      }, 0);
    };

    // Initial update
    scheduleUpdate();

    // Use ResizeObserver to handle dynamic height changes
    if (selectedUsersPreviewRef.current) {
      resizeObserver = new ResizeObserver(() => {
        scheduleUpdate();
      });
      resizeObserver.observe(selectedUsersPreviewRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedUsers, showSelectedUsersPreview, selectionMode, getSelectedUsersList]);

  const getSelectedUsersPreview = useCallback((): JSX.Element | null => {
    if (!showSelectedUsersPreview || selectionMode !== SelectionMode.multiple) {
      return null;
    }

    const selectedUsersList = getSelectedUsersList();
    
    if (selectedUsersList.length === 0) {
      return null;
    }

    const handleRemoveUser = (user: CometChat.User) => {
      // Call onSelect with false to uncheck the checkbox
      onSelect?.(user, false);
      // Update selectedUsers state and map with optimized state management
      updateSelectedUsers(selectedUsers.filter((uid) => uid !== user.getUid()), undefined, [user]);
    };

    return (
      <div ref={selectedUsersPreviewRef} className={`cometchat-users__selected-preview ${!showScrollbar ? 'cometchat-users__selected-preview-hide-scrollbar' : ''}`}>
        <div className={`cometchat-users__selected-preview-container ${!showScrollbar ? 'cometchat-users__selected-preview-container-hide-scrollbar' : ''}`}>
        {selectedUsersList.map((user) => {
            const fullName = user.getName();
            const trimmedName = fullName?.trim() ?? "";
            const displayName =
              trimmedName.length > 0
                ? trimmedName.split(/\s+/)[0]
                : fullName && fullName.length > 0
                  ? fullName
                  : "Unknown User";
            return (
              <div key={user.getUid()} className="cometchat-users__selected-preview-chip">
                <CometChatAvatar
                  image={user.getAvatar()}
                  name={user.getName()}
                />
                <span className="cometchat-users__selected-preview-chip-name">
                  {displayName}
                </span>
                <div className="cometchat-users__selected-preview-chip-close-button">
                  <CometChatButton iconURL={closeIcon} onClick={()=> handleRemoveUser(user)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [showSelectedUsersPreview, selectionMode, getSelectedUsersList, onSelect, selectedUsers, updateSelectedUsers, showScrollbar]);

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
    <div className="cometchat" style={{ width: "100%", height: "100%" }}>
      <div
        ref={usersWrapperRef}
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
        {getSelectedUsersPreview()}
      </div>
    </div>
  );
}
