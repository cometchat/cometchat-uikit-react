import { localize } from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import closeIcon from "../../assets/close.svg";
import { useCallback, useEffect, useRef, useState } from "react";
import { DatePatterns, MessageBubbleAlignment, MessageStatus } from "../../Enums/Enums";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { MessageUtils } from "../../utils/MessageUtils";
import { CometChatMessageTemplate } from "../../modals";
import { CometChatUIKit } from "../../CometChatUIKit/CometChatUIKit";
import { CometChatDate } from "../BaseComponents/CometChatDate/CometChatDate";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { CollaborativeDocumentConstants } from "../Extensions/CollaborativeDocument/CollaborativeDocumentConstants";
import { CollaborativeWhiteboardConstants } from "../Extensions/CollaborativeWhiteboard/CollaborativeWhiteboardConstants";
import { StickersConstants } from "../Extensions/Stickers/StickersConstants";
import { CometChatMessageEvents, IMessages } from "../../events/CometChatMessageEvents";
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";

interface ThreadedMessagePreviewProps {
    /**
     * Hides the visibility of the date header.
     * @default false
     */
    hideDate?: boolean;
  
    /**
     * Hides the visibility of the reply count.
     * @default false
     */
    hideReplyCount?: boolean;
  
    /**
     * Represents the parent message for displaying threaded conversations.
     */
    parentMessage: CometChat.BaseMessage;
  
    /**
     * Template for customizing the appearance of the message.
     */
    template?: CometChatMessageTemplate;
  
    /**
     * Callback function triggered when the threaded message header is closed.
     * @returns void
     */
    onClose?: () => void;
  
    /**
     * A custom view for rendering the message bubble.
     *
     * @param messageObject - The message to be rendered.
     * @returns A JSX Element to be rendered as message bubble view.
     */
    messageBubbleView?: (messageObject: CometChat.BaseMessage) => JSX.Element;
  
    /**
     * Callback function triggered when an error occurs.
     * 
     * @param error - An instance of CometChat.CometChatException representing the error.
     * @returns void
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
}

const CometChatThreadedMessagePreview = (props: ThreadedMessagePreviewProps) => {
    const {
        parentMessage,
        messageBubbleView,
        onClose,
        onError = (error: CometChat.CometChatException) => {
            console.log(error);
        },
        hideDate = false,
        hideReplyCount = false,
    } = props;

    const loggedInUser = useRef<CometChat.User | null>(null);
    const [replyCount, setReplyCount] = useState<number>(0);
    const onErrorCallback = useCometChatErrorHandler(onError);

    useEffect(() => {
        try {
            setReplyCount(parentMessage?.getReplyCount() ?? 0);
        } catch (error) {
            onErrorCallback(error, 'useEffect');
        }
    }, [parentMessage, setReplyCount]);

    useEffect(() => {
        try {
            loggedInUser.current = CometChatUIKitLoginListener.getLoggedInUser();
        } catch (error) {
            onErrorCallback(error, 'useEffect');
        }
    }, []);

    const addListener = useCallback(() => {
        try {
            const onTextMessageReceived =
                CometChatMessageEvents.onTextMessageReceived.subscribe(
                    (message: CometChat.TextMessage) => {
                        if (
                            message?.getParentMessageId() &&
                            message.getParentMessageId() == parentMessage.getId()
                        ) {
                            setReplyCount((prevCount) => prevCount + 1);
                        }
                    }
                );
            const onMediaMessageReceived =
                CometChatMessageEvents.onMediaMessageReceived.subscribe(
                    (message: CometChat.MediaMessage) => {
                        if (
                            message?.getParentMessageId() &&
                            message.getParentMessageId() == parentMessage.getId()
                        ) {
                            setReplyCount((prevCount) => prevCount + 1);
                        }
                    }
                );
            const onCustomMessageReceived =
                CometChatMessageEvents.onCustomMessageReceived.subscribe(
                    (message: CometChat.CustomMessage) => {
                        if (
                            message?.getParentMessageId() &&
                            message.getParentMessageId() == parentMessage.getId()
                        ) {
                            setReplyCount((prevCount) => prevCount + 1);
                        }
                    }
                );
                const onFormMessageReceived =
                CometChatMessageEvents.onFormMessageReceived.subscribe((message:CometChat.InteractiveMessage) => {
                    if (
                        message?.getParentMessageId() &&
                        message.getParentMessageId() == parentMessage.getId()
                    ) {
                        setReplyCount((prevCount) => prevCount + 1);
                    }
                });
            const onSchedulerMessageReceived =
                CometChatMessageEvents.onSchedulerMessageReceived.subscribe((message:CometChat.InteractiveMessage) => {
                    if (
                        message?.getParentMessageId() &&
                        message.getParentMessageId() == parentMessage.getId()
                    ) {
                        setReplyCount((prevCount) => prevCount + 1);
                    }
                });
            const onCardMessageReceived =
                CometChatMessageEvents.onCardMessageReceived.subscribe((message:CometChat.InteractiveMessage) => {
                    if (
                        message?.getParentMessageId() &&
                        message.getParentMessageId() == parentMessage.getId()
                    ) {
                        setReplyCount((prevCount) => prevCount + 1);
                    }
                });
            const onCustomInteractiveMessageReceived =
                CometChatMessageEvents.onCustomInteractiveMessageReceived.subscribe(
                    (message:CometChat.InteractiveMessage) => {
                        if (
                            message?.getParentMessageId() &&
                            message.getParentMessageId() == parentMessage.getId()
                        ) {
                            setReplyCount((prevCount) => prevCount + 1);
                        }
                    }
                );

            return () => {
                onTextMessageReceived?.unsubscribe();
                onMediaMessageReceived?.unsubscribe();
                onCustomMessageReceived?.unsubscribe();
                onFormMessageReceived?.unsubscribe();
                onSchedulerMessageReceived?.unsubscribe();
                onCardMessageReceived?.unsubscribe();
                onCustomInteractiveMessageReceived?.unsubscribe();
            };
        }
        catch (error) {
            onErrorCallback(error, 'addListener');
            return () => { }
        }
    }, [parentMessage]);

    const subscribeToEvents = useCallback(() => {
        try {
            const ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe(
                ({ status, message }: IMessages) => {
                    if (
                        status === MessageStatus.success &&
                        message?.getParentMessageId() === parentMessage?.getId()
                    ) {
                        setReplyCount((prevCount) => prevCount + 1);
                    }
                }
            );

            return () => {
                ccMessageSent?.unsubscribe();
            };
        } catch (error) {
            onErrorCallback(error, 'subscribeToEvents');
            return () => { }
        }
    }, [parentMessage]);

    useEffect(() => {
        try {
            if (loggedInUser) {
                const removeListener = addListener();
                const unsubscribeFromEvents = subscribeToEvents();
                return () => {
                    removeListener();
                    unsubscribeFromEvents();
                };
            }
        } catch (error) {
            onErrorCallback(error, 'useEffect');
        }
    }, [loggedInUser, addListener, subscribeToEvents]);

    /* This function returns close button view. */
    function getCloseBtnView() {
        try {
            return (
                <CometChatButton
                    iconURL={closeIcon}
                    hoverText={localize("CLOSE")}
                    onClick={onClose}
                />
            );
        } catch (error) {
            onErrorCallback(error, 'getCloseBtnView');
        }
    }

    /* This function returns Message bubble view of which information is getting viewed. */
    const getBubbleView = useCallback(() => {
        try {
            let alignment = MessageBubbleAlignment.right;
            if (parentMessage && loggedInUser.current) {
                if (messageBubbleView) return messageBubbleView(parentMessage);
                else {
                    const templatesArray = CometChatUIKit.getDataSource()?.getAllMessageTemplates();
                    const template = templatesArray?.find((template: CometChatMessageTemplate) => template.type === parentMessage.getType() && template.category === parentMessage.getCategory());
                    if (!template) {
                        return <></>
                    }
                    if (parentMessage.getSender()?.getUid() !== loggedInUser.current?.getUid()) {
                        alignment = MessageBubbleAlignment.left;
                    } else {
                        alignment = MessageBubbleAlignment.right;
                    }

                    const view = new MessageUtils().getMessageBubble(
                        parentMessage,
                        template,
                        alignment
                    );
                    return view;
                }
            }
            return null;
        } catch (error) {
            onErrorCallback(error, 'getBubbleView');
        }
        return null;
    }, [parentMessage, messageBubbleView]);

    const getAdditionalClassName = useCallback(() => {
        try {
            const messageTypes = [CometChatUIKitConstants.MessageTypes.audio, CometChatUIKitConstants.MessageTypes.file, CometChatUIKitConstants.MessageTypes.text, CollaborativeDocumentConstants.extension_document, CollaborativeWhiteboardConstants.extension_whiteboard, StickersConstants.sticker];
            if (parentMessage && messageTypes.includes(parentMessage.getType())) return "cometchat-threaded-message-preview__message-small";
        } catch (error) {
            onErrorCallback(error, 'getAdditionalClassName');
        }
    }, [parentMessage]);


    return (
        <div className="cometchat">
            <div className="cometchat-threaded-message-preview">
                <div className="cometchat-threaded-message-preview__header">
                    <div className="cometchat-threaded-message-preview__header-title">
                        {localize("THREAD")}
                    </div>
                    <div className="cometchat-threaded-message-preview__header-close">
                        {getCloseBtnView()}
                    </div>

                </div>
                <div className="cometchat-threaded-message-preview__content">
                    {!hideDate && <div className="cometchat-threaded-message-preview__content-time">
                        <CometChatDate
                            timestamp={parentMessage.getSentAt()}
                            pattern={DatePatterns.DayDate}
                        ></CometChatDate>
                    </div>}
                    <div className={`cometchat-threaded-message-preview__message ${parentMessage.getSender()?.getUid() !== loggedInUser.current?.getUid() ? "cometchat-threaded-message-preview__message-incoming" : "cometchat-threaded-message-preview__message-outgoing"} ${getAdditionalClassName()}`}>
                        {getBubbleView()}
                    </div>

                    <div className="cometchat-threaded-message-preview__footer">
                        {!hideReplyCount && <div className="cometchat-threaded-message-preview__footer-reply-count">
                            {replyCount + " "}
                            {
                                (replyCount === 0 || replyCount > 1) ? localize("REPLIES") : localize("REPLY")
                            }
                        </div>}
                        <div className="cometchat-threaded-message-preview__footer-divider" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export { CometChatThreadedMessagePreview }