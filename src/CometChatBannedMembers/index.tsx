import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties, useCallback, useContext, useReducer, useRef, JSX } from "react";
import { CometChatOption, CometChatUIKitConstants, localize, SelectionMode, States, TitleAlignment } from "uikit-resources-lerna";
import { BannedMembersStyle } from "uikit-utils-lerna";
import BackButtonIcon from "./assets/backbutton.svg";
import Close2xIcon from "./assets/close2x.svg";
import SpinnerIcon from "./assets/spinner.svg";
import SearchIcon from "./assets/search.svg";
import { CometChatContext } from "../CometChatContext";
import { CometChatList } from "../Shared/Views/CometChatList";
import { BannedMembersManager } from "./controller";
import { Hooks } from "./hooks";
import { avatarStyle, bannedMembersWrapperStyle, closeBtnStyle, defaultBackBtnStyle, listItemStyle, listStyle, menuListStyle, menusContainerStyle, statusIndicatorStyle, unbanBtnStyle } from "./style";
import { useCometChatErrorHandler, useRefSync } from "../CometChatCustomHooks";
import { CometChatListItem } from "../Shared/Views/CometChatListItem";
import { CometChatMenuList } from "../Shared/Views/CometChatMenuList";
import { CometChatButton } from "../Shared/Views/CometChatButton";
import { CometChatRadioButton } from "../Shared/Views/CometChatRadioButton";
import { CometChatCheckbox } from "../Shared/Views/CometChatCheckbox";

interface IBannedMembersProps {
    /**
     * Image URL for the back button
     * 
     * @remarks
     * This prop will also be used if `backButton` prop is not provided
     * 
     * @defaultValue `./assets/backbutton.svg`
     */
    backButtonIconURL? : string,
    /**
     * Show back button
     * 
     * @defaultValue `true`
     */
    showBackButton? : boolean,
    /**
     * Function to call when the back button is clicked
     */
    onBack? : () => void,
    /**
     * Custom view to render on the top-right of the component
     */
    menus? : JSX.Element,
    /** 
     * Title of the component 
     * 
     * @defaultValue `localize("BANNED_MEMBERS")` 
    */
    title? : string,
    /**
     * Alignment of the `title` text
     * 
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment? : TitleAlignment,
    /**
     * Text to be displayed when the search input has no value
     * 
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholder? : string,
    /**
     * Image URL for the search icon to use in the search bar
     * 
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL? : string,
    /**
     * Hide the search bar
     * 
     * @defaulValue `true`
     */
    hideSearch? : boolean,
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
     * @defaultValue `localize("")`
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
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Group to ban members from
     */
    group : CometChat.Group,
    /**
     * Request builder to fetch banned members
     * 
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     * 
     * @defaultValue Default request builder having the limit set to 30
     */
    bannedMembersRequestBuilder? : CometChat.BannedMembersRequestBuilder,
    /**
     * Request builder with search parameters to fetch banned members
     * 
     * @remarks
     * If the search input is not empty, 
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder? : CometChat.BannedMembersRequestBuilder,
    /**
     * Custom list item view to be rendered for each banned member in the fetched list
     */
    listItemView? : (bannedMember : CometChat.GroupMember) => JSX.Element,
    /**
     * Hide the separator at the bottom of the default list item view
     * 
     * @defaultValue `false`
     */
    hideSeparator? : boolean,
    /**
     * Hide user presence
     * 
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     * 
     * @defaultValue `true`
     */
    disableUsersPresence? : boolean,
    /**
     * Image URL for the close button
     * 
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL? : string,
    /**
     * Function to call when the close button is clicked
     */
    onClose? : () => void,
    /**
     * Custom subtitle view to be rendered for each banned member in the fetched list
     *   
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView? : (bannedMember : CometChat.GroupMember) => JSX.Element,
    /** 
     * List of actions available on mouse over on the default list item component
     */
    options? : (bannedMember : CometChat.GroupMember) => CometChatOption[],
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
     * 
     */
    unbanIconURL? : string,
    /**
     * Function to call on click of the default list item view of a banned member
     */
    onItemClick? : (bannedMember : CometChat.GroupMember) => void,
    /**
     * Function to call when a banned member from the fetched list is selected 
     *  
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect? : (bannedMember : CometChat.GroupMember) => void,
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
    bannedMemberStyle? : BannedMembersStyle
};

type State = {
    searchText : string,
    bannedMembers : CometChat.GroupMember[],
    fetchState : States
};

export type Action = {type : "setSearchText", searchText : string} |
                     {type : "setFetchState", fetchState : States} |
                     {type : "appendBannedMembers", bannedMembers : CometChat.GroupMember[]} |
                     {type : "setBannedMembers", bannedMembers : []} |
                     {type : "removeBannedMemberIfPresent", bannedMemberUid : string} |
                     {type : "addMember", member : CometChat.GroupMember} |
                     {type : "updateMemberStatusIfPresent", member : CometChat.User};

function stateReducer(state : State, action : Action) : State {
    let newState = state;
    const { type } = action;
    switch(type) {
        case "setSearchText":
            newState = {...state, searchText: action.searchText};
            break;
        case "setFetchState":
            newState = {...state, fetchState: action.fetchState};
            break;
        case "appendBannedMembers": {
            const { bannedMembers } = action;
            if (bannedMembers.length !== 0) {
                newState = {...state, bannedMembers: [...state.bannedMembers, ...bannedMembers]};
            }
            break;
        }
        case "setBannedMembers": {
            newState = {...state, bannedMembers: action.bannedMembers};
            break;
        }
        case "removeBannedMemberIfPresent": {
            const { bannedMembers } = state;
            const targetUid = action.bannedMemberUid;
            const targetIdx = bannedMembers.findIndex(bannedMember => bannedMember.getUid() === targetUid);
            if (targetIdx > -1) {
                newState = {...state, bannedMembers: bannedMembers.filter((bannedMember, i) => i !== targetIdx)};
            }
            break;
        }
        case "addMember": {
            newState = {...state, bannedMembers: [...state.bannedMembers, action.member]};
            break;
        }
        case "updateMemberStatusIfPresent": {
            const { member } = action;
            const { bannedMembers } = state;
            const targetUid = member.getUid();
            const targetIdx = bannedMembers.findIndex(bannedMember => bannedMember.getUid() === targetUid);
            if (targetIdx > -1) {
                newState = {...state, bannedMembers: bannedMembers.map((bannedMember, i) => {
                    if (i === targetIdx) {
                        bannedMember.setStatus(member.getStatus());
                    }
                    return bannedMember;
                })}
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
 * Renders a scrollable list of banned members related to a group of a CometChat App
 */
export function CometChatBannedMembers(props : IBannedMembersProps) {
    const {
        backButtonIconURL = BackButtonIcon,
        showBackButton = true,
        onBack,
        menus = null,
        title = localize("BANNED_MEMBERS"),
        titleAlignment = TitleAlignment.center,
        searchPlaceholder = localize("SEARCH"),
        searchIconURL = SearchIcon, 
        hideSearch = true,
        loadingIconURL = SpinnerIcon,
        loadingStateView,
        emptyStateText = localize(""),
        emptyStateView,
        errorStateText = localize("SOMETHING_WRONG"),
        errorStateView,
        onError,
        group,
        bannedMembersRequestBuilder = null,
        searchRequestBuilder = null,
        listItemView = null,
        hideSeparator = false,
        disableUsersPresence = true,
        closeButtonIconURL = Close2xIcon,
        onClose,
        subtitleView = null,
        options = null,
        selectionMode = SelectionMode.none,
        unbanIconURL = Close2xIcon,
        onItemClick = null,
        onSelect = null,
        hideError = false,
        statusIndicatorStyle : statusIndicatorStyleObject = null,
        avatarStyle : avatarStyleObject = null,
        bannedMemberStyle : bannedMemberStyleObject = null,
        listItemStyle : listItemStyleObject = null
    } = props;

    const [state, dispatch] = useReducer(stateReducer, {
        searchText: "",
        bannedMembers: [],
        fetchState: States.loading
    });
    const bannedMembersManagerRef = useRef<BannedMembersManager | null>(null);
    const fetchNextIdRef = useRef("");
    const errorHandler = useCometChatErrorHandler(onError);
    const groupPropRef = useRefSync(group);
    const { theme } = useContext(CometChatContext);

    /**
     * Updates the `searchText` state
     */
    const onSearchTextChange = useCallback((searchText : string) : void => {
        dispatch({type: "setSearchText", searchText});
    }, [dispatch]); 

    /**
     * Initiates a fetch request and appends the fetched banned members to the `bannedMembers` state
     * 
     * @remarks
     * This function also updates the `fetchState` state
     * 
     * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `bannedMembers` state
     */
    const fetchNextAndAppendBannedMembers = useCallback(async (fetchId : string) : Promise<void> => {
        if (!bannedMembersManagerRef.current) {
            return;
        }
        dispatch({type: "setFetchState", fetchState: States.loading});
        try {
            const bannedMembers = await bannedMembersManagerRef.current.fetchNext();
            if (fetchId !== fetchNextIdRef.current) {
                return;
            }
            if (bannedMembers.length !== 0) {
                dispatch({type: "appendBannedMembers", bannedMembers});
            }
            dispatch({type: "setFetchState", fetchState: States.loaded});
        }
        catch(error) {
            if (fetchId === fetchNextIdRef.current) {
                dispatch({type: "setFetchState", fetchState: States.error});
                errorHandler(error);
            }
        }
    }, [errorHandler, dispatch]);

    /**
     * Calls `unbanGroupMember` SDK function & updates the `bannedMembers` state
     */
    const unbanMember = useCallback(async (bannedMember : CometChat.GroupMember) : Promise<void> => {
        try {
            await CometChat.unbanGroupMember(groupPropRef.current.getGuid(), bannedMember.getUid());
            dispatch({type: "removeBannedMemberIfPresent", bannedMemberUid: bannedMember.getUid()});
        }
        catch(error) {
            errorHandler(error);
        }
    }, [dispatch, errorHandler, groupPropRef]);

    /**
     * Creates back button view
     */
    function getBackBtnView() : JSX.Element | null {
        if (!showBackButton) {
            return null;
        }
        return (
            <CometChatButton 
                iconURL = {backButtonIconURL}
                buttonStyle = {defaultBackBtnStyle(bannedMemberStyleObject, theme)}
                onClick = {onBack}
            />
        );
    }

    /**
     * Creates menus view
     */
    function getMenusView() : JSX.Element | null {
        if (menus === null) {
            return null;
        }
        return (
            <div
                className = "cc-banned-members__menus"
                style = {menusContainerStyle()}
            >
                {menus}
            </div>
        );
    }

    /**
     * Get the status indicator color to use for the default list item view
     * 
     * @remarks
     * If the intention is not to show the status indicator, `null` should be returned
     */
    function getStatusIndicatorColor(bannedMember : CometChat.GroupMember) : string | null {
        if (disableUsersPresence || bannedMember.getStatus() === CometChatUIKitConstants.userStatusType.offline) {
            return null;
        }
        return bannedMemberStyleObject?.onlineStatusColor || theme.palette.getSuccess() || "rgb(0, 200, 111)";
    }

    /**
     * Creates menu view for the default list item view
     */
    function getDefaultListItemMenuView(bannedMember : CometChat.GroupMember) : JSX.Element | null {
        const bannedMemberOptions = options?.(bannedMember);
        if (!bannedMemberOptions?.length) {
            return null;
        }
        return (
            <CometChatMenuList 
                data = {bannedMemberOptions}
                menuListStyle = {menuListStyle(theme)}
                onOptionClick = {e => {
                    const { onClick } = e.detail.data;
                    onClick?.();
                }}
            />
        );
    }

    /**
     * Creates tail view for the default list item view
     */
    function getDefaultListTailView(bannedMember : CometChat.GroupMember) : JSX.Element | null {
        switch(selectionMode) {
            case SelectionMode.none: 
                return (
                    <CometChatButton 
                        iconURL = {unbanIconURL}
                        onClick = {() => unbanMember(bannedMember)}
                        buttonStyle = {unbanBtnStyle(bannedMemberStyleObject, theme)}
                    />
                );
            case SelectionMode.single:
                return (
                    <CometChatRadioButton 
                        onChange = {e => onSelect?.(bannedMember)}
                    />
                );
            case SelectionMode.multiple: 
                return (
                    <CometChatCheckbox 
                        onChange = {e => onSelect?.(bannedMember)}
                    />
                );
            default: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const x = selectionMode;
                return null;
            }
        }
    }

    /**
     * Creates default list item view
     */
    function getDefaultListItemView() : (bannedMember : CometChat.GroupMember) => JSX.Element {
        return function(bannedMember : CometChat.GroupMember) {
            return (
                <CometChatListItem 
                    id = {bannedMember.getUid()}
                    title = {bannedMember.getName()}
                    avatarURL = {bannedMember.getAvatar()}
                    avatarName = {bannedMember.getName()}
                    statusIndicatorColor = {getStatusIndicatorColor(bannedMember)}
                    hideSeparator = {hideSeparator}
                    statusIndicatorStyle = {statusIndicatorStyle(statusIndicatorStyleObject)}
                    avatarStyle = {avatarStyle(avatarStyleObject, theme)}
                    listItemStyle = {listItemStyle(listItemStyleObject, bannedMemberStyleObject, theme)}
                    subtitleView = {subtitleView?.(bannedMember)}
                    subtitleViewClassName = "cc-banned-members__subtitle-view"
                    menuView = {getDefaultListItemMenuView(bannedMember)}
                    menuViewClassName = "cc-banned-members__options-view"
                    tailView = {getDefaultListTailView(bannedMember)}
                    tailViewClassName = "cc-banned-members__tail-view"
                    onClick = {e => onItemClick?.(bannedMember)}
                />
            );
        };
    }

    /**
     * Creates close button view
     */
    function getCloseBtnView() : JSX.Element {
        return (
            <CometChatButton 
                iconURL = {closeButtonIconURL}
                buttonStyle = {closeBtnStyle(bannedMemberStyleObject, theme)}
                onClick = {onClose}
            />
        );
    }

    /**
     * Creates `listItem` prop for the `CometChatList` component
     */
    function getListItem() : (bannedMember : CometChat.GroupMember) => JSX.Element {
        return listItemView || getDefaultListItemView();
    }

    Hooks({
        groupGuid: group.getGuid(), // This is important
        searchText: state.searchText,
        bannedMembersRequestBuilder,
        searchRequestBuilder,
        bannedMembersManagerRef,
        dispatch,
        fetchNextAndAppendBannedMembers,
        fetchNextIdRef,
        groupPropRef
    });

    return (
        <div
            className = "cc-banned-members"
            style = {bannedMembersWrapperStyle(bannedMemberStyleObject, theme)}
        >
            {getBackBtnView()}
            {getCloseBtnView()}
            {getMenusView()}
            <CometChatList
                title = {title}
                titleAlignment = {titleAlignment}
                searchPlaceholderText = {searchPlaceholder}
                searchIconURL = {searchIconURL}
                searchText = {state.searchText}
                onSearch = {onSearchTextChange}
                hideSearch = {hideSearch}
                list = {state.bannedMembers}
                listItemKey = "getUid"
                listItem = {getListItem()}
                showSectionHeader = {false}
                onScrolledToBottom = {() => fetchNextAndAppendBannedMembers(fetchNextIdRef.current = "onScrolledToBottom_" + String(Date.now()))}
                state = {state.fetchState === States.loaded && state.bannedMembers.length === 0 ? States.empty : state.fetchState}
                loadingIconURL = {loadingIconURL}
                emptyStateText = {emptyStateText}
                errorStateText = {errorStateText}
                loadingView = {loadingStateView}
                emptyStateView = {emptyStateView}
                errorStateView = {errorStateView}
                hideError = {hideError}
                listStyle = {listStyle(bannedMemberStyleObject, theme)}
            />
        </div>
    );
}
