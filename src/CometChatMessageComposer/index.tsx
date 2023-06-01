import { useCallback, useContext, useReducer, useRef, JSX } from "react";
import "my-cstom-package-lit";
import { Hooks } from "./hooks";
import { flushSync } from "react-dom";
import { CometChatUIKitUtility, AuxiliaryButtonAlignment, CometChatSoundManager, MessageComposerStyle, MessageStatus, Placement } from "uikit-utils-lerna";
import SendIcon from "./assets/send.svg";
import PlusIcon from "./assets/plus.svg";
import CloseIcon from "./assets/close.svg";
import HeartIcon from "./assets/heart.svg";
import SmileysIcon from "./assets/smileys.svg";
import PlusRotatedIcon from "./assets/plus-rotated.svg";
import { CometChatMessageComposerAction, CometChatMessageEvents, CometChatUIKitConstants, localize } from "uikit-resources-lerna";
import { actionSheetStyle, attachmentButtonStyle, emojiButtonStyle, emojiKeyboardStyle, emojiKeyboardPopoverStyle, liveReactionButtonStyle, messageInputStyle, previewStyle, sendButtonStyle, liveReactionButtonDivStyle, sendButtonDivStyle, attachmentPopoverStyle, fileMediaPickerStyle, messageComposerStyle, actionSheetContainerStyle, emojiKeyboardContainerStyle, defaultAuxiliaryViewContainer, auxiliaryViewStyle } from "./style";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatContext } from "../CometChatContext";
import { useCometChatErrorHandler, useRefSync, useStateRef } from "../CometChatCustomHooks";
import { PollsExtensionDecorator } from "../Extensions/Polls/PollsExtensionDecorator";
import { ChatConfigurator } from '../Shared/Framework/ChatConfigurator';
import { PollsConfiguration } from "../Extensions/Polls/PollsConfiguration";

type ComposerId = {parentMessageId : number | null, user : string | null, group : string | null};
export type ContentToDisplay = "attachments" | "emojiKeyboard" | "none"; 
type MediaMessageFileType = typeof CometChatUIKitConstants.MessageTypes.image |
                            typeof CometChatUIKitConstants.MessageTypes.video |
                            typeof CometChatUIKitConstants.MessageTypes.audio |
                            typeof CometChatUIKitConstants.MessageTypes.file;   
export type ActionOnClickType = (() => void) | null;

interface IMessageComposerProps {
    /**
     * User to send messages to
     */
    user? : CometChat.User,
    /**
     * Group to send messages to
     * 
     * @remarks
     * This prop is used if `user` prop is not provided
     */
    group? : CometChat.Group,
    /**
     * Text to fill the message input with
     * 
     * @remarks
     * This prop is used only when this component mounts
     * 
     * @defaultValue `""`
     */
    text? : string,
    /**
     * Function to call when the message input's text value changes
     */
    onTextChange? : (text : string) => void,
    /**
     * Text shown in the message input when it is empty
     */
    placeHolderText? : string,
    /**
     * Custom send button view
     */
    sendButtonView? : JSX.Element,
    /**
     * Function to call whenever a new text message is sent
     */
    onSendButtonClick? : (message : CometChat.BaseMessage) => void,
    /**
     * Custom secondary button view
     */
    secondaryButtonView? : (userOrGroup : CometChat.User | CometChat.Group, composerId : ComposerId) => JSX.Element,
    /**
     * Image URL for the default secondary button
     * 
     * @remarks
     * This prop is used if `secondaryButtonView` prop is not provided
     * 
     * @defaultValue `./assets/plus.svg`
     */
    attachmentIconURL? : string,
    /**
     * Custom auxiliary button view
     */
    auxiliaryButtonView? : (userOrGroup : CometChat.User | CometChat.Group, composerId : ComposerId) => JSX.Element,
    /**
     * Alignment of the auxiliary button
     * 
     * @defaultValue `AuxiliaryButtonAlignment.right`
     */
    auxiliaryButtonAlignment? : AuxiliaryButtonAlignment,
    /**
     * Options for the default secondary view
     */
    attachmentOptions? : (userOrGroup : CometChat.User | CometChat.Group, composerId : ComposerId) => CometChatMessageComposerAction[],
    /**
     * Id of the parent message
     */
    parentMessageId? : number,
    /**
     * Image URL for the live reaction button
     * 
     * @defaultValue `./assets/heart.svg`
     */
    LiveReactionIconURL? : string,
    /**
     * Hide live reaction button
     * 
     * @defaultValue `false`
     */
    hideLiveReaction? : boolean,
    /**
     * Preview section at the top of the message input
     */
    headerView? : JSX.Element,
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Disable sound for outgoing messages
     * 
     * @defaulValue `false`
     */
    disableSoundForMessages? : boolean,
    /**
     * Custom audio sound for outgoing messages
     */
    customSoundForMessage? : string,
    /**
     * Disable sending typing events
     * 
     * @defaultValue `false`
     */
    disableTypingEvents? : boolean,
    /**
     * Styles to apply to this component
     */
    messageComposerStyle? : MessageComposerStyle
};

type State = {
    text : string,
    addToMsgInputText : string,
    textMessageToEdit : CometChat.TextMessage | null,
    contentToDisplay : ContentToDisplay,
    loggedInUser : CometChat.User | null,
    showPoll : boolean
};

export type Action = {type : "setText", text : State["text"]} |
                     {type : "setAddToMsgInputText", addToMsgInputText : State["addToMsgInputText"]} |
                     {type : "setTextMessageToEdit", textMessageToEdit : State["textMessageToEdit"]} |
                     {type : "setContentToDisplay", contentToDisplay : ContentToDisplay} | 
                     {type : "setLoggedInUser", loggedInUser : CometChat.User} |
                     {type : "setShowPoll", showPoll : boolean};

// Not sure
function processFile(file : File) : Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result !== null) {
                resolve(new File([reader.result], file.name, file));
            }
        };
        reader.onerror = () => reject(new Error(`Converting the file named "${file.name}" to binary failed`));
        reader.readAsArrayBuffer(file);
    });
}

const USER_GROUP_NOT_PROVIDED_ERROR_STR = "No user or group object provided. Should at least provide one.";
const END_TYPING_AFTER_START_IN_MS = 500;

function stateReducer(state : State, action : Action) {
    let newState = state;
    const { type } = action;
    switch(type) {
        case "setText":
            newState = {...state, text: action.text};
            break;
        case "setAddToMsgInputText":
            newState = {...state, addToMsgInputText: action.addToMsgInputText};
            break;
        case "setTextMessageToEdit":
            newState = {...state, textMessageToEdit: action.textMessageToEdit};
            break;
        case "setContentToDisplay":
            newState = {...state, contentToDisplay: action.contentToDisplay};
            break;
        case "setLoggedInUser":
            newState = {...state, loggedInUser: action.loggedInUser};
            break;
        case "setShowPoll":
            newState = {...state, showPoll: action.showPoll};
            break;
        default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const x : never = type;
        }
    }
    return newState;
}

/**
 * Renders a message composer to send messages to a user or group of a CometChat App
 */
export function CometChatMessageComposer(props : IMessageComposerProps) {
    const {
        user,
        group,
        text : initialText = "",
        onTextChange,
        placeHolderText = localize("ENTER_YOUR_MESSAGE_HERE"),
        sendButtonView,
        onSendButtonClick ,
        secondaryButtonView,
        attachmentIconURL = PlusIcon,
        auxiliaryButtonView,
        auxiliaryButtonAlignment = AuxiliaryButtonAlignment.right,
        attachmentOptions,
        parentMessageId = null,
        LiveReactionIconURL = HeartIcon,
        hideLiveReaction = false,
        headerView = null,
        onError,
        disableSoundForMessages = false,
        customSoundForMessage,
        disableTypingEvents = false,
        messageComposerStyle : messageComposerStyleObject
    } = props;

    const [state, dispatch] = useReducer(
        stateReducer, 
        {
            text: initialText, 
            addToMsgInputText: initialText,
            textMessageToEdit: null,
            contentToDisplay: "none",
            loggedInUser: null,
            showPoll: false
        }
    );
    const messageInputRef = useRef<JSX.IntrinsicElements["cometchat-message-input"] | null>(null);
    const mediaFilePickerRef = useRef<HTMLInputElement | null>(null);
    const [emojiKeyboardElement, setEmojiKeyboardRef] = useStateRef<JSX.IntrinsicElements["cometchat-emoji-keyboard"] | null>(null);
    const [primaryBtnElement, setPrimaryBtnRef] = useStateRef<JSX.IntrinsicElements["cometchat-button"] | null>(null);
    const [secondaryBtnElement, setSecondaryBtnRef] = useStateRef<JSX.IntrinsicElements["cometchat-button"] | null>(null);
    const [auxiliaryBtnElement, setAuxiliaryBtnRef] = useStateRef<JSX.IntrinsicElements["cometchat-button"] | null>(null);
    const [textMessageEditPreviewElement, setTextMessageEditPreviewRef] = useStateRef<JSX.IntrinsicElements["cometchat-preview"] | null>(null);
    const [actionSheetElement, setActionSheetRef] = useStateRef<JSX.IntrinsicElements['cometchat-action-sheet'] | null>(null);
    const [liveReactionBtnElement, setLiveReactionBtnRef] = useStateRef<JSX.IntrinsicElements["cometchat-button"] | null>(null);
    // const [createPollElement, setCreatePollRef] = useStateRef<JSX.IntrinsicElements["create-poll"] | null>(null);
    const isSendMsgCallbackRunning = useRef(false);
    const actionIdToActionOnClick = useRef(new Map<string, ActionOnClickType>());
    const endTypingTimeoutId = useRef<number | null>(null);
    const createPollViewRef = useRef(null);
    const errorHandler = useCometChatErrorHandler(onError);
    const userPropRef = useRefSync(user);
    const groupPropRef = useRefSync(group);
    const parentMessageIdPropRef = useRefSync(parentMessageId);
    const disableSoundForMessagesPropRef = useRefSync(disableSoundForMessages);
    const customSoundForMessagePropRef = useRefSync(customSoundForMessage);
    const onSendButtonClickPropRef = useRefSync(onSendButtonClick);
    const { theme } = useContext(CometChatContext);

    /**
     * Creates receiver details object
     * 
     * @throws `Error`
     * Thrown if `user` or 'group' both props are missing
     */
    const getReceiverDetails = useCallback(() : {receiverId : string, receiverType : string} => {
        const user = userPropRef.current;
        const group = groupPropRef.current;
        if (user) {
            return {receiverId: user?.getUid(), receiverType: CometChatUIKitConstants.MessageReceiverType.user};
        }
        if (group) {
            return {receiverId: group?.getGuid(), receiverType: CometChatUIKitConstants.MessageReceiverType.group};
        }   
        throw new Error(USER_GROUP_NOT_PROVIDED_ERROR_STR);
    }, [groupPropRef, userPropRef]);

    /**
     * Creates a `CometChat.TypingIndicator` instance
     */
    const getTypingNotification = useCallback(() : CometChat.TypingIndicator => {
        const { receiverId, receiverType } = getReceiverDetails();
        return new CometChat.TypingIndicator(receiverId, receiverType);
    }, [getReceiverDetails]);

    /**
     * Calls `startTyping` SDK function after creating a `CometChat.TypingIndicator` instance
     */
    const startTyping = useCallback(() : void => {
        try {
            CometChat.startTyping(getTypingNotification());
        }
        catch(error) {
            errorHandler(error);
        }
    }, [getTypingNotification, errorHandler]);

    /**
     * Calls `endTyping` SDK function after creating a `CometChat.TypingIndicator` instance
     */
    const endTyping = useCallback(() : void => {
        try {
            CometChat.endTyping(getTypingNotification());
        }
        catch(error) {
            errorHandler(error);
        }
    }, [getTypingNotification, errorHandler]);

    /**
     * Handles emitting typing events
     */
    const handleTyping = useCallback(() : void => {
        if (disableTypingEvents) {
            return;
        }
        if (endTypingTimeoutId.current !== null) {
            window.clearTimeout(endTypingTimeoutId.current);
            endTypingTimeoutId.current = null;
        }
        else {
            startTyping();
        }
        endTypingTimeoutId.current = window.setTimeout(() => endTyping(), END_TYPING_AFTER_START_IN_MS);
    }, [startTyping, endTyping, disableTypingEvents]);

    /**
     * Creates a composerId object
     */
    function getComposerId() : ComposerId {
        const user = userPropRef.current;
        if (user !== undefined) {
            return {user: user?.getUid(), group: null, parentMessageId};
        }    
        const group = groupPropRef.current;
        if (group !== undefined) {
            return {user: null, group: group?.getGuid(), parentMessageId};
        }
        return {user: null, group: null, parentMessageId};
    }

    /**
     * Sets the `setAddToMsgInputText` state
     * 
     * @remarks
     * Setting `addToMsgInputText` is a two-step process. 
     * This is a workaround for an issue faced when setting the cometchat-message-input's text state
     */
    const mySetAddToMsgInputText = useCallback(function(text : string) : void {
        flushSync(() => {
            dispatch({type: "setAddToMsgInputText", addToMsgInputText: ""});
        });
        dispatch({type: "setAddToMsgInputText", addToMsgInputText: text});
    }, [dispatch]); 

    /**
     * Handles SDK errors
     */
    const handleSDKError = useCallback((error : unknown, message : CometChat.TextMessage | CometChat.MediaMessage, wasEditMethodCall : boolean) : void => {
        message.setMetadata({error});
        if (wasEditMethodCall) {
            CometChatMessageEvents.ccMessageEdited.next({
                message,
                status: MessageStatus.error
            });
        }
        else {
            CometChatMessageEvents.ccMessageSent.next({
                message: message,
                status: MessageStatus.error
            });
        }
        throw error;
    }, []);

    /**
     * Manages playing audio
     */
    const playAudioIfSoundNotDisabled = useCallback(() : void => {
        const disableSoundForMessages = disableSoundForMessagesPropRef.current;
        if (!disableSoundForMessages) {
            CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage, customSoundForMessagePropRef.current);
        }
    }, [customSoundForMessagePropRef, disableSoundForMessagesPropRef]);

    /**
     * Creates a `CometChat.TextMessage` instance
     */
    const getTextMessage = useCallback((text : string) : CometChat.TextMessage => {
        const { receiverId, receiverType } = getReceiverDetails();
        const textMessage = new CometChat.TextMessage(receiverId, text, receiverType);
        textMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        textMessage.setMuid(CometChatUIKitUtility.ID());
        const parentMessageId = parentMessageIdPropRef.current;
        if (parentMessageId !== null) {
            textMessage.setParentMessageId(parentMessageId);
        }   
        return textMessage;
    }, [getReceiverDetails, parentMessageIdPropRef]);

    /**
     * Calls `sendMessage` SDK function
     */
    const sendTextMessage = useCallback(async <T extends CometChat.TextMessage>(textMessage : T) : Promise<T | undefined> => {
        try {
            const sentTextMessage = await CometChat.sendMessage(textMessage);
            return sentTextMessage as T;
        }
        catch(error) {
            console.log(error)
            handleSDKError(error, textMessage, false);
        }
    }, [handleSDKError]);

    /**
     * Handles sending text message
     */
    const handleTextMessageSend = useCallback(async (text : string) : Promise<void> => {
        try {
            const textMessage = getTextMessage(text);
            CometChatMessageEvents.ccMessageSent.next({
                message: textMessage,
                status: MessageStatus.inprogress
            });
            playAudioIfSoundNotDisabled();
            const sentTextMessage = await sendTextMessage(textMessage);
            if (sentTextMessage) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: sentTextMessage,
                    status: MessageStatus.success
                });
            }
        }
        catch(error) {
            errorHandler(error);
        }
    }, [getTextMessage, playAudioIfSoundNotDisabled, sendTextMessage, errorHandler]);

    /**
     * Creates a `CometChat.TextMessage` instance with the `id` of the instance set to `textMessageId`
     */
    const getEditedTextMessage = useCallback((newText : string, textMessageId : number) : CometChat.TextMessage => {
        const { receiverId, receiverType } = getReceiverDetails();
        const newTextMessage = new CometChat.TextMessage(receiverId, newText, receiverType);
        newTextMessage.setId(textMessageId);
        return newTextMessage;
    }, [getReceiverDetails]);

    /**
     * Calls `editMessage` SDK function
     */
    const sendEditedTextMessage = useCallback(async <T extends CometChat.TextMessage>(editedTextMessage : T) : Promise<T | undefined> => {
        try {
            const editedMessage = await CometChat.editMessage(editedTextMessage);
            return editedMessage as T;
        }
        catch(error) {
            handleSDKError(error, editedTextMessage, true);
        }
    }, [handleSDKError]);

    /**
     * Handles sending edited messages
     */
    const handleEditTextMessageSend = useCallback(async (newText : string, textMessage : CometChat.TextMessage) : Promise<void> => {
        try {
            const editedMessage = await sendEditedTextMessage(getEditedTextMessage(newText, textMessage.getId()));
            if (editedMessage) {
                CometChatMessageEvents.ccMessageEdited.next({
                    message: editedMessage,
                    status: MessageStatus.success
                });
            }
        }
        catch(error) {
            errorHandler(error);
        }
    }, [sendEditedTextMessage, getEditedTextMessage, errorHandler]);

    /**
     * Handles sending a new text message or an edited message
     * 
     * @remarks
     * The function closes the emojiKeyboard if it is visible before sending or editing a message
     */
    const handleSendButtonClick = useCallback(async (text : string) : Promise<void> => {
        if (
            (text = text.trim()).length === 0 || 
            (state.textMessageToEdit !== null && state.textMessageToEdit.getText() === text) || 
            isSendMsgCallbackRunning.current || 
            userPropRef.current?.getBlockedByMe()
        ) {
            return;
        }
        if (state.contentToDisplay === "emojiKeyboard") {
            auxiliaryBtnElement?.click();
            dispatch({type: "setContentToDisplay", contentToDisplay: "none"});
        }
        isSendMsgCallbackRunning.current = true;
        dispatch({type: "setText", text: ""}); 
        messageInputRef.current?.emptyInputField();
        let onSendButtonClick : ((message: CometChat.BaseMessage) => void) | undefined;
        if (state.textMessageToEdit !== null) {
            dispatch({type: "setTextMessageToEdit", textMessageToEdit: null});
            await handleEditTextMessageSend(text, state.textMessageToEdit);
        }
        else if ((onSendButtonClick = onSendButtonClickPropRef.current)) {
            try {
                await Promise.all([onSendButtonClick(getTextMessage(text))]);
            }
            catch(error) {
                errorHandler(error);
            }
        }
        else {
            await handleTextMessageSend(text);
        }
        isSendMsgCallbackRunning.current = false;
    }, [state.textMessageToEdit, state.contentToDisplay, auxiliaryBtnElement, dispatch, handleEditTextMessageSend, handleTextMessageSend, errorHandler, getTextMessage, onSendButtonClickPropRef, userPropRef]);

    /**
     * Creates a `CometChat.MediaMessage` instance
     */
    const getMediaMessage = useCallback(async (file : File, fileType : MediaMessageFileType) : Promise<CometChat.MediaMessage> => {
        const processedFile = await processFile(file);
        const { receiverId, receiverType } = getReceiverDetails();
        const mediaMessage = new CometChat.MediaMessage(receiverId, processedFile, fileType, receiverType);
        mediaMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        mediaMessage.setMuid(CometChatUIKitUtility.ID());
        mediaMessage.setMetadata({"file": processedFile});
        const parentMessageId = parentMessageIdPropRef.current;
        if (parentMessageId !== null) {
            mediaMessage.setParentMessageId(parentMessageId);
        }
        return mediaMessage;
    }, [getReceiverDetails, parentMessageIdPropRef]);

    /**
     * Calls `sendMediaMessage` SDK function
     */
    const sendMediaMessage = useCallback(async <T extends CometChat.MediaMessage>(mediaMessage : T) : Promise<T | undefined> => {
        try {
            const sentMediaMessage = await CometChat.sendMediaMessage(mediaMessage);
            return sentMediaMessage as T;
        }
        catch(error) {
            handleSDKError(error, mediaMessage, false);
        }
    }, [handleSDKError]);

    /**
     * Handles sending media message
     */
    const handleMediaMessageSend = useCallback(async (file : File, fileType : MediaMessageFileType) : Promise<void> => {
        try {
            const mediaMessage = await getMediaMessage(file, fileType);
            CometChatMessageEvents.ccMessageSent.next({
                message: mediaMessage,
                status: MessageStatus.inprogress
            });
            playAudioIfSoundNotDisabled();
            const sentMediaMessage = await sendMediaMessage(mediaMessage);
            if (sentMediaMessage) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: sentMediaMessage,
                    status: MessageStatus.success
                });
            }
        }
        catch(error) {
            errorHandler(error);
        }
    }, [getMediaMessage, playAudioIfSoundNotDisabled, sendMediaMessage, errorHandler]);

    /**
     * Wrapper around `handleMediaMessageSend`
     */
    const handleMediaMessageSendWrapper = useCallback(async () : Promise<void> => {
        const mediaFilePickerElement = mediaFilePickerRef.current;
        if (!mediaFilePickerElement?.files?.length || isSendMsgCallbackRunning.current || userPropRef.current?.getBlockedByMe()) {
            return;
        }
        isSendMsgCallbackRunning.current = true;
        const file = mediaFilePickerElement.files[0];
        const fileType = mediaFilePickerElement.accept.slice(0, -2);
        const onSendButtonClick = onSendButtonClickPropRef.current;
        if (onSendButtonClick) {
            try {
                await Promise.all([onSendButtonClick(await getMediaMessage(file, fileType))]);
            }
            catch(error) {
                errorHandler(error);
            }
        }
        else {
            await handleMediaMessageSend(file, fileType);
        }
        isSendMsgCallbackRunning.current = false;
    }, [handleMediaMessageSend, errorHandler, getMediaMessage, onSendButtonClickPropRef, userPropRef]);

    /**
     * @returns Should the component show the send button view
     */
    function hideSendButton() : boolean {
        return state.text.trim() === "" || (state.textMessageToEdit !== null && state.textMessageToEdit.getText() === state.text);  
    }

    /**
     * Creates primary view
     */
    function getPrimaryView() : JSX.Element | null {
        if (hideSendButton()) {
            if (hideLiveReaction) {
                return null;
            }
            return (
                <div
                    className = "cc-message-composer__live-reaction-btn-wrapper"
                    style = {liveReactionButtonDivStyle()}
                >
                    <cometchat-button 
                        ref = {setLiveReactionBtnRef}
                        iconURL = {LiveReactionIconURL}
                        hoverText = {localize("LIVE_REACTION")}
                        buttonStyle = {JSON.stringify(liveReactionButtonStyle())}
                    />
                </div>
            );
        }
        if (sendButtonView) {
            return sendButtonView;
        }
        return (
            <div
                className = "cc-message-composer__send-btn-wrapper"
                style = {sendButtonDivStyle()}
            >
                <cometchat-button
                    ref = {setPrimaryBtnRef}
                    iconURL = {SendIcon}
                    hoverText = {localize("SEND_MESSAGE")}
                    buttonStyle = {JSON.stringify(sendButtonStyle(messageComposerStyleObject, theme))}
                />
            </div>
        );
    }

    /**
     * Creates secondary view
     */
    function getSecondaryView() : JSX.Element {
        if (secondaryButtonView && (user !== undefined || group !== undefined)) {
            return secondaryButtonView(user !== undefined ? user : group!, getComposerId());
        }
        const defaultSecondaryBtn = (
            <cometchat-button
                ref = {setSecondaryBtnRef}
                iconURL = {state.contentToDisplay === "attachments" ? PlusRotatedIcon : attachmentIconURL}
                buttonStyle = {JSON.stringify(attachmentButtonStyle(messageComposerStyleObject, theme, state.contentToDisplay === "attachments"))}
            />
        );
        // Use default secondary content
        let actions : CometChatMessageComposerAction[];
        if (attachmentOptions && attachmentOptions.length > 0 && (user !== undefined || group !== undefined)) {
            actions = attachmentOptions(user !== undefined ? user : group!, getComposerId());
        }
        else {
            actions = ChatConfigurator.getDataSource().getAttachmentOptions(theme, getComposerId() as unknown as Map<string, any>);
        }
        for (let i = 0; i < actions.length; i++) {
            const curAction = actions[i];
            const { id } = curAction;
            if (typeof id === "string") {
                let overrideOnClick = curAction.onClick;
                if (id === "extension_poll") {
                    overrideOnClick = () => {
                        (curAction.onClick as Function)
                            ?.call(
                                new PollsExtensionDecorator(
                                    ChatConfigurator.getDataSource(), 
                                    {configuration: new PollsConfiguration({})}
                                ), 
                                [user, group]
                            );
                    }
                } 
                actionIdToActionOnClick.current.set(id, overrideOnClick ? overrideOnClick : null);
            }
        }
        const defaultSecondaryContent = (
            <cometchat-action-sheet
                ref = {setActionSheetRef}
                actions = {JSON.stringify(actions)}
                actionSheetStyle = {JSON.stringify(actionSheetStyle(messageComposerStyleObject, theme))}
            />
        );
        return (
            <cometchat-popover 
                placement = {Placement.top}
                popoverStyle = {JSON.stringify(attachmentPopoverStyle(theme))}
            >
                <div 
                    slot = "children"
                    className = "cc-message-composer__secondary-btn-wrapper"
                >
                    {defaultSecondaryBtn}
                </div>
                <div 
                    slot = "content"
                    className = "cc-message-composer__secondary-content"
                    style = {actionSheetContainerStyle(theme)}
                >
                    {defaultSecondaryContent}
                </div>
            </cometchat-popover>
        );
    }

    /**
     * Creates auxiliary view
     */
    function getAuxiliaryView() : JSX.Element {
        if (auxiliaryButtonView && (user !== undefined || group !== undefined)) {
            return auxiliaryButtonView(user !== undefined ? user : group!, getComposerId());
        }
        const applyHorizontalMargin = hideLiveReaction && hideSendButton();
        const defaultAuxiliaryOptions = ChatConfigurator.getDataSource().getAuxiliaryOptions((getComposerId() as unknown as Map<String, any>), user, group, theme);
        // Use default auxiliary button
        const defaultAuxiliaryBtn = (
            <cometchat-button
                ref = {setAuxiliaryBtnRef} 
                iconURL = {state.contentToDisplay === "emojiKeyboard" ? PlusRotatedIcon : SmileysIcon}
                buttonStyle = {JSON.stringify(emojiButtonStyle(messageComposerStyleObject, theme, state.contentToDisplay === "emojiKeyboard", applyHorizontalMargin))}
            />
        );
        // Use default auxiliary content
        const defaultAuxiliaryContent = (
            <cometchat-emoji-keyboard
                ref = {setEmojiKeyboardRef}
                emojiKeyboardStyle = {JSON.stringify(emojiKeyboardStyle(messageComposerStyleObject, theme))}
            />
        );
        return (
            <>
                <div>
                    {
                        defaultAuxiliaryOptions.map((option : any) => option)
                    }
                </div>
                <div
                    className = "cc-message-composer__default-auxiliary-view-wrapper"
                    style = {defaultAuxiliaryViewContainer()}
                >
                    <cometchat-popover 
                        placement = {Placement.top}
                        popoverStyle = {JSON.stringify(emojiKeyboardPopoverStyle())}
                    >
                        <div
                            slot = "children"
                            className = "cc-message-composer__auxiliary-btn-wrapper"
                        >
                            {defaultAuxiliaryBtn}
                        </div>
                        <div 
                            slot = "content"
                            className = "cc-message-composer__auxiliary-content"
                            style = {emojiKeyboardContainerStyle(theme)}
                        >
                            {defaultAuxiliaryContent}
                        </div>
                    </cometchat-popover>
                </div>
            </>
        );
    }

    /**
     * Creates preview view
     */
    function getTextMessageEditPreview() : JSX.Element | null {
        if (state.textMessageToEdit === null) {
            return null;
        }
        return (
            <cometchat-preview
                ref = {setTextMessageEditPreviewRef} 
                previewSubtitle = {state.textMessageToEdit.getText()}
                closeButtonIconURL = {CloseIcon}
                previewStyle = {JSON.stringify(previewStyle(messageComposerStyleObject, theme))}
            />
        );
    }

    /**
     * Creates header view
     */
    function getHeaderView() : JSX.Element {
        return (
            <div
                className = "cc-message-composer__header"
            >
                {headerView ?? getTextMessageEditPreview()}
            </div>
        );
    }

    /**
     * Creates the file picker component
     */
    function getMediaFilePicker() : JSX.Element {
        // Purposely not given classname
        return (
            <input 
                ref = {mediaFilePickerRef}
                type = "file"
                onChange = {handleMediaMessageSendWrapper}
                style = {fileMediaPickerStyle()}
            />
        );
    }

    /**
     * Creates the message input component
     */
    function getMessageInput() : JSX.Element {
        return (
            <cometchat-message-input
                ref = {messageInputRef}
                text = {state.addToMsgInputText}
                placeHolderText = {placeHolderText}
                auxiliaryButtonAlignment = {auxiliaryButtonAlignment}
                messageInputStyle = {JSON.stringify(messageInputStyle(messageComposerStyleObject, theme))}
            >
                <div
                    slot = "primaryView"
                    className = "cc-message-composer__primary-view"
                >
                    {getPrimaryView()}
                </div>
                <div
                    slot = "secondaryView"
                    className = "cc-message-composer__secondary-view"
                >
                    {getSecondaryView()}
                </div>
                <div
                    slot = "auxilaryView"
                    className = "cc-message-composer__auxiliary-view"
                    style = {auxiliaryViewStyle()}
                >
                    {getAuxiliaryView()}
                </div>
            </cometchat-message-input>
        );
    }

    /**
     * Creates create poll modal
     */
    function getCreatePollModal() : JSX.Element | null {
        if (state.showPoll && createPollViewRef?.current) {
            return createPollViewRef.current;
        }

        return null;
    }

    Hooks({
        dispatch,
        messageInputRef,
        liveReactionBtnElement,
        LiveReactionIconURL,
        mySetAddToMsgInputText,
        actionSheetElement,
        secondaryBtnElement,
        mediaFilePickerRef,
        textMessageEditPreviewElement,
        auxiliaryBtnElement,
        emojiKeyboardElement,
        text: state.text,
        handleSendButtonClick,
        primaryBtnElement,
        onTextChange,
        actionIdToActionOnClick,
        handleTyping,
        errorHandler,
        getReceiverDetails,
        contentToDisplay: state.contentToDisplay,
        createPollViewRef
    });

    return (
        <>
            {getCreatePollModal()}
            <div 
                className = "cc-message-composer"
                style = {messageComposerStyle(messageComposerStyleObject, theme)}
            >
                {getMediaFilePicker()}
                {getHeaderView()}
                {getMessageInput()}
            </div>
        </>
    );
}
