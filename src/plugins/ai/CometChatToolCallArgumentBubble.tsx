/**
 * CometChatToolCallArgumentBubble
 *
 * Displays the arguments passed to a tool call as formatted JSON.
 * Valid JSON is pretty-printed (2-space indent); invalid JSON is shown raw.
 *
 */

import React, { useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatToolCallArgumentBubbleProps } from './ai.types';
import './CometChatToolCallArgumentBubble.css';
import { useLocale } from '../../context/locale/LocaleContext';

interface ToolCall {
  id?: string;
  displayName?: string;
  executionText?: string;
  function?: {
    arguments?: string;
  };
}

function extractToolCalls(message: CometChat.BaseMessage): ToolCall[] {
  try {
    const msgWithData = message as unknown as {
      getToolArgumentMessageData?: () => {
        getToolCalls?: () => ToolCall[];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return msgWithData.getToolArgumentMessageData?.()?.getToolCalls?.() ?? [];
  } catch {
    return [];
  }
}

function formatArguments(argsString: string): string {
  try {
    return JSON.stringify(JSON.parse(argsString), null, 2);
  } catch {
    return argsString;
  }
}

export const CometChatToolCallArgumentBubble: React.FC<CometChatToolCallArgumentBubbleProps> = ({
  message,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const toolCalls = useMemo(() => extractToolCalls(message), [message]);

  if (toolCalls.length === 0) return null;

  const rootClasses = ['cometchat-toolcall-argument-bubble', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      {toolCalls.map((toolCall, index) => (
        <div key={toolCall.id ?? index} className={'cometchat-toolcall-argument-bubble__item'}>
          <div className={'cometchat-toolcall-argument-bubble__name'}>
            {toolCall.displayName ?? 'Tool'}
          </div>
          {toolCall.executionText && (
            <div className={'cometchat-toolcall-argument-bubble__execution-text'}>
              {toolCall.executionText}
            </div>
          )}
          <div className={'cometchat-toolcall-argument-bubble__label'}>
            {getLocalizedString('ai_tool_call_arguments')}
          </div>
          <pre className={'cometchat-toolcall-argument-bubble__code'}>
            {formatArguments(toolCall.function?.arguments ?? '{}')}
          </pre>
        </div>
      ))}
    </div>
  );
};

CometChatToolCallArgumentBubble.displayName = 'CometChatToolCallArgumentBubble';

export default CometChatToolCallArgumentBubble;
