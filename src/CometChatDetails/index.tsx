import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, BaseStyle, ConfirmDialogStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties, useCallback, useContext, useState, JSX } from "react";
import { CometChatDetailsOption, CometChatDetailsTemplate, CometChatGroupEvents, CometChatUIKitConstants, CometChatUserEvents, localize, SelectionMode } from "uikit-resources-lerna";
import { AddMembersConfiguration, BannedMembersConfiguration, CometChatUIKitUtility, DetailsStyle, DetailsUtils, GroupMembersConfiguration, TransferOwnershipConfiguration } from "uikit-utils-lerna";
import Close2xIcon from "./assets/close2x.svg";
import LockedIcon from "./assets/locked.svg";
import PrivateIcon from "./assets/private.svg";
import { CometChatContext } from "../CometChatContext";
import { CometChatAddMembers } from "../CometChatAddMembers";
import { CometChatBannedMembers } from "../CometChatBannedMembers";
import { CometChatGroupMembers } from "../CometChatGroupMembers";
import { CometChatTransferOwnership } from "../CometChatTransferOwnership";
import { Hooks } from "./hooks";
import { avatarStyle, backdropStyle, closeBtnStyle, defaultOptionContentStyle, defaultOptionStyle, deleteDialogStyle, detailsContentWrapperStyle, detailsStyle, dividerStyle, headerStyle, leaveDialogStyle, listItemStyle, optionBtnStyle, optionsStyle, pageWrapperStyle, profileStyle, sectionHeaderStyle, sectionHeaderWrapperStyle, sectionListStyle, statusIndicatorStyle, subtitleStyle, tailWrapperStyle, titleStyle } from "./style";
import { useCometChatErrorHandler, useRefSync, useStateRef } from "../CometChatCustomHooks";
import { CometChatListItem } from "../Shared/Views/CometChatListItem";
import { CometChatButton } from "../Shared/Views/CometChatButton";

interface IDetailsProps {
    /**
     * User to display details of
     */
    user? : CometChat.User,
    /**
     * Group to display details of
     * 
     * @remarks
     * This prop is used if `user` prop is not provided
     */
    group? : CometChat.Group,
    /**
     * Custom profile view
     * 
     * @remarks
     * This prop is used only if `hideProfile` is set to `false`
     */
    customProfileView? : (user? : CometChat.User, group? : CometChat.Group) => JSX.Element,
    /**
     * Custom subtitle view for the `user` or `group` prop
     * 
     * @remarks
     * This prop is used only if `hideProfile` is set `false` & `customProfileView` prop is not provided
     */
    subtitleView? : (user? : CometChat.User, group? : CometChat.Group) => JSX.Element,
    /** 
     * Title of the component 
     * 
     * @defaultValue `localize("DETAILS")` 
    */
    title? : string,
    /**
     * Image URL for the close button
     * 
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL? : string,
    /**
     * Text to display for the cancel button
     */
    cancelButtonText? : string,
    /**
     * Function to call when the close button is clicked
     */
    onClose? : () => void,
    /**
     * Hide user presence
     * 
     * @remarks
     * If set to true, the status indicator of the default profile view is not displayed
     * 
     * @defaultValue `false`
     */
    disableUsersPresence? : boolean,
    /**
     * Hide profile
     * 
     * @defaultValue `false`
     */
    hideProfile? : boolean,
    /**
     * Image URL for the status indicator icon of a private group
     * 
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon? : string,
    /**
     * Image URL for the status indicator icon of a password-protected group
     * 
     * @defaultValue `./assets/locked.svg`
     */
    protectedGroupIcon? : string,
    /**
     * Function to create a list of `CometChatTemplate` instances from the `user` or `group` prop 
     */
    data? : (user? : CometChat.User, group? : CometChat.Group) => CometChatDetailsTemplate[],
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Text to display for the confirm button of the leave confirm modal
     * 
     * @defaultValue `localize("LEAVE_GROUP")`
     */
    leaveButtonText? : string,
    /**
     * Message to display for the leave confirm modal
     * 
     * @defaultValue `localize("LEAVE_CONFIRM")`
     */
    leaveConfirmDialogMessage? : string,
    /**
     * Text to display for the confirm button of the transfer ownership confirm modal
     * 
     * @defaultValue `localize("TRANSFER_OWNERSHIP")`
     */
    transferButtonText? : string,
    /**
     * Message to display for the transfer onwership confirm modal
     * 
     * @defaultValue `localize("LEAVE_CONFIRM")`
     */
    transferConfirmDialogMessage? : string,
    /**
     * Text to display for the confirm button of the delete confirm modal
     * 
     * @defaultValue `localize("DELETE")`
     */
    deleteButtonText? : string,
    /**
     * Message to display for the delete confirm modal
     * 
     * @defaultValue `localize("DELETE_CONFIRM")`
     */
    deleteConfirmDialogMessage? : string,
    /**
     * `CometChatAddMembers` configuration
     */
    addMembersConfiguration? : AddMembersConfiguration,
    /**
     * `CometChatBannedMembers` configuration
     */
    bannedMembersConfiguration? : BannedMembersConfiguration,
    /**
     * `CometChatGroupMembers` configuration
     */
    groupMembersConfiguration? : GroupMembersConfiguration,
    /**
     * `CometChatTransferOwnership` configuration
     */
    transferOwnershipConfiguration? : TransferOwnershipConfiguration,
    /**
     * Styles to apply to the default profile view
     */
    listItemStyle? : ListItemStyle,
    /**
     * Styles to apply to the status indicator component of the default profile view 
     */
    statusIndicatorStyle? : CSSProperties,
    /**
     * Styles to apply to the avatar component of the default profile view 
     */
    avatarStyle? : AvatarStyle,
    /**
     * Styles to apply to the leave group confirm dialog component
     */
    leaveDialogStyle? : ConfirmDialogStyle,
    deleteDialogStyle? : ConfirmDialogStyle,
    /**
     * Styles to apply to the backdrop component
     */
    backdropStyle? : BaseStyle,
    /**
     * Styles to apply to this component
     */
    detailsStyle? : DetailsStyle
};

type PageToShow = "none" | "addMembers" | "bannedMembers" | "groupMembers";
export type ModalInfo = {type : "leaveOrTransferConfirm" | "deleteConfirm", buttonText : string, confirmDialogMessage : string} |
                        {type : "transferOwnership"} | 
                        null;

/**
 * Renders details view of a user or group of a CometChat App
 */
export function CometChatDetails(props : IDetailsProps) {
    const { 
        user,
        group,
        title = localize("DETAILS"),
        closeButtonIconURL = Close2xIcon,
        cancelButtonText = localize("CANCEL"),
        onClose,
        disableUsersPresence = false,
        customProfileView = null,
        hideProfile = false,
        privateGroupIcon = PrivateIcon,
        protectedGroupIcon = LockedIcon,
        subtitleView = null,
        data = null,
        onError,
        leaveButtonText = localize("LEAVE_GROUP"),
        leaveConfirmDialogMessage = localize("LEAVE_CONFIRM"),
        transferButtonText = localize("TRANSFER_OWNERSHIP"),
        transferConfirmDialogMessage = localize("TRANSFER_CONFIRM"),
        deleteButtonText = localize("DELETE"),
        deleteConfirmDialogMessage = localize("DELETE_CONFIRM"),
        addMembersConfiguration = null,
        bannedMembersConfiguration = null,
        groupMembersConfiguration = null,
        transferOwnershipConfiguration = null,
        listItemStyle : listItmeStyleObject = null,
        statusIndicatorStyle : statusIndicatorStyleObject = null,
        avatarStyle : avatarStyleObject = null,
        leaveDialogStyle : leaveDialogStyleObject = null,
        deleteDialogStyle : deleteDialogStyleObject = null,
        backdropStyle : backdropStyleObject = null,
        detailsStyle : detailsStyleObject = null
    } = props;

    const [pageToShow, setPageToShow] = useState<PageToShow>("none");
    const [modalInfo, setModalInfo] = useState<ModalInfo>(null);
    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
    const userOrGroup = user ?? group;
    const [leaveOrTransferConfirmDialogElement, setLeaveOrTransferConfirmDialog] = useStateRef<JSX.IntrinsicElements["cometchat-confirm-dialog"] | null>(null);
    const [deleteConfirmDialogElement, setDeleteConfirmDialog] = useStateRef<JSX.IntrinsicElements["cometchat-confirm-dialog"] | null>(null);
    const onClosePropRef = useRefSync(onClose);
    const errorHandler = useCometChatErrorHandler(onError);
    const { theme } = useContext(CometChatContext);

    /**
     * Creates group member left action message
     */
    const createGroupMemberLeftActionMessage = useCallback((group : CometChat.Group, loggedInUser : CometChat.User) : CometChat.Action => {
            const action = CometChatUIKitConstants.groupMemberAction.LEFT;
            const actionMessage = new CometChat.Action(
                group.getGuid(), 
                CometChatUIKitConstants.MessageTypes.groupMember,
                CometChatUIKitConstants.MessageReceiverType.group,
                CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory 
            );
            actionMessage.setAction(action);
            actionMessage.setActionBy(CometChatUIKitUtility.clone(loggedInUser));
            actionMessage.setActionFor(CometChatUIKitUtility.clone(group));
            actionMessage.setActionOn(CometChatUIKitUtility.clone(loggedInUser));
            actionMessage.setReceiver(CometChatUIKitUtility.clone(group));
            actionMessage.setSender(CometChatUIKitUtility.clone(loggedInUser));
            actionMessage.setConversationId("group_" + group.getGuid());
            actionMessage.setMuid(CometChatUIKitUtility.ID());
            actionMessage.setMessage(`${loggedInUser.getName()} ${action} ${loggedInUser.getUid()}`);
            actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
            return actionMessage;
    }, []);

    /**
     * Handles leave or transfer ownership confirm click
     */
    const handleLeaveOrTransferConfirmClick = useCallback(async (userOrGroup : CometChat.User | CometChat.Group) : Promise<void> => {
        if (userOrGroup instanceof CometChat.User) {
            return;
        }
        if (userOrGroup.getOwner() === loggedInUser?.getUid()) {
            setModalInfo({type: "transferOwnership"});
        }
        else {
            setModalInfo(null);
            try {
                if (loggedInUser) {
                    await CometChat.leaveGroup(userOrGroup.getGuid());
                    const groupClone = CometChatUIKitUtility.clone(userOrGroup);
                    groupClone.setHasJoined(false);
                    CometChatGroupEvents.ccGroupLeft.next({
                        userLeft: CometChatUIKitUtility.clone(loggedInUser),
                        leftGroup: groupClone,
                        message: createGroupMemberLeftActionMessage(groupClone, loggedInUser)
                    });
                    onClosePropRef.current?.();
                }
            }
            catch(error) {
                errorHandler(error);
            }
        }
    }, [loggedInUser, setModalInfo, errorHandler, createGroupMemberLeftActionMessage, onClosePropRef]);

    /**
     * Handles delete confirm click
     */
    const handleDeleteConfirmClick = useCallback(async (userOrGroup : CometChat.User | CometChat.Group) : Promise<void> => {
        if (userOrGroup instanceof CometChat.User) {
            return;
        }
        setModalInfo(null);
        try {
            await CometChat.deleteGroup(userOrGroup.getGuid());
            CometChatGroupEvents.ccGroupDeleted.next(CometChatUIKitUtility.clone(userOrGroup));
            onClosePropRef.current?.();
        }
        catch(error) {
            errorHandler(error);
        }
    }, [setModalInfo, errorHandler, onClosePropRef]);


    /**
     * Blocks the provided `user`
     */
    async function blockUser(user : CometChat.User) : Promise<void> {
        if (!user.getBlockedByMe()) {
            try {
                await CometChat.blockUsers([user.getUid()]);
                const userClone = CometChatUIKitUtility.clone(user);
                userClone.setHasBlockedMe(true);
                CometChatUserEvents.ccUserBlocked.next(userClone);
                onClose?.();
            }
            catch(error) {
                errorHandler(error);
            }
        }
    }

    /**
     * Unblocks the provided `user`
     */
    async function unblockUser(user : CometChat.User) : Promise<void> {
        if (user.getBlockedByMe()) {
            try {
                await CometChat.unblockUsers([user.getUid()]);
                const userClone = CometChatUIKitUtility.clone(user);
                userClone.setHasBlockedMe(false);
                CometChatUserEvents.ccUserUnblocked.next(userClone);
                onClose?.();
            }
            catch(error) {
                errorHandler(error);
            }
        }
    }

    /**
     * Creates templates
     */
    function getTemplates(userOrGroup : CometChat.User | CometChat.Group) : CometChatDetailsTemplate[] {
        let res : CometChatDetailsTemplate[] = [];
        if (data) {
            if (userOrGroup instanceof CometChat.User) {
                res = data(userOrGroup);
            }
            else {
                res = data(undefined, userOrGroup);
            }
        }
        if (res.length === 0) {
            if (userOrGroup instanceof CometChat.User) {
                res = DetailsUtils.getDefaultDetailsTemplate(loggedInUser, userOrGroup, undefined, theme);
            }
            else {
                res = DetailsUtils.getDefaultDetailsTemplate(loggedInUser, undefined, userOrGroup, theme);
            }
        }
        return res;
    }

    /**
     * Gets the status indicator color
     * 
     * @remarks
     * If the intention is not to show the status indicator, `null` should be returned
     */
    function getStatusIndicatorColor(userOrGroup : CometChat.User | CometChat.Group) : string | null {
        if (userOrGroup instanceof CometChat.User) {
            if (!disableUsersPresence && userOrGroup.getStatus() === CometChatUIKitConstants.userStatusType.online) {
                return detailsStyleObject?.onlineStatusColor || theme.palette.getSuccess() || "rgb(0, 200, 111)";
            }
        }
        else {
            const groupType = userOrGroup.getType();
            if (groupType === CometChatUIKitConstants.GroupTypes.private) {
                return detailsStyleObject?.privateGroupIconBackground || "#F7A500";
            }
            if (groupType === CometChatUIKitConstants.GroupTypes.password) {
                return detailsStyleObject?.passwordGroupIconBackground || "#F7A500";
            }
        }
        return null;
    }

    /**
     * Gets the status indicator icon
     */
    function getStatusIndicatorIcon(userOrGroup : CometChat.User | CometChat.Group) : string {
        let res = "";
        if (userOrGroup instanceof CometChat.Group) {
            const groupType = userOrGroup.getType();
            if (groupType === CometChatUIKitConstants.GroupTypes.private) {
                res = privateGroupIcon;
            }
            else if (groupType === CometChatUIKitConstants.GroupTypes.password) {
                res = protectedGroupIcon;
            }
        }
        return res;
    }

    /**
     * Creates header view
     */
    function getHeaderView() : JSX.Element {
        return (
            <div
                className = "cc-details__header"
                style = {headerStyle()}
            >
                <cometchat-label
                    text = {title}
                    labelStyle = {JSON.stringify(titleStyle(detailsStyleObject, theme))}
                />
                <CometChatButton 
                    iconURL = {closeButtonIconURL}
                    buttonStyle = {closeBtnStyle(detailsStyleObject, theme)}
                    onClick = {onClose}
                />
            </div>
        );
    }

    /**
     * Creates subtitle text for the default profile view
     */
    function getDefaultProfileSubtitleText(userOrGroup : CometChat.User | CometChat.Group) : string {
        if (userOrGroup instanceof CometChat.User) {
            return disableUsersPresence ? "" : localize(userOrGroup.getStatus().toUpperCase());
        }
        const numGroupMembers = userOrGroup.getMembersCount();
        return `${numGroupMembers} ${localize(numGroupMembers > 1 ? "MEMBERS" : "MEMBER")}`;
    }

    /**
     * Creates subtitle view for the default profile view
     */
    function getDefaultProfileSubtitleView(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element {
        if (subtitleView) {
            if (userOrGroup instanceof CometChat.User) {
                return subtitleView(userOrGroup);
            }   
            return subtitleView(undefined, userOrGroup);
        }
        const isUserOnline = userOrGroup instanceof CometChat.User &&
                             userOrGroup.getStatus() === CometChatUIKitConstants.userStatusType.online;
        return (
            <cometchat-label
                text = {getDefaultProfileSubtitleText(userOrGroup)}
                labelStyle = {JSON.stringify(subtitleStyle(isUserOnline, detailsStyleObject, theme))}
            />
        );
    }

    /**
     * Creates default profile view
     */
    function getDefaultProfileView(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element {
        return (
            <CometChatListItem
                avatarName = {userOrGroup.getName()}
                title = {userOrGroup.getName()}
                avatarURL = {userOrGroup instanceof CometChat.User ? userOrGroup.getAvatar() : userOrGroup.getIcon()}
                statusIndicatorColor = {getStatusIndicatorColor(userOrGroup)}
                statusIndicatorIcon = {getStatusIndicatorIcon(userOrGroup)}
                listItemStyle = {listItemStyle(listItmeStyleObject, theme)}
                statusIndicatorStyle = {statusIndicatorStyle(statusIndicatorStyleObject, theme)}
                avatarStyle = {avatarStyle(avatarStyleObject, theme)}
                subtitleViewClassName = "cc-details__subtitle-view"
                subtitleView = {getDefaultProfileSubtitleView(userOrGroup)}
            />
        );
    }

    /**
     * Creates profile view
     */
    function getProfileView(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element | null {
        if (hideProfile) {
            return null;
        }
        let profileViewJSX : JSX.Element;
        if (customProfileView) {
            if (userOrGroup instanceof CometChat.User) {
                profileViewJSX = customProfileView(userOrGroup);
            }
            else {
                profileViewJSX = customProfileView(undefined, userOrGroup);
            }
        }
        else {
            profileViewJSX = getDefaultProfileView(userOrGroup);
        }
        return (
            <div
                className = "cc-details__profile"
                style = {profileStyle()}
            >
                {profileViewJSX}
            </div>
        );
    }

    /**
     * Creates details options
     */
    function getTemplateOptions(template : CometChatDetailsTemplate, userOrGroup : CometChat.User | CometChat.Group) : CometChatDetailsOption[] | undefined {
        const { id } = template;
        if (id !== undefined) {
            return userOrGroup instanceof CometChat.User ? template.options?.(userOrGroup, null, id) : template.options?.(null, userOrGroup, id);
        }
    }

    /**
     * Handles details option click
     */
    function onOptionClick(option : CometChatDetailsOption, userOrGroup : CometChat.User | CometChat.Group) : void {
        const { id, onClick } = option;
        if (onClick) {
            onClick(userOrGroup);
        }
        else {
            switch(id) {
                case CometChatUIKitConstants.UserOptions.viewProfile: 
                    if (userOrGroup instanceof CometChat.User && userOrGroup.getLink()) {
                        window.location.href = userOrGroup.getLink();
                    }
                    break;
                case CometChatUIKitConstants.UserOptions.block:
                    if (userOrGroup instanceof CometChat.User) {
                        blockUser(userOrGroup);
                    }
                    break;
                case CometChatUIKitConstants.UserOptions.unblock:
                    if (userOrGroup instanceof CometChat.User) {
                        unblockUser(userOrGroup);
                    }
                    break;
                case CometChatUIKitConstants.GroupOptions.viewMembers:
                    if (userOrGroup instanceof CometChat.Group) {
                        setPageToShow("groupMembers");
                    }
                    break;
                case CometChatUIKitConstants.GroupOptions.addMembers:
                    if (userOrGroup instanceof CometChat.Group) {
                        setPageToShow("addMembers");
                    }
                    break;
                case CometChatUIKitConstants.GroupOptions.bannedMembers:
                    if (userOrGroup instanceof CometChat.Group) {
                        setPageToShow("bannedMembers");
                    }
                    break;
                case CometChatUIKitConstants.GroupOptions.leave:
                    if (userOrGroup instanceof CometChat.Group) {
                        const isLoggedInUserGroupOwner = userOrGroup.getOwner() === loggedInUser?.getUid();
                        setModalInfo({
                            type: "leaveOrTransferConfirm",
                            buttonText: isLoggedInUserGroupOwner ? transferButtonText : leaveButtonText, 
                            confirmDialogMessage: isLoggedInUserGroupOwner ? transferConfirmDialogMessage : leaveConfirmDialogMessage
                        });
                    }
                    break;
                case CometChatUIKitConstants.GroupOptions.delete:
                    if (userOrGroup instanceof CometChat.Group) {
                        setModalInfo({
                            type: "deleteConfirm",
                            buttonText: deleteButtonText,
                            confirmDialogMessage: deleteConfirmDialogMessage
                        });
                    }
                    break;
            }
        }
    }

    /**
     * Creates option view with root element's key set to the provided `key`
     */
    function getOptionJSXWithKeyAdded(option : CometChatDetailsOption, userOrGroup : CometChat.User | CometChat.Group, hideSeparator : boolean, separatorColor : string | undefined) : JSX.Element {
        const { id, customView } = option;
        if (customView) {
            return (
                <div
                    key = {id}
                    className = "cc-details__option"
                >
                    {customView}
                </div>
            );
        }
        const { title, tail, iconURL } = option;
        const buttonJSX = (
            <CometChatButton 
                text = {title}
                iconURL = {iconURL}
                buttonStyle = {optionBtnStyle(option)}
                onClick = {() => onOptionClick(option, userOrGroup)}
            />
        );
        let contentJSX : JSX.Element = buttonJSX;
        if (tail) {
            contentJSX = (
                <div
                    className = "cc-details__option-content"
                    style = {defaultOptionContentStyle()}
                >
                    {buttonJSX}
                    <div
                        className = "cc-details__option-tail"
                        style = {tailWrapperStyle()}
                    >
                        {tail}
                    </div>
                </div>
            );
        }
        return (
            <div
                key = {id}
                className = "cc-details__option"
                style = {defaultOptionStyle()}
            >
                {contentJSX}
                {getSeparator(hideSeparator, separatorColor, false)}
            </div>
        );
    }

    /**
     * Creates a separator that can be used inside an option view or a section view of the component
     */
    function getSeparator(hideSeparator : boolean, separatorColor : string | undefined, isTemplateSeparator : boolean) : JSX.Element | null {
        if (hideSeparator) {
            return null;
        }
        return (
            <cometchat-divider
                dividerStyle = {JSON.stringify(dividerStyle(separatorColor, isTemplateSeparator, theme))}
            />
        ); 
    }

    /**
     * Creates section view with root element's key set to the provided `key`
     */
    function getSectionJSXWithKeyAdded(template : CometChatDetailsTemplate, userOrGroup : CometChat.User | CometChat.Group) : JSX.Element {
        const { title, id, hideSectionSeparator = true, sectionSeparatorColor, hideItemSeparator = false, itemSeparatorColor } = template;
        let titleJSX : JSX.Element | null = null;
        if (title !== undefined) {
            titleJSX = (
                <div
                    className = "cc-details__section-header"
                    style = {sectionHeaderWrapperStyle()}
                >
                    <cometchat-label
                        text = {title}
                        labelStyle = {JSON.stringify(sectionHeaderStyle(template))}
                    />
                </div>
            );  
        }
        let optionsJSX : JSX.Element | null = null;
        const templateOptions = getTemplateOptions(template, userOrGroup);
        if (templateOptions?.length) {
            optionsJSX = (
                <div
                    className = "cc-details__options"
                    style = {optionsStyle()}
                >
                    {templateOptions.map((templateOption, i) => getOptionJSXWithKeyAdded(templateOption, userOrGroup, hideItemSeparator, itemSeparatorColor))}
                </div>
            );
        }
        return (
            <div
                className = "cc-details__section"
                key = {id}
            >
                {titleJSX}
                {optionsJSX}
                {getSeparator(hideSectionSeparator, sectionSeparatorColor, true)}
            </div>
        );
    }

    /**
     * Creates section view container
     */
    function getSectionList(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element | null {
        const templateJSXList : JSX.Element[] = getTemplates(userOrGroup).map((template, i) => getSectionJSXWithKeyAdded(template, userOrGroup));
        if (templateJSXList.length === 0) {
            return null;
        }
        return (
            <div
                className = "cc-details__section-list"
                style = {sectionListStyle()}
            >
                {templateJSXList}
            </div>
        );
    }

    /**
     * Sets `pageToShow` state to `"none"`
     */
    function setPageToShowToNone() : void {
        setPageToShow("none");
    }

    /**
     * Checks provided `key` is a key of `CometChat.User` instance
     */
    function isUserKey(key : string | undefined) : key is keyof CometChat.User {
        return key !== undefined && key in new CometChat.User("anyString");
    }

    /**
     * Creates AddMembers view
     */
    function getCometChatAddMembers(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element | null {
        if (userOrGroup instanceof CometChat.User) {
            return null;
        }
        const sectionHeaderField = addMembersConfiguration?.sectionHeaderField;
        const options = addMembersConfiguration?.options;
        /*  
            These values are not present in the configuration, so will use the default values assigned internally by the component used
                title? : string,
                searchPlaceholder? : string,
                emptyStateText? : string,
                errorStateText? : string,
                buttonText? : string
        */
        return (
            <CometChatAddMembers
                group = {userOrGroup}
                selectionMode = {addMembersConfiguration?.selectionMode ?? SelectionMode.multiple}
                onClose = {addMembersConfiguration?.onClose ?? onClose ?? undefined}
                onBack = {addMembersConfiguration?.onBack ?? setPageToShowToNone}
                backButtonIconURL = {addMembersConfiguration?.backButtonIconURL}
                showBackButton = {addMembersConfiguration?.showBackButton}
                titleAlignment = {addMembersConfiguration?.titleAlignment}
                hideSearch = {addMembersConfiguration?.hideSearch}
                searchIconURL = {addMembersConfiguration?.searchIconURL}
                showSectionHeader = {addMembersConfiguration?.showSectionHeader}
                sectionHeaderField = {isUserKey(sectionHeaderField) ? sectionHeaderField : undefined}
                loadingIconURL = {addMembersConfiguration?.loadingIconURL}
                loadingStateView = {addMembersConfiguration?.loadingStateView}
                emptyStateView = {addMembersConfiguration?.emptyStateView}
                errorStateView = {addMembersConfiguration?.errorStateView}
                hideError = {addMembersConfiguration?.hideError}
                disableUsersPresence = {addMembersConfiguration?.disableUsersPresence}
                hideSeparator = {addMembersConfiguration?.hideSeparator}
                onError = {addMembersConfiguration?.onError ?? undefined}
                menus = {addMembersConfiguration?.menu}
                options = {options ?? undefined}
                onSelect = {addMembersConfiguration?.onSelect}
                usersRequestBuilder = {addMembersConfiguration?.usersRequestBuilder}
                searchRequestBuilder = {addMembersConfiguration?.searchRequestBuilder}
                listItemView = {addMembersConfiguration?.listItemView}
                subtitleView = {addMembersConfiguration?.subtitleView}
                onAddMembersButtonClick = {addMembersConfiguration?.onAddMembersButtonClick ?? undefined}
                closeButtonIconURL = {addMembersConfiguration?.closeButtonIconURL}
                listItemStyle = {addMembersConfiguration?.listItemStyle}
                statusIndicatorStyle = {addMembersConfiguration?.statusIndicatorStyle}
                avatarStyle = {addMembersConfiguration?.avatarStyle}
                addMembersStyle = {addMembersConfiguration?.addMembersStyle}
            />
        );
    }

    /**
     * Create BannedMembers view
     */
    function getCometChatBannedMembers(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element | null {
        if (userOrGroup instanceof CometChat.User) {
            return null;
        }
        const options = bannedMembersConfiguration?.options;
        /*
            These values are not present in the configuration, so will use the default values assigned internally by the component used
                title? : string,
                searchPlaceholder? : string,
                emptyStateText? : string,
                errorStateText? : string,
                unbanIconURL? : string,
                onItemClick? : (bannedMember : CometChat.GroupMember) => void,
                theme? : CometChatTheme
        */
        return (
            <CometChatBannedMembers
                group = {userOrGroup}
                onClose = {addMembersConfiguration?.onClose ?? onClose ?? undefined}
                onBack = {bannedMembersConfiguration?.onBack ?? setPageToShowToNone}
                backButtonIconURL = {bannedMembersConfiguration?.backButtonIconURL}
                showBackButton = {bannedMembersConfiguration?.showBackButton}
                menus = {bannedMembersConfiguration?.menu}
                titleAlignment = {bannedMembersConfiguration?.titleAlignment}
                hideSearch = {bannedMembersConfiguration?.hideSearch}
                searchIconURL = {bannedMembersConfiguration?.searchIconURL}
                bannedMembersRequestBuilder = {bannedMembersConfiguration?.bannedMembersRequestBuilder}
                searchRequestBuilder = {bannedMembersConfiguration?.searchRequestBuilder}
                listItemView = {bannedMembersConfiguration?.listItemView}
                subtitleView = {bannedMembersConfiguration?.subtitleView}
                hideSeparator = {bannedMembersConfiguration?.hideSeparator}
                disableUsersPresence = {bannedMembersConfiguration?.disableUsersPresence}
                options = {options ?? undefined}
                selectionMode = {bannedMembersConfiguration?.selectionMode}
                closeButtonIconURL = {bannedMembersConfiguration?.closeButtonIconURL}
                onError = {bannedMembersConfiguration?.onError ?? undefined}
                onSelect = {bannedMembersConfiguration?.onSelect}
                emptyStateView = {bannedMembersConfiguration?.emptyStateView}
                errorStateView = {bannedMembersConfiguration?.errorStateView}
                loadingStateView = {bannedMembersConfiguration?.loadingStateView}
                loadingIconURL = {bannedMembersConfiguration?.loadingIconURL}
                hideError = {bannedMembersConfiguration?.hideError}
                statusIndicatorStyle = {bannedMembersConfiguration?.statusIndicatorStyle}
                avatarStyle = {bannedMembersConfiguration?.avatarStyle}
                listItemStyle = {bannedMembersConfiguration?.listItemStyle}
                bannedMemberStyle = {bannedMembersConfiguration?.bannedMembersStyle}
            />
        );
    }

    /**
     * Creates GroupMembers view
     */
    function getCometChatGroupMembers(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element | null {
        if (userOrGroup instanceof CometChat.User) {
            return null;
        }
        const options = groupMembersConfiguration?.options;
        /*
            These values are not present in the configuration, so will use the default values assigned internally by the component used
                backButton? : JSX.Element,
                title? : string,
                searchPlaceholder? : string,
                group : CometChat.Group,
                emptyStateText? : string,
                errorStateText? : string,
                tailView? : (groupMember : CometChat.GroupMember) => JSX.Element,
                onItemClick? : (groupMember : CometChat.GroupMember) => void,
                theme? : CometChatTheme

            The below properties were present in the configuration but not the component
                backdropStyle: BaseStyle
        */
        return (
            <CometChatGroupMembers 
                group = {userOrGroup}
                onClose = {groupMembersConfiguration?.onClose ?? onClose ?? undefined}
                onBack = {groupMembersConfiguration?.onBack ?? setPageToShowToNone}
                groupMemberRequestBuilder = {groupMembersConfiguration?.groupMembersRequestBuilder}
                searchRequestBuilder = {groupMembersConfiguration?.searchRequestBuilder}
                listItemView = {groupMembersConfiguration?.listItemView}
                subtitleView = {groupMembersConfiguration?.subtitleView}
                disableUsersPresence = {groupMembersConfiguration?.disableUsersPresence}
                menus = {groupMembersConfiguration?.menu}
                options = {!options ? undefined : (group : CometChat.Group, groupMember : CometChat.GroupMember) => options(groupMember)}
                backButtonIconURL = {groupMembersConfiguration?.backButtonIconURL}
                closeButtonIconURL = {groupMembersConfiguration?.closeButtonIconURL}
                showBackButton = {groupMembersConfiguration?.showBackButton}
                hideSeparator = {groupMembersConfiguration?.hideSeparator}
                selectionMode = {groupMembersConfiguration?.selectionMode}
                hideError = {groupMembersConfiguration?.hideError}
                searchIconURL = {groupMembersConfiguration?.searchIconURL}
                dropDownIconURL = {groupMembersConfiguration?.dropdownIconURL}
                hideSearch = {groupMembersConfiguration?.hideSearch}
                onError = {groupMembersConfiguration?.onError ?? undefined}
                onSelect = {groupMembersConfiguration?.onSelect}
                emptyStateView = {groupMembersConfiguration?.emptyStateView}
                errorSateView = {groupMembersConfiguration?.errorStateView}
                loadingIconURL = {groupMembersConfiguration?.loadingIconURL}
                loadingStateView = {groupMembersConfiguration?.loadingStateView}
                titleAlignment = {groupMembersConfiguration?.titleAlignment}
                statusIndicatorStyle = {groupMembersConfiguration?.statusIndicatorStyle}
                avatarStyle = {groupMembersConfiguration?.avatarStyle}
                groupMembersStyle = {groupMembersConfiguration?.groupMembersStyle}
                groupScopeStyle = {groupMembersConfiguration?.groupScopeStyle}
                listItemStyle = {groupMembersConfiguration?.listItemStyle}
            />
        );
    }

    /**
     * Creates view of the page to show
     */
    function getSelectedPage(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element | undefined {
        try {
            let resJSX : JSX.Element | null = null;
            switch(pageToShow) {
                case "addMembers": 
                    resJSX = getCometChatAddMembers(userOrGroup);
                    break;
                case "bannedMembers":
                    resJSX = getCometChatBannedMembers(userOrGroup);
                    break;
                case "groupMembers":
                    resJSX = getCometChatGroupMembers(userOrGroup);
                    break;
                case "none":
                    break;
                default: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const x : never = pageToShow;
                }
            }
            if (resJSX !== null) {
                return (
                    <div
                        className = "cc-details__page-wrapper"
                        style = {pageWrapperStyle()}
                    >
                        {resJSX}
                    </div>
                );
            }
        }
        catch(error) {
            errorHandler(error);
        }
    }

    /**
     * Set `modalInfo` state to `null`
     */
    function closeModal() : void {
        setModalInfo(null);
    }

    /**
     * Creates TransferOwnership view
     */
    function getCometChatTransferOwnership(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element | null {
        if (userOrGroup instanceof CometChat.User) {
            return null;
        }
        const options = transferOwnershipConfiguration?.options;
        /*
            These values are not present in the configuration, so will use the default values assigned internally by the component used
                backButton? : JSX.Element,
                showBackButton? : boolean,
                onBack? : () => void,
                title? : string,
                searchPlaceholder? : string,
                emptyStateText? : string,
                errorStateText? : string,
                backButtonIconURL? : string,
                transferButtonText? : string,
                cancelButtonText? : string
        */
        return (
            <CometChatTransferOwnership
                group = {userOrGroup}
                onTransferOwnership = {transferOwnershipConfiguration?.onTransferOwnership}
                titleAlignment = {transferOwnershipConfiguration?.titleAlignment}
                loadingIconURL = {transferOwnershipConfiguration?.loadingIconURL}
                loadingStateView = {transferOwnershipConfiguration?.loadingStateView}
                errorStateView = {transferOwnershipConfiguration?.errorStateView}
                emptyStateView = {transferOwnershipConfiguration?.emptyStateView}
                onError = {transferOwnershipConfiguration?.onError}
                hideSearch = {transferOwnershipConfiguration?.hideSearch}
                searchIconURL = {transferOwnershipConfiguration?.searchIconURL}
                hideSeparator = {transferOwnershipConfiguration?.hideSeparator}
                closeButtonIconURL = {transferOwnershipConfiguration?.closeButtonIconURL}
                disableUsersPresence = {transferOwnershipConfiguration?.disableUsersPresence}
                listItemView = {transferOwnershipConfiguration?.listItemView}
                subtitleView = {transferOwnershipConfiguration?.subtitleView}
                onClose = {transferOwnershipConfiguration?.onClose ?? closeModal}
                groupMembersRequestBuilder = {transferOwnershipConfiguration?.groupMembersRequestBuilder}
                searchRequestBuilder = {transferOwnershipConfiguration?.searchRequestBuilder}
                options = {!options ? undefined : (group : CometChat.Group, groupMember : CometChat.GroupMember) => options(groupMember)}
                statusIndicatorStyle = {transferOwnershipConfiguration?.statusIndicatorStyle}
                avatarStyle = {transferOwnershipConfiguration?.avatarStyle}
                listItemStyle = {transferOwnershipConfiguration?.listItemStyle}
                groupMemberStyle = {transferOwnershipConfiguration?.groupMemberStyle}
                transferOwnershipStyle = {transferOwnershipConfiguration?.transferOwnershipStyle}
            />
        );
    }

    /**
     * Creates modal view
     */
    function getModal(userOrGroup : CometChat.User | CometChat.Group) : JSX.Element | null | undefined {
        if (!modalInfo) {
            return null;
        }
        const { type } = modalInfo;
        try {
            switch(type) {
                case "leaveOrTransferConfirm":
                    return (
                        <cometchat-backdrop
                            backdropStyle = {JSON.stringify(backdropStyle(backdropStyleObject))}
                        >
                            <cometchat-confirm-dialog
                                ref = {setLeaveOrTransferConfirmDialog}
                                cancelButtonText = {cancelButtonText}
                                confirmButtonText = {modalInfo.buttonText}
                                messageText = {modalInfo.confirmDialogMessage}
                                confirmDialogStyle = {JSON.stringify(leaveDialogStyle(leaveDialogStyleObject, theme))}
                            />
                        </cometchat-backdrop>
                    );
                case "transferOwnership":
                    return (
                        <cometchat-backdrop
                            backdropStyle = {JSON.stringify(backdropStyle(backdropStyleObject))}
                        >
                            {getCometChatTransferOwnership(userOrGroup)}
                        </cometchat-backdrop>
                    );
                case "deleteConfirm":
                    return (
                        <cometchat-backdrop
                            backdropStyle = {JSON.stringify(backdropStyle(backdropStyleObject))}
                        >
                            <cometchat-confirm-dialog
                                ref = {setDeleteConfirmDialog}
                                cancelButtonText = {cancelButtonText}
                                confirmButtonText = {modalInfo.buttonText}
                                messageText = {modalInfo.confirmDialogMessage}
                                confirmDialogStyle = {JSON.stringify(deleteDialogStyle(deleteDialogStyleObject, theme))}
                            />
                        </cometchat-backdrop>
                    );
                default: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const x : never = type;
                }
            }
        }
        catch(error) {
            errorHandler(error);
        }
    }

    Hooks({
        setLoggedInUser,
        errorHandler,
        leaveOrTransferConfirmDialogElement,
        setModalInfo,
        handleLeaveOrTransferConfirmClick,
        deleteConfirmDialogElement,
        handleDeleteConfirmClick,
        userOrGroup
    });

    if (!userOrGroup) {
        return null;
    }

    return (
        <div
            className = "cc-details"
            style = {detailsStyle(detailsStyleObject, theme)}
        >
            {getHeaderView()}
            <div
                className = "cc-details__content"
                style = {detailsContentWrapperStyle(detailsStyleObject)}
            >
                {getProfileView(userOrGroup)}
                {getSectionList(userOrGroup)}
            </div>
            {getSelectedPage(userOrGroup)}
            {getModal(userOrGroup)}
        </div>
    );
}
