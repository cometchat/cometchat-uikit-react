import { useRef, useState, useCallback, useMemo, useContext } from "react";
import "my-cstom-package-lit";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatUIKitUtility, MessageComposerConfiguration, MessageListConfiguration, ThreadedMessagesStyle } from 'uikit-utils-lerna';
import { ChatConfigurator } from "../Shared/Framework/ChatConfigurator";
import { CometChatMessageEvents, localize, fontHelper, MessageStatus, IMessages, CometChatUIKitConstants } from "uikit-resources-lerna";
import { CometChatMessageList } from "../CometChatMessageList";
import { CometChatMessageComposer } from "../CometChatMessageComposer";
import { ThreadedMessagesActionViewStyle, ThreadedMessagesBubbleViewStyle, ThreadedMessagesCloseButtonStyle, ThreadedMessagesComposerStyle, ThreadedMessagesHeaderStyle, ThreadedMessagesListStyle, ThreadedMessagesTitleStyle, ThreadedMessagesWrapperStyle } from "./style";
import { Hooks } from "./hooks";
import { CometChatContext } from "../CometChatContext";
import Close2xIcon from './assets/close2x.svg';
import { useCometChatErrorHandler } from "../CometChatCustomHooks";

interface IThreadedMessagesProps {
    parentMessage: CometChat.BaseMessage,
    title?: string,
    closeIconURL?: string,
    bubbleView?: any,
    messageActionView?: any,
    onClose?: any,
    onError?: any,
    threadedMessagesStyle?: any,
    messageListConfiguration?: any,
    messageComposerConfiguration?: any
}

const threadMessagesStyle = {
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    titleColor: "rgba(20, 20, 20)",
    titleFont: "700 22px Inter",
    closeIconTint: "#3399FF"
};

const titleStyle: any = {
    textFont: "700 22px Inter",
    textColor: "black",
    background: "transparent",
}
const buttonStyle: any = {
    height: "24px",
    width: "24px",
    border: "none",
    borderRadius: "0",
    background: "transparent",
    buttonIconTint: "#7dbfff"
}

const actionButtonStyle: any = {
    height: "100%",
    width: "100%",
    border: "none",
    borderTop: "1px solid #e1e1e1",
    borderBottom: "1px solid #e1e1e1",
    borderRadius: "0",
    background: "transparent",
    buttonTextFont: "500 15px Inter",
    buttonTextColor: "black",
    padding: "8px"
}

const CometChatThreadedMessages = (props: IThreadedMessagesProps) => {
    const {
        parentMessage,
        title = localize("THREAD"),
        closeIconURL = Close2xIcon,
        bubbleView = null,
        messageActionView = null,
        onError,
        onClose = () => {},
        threadedMessagesStyle = threadMessagesStyle,
        messageListConfiguration = new MessageListConfiguration({}),
        messageComposerConfiguration = new MessageComposerConfiguration({})
    } = props;

    const { theme } = useContext(CometChatContext);

    const [parentMessageObject, setParentMessageObject] = useState<CometChat.BaseMessage>(parentMessage);

    const threadedMessagesStyleRef = useRef(threadedMessagesStyle);
    let defaultStyle: ThreadedMessagesStyle = new ThreadedMessagesStyle({
        width: "100%",
        height: "100%",
        background: theme.palette.getBackground(),
        borderRadius: "none",
        border: "none",
        titleColor: theme.palette.getAccent(),
        titleFont: fontHelper(theme.typography.title1),
        closeIconTint: theme.palette.getPrimary()
    });
    threadedMessagesStyleRef.current = { ...defaultStyle, ...threadedMessagesStyle };
    titleStyle.textFont = threadedMessagesStyleRef?.current?.titleFont || fontHelper(theme.typography.title1);
    titleStyle.textColor = threadedMessagesStyleRef?.current?.titleColor || theme.palette.getAccent();
    titleStyle.background = "transparent";

    buttonStyle.buttonIconTint = threadedMessagesStyleRef?.current?.closeIconTint || theme.palette.getPrimary();
    actionButtonStyle.background = theme.palette.getBackground();
    actionButtonStyle.buttonTextFont = fontHelper(theme.typography.subtitle1);
    actionButtonStyle.buttonTextColor = theme.palette.getAccent600();

    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
    const onErrorCallback = useCometChatErrorHandler(onError);

    const userObject = useMemo(() => {
        if(loggedInUser && parentMessage?.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user){
            if (parentMessage?.getSender()?.getUid() === loggedInUser?.getUid()) {
                return parentMessage?.getReceiver() as CometChat.User;
            } else {
                return parentMessage?.getSender() as CometChat.User;
            }
        }
    }, [parentMessage, loggedInUser]);

    const groupObject = useMemo(()=>{
        if(loggedInUser){
            if (parentMessage?.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group) {
                return parentMessage?.getReceiver() as CometChat.Group;
            }
        }
    }, [loggedInUser, parentMessage]);

    const parentMessageObjectId = parentMessageObject.getId();

    const requestBuilder = useMemo(() => {
        return new CometChat.MessagesRequestBuilder().setCategories(ChatConfigurator.getDataSource().getAllMessageCategories()).setTypes(ChatConfigurator.getDataSource().getAllMessageTypes()).hideReplies(true).setLimit(20).setParentMessageId(parentMessageObjectId);
    }, [parentMessageObjectId]);

    const updateReceipt = useCallback((messageReceipt: CometChat.MessageReceipt) => {
        try {
            if (Number(messageReceipt?.getMessageId()) === parentMessageObjectId) {
                if (messageReceipt?.getReadAt()) {
                    setParentMessageObject((prevState: CometChat.BaseMessage) => {
                        const tempObject = CometChatUIKitUtility.clone(prevState) as CometChat.BaseMessage;
                        tempObject?.setReadAt(messageReceipt?.getReadAt());
                        return tempObject;
                    });
                } else if (messageReceipt?.getDeliveredAt()) {
                    setParentMessageObject((prevState: CometChat.BaseMessage) => {
                        const tempObject = CometChatUIKitUtility.clone(prevState) as CometChat.BaseMessage;
                        tempObject?.setReadAt(messageReceipt?.getDeliveredAt());
                        return tempObject;
                    });
                }
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [parentMessageObjectId, setParentMessageObject, onErrorCallback]);

    const updateMessage = useCallback((message: CometChat.BaseMessage) => {
        try {
            if (parentMessageObjectId === message?.getId()) {
                setParentMessageObject((prevState: CometChat.BaseMessage) => {
                    const tempObject = CometChatUIKitUtility.clone(message) as CometChat.BaseMessage;
                    return tempObject;
                });
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [parentMessageObjectId, setParentMessageObject, onErrorCallback])

    const addListener = useCallback(() => {
        const msgListenerId = "message_" + Date.now();
        CometChat.addMessageListener(
            msgListenerId,
            new CometChat.MessageListener({
                onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
                    updateReceipt(messageReceipt);
                },
                onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
                    updateReceipt(messageReceipt);
                },
                onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
                    updateMessage(deletedMessage);
                },
                onMessageEdited: (editedMessage: CometChat.BaseMessage) => {
                    updateMessage(editedMessage);
                },
            })
        );
        return () => CometChat.removeMessageListener(msgListenerId);
    }, [updateReceipt, updateMessage]);

    const subscribeToEvents = useCallback(() => {
        try {
            const ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe(({ status, message }: IMessages) => {
                if (status === MessageStatus.success && message?.getParentMessageId() === parentMessageObject?.getId()) {
                    setParentMessageObject((prevState: CometChat.BaseMessage) => {
                        const tempObject = CometChatUIKitUtility.clone(prevState) as CometChat.BaseMessage;
                        if(tempObject.getReplyCount()){
                            tempObject.setReplyCount(prevState.getReplyCount() + 1);
                        }else{
                            tempObject.setReplyCount(1);
                        }
                        return tempObject;
                    });
                }
            })
            const ccMessageEdited = CometChatMessageEvents.ccMessageEdited.subscribe(({ status, message }: IMessages) => {
                if (status === MessageStatus.success && message?.getId() === parentMessageObject?.getId()) {
                    setParentMessageObject((prevState: CometChat.BaseMessage) => {
                        const tempObject = CometChatUIKitUtility.clone(message) as CometChat.BaseMessage;
                        return tempObject;
                    });
                }
            })
            const ccMessageDeleted = CometChatMessageEvents.ccMessageDeleted.subscribe((message: CometChat.BaseMessage) => {
                if (message?.getId() === parentMessageObject?.getId()) {
                    setParentMessageObject((prevState: CometChat.BaseMessage) => {
                        const tempObject = CometChatUIKitUtility.clone(message) as CometChat.BaseMessage;
                        return tempObject;
                    });
                }
            })
            const ccMessageRead = CometChatMessageEvents.ccMessageRead.subscribe((message: CometChat.BaseMessage) => {
                if (message?.getId() === parentMessageObject?.getId()) {
                    setParentMessageObject((prevState: CometChat.BaseMessage) => {
                        const tempObject = CometChatUIKitUtility.clone(prevState) as CometChat.BaseMessage;
                        tempObject?.setReadAt(message?.getReadAt());
                        return tempObject;
                    });
                }
            })

            return () => {
                try {
                    ccMessageDeleted?.unsubscribe();
                    ccMessageEdited?.unsubscribe();
                    ccMessageRead?.unsubscribe();
                    ccMessageSent?.unsubscribe();
                } catch (error: any) {
                    onErrorCallback(error);
                }
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [parentMessageObject, setParentMessageObject, onErrorCallback]);

    const closeView = useCallback(() => {
        onClose();
    }, [onClose])

    const wrapperStyle = () => {
        return {
            background: threadedMessagesStyleRef?.current?.background || theme.palette.getBackground(),
            height: threadedMessagesStyleRef?.current?.height,
            width: threadedMessagesStyleRef?.current?.width,
            border: threadedMessagesStyleRef?.current?.border,
            borderRadius: threadedMessagesStyleRef?.current?.borderRadius
        }
    }

    const getThreadCount = () => {
        try {
            const replyCount = parentMessageObject?.getReplyCount() || 0;
            const suffix = replyCount === 1 ? localize("REPLY") : localize("REPLIES");
            return `${replyCount} ${suffix}`;
        } catch (error: any) {
            onErrorCallback(error);
        }
    }

    const getBubbleView = useCallback(() => {
        if (parentMessageObject) {
            return bubbleView(parentMessageObject);
        }
        return null;
    }, [parentMessageObject, bubbleView])

    Hooks(
        loggedInUser,
        setLoggedInUser,
        addListener,
        subscribeToEvents,
        onErrorCallback
    )

    return (
        <div className="cc__threadedmessages__wrapper" style={{ ...wrapperStyle(), ...ThreadedMessagesWrapperStyle() }}>
            <div className="cc__threadedmessages__header" style={ThreadedMessagesHeaderStyle()}>
                <div className="cc__threadedmessages__title" style={ThreadedMessagesTitleStyle()}>
                    <cometchat-label text={title} labelStyle={JSON.stringify(titleStyle)}></cometchat-label>
                </div>
                <div className="cc__threadedmessages__close" style={ThreadedMessagesCloseButtonStyle()}>
                    <cometchat-button iconURL={closeIconURL} buttonStyle={JSON.stringify(buttonStyle)} onClick={closeView}></cometchat-button>
                </div>
            </div>
            <div className="cc__threadedmessages__bubbleview" style={ThreadedMessagesBubbleViewStyle()}>
                {getBubbleView()}
            </div>
            <div className="cc__threadedmessages__actionview" style = {ThreadedMessagesActionViewStyle()}>
                {
                    messageActionView ?
                        messageActionView :
                        <cometchat-button text={getThreadCount()} buttonStyle={JSON.stringify(actionButtonStyle)}></cometchat-button>
                }
            </div>
            <div className="cc__threadedmessages__list" style={ThreadedMessagesListStyle()}>
                <CometChatMessageList
                    parentMessageId={parentMessageObject?.getId()}
                    user={userObject}
                    group={groupObject}
                    emptyStateView={messageListConfiguration?.emptyStateView}
                    loadingStateView={messageListConfiguration?.loadingStateView}
                    errorStateView={messageListConfiguration?.errorStateView}
                    disableReceipt={messageListConfiguration?.disableReceipt}
                    readIcon={messageListConfiguration?.readIcon}
                    deliveredIcon={messageListConfiguration?.deliveredIcon}
                    sentIcon={messageListConfiguration?.sentIcon}
                    waitIcon={messageListConfiguration?.waitIcon}
                    errorIcon={messageListConfiguration?.errorIcon}
                    alignment={messageListConfiguration?.alignment}
                    showAvatar={messageListConfiguration?.showAvatar}
                    datePattern={messageListConfiguration?.datePattern}
                    timestampAlignment={messageListConfiguration?.timestampAlignment}
                    DateSeparatorPattern={messageListConfiguration?.DateSeparatorPattern}
                    templates={messageListConfiguration?.messageTypes}
                    messagesRequestBuilder={messageListConfiguration?.messagesRequestBuilder || requestBuilder}
                    thresholdValue={messageListConfiguration?.thresholdValue}
                    onThreadRepliesClick={messageListConfiguration?.onThreadRepliesClick}
                    headerView={messageListConfiguration?.headerView}
                    footerView={messageListConfiguration?.footerView}
                    avatarStyle={messageListConfiguration?.avatarStyle}
                    dateSeparatorStyle={messageListConfiguration?.dateSeparatorStyle}
                    messageListStyle={messageListConfiguration?.messageListStyle}
                    onError={messageListConfiguration?.onError}
                />
            </div>
            <div className="cc__threadedmessages__composer" style={ThreadedMessagesComposerStyle()}>
                <CometChatMessageComposer
                    parentMessageId={parentMessageObject?.getId()}
                    user={userObject}
                    group={groupObject}
                    text={messageComposerConfiguration?.text}
                    headerView={messageComposerConfiguration?.headerView}
                    onTextChange={messageComposerConfiguration?.onTextChange}
                    attachmentIconURL={messageComposerConfiguration?.attachmentIconURL}
                    attachmentOptions={messageComposerConfiguration?.attachmentOptions}
                    secondaryButtonView={messageComposerConfiguration?.secondaryButtonView}
                    auxiliaryButtonView={messageComposerConfiguration?.auxilaryButtonView}
                    auxiliaryButtonAlignment={messageComposerConfiguration?.auxiliaryButtonsAlignment}
                    sendButtonView={messageComposerConfiguration?.sendButtonView}
                    hideLiveReaction={messageComposerConfiguration?.hideLiveReaction}
                    LiveReactionIconURL={messageComposerConfiguration?.LiveReactionIconURL}
                    messageComposerStyle={messageComposerConfiguration?.messageComposerStyle}
                    onSendButtonClick={messageComposerConfiguration?.onSendButtonClick}
                    onError={messageComposerConfiguration?.onError}
                />
            </div>
        </div>
    );
}

export { CometChatThreadedMessages };