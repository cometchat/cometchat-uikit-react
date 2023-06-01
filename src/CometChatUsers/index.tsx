import { CometChat } from "@cometchat-pro/chat";
import { CSSProperties, useCallback, useContext, useReducer, useRef, JSX } from "react";
import { SelectionMode, States, TitleAlignment } from "uikit-utils-lerna";
import SearchIcon from "./assets/search.svg";
import SpinnerIcon from "./assets/spinner.svg";
import { CometChatOption, CometChatUIKitConstants, localize } from "uikit-resources-lerna";
import { CometChatList } from "../Shared/Views/CometChatList";
import { avatarStyle, listItemStyle, listStyle, menuStyles, statusIndicatorStyle, tailViewSelectionContainerStyle, UsersWrapperStyle } from "./style";
import { UsersStyle } from "uikit-utils-lerna";
import { UsersManager } from "./controller";
import { Hooks } from "./hooks";
import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { CometChatContext } from "../CometChatContext";
import { useCometChatErrorHandler } from "../CometChatCustomHooks";
import { CometChatListItem } from "../Shared/Views/CometChatListItem";
import { CometChatMenuList } from "../Shared/Views/CometChatMenuList";
import { CometChatRadioButton } from "../Shared/Views/CometChatRadioButton";
import { CometChatCheckbox } from "../Shared/Views/CometChatCheckbox";

export interface IUsersProps {
    /** 
     * Title of the component 
     * 
     * @defaultValue `localize("USERS")` 
    */
    title? : string,
    /**
     * Alignment of the `title` text
     * 
     * @defaultValue `TitleAlignment.left`
     */
    tileAlignment? : TitleAlignment,
    /**
     * Hide the search bar
     * 
     * @defaulValue `false`
     */
    hideSearch? : boolean,
    /**
     * Image URL for the search icon to use in the search bar
     * 
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL? : string,
    /**
     * Text to be displayed when the search input has no value
     * 
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholderText? : string,
    /**
     * Custom list item view to be rendered for each user in the fetched list
     */
    listItemView? : (user : CometChat.User) => JSX.Element,
    /**
     * Show alphabetical header
     * 
     * @defaultValue `true`
     */
    showSectionHeader? : boolean,
    /**
     * Property on the user object
     * 
     * @remarks
     * This property will be used to extract the section header character from the user object 
     * 
     * @defaultValue `getName`
     */
    sectionHeaderKey? : keyof CometChat.User,
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView? : JSX.Element,
    /**
     * Image URL for the default loading view
     * 
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL? : string,
    /**
     * Hide error view
     * 
     * @remarks
     * If set to true, hides the default and the custom error view
     * 
     * @defaultValue `false`
     */
    hideError? : boolean,
    /**
     * Custom view for the error state of the component
     */
    errorStateView? : JSX.Element,
    /**
     * Text to display in the default error view
     * 
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText? : string,
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView? : JSX.Element,
    /**
     * Text to display in the default empty view
     * 
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText? : string,
    /**
     * Custom subtitle view to be rendered for each user in the fetched list
     *   
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView? : (user : CometChat.User) => JSX.Element,
    /**
     * Hide user presence
     * 
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     * 
     * @defaultValue `false`
     */
    disableUsersPresence? : boolean,
    /**
     * Custom view to render on the top-right of the component
     */
    menus? : JSX.Element,
    /** 
     * List of actions available on mouse over on the default list item component
     */
    options? : (user : CometChat.User) => CometChatOption[],
    /**
     * Hide the separator at the bottom of the default list item view
     * 
     * @defaultValue `false`
     */
    hideSeparator? : boolean,
    /**
     * Selection mode to use for the default tail view
     * 
     * @remarks
     * This prop is used if `listItemView` prop is not provided. 
     * 
     * @defaultValue `SelectionMode.none`
     */
    selectionMode? : SelectionMode,
    /**
     * Function to call when a user from the fetched list is selected 
     *  
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect? : (users : CometChat.User) => void,
    /**
     * Request builder to fetch users
     * 
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     * 
     * @defaultValue Default request builder having the limit set to 30
     */
    usersRequestBuilder? : CometChat.UsersRequestBuilder,
    /**
     * Request builder with search parameters to fetch users
     * 
     * @remarks
     * If the search input is not empty, 
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder? : CometChat.UsersRequestBuilder,
    /**
     * Function to call on click of the default list item view of a user
     */
    onItemClick? : (user : CometChat.User) => void,
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Styles to apply to the status indicator component of the default list item view 
     */
    statusIndicatorStyle? : CSSProperties,
    /**
     * Styles to apply to the avatar component of the default list item view 
     */
    avatarStyle? : AvatarStyle,
    /**
     * Styles to apply to this component 
     */
    usersStyle? : UsersStyle,
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle? : ListItemStyle,
    /**
     * User to highlight 
     * 
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeUser? : CometChat.User
};

type State = {
    searchText : string,
    userList : CometChat.User[],
    fetchState : States
};

export type Action = {type : "setSearchText", searchText : State["searchText"]} |
                     {type : "appendUsers", users : CometChat.User[]} |
                     {type : "setFetchState", fetchState : States} |
                     {type : "setUserList", userList : CometChat.User[]} |
                     {type : "updateUser", user : CometChat.User};

function stateReducer(state : State, action : Action) : State {
    let newState = state;
    const { type } = action;
    switch(type) {
        case "setSearchText": 
            newState = {...state, searchText: action.searchText};
            break;
        case "appendUsers":
            newState = {...state, userList: [...state.userList, ...action.users]};
            break;
        case "setUserList": 
            newState = {...state, userList: action.userList};
            break;
        case "setFetchState":
            newState = {...state, fetchState: action.fetchState};
            break;
        case "updateUser": {
            const { userList } = state;
            const { user : targetUser } = action;
            const targetUserUid = targetUser.getUid();
            const targetIdx = userList.findIndex(user => user.getUid() === targetUserUid);
            if (targetIdx > -1) {
                newState = {...state, userList: userList.map((user, i) => {
                    return i === targetIdx ? targetUser : user;
                })};
            }
            break;
        }
        default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const x : never = type;
        }
    }
    return newState;
}

/**
 * Renders a scrollable list of users that has been created in a CometChat app
 */
export function CometChatUsers(props : IUsersProps) {
    const {
        title = localize("USERS"),
        tileAlignment = TitleAlignment.left,
        hideSearch = false,
        searchIconURL = SearchIcon,
        searchPlaceholderText = localize("SEARCH"),
        listItemView = null,
        showSectionHeader = true,
        sectionHeaderKey = "getName",
        loadingStateView, // Will use the default provided by CometChatList if undefined
        loadingIconURL = SpinnerIcon,
        hideError = false,
        errorStateView, // Will use the default provided by CometChatList if undefined
        errorStateText = localize("SOMETHING_WRONG"),
        emptyStateView, // Will use the default provided by CometChatList if undefined
        emptyStateText = localize("NO_USERS_FOUND"),
        subtitleView = null,
        disableUsersPresence = false,
        menus = null,
        options = null,
        hideSeparator = false,
        selectionMode = SelectionMode.none,
        onSelect, // Won't use if undefined
        usersRequestBuilder = null,
        searchRequestBuilder = null,
        onItemClick, // Won't use if undefined
        onError, 
        statusIndicatorStyle : statusIndicatorStyleObject = null,
        avatarStyle : avatarStyleObject = null,
        usersStyle : usersStyleObject = null,
        listItemStyle : listItemStyleObject = null,
        activeUser = null
    } = props;

    const [state, dispatch] = useReducer(stateReducer, {
        searchText: "",
        userList: [],
        fetchState: States.loading
    });
    const errorHandler = useCometChatErrorHandler(onError);
    const usersManagerRef = useRef<UsersManager | null>(null);
    const fetchNextIdRef = useRef("");
    const { theme } = useContext(CometChatContext);

    /**
     * Initiates a fetch request and appends the fetched users to the `userList` state
     * 
     * @remarks
     * This function also updates the `fetchState` state
     * 
     * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `userList` state
     */
    const fetchNextAndAppendUsers = useCallback(async (fetchId : string) : Promise<void> => {
        const usersManager = usersManagerRef.current;
        if (!usersManager) {
            return;
        }
        dispatch({type: "setFetchState", fetchState: States.loading});   
        try {
            const newUsers = await usersManager.fetchNext();
            if (fetchId !== fetchNextIdRef.current) {
                return;
            }
            if (newUsers.length !== 0) {
                dispatch({type: "appendUsers", users: newUsers});
            }
            dispatch({type: "setFetchState", fetchState: States.loaded});
        }
        catch(error : unknown) {
            if (fetchId === fetchNextIdRef.current) {
                dispatch({type: "setFetchState", fetchState: States.error});
            }
            errorHandler(error);
        }
    }, [errorHandler, dispatch]);

    /**
     * Updates the `searchText` state
     */
    const onSearch = useCallback((newSearchText : string) : void => {
        dispatch({type: "setSearchText", searchText: newSearchText});
    }, [dispatch]);

    /**
     * Update the user object if found in the `userList` state
     */
    const updateUser = useCallback((user : CometChat.User) : void => {
        dispatch({type: "updateUser", user});
    }, [dispatch]);

    /**
     * Creates menus to display
     */
    function getMenus() : JSX.Element | null {
        if (!menus) {
            return null;
        }
        return (
            <div
                className = "cc-users__menus"
                style = {menuStyles()}
            >
                {menus}
            </div>
        );
    }

    /**
     * Creates tail view for the default list item view
     */
    function getDefaultListItemTailView(user : CometChat.User) : JSX.Element | null { 
        if (selectionMode !== SelectionMode.single && selectionMode !== SelectionMode.multiple) {
            return null;
        }
        let tailViewContent : JSX.Element;
        if (selectionMode === SelectionMode.single) {
            tailViewContent = (
                <CometChatRadioButton 
                    onChange = {e => onSelect?.(user)}
                />
            );
        }
        else {
            tailViewContent = (
                <CometChatCheckbox 
                    onChange = {e => onSelect?.(user)}
                />
            );
        }
        return (
            <div
                style = {tailViewSelectionContainerStyle()}
            >
                {tailViewContent}
            </div>
        );
    }

    /**
     * Creates menu view for the default list item view
     * 
     * @remarks
     * This menu view is shown on mouse over the default list item view. 
     * The visibility of this view is handled by the default list item view
     */
    function getDefaultListItemMenuView(user : CometChat.User) : JSX.Element | null {
        let curOptions : CometChatOption[] | undefined;
        if (!(curOptions = options?.(user))?.length) {
            return null;
        }
        return (
            <CometChatMenuList 
                data = {curOptions}
                onOptionClick = {e => e.detail.data.onClick?.()}
            />
        );
    }

    /**
     * Get the status indicator color to use for the default list item view
     * 
     * @remarks
     * If the intention is not to show the status indicator, `null` should be returned
     */
    function getStatusIndicatorColor(user : CometChat.User) : string | null {
        if (disableUsersPresence || user.getStatus() === CometChatUIKitConstants.userStatusType.offline) {
            return null;
        }
        return usersStyleObject?.onlineStatusColor || theme.palette.getSuccess() || null;
    }

    /**
     * Creates `listItem` prop of the `CometChatList` component
     */
    function getListItem() : (user : CometChat.User) => JSX.Element {
        if (listItemView) {
            return listItemView;
        }
        return function(user : CometChat.User) : JSX.Element {
            return (
                <CometChatListItem
                    id = {user.getUid()}
                    avatarURL = {user.getAvatar()}
                    avatarName = {user.getName()}
                    title = {user.getName()}
                    isActive = {selectionMode === SelectionMode.none && user.getUid() === activeUser?.getUid()}
                    hideSeparator = {hideSeparator}
                    statusIndicatorColor = {getStatusIndicatorColor(user)}
                    statusIndicatorStyle = {statusIndicatorStyle(statusIndicatorStyleObject)}
                    avatarStyle = {avatarStyle(avatarStyleObject, theme)}
                    listItemStyle = {listItemStyle(listItemStyleObject, usersStyleObject, theme)}
                    subtitleView = {subtitleView?.(user)}
                    subtitleViewClassName = "cc-users__subtitle-view"
                    tailView = {getDefaultListItemTailView(user)}
                    tailViewClassName = "cc-users__tail-view"
                    menuView = {getDefaultListItemMenuView(user)}
                    menuViewClassName = "cc-users__options-view"
                    onClick = {e => onItemClick?.(user)}
                />
            );
        };
    }

    Hooks({
        usersManagerRef,
        fetchNextAndAppendUsers,
        searchText: state.searchText,
        usersRequestBuilder,
        searchRequestBuilder,
        dispatch,
        updateUser,
        fetchNextIdRef
    });

    return (
        <div
            className = "cc-users"
            style = {UsersWrapperStyle(usersStyleObject, theme)}
        >
            {getMenus()}
            <CometChatList
                title = {title}
                titleAlignment = {tileAlignment}
                hideSearch = {state.fetchState === States.error || hideSearch}
                searchIconURL = {searchIconURL}
                searchPlaceholderText = {searchPlaceholderText}
                searchText = {state.searchText}
                onSearch = {onSearch}
                list = {state.userList}
                listItem = {getListItem()}
                onScrolledToBottom = {() => fetchNextAndAppendUsers(fetchNextIdRef.current = "onScrolledToBottom_" + String(Date.now()))}
                showSectionHeader = {showSectionHeader}
                sectionHeaderKey = {sectionHeaderKey}
                listItemKey = "getUid"
                state = {state.fetchState === States.loaded && state.userList.length === 0 ? States.empty : state.fetchState}
                loadingView = {loadingStateView}
                loadingIconURL = {loadingIconURL}
                hideError = {hideError}
                errorStateView = {errorStateView}
                errorStateText = {errorStateText}
                emptyStateView = {emptyStateView}
                emptyStateText = {emptyStateText}
                listStyle = {listStyle(usersStyleObject, theme)}
            />
        </div>
    );
}
