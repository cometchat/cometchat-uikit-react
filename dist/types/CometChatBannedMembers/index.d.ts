import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties, JSX } from "react";
import { CometChatOption, SelectionMode, States, TitleAlignment } from "@cometchat/uikit-resources";
import { BannedMembersStyle } from "@cometchat/uikit-shared";
interface IBannedMembersProps {
    /**
     * Image URL for the back button
     *
     * @remarks
     * This prop will also be used if `backButton` prop is not provided
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
     * Function to call when the back button is clicked
     */
    onBack?: () => void;
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("BANNED_MEMBERS")`
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
     * @defaulValue `true`
     */
    hideSearch?: boolean;
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
     * @defaultValue `localize("")`
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
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Group to ban members from
     */
    group: CometChat.Group;
    /**
     * Request builder to fetch banned members
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    bannedMembersRequestBuilder?: CometChat.BannedMembersRequestBuilder;
    /**
     * Request builder with search parameters to fetch banned members
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.BannedMembersRequestBuilder;
    /**
     * Custom list item view to be rendered for each banned member in the fetched list
     */
    listItemView?: (bannedMember: CometChat.GroupMember) => JSX.Element;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `true`
     */
    disableUsersPresence?: boolean;
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
     * Custom subtitle view to be rendered for each banned member in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (bannedMember: CometChat.GroupMember) => JSX.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (bannedMember: CometChat.GroupMember) => CometChatOption[];
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
     *
     */
    unbanIconURL?: string;
    /**
     * Function to call on click of the default list item view of a banned member
     */
    onItemClick?: (bannedMember: CometChat.GroupMember) => void;
    /**
     * Function to call when a banned member from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (bannedMember: CometChat.GroupMember, selected: boolean) => void;
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
    bannedMemberStyle?: BannedMembersStyle;
}
export type Action = {
    type: "setSearchText";
    searchText: string;
} | {
    type: "setFetchState";
    fetchState: States;
} | {
    type: "appendBannedMembers";
    bannedMembers: CometChat.GroupMember[];
} | {
    type: "setBannedMembers";
    bannedMembers: [];
} | {
    type: "removeBannedMemberIfPresent";
    bannedMemberUid: string;
} | {
    type: "addMember";
    member: CometChat.GroupMember;
} | {
    type: "updateMemberStatusIfPresent";
    member: CometChat.User;
};
/**
 * Renders a scrollable list of banned members related to a group of a CometChat App
 */
export declare function CometChatBannedMembers(props: IBannedMembersProps): import("react/jsx-runtime").JSX.Element;
export {};
