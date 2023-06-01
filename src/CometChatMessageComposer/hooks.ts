import React, { useEffect, JSX } from "react";
import { Action, ActionOnClickType, ContentToDisplay } from ".";
import { MessageStatus } from "uikit-utils-lerna";
import { CometChatMessageEvents, IMessages, CometChatUIEvents, IModal } from "uikit-resources-lerna";
import { CometChat } from "@cometchat-pro/chat";

type Args = {
    dispatch : React.Dispatch<Action>,
    messageInputRef : React.MutableRefObject<JSX.IntrinsicElements["cometchat-message-input"] | null>,
    liveReactionBtnElement : JSX.IntrinsicElements["cometchat-button"] | null,
    LiveReactionIconURL : string,
    mySetAddToMsgInputText : (text : string) => void,
    actionSheetElement : JSX.IntrinsicElements['cometchat-action-sheet'] | null,
    mediaFilePickerRef : React.MutableRefObject<HTMLInputElement | null>,
    secondaryBtnElement : JSX.IntrinsicElements["cometchat-button"] | null,
    textMessageEditPreviewElement : JSX.IntrinsicElements["cometchat-preview"] | null,
    auxiliaryBtnElement : JSX.IntrinsicElements["cometchat-button"] | null,
    emojiKeyboardElement : JSX.IntrinsicElements["cometchat-emoji-keyboard"] | null,
    text : string,
    handleSendButtonClick : (text: string) => Promise<void>,
    primaryBtnElement : JSX.IntrinsicElements["cometchat-button"] | null,
    onTextChange? : (text : string) => void,
    actionIdToActionOnClick : React.MutableRefObject<Map<string, ActionOnClickType>>,
    handleTyping : () => void,
    errorHandler : (error : unknown) => void,
    getReceiverDetails : () => {receiverId : string, receiverType : string},
    contentToDisplay : ContentToDisplay,
    createPollViewRef : any
};

export function Hooks(args : Args) {
    const {
        dispatch,
        messageInputRef,
        liveReactionBtnElement,
        LiveReactionIconURL,
        mySetAddToMsgInputText,
        actionSheetElement,
        mediaFilePickerRef,
        secondaryBtnElement,
        textMessageEditPreviewElement,
        auxiliaryBtnElement,
        emojiKeyboardElement,
        text,
        handleSendButtonClick,
        primaryBtnElement,
        onTextChange,
        actionIdToActionOnClick,
        handleTyping,
        errorHandler,
        getReceiverDetails,
        contentToDisplay,
        createPollViewRef
    } = args;

    useEffect(
        /**
         * Subscribes to message edited Message UI event
         */
        () => {
            const subMessageEdited = CometChatMessageEvents.ccMessageEdited.subscribe((object : IMessages) => {
                if (object.status === MessageStatus.inprogress && object.message instanceof CometChat.TextMessage) {
                    dispatch({type: "setTextMessageToEdit", textMessageToEdit: object.message});
                    messageInputRef.current?.emptyInputField();
                    mySetAddToMsgInputText(object.message.getText());
                }
            });
            return () => subMessageEdited.unsubscribe(); 
    }, [mySetAddToMsgInputText, dispatch, messageInputRef]);

    useEffect(
        /**
         * Add `cc-button-clicked` event listener to the live reaction button element
         */
        () => {
            if (!liveReactionBtnElement) {
                return;
            }
            async function handleEvent() {
                try {
                    const reactionURL = LiveReactionIconURL; 
                    const { receiverId, receiverType } = getReceiverDetails();
                    const data = {type: "live_reaction", reactionURL};
                    CometChat.sendTransientMessage(new CometChat.TransientMessage(receiverId, receiverType, data));
                    CometChatMessageEvents.ccLiveReaction.next(reactionURL);
                }
                catch(error) {
                    errorHandler(error);
                }
            }
            const eventName = "cc-button-clicked";
            liveReactionBtnElement.addEventListener(eventName, handleEvent);
            return () => {
                liveReactionBtnElement.removeEventListener(eventName, handleEvent);
            };
    }, [LiveReactionIconURL, liveReactionBtnElement, errorHandler, getReceiverDetails]);

    useEffect(
        /**
         * Add `cc-actionsheet-clicked` event listener to the action sheet element
         */
        () => {
            if (!actionSheetElement || !mediaFilePickerRef.current) {
                return;
            }
            function handleEvent(e : CustomEvent) {
                const { action } = e.detail;
                // Hide the secondary content view
                secondaryBtnElement?.click();
                dispatch({type: "setContentToDisplay", contentToDisplay: "none"});
                const actionOnClick = actionIdToActionOnClick.current.get(`${action.id}`); 
                if (typeof actionOnClick === "function") {
                    actionOnClick();
                }
                else {
                    // Open the correct file picker
                    mediaFilePickerRef.current!.accept = `${action.id}/*`;
                    mediaFilePickerRef.current!.click();
                }
            }
            const eventName = "cc-actionsheet-clicked";
            actionSheetElement.addEventListener(eventName, handleEvent);
            return () => {
                actionSheetElement.removeEventListener(eventName, handleEvent);
            };
    }, [secondaryBtnElement, actionSheetElement, dispatch, actionIdToActionOnClick, mediaFilePickerRef]);

    useEffect(
        /**
         * Add `cc-preview-close-clicked` event listener to the preview element
         */
        () => {
            if (!textMessageEditPreviewElement) {
                return;
            }
            function onPreviewCloseClick() {
                dispatch({type: "setTextMessageToEdit", textMessageToEdit: null});
                // Empty the text in the message composer
                dispatch({type: "setText", text: ""}); 
                messageInputRef.current?.emptyInputField();
            }
            const eventName = "cc-preview-close-clicked";
            textMessageEditPreviewElement.addEventListener(eventName, onPreviewCloseClick);
            return () => {
                textMessageEditPreviewElement.removeEventListener(eventName, onPreviewCloseClick);
            };
    }, [textMessageEditPreviewElement, dispatch, messageInputRef]);

    useEffect(
        /**
         * Add `cc-button-clicked` event listener to the secondary button element
         */
        () => {
            if (!secondaryBtnElement) {
                return;
            }
            function onSecondaryBtnClick() {
                switch(contentToDisplay) {
                    case "attachments":
                        dispatch({type: "setContentToDisplay", contentToDisplay: "none"});
                        break;
                    case "emojiKeyboard":
                        auxiliaryBtnElement?.click();
                        dispatch({type: "setContentToDisplay", contentToDisplay: "attachments"});
                        break;
                    case "none":
                        dispatch({type: "setContentToDisplay", contentToDisplay: "attachments"});
                        break;
                    default: {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const x : never = contentToDisplay;
                    }
                }
            }
            const eventName = "cc-button-clicked";
            secondaryBtnElement.addEventListener(eventName, onSecondaryBtnClick);
            return () => {
                secondaryBtnElement.removeEventListener(eventName, onSecondaryBtnClick);
            };
    }, [contentToDisplay, secondaryBtnElement, auxiliaryBtnElement, dispatch]);

    useEffect(
        /**
         * Add `cc-button-clicked` event listener to the auxiliary button element
         */
        () => {
            if (!auxiliaryBtnElement) {
                return;
            }
            function onAuxiliaryBtnClick() {
                switch(contentToDisplay) {
                    case "attachments":
                        secondaryBtnElement?.click();
                        dispatch({type: "setContentToDisplay", contentToDisplay: "emojiKeyboard"});
                        break;
                    case "emojiKeyboard":
                        dispatch({type: "setContentToDisplay", contentToDisplay: "none"});
                        break;
                    case "none":
                        dispatch({type: "setContentToDisplay", contentToDisplay: "emojiKeyboard"});
                        break;
                    default: {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const x : never = contentToDisplay;
                    }
                }
            }
            const eventName = "cc-button-clicked";
            auxiliaryBtnElement.addEventListener(eventName, onAuxiliaryBtnClick);
            return () => {
                auxiliaryBtnElement.removeEventListener(eventName, onAuxiliaryBtnClick);
            };
    }, [contentToDisplay, secondaryBtnElement, auxiliaryBtnElement, dispatch]);

    useEffect(
        /**
         * Add `cc-emoji-clicked` event listener to the emoji keyboard element
         */
        () => {
            if (!emojiKeyboardElement) {
                return;
            }
            function onEmojiClicked(e : CustomEvent) {
                const emoji = e.detail.id;
                if (typeof emoji === "string")
                    mySetAddToMsgInputText(emoji);
            }
            const eventName = "cc-emoji-clicked";
            emojiKeyboardElement.addEventListener(eventName, onEmojiClicked);
            return () => {
                emojiKeyboardElement.removeEventListener(eventName, onEmojiClicked);
            };
    }, [mySetAddToMsgInputText, emojiKeyboardElement, dispatch]);

    useEffect(
        /**
         * Add `cc-button-clicked` event listener to the primary button element
         */
        () => {
            if (!primaryBtnElement) {
                return;
            }
            function handleEvent() {
                handleSendButtonClick(text);
            }
            const eventName = "cc-button-clicked";
            primaryBtnElement.addEventListener(eventName, handleEvent);
            return () => {
                primaryBtnElement.removeEventListener(eventName, handleEvent);
            };
    }, [handleSendButtonClick, text, primaryBtnElement]);

    useEffect(
        /**
         * Add `cc-message-input-entered` event listener to the message input element
         */
        () => {
            const messageInputElement = messageInputRef.current;
            if (!messageInputElement) {
                return;
            }
            function onMessageInputEnter(e : CustomEvent) {
                const textToSend = e.detail.value;
                if (typeof textToSend === "string") 
                    handleSendButtonClick(textToSend);
            }
            const eventName = "cc-message-input-entered";
            messageInputElement.addEventListener(eventName, onMessageInputEnter);
            return () => {
                messageInputElement.removeEventListener(eventName, onMessageInputEnter);
            };
    }, [handleSendButtonClick, messageInputRef]);

    useEffect(
        /**
         * Add `cc-message-input-changed` event listener to the message input element
         */
        () => {
            const messageInputElement = messageInputRef.current;
            if (!messageInputElement) {
                return;
            }
            function onMessageInputChange(e : CustomEvent) {
                const newText = e.detail.value;
                if (typeof newText === "string") {
                    handleTyping();
                    dispatch({type: "setText", text: newText});
                    if (onTextChange !== undefined)
                        onTextChange(newText);
                }
            }
            const eventName = "cc-message-input-changed";
            messageInputElement.addEventListener(eventName, onMessageInputChange);
            return () => {
                messageInputElement.removeEventListener(eventName, onMessageInputChange);
            };
    }, [onTextChange, handleTyping, dispatch, messageInputRef]);

    useEffect(
        /**
         * Subscribes to showModal & hideModal UI event to show & hide the Polls UI.
         */
        () => {
            const subShowModal = CometChatUIEvents.ccShowModal.subscribe((data: IModal) => {
                dispatch({type: "setShowPoll", showPoll: true});
                createPollViewRef.current = data.child;
            });

            const subHideModal = CometChatUIEvents.ccHideModal.subscribe(() => {
                dispatch({type: "setShowPoll", showPoll: false});
                createPollViewRef.current = null;

            });
            return () => {
                subShowModal.unsubscribe();
                subHideModal.unsubscribe();
            }
    }, [createPollViewRef, dispatch]);
}
