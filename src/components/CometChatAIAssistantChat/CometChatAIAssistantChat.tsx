import { CometChatMessageHeader } from '../CometChatMessageHeader/CometChatMessageHeader';
import { CometChatMessageList } from '../CometChatMessageList/CometChatMessageList';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageComposer } from '../CometChatMessageComposer/CometChatMessageComposer';
import { CometChatButton } from '../BaseComponents/CometChatButton/CometChatButton';
import newChatIcon from '../../assets/new-chat.svg';
import chatHistoryIcon from '../../assets/chat-history.svg';
import closeButtonIcon from '../../assets/close.svg';
import aiEmptyIcon from '../../assets/Profile.png';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { setStreamSpeed, setAIAssistantTools, stopStreamingMessage, streamingState$ } from '../../services/stream-message.service';
import { Subscription } from 'rxjs';
import { CometChatSendButtonView } from '../BaseComponents/CometChatSendButtonView/CometChatSendButtonView';
import { CometChatAIAssistantTools } from '../../modals/CometChatAIAssistantTools';
import { CometChatAIAssistantChatHistory } from '../CometChatAIAssistantChatHistory/CometChatAIAssistantChatHistory';
import { CometChatMessageEvents, IMessages } from '../../events/CometChatMessageEvents';
import { MessageStatus, PreviewMessageMode } from '../../Enums/Enums';
import { getLocalizedString } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatMessageTemplate } from '../../modals';

interface MessageComposerViewProps {
    user: CometChat.User;
    parentMessageId: number | null;
    startNewChat: boolean;
    onError?: (e: CometChat.CometChatException) => void;
    setParentMessageId: (id: number | null) => void;
    onSendButtonClick?: (message: CometChat.BaseMessage,previewMessageMode?: PreviewMessageMode) => void;
}

interface AIAssistantChatProps {
    hideChatHistory?: boolean;
    hideNewChat?: boolean;
    user: CometChat.User;
    onBackButtonClicked?: () => void;
    onCloseButtonClicked?: () => void;
    onSendButtonClick?: (message: CometChat.BaseMessage,previewMessageMode?: PreviewMessageMode) => void;
    showBackButton?: boolean;
    showCloseButton?: boolean;
    headerItemView?: React.JSX.Element;
    headerTitleView?: React.JSX.Element;
    headerSubtitleView?: React.JSX.Element;
    headerLeadingView?: React.JSX.Element;
    headerTrailingView?: React.JSX.Element;
    headerAuxiliaryButtonView?: React.JSX.Element;
    streamingSpeed?: number;
    suggestedMessages?: Array<string>;
    hideSuggestedMessages?: boolean;
    emptyView?: React.JSX.Element;
    loadingView?: React.JSX.Element;
    errorView?: React.JSX.Element;
    onError?: (e: CometChat.CometChatException) => void;
    emptyChatGreetingView?: React.JSX.Element;
    emptyChatIntroMessageView?: React.JSX.Element;
    emptyChatImageView?: React.JSX.Element;
    aiAssistantTools?: CometChatAIAssistantTools;
    templates?: CometChatMessageTemplate[];
};

/**
 * MessageComposerView component for AI Assistant Chat
 */
const MessageComposerView = React.memo(({ user, parentMessageId, startNewChat, onError, setParentMessageId,onSendButtonClick }: MessageComposerViewProps) => {
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [isStreaming, setIsStreaming] = useState(false);
    const parentMessageIdRef = useRef(parentMessageId);

    useEffect(() => {
        parentMessageIdRef.current = parentMessageId;
    }, [parentMessageId]);

    useEffect(() => {
        const streamSubscription = streamingState$.subscribe(setIsStreaming);
        const ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe((data: IMessages) => {
            if (data.status == MessageStatus.success && !data.message.getParentMessageId() && data.message.getReceiverId() == user.getUid() && !parentMessageIdRef.current) {
                setParentMessageId(data.message.getId());
            }
            if (data.status == MessageStatus.inprogress || data.status == MessageStatus.success) {
                setIsStreaming(true)
            }
            else {
                setIsStreaming(false);
            }
        })
        return () => {
             streamSubscription?.unsubscribe();
             ccMessageSent?.unsubscribe();
             setIsStreaming(false);
             setIsButtonDisabled(true);
             stopStreamingMessage();
        };
    }, [user, setParentMessageId]);

    return <div
        className={`cometchat-ai-assistant-chat__message-composer-view ${isStreaming && 'cometchat-ai-assistant-chat__message-composer-view--disabled'}`}
        onKeyDown={(e) => {
            // Prevent all keyboard interactions when streaming
            if (isStreaming) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }}
    >
        <CometChatMessageComposer
            parentMessageId={parentMessageId ? parentMessageId : undefined}
            key={`message-composer-${startNewChat}`}
            hideAttachmentButton={true}
            disableMentions={true}
            disableSoundForMessage={true}
            disableTypingEvents={true}
            hideEmojiKeyboardButton={true}
            hideStickersButton={true}
            sendButtonView={<CometChatSendButtonView isButtonDisabled={isButtonDisabled} />}
            hideVoiceRecordingButton={true}
            placeholderText={getLocalizedString("ai_assistant_chat_composer_placeholder")}
            onTextChange={(text: string) => {
                if (isStreaming) return;

                if (text && text.trim() !== "") {
                    setIsButtonDisabled(false);
                }
                else {
                    setIsButtonDisabled(true);
                }
            }}
            onSendButtonClick={onSendButtonClick ? (message: CometChat.BaseMessage) => {
                setIsButtonDisabled(true);
                onSendButtonClick(message);
            } : undefined}
            user={user}
            onError={onError}
        />
    </div>
});

/**
 * A wrapper component that encapsulates the AI agent chat interface.
 * It integrates the CometChatMessageHeader, CometChatMessageList, and      CometChatMessageComposer components to provide a complete chat experience.
 */
const CometChatAIAssistantChatComponent = (props: AIAssistantChatProps) => {

    const {
        hideChatHistory = false,
        hideNewChat = false,
        user,
        onBackButtonClicked,
        onCloseButtonClicked,
        onSendButtonClick,
        showBackButton = false,
        showCloseButton = false,
        headerItemView,
        headerTitleView,
        headerSubtitleView,
        headerLeadingView,
        headerTrailingView,
        headerAuxiliaryButtonView,
        streamingSpeed = 30,
        suggestedMessages = [],
        hideSuggestedMessages = false,
        emptyView,
        loadingView,
        errorView,
        onError,
        emptyChatGreetingView,
        emptyChatIntroMessageView,
        emptyChatImageView,
        aiAssistantTools,
        templates
    } = props;

    const [startNewChat, setStartNewChat] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [goToMessage, setGoToMessage] = useState<CometChat.BaseMessage | null>(null);
    const [parentMessageId, setParentMessageId] = useState<number | null>(null);
    const parentMessageIdRef = useRef<number | null>(null);

    // Use suggestions from props if available, otherwise use default suggestions
    const displaySuggestions = suggestedMessages.length > 0 ? suggestedMessages : (user.getMetadata() as any)?.suggestedMessages as string[];
    const streamStateRef = useRef<Subscription | null>(null);
    useEffect(() => {
        if (aiAssistantTools) {
            setAIAssistantTools(aiAssistantTools)
        }
    }, [aiAssistantTools])


    // Function to set auxiliary view in message header.
    const setAuxiliaryView = useCallback(() => {
        if (headerAuxiliaryButtonView) {
            return headerAuxiliaryButtonView;
        }
        return <div className='cometchat-ai-assistant-chat__header-auxiliary-view'>
            {!hideNewChat && <div className='cometchat-ai-assistant-chat__header-auxiliary-view-new-chat'><CometChatButton hoverText={getLocalizedString("ai_assistant_chat_new_chat")} onClick={onNewChatButtonClick} iconURL={newChatIcon} /></div>}
            {!hideChatHistory && <div className='cometchat-ai-assistant-chat__header-auxiliary-view-chat-history'>
                <CometChatButton hoverText={getLocalizedString("ai_assistant_chat_history_title")} onClick={onHistoryButtonClick} iconURL={chatHistoryIcon} />

            </div>}
            {showCloseButton && <div className='cometchat-ai-assistant-chat__header-auxiliary-view-close-button'>
                <CometChatButton hoverText={getLocalizedString("thread_close_hover")} onClick={onCloseButtonClicked} iconURL={closeButtonIcon} />

            </div>}
        </div>
    }, [hideNewChat, hideChatHistory, showCloseButton, headerAuxiliaryButtonView])

    const onNewChatButtonClick = () => {
        // Force component rerender by updating state
        setStartNewChat(prev => !prev);
        setGoToMessage(null)
        setParentMessageId(null);
        parentMessageIdRef.current = null;
        stopStreamingMessage();
    }

    const onHistoryButtonClick = () => {
        setIsSidebarOpen(prev => !prev);
    }

    // Initialize streaming configuration and subscribe to streaming state
    useEffect(() => {
        setStreamSpeed(streamingSpeed);
        return () => streamStateRef.current?.unsubscribe();

    }, [streamingSpeed])

    // Create default empty view for AI assistant
    const defaultEmptyView = (
        <div className="cometchat-ai-assistant-chat__empty-state">
            <div className="cometchat-ai-assistant-chat__empty-state-content">
                {emptyChatImageView || (
                    <div className="cometchat-ai-assistant-chat__empty-state-icon">
                        <img src={aiEmptyIcon} alt="AI Assistant" />
                    </div>
                )}
                {emptyChatGreetingView || (
                    <div className="cometchat-ai-assistant-chat__empty-state-greeting-message">
                        {(user.getMetadata() as any)?.greetingMessage ?? user.getName()}
                    </div>
                )}
                {emptyChatIntroMessageView || (
                    <div className="cometchat-ai-assistant-chat__empty-state-intro-message">
                        {(user.getMetadata() as any)?.introductoryMessage ?? getLocalizedString("ai_assistant_chat_intro_message")}

                    </div>
                )}
                {(!hideSuggestedMessages && displaySuggestions && displaySuggestions.length > 0) && <div className="cometchat-ai-assistant-chat__empty-state-suggested-messages">
                    {displaySuggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            className="cometchat-ai-assistant-chat__suggested-message-pill"
                            onClick={() => {
                                CometChatUIEvents.ccComposeMessage.next(suggestion);
                            }}
                        >
                            {suggestion}
                            <span className="cometchat-ai-assistant-chat__suggested-message-icon"></span>
                        </button>
                    ))}
                </div>}
            </div>
        </div>
    );

    function onDeleteChat(id?: number) {
        if (id) {
            if (parentMessageIdRef.current && id === parentMessageIdRef.current) {
                onNewChatButtonClick();
            }
        }
        else {
            onNewChatButtonClick();
            setIsSidebarOpen(false);
        }
    }
    return (
        <div className='cometchat' style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            <div className='cometchat-ai-assistant-chat__wrapper'>
                <div className="cometchat-ai-assistant-chat">
                    <CometChatMessageHeader
                        showBackButton={showBackButton}
                        key={user.getUid()}
                        onBack={onBackButtonClicked}
                        auxiliaryButtonView={setAuxiliaryView()}
                        hideVideoCallButton={true}
                        hideVoiceCallButton={true}
                        titleView={headerTitleView}
                        subtitleView={headerSubtitleView}
                        leadingView={headerLeadingView}
                        trailingView={headerTrailingView}

                        itemView={headerItemView}
                        user={user}
                        onError={onError}
                    />
                    <CometChatMessageList
                        key={`message-list-${startNewChat}-${goToMessage ? goToMessage?.getId() : 'none'}`}
                        user={user}
                        emptyView={emptyView || defaultEmptyView}
                        loadingView={loadingView}
                        errorView={errorView}
                        onError={onError}
                        isAgentChat={true}
                        hideReplyOption={true}
                        hideCopyMessageOption={true}
                        hideDateSeparator={true}
                        hideDeleteMessageOption={true}
                        hideEditMessageOption={true}
                        hideGroupActionMessages={true}
                        hideMessageInfoOption={true}
                        hideMessagePrivatelyOption={true}
                        hideReactionOption={true}
                        hideReplyInThreadOption={true}
                        hideStickyDate={true}
                        hideTranslateMessageOption={true}
                        hideFlagMessageOption={true}
                        disableSoundForMessages={true}
                        textFormatters={[]}
                        parentMessageId={goToMessage ? goToMessage?.getId() : undefined}
                        templates={templates}
                    />
                    <MessageComposerView 
                        user={user}
                        parentMessageId={parentMessageId}
                        startNewChat={startNewChat}
                        onError={onError}
                        setParentMessageId={setParentMessageId}
                        onSendButtonClick={onSendButtonClick}
                    />

                </div>
                <div className={`cometchat-ai-assistant-chat__sidebar ${isSidebarOpen ? 'cometchat-ai-assistant-chat__sidebar--open' : ''}`}>


                    <div className="cometchat-ai-assistant-chat__sidebar-content">
                        <CometChatAIAssistantChatHistory
                            hideNewChat={hideNewChat}
                            onNewChatClicked={onDeleteChat}
                            onMessageClicked={(message: CometChat.BaseMessage) => {
                                setGoToMessage(message);
                                setParentMessageId(message.getId());
                                parentMessageIdRef.current = message.getId();
                                setIsSidebarOpen(false);
                                stopStreamingMessage();
                            }}
                            onClose={() => {
                                setIsSidebarOpen(false)
                            }} user={user} />
                    </div>
                </div>

                {/* Overlay */}
                {isSidebarOpen && (
                    <div
                        className="cometchat-ai-assistant-chat__sidebar-overlay"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
            </div>
        </div>
    );
};

export const CometChatAIAssistantChat = React.memo(CometChatAIAssistantChatComponent);