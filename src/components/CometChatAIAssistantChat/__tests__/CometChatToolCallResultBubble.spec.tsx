/**
 * Unit tests for CometChatToolCallResultBubble: what a tool result renders as
 * (pretty JSON, raw text, or nothing) and how it tolerates odd messages.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatToolCallResultBubble } from '../CometChatToolCallResultBubble';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key }),
}));

function resultMessage(text: string | undefined): CometChat.BaseMessage {
  return {
    getToolResultMessageData: () => ({ getText: () => text }),
  } as unknown as CometChat.BaseMessage;
}

const codeOf = (container: HTMLElement) =>
  container.querySelector('.cometchat-toolcall-result-bubble__code')?.textContent;

describe('CometChatToolCallResultBubble', () => {
  it('pretty-prints a JSON result under the localized label', () => {
    const { container } = render(
      <CometChatToolCallResultBubble message={resultMessage('{"temp":21,"unit":"C"}')} />
    );
    expect(screen.getByText('ai_tool_call_result')).toBeInTheDocument();
    expect(codeOf(container)).toBe('{\n  "temp": 21,\n  "unit": "C"\n}');
  });

  it('shows a non-JSON result verbatim', () => {
    const { container } = render(
      <CometChatToolCallResultBubble message={resultMessage('Booked for 7pm')} />
    );
    expect(codeOf(container)).toBe('Booked for 7pm');
  });

  it.each([
    ['an empty result', resultMessage('')],
    ['a missing result', resultMessage(undefined)],
    ['a message without tool result data', {} as unknown as CometChat.BaseMessage],
    [
      'a message whose accessor throws',
      {
        getToolResultMessageData: () => {
          throw new Error('bad payload');
        },
      } as unknown as CometChat.BaseMessage,
    ],
  ])('renders nothing for %s', (_label, message) => {
    const { container } = render(<CometChatToolCallResultBubble message={message} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('adds a caller className next to the base class', () => {
    const { container } = render(
      <CometChatToolCallResultBubble message={resultMessage('1')} className="mine" />
    );
    expect(container.firstElementChild).toHaveClass('cometchat-toolcall-result-bubble', 'mine');
  });
});
