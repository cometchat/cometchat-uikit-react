
import { CSSProperties, JSX, useCallback, useRef, useState } from "react";
import '../../styles/CometChatAddMembers/CometChatAddMembers.css';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useCometChatAddMembers } from "./useCometChatAddMembers";
import SearchIcon from "../../assets/search.svg";
import SpinnerIcon from "../../assets/Spinner.svg";
import backbutton from "../../assets/arrow_back.svg"
import closeButton from "../../assets/close2x.svg";
import { CometChatButton, CometChatGroupEvents, CometChatOption, CometChatUIKitConstants, CometChatUIKitUtility, CometChatUsers, SelectionMode, getLocalizedString, useCometChatErrorHandler, useRefSync } from "@cometchat/chat-uikit-react";

interface IAddMembersProps {
    /**
     * Image URL for the back button
     *
     * @remarks
     * This prop will also be used if `backButton` prop is not provided
     *
     * @defaultValue `./assets/backbutton.svg`
     */
    backButtonIconURL?: string,
    /**
     * Show back button
     *
     * @defaultValue `true`
     */
    showBackButton?: boolean,
    /**
     * Function to call when the back button is clicked
     */
    onBack?: () => void,
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean,
    /**
     * Image URL for the search icon to use in the search bar
     *
     * @defaultValue `./assets/search.svg`
     */
    searchIconURL?: string,
    /**
     * Show alphabetical header
     *
     * @defaultValue `false`
     */
    showSectionHeader?: boolean,
    /**
     * Property on the user object
     *
     * @remarks
     * This property will be used to extract the section header character from the user object
     *
     * @defaultValue `getName`
     */
    sectionHeaderField?: keyof CometChat.User,
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string,
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX.Element,

    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX.Element,
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX.Element,
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean,
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean,
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean,
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null,
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX.Element,
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: (user: CometChat.User) => CometChatOption[],
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.multiple`
     */
    selectionMode?: SelectionMode,
    /**
     * Function to call when a user from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (user: CometChat.User, selected: boolean) => void,
    /**
     * Request builder to fetch users
     *
     * @remarks
     * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
     * the search keyword of this request builder is set to the text in the search input
     *
     * @defaultValue Default request builder having the limit set to 30
     */
    usersRequestBuilder?: CometChat.UsersRequestBuilder,
    /**
     * Request builder with search parameters to fetch users
     *
     * @remarks
     * If the search input is not empty,
     * the search keyword of this request builder is set to the text in the search input
     */
    searchRequestBuilder?: CometChat.UsersRequestBuilder,
    /**
     * Custom list item view to be rendered for each user in the fetched list
     */
    listItemView?: (user: CometChat.User) => JSX.Element,
    /**
     * Custom subtitle view to be rendered for each user in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (user: CometChat.User) => JSX.Element,
    /**
     * Group to add members to
     */
    group: CometChat.Group,
    /**
     * Function to call when add button of the component is clicked
     *
     * @remarks
     * This function won't be call if no users are selected
     */
    onAddMembersButtonClick?: (guid: string, membersToAdd: CometChat.GroupMember[]) => void,
    /**
     * Text to display for the default add button
     *
     * @defaultValue `getLocalizedString("add_members")`
     */
    buttonText?: string,
    /**
     * Image URL for the close button
     *
     * @defaultValue `./assets/close2x.svg`
     */
    closeButtonIconURL?: string,
    /**
     * Function to call when the close button is clicked
     */
    onClose?: () => void,
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties,
};

/**
 * Renders a scrollable list of users to add to a group of a CometChat App
 */
export function CometChatAddMembers(props: IAddMembersProps) {
    const {
        showBackButton = false,
        onBack,
        hideSearch = false,
        showSectionHeader = false,
        sectionHeaderField = "getName",
        loadingStateView,
        emptyStateView,
        errorStateView,
        hideError = false,
        onError,
        options,
        selectionMode = SelectionMode.multiple,
        onSelect,
        usersRequestBuilder,
        searchRequestBuilder,
        listItemView,
        subtitleView,
        group,
        onAddMembersButtonClick = null,
        buttonText = getLocalizedString("add_members"),
    } = props;

    const membersToAddRef = useRef<CometChat.GroupMember[]>([]);
    const selectionModeRef = useRef(selectionMode);
    const loggedInUserRef = useRef<CometChat.User | null>(null);
    const onSelectPropRef = useRefSync(onSelect);
    const groupPropRef = useRefSync(group);
    const onBackPropRef = useRefSync(onBack);
    const onAddMembersButtonClickPropRef = useRefSync(onAddMembersButtonClick);
    const errorHandler = useCometChatErrorHandler(onError!);
    const [isLoading, setIsLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);
    const [isError, setIsError] = useState(false);
    /**
    /**
     * Creates a `CometChat.GroupMember` instance from the provided `user`
     */
    const createGroupMemberFromUser = useCallback((user: CometChat.User): CometChat.GroupMember => {
        const groupMember = new CometChat.GroupMember(user.getUid(), CometChatUIKitConstants.groupMemberScope.participant);
        groupMember.setName(user.getName());
        groupMember.setGuid(groupPropRef.current.getGuid());
        groupMember.setAvatar(user?.getAvatar())
        groupMember.setStatus(user.getStatus());
        return groupMember;
    }, [groupPropRef]);

    /**
     * Updates `membersToAddRef`
     *
     * @remarks
     * This function makes sure `membersToAddRef` is in sync with the UI
     */
    const onSelectWrapper = useCallback((user: CometChat.User, selected: boolean): void => {

        if (onSelectPropRef.current) {
            return onSelectPropRef.current(user, selected);
        }
        if (selectionModeRef.current === SelectionMode.single) {
            membersToAddRef.current = [createGroupMemberFromUser(user)];
        }
        else if (selectionModeRef.current === SelectionMode.multiple) {
            updateAddMembersList(user);
        }
        if (membersToAddRef.current.length == 0) {
            setIsDisabled(true)
        }
        else {
            setIsDisabled(false);
        }
    }, [createGroupMemberFromUser, onSelectPropRef]);

    const updateAddMembersList = (user: CometChat.User) => {
        const targetUid = user.getUid();
        const tmpMembersToAddList: CometChat.GroupMember[] = [];
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

    /**
     * Creates a `CometChat.Action` instance
     */
    const createActionMessage = useCallback((actionOn: CometChat.GroupMember, loggedInUser: CometChat.User, group: CometChat.Group): CometChat.Action => {
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
    const onAddBtnClickWrapper = useCallback(async (): Promise<void> => {
        if (membersToAddRef.current.length === 0) {
            return;
        }
        setIsLoading(true);
        setIsError(false);
        try {
            const group = groupPropRef.current;
            const onAddBtnClick = onAddMembersButtonClickPropRef.current;
            if (onAddBtnClick) {
                onAddBtnClick(group.getGuid(), membersToAddRef.current);
                membersToAddRef.current = [];
                return;
            }
            const UIDsToRemove: Set<string> = new Set();
            const response = await CometChat.addMembersToGroup(group.getGuid(), membersToAddRef.current, []);
            setIsLoading(false);
            if (response) {
                for (const key in response) {
                    if ((response as any)[key] === "success") {
                        UIDsToRemove.add(key);
                    }
                }
            }
            const addedMembers: CometChat.GroupMember[] = [];
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
        catch (error) {
            setIsLoading(false);
            setIsError(true);
            errorHandler(error);
        }
    }, [errorHandler, createActionMessage, groupPropRef, onAddMembersButtonClickPropRef, onBackPropRef]);

    /**
     * Creates back button view
     */
    function getBackBtnView(): JSX.Element | null {
        if (!showBackButton) {
            return null;
        }
        return (
            <div className="cometchat-add-members__back-button">
                <CometChatButton
                    iconURL={backbutton}
                    onClick={onBack}
                />
            </div>
        );
    }

    /**
     * Creates add members button view
     */
    function getAddMembersBtnView() {
        return (
            <div className={`cometchat-add-members__add-btn-wrapper ${isDisabled ? "cometchat-add-members__add-btn-wrapper-disabled" : ""}`}>
                <CometChatButton
                    isLoading={isLoading}
                    text={buttonText}
                    onClick={onAddBtnClickWrapper}
                />
            </div>
        );
    }

    const onUsersSelected = (user: CometChat.User) => {
        updateAddMembersList(user);
        if (membersToAddRef.current.length == 0) {
            setIsDisabled(true)
        }
        else {
            setIsDisabled(false);
        }
    }

    useCometChatAddMembers({
        loggedInUserRef,
        errorHandler,
        selectionMode,
        selectionModeRef,
        membersToAddRef
    });

    return (
        <div
            className="cometchat-add-members"
        >
            <CometChatUsers
                hideSearch={hideSearch}
                showSectionHeader={showSectionHeader}
                sectionHeaderKey={sectionHeaderField}
                loadingView={loadingStateView}
                emptyView={emptyStateView}
                errorView={errorStateView}
                hideError={hideError}
                onError={onError}
                options={options}
                selectionMode={selectionMode}
                onSelect={onSelectWrapper}
                usersRequestBuilder={usersRequestBuilder}
                searchRequestBuilder={searchRequestBuilder}
                itemView={listItemView}
                subtitleView={subtitleView}
                onItemClick={onUsersSelected}
                activeUser={undefined}

            />
            {isError ? <div className="cometchat-add-members_error-view">
                {getLocalizedString("member_error_subtitle")}
            </div> : null}
            {getAddMembersBtnView()}
            {getBackBtnView()}
        </div>
    );
}
