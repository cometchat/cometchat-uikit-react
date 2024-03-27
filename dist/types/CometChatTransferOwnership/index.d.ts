import { AvatarStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties } from "react";
import { CometChatOption, TitleAlignment } from "@cometchat/uikit-resources";
import { GroupMembersStyle, TransferOwnershipStyle } from "@cometchat/uikit-shared";
interface ITransferOwnershipProps {
    /**
     * Group to transfer ownership of
     */
    group: CometChat.Group;
    /**
     * Title of the component
     *
     * @defaultValue `localize("TRANSFER_OWNERSHIP")`
    */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment?: TitleAlignment;
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
    groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
    /**
     * Request builder with search parameters to fetch group members
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
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
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
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
     * @defaultValue `false`
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
     * Custom list item view to be rendered for each group member in the fetched list
     */
    listItemView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    /**
     * Custom subtitle view to be rendered for each group member in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (groupMember: CometChat.GroupMember) => JSX.Element;
    transferButtonText?: string;
    onTransferOwnership?: (groupMember: CometChat.GroupMember) => void;
    /**
     * Text to display for the cancel button
     */
    cancelButtonText?: string;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (group: CometChat.Group, groupMember: CometChat.GroupMember) => CometChatOption[];
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
     * Styles to apply to the `CometChatGroupMembers` component
     */
    groupMemberStyle?: GroupMembersStyle;
    /**
     * Styles to apply to this component
     */
    transferOwnershipStyle?: TransferOwnershipStyle;
}
/**
 * Renders transfer ownership view related to a group of a CometChat App
 */
export declare function CometChatTransferOwnership(props: ITransferOwnershipProps): import("react/jsx-runtime").JSX.Element;
export {};
