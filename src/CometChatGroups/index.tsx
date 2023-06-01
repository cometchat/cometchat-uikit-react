import { SelectionMode, States, TitleAlignment, GroupsStyle } from "uikit-utils-lerna";
import SpinnerIcon from "./assets/spinner.svg";
import SearchIcon from "./assets/search.svg";
import LockedIcon from "./assets/locked.svg";
import PrivateIcon from "./assets/private.svg";
import { CometChatOption, CometChatUIKitConstants, localize } from "uikit-resources-lerna";
import { CometChatList } from "../Shared/Views/CometChatList";
import { avatarStyle, groupsStyle, groupsWrapperStyle, listItemStyle, menusStyle, statusIndicatorStyle, subtitleStyle } from "./style";
import { CometChat } from "@cometchat-pro/chat";
import { CSSProperties, useCallback, useContext, useReducer, useRef, JSX } from "react";
import { GroupsManager } from "./controller";
import { Hooks } from "./hooks";
import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { CometChatContext } from "../CometChatContext";
import { useCometChatErrorHandler } from "../CometChatCustomHooks";
import { CometChatListItem } from "../Shared/Views/CometChatListItem";
import { CometChatMenuList } from "../Shared/Views/CometChatMenuList";
import { CometChatRadioButton } from "../Shared/Views/CometChatRadioButton";
import { CometChatCheckbox } from "../Shared/Views/CometChatCheckbox";

interface IGroupsProps {
    /**
     * Custom view to render on the top-right of the component
     */
    menus? : JSX.Element,
    /** 
     * Title of the component 
     * 
     * @defaultValue `localize("GROUPS")` 
    */
    title? : string,
    /**
     * Alignment of the `title` text
     * 
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment? : TitleAlignment,
    /**
     * Text to be displayed when the search input has no value
     * 
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholderText? : string,
    /**
     * Image URL for the search icon to use in the search bar
     * 
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL? : string,
    /**
     * Hide the search bar
     * 
     * @defaulValue `false`
     */
    hideSearch? : boolean,
    /**
     * Request builder to fetch groups
     * 
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     * 
     * @defaultValue Default request builder having the limit set to 30
     */
    groupsRequestBuilder? : CometChat.GroupsRequestBuilder,
    /**
     * Request builder with search parameters to fetch groups
     * 
     * @remarks
     * If the search input is not empty, 
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder? : CometChat.GroupsRequestBuilder,
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Custom list item view to be rendered for each group in the fetched list
     */
    listItemView? : (group : CometChat.Group) => JSX.Element,
    /**
     * Hide the separator at the bottom of the default list item view
     * 
     * @defaultValue `false`
     */
    hideSeparator? : boolean,
    /**
     * Custom subtitle view to be rendered for each group in the fetched list
     *   
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView? : (group : CometChat.Group) => JSX.Element,
    /** 
     * List of actions available on mouse over on the default list item component
     */
    options? : (group : CometChat.Group) => CometChatOption[],
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
     * Function to call when a group from the fetched list is selected 
     *  
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect? : (group : CometChat.Group) => void,
    /**
     * Function to call on click of the default list item view of a group
     */
    onItemClick? : (group : CometChat.Group) => void,
    /**
     * Group to highlight 
     * 
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeGroup? : CometChat.Group,
    /**
     * Image URL for the default loading view
     * 
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL? : string,
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView? : JSX.Element,
    /**
     * Text to display in the default empty view
     * 
     * @defaultValue `localize("NO_GROUPS_FOUND")`
     */
    emptyStateText? : string,
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView? : JSX.Element,
    /**
     * Text to display in the default error view
     * 
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText? : string,
    /**
     * Custom view for the error state of the component
     */
    errorStateView? : JSX.Element,
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
     * Image URL for the status indicator icon in the default list item view of a password-protected group
     * 
     * @defaultValue `./assets/locked.svg`
     */
    passwordGroupIcon? : string,
    /**
     * Image URL for the status indicator icon in the default list item view of a private group
     * 
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon? : string,
    /**
     * Styles to apply to the status indicator component of the default list item view 
     */
    statusIndicatorStyle? : CSSProperties,
    /**
     * Styles to apply to the avatar component of the default list item view 
     */
    avatarStyle? : AvatarStyle,
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle? : ListItemStyle,
    /**
     * Styles to apply to this component 
     */
    groupsStyle? : GroupsStyle
};

type State = {
    searchText : string, 
    groupList : CometChat.Group[],
    fetchState : States
};

export type Action = {type : "appendGroups", groups : CometChat.Group[]} |
                     {type : "setGroupList", groupList : CometChat.Group[]} |
                     {type : "setFetchState", fetchState : States} |
                     {type : "updateGroup", group : CometChat.Group} |
                     {type : "removeGroup", guid : string} |
                     {type : "prependGroup", group : CometChat.Group} |
                     {type : "setSearchText", searchText : string};

function stateReducer(state : State, action : Action) : State {
    let newState = state;
    const { type } = action;
    switch(type) {
        case "appendGroups": 
            newState = {...state, groupList: [...state.groupList, ...action.groups]};
            break;
        case "setGroupList":
            newState = {...state, groupList: action.groupList};
            break;
        case "setFetchState":
            newState = {...state, fetchState: action.fetchState};
            break;
        case "updateGroup": {
            const { groupList } = state;
            const { group : targetGroup } = action;
            const targetGuid = targetGroup.getGuid();
            const targetIdx = groupList.findIndex(group => group.getGuid() === targetGuid);
            if (targetIdx > -1) {
                newState = {...state, groupList: groupList.map((group, i) => {
                    return i === targetIdx ? targetGroup : group;
                })};
            }
            break;
        }
        case "removeGroup": {
            const { groupList } = state;
            const targetGuid = action.guid;
            const targetIdx = groupList.findIndex(group => group.getGuid() === targetGuid);
            if (targetIdx > -1) {
                newState = {...state, groupList: groupList.filter((group, i) => i !== targetIdx)};
            } 
            break;
        }
        case "prependGroup": 
            newState = {...state, groupList: [action.group, ...state.groupList]};
            break;
        case "setSearchText":
            newState = {...state, searchText: action.searchText};
            break;
        default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const x : never = type;
        }
    }
    return newState;
}

/**
 * Renders a scrollable list of groups that has been created in a CometChat app
 */
export function CometChatGroups(props : IGroupsProps) {
    const {
        menus = null,
        title = localize("GROUPS"),
        titleAlignment = TitleAlignment.left,
        searchPlaceholderText = localize("SEARCH"),
        searchIconURL = SearchIcon,
        hideSearch = false,
        groupsRequestBuilder = null,
        searchRequestBuilder = null,
        onError,
        listItemView = null,
        hideSeparator = false,
        subtitleView = null,
        options = null,
        selectionMode = SelectionMode.none,
        onSelect,
        onItemClick,
        activeGroup = null,
        loadingIconURL = SpinnerIcon,
        loadingStateView,
        emptyStateText = localize("NO_GROUPS_FOUND"),
        emptyStateView,
        errorStateText = localize("SOMETHING_WRONG"),
        errorStateView,
        hideError = false,
        passwordGroupIcon = LockedIcon,
        privateGroupIcon = PrivateIcon,
        statusIndicatorStyle : statusIndicatorStyleObject,
        avatarStyle : avatarStyleObject,
        listItemStyle : listItemStyleObject,
        groupsStyle : groupsStyleObject
    } = props;

    const [state, dispatch] = useReducer(stateReducer, {
        searchText: "",
        groupList: [],
        fetchState: States.loading
    });
    const groupsManagerRef = useRef<GroupsManager | null>(null);
    const fetchNextIdRef = useRef("");
    const errorHandler = useCometChatErrorHandler(onError);
    const { theme } = useContext(CometChatContext);

    /**
     * Updates the `searchText` state
     */
    const onSearch = useCallback((searchText : string) : void => {
        dispatch({type: "setSearchText", searchText});
    }, [dispatch]);

    /**
     * Initiates a fetch request and appends the fetched groups to the `groupList` state
     * 
     * @remarks
     * This function also updates the `fetchState` state
     * 
     * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `groupList` state
     */
    const fetchNextAndAppendGroups = useCallback(async (fetchId : string) : Promise<void> => {
        const groupsManager = groupsManagerRef.current;
        if (!groupsManager) {
            return;
        }
        dispatch({type: "setFetchState", fetchState: States.loading});
        try {
            const groups = await groupsManager.fetchNext();
            if (fetchId !== fetchNextIdRef.current) {
                return;
            }
            if (groups.length !== 0) {
                dispatch({type: "appendGroups", groups});
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
     * Creates menus to display at the top-right of this component
     */
    function getMenus() : JSX.Element | null {
        if (menus === null) {
            return menus;
        }
        return (
            <div
                className = "cc-groups__menus"
                style = {menusStyle()}
            >
                {menus}
            </div>
        );
    }

    /**
     * Get a status icon based on the `group` passed to it
     */
    function getGroupStatusIcon(group : CometChat.Group) : string {
        let statusIconURL : string = "";
        switch(group.getType()) {
            case CometChatUIKitConstants.GroupTypes.password:
                statusIconURL = passwordGroupIcon;
                break;
            case CometChatUIKitConstants.GroupTypes.private:
                statusIconURL = privateGroupIcon;
                break;
        }
        return statusIconURL;
    }

    /**
     * Creates a subtitle view for the default list item view
     */
    function getSubtitleView(group : CometChat.Group) : JSX.Element {
        if (subtitleView !== null) {
            return subtitleView(group);
        }
        const membersCount = group.getMembersCount();
        return (
            <div
                className = "cc-groups__subtitle"
                style = {subtitleStyle(groupsStyleObject, theme)}
            >
                {`${membersCount} ${membersCount > 1 ? localize("MEMBERS") : localize("MEMBER")}`}
            </div>
        );
    }

    /**
     * Creates a menu view for the default list item view
     * 
     * @remarks
     * This menu view is shown on mouse over the default list item view. 
     * The visibility of view is handled by the default list item view
     */
    function getMenuView(group : CometChat.Group) : JSX.Element | null {
        let curOptions : CometChatOption[] | undefined;
        if (!(curOptions = options?.(group))?.length) {
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
     * Creates a tail view for the default list item view
     */
    function getTailView(group : CometChat.Group) : JSX.Element | null | undefined {
        switch(selectionMode) {
            case SelectionMode.none:
                return null;
            case SelectionMode.single: {
                return (
                    <CometChatRadioButton
                        onChange = {e => onSelect?.(group)}
                    />
                );
            }
            case SelectionMode.multiple: {
                return (
                    <CometChatCheckbox 
                        onChange = {e => onSelect?.(group)}
                    />
                );
            }
            default: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const x : never = selectionMode;
            }
        }
    }

    /**
     * Get the status indicator color to use for the default list item view
     * 
     * @remarks
     * If the intention is not to show the status indicator, `null` should be returned
     */
    function getStatusIndicatorColor(group : CometChat.Group) : string | null {
        switch(group.getType()) {
            case CometChatUIKitConstants.GroupTypes.private:
                return groupsStyleObject?.privateGroupIconBackground || theme.palette.getSuccess() || "rgb(0, 200, 111)";
            case CometChatUIKitConstants.GroupTypes.password:
                return groupsStyleObject?.passwordGroupIconBackground || "rgb(247, 165, 0)";
            default:
                return null;
        }
    }

    /**
     * Creates `listItem` prop of the `CometChatList` component
     */
    function getListItem() : (group : CometChat.Group) => JSX.Element {
        if (listItemView !== null) {
            return listItemView;
        }
        return function(group : CometChat.Group) {
            return (
                <CometChatListItem 
                    id = {group.getGuid()}
                    avatarURL = {group.getIcon()}
                    avatarName = {group.getName()}
                    title = {group.getName()}
                    statusIndicatorColor = {getStatusIndicatorColor(group)}
                    statusIndicatorIcon = {getGroupStatusIcon(group)}
                    hideSeparator = {hideSeparator}
                    isActive = {selectionMode === SelectionMode.none && activeGroup?.getGuid() === group.getGuid()}
                    statusIndicatorStyle = {statusIndicatorStyle(statusIndicatorStyleObject)}
                    avatarStyle = {avatarStyle(avatarStyleObject, theme)}
                    listItemStyle = {listItemStyle(listItemStyleObject, groupsStyleObject, theme)}
                    subtitleView = {getSubtitleView(group)}
                    subtitleViewClassName = "cc-groups__subtitle-view"
                    menuView = {getMenuView(group)}
                    menuViewClassName = "cc-groups__options-view"
                    tailView = {getTailView(group)}
                    tailViewClassName = "cc-group__tail-view"
                    onClick = {e => onItemClick?.(group)}
                />
            );
        };
    }

    Hooks({
        searchText: state.searchText,
        groupsRequestBuilder,
        searchRequestBuilder,
        fetchNextIdRef,
        groupsManagerRef,
        dispatch,
        fetchNextAndAppendGroups
    });

    return (
        <div
            className = "cc-groups"
            style = {groupsWrapperStyle(groupsStyleObject, theme)}
        >
            {getMenus()}
            <CometChatList 
                title = {title}
                titleAlignment = {titleAlignment}
                searchPlaceholderText = {searchPlaceholderText}
                searchIconURL = {searchIconURL}
                hideSearch = {hideSearch}
                searchText = {state.searchText}
                onSearch = {onSearch}
                list = {state.groupList}
                listItem = {getListItem()}
                onScrolledToBottom = {() => fetchNextAndAppendGroups(fetchNextIdRef.current = "onScrolledToBottom_" + String(Date.now()))}
                listItemKey = "getGuid"
                showSectionHeader = {false}
                state = {state.fetchState === States.loaded && state.groupList.length === 0 ? States.empty : state.fetchState}
                loadingIconURL = {loadingIconURL}
                loadingView = {loadingStateView}
                emptyStateText = {emptyStateText}
                emptyStateView = {emptyStateView}
                errorStateText = {errorStateText}
                errorStateView = {errorStateView}
                hideError = {hideError}
                listStyle = {groupsStyle(groupsStyleObject, theme)}
            />
        </div>
    );
}
