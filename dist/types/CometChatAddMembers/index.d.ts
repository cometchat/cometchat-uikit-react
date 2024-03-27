import { AddMembersStyle } from "@cometchat/uikit-shared";
import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties, JSX } from "react";
import { CometChatOption, SelectionMode, TitleAlignment } from "@cometchat/uikit-resources";
interface IAddMembersProps {
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
     * Title of the component
     *
     * @defaultValue `localize("ADD_MEMBERS")`
    */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholder?: string;
    /**
     * Show alphabetical header
     *
     * @defaultValue `false`
     */
    showSectionHeader?: boolean;
    /**
     * Property on the user object
     *
     * @remarks
     * This property will be used to extract the section header character from the user object
     *
     * @defaultValue `getName`
     */
    sectionHeaderField?: keyof CometChat.User;
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
     * @defaultValue `localize("NO_USERS_FOUND")`
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
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (user: CometChat.User) => CometChatOption[];
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.multiple`
     */
    selectionMode?: SelectionMode;
    /**
     * Function to call when a user from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (user: CometChat.User, selected: boolean) => void;
    /**
     * Request builder to fetch users
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    usersRequestBuilder?: CometChat.UsersRequestBuilder;
    /**
     * Request builder with search parameters to fetch users
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.UsersRequestBuilder;
    /**
     * Custom list item view to be rendered for each user in the fetched list
     */
    listItemView?: (user: CometChat.User) => JSX.Element;
    /**
     * Custom subtitle view to be rendered for each user in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (user: CometChat.User) => JSX.Element;
    /**
     * Group to add members to
     */
    group: CometChat.Group;
    /**
     * Function to call when add button of the component is clicked
     *
     * @remarks
     * This function won't be call if no users are selected
     */
    onAddMembersButtonClick?: (guid: string, membersToAdd: CometChat.GroupMember[]) => void;
    /**
     * Text to display for the default add button
     *
     * @defaultValue `localize("ADD_MEMBERS")`
     */
    buttonText?: string;
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
    addMembersStyle?: AddMembersStyle;
}
/**
 * Renders a scrollable list of users to add to a group of a CometChat App
 */
export declare function CometChatAddMembers(props: IAddMembersProps): import("react/jsx-runtime").JSX.Element;
export {};
