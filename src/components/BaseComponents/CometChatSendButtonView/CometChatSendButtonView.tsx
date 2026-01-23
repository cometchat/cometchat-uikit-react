import { memo, useEffect, useState } from "react";
import { stopStreamingMessage, streamingState$ } from '../../../services/stream-message.service';
const CometChatSendButtonView = ({ isButtonDisabled }: { isButtonDisabled: boolean }) => {
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const subscription = streamingState$.subscribe(setIsStreaming);
    return () => subscription.unsubscribe();
  }, []);

  return (
    <button
      type="button"
      aria-label={isStreaming ? "Stop streaming message" : "Send message"}
      disabled={isButtonDisabled}
      onClick={() => {
        if (isStreaming) {
          stopStreamingMessage();
        }
      }}
      className={`cometchat-ai-assistant-chat__send-button-view ${!isButtonDisabled && 'cometchat-ai-assistant-chat__send-button-view--active'}
                  ${isStreaming && 'cometchat-ai-assistant-chat__send-button-view--streaming'}
                  `}
    >
      <span className="cometchat-ai-assistant-chat__send-button-icon" aria-hidden="true"></span>
    </button>
  );
};

export { CometChatSendButtonView };
