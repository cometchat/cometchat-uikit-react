import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';
import { getAIAssistantTools, IStreamData, messageStream, stopStreamingMessage, streamingState$ } from '../../../services/stream-message.service';
import { getLocalizedString } from '../../../resources/CometChatLocalize/cometchat-localize';
import CometChatErrorView from '../CometChatErrorView/CometChatErrorView';
import remarkGfm from 'remark-gfm';
import { getThemeMode } from '../../../utils/util';
interface CometChatStreamMessageBubbleProps {
  message?: CometChat.AIAssistantBaseEvent
}


const CometChatStreamMessageBubble: React.FC<CometChatStreamMessageBubbleProps> = ({ message }) => {
  const initialMessageRef = useRef<CometChat.AIAssistantBaseEvent | undefined>(message);
  const [data, setData] = useState<CometChat.AIAssistantBaseEvent | null>(initialMessageRef.current || null);
  const [fullMessage, setFullMessage] = useState<string>("");
    const [executionText, setExecutionText] = useState<string>("");
  const toolCallNameRef = useRef<string>("")
  const toolCallDataRef = useRef<object>({})

  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const toolEventsMap = [
    CometChatUIKitConstants.streamMessageTypes.tool_call_args,
    CometChatUIKitConstants.streamMessageTypes.tool_call_end,
    CometChatUIKitConstants.streamMessageTypes.tool_call_result,
    CometChatUIKitConstants.streamMessageTypes.tool_call_start
  ]
  function getMarkDownTheme() {
    return getThemeMode() === 'dark' ? oneDark : oneLight;
  }
  const [theme, setTheme] = useState<any>(getMarkDownTheme());

  useEffect(() => {
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setTheme(getMarkDownTheme());
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(getMarkDownTheme());
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [message]);

  const connectionStatusListener = useCallback(() => {
    const status = navigator.onLine ? 'online' : 'offline';
    if (status === "offline") {
      setHasError(true);
      stopStreamingMessage();
    }
  },[]);
  useEffect(() => {
   
  window.addEventListener('online', connectionStatusListener);
  window.addEventListener('offline', connectionStatusListener);
    const streamState = streamingState$.subscribe(setIsStreaming);

    const subscription = messageStream.subscribe((data: IStreamData) => {
      // If messageId is provided, only update this specific message
      if (initialMessageRef.current?.getMessageId() && data.message.getMessageId() !== initialMessageRef.current?.getMessageId()) {
        return;
      }

      // Handle tool call events
      const eventType = data.message.getType();
      if (toolEventsMap.includes(eventType)) {
        if(eventType === CometChatUIKitConstants.streamMessageTypes.tool_call_start){
          toolCallNameRef.current = (data.message as CometChat.AIAssistantToolStartedEvent).getToolCallName();
          setExecutionText(data.message.getData()?.executionText || getLocalizedString("ai_assistant_chat_executing_tool"));
        }
        if (eventType === CometChatUIKitConstants.streamMessageTypes.tool_call_args) {
          toolCallDataRef.current = JSON.parse((data.message as CometChat.AIAssistantToolArgumentEvent).getDelta());

        }
        if (eventType === CometChatUIKitConstants.streamMessageTypes.tool_call_end) {
          const assistantTools = getAIAssistantTools();
          const toolCallName = toolCallNameRef.current;

          if (toolCallName && assistantTools) {
            const handler = assistantTools.getAction(toolCallName);
            handler?.(toolCallDataRef.current);
          }
        }
      }

      if (!initialMessageRef.current?.getMessageId() || (data.message.getMessageId()) === initialMessageRef.current?.getMessageId()) {
        setData(data.message);
        if (data.streamedMessages && data.streamedMessages != "") {
          setFullMessage(data.streamedMessages);
        }
      }

      if (data.message.getType() === CometChatUIKitConstants.streamMessageTypes.run_finished) {
        subscription.unsubscribe();
        streamState.unsubscribe();
      }
    });

    return () => {
      subscription.unsubscribe();
      streamState.unsubscribe();
      window.removeEventListener('online', connectionStatusListener);
      window.removeEventListener('offline', connectionStatusListener);
    };
  }, []);
  return (
    <div className='cometchat'
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        className='cometchat-stream-message-bubble'
      >
        
        {(!data || (isStreaming && data && data.getType() === CometChatUIKitConstants.streamMessageTypes.run_started)) && (
          <span className="cometchat-stream-message-bubble__thinking">
            <span className="cometchat-stream-message-bubble__thinking-text">{getLocalizedString("ai_assistant_chat_thinking")}</span>
          </span>
        )}
        {data && data.getType() !== CometChatUIKitConstants.streamMessageTypes.run_started && toolEventsMap.includes(data?.getType()) ?   <span className='cometchat-stream-message-bubble__tool-call-text cometchat-stream-message-bubble__thinking '>
          <span className='cometchat-stream-message-bubble__thinking-text'>
            {executionText}
          </span>
        </span> : null}
     

        {fullMessage && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            children={fullMessage}
            components={{
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !className || !match;
                return !isInline && match ? (
                  <SyntaxHighlighter 
                          className="cometchat-stream-message-bubble__code-block"

                  language={match[1]} PreTag="div" style={theme}>
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              a({ href, children, ...props }: any) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className='cometchat-stream-message-bubble__link'
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              img({ node, ...props }: any) {
                return (
                  <>
                    <span className="cometchat-stream-message-bubble__image-intersection-start"></span>
                    <img
                      {...props}
                    />
                    <span className="cometchat-stream-message-bubble__image-intersection-end"></span>
                  </>
                );
              },
            }}
          />
        )}

      </div>
        {hasError && <CometChatErrorView message={getLocalizedString("ai_assistant_chat_no_internet")} />}

    </div>
  );


};


export { CometChatStreamMessageBubble };
