import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatToolCallArgumentBubble } from '../CometChatToolCallArgumentBubble';

// Mock the locale hook so getLocalizedString returns the key itself.
// This keeps assertions independent of translation file contents.
vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    tDateTimeParser: () => '',
    language: 'en-us',
    dateLocaleLanguage: 'en-us',
  }),
}));

interface ToolCall {
  id?: string;
  displayName?: string;
  executionText?: string;
  function?: { arguments?: string };
}

/** Build a message-like object exposing getToolArgumentMessageData().getToolCalls(). */
function makeMessage(toolCalls: ToolCall[]): CometChat.BaseMessage {
  return {
    getToolArgumentMessageData: () => ({
      getToolCalls: () => toolCalls,
    }),
  } as unknown as CometChat.BaseMessage;
}

describe('CometChatToolCallArgumentBubble', () => {
  it('returns null when there are no tool calls', () => {
    const { container } = render(<CometChatToolCallArgumentBubble message={makeMessage([])} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when the message lacks tool argument data', () => {
    const message = {} as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatToolCallArgumentBubble message={message} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when extraction throws', () => {
    const message = {
      getToolArgumentMessageData: () => {
        throw new Error('boom');
      },
    } as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatToolCallArgumentBubble message={message} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the tool display name', () => {
    const message = makeMessage([
      { id: '1', displayName: 'Weather Lookup', function: { arguments: '{"city":"Paris"}' } },
    ]);
    render(<CometChatToolCallArgumentBubble message={message} />);
    expect(screen.getByText('Weather Lookup')).toBeInTheDocument();
  });

  it('falls back to "Tool" when displayName is missing', () => {
    const message = makeMessage([{ id: '1', function: { arguments: '{}' } }]);
    render(<CometChatToolCallArgumentBubble message={message} />);
    expect(screen.getByText('Tool')).toBeInTheDocument();
  });

  it('renders the localized arguments label', () => {
    const message = makeMessage([{ id: '1', displayName: 'T', function: { arguments: '{}' } }]);
    render(<CometChatToolCallArgumentBubble message={message} />);
    expect(screen.getByText('ai_tool_call_arguments')).toBeInTheDocument();
  });

  it('pretty-prints valid JSON arguments with 2-space indent', () => {
    const message = makeMessage([
      { id: '1', displayName: 'T', function: { arguments: '{"city":"Paris","days":3}' } },
    ]);
    const { container } = render(<CometChatToolCallArgumentBubble message={message} />);
    const code = container.querySelector('.cometchat-toolcall-argument-bubble__code');
    expect(code?.textContent).toBe('{\n  "city": "Paris",\n  "days": 3\n}');
  });

  it('shows raw string when arguments are not valid JSON', () => {
    const message = makeMessage([
      { id: '1', displayName: 'T', function: { arguments: 'not-json{' } },
    ]);
    const { container } = render(<CometChatToolCallArgumentBubble message={message} />);
    const code = container.querySelector('.cometchat-toolcall-argument-bubble__code');
    expect(code?.textContent).toBe('not-json{');
  });

  it('defaults to "{}" when function arguments are missing', () => {
    const message = makeMessage([{ id: '1', displayName: 'T' }]);
    const { container } = render(<CometChatToolCallArgumentBubble message={message} />);
    const code = container.querySelector('.cometchat-toolcall-argument-bubble__code');
    expect(code?.textContent).toBe('{}');
  });

  it('renders execution text only when present', () => {
    const withText = makeMessage([
      { id: '1', displayName: 'T', executionText: 'Calling API...', function: { arguments: '{}' } },
    ]);
    const { container, rerender } = render(<CometChatToolCallArgumentBubble message={withText} />);
    expect(screen.getByText('Calling API...')).toBeInTheDocument();
    expect(
      container.querySelector('.cometchat-toolcall-argument-bubble__execution-text')
    ).toBeTruthy();

    const withoutText = makeMessage([{ id: '2', displayName: 'T', function: { arguments: '{}' } }]);
    rerender(<CometChatToolCallArgumentBubble message={withoutText} />);
    expect(
      container.querySelector('.cometchat-toolcall-argument-bubble__execution-text')
    ).toBeNull();
  });

  it('renders one item per tool call', () => {
    const message = makeMessage([
      { id: 'a', displayName: 'First', function: { arguments: '{}' } },
      { id: 'b', displayName: 'Second', function: { arguments: '{}' } },
    ]);
    const { container } = render(<CometChatToolCallArgumentBubble message={message} />);
    expect(container.querySelectorAll('.cometchat-toolcall-argument-bubble__item')).toHaveLength(2);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('handles tool calls without an id (uses index as key)', () => {
    const message = makeMessage([{ displayName: 'NoId', function: { arguments: '{}' } }]);
    const { container } = render(<CometChatToolCallArgumentBubble message={message} />);
    expect(container.querySelectorAll('.cometchat-toolcall-argument-bubble__item')).toHaveLength(1);
    expect(screen.getByText('NoId')).toBeInTheDocument();
  });

  it('applies a custom className alongside the base class', () => {
    const message = makeMessage([{ id: '1', displayName: 'T', function: { arguments: '{}' } }]);
    const { container } = render(
      <CometChatToolCallArgumentBubble message={message} className="my-extra" />
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain('cometchat-toolcall-argument-bubble');
    expect(root?.className).toContain('my-extra');
  });

  it('renders only the base class when no className is provided', () => {
    const message = makeMessage([{ id: '1', displayName: 'T', function: { arguments: '{}' } }]);
    const { container } = render(<CometChatToolCallArgumentBubble message={message} />);
    expect(container.firstElementChild?.className).toBe('cometchat-toolcall-argument-bubble');
  });
});
