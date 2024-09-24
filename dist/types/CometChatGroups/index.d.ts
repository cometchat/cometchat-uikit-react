import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties, JSX } from "react";
import { CometChatOption, SelectionMode, States, TitleAlignment } from "@cometchat/uikit-resources";
import { GroupsStyle } from "@cometchat/uikit-shared";
interface IGroupsProps {
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("GROUPS")`
    */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholderText?: string;
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Request builder to fetch groups
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
    /**
     * Request builder with search parameters to fetch groups
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.GroupsRequestBuilder;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Custom list item view to be rendered for each group in the fetched list
     */
    listItemView?: (group: CometChat.Group) => JSX.Element;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Custom subtitle view to be rendered for each group in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (group: CometChat.Group) => JSX.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (group: CometChat.Group) => CometChatOption[];
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
    /**
     * Function to call when a group from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (group: CometChat.Group, selected: boolean) => void;
    /**
     * Function to call on click of the default list item view of a group
     */
    onItemClick?: (group: CometChat.Group) => void;
    /**
     * Group to highlight
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeGroup?: CometChat.Group;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_GROUPS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX.Element;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Image URL for the status indicator icon in the default list item view of a password-protected group
     *
     * @defaultValue `./assets/locked.svg`
     */
    passwordGroupIcon?: string;
    /**
     * Image URL for the status indicator icon in the default list item view of a private group
     *
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon?: string;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to this component
     */
    groupsStyle?: GroupsStyle;
}
export type Action = {
    type: "appendGroups";
    groups: CometChat.Group[];
    removeOldGroups?: boolean;
} | {
    type: "setGroupList";
    groupList: CometChat.Group[];
} | {
    type: "setFetchState";
    fetchState: States;
} | {
    type: "updateGroup";
    group: CometChat.Group;
} | {
    type: "updateGroupForSDKEvents";
    group: CometChat.Group;
    newScope?: CometChat.GroupMemberScope;
    newCount?: number;
    hasJoined?: boolean;
    addGroup?: boolean;
} | {
    type: "removeGroup";
    guid: string;
} | {
    type: "prependGroup";
    group: CometChat.Group;
} | {
    type: "setSearchText";
    searchText: string;
} | {
    type: "setIsFirstReload";
    isFirstReload: boolean;
};
/**
 * Renders a scrollable list of groups that has been created in a CometChat app
 */
export declare function CometChatGroups(props: IGroupsProps): import("react/jsx-runtime").JSX.Element;
export {};
