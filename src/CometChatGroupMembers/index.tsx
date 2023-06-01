import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, ChangeScopeStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties, useCallback, useContext, useReducer, useRef, JSX } from "react";
import { CometChatGroupEvents, CometChatOption, CometChatUIKitConstants, localize, SelectionMode, States, TitleAlignment } from "uikit-resources-lerna";
import { CometChatUIKitUtility, GroupMembersStyle, GroupMemberUtils } from "uikit-utils-lerna";
import BackButtonIcon from "./assets/backbutton.svg";
import Close2xIcon from "./assets/close2x.svg";
import DownArrowIcon from "./assets/down-arrow.svg";
import SpinnerIcon from "./assets/spinner.svg";
import MoreIcon from "./assets/more-icon.svg";
import SearchIcon from "./assets/search.svg";
import { CometChatContext } from "../CometChatContext";
import { CometChatList } from "../Shared/Views/CometChatList";
import { GroupMembersManager } from "./controller";
import { Hooks } from "./hooks";
import { avatarStyle, backBtnContainerStyle, closeBtnStyle, defaultBackBtnStyle, groupMembersWrapperStyle, groupScopeStyle, listItemStyle, listStyle, listWrapperStyle, menuListStyle, menusContainerStyle, modalStyle, scopeLabelStyle, statusIndicatorStyle, tailViewStyle } from "./style";
import { useCometChatErrorHandler, useRefSync, useStateRef } from "../CometChatCustomHooks";
import { CometChatListItem } from "../Shared/Views/CometChatListItem";
import { CometChatMenuList } from "../Shared/Views/CometChatMenuList";
import { CometChatButton } from "../Shared/Views/CometChatButton";
import { CometChatRadioButton } from "../Shared/Views/CometChatRadioButton";
import { CometChatCheckbox } from "../Shared/Views/CometChatCheckbox";

interface IGroupMembersProps {
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
     * Custom back button
     */
    backButton? : JSX.Element,
    /**
     * Show back button
     * 
     * @defaultValue `true`
     */
    showBackButton? : boolean,
    /**
     * Function to call when the default back button is clicked
     */
    onBack? : () => void,
    /**
     * Custom view to render on the top-right of the component
     */
    menus? : JSX.Element,
    /** 
     * Title of the component 
     * 
     * @defaultValue `localize("MEMBERS")` 
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
     * @defaulValue `false`
     */
    hideSearch? : boolean,
    /**
     * Request builder to fetch group members
     * 
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     * 
     * @defaultValue Default request builder having the limit set to 30
     */
    groupMemberRequestBuilder? : CometChat.GroupMembersRequestBuilder,
    /**
     * Request builder with search parameters to fetch group members
     * 
     * @remarks
     * If the search input is not empty, 
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder? : CometChat.GroupMembersRequestBuilder,
    /**
     * Group the fetched groupMembers belong to
     */
    group : CometChat.Group,
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Text to display in the default empty view
     * 
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText? : string,
    /**
     * Text to display in the default error view
     * 
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText? : string,
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
     * Custom view for the empty state of the component
     */
    emptyStateView? : JSX.Element,
    /**
     * Custom view for the error state of the component
     */
    errorSateView? : JSX.Element,
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
     * Hide the separator at the bottom of the default list item view
     * 
     * @defaultValue `true`
     */
    hideSeparator? : boolean,
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
     * Custom subtitle view to be rendered for each group member in the fetched list
     *   
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView? : (groupMember : CometChat.GroupMember) => JSX.Element,
    /**
     * Custom list item view to be rendered for each group member in the fetched list
     */
    listItemView? : (groupMember : CometChat.GroupMember) => JSX.Element,
    /** 
     * List of actions available on mouse over on the default list item component
     */
    options? : (group : CometChat.Group, groupMember : CometChat.GroupMember) => CometChatOption[],
    /**
     * Image URL for the change scope component's `arrowIconURL` prop
     * 
     * @defaultValue `./assets/down-arrow.svg`
     */
    dropDownIconURL? : string,
    /**
     * View to be placed in the tail view
     * 
     * @remarks
     * This prop will be used if `listItemView` is not provided
     */
    tailView? : (groupMember : CometChat.GroupMember) => JSX.Element,
    /**
     * Selection mode to use for the default list item view
     * 
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     * 
     * @defaultValue `SelectionMode.none`
     */
    selectionMode? : SelectionMode,
    /**
     * Function to call on click of the default list item view of a group member
     */
    onItemClick? : (groupMember : CometChat.GroupMember) => void,
    /**
     * Function to call when a group member from the fetched list is selected 
     *  
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect? : (groupMember : CometChat.GroupMember) => void,
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
     * Styles to apply to the avatar component of the default list item view 
     */
    avatarStyle? : AvatarStyle,
    /**
     * Styles to apply to the status indicator component of the default list item view 
     */
    statusIndicatorStyle? : CSSProperties,
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle? : ListItemStyle,
    /**
     * Styles to apply to the change scope component
     */
    groupScopeStyle? : ChangeScopeStyle,
    /**
     * Styles to apply to this component 
     */
    groupMembersStyle? : GroupMembersStyle
};

type State = {
    groupMemberList : CometChat.GroupMember[],
    fetchState : States,
    searchText : string,
    groupMemberToChangeScopeOf : CometChat.GroupMember | null
};

export type Action = {type : "appendGroupMembers", groupMembers : CometChat.GroupMember[]} |
                     {type : "setGroupMemberList", groupMemberList : CometChat.GroupMember[]} |
                     {type : "setSearchText", searchText : string} |
                     {type : "setFetchState", fetchState : States} |
                     {type : "removeGroupMemberIfPresent", groupMemberUid : string} |
                     {type : "setGroupMemberToChangeScopeOf", groupMember : CometChat.GroupMember | null} |
                     {type : "replaceGroupMemberIfPresent", updatedGroupMember : CometChat.GroupMember} |
                     {type : "updateGroupMemberStatusIfPresent", user : CometChat.User} |
                     {type : "updateGroupMemberScopeIfPresent", groupMemberUid : string, newScope : CometChat.GroupMemberScope} |
                     {type : "appendGroupMember", groupMember : CometChat.GroupMember};

function stateReducer(state : State, action : Action) : State {
    let newState = state;
    const { type } = action;
    switch(type) {
        case "appendGroupMembers": {
            const { groupMembers } = action;
            if (groupMembers.length !== 0) {
                newState = {...state, groupMemberList: [...state.groupMemberList, ...groupMembers]};
            }
            break;
        }
        case "setSearchText":
            newState = {...state, searchText: action.searchText};
            break;
        case "setFetchState": 
            newState = {...state, fetchState: action.fetchState};
            break;
        case "setGroupMemberList":
            newState = {...state, groupMemberList: action.groupMemberList};
            break;
        case "removeGroupMemberIfPresent": {
            const targetUid = action.groupMemberUid;
            const targetIdx = state.groupMemberList.findIndex(groupMember => groupMember.getUid() === targetUid);
            if (targetIdx > -1) {
                newState = {...state, groupMemberList: state.groupMemberList.filter((groupMember, i) => i !== targetIdx)};
            }
            break;
        }
        case "setGroupMemberToChangeScopeOf": 
            newState = {...state, groupMemberToChangeScopeOf: action.groupMember};
            break;
        case "replaceGroupMemberIfPresent": {
            const { updatedGroupMember } = action;
            const targetUid = updatedGroupMember.getUid();
            const targetIdx = state.groupMemberList.findIndex(groupMember => groupMember.getUid() === targetUid);
            if (targetIdx > -1) {
                newState = {...state, groupMemberList: state.groupMemberList.map((groupMember, i) => {
                    if (i !== targetIdx) {
                        return groupMember;
                    }

                    return updatedGroupMember;
                })}
            }
            break;
        }
        case "updateGroupMemberStatusIfPresent": {
            const { user } = action;
            const { groupMemberList } = state;
            const targetUid = user.getUid();
            const targetIdx = groupMemberList.findIndex(groupMember => groupMember.getUid() === targetUid);
            if (targetIdx > -1) {
                newState = {...state, groupMemberList: groupMemberList.map((groupMember, i) => {
                    if (i === targetIdx) {
                        groupMember.setStatus(user.getStatus());
                    }
                    return groupMember;
                })};
            }
            break;
        }
        case "updateGroupMemberScopeIfPresent": {
            const { groupMemberUid, newScope } = action;
            const { groupMemberList } = state;
            const targetIdx = groupMemberList.findIndex(groupMember => groupMember.getUid() === groupMemberUid);
            if (targetIdx > -1) {
                newState = {...state, groupMemberList: groupMemberList.map((groupMember, i) => {
                    if (i === targetIdx) {
                        groupMember.setScope(newScope);
                    }
                    return groupMember;
                })};
            }
            break;
        }
        case "appendGroupMember": {
            newState = {...state, groupMemberList: [...state.groupMemberList, action.groupMember]};
            break;
        }
        default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const x : never = type;
        }
    }
    return newState;
}

export function CometChatGroupMembers(props : IGroupMembersProps) {
    const {
        backButtonIconURL = BackButtonIcon,
        backButton = null,
        showBackButton = true,
        onBack,
        menus = null,
        title = localize("MEMBERS"),
        titleAlignment = TitleAlignment.center,
        searchPlaceholder = localize("SEARCH"),
        searchIconURL = SearchIcon,
        hideSearch = false,
        groupMemberRequestBuilder = null,
        searchRequestBuilder = null,
        group,
        onError,
        emptyStateText = localize("NO_USERS_FOUND"), // According to me, this is the most suitable
        errorStateText = localize("SOMETHING_WRONG"),
        loadingIconURL = SpinnerIcon,
        loadingStateView,
        errorSateView,
        emptyStateView,
        hideError = false,
        hideSeparator = true,
        disableUsersPresence = false,
        subtitleView = null,
        listItemView = null,
        options = null,
        dropDownIconURL = DownArrowIcon,
        tailView = null,
        selectionMode = SelectionMode.none,
        onItemClick = null,
        onSelect = null,
        closeButtonIconURL = Close2xIcon,
        onClose,
        avatarStyle : avatarStyleObject = null,
        statusIndicatorStyle : statusIndicatorStyleObject = null,
        listItemStyle : listItemStyleObject = null,
        groupScopeStyle : groupScopeStyleObject = null,
        groupMembersStyle : groupMemberStyleObject = null
    } = props;

    const [state, dispatch] = useReducer(stateReducer, {
        groupMemberList: [],
        fetchState: States.loading,
        searchText: "",
        groupMemberToChangeScopeOf: null
    });
    const groupMembersManagerRef = useRef<GroupMembersManager | null>(null);
    const loggedInUserRef = useRef<CometChat.User | null>(null);
    const fetchNextIdRef = useRef("");
    const [changeScopeElement, setChangeScopeRef] = useStateRef<JSX.IntrinsicElements["cometchat-change-scope"] | null>(null);
    const groupPropRef = useRefSync(group);
    const errorHandler = useCometChatErrorHandler(onError);
    const { theme } = useContext(CometChatContext);

    /**
     * Updates the `searchText` state
     */
    const onSearchTextChange = useCallback((searchText : string) : void => {
        dispatch({type: "setSearchText", searchText});
    }, [dispatch]);

    /**
     * Initiates a fetch request and appends the fetched group members to the `groupMemberList` state
     * 
     * @remarks
     * This function also updates the `fetchState` state
     * 
     * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `groupMemberList` state
     */
    const fetchNextAndAppendGroupMembers = useCallback(async (fetchId : string) : Promise<void> => {
        const groupMembersManager = groupMembersManagerRef.current;
        if (!groupMembersManager) {
            return;
        }
        dispatch({type: "setFetchState", fetchState: States.loading});
        try {
            const groupMembers = await groupMembersManager.fetchNext();
            if (fetchId !== fetchNextIdRef.current) {
                return;
            }
            if (groupMembers.length !== 0) {
                dispatch({type: "appendGroupMembers", groupMembers});   
            }
            dispatch({type: "setFetchState", fetchState: States.loaded});
        }
        catch(error) {
            dispatch({type: "setFetchState", fetchState: States.error});
            errorHandler(error);
        }
    }, [dispatch, errorHandler]);

    /**
     * Creates an action message
     */
    const createActionMessage = useCallback((actionOn : CometChat.GroupMember, action : string, group : CometChat.Group, loggedInUser : CometChat.User) : CometChat.Action => {
        const actionMessage = new CometChat.Action(
            group.getGuid(), 
            CometChatUIKitConstants.MessageTypes.groupMember,
            CometChatUIKitConstants.MessageReceiverType.group,
            CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
        );
        actionMessage.setAction(action);
        actionMessage.setActionBy(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setSender(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setMessage(`${loggedInUser.getUid()} ${action} ${actionOn.getUid()}`);
        actionMessage.setActionFor(CometChatUIKitUtility.clone(group));
        actionMessage.setActionOn(CometChatUIKitUtility.clone(actionOn));
        actionMessage.setReceiver(CometChatUIKitUtility.clone(group));
        actionMessage.setConversationId("group_" + group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        actionMessage.setReceiverType(CometChatUIKitConstants.MessageReceiverType.group);
        actionMessage.setRawData({
            extras: {
                scope: {
                    new: actionOn.getScope()
                }
            }
        });
        return actionMessage;
    }, []);

    /**
     * Bans the provided `groupMember`
     */
    const banGroupMember = async (groupMember : CometChat.GroupMember) : Promise<void> => {
        const loggedInUser = loggedInUserRef.current;
        if (!loggedInUser) {
            return;
        }
        try {
            const currentGroup = groupPropRef.current;
            await CometChat.banGroupMember(currentGroup.getGuid(), groupMember.getUid());
            dispatch({type: "removeGroupMemberIfPresent", groupMemberUid: groupMember.getUid()});
            const groupClone = CometChatUIKitUtility.clone(currentGroup);
            groupClone.setMembersCount(groupClone.getMembersCount() - 1);
            CometChatGroupEvents.ccGroupMemberBanned.next({
                kickedBy: CometChatUIKitUtility.clone(loggedInUser),
                kickedFrom: groupClone,
                kickedUser: CometChatUIKitUtility.clone(groupMember),
                message: createActionMessage(groupMember, CometChatUIKitConstants.groupMemberAction.BANNED, groupClone, loggedInUser)
            });
        }
        catch(error) {
            errorHandler(error);
        }
    };

    /**
     * Kicks the provided `groupMember`
     */
    const kickGroupMember = async (groupMember : CometChat.GroupMember) : Promise<void> => {
        const loggedInUser = loggedInUserRef.current;
        if (!loggedInUser) {
            return;
        }
        try {
            const currentGroup = groupPropRef.current;
            await CometChat.kickGroupMember(currentGroup.getGuid(), groupMember.getUid());
            dispatch({type: "removeGroupMemberIfPresent", groupMemberUid: groupMember.getUid()});
            const groupClone = CometChatUIKitUtility.clone(currentGroup);
            groupClone.setMembersCount(groupClone.getMembersCount() - 1);
            CometChatGroupEvents.ccGroupMemberKicked.next({
                kickedBy: CometChatUIKitUtility.clone(loggedInUser),
                kickedFrom: CometChatUIKitUtility.clone(groupClone),
                kickedUser: CometChatUIKitUtility.clone(groupMember),
                message: createActionMessage(groupMember, CometChatUIKitConstants.groupMemberAction.KICKED, groupClone, loggedInUser)
            });
        }
        catch(error) {
            errorHandler(error);
        }
    };

    const { groupMemberToChangeScopeOf : groupMember } = state;

    /**
     * Updates the scope of the provided `groupMember`
     */
    const updateGroupMemberScope = useCallback(async (newScope : string) : Promise<void> => {
        const loggedInUser = loggedInUserRef.current;
        if (!groupMember || !loggedInUser) {
            return;
        }
        try {
            const newScopeCasted = newScope as CometChat.GroupMemberScope;
            const currentGroup = groupPropRef.current;
            await CometChat.updateGroupMemberScope(currentGroup.getGuid(), groupMember.getUid(), newScopeCasted);
            const updatedGroupMember = CometChatUIKitUtility.clone(groupMember);
            updatedGroupMember.setScope(newScopeCasted);
            dispatch({type: "replaceGroupMemberIfPresent", updatedGroupMember});
            CometChatGroupEvents.ccGroupMemberScopeChanged.next({
                scopeChangedFrom: groupMember.getScope(),
                scopeChangedTo: updatedGroupMember.getScope(),
                message: createActionMessage(updatedGroupMember, CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE, currentGroup, loggedInUser),
                group: CometChatUIKitUtility.clone(currentGroup),
                updatedUser: CometChatUIKitUtility.clone(updatedGroupMember)
            });
        }
        catch(error) {
            errorHandler(error);
        }
        finally {
            dispatch({type: "setGroupMemberToChangeScopeOf", groupMember: null});
        }
    }, [errorHandler, dispatch, createActionMessage, groupMember, groupPropRef]);

    /**
     * Handles user created action on a groupMember from the fetched list
     */
    function handleActionOnGroupMember(action : string, groupMember : CometChat.GroupMember) : void | Promise<void> {
        if (action === CometChatUIKitConstants.GroupMemberOptions.ban) {
            return banGroupMember(groupMember);
        }
        if (action === CometChatUIKitConstants.GroupMemberOptions.kick) {
            return kickGroupMember(groupMember);
        }
        if (action === CometChatUIKitConstants.GroupMemberOptions.changeScope) {
            return dispatch({type: "setGroupMemberToChangeScopeOf", groupMember});
        }
    }

    /**
     * Creates the default back button
     */
    function getDefaultBackBtnView() : JSX.Element {
        return (
            <CometChatButton 
                iconURL = {backButtonIconURL}
                buttonStyle = {defaultBackBtnStyle(groupMemberStyleObject, theme)}
                onClick = {onBack}
            />
        );
    }

    /**
     * Creates the back button view of the component
     */
    function getBackBtnView() : JSX.Element | null {
        if (!showBackButton) {
            return null;
        }
        return (
            <div
                className = "cc-group-members__back-btns-wrapper"
                style = {backBtnContainerStyle()}
            >
                {backButton ?? getDefaultBackBtnView()}
            </div>
        );
    }

    /**
     * Creates menus to display at the top-right of this component
     */
    function getMenusView() : JSX.Element | null {
        if (menus === null) {
            return null;
        }
        return (
            <div
                className = "cc-group-members__menus"
                style = {menusContainerStyle()}
            >
                {menus}
            </div>
        );
    }

    /**
     * Creates the close button view of the component
     */
    function getCloseBtnView() : JSX.Element {
        return (
            <CometChatButton 
                iconURL = {closeButtonIconURL}
                buttonStyle = {closeBtnStyle(groupMemberStyleObject, theme)}
                onClick = {onClose}
            />
        );
    }

    /**
     * Creates the menu view of the default list item view
     */
    function getDefaultListItemMenuView(groupMember : CometChat.GroupMember) : JSX.Element | null {
        let groupMemberOptions : CometChatOption[] | undefined;
        if (tailView === null && (groupMemberOptions = options?.(group, groupMember))?.length) {
            return (
                <CometChatMenuList 
                    data = {groupMemberOptions}
                    menuListStyle = {menuListStyle(theme)}
                    onOptionClick = {e => {
                        const { id, onClick } = e.detail.data;
                        if (onClick) {
                            onClick();
                        }
                        else if (typeof id === "string"){
                            handleActionOnGroupMember(id, groupMember);
                        }
                    }}
                />
            );
        }
        return null;
    }

    /**
     * Creates selection input component based on `selectionMode`
     */
    function getSelectionInput(groupMember : CometChat.GroupMember) : JSX.Element | null {
        if (selectionMode === SelectionMode.single) {
            return (
                <CometChatRadioButton
                    onChange = {e => onSelect?.(groupMember)}
                />
            );
        }
        if (selectionMode === SelectionMode.multiple) {
            return (
                <CometChatCheckbox 
                    onChange = {e => onSelect?.(groupMember)}
                />
            );
        }
        return null;
    }

    /**
     * Creates options view of the default tail view
     * 
     * @param groupMemberOptions - Return value of `GroupMemberUtils.getViewMemberOptions` function
     */
    function getDefaultTailOptionsView(groupMemberOptions : string | CometChatOption[], groupMember : CometChat.GroupMember) : JSX.Element {
        if (typeof groupMemberOptions === "string") {
            return (
                <cometchat-label
                    text = {groupMemberOptions}
                    labelStyle = {JSON.stringify(scopeLabelStyle(groupMemberStyleObject, theme))}
                />
            );
        }
        return (
            <CometChatMenuList 
                topMenuSize = {0}
                data = {groupMemberOptions}
                moreIconURL = {MoreIcon}
                menuListStyle = {menuListStyle(theme)}
                onOptionClick = {e => {
                    const { id } = e.detail.data;
                    if (typeof id === "string") {
                        handleActionOnGroupMember(id, groupMember);
                    }
                }}
            />
        );
    }

    /**
     * Creates the default tail view
     */
    function getDefaultTailView(groupMember : CometChat.GroupMember) : JSX.Element | null {
        if (tailView !== null) {
            return null;
        }
        return (
            <div
                className = "cc-group-members__tail-view-content"
            >
                {getDefaultTailOptionsView(GroupMemberUtils.getViewMemberOptions(groupMember, group, loggedInUserRef.current?.getUid(), theme), groupMember)}
            </div>
        );
    }

    /**
     * Creates the tail view for the default list item view
     */
    function getDefaultListItemTailView(groupMember : CometChat.GroupMember) : JSX.Element {     
        return (
            <div
                style = {tailViewStyle()}
            >
                {tailView?.(groupMember)}
                {getSelectionInput(groupMember)}
                {getDefaultTailView(groupMember)}
            </div>
        );
    }

    /**
     * Get the status indicator color to use for the default list item view
     * 
     * @remarks
     * If the intention is not to show the status indicator, `null` should be returned
     */
    function getStatusIndicatorColor(groupMember : CometChat.GroupMember) : string | null {
        if (disableUsersPresence || groupMember.getStatus() === CometChatUIKitConstants.userStatusType.offline) {
            return null;
        }
        return groupMemberStyleObject?.onlineStatusColor || theme.palette.getSuccess() || null;
    }

    /**
     * Creates the default list item view
     */
    function getDefaultListItemView(groupMember : CometChat.GroupMember) : JSX.Element {
        return (
            <CometChatListItem 
                id = {groupMember.getUid()}
                title = {groupMember.getName()}
                avatarURL = {groupMember.getAvatar()}
                avatarName = {groupMember.getName()}
                hideSeparator = {hideSeparator}
                isActive = {state.groupMemberToChangeScopeOf?.getUid() === groupMember.getUid()}
                avatarStyle = {avatarStyle(avatarStyleObject, theme)}
                statusIndicatorColor = {getStatusIndicatorColor(groupMember)}
                statusIndicatorStyle = {statusIndicatorStyle(statusIndicatorStyleObject)}
                listItemStyle = {listItemStyle(listItemStyleObject, groupMemberStyleObject, theme)}
                subtitleViewClassName = "cc-group-members__subtitle-view"
                subtitleView = {subtitleView?.(groupMember)}
                tailViewClassName = "cc-group-members__tail-view"
                tailView = {getDefaultListItemTailView(groupMember)}
                menuViewClassName = "cc-group-members__options-view"
                menuView = {getDefaultListItemMenuView(groupMember)}
                onClick = {e => onItemClick?.(groupMember)}
            />
        );
    }

    /**
     * Gets the list item view of the component
     */
    function getListItem() : (groupMember : CometChat.GroupMember) => JSX.Element {
        return listItemView !== null ? listItemView : getDefaultListItemView;
    }

    /**
     * Creates the group member scope change modal view
     */
    function getGroupMemberScopeChangeModal() : JSX.Element | null {
        let groupMemberAllowedScopes : string[];
        const { groupMemberToChangeScopeOf } = state;
        if (
            groupMemberToChangeScopeOf !== null && 
            (groupMemberAllowedScopes = (GroupMemberUtils.allowScopeChange(group, groupMemberToChangeScopeOf))).length > 0
        ) {
            return (
                <cometchat-modal
                    modalStyle = {JSON.stringify(modalStyle(groupScopeStyleObject, theme))}
                >
                    <cometchat-change-scope
                        ref = {setChangeScopeRef} 
                        options = {JSON.stringify(groupMemberAllowedScopes)}
                        arrowIconURL = {dropDownIconURL}
                        changeScopeStyle = {JSON.stringify(groupScopeStyle(groupScopeStyleObject, theme))}
                    />
                </cometchat-modal>
            );
        }
        return null;
    }

    Hooks({
        groupMemberRequestBuilder,
        searchRequestBuilder,
        searchText: state.searchText,
        groupMembersManagerRef,
        groupGuid: group.getGuid(),
        fetchNextAndAppendGroupMembers,
        fetchNextIdRef,
        dispatch,
        loggedInUserRef,
        errorHandler,
        changeScopeElement,
        updateGroupMemberScope
    });

    return (
        <div
            className = "cc-group-members"
            style = {groupMembersWrapperStyle(groupMemberStyleObject, theme)}
        >
            <div 
                className = "cc-group-members__list-wrapper"
                style = {listWrapperStyle()}
            >
                {getMenusView()}
                <CometChatList
                    title = {title}
                    titleAlignment = {titleAlignment}
                    searchPlaceholderText = {searchPlaceholder}
                    searchIconURL = {searchIconURL}
                    searchText = {state.searchText}
                    onSearch = {onSearchTextChange}
                    hideSearch = {hideSearch}
                    list = {state.groupMemberList}
                    listItemKey = "getUid"
                    listItem = {getListItem()}
                    showSectionHeader = {false}
                    onScrolledToBottom = {() => fetchNextAndAppendGroupMembers(fetchNextIdRef.current = "onScrolledToBottom_" + String(Date.now()))}
                    state = {state.fetchState === States.loaded && state.groupMemberList.length === 0 ? States.empty : state.fetchState}
                    loadingIconURL = {loadingIconURL}
                    emptyStateText = {emptyStateText}
                    errorStateText = {errorStateText}
                    loadingView = {loadingStateView}
                    emptyStateView = {emptyStateView}
                    errorStateView = {errorSateView}
                    hideError = {hideError}
                    listStyle = {listStyle(groupMemberStyleObject, theme)}
                />
            </div>
            {getBackBtnView()}
            {getCloseBtnView()}
            {getGroupMemberScopeChangeModal()}
        </div>
    );
}
