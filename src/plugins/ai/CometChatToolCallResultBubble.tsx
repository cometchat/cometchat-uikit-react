/**
 * CometChatToolCallResultBubble
 *
 * Displays the result returned by a tool call as formatted JSON.
 * Valid JSON is pretty-printed (2-space indent); invalid JSON is shown raw.
 * Renders nothing when the result is empty or null.
 *
 */

import React, { useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatToolCallResultBubbleProps } from './ai.types';
import './CometChatToolCallResultBubble.css';
import { useLocale } from '../../context/locale/LocaleContext';

function extractResultText(message: CometChat.BaseMessage): string | null {
  try {
    const msgWithData = message as unknown as {
      getToolResultMessageData?: () => {
        getText?: () => string;
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return msgWithData.getToolResultMessageData?.()?.getText?.() ?? null;
  } catch {
    return null;
  }
}

function formatResult(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export const CometChatToolCallResultBubble: React.FC<CometChatToolCallResultBubbleProps> = ({
  message,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const resultText = useMemo(() => extractResultText(message), [message]);
  const formattedResult = useMemo(
    () => (resultText ? formatResult(resultText) : null),
    [resultText]
  );

  if (!formattedResult) return null;

  const rootClasses = ['cometchat-toolcall-result-bubble', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      <div className={'cometchat-toolcall-result-bubble__label'}>
        {getLocalizedString('ai_tool_call_result')}
      </div>
      <pre className={'cometchat-toolcall-result-bubble__code'}>{formattedResult}</pre>
    </div>
  );
};

CometChatToolCallResultBubble.displayName = 'CometChatToolCallResultBubble';

export default CometChatToolCallResultBubble;
