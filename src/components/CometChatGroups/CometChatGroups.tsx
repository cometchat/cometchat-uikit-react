import { JSX, useCallback, useReducer, useRef } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatCheckbox } from "../BaseComponents/CometChatCheckbox/CometChatCheckbox";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatRadioButton } from "../BaseComponents/CometChatRadioButton/CometChatRadioButton";
import { GroupsManager } from "./controller";
import { useCometChatGroups } from "./useCometChatGroups";
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";
import { SelectionMode, States } from "../../Enums/Enums";
import { CometChatOption } from "../../modals";
import {getLocalizedString} from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatContextMenu } from "../BaseComponents/CometChatContextMenu/CometChatContextMenu";
import emptyIcon from "../../assets/groups_empty_state.svg";
import emptyIconDark from "../../assets/groups_empty_state_dark.svg";
import errorIcon from "../../assets/list_error_state_icon.svg"
import errorIconDark from "../../assets/list_error_state_icon_dark.svg"
import { getThemeMode } from "../../utils/util";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
interface GroupsProps {
    /**
     * Hides the default search bar.
     *
     * @defaultValue `false`
     */
    hideSearch?: boolean;
  
    /**
     * Hides the default and custom error view passed in `errorView` prop.
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
  
    /**
     * Hides the group type icon.
     *
     * @defaultValue `false`
     */
    hideGroupType?: boolean;
  
    /**
     * The group to highlight in the list.
     */
    activeGroup?: CometChat.Group;
  
    /**
     * A request builder for fetching groups.
     *
     * @defaultValue Default request builder having the limit set to `30`.
     */
    groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
  
    /**
     * A request builder configured with search parameters to fetch groups.
     *
     * @remarks If the search input is not empty, the search keyword of this request builder is set to the text in the search input.
     */
    searchRequestBuilder?: CometChat.GroupsRequestBuilder;
  
    /**
     * A function that returns a list of actions available when hovering over a group item.
     * @param group - An instance of `CometChat.Group` representing the group.
     * @returns An array of `CometChatOption` objects.
     */
    options?: (group: CometChat.Group) => CometChatOption[];
  
    /**
     * Selection mode to use for the default trailing view.
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
  
    /**
     * Callback function invoked when an error occurs in the component.
     * @param error - An instance of `CometChat.CometChatException` representing the error that occurred.
     * @returns void
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
  
    /**
     * Callback function invoked when a group is selected.
     *
     * @remarks This prop works only if `selectionMode` is not set to `SelectionMode.none`.
     * @param group - An instance of `CometChat.Group` representing the selected group.
     * @param selected - A boolean indicating whether the group is selected.
     * @returns void
     */
    onSelect?: (group: CometChat.Group, selected: boolean) => void;
  
    /**
     * Callback function invoked when a group item is clicked.
     *
     * @param group - An instance of `CometChat.Group` representing the clicked group.
     * @returns void
     */
    onItemClick?: (group: CometChat.Group) => void;
  
    /**
     * A custom component to render in the top-right corner of the groups list.
     */
    headerView?: JSX.Element;
  
    /**
     * A custom view to display during the loading state.
     */
    loadingView?: JSX.Element;
  
    /**
     * Custom view for the empty state of the component.
     */
    emptyView?: JSX.Element;
  
    /**
     * A custom view to display when an error occurs.
     */
    errorView?: JSX.Element;
  
    /**
     * A custom view to render for each group in the fetched list.
     *
     * @param group - An instance of `CometChat.Group` representing the group.
     * @returns A JSX element to be rendered as the group item.
     */
    itemView?: (group: CometChat.Group) => JSX.Element;
  
    /**
     * A function that renders a JSX element to display the leading view.
     *
     * @param group - An instance of `CometChat.Group` representing the group.
     * @returns A JSX element to be rendered as the leading view.
     */
    leadingView?: (group: CometChat.Group) => JSX.Element;
  
    /**
     * A function that renders a JSX element to display the title view.
     *
     * @param group - An instance of `CometChat.Group` representing the group.
     * @returns A JSX element to be rendered as the title view.
     */
    titleView?: (group: CometChat.Group) => JSX.Element;
  
    /**
     * Custom subtitle view to be rendered for each group in the fetched list.
     *
     * @param group - An instance of `CometChat.Group` representing the group.
     * @returns A JSX element to be rendered as the subtitle view.
     */
    subtitleView?: (group: CometChat.Group) => JSX.Element;
  
    /**
     * A function that renders a JSX element to display the trailing view.
     *
     * @param group - An instance of `CometChat.Group` representing the group.
     * @returns A JSX element to be rendered as the trailing view.
     */
    trailingView?: (group: CometChat.Group) => JSX.Element;

    /**
    * Controls the visibility of the scrollbar in the list.
    * @defaultValue `false`
    */
    showScrollbar?: boolean;
  };

type State = {
    searchText: string,
    groupList: CometChat.Group[],
    fetchState: States,
    isFirstReload: boolean
};

export type Action = { type: "appendGroups", groups: CometChat.Group[], removeOldGroups?: boolean } |
{ type: "setGroupList", groupList: CometChat.Group[] } |
{ type: "setFetchState", fetchState: States } |
{ type: "updateGroup", group: CometChat.Group } |
{ type: "updateGroupForSDKEvents", group: CometChat.Group, newScope?: CometChat.GroupMemberScope, newCount?: number, hasJoined?: boolean, addGroup?: boolean } |
{ type: "removeGroup", guid: string } |
{ type: "prependGroup", group: CometChat.Group } |
{ type: "setSearchText", searchText: string } |
{ type: "setIsFirstReload", isFirstReload: boolean };

var stateReducer = (state: State, action: Action): State => {
    let newState = state;
    const { type } = action;
    switch (type) {
        case "appendGroups":
            if (action.groups.length > 0) {
                let groups: CometChat.Group[] = [];
                if (action.removeOldGroups) {
                    state.groupList = [];
                    groups = action.groups;
                } else {
                    groups = [...state.groupList, ...action.groups];
                }
                const uniqueGroups = Array.from(new Map(groups.map(group => [group.getGuid(), group])).values());
                newState = { ...state, groupList: uniqueGroups };
            } else {
                newState = { ...state, groupList: Array.from(new Map([...state.groupList, ...action.groups].map(group => [group.getGuid(), group])).values()) };
            }
            break;
        case "setGroupList":
            newState = { ...state, groupList: action.groupList };
            break;
        case "setFetchState":
            newState = { ...state, fetchState: action.fetchState };
            break;
        case "updateGroup": {
            const { groupList } = state;
            const { group: targetGroup } = action;
            const targetGuid = targetGroup.getGuid();
            const targetIdx = groupList.findIndex(group => group.getGuid() === targetGuid);
            if (targetIdx > -1) {
                newState = {
                    ...state, groupList: groupList.map((group, i) => {
                        return i === targetIdx ? targetGroup : group;
                    })
                };
            }
            break;
        }
        case "removeGroup": {
            const { groupList } = state;
            const targetGuid = action.guid;
            const targetIdx = groupList.findIndex(group => group.getGuid() === targetGuid);
            if (targetIdx > -1) {
                newState = { ...state, groupList: groupList.filter((group, i) => i !== targetIdx) };
            }
            break;
        }
        case "prependGroup":
            newState = { ...state, groupList: [action.group, ...state.groupList] };
            break;
        case "setSearchText":
            newState = { ...state, searchText: action.searchText };
            break;
        case "setIsFirstReload":
            newState = { ...state, isFirstReload: action.isFirstReload };
            break;
        case "updateGroupForSDKEvents": {
            const { groupList, searchText } = state;
            const { group, hasJoined, newScope, newCount, addGroup } = action;
            const targetGuid = group.getGuid();
            const targetIdx = groupList.findIndex(g => g.getGuid() === targetGuid);

            if (addGroup && searchText && searchText.length > 0) {
                return state;
            }
            if (targetIdx > -1) {
                const updatedGroup = groupList[targetIdx];

                if (hasJoined !== undefined) {
                    updatedGroup.setHasJoined(hasJoined);
                }
                if (newScope !== undefined) {
                    updatedGroup.setScope(newScope);
                }
                if (newCount !== undefined) {
                    updatedGroup.setMembersCount(newCount);
                }
                newState = {
                    ...state,
                    groupList: groupList.map((g, i) =>
                        i === targetIdx ? updatedGroup : g
                    )
                };
            }
            else if (addGroup) {
                if (hasJoined !== undefined) {
                    group.setHasJoined(hasJoined);
                }
                if (newScope !== undefined) {
                    group.setScope(newScope);
                }
                if (newCount !== undefined) {
                    group.setMembersCount(newCount);
                }
                newState = {
                    ...state,
                    groupList: [group, ...groupList]
                };
            }
            break;
        }
        default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const x: never = type;
        }
    }
    return newState;
}

/**
 * Renders a scrollable list of groups that has been created in a CometChat app
 */
export function CometChatGroups(props: GroupsProps) {
    const {
        headerView,
        hideSearch = false,
        groupsRequestBuilder = null,
        searchRequestBuilder = null,
        onError,
        itemView = null,
        subtitleView = null,
        options = null,
        selectionMode = SelectionMode.none,
        onSelect,
        onItemClick,
        activeGroup = null,
        loadingView,
        emptyView,
        errorView,
        hideError = false,
        hideGroupType = false,
        leadingView,
        titleView,
        trailingView,
        showScrollbar = false
    } = props;
    const titleRef = useRef<string>(getLocalizedString("group_title"));
    const searchPlaceholderTextRef = useRef<string>(getLocalizedString("group_seach_placeholder"));
    const [state, dispatch] = useReducer(stateReducer, {
        searchText: "",
        groupList: [],
        fetchState: States.loading,
        isFirstReload: false
    });
    const groupsManagerRef = useRef<GroupsManager | null>(null);
    const fetchNextIdRef = useRef("");
    const errorHandler = useCometChatErrorHandler(onError);
    const attachListenerOnFetch = useRef<boolean>(false);
    const isConnectionReestablished = useRef<boolean>(false);
    const groupsSearchText = useRef<string>("");



    (() => {
        if (state.searchText !== groupsSearchText.current && state.searchText.trim().length > 0 && state.searchText.trim().length == state.searchText.length) {
            groupsSearchText.current = state.searchText;
        }
        if (state.isFirstReload) {
            attachListenerOnFetch.current = true;
            state.isFirstReload = false;
        }
    })();

    /**
     * Updates the `searchText` state
     */
    const onSearch = useCallback((searchText: string): void => {
        try {
            const trimmedText = searchText.trim();
            if (searchText.length === 0 || trimmedText.length > 0) {
                groupsSearchText.current = ""
                dispatch({ type: "setSearchText", searchText: trimmedText });
            }
        } catch (error) {
            errorHandler(error, 'onSearch');
        }
    }, [dispatch]);

    /**
     * Initiates a fetch request and appends the fetched groups to the `groupList` state
     *
     * @remarks
     * This function also updates the `fetchState` state
     *
     * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `groupList` state
     */
    const fetchNextAndAppendGroups = useCallback(async (fetchId: string): Promise<void> => {
        const groupsManager = groupsManagerRef.current;
        if (!groupsManager) {
            return;
        }
        let initialState = isConnectionReestablished.current ? States.loaded : States.loading
        dispatch({ type: "setFetchState", fetchState: initialState });
        try {
            const groups = await groupsManager.fetchNext();
            if (fetchId !== fetchNextIdRef.current) {
                return;
            }
            if (groups.length !== 0) {
                let removeOldGroups = isConnectionReestablished.current ? true : false;
                dispatch({ type: "appendGroups", groups, removeOldGroups });
            }
            dispatch({ type: "setFetchState", fetchState: States.loaded });
            if (attachListenerOnFetch.current) {
                GroupsManager.attachConnestionListener(() => {
                    const requestBuilder = groupsRequestBuilder === null ? new CometChat.GroupsRequestBuilder().setLimit(30) : groupsRequestBuilder;
                    groupsManagerRef.current = new GroupsManager({ searchText: groupsSearchText.current, groupsRequestBuilder: requestBuilder, searchRequestBuilder, groupsSearchText });
                    isConnectionReestablished.current = true;
                });
                attachListenerOnFetch.current = false;

            }
            if (!isConnectionReestablished.current) {
                dispatch({ type: "setFetchState", fetchState: States.loaded });
            }
            else {
                isConnectionReestablished.current = false;
            }
        }
        catch (error: unknown) {
            if (fetchId === fetchNextIdRef.current && state.groupList?.length <= 0) {
                dispatch({ type: "setFetchState", fetchState: States.error });
            }
            errorHandler(error, 'fetchNextAndAppendGroups');
        }
    }, [errorHandler, dispatch]);


    /**
     * Creates a subtitle view for the default list item view
     */
    function getSubtitleView(group: CometChat.Group): JSX.Element {
        try {
            if (subtitleView !== null) {
                return subtitleView(group);
            }
            const membersCount = group.getMembersCount();
            return (
                <div
                    className="cometchat-groups__subtitle"
                >
                    {`${membersCount} ${membersCount > 1 ? getLocalizedString("group_members") : getLocalizedString("group_member")}`}
                </div>
            );
        } catch (error) {
            errorHandler(error, 'getSubtitleView');
            return (<></>);
        }
    }

    /**
     * Creates a menu view for the default list item view
     *
     * @remarks
     * This menu view is shown on mouse over the default list item view.
     * The visibility of view is handled by the default list item view
     */
    function getMenuView(group: CometChat.Group): JSX.Element | null {
        try {
            let curOptions: CometChatOption[] | undefined;
            if (!(curOptions = options?.(group))?.length) {
                return null;
            }
            return (
                <CometChatContextMenu
                    data={curOptions}
                    onOptionClicked={(e: CometChatOption) => e.onClick?.()}
                />
            );
        } catch (error) {
            errorHandler(error, 'getMenuView');
            return null;
        }
    }

    /**
     * Creates a tail view for the default list item view
     */
    function getTailView(group: CometChat.Group): JSX.Element | null | undefined {
        try {
            if (trailingView) {
                return trailingView(group)
            }
            switch (selectionMode) {
                case SelectionMode.none:
                    return null;
                case SelectionMode.single: {
                    return (
                        <CometChatRadioButton
                            name={CometChatUIKitConstants.radioNames.groups}
                            id={group.getGuid()}
                            onRadioButtonChanged={e => onSelect?.(group, e.checked)}
                        />
                    );
                }
                case SelectionMode.multiple: {
                    return (
                        <CometChatCheckbox
                            onCheckBoxValueChanged={e => onSelect?.(group, e.checked)}
                        />
                    );
                }
                default: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const x: never = selectionMode;
                }
            }
        } catch (error) {
            errorHandler(error, 'getTailView');
        }
    }

    /**
     * Creates `listItem` prop of the `CometChatList` component
     */
    function getListItem(): (group: CometChat.Group) => JSX.Element {
        if (itemView !== null) {
            return itemView;
        }
        return function (group: CometChat.Group) {
            try {
                const groupType = group.getType()
                const isActive = activeGroup?.getGuid() === group.getGuid();
                return (
                    <div className={`cometchat-groups__list-item ${hideGroupType ? "" : `cometchat-groups__list-item-${groupType}`}
                ${isActive ? `cometchat-groups__list-item-active` : ""}
                `}>
                        <CometChatListItem
                            id={group.getGuid()}
                            avatarURL={group.getIcon()}
                            avatarName={group.getName()}
                            title={group.getName()}
                            titleView={titleView?.(group)}
                            leadingView={leadingView?.(group)}
                            subtitleView={getSubtitleView(group)}
                            menuView={getMenuView(group)}
                            trailingView={getTailView(group)}
                            onListItemClicked={e => onItemClick?.(group)}
                        />
                    </div>
                );
            } catch (error) {
                errorHandler(error, 'getListItem');
                return (<></>)
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
            return <div className="cometchat-groups__shimmer">
                {[...Array(15)].map((_, index) => (
                    <div key={index} className="cometchat-groups__shimmer-item">
                        <div className="cometchat-groups__shimmer-item-avatar"></div>
                        <div className="cometchat-groups__shimmer-item-body">
                            <div className="cometchat-groups__shimmer-item-body-title"></div>
                            <div className="cometchat-groups__shimmer-item-body-subtitle"></div>
                        </div>
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
                <div className="cometchat-groups__empty-state-view">
                    <div className="cometchat-groups__empty-state-view-icon">
                        <img src={isDarkMode ? emptyIconDark : emptyIcon} alt="" />
                    </div>
                    <div className="cometchat-groups__empty-state-view-body">
                        <div className="cometchat-groups__empty-state-view-body-title">{getLocalizedString("group_empty_title")}</div>
                        <div className="cometchat-groups__empty-state-view-body-description">{getLocalizedString("group_empty_subtitle")}</div>
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
                <div className="cometchat-groups__error-state-view">
                    <div className="cometchat-groups__error-state-view-icon">
                        <img src={isDarkMode ? errorIconDark : errorIcon} alt="" />
                    </div>
                    <div className="cometchat-groups__error-state-view-body">
                        <div className="cometchat-groups__error-state-view-body-title">{getLocalizedString("group_error_title")}</div>
                        <div className="cometchat-groups__error-state-view-body-description">{getLocalizedString("group_error_subtitle")}
                        </div>
                    </div>
                </div>
            )
        } catch (error) {
            errorHandler(error, 'getErrorView');
        }
    }


    useCometChatGroups({
        searchText: state.searchText,
        groupsRequestBuilder,
        searchRequestBuilder,
        fetchNextIdRef,
        groupsManagerRef,
        dispatch,
        fetchNextAndAppendGroups,
        groupsSearchText,
        errorHandler,
    });
    return (
        <div className="cometchat" style={{ width: "100%", height: "100%" }}>
            <div
                className={`cometchat-groups ${!showScrollbar ? "cometchat-groups-hide-scrollbar" : ""}`}>
                <CometChatList
                    showScrollbar={showScrollbar}
                    title={titleRef.current}
                    searchPlaceholderText={searchPlaceholderTextRef.current || getLocalizedString("group_search_placeholder")}
                    hideSearch={hideSearch}
                    searchText={state.searchText}
                    onSearch={onSearch}
                    list={state.groupList}
                    itemView={getListItem()}
                    onScrolledToBottom={() => fetchNextAndAppendGroups(fetchNextIdRef.current = "onScrolledToBottom_" + String(Date.now()))}
                    listItemKey="getGuid"
                    showSectionHeader={false}
                    state={state.fetchState === States.loaded && state.groupList.length === 0 ? States.empty : state.fetchState}
                    loadingView={getLoadingView()}
                    emptyView={getEmptyView()}
                    errorView={getErrorView()}
                    hideError={hideError}
                    headerView={headerView}
                    />
            </div>
        </div>
    );
}
