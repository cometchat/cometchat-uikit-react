import { memo, useEffect, useState } from "react";
import { stopStreamingMessage, streamingState$ } from '../../../services/stream-message.service';
const CometChatSendButtonView = ({ isButtonDisabled }: { isButtonDisabled: boolean }) => {
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const subscription = streamingState$.subscribe(setIsStreaming);
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div
      onClick={() => {
        if (isStreaming) {
          stopStreamingMessage();
        }
      }} className={`cometchat-ai-assistant-chat__send-button-view ${!isButtonDisabled && 'cometchat-ai-assistant-chat__send-button-view--active'}
                  ${isStreaming && 'cometchat-ai-assistant-chat__send-button-view--streaming'}
                  `}>
      <div className='cometchat-ai-assistant-chat__send-button-icon'></div>
    </div>
  );
};

export { CometChatSendButtonView };
