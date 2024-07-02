import { AddMembersConfiguration, BannedMembersConfiguration, DetailsStyle, GroupMembersConfiguration, TransferOwnershipConfiguration } from "@cometchat/uikit-shared";
import { AvatarStyle, BaseStyle, ConfirmDialogStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CSSProperties, JSX } from "react";
import { CometChatDetailsTemplate } from "@cometchat/uikit-resources";
interface IDetailsProps {
    /**
     * User to display details of
     */
    user?: CometChat.User;
    /**
     * Group to display details of
     *
     * @remarks
     * This prop is used if `user` prop is not provided
     */
    group?: CometChat.Group;
    /**
     * Custom profile view
     *
     * @remarks
     * This prop is used only if `hideProfile` is set to `false`
     */
    customProfileView?: (user?: CometChat.User, group?: CometChat.Group) => JSX.Element;
    /**
     * Custom subtitle view for the `user` or `group` prop
     *
     * @remarks
     * This prop is used only if `hideProfile` is set `false` & `customProfileView` prop is not provided
     */
    subtitleView?: (user?: CometChat.User, group?: CometChat.Group) => JSX.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("DETAILS")`
    */
    title?: string;
    /**
     * Image URL for the close button
     *
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL?: string;
    /**
     * Text to display for the cancel button
     */
    cancelButtonText?: string;
    /**
     * Function to call when the close button is clicked
     */
    onClose?: () => void;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default profile view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Hide profile
     *
     * @defaultValue `false`
     */
    hideProfile?: boolean;
    /**
     * Image URL for the status indicator icon of a private group
     *
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon?: string;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.8 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
     */
    /**
     * Image URL for the status indicator icon of a password-protected group
     *
     * @defaultValue `./assets/locked.svg`
     */
    protectedGroupIcon?: string;
    /**
       * Image URL for the status indicator icon of a password-protected group
       *
       * @defaultValue {undefined}
       */
    passwordGroupIcon?: string;
    /**
     * Function to create a list of `CometChatTemplate` instances from the `user` or `group` prop
     */
    data?: CometChatDetailsTemplate[];
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: (error: CometChat.CometChatException) => void;
    /**
     * Text to display for the confirm button of the leave confirm modal
     *
     * @defaultValue `localize("LEAVE_GROUP")`
     */
    leaveButtonText?: string;
    /**
     * Message to display for the leave confirm modal
     *
     * @defaultValue `localize("LEAVE_CONFIRM")`
     */
    leaveConfirmDialogMessage?: string;
    /**
     * Text to display for the confirm button of the transfer ownership confirm modal
     *
     * @defaultValue `localize("TRANSFER_OWNERSHIP")`
     */
    transferButtonText?: string;
    /**
     * Message to display for the transfer onwership confirm modal
     *
     * @defaultValue `localize("LEAVE_CONFIRM")`
     */
    transferConfirmDialogMessage?: string;
    /**
     * Text to display for the confirm button of the delete confirm modal
     *
     * @defaultValue `localize("DELETE")`
     */
    deleteButtonText?: string;
    /**
     * Message to display for the delete confirm modal
     *
     * @defaultValue `localize("DELETE_CONFIRM")`
     */
    deleteConfirmDialogMessage?: string;
    /**
     * `CometChatAddMembers` configuration
     */
    addMembersConfiguration?: AddMembersConfiguration;
    /**
     * `CometChatBannedMembers` configuration
     */
    bannedMembersConfiguration?: BannedMembersConfiguration;
    /**
     * `CometChatGroupMembers` configuration
     */
    groupMembersConfiguration?: GroupMembersConfiguration;
    /**
     * `CometChatTransferOwnership` configuration
     */
    transferOwnershipConfiguration?: TransferOwnershipConfiguration;
    /**
     * Styles to apply to the default profile view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to the status indicator component of the default profile view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the avatar component of the default profile view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the leave group confirm dialog component
     */
    leaveDialogStyle?: ConfirmDialogStyle;
    deleteDialogStyle?: ConfirmDialogStyle;
    /**
     * Styles to apply to the backdrop component
     */
    backdropStyle?: BaseStyle;
    /**
     * Styles to apply to this component
     */
    detailsStyle?: DetailsStyle;
}
export type ModalInfo = {
    type: "leaveOrTransferConfirm" | "deleteConfirm";
    buttonText: string;
    confirmDialogMessage: string;
} | {
    type: "transferOwnership";
} | null;
/**
 * Renders details view of a user or group of a CometChat App
 */
export declare function CometChatDetails(props: IDetailsProps): import("react/jsx-runtime").JSX.Element | null;
export {};
