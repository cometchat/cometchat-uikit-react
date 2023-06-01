import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties, useCallback, useContext, useRef, useState, JSX } from "react";
import { CometChatGroupEvents, CometChatOption, CometChatUIKitConstants, localize, SelectionMode, TitleAlignment } from "uikit-resources-lerna";
import { CometChatUIKitUtility, GroupMembersStyle, TransferOwnershipStyle } from "uikit-utils-lerna";
import Close2xIcon from "./assets/close2x.svg";
import SpinnerIcon from "./assets/spinner.svg";
import SearchIcon from "./assets/search.svg";
import { CometChatContext } from "../CometChatContext";
import { CometChatGroupMembers } from "../CometChatGroupMembers";
import { Hooks } from "./hooks";
import { avatarStyle, btnsWrapperStyle, cancelBtnStyle, groupMembersStyle, listItemStyle, scopeLabelStyle, transferBtnStyle, transferOwnershipStyle } from "./style";
import { useCometChatErrorHandler, useRefSync } from "../CometChatCustomHooks";
import { CometChatButton } from "../Shared/Views/CometChatButton";

interface ITransferOwnershipProps {
    /**
     * Group to transfer ownership of
     */
    group : CometChat.Group,
    /** 
     * Title of the component 
     * 
     * @defaultValue `localize("TRANSFER_OWNERSHIP")` 
    */
    title? : string,
    /**
     * Alignment of the `title` text
     * 
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment? : TitleAlignment,
    /**
     * Image URL for the search icon to use in the search bar
     * 
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL? : string,
    /**
     * Text to be displayed when the search input has no value
     * 
     * @defaultValue `localize("SEARCH")`
     */
    searchPlaceholder? : string,
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
    groupMembersRequestBuilder? : CometChat.GroupMembersRequestBuilder,
    /**
     * Request builder with search parameters to fetch group members
     * 
     * @remarks
     * If the search input is not empty, 
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder? : CometChat.GroupMembersRequestBuilder,
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
     * Text to display in the default empty view
     * 
     * @defaultValue `localize("NO_USERS_FOUND")`
     */
    emptyStateText? : string,
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView? : JSX.Element,
    /**
     * Text to display in the default error view
     * 
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText? : string,
    /**
     * Custom view for the error state of the component
     */
    errorStateView? : JSX.Element,
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Hide the separator at the bottom of the default list item view
     * 
     * @defaultValue `false`
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
     * Custom list item view to be rendered for each group member in the fetched list
     */
    listItemView? : (groupMember : CometChat.GroupMember) => JSX.Element,
    /**
     * Custom subtitle view to be rendered for each group member in the fetched list
     *   
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView? : (groupMember : CometChat.GroupMember) => JSX.Element,
    // Later
    transferButtonText? : string,
    // Later
    onTransferOwnership? : (groupMember : CometChat.GroupMember) => void,
    /**
     * Text to display for the cancel button
     */
    cancelButtonText? : string,
    /** 
     * List of actions available on mouse over on the default list item component
     */
    options? : (group : CometChat.Group, groupMember : CometChat.GroupMember) => CometChatOption[],
    /**
     * Styles to apply to the status indicator component of the default list item view 
     */
    statusIndicatorStyle? : CSSProperties,
    /**
     * Styles to apply to the avatar component of the default list item view 
     */
    avatarStyle? : AvatarStyle,
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle? : ListItemStyle,
    /**
     * Styles to apply to the `CometChatGroupMembers` component
     */
    groupMemberStyle? : GroupMembersStyle,
    /**
     * Styles to apply to this component
     */
    transferOwnershipStyle? : TransferOwnershipStyle
};

/**
 * Renders transfer ownership view related to a group of a CometChat App 
 */
export function CometChatTransferOwnership(props : ITransferOwnershipProps) {
    const {
        group,
        title = localize("TRANSFER_OWNERSHIP"),
        titleAlignment = TitleAlignment.center,
        searchIconURL = SearchIcon,
        searchPlaceholder = localize("SEARCH"),
        hideSearch = false,
        groupMembersRequestBuilder,
        searchRequestBuilder,
        loadingIconURL = SpinnerIcon,
        loadingStateView,
        emptyStateText = localize("NO_USERS_FOUND"),
        emptyStateView,
        errorStateText = localize("SOMETHING_WRONG"),
        errorStateView,
        onError,
        hideSeparator = false,
        disableUsersPresence = false,
        closeButtonIconURL = Close2xIcon,
        onClose,
        listItemView,
        subtitleView,
        transferButtonText = localize("TRANSFER_OWNERSHIP"),
        onTransferOwnership,
        cancelButtonText = localize("CANCEL"),
        options,
        statusIndicatorStyle,
        avatarStyle : avatarStyleObject = null,
        listItemStyle : listItemStyleObject = null,
        groupMemberStyle : groupMembersStyleObject = null,
        transferOwnershipStyle : transferOwnershipStyleObject = null
    } = props;

    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
    const selectedMemberRef = useRef<CometChat.GroupMember | null>(null);
    const errorHandler = useCometChatErrorHandler(onError);
    const onTransferOwnershipPropRef = useRefSync(onTransferOwnership);
    const groupPropRef = useRefSync(group);
    const { theme } = useContext(CometChatContext);

    /**
     * Changes `selectedMemberRef` reference
     */
    function onSelect(groupMember : CometChat.GroupMember) : void {
        selectedMemberRef.current = groupMember;
    }

    /**
     * Creates tail view
     */
    function tailView(groupMember : CometChat.GroupMember) : JSX.Element {
        const scope = group.getOwner() === groupMember.getUid() ? CometChatUIKitConstants.groupMemberScope.owner : groupMember.getScope();  
        return (
            <cometchat-label
                text = {localize(scope.toUpperCase())}
                labelStyle = {JSON.stringify(scopeLabelStyle(transferOwnershipStyleObject, theme))}
            />
        );
    }

    /**
     * Provides a default behaviour to the `onTransferOwnership` prop
     */
    const onTransferOwnershipWrapper = useCallback(async () : Promise<void> => {
        const selectedMember = selectedMemberRef.current;
        if (!selectedMember) {
            return;
        }
        try {
            const onTransferOwnershipProp = onTransferOwnershipPropRef.current; 
            if (onTransferOwnershipProp) {
                onTransferOwnershipProp(selectedMember);
            }
            else {
                const currentGroup = groupPropRef.current;
                await CometChat.transferGroupOwnership(currentGroup.getGuid(), selectedMember.getUid());
                if (loggedInUser) {
                    const groupClone = CometChatUIKitUtility.clone(currentGroup);
                    groupClone.setOwner(selectedMember.getUid());
                    CometChatGroupEvents.ccOwnershipChanged.next({
                        group: groupClone,
                        newOwner: CometChatUIKitUtility.clone(selectedMember)
                    });
                }
            }
            selectedMemberRef.current = null;
        }
        catch(error) {
            errorHandler(error);
        }
    }, [errorHandler, loggedInUser, groupPropRef, onTransferOwnershipPropRef]);

    /**
     * Creates confirm button view
     */
    function getConfirmButtonView() : JSX.Element {
        return (
            <CometChatButton
                text = {transferButtonText}
                buttonStyle = {transferBtnStyle(transferOwnershipStyleObject, theme)}
                onClick = {onTransferOwnershipWrapper}
            />
        );
    }

    /**
     * Creates cancel button view
     */
    function getCancelButtonView() : JSX.Element {
        return (
            <CometChatButton 
                text = {cancelButtonText}
                buttonStyle = {cancelBtnStyle(transferOwnershipStyleObject, theme)}
                onClick = {onClose}
            />
        );
    }

    Hooks({
        errorHandler,
        setLoggedInUser
    });

    return (
        <div
            className = "cc-transfer-ownership"
            style = {transferOwnershipStyle(transferOwnershipStyleObject, theme)}
        >
            <CometChatGroupMembers
                menus = {undefined}
                hideError = {undefined}
                onItemClick = {undefined}
                dropDownIconURL = {undefined}
                groupScopeStyle = {undefined}
                backButton = {undefined}
                onBack = {undefined}
                backButtonIconURL = {undefined}
                showBackButton = {false}
                options = {options}
                group = {group}
                title = {title}
                titleAlignment = {titleAlignment}
                searchIconURL = {searchIconURL}
                searchPlaceholder = {searchPlaceholder}
                hideSearch = {hideSearch}
                groupMemberRequestBuilder = {groupMembersRequestBuilder}
                searchRequestBuilder = {searchRequestBuilder}
                loadingIconURL = {loadingIconURL}
                loadingStateView = {loadingStateView}
                emptyStateText = {emptyStateText}
                emptyStateView = {emptyStateView}
                errorStateText = {errorStateText}
                errorSateView = {errorStateView}
                onError = {errorHandler}
                hideSeparator = {hideSeparator}
                disableUsersPresence = {disableUsersPresence}
                closeButtonIconURL = {closeButtonIconURL}
                onClose = {onClose}
                selectionMode = {SelectionMode.single}
                onSelect = {onSelect}
                listItemView = {listItemView}
                subtitleView = {subtitleView}
                tailView = {tailView}
                statusIndicatorStyle = {statusIndicatorStyle}
                avatarStyle = {avatarStyle(avatarStyleObject, theme)}
                listItemStyle = {listItemStyle(listItemStyleObject, groupMembersStyleObject, theme)}
                groupMembersStyle = {groupMembersStyle(groupMembersStyleObject, theme)}
            />  
            <div
                className = "cc-transfer-ownership__btns-wrapper"
                style = {btnsWrapperStyle()}
            >
                {getConfirmButtonView()}
                {getCancelButtonView()}
            </div>
        </div>
    );
}
