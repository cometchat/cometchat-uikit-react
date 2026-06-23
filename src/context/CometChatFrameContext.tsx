import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface CometChatFrameContextValue {
  iframeDocument: Document | null;
  iframeWindow: Window | null;
  iframe: HTMLIFrameElement | null;
}

export interface CometChatFrameProviderProps {
  children: ReactNode;
  iframeId: string;
}

const CometChatFrameContext = createContext<CometChatFrameContextValue>({
  iframeDocument: null,
  iframeWindow: null,
  iframe: null,
});

export const useCometChatFrameContext = (): CometChatFrameContextValue => {
  const context = useContext(CometChatFrameContext);
  return context;
};

export const CometChatFrameProvider: React.FC<CometChatFrameProviderProps> = ({
  children,
  iframeId,
}) => {
  const [iframeDocument, setIframeDocument] = useState<Document | null>(null);
  const [iframeWindow, setIframeWindow] = useState<Window | null>(null);
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    let mutationObserver: MutationObserver | null = null;
    const maxRetries = 10;
    const baseDelay = 100;
    const maxDelay = 5000;

    const initializeIframe = (): boolean => {
      const iframeElement = document.getElementById(iframeId) as HTMLIFrameElement | null;

      if (!iframeElement?.contentWindow) {
        setIframe(null);
        setIframeWindow(null);
        setIframeDocument(null);
        return false;
      }

      try {
        const win = iframeElement.contentWindow;
        const doc = iframeElement.contentDocument ?? iframeElement.contentWindow.document;

        setIframe(iframeElement);
        setIframeWindow(win);
        setIframeDocument(doc);

        if (mutationObserver) {
          mutationObserver.disconnect();
          mutationObserver = null;
        }

        return true;
      } catch (error) {
        console.warn('CometChatFrameProvider: Failed to access iframe content:', error);
        return false;
      }
    };

    const scheduleRetry = () => {
      if (retryCount >= maxRetries) {
        console.warn(
          `CometChatFrameProvider: Failed to initialize iframe after ${String(maxRetries)} attempts`
        );
        return;
      }

      const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
      const jitter = Math.random() * 0.1 * delay;
      const finalDelay = delay + jitter;

      timeoutId = setTimeout(() => {
        retryCount++;
        if (!initializeIframe()) {
          scheduleRetry();
        }
      }, finalDelay);
    };

    const setupMutationObserver = () => {
      mutationObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.id === iframeId || element.querySelector(`#${iframeId}`)) {
                  if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                  }
                  retryCount = 0;
                  initializeIframe();
                }
              }
            });
          }
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    if (!initializeIframe()) {
      setupMutationObserver();
      scheduleRetry();
    }

    const handleIframeLoad = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      retryCount = 0;
      initializeIframe();
    };

    const iframeElement = document.getElementById(iframeId);
    if (iframeElement) {
      iframeElement.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      if (iframeElement) {
        iframeElement.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [iframeId]);

  const contextValue: CometChatFrameContextValue = {
    iframeDocument,
    iframeWindow,
    iframe,
  };

  return (
    <CometChatFrameContext.Provider value={contextValue}>{children}</CometChatFrameContext.Provider>
  );
};

export default CometChatFrameContext;
