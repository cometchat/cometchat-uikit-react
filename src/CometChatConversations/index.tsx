import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle, BadgeStyle, BaseStyle, ConfirmDialogStyle, DateStyle, ListItemStyle, ReceiptStyle } from "my-cstom-package-lit";
import { CSSProperties, useCallback, useContext, useReducer, useRef, JSX } from "react";
import { CometChatOption, CometChatUIKitConstants, DatePatterns, localize } from "uikit-resources-lerna";
import { CometChatSoundManager, CometChatUIKitUtility, ConversationsStyle, ConversationUtils, MessageReceiptUtils, SelectionMode, States, TitleAlignment } from "uikit-utils-lerna";
import { ChatConfigurator } from "../Shared/Framework/ChatConfigurator"; 
import MessageDeliveredIcon from "./assets/message-delivered.svg";
import SpinnerIcon from "./assets/spinner.svg";
import LockedIcon from "./assets/locked.svg";
import PrivateIcon from "./assets/private.svg";
import ThreadIcon from "./assets/thread-icon.svg";
import WaitIcon from "./assets/wait.svg";
import WarningSmallIcon from "./assets/warning-small.svg";
import MessageReadIcon from "./assets/message-read.svg";
import MessageSentIcon from "./assets/message-sent.svg";
import { CometChatContext } from "../CometChatContext";
import { CometChatList } from "../Shared/Views/CometChatList";
import { ConversationsManager } from "./controller";
import { Hooks } from "./hooks";
import { avatarStyle, backdropStyle, badgeStyle, confirmDialogStyle, conversationsWrapperStyle, dateStyle, defaultSelectionModeNoneTailViewContainerStyle, iconStyle, itemThreadIndicatorStyle, listItemStyle, listStyle, menuListStyle, menusStyle, receiptStyle, statusIndicatorStyle, subtitleReceiptAndTextContainerStyle, subtitleTextStyle, threadViewStyle } from "./style";
import { useCometChatErrorHandler, useRefSync, useStateRef } from "../CometChatCustomHooks";
import { CometChatListItem } from "../Shared/Views/CometChatListItem";
import { CometChatMenuList } from "../Shared/Views/CometChatMenuList";
import { CometChatRadioButton } from "../Shared/Views/CometChatRadioButton";
import { CometChatCheckbox } from "../Shared/Views/CometChatCheckbox";

type Message = CometChat.TextMessage | 
               CometChat.MediaMessage |
               CometChat.CustomMessage |
               CometChat.Action |
               CometChat.Call;

interface IConversationsProps {
    /**
     * Custom view to render on the top-right of the component
     */
    menus? : JSX.Element,
    /** 
     * Title of the component 
     * 
     * @defaultValue `localize("CHATS")` 
    */
    title? : string,
    /**
     * Alignment of the `title` text
     * 
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment? : TitleAlignment,
    /**
     * Request builder to fetch conversations
     * @defaultValue Default request builder having the limit set to 30
     */
    conversationsRequestBuilder? : CometChat.ConversationsRequestBuilder,
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Custom list item view to be rendered for each conversation in the fetched list
     */
    listItemView? : (conversation : CometChat.Conversation) => JSX.Element,
    /**
     * Custom subtitle view to be rendered for each conversation in the fetched list
     *   
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView? : (conversation : CometChat.Conversation) => JSX.Element,
    /**
     * Hide user presence
     * 
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed for conversation objects related to users
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
     * Conversation to highlight 
     * 
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeConversation? : CometChat.Conversation,
    /**
     * Selection mode to use for the default tail view
     * 
     * @remarks
     * This prop is used if `listItemView` prop is not provided. 
     * 
     * @defaultValue `SelectionMode.none`
     */
    selectionMode? : SelectionMode,
    /**
     * Disable receipt status
     * 
     * @remarks
     * If set to true, the receipt status of the sent message won't be displayed, and received messages won't be marked as delivered 
     * 
     * @defaultValue `false`
     */
    disableReceipt? : boolean,
    /** 
     * List of actions available on mouse over on the default list item component
     */
    options? : (conversation : CometChat.Conversation) => CometChatOption[],
    /**
     * Date format for the date component
     * 
     * @remarks
     * The date component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    datePattern? : DatePatterns,
    /**
     * Image URL for the status indicator icon in the default list item view of a conversation related to a password-protected group
     * 
     * @defaultValue `./assets/locked.svg`
     */
    protectedGroupIcon? : string,
    /**
     * Image URL for the status indicator icon in the default list item view of a conversation related to a private group
     * 
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon? : string,
    /**
     * Image URL for the read status of the sent message
     * 
     * @defaultValue `./assets/message-read.svg`
     */
    readIcon? : string,
    /**
     * Image URL for the delivered status of the sent message
     * 
     * @defaultValue `./assets/message-delivered.svg`
     */
    deliveredIcon? : string,
    /**
     * Image URL for the wait status of the sent message
     * 
     * @defaultValue `./assets/wait.svg`
     */
    waitIcon? : string,
    /**
     * Image URL for the error status of the sent message
     * 
     * @defaultValue `./assets/warning-small.svg`
     */
    errorIcon? : string,
    /**
     * Image URL for the sent status of the sent message
     * 
     * @defaultValue `./assets/message-sent.svg`
     */
    sentIcon? : string,
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
     * @defaultValue `localize("NO_CHATS_FOUND")`
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
     * Function to call on click of the default list item view of a conversation
     */
    onItemClick? : (conversation : CometChat.Conversation) => void,
    /**
     * Function to call when a conversation from the fetched list is selected 
     *  
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect? : (conversation : CometChat.Conversation) => void,
    /**
     * Disable sound for incoming messages
     * 
     * @defaulValue `false`
     */
    disableSoundForMessages? : boolean,
    /**
     * Disable typing indicator display
     * 
     * @defaultValue `false`
     */
    disableTyping? : boolean,
    /**
     * Custom audio sound for incoming messages
     */
    customSoundForMessages? : string,
    /**
     * Styles to apply to this component 
     */
    conversationsStyle? : ConversationsStyle,
    /**
     * Styles to apply to the delete conversation dialog component
     */
    deleteConversationDialogStyle? : ConfirmDialogStyle,
    /**
     * Styles to apply to the avatar component of the default list item view 
     */
    avatarStyle? : AvatarStyle,
    /**
     * Styles to apply to the status indicator component of the default list item view 
     */
    statusIndicatorStyle? : CSSProperties,
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle? : ListItemStyle,
    /**
     * Styles to apply to the badge component
     * 
     * @remarks
     * The badge component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    badgeStyle? : BadgeStyle,
    /**
     * Styles to apply to the receipt component
     * 
     * @remarks
     * The receipt component is rendered conditionally inside the subtitle view of the default list item view
     */
    receiptStyle? : ReceiptStyle,
    /**
     * Styles to apply to the date component
     * 
     * @remarks
     * The date component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    dateStyle? : DateStyle,
    /**
     * Styles to apply to the backdrop component
     */
    backdropStyle? : BaseStyle,
    confirmDialogTitle? : string,
    confirmDialogMessage? : string,
    cancelButtonText? : string,
    confirmButtonText? : string
};

type State = {
    conversationList: CometChat.Conversation[],
    fetchState : States,
    typingIndicatorMap : Map<string, CometChat.TypingIndicator>,
    conversationToBeDeleted : CometChat.Conversation | null,
    loggedInUser : CometChat.User | null
};

export type Action = {type : "appendConversations", conversations : CometChat.Conversation[]} |
                     {type : "setConversationList", conversationList : CometChat.Conversation[]} |
                     {type : "setFetchState", fetchState : States} |
                     {type : "setConversationToBeDeleted", conversation : CometChat.Conversation | null} |
                     {type : "removeConversation", conversation : CometChat.Conversation} |
                     {type : "updateConversationWithUser", user : CometChat.User} |
                     {type : "fromUpdateConversationListFn", conversation : CometChat.Conversation} |
                     {type : "addTypingIndicator", typingIndicator : CometChat.TypingIndicator} |
                     {type : "removeTypingIndicator", typingIndicator : CometChat.TypingIndicator} |
                     {type : "updateConversationLastMessage", message : CometChat.BaseMessage} |
                     {type : "updateConversationLastMessageAndPlaceAtTheTop", message : CometChat.BaseMessage} |
                     {type : "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group : CometChat.Group, message : CometChat.Action} |
                     {type : "removeConversationOfTheGroup", group : CometChat.Group} |
                     {type : "removeConversationOfTheUser", user : CometChat.User} |
                     {type : "updateConversationLastMessageResetUnreadCountAndPlaceAtTheTop", message : CometChat.BaseMessage} |
                     {type : "resetUnreadCountAndSetReadAtIfLastMessage", message : CometChat.BaseMessage} |
                     {type : "setLastMessageReadOrDeliveredAt", updateReadAt : boolean, messageReceipt : CometChat.MessageReceipt} |
                     {type : "setLoggedInUser", loggedInUser : CometChat.User | null};

/**
 * Checks if `message` is a base message
 * 
 * @remarks
 * `CometChat.BaseMessage` is private hence, can't use it with `instanceOf`. 
 * This function is identical to `message instanceOf CometChat.BaseMessage` if `CometChat.BaseMessage` wasn't private
 * 
 * @param message - A pontential Base message object
 * @returns Is `message` a base message
 */
function isAMessage(message : unknown) : message is Message {
    return (
        message instanceof CometChat.TextMessage ||
        message instanceof CometChat.MediaMessage ||
        message instanceof CometChat.CustomMessage ||
        message instanceof CometChat.Action ||
        message instanceof CometChat.Call
    );
}

function stateReducer(state : State, action : Action) : State {
    let newState = state;
    const { type } = action;
    switch(type) {
        case "appendConversations":
            if (action.conversations.length > 0) {
                newState = {...state, conversationList: [...state.conversationList, ...action.conversations]};
            }
            break;
        case "setConversationList": {
            const { typingIndicatorMap } = state;
            const { conversationList } = action;
            const newTypingIndicatorMap = new Map<string, CometChat.TypingIndicator>();
            for (let i = 0; i < conversationList.length; i++) {
                const convWith = conversationList[i].getConversationWith();
                const convWithId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
                if (typingIndicatorMap.has(convWithId)) {
                    newTypingIndicatorMap.set(convWithId, typingIndicatorMap.get(convWithId)!);
                }
            }
            newState = {...state, conversationList, typingIndicatorMap: newTypingIndicatorMap};
            break;
        }
        case "setFetchState":
            newState = {...state, fetchState: action.fetchState};
            break;
        case "setConversationToBeDeleted":
            newState = {...state, conversationToBeDeleted: action.conversation};
            break;
        case "removeConversation": {
            const { typingIndicatorMap, conversationList } = state;
            const targetConvId = action.conversation.getConversationId();
            const targetIdx = conversationList.findIndex(conv => conv.getConversationId() === targetConvId);
            if (targetIdx > -1) {
                const convWith = conversationList[targetIdx].getConversationWith();
                const convWithId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
                let newTypingIndicatorMap : Map<string, CometChat.TypingIndicator>;
                if (typingIndicatorMap.has(convWithId)) {
                    newTypingIndicatorMap = new Map(typingIndicatorMap);
                    newTypingIndicatorMap.delete(convWithId);
                }
                else {
                    newTypingIndicatorMap = typingIndicatorMap;
                }
                const newConversationList = state.conversationList.filter((conv, i) => i !== targetIdx);
                newState = {...state, conversationList: newConversationList, typingIndicatorMap: newTypingIndicatorMap};
            }
            break;
        }
        case "updateConversationWithUser": {
            const { user } = action;
            const { conversationList } = state;
            const targetUid = user.getUid();
            const targetIdx = conversationList.findIndex(conv => {
                const convWith = conv.getConversationWith();
                return convWith instanceof CometChat.User && convWith.getUid() === targetUid; 
            });
            if (targetIdx > -1) {
                const newConversationList = conversationList.map((conv, i) => {
                    if (i === targetIdx) {
                        const newConv = CometChatUIKitUtility.clone(conv);
                        newConv.setConversationWith(user);
                        return newConv;
                    }
                    return conv;
                });
                newState = {...state, conversationList: newConversationList};
            }
            break;
        }
        case "fromUpdateConversationListFn": {
            const { conversation } = action;
            const targetId = conversation.getConversationId();
            const conversations = state.conversationList.filter(conv => {
                if (conv.getConversationId() !== targetId) {
                    return true;
                } 
                conversation.setUnreadMessageCount(conversation.getUnreadMessageCount() + conv.getUnreadMessageCount());
                return false;
            });
            newState = {...state, conversationList: [conversation, ...conversations]};
            break;
        }
        case "setLastMessageReadOrDeliveredAt": {
            const { conversationList } = state;
            const { messageReceipt, updateReadAt } = action;
            const targetMessageId = messageReceipt.getMessageId();
            const targetIdx = conversationList.findIndex(conv => {
                if (conv.getConversationWith() instanceof CometChat.User) {
                    const lastMessage = conv.getLastMessage();
                    if (isAMessage(lastMessage) && String(lastMessage.getId()) === targetMessageId) {
                        return updateReadAt ? !lastMessage.getReadAt() : !lastMessage.getDeliveredAt();
                    }   
                }
                return false;
            }); 
            if (targetIdx > -1) {
                newState = {...state, conversationList: conversationList.map((conv, i) => {
                    if (i === targetIdx) {
                        const newConv = CometChatUIKitUtility.clone(conv);
                        const lastMessage = newConv.getLastMessage();
                        if (isAMessage(lastMessage)) {
                            if (updateReadAt) {
                                lastMessage.setReadAt(messageReceipt.getReadAt());
                            }
                            else {
                                lastMessage.setDeliveredAt(messageReceipt.getDeliveredAt());
                            }
                        }
                        return newConv;
                    } 
                    return conv;
                })};
            }
            break;
        }
        case "addTypingIndicator": {
            // Make sure sender is not the logged-in user before executing this block
            const { typingIndicator } = action;
            const senderId =  typingIndicator.getSender().getUid();
            const isReceiverTypeGroup = typingIndicator.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group;
            const receiverId = typingIndicator.getReceiverId();
            let id : string | undefined;
            const { conversationList, typingIndicatorMap } = state;
            for (let i = 0; i < conversationList.length; i++) {
                const convWith = conversationList[i].getConversationWith();
                if (isReceiverTypeGroup) {
                    if (convWith instanceof CometChat.Group && convWith.getGuid() === receiverId) {
                        id = convWith.getGuid();
                        break;
                    }
                }
                else if (convWith instanceof CometChat.User && convWith.getUid() === senderId) {
                    id = convWith.getUid();
                    break;
                } 
            }
            if (id !== undefined) {
                const newTypingIndicatorMap = new Map<string, CometChat.TypingIndicator>(typingIndicatorMap);
                newTypingIndicatorMap.set(id, typingIndicator);
                newState = {...state, typingIndicatorMap: newTypingIndicatorMap};
            }
            break;
        }
        case "removeTypingIndicator": {
            const { typingIndicatorMap } = state;
            const { typingIndicator } = action;
            const senderId = typingIndicator.getSender().getUid();
            const receiverId = typingIndicator.getReceiverId();
            let id : string | undefined;
            if (typingIndicator.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user) {
                if (typingIndicatorMap.has(senderId)) {
                    id = senderId;
                }
            }
            else if (typingIndicatorMap.get(receiverId)?.getSender().getUid() === senderId) {
                id = receiverId;
            }
            if (id !== undefined) {
                const newTypingIndicatorMap = new Map<string, CometChat.TypingIndicator>(typingIndicatorMap);
                newTypingIndicatorMap.delete(id);
                newState = {...state, typingIndicatorMap: newTypingIndicatorMap};
            }
            break;
        }
        case "updateConversationLastMessage": {
            const { message } = action;
            const targetMessageId = message.getId();
            const { conversationList } = state;
            const targetIdx = conversationList.findIndex(conv => {
                const lastMessage = conv.getLastMessage();
                return isAMessage(lastMessage) && lastMessage.getId() === targetMessageId;
            });
            if (targetIdx > -1) {
                newState = {...state, conversationList: conversationList.map((conv, i) => {
                    if (i === targetIdx) {
                        const newConv = CometChatUIKitUtility.clone(conv);
                        newConv.setLastMessage(message);
                        return newConv;
                    }
                    return conv;
                })}
            }
            break;
        }
        case "updateConversationLastMessageAndGroupAndPlaceAtTheTop": {
            const { conversationList } = state;
            const { group, message } = action;
            const targetConversationId = message.getConversationId();
            const targetIdx = conversationList.findIndex(conv => conv.getConversationId() === targetConversationId);
            if (targetIdx > -1) {
                const newConv = CometChatUIKitUtility.clone(conversationList[targetIdx]);
                newConv.setConversationWith(group);
                newConv.setLastMessage(message);
                newState = {...state, conversationList: [newConv, ...conversationList.filter((conv, i) => i !== targetIdx)]};
            }
            break;
        }
        case "removeConversationOfTheGroup": {
            const { conversationList, typingIndicatorMap } = state;
            const targetGuidId = action.group.getGuid();
            const targetIdx = conversationList.findIndex(conv => {
                const convWith = conv.getConversationWith();
                return convWith instanceof CometChat.Group && convWith.getGuid() === targetGuidId;
            });
            if (targetIdx > -1) {
                const convWith = conversationList[targetIdx].getConversationWith();
                const convWithId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
                let newTypingIndicatorMap : Map<string, CometChat.TypingIndicator>;
                if (typingIndicatorMap.has(convWithId)) {
                    newTypingIndicatorMap = new Map(typingIndicatorMap);
                    newTypingIndicatorMap.delete(convWithId);
                }
                else {
                    newTypingIndicatorMap = typingIndicatorMap;
                }
                const newConversationList = conversationList.filter((conv, i) => i !== targetIdx);
                newState = {...state, conversationList: newConversationList, typingIndicatorMap: newTypingIndicatorMap};
            }
            break;
        }
        case "removeConversationOfTheUser": {
            const { conversationList, typingIndicatorMap } = state;
            const targetUid = action.user.getUid();
            const targetIdx = conversationList.findIndex(conv => {
                const convWith = conv.getConversationWith();
                return convWith instanceof CometChat.User && convWith.getUid() === targetUid;
            });
            if (targetIdx > -1) {
                const convWith = conversationList[targetIdx].getConversationWith();
                const convWithId = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
                let newTypingIndicatorMap : Map<string, CometChat.TypingIndicator>;
                if (typingIndicatorMap.has(convWithId)) {
                    newTypingIndicatorMap = new Map(typingIndicatorMap);
                    newTypingIndicatorMap.delete(convWithId);
                }
                else {
                    newTypingIndicatorMap = typingIndicatorMap;
                }
                const newConversationList = conversationList.filter((conv, i) => i !== targetIdx);
                newState = {...state, conversationList: newConversationList, typingIndicatorMap: newTypingIndicatorMap};
            }
            break;
        }
        case "updateConversationLastMessageResetUnreadCountAndPlaceAtTheTop": {
            const { conversationList } = state;
            const { message } = action;
            const targetConvId = message.getConversationId();
            const targetIdx = conversationList.findIndex(conv => conv.getConversationId() === targetConvId);
            if (targetIdx > -1) {
                const targetConversation = CometChatUIKitUtility.clone(conversationList[targetIdx]);
                targetConversation.setLastMessage(message);
                targetConversation.setUnreadMessageCount(0);
                const newConversationList = conversationList.filter((conv, i) => i !== targetIdx);
                newState = {...state, conversationList: [targetConversation, ...newConversationList]};
            }
            break;
        }
        case "resetUnreadCountAndSetReadAtIfLastMessage": {
            const { conversationList } = state;
            const { message } = action;
            const messageReadAt = message.getReadAt() || Date.now();
            const targetMessageId = message.getId();
            const targetIdx = conversationList.findIndex(conv => {
                const lastMessage = conv.getLastMessage();
                return isAMessage(lastMessage) && lastMessage.getId() === targetMessageId;
            });
            if (targetIdx > -1) {
                newState = {...state, conversationList: conversationList.map((conv, i) => {
                    if (i === targetIdx) {
                        const newConv = CometChatUIKitUtility.clone(conv);
                        newConv.setUnreadMessageCount(0);
                        newConv.getLastMessage().setReadAt(messageReadAt);
                        return newConv;
                    }
                    return conv;
                })};
            }      
            break;
        }
        case "updateConversationLastMessageAndPlaceAtTheTop": {
            const { message } = action;
            const targetMessageId = message.getId();
            const { conversationList } = state;
            const targetIdx = conversationList.findIndex(conv => {
                const lastMessage = conv.getLastMessage();
                return isAMessage(lastMessage) && lastMessage.getId() === targetMessageId;
            });
            if (targetIdx > -1) {
                const newConv = CometChatUIKitUtility.clone(conversationList[targetIdx]);
                newConv.setLastMessage(message);
                newState = {...state, conversationList: [newConv, ...conversationList.filter((conv, i) => i !== targetIdx)]};
            }
            break;
        }
        case "setLoggedInUser": 
            newState = {...state, loggedInUser: action.loggedInUser};
            break;
        default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const x : never = type;
        }
    }
    return newState;
}

/**
 * Renders a scrollable list of conversations that has been created in a CometChat app
 */
export function CometChatConversations(props : IConversationsProps) {
    const {
        menus = null,
        title = localize("CHATS"),
        titleAlignment = TitleAlignment.left,
        conversationsRequestBuilder = null,
        onError,
        listItemView = null,
        subtitleView = null,
        disableUsersPresence = false,
        hideSeparator = false,
        activeConversation = null,
        selectionMode = SelectionMode.none,
        disableReceipt = false,
        options = null,
        datePattern = DatePatterns.DayDateTime,
        protectedGroupIcon = LockedIcon,
        privateGroupIcon = PrivateIcon,
        readIcon = MessageReadIcon,
        deliveredIcon = MessageDeliveredIcon,
        waitIcon = WaitIcon,
        errorIcon = WarningSmallIcon,
        sentIcon = MessageSentIcon,
        loadingIconURL = SpinnerIcon,
        loadingStateView,
        emptyStateText = localize("NO_CHATS_FOUND"),
        emptyStateView,
        errorStateText = localize("SOMETHING_WRONG"),
        errorStateView,
        hideError = false,
        onItemClick = null,
        onSelect = null,
        disableSoundForMessages = false,
        disableTyping = false,
        customSoundForMessages = null,
        confirmDialogTitle = localize("DELETE_CONVERSATION"),
        confirmDialogMessage = localize("WOULD__YOU_LIKE_TO_DELETE_THIS_CONVERSATION"),
        cancelButtonText = localize("CANCEL"),
        confirmButtonText = localize("DELETE"),
        conversationsStyle = null,
        deleteConversationDialogStyle = null,
        avatarStyle : avatarStyleObject = null,
        statusIndicatorStyle : statusIndicatorStyleObject = null,
        listItemStyle : listItemStyleObject = null,
        badgeStyle : badgeStyleObject = null,
        receiptStyle : receiptStyleObject = null,
        dateStyle : dateStyleObject = null,
        backdropStyle : backDropStyleObject = null
    } = props;
    
    const [state, dispatch] = useReducer(stateReducer, {
        conversationList: [],
        fetchState: States.loading,
        typingIndicatorMap: new Map(),
        conversationToBeDeleted: null,
        loggedInUser: null
    });
    const [confirmDialogElement, setConfirmDialogRef] = useStateRef<JSX.IntrinsicElements["cometchat-confirm-dialog"] | null>(null);
    const conversationsManagerRef = useRef<ConversationsManager | null>(null);
    const fetchNextIdRef = useRef("");
    const errorHandler = useCometChatErrorHandler(onError);
    const customSoundForMessagesRef = useRefSync(customSoundForMessages);
    const { theme } = useContext(CometChatContext);

    /**
     * Initiates a fetch request and appends the fetched conversations to the `conversationList` state
     * 
     * @remarks
     * This function also updates the `fetchState` state
     * 
     * @param fetchId - Fetch Id to decide if the fetched data should be appended to the `conversationList` state
     */
    const fetchNextAndAppendConversations = useCallback(async (fetchId : string) : Promise<void> => {
        const conversationManager = conversationsManagerRef.current; 
        if (!conversationManager) {
            return;
        }
        dispatch({type: "setFetchState", fetchState: States.loading});
        try {
            const conversations = await conversationManager.fetchNext();
            if (conversations.length !== 0 && fetchNextIdRef.current === fetchId) {
                dispatch({type: "appendConversations", conversations});
            }
            dispatch({type: "setFetchState", fetchState: States.loaded});
        }
        catch(error) {
            dispatch({type: "setFetchState", fetchState: States.error});
            errorHandler(error);
        }
    }, [errorHandler, dispatch]);

    const getIncrementUnreadCountBoolFromMetaData = useCallback((message : CometChat.BaseMessage) => {
        const metaDataGetterName = "getMetaData";
        const incrementUnreadCountFieldName = "incrementUnreadCount";
        let metaData : object;
        return (
            metaDataGetterName in message &&
            typeof message[metaDataGetterName] === "function" &&
            (metaData = message[metaDataGetterName]()) &&
            typeof metaData === "object" &&
            incrementUnreadCountFieldName in metaData &&
            Boolean(metaData["incrementUnreadCount"])
        );
    }, []);

    /**
     * Updates the unreadCount of `conversation` & moves it to the top of the `conversationList`
     */
    const updateConversationList = useCallback((conversation : CometChat.Conversation) : void => {
        const message = conversation.getLastMessage();
        if (!(isAMessage(message))) {
            return;
        }
        const incrementUnreadCount = (
            (message.getCategory() === CometChatUIKitConstants.MessageCategory.message || getIncrementUnreadCountBoolFromMetaData(message)) && 
            (message.getSender().getUid() !== state.loggedInUser?.getUid())
        );
        conversation.setUnreadMessageCount((conversation.getUnreadMessageCount() ?? 0) + Number(incrementUnreadCount));
        dispatch({type: "fromUpdateConversationListFn", conversation});
    }, [dispatch, state.loggedInUser, getIncrementUnreadCountBoolFromMetaData]);

    /**
     * Removes or updates the conversation in the `conversationList` state
     */
    const refreshSingleConversation = useCallback(async (message : CometChat.BaseMessage, remove = false) : Promise<void> => {
        try {
            const conversation = await CometChat.CometChatHelper.getConversationFromMessage(message);
            conversation.setLastMessage(message);
            if (remove) {
                dispatch({type: "removeConversation", conversation});
            }
            else {
                updateConversationList(conversation);
            }
        }
        catch(error) {
            errorHandler(error);
        }
    }, [errorHandler, dispatch, updateConversationList]);

    /**
     * Handles new received messages
     */
    const onMessageReceived = useCallback(async (message : CometChat.BaseMessage) : Promise<void> => {
        if (message.getSender().getUid() !== state.loggedInUser?.getUid() && !disableReceipt && !message.getDeliveredAt()) {
            try {
                await CometChat.markAsDelivered(message);
            }
            catch(error) {
                errorHandler(error);
            }
        }
        if (
            !disableSoundForMessages &&
            !(
                (message.getCategory() === CometChatUIKitConstants.MessageCategory.custom && !getIncrementUnreadCountBoolFromMetaData(message)) ||
                (activeConversation && activeConversation.getConversationId() === message.getConversationId())
            )
        ) {
            CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage, customSoundForMessagesRef.current);
        }
        refreshSingleConversation(message);
    }, [disableReceipt, disableSoundForMessages, refreshSingleConversation, errorHandler, state.loggedInUser, activeConversation, getIncrementUnreadCountBoolFromMetaData, customSoundForMessagesRef]);

    /**
     * Updates `readAt` or `deliveredAt` of a conversation's last message
     */
    const setReceipts = useCallback((messageReceipt : CometChat.MessageReceipt, updateReadAt : boolean) : void => {
        dispatch({type: "setLastMessageReadOrDeliveredAt", updateReadAt, messageReceipt});
    }, [dispatch]);

    /**
     * Handles new typing indicators
     */
    const setTypingIndicator = useCallback((typingIndicator : CometChat.TypingIndicator, typingStarted : boolean) : void => {
        if (state.loggedInUser?.getUid() === typingIndicator.getSender().getUid()) {
            return;
        }
        if (typingStarted) {
            dispatch({type: "addTypingIndicator", typingIndicator});
        }
        else {
            dispatch({type: "removeTypingIndicator", typingIndicator});
        }
    }, [state.loggedInUser]);

    /**
     * Creates menus to display at the top-right of this component
     */
    function getMenusView() : JSX.Element | null {
        if (menus === null) {
            return null;
        }
        return (
            <div
                className = "cc-conversations__menus"
                style = {menusStyle()}
            >
                {menus}
            </div>
        );
    }

    /**
     * Get avatar URL for the default list item view 
     */
    function getListItemAvatarURL(conversation : CometChat.Conversation) : string {
        const convWith = conversation.getConversationWith();
        return convWith instanceof CometChat.User ? convWith.getAvatar() : convWith.getIcon();
    } 

    /**
     * Get the status indicator color to use for the default list item view
     * 
     * @remarks
     * If the intention is not to show the status indicator, `null` should be returned
     */
    function getListItemStatusIndicatorColor(conversation : CometChat.Conversation) : string | null {
        const convWith = conversation.getConversationWith();
        if (convWith instanceof CometChat.User) {
            if (!disableUsersPresence && convWith.getStatus() === CometChatUIKitConstants.userStatusType.online) {
                return conversationsStyle?.onlineStatusColor || theme.palette.getSuccess() || "rgb(0, 200, 111)"; 
            }       
            return null;
        }
        else {
            switch(convWith.getType()) {
                case CometChatUIKitConstants.GroupTypes.password:
                    return conversationsStyle?.passwordGroupIconBackground || "rgb(247, 165, 0)";
                case CometChatUIKitConstants.GroupTypes.private:
                    return conversationsStyle?.privateGroupIconBackground || theme.palette.getSuccess() || "rgb(0, 200, 111)";
                default:
                    return null;
            } 
        }
    }

    /**
     * Get the status indicator icon for the default list item view
     */
    function getListItemStatusIndicatorIcon(conversation : CometChat.Conversation) : string {
        let statusIndicatorIcon = "";
        const convWith = conversation.getConversationWith();
        if (convWith instanceof CometChat.Group) {
            switch(convWith.getType()) {
                case CometChatUIKitConstants.GroupTypes.password:
                    statusIndicatorIcon = protectedGroupIcon;
                    break;
                case CometChatUIKitConstants.GroupTypes.private:
                    statusIndicatorIcon = privateGroupIcon;
                    break;
                default:
                    break;
            }
        }
        return statusIndicatorIcon;
    }

    /**
     * Creates subtitle thread view
     */
    function getSubtitleThreadView(conversation : CometChat.Conversation) : JSX.Element | null {
        const lastMessage = conversation.getLastMessage();
        if (!isAMessage(lastMessage) || !lastMessage.getParentMessageId()) {
            // parentMessageId is falsy, it is not a valid parent message id
            return null;
        }
        return (
            <div
                className = "cc-conversations__thread-view"
                style = {threadViewStyle()}
            >
                <cometchat-label 
                    text = {localize("IN_A_THREAD")}
                    labelStyle = {JSON.stringify(itemThreadIndicatorStyle(conversationsStyle, theme))}
                />
                <cometchat-icon 
                    URL = {ThreadIcon}
                    iconStyle = {JSON.stringify(iconStyle(theme))}
                />
            </div>
        );
    }

    function shouldDisplaySubtitleReceipt(conversation : CometChat.Conversation) : boolean {
        const lastMessage = conversation.getLastMessage();
        const convWith = conversation.getConversationWith();
        const id = convWith instanceof CometChat.User ? convWith.getUid() : convWith.getGuid();
        return (
            !disableReceipt &&
            isAMessage(lastMessage) &&
            lastMessage.getCategory() !== CometChatUIKitConstants.MessageCategory.action &&
            lastMessage.getSender().getUid() === state.loggedInUser?.getUid() &&
            state.typingIndicatorMap.get(id) === undefined
        );
    }

    /**
     * Creates subtitle receipt view
     */
    function getSubtitleReadReceiptView(conversation : CometChat.Conversation) : JSX.Element | null {
        if (!shouldDisplaySubtitleReceipt(conversation)) {
            return null;
        }
        return (
            <cometchat-receipt 
                receipt = {MessageReceiptUtils.getReceiptStatus(conversation.getLastMessage())}
                waitIcon = {waitIcon}
                sentIcon = {sentIcon}
                errorIcon = {errorIcon}
                deliveredIcon = {deliveredIcon}
                readIcon = {readIcon}
                receiptStyle = {JSON.stringify(receiptStyle(receiptStyleObject, theme))}
            />
        );
    }

    /**
     * Creates subtitle text
     */
    function getSubtitleText(conversation : CometChat.Conversation) : string {
        const convWith = conversation.getConversationWith();
        const id = convWith instanceof CometChat.Group ? convWith.getGuid() : convWith.getUid();
        const typingIndicator = state.typingIndicatorMap.get(id);
        if (typingIndicator !== undefined) {
            if (convWith instanceof CometChat.Group) {
                    return `${typingIndicator.getSender().getName()} ${localize("IS_TYPING")}`;
            }
            else {
                return localize("IS_TYPING");
            }
        }
        if (state.loggedInUser) {
            let icon = "";
            const lastMessage = conversation.getLastMessage();
            if (lastMessage && lastMessage.getCategory() === CometChatUIKitConstants.MessageCategory.call) {
                icon = `${lastMessage.getType() === CometChatUIKitConstants.MessageTypes.audio ? "📞" : "📹"} `;
            }
            return icon + ChatConfigurator.getDataSource().getLastConversationMessage(conversation, state.loggedInUser);
        }
        return "";
    }

    /**
     * Creates subtitle text view
     */
    function getSubtitleTextView(conversation : CometChat.Conversation) : JSX.Element {
        return (
            <div
                className = "cc-conversations__subtitle-text"
                style = {subtitleTextStyle(conversation, state.typingIndicatorMap, conversationsStyle, theme)}
            >
                {getSubtitleText(conversation)}
            </div>
        );
    }

    /**
     * Creates subtitle view for the default list item view
     */
    function getListItemSubtitleView(conversation : CometChat.Conversation) : JSX.Element {
        if (subtitleView !== null) {
            return (
                <>
                    {subtitleView(conversation)}
                </>
            );
        }
        return (
            <>
                {getSubtitleThreadView(conversation)}
                <div
                    className = "cc-conversations__subtitle"
                    style = {subtitleReceiptAndTextContainerStyle()}
                >
                    {getSubtitleReadReceiptView(conversation)}
                    {getSubtitleTextView(conversation)}
                </div>
            </>
        );
    }

    /**
     * Sets the `conversationToBeDeleted` state to the given `conversation`
     */
    function deleteOptionCallback(conversation : CometChat.Conversation) : void {
        dispatch({type: "setConversationToBeDeleted", conversation});
    }

    /**
     * Creates menu view for the default list item view
     * 
     * @remarks
     * This menu view is shown on mouse over the default list item view. 
     * The visibility of view is handled by the default list item view
     */
    function getListItemMenuView(conversation : CometChat.Conversation) {
        if (selectionMode !== SelectionMode.none) {
            return null;
        }
        let curOptions = options?.(conversation);
        if (!curOptions?.length) {
            const defaultOptions = ConversationUtils.getDefaultOptions();
            for (let i = 0; i < defaultOptions.length; i++) {
                if (defaultOptions[i].id === CometChatUIKitConstants.ConversationOptions.delete) {
                    defaultOptions[i].onClick = () => deleteOptionCallback(conversation);
                    defaultOptions[i].iconTint = "red";
                }
            }
            curOptions = defaultOptions;
        }
        return (
            <CometChatMenuList 
                data = {curOptions}
                menuListStyle = {menuListStyle(theme)}
                onOptionClick = {e => {
                    const { onClick } = e.detail.data;
                    onClick?.();
                }}
            />
        );
    }

    /**
     * Creates tail content view for the default list item view
     */
    function getListItemTailContentView(conversation : CometChat.Conversation) : JSX.Element | null {
        switch(selectionMode) {
            case SelectionMode.none: {
                const lastMessage = conversation.getLastMessage();
                if (!lastMessage) {
                    return null;
                }
                return (
                    <div
                        className = "cc-conversations__tail-content"
                        style = {defaultSelectionModeNoneTailViewContainerStyle()}
                    >
                        <cometchat-date 
                            timestamp = {lastMessage.getSentAt()}
                            pattern = {datePattern}
                            dateStyle = {JSON.stringify(dateStyle(dateStyleObject, theme))}
                        />
                        <cometchat-badge 
                            count = {conversation.getUnreadMessageCount()}
                            badgeStyle = {JSON.stringify(badgeStyle(badgeStyleObject, theme))}
                        />
                    </div>
                );
            } 
            case SelectionMode.single:
                return (
                    <div
                        className = "cc-conversations__tail-content"
                    >
                        <CometChatRadioButton 
                            onChange = {e => onSelect?.(conversation)}
                        />
                    </div>
                );
            case SelectionMode.multiple:
                return (
                    <div
                        className = "cc-conversations__tail-content"
                    >   
                        <CometChatCheckbox 
                            onChange = {e => onSelect?.(conversation)}
                        />
                    </div>
                );
            default:
                return null;
        }
    }

    /**
     * Creates `listItem` prop of the `CometChatList` component
     */
    function getListItem() : (conversation : CometChat.Conversation) => JSX.Element {
        if (listItemView !== null) {
            return listItemView;
        }
        return function(conversation : CometChat.Conversation) {
            return (
                <CometChatListItem 
                    id = {conversation.getConversationId()}
                    avatarURL = {getListItemAvatarURL(conversation)}
                    avatarName = {conversation.getConversationWith().getName()}
                    title = {conversation.getConversationWith().getName()}
                    statusIndicatorColor = {getListItemStatusIndicatorColor(conversation)}
                    statusIndicatorIcon = {getListItemStatusIndicatorIcon(conversation)}
                    hideSeparator = {hideSeparator}
                    isActive = {selectionMode === SelectionMode.none && conversation.getConversationId() === activeConversation?.getConversationId()}
                    avatarStyle = {avatarStyle(avatarStyleObject, theme)}
                    statusIndicatorStyle = {statusIndicatorStyle(statusIndicatorStyleObject)}
                    listItemStyle = {listItemStyle(listItemStyleObject, conversationsStyle, theme)}
                    onClick = {e => onItemClick?.(conversation)}
                    subtitleView = {getListItemSubtitleView(conversation)}
                    subtitleViewClassName = "cc-conversations__subtitle-view"
                    menuView = {getListItemMenuView(conversation)}
                    menuViewClassName = "cc-conversations__options-view"
                    tailView = {getListItemTailContentView(conversation)}
                    tailViewClassName = "cc-conversations__tail-view"
                />
            );
        }
    }

    /**
     * Creates conversation delete view
     */
    function getConversationDeleteView() : JSX.Element | null {
        if (state.conversationToBeDeleted === null) {
            return null;
        }
        return (
            <cometchat-backdrop
                style = {backdropStyle(backDropStyleObject)}
            >
                <cometchat-confirm-dialog 
                    ref = {setConfirmDialogRef}
                    title = {confirmDialogTitle}
                    messageText = {confirmDialogMessage}
                    cancelButtonText = {cancelButtonText}
                    confirmButtonText = {confirmButtonText}
                    confirmDialogStyle = {JSON.stringify(confirmDialogStyle(deleteConversationDialogStyle, theme))}
                />
            </cometchat-backdrop>
        );
    }

    Hooks({
        conversationsRequestBuilder,
        conversationsManagerRef,
        fetchNextAndAppendConversations,
        fetchNextIdRef,
        dispatch,
        confirmDialogElement,
        conversationToBeDeleted: state.conversationToBeDeleted,
        errorHandler,
        refreshSingleConversation,
        onMessageReceived,
        setReceipts,
        setTypingIndicator,
        disableTyping,
        loggedInUser: state.loggedInUser
    });

    return (
        <div
            className = "cc-conversations"
            style = {conversationsWrapperStyle(conversationsStyle, theme)}
        >
            {getMenusView()}
            <CometChatList 
                title = {title}
                titleAlignment = {titleAlignment}
                hideSearch = {true}
                list = {state.conversationList}
                listItemKey = "getConversationId"
                listItem = {getListItem()}
                onScrolledToBottom = {() => fetchNextAndAppendConversations(fetchNextIdRef.current = "onScrolledToBottom_" + String(Date.now()))}
                showSectionHeader = {false}
                state = {state.fetchState === States.loaded && state.conversationList.length === 0 ? States.empty : state.fetchState}
                loadingIconURL = {loadingIconURL}
                loadingView = {loadingStateView}
                emptyStateText = {emptyStateText}
                emptyStateView = {emptyStateView}
                errorStateText = {errorStateText}
                errorStateView = {errorStateView}
                hideError = {hideError}
                listStyle = {listStyle(conversationsStyle, theme)}
            />
            {getConversationDeleteView()}
        </div>
    );
}
