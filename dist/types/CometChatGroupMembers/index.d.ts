import { AvatarStyle, ChangeScopeStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties, JSX } from "react";
import { CometChatOption, SelectionMode, States, TitleAlignment, UserPresencePlacement } from "@cometchat/uikit-resources";
import { GroupMembersStyle } from "@cometchat/uikit-shared";
import { GroupMembersManager } from "./controller";
interface IGroupMembersProps {
    /**
     * Image URL for the back button
     *
     * @defaultValue `./assets/backbutton.svg`
     */
    backButtonIconURL?: string;
    /**
     * Show back button
     *
     * @defaultValue `true`
     */
    showBackButton?: boolean;
    /**
     * Function to call when the default back button is clicked
     */
    onBack?: () => void;
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("MEMBERS")`
     */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholder?: string;
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
     * Request builder to fetch group members
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    /**
     * Request builder with search parameters to fetch group members
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    /**
     * Group the fetched groupMembers belong to
     */
    group: CometChat.Group;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
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
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX.Element;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX.Element;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.8 due to newer property 'errorStateView'. It will be removed in subsequent versions.
     */
    errorSateView?: JSX.Element;
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
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `true`
     */
    hideSeparator?: boolean;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Custom subtitle view to be rendered for each group member in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    /**
     * Custom list item view to be rendered for each group member in the fetched list
     */
    listItemView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (group: CometChat.Group, groupMember: CometChat.GroupMember) => CometChatOption[];
    /**
     * Image URL for the change scope component's `arrowIconURL` prop
     *
     * @defaultValue `./assets/down-arrow.svg`
     */
    dropDownIconURL?: string;
    /**
     * View to be placed in the tail view
     *
     * @remarks
     * This prop will be used if `listItemView` is not provided
     */
    tailView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    /**
     * Selection mode to use for the default list item view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
    /**
     * Function to call on click of the default list item view of a group member
     */
    onItemClick?: (groupMember: CometChat.GroupMember) => void;
    /**
     * Function to call when a group member from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (groupMember: CometChat.GroupMember, selected: boolean) => void;
    /**
     * Image URL for the close button
     *
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL?: string;
    /**
     * Function to call when the close button is clicked
     */
    onClose?: () => void;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to the change scope component
     */
    groupScopeStyle?: ChangeScopeStyle;
    /**
     * Styles to apply to this component
     */
    groupMembersStyle?: GroupMembersStyle;
    /**
     * Search keyword to filter the list of users.
     *
     * @defaultValue `""`
     */
    searchKeyword?: string;
    /**
     * Callback function to be executed when the user list is empty.
     */
    onEmpty?: () => void;
    /**
     * Timeout reference for fetching users.
     */
    fetchTimeOut?: any;
    /**
     * Placement of user presence information within the user interface.
     * @defaultValue `bottom`
     */
    userPresencePlacement?: UserPresencePlacement;
    /**
     * Flag to indicate whether to disable loading state while fetching users.
     * @defaultValue `false`
     */
    disableLoadingState?: boolean;
}
export type Action = {
    type: "appendGroupMembers";
    groupMembers: CometChat.GroupMember[];
    groupMembersManager?: GroupMembersManager | null;
    onEmpty?: () => void;
} | {
    type: "setGroupMemberList";
    groupMemberList: CometChat.GroupMember[];
} | {
    type: "setSearchText";
    searchText: string;
} | {
    type: "setFetchState";
    fetchState: States;
} | {
    type: "removeGroupMemberIfPresent";
    groupMemberUid: string;
} | {
    type: "setGroupMemberToChangeScopeOf";
    groupMember: CometChat.GroupMember | null;
} | {
    type: "replaceGroupMemberIfPresent";
    updatedGroupMember: CometChat.GroupMember;
} | {
    type: "updateGroupMemberStatusIfPresent";
    user: CometChat.User;
} | {
    type: "updateGroupMemberScopeIfPresent";
    groupMemberUid: string;
    newScope: CometChat.GroupMemberScope;
} | {
    type: "appendGroupMember";
    groupMember: CometChat.GroupMember;
};
export declare function CometChatGroupMembers(props: IGroupMembersProps): import("react/jsx-runtime").JSX.Element;
export {};
