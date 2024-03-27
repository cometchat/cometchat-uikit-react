import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties, JSX } from "react";
import { CometChatOption, SelectionMode, States, TitleAlignment, UserPresencePlacement } from "@cometchat/uikit-resources";
import { UsersManager } from "./controller";
import { UsersStyle } from "@cometchat/uikit-shared";
export interface IUsersProps {
    /**
     * Title of the component
     *
     * @defaultValue `localize("USERS")`
     */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.left`
     */
    tileAlignment?: TitleAlignment;
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
    searchPlaceholderText?: string;
    /**
     * Custom list item view to be rendered for each user in the fetched list
     */
    listItemView?: (user: CometChat.User) => JSX.Element;
    /**
     * Show alphabetical header
     *
     * @defaultValue `true`
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
    sectionHeaderKey?: keyof CometChat.User;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX.Element;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
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
     * Custom view for the error state of the component
     */
    errorStateView?: JSX.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Custom subtitle view to be rendered for each user in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (user: CometChat.User) => JSX.Element;
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
     * Custom view to render on the top-right of the component
     */
    menus?: JSX.Element;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (user: CometChat.User) => CometChatOption[];
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
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
     * Function to call when a user from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (users: CometChat.User, selected: boolean) => void;
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
     * Function to call on click of the default list item view of a user
     */
    onItemClick?: (user: CometChat.User) => void;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to this component
     */
    usersStyle?: UsersStyle;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * User to highlight
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeUser?: CometChat.User;
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
     * Flag to indicate whether users are currently being fetched.
     *
     * @defaultValue `false`
     */
    fetchingUsers?: boolean;
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
    /**
     * URL of the icon to be used for the close button.
     */
    closeButtonIconURL?: string;
}
type State = {
    searchText: string;
    userList: CometChat.User[];
    fetchState: States;
    isFirstReload: boolean;
    fetchingUsers: boolean;
    fetchTimeOut: any;
    disableLoadingState: boolean;
};
export type Action = {
    type: "setSearchText";
    searchText: State["searchText"];
} | {
    type: "appendUsers";
    users: CometChat.User[];
    removeOldUsers?: boolean;
    usersManager?: UsersManager | null;
    onEmpty?: () => void;
} | {
    type: "setFetchState";
    fetchState: States;
} | {
    type: "setUserList";
    userList: CometChat.User[];
} | {
    type: "updateUser";
    user: CometChat.User;
} | {
    type: "setIsFirstReload";
    isFirstReload: boolean;
};
/**
 * Renders a scrollable list of users that has been created in a CometChat app
 */
export declare function CometChatUsers(props: IUsersProps): import("react/jsx-runtime").JSX.Element;
export {};
