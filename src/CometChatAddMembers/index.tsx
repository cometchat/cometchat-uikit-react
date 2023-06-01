import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, ListItemStyle } from "my-cstom-package-lit";
import { CSSProperties, useCallback, useContext, useRef, JSX } from "react";
import { CometChatGroupEvents, CometChatOption, CometChatUIKitConstants, localize, SelectionMode, TitleAlignment } from "uikit-resources-lerna";
import { AddMembersStyle, CometChatUIKitUtility } from "uikit-utils-lerna";
import BackButtonIcon from "./assets/backbutton.svg";
import CloseIcon from "./assets/close2x.svg";
import SpinnerIcon from "./assets/spinner.svg";
import SearchIcon from "./assets/search.svg";
import { CometChatContext } from "../CometChatContext";
import { CometChatUsers } from "../CometChatUsers";
import { Hooks } from "./hooks";
import { addMembersButtonStyle, addMembersStyle, closeBtnStyle, defaultBackBtnStyle, usersStyle } from "./style";
import { useCometChatErrorHandler, useRefSync } from "../CometChatCustomHooks";
import { CometChatButton } from "../Shared/Views/CometChatButton";

interface IAddMembersProps {
    /**
     * Image URL for the back button
     * 
     * @remarks
     * This prop will also be used if `backButton` prop is not provided
     * 
     * @defaultValue `./assets/backbutton.svg`
     */
    backButtonIconURL? : string,
    /**
     * Show back button
     * 
     * @defaultValue `true`
     */
    showBackButton? : boolean,
    /**
     * Function to call when the back button is clicked
     */
    onBack? : () => void,
    /** 
     * Title of the component 
     * 
     * @defaultValue `localize("ADD_MEMBERS")` 
    */
    title? : string,
    /**
     * Alignment of the `title` text
     * 
     * @defaultValue `TitleAlignment.center`
     */
    titleAlignment? : TitleAlignment,
    /**
     * Hide the search bar
     * 
     * @defaulValue `false`
     */
    hideSearch? : boolean,
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
     * Show alphabetical header
     * 
     * @defaultValue `false`
     */
    showSectionHeader? : boolean,
    /**
     * Property on the user object
     * 
     * @remarks
     * This property will be used to extract the section header character from the user object 
     * 
     * @defaultValue `getName`
     */
    sectionHeaderField? : keyof CometChat.User,
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
     * Hide error view
     * 
     * @remarks
     * If set to true, hides the default and the custom error view
     * 
     * @defaultValue `false`
     */
    hideError? : boolean,
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
     * Hide the separator at the bottom of the default list item view
     * 
     * @defaultValue `false`
     */
    hideSeparator? : boolean,
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Custom view to render on the top-right of the component
     */
    menus? : JSX.Element,
    /** 
     * List of actions available on mouse over on the default list item component
     */
    options? : (user : CometChat.User) => CometChatOption[],
    /**
     * Selection mode to use for the default tail view
     * 
     * @remarks
     * This prop is used if `listItemView` prop is not provided. 
     * 
     * @defaultValue `SelectionMode.multiple`
     */
    selectionMode? : SelectionMode,
    /**
     * Function to call when a user from the fetched list is selected 
     *  
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect? : (user : CometChat.User) => void,
    /**
     * Request builder to fetch users
     * 
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     * 
     * @defaultValue Default request builder having the limit set to 30
     */
    usersRequestBuilder? : CometChat.UsersRequestBuilder,
    /**
     * Request builder with search parameters to fetch users
     * 
     * @remarks
     * If the search input is not empty, 
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder? : CometChat.UsersRequestBuilder,
    /**
     * Custom list item view to be rendered for each user in the fetched list
     */
    listItemView? : (user : CometChat.User) => JSX.Element,
    /**
     * Custom subtitle view to be rendered for each user in the fetched list
     *   
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView? : (user : CometChat.User) => JSX.Element,
    /**
     * Group to add members to
     */
    group : CometChat.Group,
    /**
     * Function to call when add button of the component is clicked
     * 
     * @remarks
     * This function won't be call if no users are selected
     */
    onAddMembersButtonClick? : (guid : string, membersToAdd : CometChat.GroupMember[]) => void,
    /**
     * Text to display for the default add button
     * 
     * @defaultValue `localize("ADD_MEMBERS")`
     */
    buttonText? : string,
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
     * Styles to apply to this component
     */
    addMembersStyle? : AddMembersStyle
};

/**
 * Renders a scrollable list of users to add to a group of a CometChat App
 */
export function CometChatAddMembers(props : IAddMembersProps) {
    const {
        backButtonIconURL = BackButtonIcon,
        showBackButton = true,
        onBack,
        title = localize("ADD_MEMBERS"),
        titleAlignment = TitleAlignment.center,
        hideSearch = false,
        searchIconURL = SearchIcon,
        searchPlaceholder = localize("SEARCH"),
        showSectionHeader = false,
        sectionHeaderField = "getName",
        loadingIconURL = SpinnerIcon,
        loadingStateView,
        emptyStateText = localize("NO_USERS_FOUND"),
        emptyStateView,
        errorStateText = localize("SOMETHING_WRONG"),
        errorStateView,
        hideError = false,
        disableUsersPresence = false,
        hideSeparator = false,
        onError,
        menus,
        options,
        selectionMode = SelectionMode.multiple,
        onSelect,
        usersRequestBuilder,
        searchRequestBuilder,
        listItemView,
        subtitleView,
        group,
        onAddMembersButtonClick = null,
        buttonText = localize("ADD_MEMBERS"),
        closeButtonIconURL = CloseIcon,
        onClose,
        statusIndicatorStyle,
        avatarStyle,
        listItemStyle,
        addMembersStyle : addMembersStyleObject = null
    } = props;

    const membersToAddRef = useRef<CometChat.GroupMember[]>([]);
    const selectionModeRef = useRef(selectionMode);
    const loggedInUserRef = useRef<CometChat.User | null>(null);
    const onSelectPropRef = useRefSync(onSelect);
    const groupPropRef = useRefSync(group);
    const onBackPropRef = useRefSync(onBack);
    const onAddMembersButtonClickPropRef = useRefSync(onAddMembersButtonClick);
    const errorHandler = useCometChatErrorHandler(onError);
    const { theme } = useContext(CometChatContext);

    /**
     * Creates a `CometChat.GroupMember` instance from the provided `user`
     */
    const createGroupMemberFromUser = useCallback((user : CometChat.User) : CometChat.GroupMember => {
        const groupMember = new CometChat.GroupMember(user.getUid(), CometChatUIKitConstants.groupMemberScope.participant);
        groupMember.setName(user.getName());
        groupMember.setGuid(groupPropRef.current.getGuid());
        return groupMember;
    }, [groupPropRef]);

    /**
     * Updates `membersToAddRef`
     * 
     * @remarks
     * This function makes sure `membersToAddRef` is in sync with the UI
     */
    const onSelectWrapper = useCallback((user : CometChat.User) : void => {
        if (onSelectPropRef.current) {
            return onSelectPropRef.current(user);
        }
        if (selectionModeRef.current === SelectionMode.single) {
            membersToAddRef.current = [createGroupMemberFromUser(user)];
        }
        else if (selectionModeRef.current === SelectionMode.multiple) {
            const targetUid = user.getUid();
            const tmpMembersToAddList : CometChat.GroupMember[] = [];
            let updated = false;
            for (let i = 0; i < membersToAddRef.current.length; i++) {
                const curMember = membersToAddRef.current[i];
                if (targetUid === curMember.getUid()) {
                    updated = true;
                }
                else {
                    tmpMembersToAddList.push(curMember);
                }
            }
            if (!updated) {
                tmpMembersToAddList.push(createGroupMemberFromUser(user));
            }
            membersToAddRef.current = tmpMembersToAddList;
        }
    }, [createGroupMemberFromUser, onSelectPropRef]);

    /**
     * Creates a `CometChat.Action` instance
     */
    const createActionMessage = useCallback((actionOn : CometChat.GroupMember, loggedInUser : CometChat.User, group : CometChat.Group) : CometChat.Action => {
        const actionMessage = new CometChat.Action(
            group.getGuid(),
            CometChatUIKitConstants.MessageTypes.groupMember,
            CometChatUIKitConstants.MessageReceiverType.group,
            CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
        );
        actionMessage.setAction(CometChatUIKitConstants.groupMemberAction.ADDED);
        actionMessage.setActionBy(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setActionFor(CometChatUIKitUtility.clone(group));
        actionMessage.setActionOn(CometChatUIKitUtility.clone(actionOn));
        actionMessage.setReceiver(CometChatUIKitUtility.clone(group));
        actionMessage.setSender(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setConversationId("group_" + group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setMessage(`${loggedInUser.getName()} added ${actionOn.getUid()}`);
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        return actionMessage;
    }, []);

    /**
     * Provides a default behaviour to the `onAddMembersButtonClick` prop
     */
    const onAddBtnClickWrapper = useCallback(async () : Promise<void> => {
        if (membersToAddRef.current.length === 0) {
            return;
        }
        try {
            const group = groupPropRef.current;
            const onAddBtnClick = onAddMembersButtonClickPropRef.current; 
            if (onAddBtnClick) {
                onAddBtnClick(group.getGuid(), membersToAddRef.current);
                membersToAddRef.current = [];
                return;
            }
            const UIDsToRemove : Set<string> = new Set();
            const response = await CometChat.addMembersToGroup(group.getGuid(), membersToAddRef.current, []);
            if (response) {
                for (const key in response) {
                    if ((response as any)[key] === "success") {
                       UIDsToRemove.add(key); 
                    }
                }
            }
            const addedMembers : CometChat.GroupMember[] = [];
            for (let i = 0; i < membersToAddRef.current.length; i++) {
                const curMember = membersToAddRef.current[i];
                if (UIDsToRemove.has(curMember.getUid())) {
                    addedMembers.push(curMember);
                }
            }
            const loggedInUser = loggedInUserRef.current;        
            if (loggedInUser) {
                const groupClone = CometChatUIKitUtility.clone(group);
                groupClone.setMembersCount(group.getMembersCount() + addedMembers.length);
                CometChatGroupEvents.ccGroupMemberAdded.next({
                    messages: addedMembers.map(addedMember => createActionMessage(addedMember, loggedInUser, groupClone)),
                    usersAdded: addedMembers,
                    userAddedIn: groupClone,
                    userAddedBy: CometChatUIKitUtility.clone(loggedInUser)
                });
            }
            membersToAddRef.current = [];
            onBackPropRef.current?.();
        }
        catch(error) {
            errorHandler(error);
        }
    }, [errorHandler, createActionMessage, groupPropRef, onAddMembersButtonClickPropRef, onBackPropRef]);

    /**
     * Creates back button view
     */
    function getBackBtnView() : JSX.Element | null {
        if (!showBackButton) {
            return null;
        }
        return (
            <CometChatButton 
                iconURL = {backButtonIconURL}
                buttonStyle = {defaultBackBtnStyle(addMembersStyleObject, theme)}
                onClick = {onBack}
            />
        );
    }

    /**
     * Creates add members button view
     */
    function getAddMembersBtnView() {
        return (
            <div
                className = "cc-add-members__add-btn-wrapper"
            >
                <CometChatButton 
                    text = {buttonText}
                    buttonStyle = {addMembersButtonStyle(addMembersStyleObject, theme)}
                    onClick = {onAddBtnClickWrapper}
                />
            </div>
        );
    }

    /**
     * Creates close button view
     */
    function getCloseBtnView() {
        return (
            <CometChatButton 
                iconURL = {closeButtonIconURL}
                buttonStyle = {closeBtnStyle(addMembersStyleObject, theme)}
                onClick = {onClose}
            />
        );
    }

    Hooks({
        loggedInUserRef,
        errorHandler,
        selectionMode,
        selectionModeRef,
        membersToAddRef
    });

    return (
        <div
            className = "cc-add-members"
            style = {addMembersStyle(addMembersStyleObject, theme)}
        >
            <CometChatUsers
                title = {title}
                tileAlignment = {titleAlignment}
                hideSearch = {hideSearch}
                searchIconURL = {searchIconURL}
                searchPlaceholderText = {searchPlaceholder}
                showSectionHeader = {showSectionHeader}
                sectionHeaderKey = {sectionHeaderField}
                loadingIconURL = {loadingIconURL}
                loadingStateView = {loadingStateView}
                emptyStateText = {emptyStateText}
                emptyStateView = {emptyStateView}
                errorStateText = {errorStateText}
                errorStateView = {errorStateView}
                hideError = {hideError}
                disableUsersPresence = {disableUsersPresence}
                hideSeparator = {hideSeparator}
                onError = {onError ?? undefined}
                menus = {menus}
                options = {options}
                selectionMode = {selectionMode}
                onSelect = {onSelectWrapper}
                usersRequestBuilder = {usersRequestBuilder}
                searchRequestBuilder = {searchRequestBuilder}
                listItemView = {listItemView}
                subtitleView = {subtitleView}
                statusIndicatorStyle = {statusIndicatorStyle}
                avatarStyle = {avatarStyle}
                listItemStyle = {listItemStyle}
                usersStyle = {usersStyle(addMembersStyleObject, theme)}
                onItemClick = {undefined}
                activeUser = {undefined}
            />
            {getAddMembersBtnView()}
            {getBackBtnView()}
            {getCloseBtnView()}
        </div>
    );
}
