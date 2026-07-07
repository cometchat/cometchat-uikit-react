import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { CometChatCardView } from '@cometchat/cards-react';
import { getThemeMode, isMobileDevice } from '../../../utils/util';
import { CometChatFullScreenViewer } from '../CometChatFullScreenViewer/CometChatFullScreenViewer';
import { CometChatUIEvents } from '../../../events/CometChatUIEvents';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';

interface CometChatAIAssistantMessageBubbleProps {
  message?: CometChat.AIAssistantMessage
}

/**
 * One ordered block of a persisted agent message, read through the typed SDK
 * accessors on {@link CometChat.AIAssistantElement}.
 */
const getElementType = (element: CometChat.AIAssistantElement): string =>
  element.getType();
const getElementData = (element: CometChat.AIAssistantElement): any =>
  element.getData();

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
  // Shared markdown renderer config, reused for every text block.
  const markdownComponents = {
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
  };

  // Persisted agent cards: render the ordered element blocks (text + card) in
  // array order. The SDK returns an empty array for older messages that have no
  // `elements`, in which case we fall back to the flat getText() path.
  const elements: CometChat.AIAssistantElement[] = message?.getElements?.() ?? [];

  const handleCardAction = (event: any) => {
    if (!event || !event.action || !message) return;
    // Nested card: only the UI event bus is reachable (no app prop here).
    CometChatUIEvents.ccCardActionClicked.next({ message, action: event.action });
  };

  // Used only when there are no `elements` (older messages), so the flat text is
  // the whole payload.
  const renderTextFallback = () => {
    const text = message?.getAssistantMessageData()?.getText() || '';
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        children={text}
        components={markdownComponents}
      />
    );
  };

  const renderCardElement = (element: CometChat.AIAssistantElement, index: number) => {
    const data = getElementData(element);
    // Per spec the card block's value is `{ card, cardId }`; tolerate value being
    // the card object directly.
    const cardPayload = data?.card ?? data;
    if (!cardPayload) return null;
    let cardJson = '';
    try {
      cardJson = typeof cardPayload === 'string' ? cardPayload : JSON.stringify(cardPayload);
    } catch {
      return null;
    }
    if (!cardJson) return null;
    return (
      <div key={`card-${index}`} className="cometchat-ai-assistant-message-bubble__card">
        <CometChatCardView
          cardJson={cardJson}
          themeMode={CometChatUIKit.themeMode as any}
          onAction={handleCardAction}
        />
      </div>
    );
  };

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
        {Array.isArray(elements) && elements.length > 0
          ? elements.map((element: CometChat.AIAssistantElement, index: number) => {
            if (getElementType(element) === 'card') {
              return renderCardElement(element, index);
            }
            const value = getElementData(element);
            const text = typeof value === 'string' ? value : (value?.text ?? '');
            return (
              <ReactMarkdown
                key={`text-${index}`}
                remarkPlugins={[remarkGfm]}
                children={text}
                components={markdownComponents}
              />
            );
          })
          : renderTextFallback()}
      </div>
    </div>
  );


};

export { CometChatAIAssistantMessageBubble };