import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { getThemeMode, isMobileDevice } from '../../../utils/util';
import { CometChatFullScreenViewer } from '../CometChatFullScreenViewer/CometChatFullScreenViewer';
import { CometChatUIEvents } from '../../../events/CometChatUIEvents';

interface CometChatAIAssistantMessageBubbleProps {
  message?: CometChat.AIAssistantMessage
}

const CometChatAIAssistantMessageBubble: React.FC<CometChatAIAssistantMessageBubbleProps> = ({ message }) => {
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
  return (
    <div className='cometchat'
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        className='cometchat-ai-assistant-message-bubble'
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          children={message?.getAssistantMessageData()?.getText() || ''}
          components={{
            code({ node, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !className || !match;
              return !isInline && match ? (
                <SyntaxHighlighter
                            className="cometchat-ai-assistant-message-bubble__code-block"
                language={match[1]} PreTag="div" style={theme}>
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code 
                className={className} {...props}>
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
                  className='cometchat-ai-assistant-message-bubble__link'
                  {...props}
                >
                  {children}
                </a>
              );
            },
            img({ node, ...props }: any) {
              return (
                <>
                  <span className="cometchat-ai-assistant-message-bubble__image-intersection-start"></span>
                  <img
                    {...props}
                    onClick={() => {
                      if (!isMobileDevice() && message)
                        CometChatUIEvents.ccShowDialog.next({
                          child: (
                            <CometChatFullScreenViewer
                              url={props.src}
                              ccCloseClicked={() => {
                                CometChatUIEvents.ccHideDialog.next();
                              }}
                              message={message}
                            />
                          ),
                          confirmCallback: null,
                        });
                    }}
                  />
                  <span className="cometchat-ai-assistant-message-bubble__image-intersection-end"></span>
                </>
              );
            },
          }}
        />
      </div>
    </div>
  );


};

export { CometChatAIAssistantMessageBubble };