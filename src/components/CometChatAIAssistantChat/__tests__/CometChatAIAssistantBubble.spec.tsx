import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantBubble } from '../CometChatAIAssistantBubble';

// Mock the locale hook so getLocalizedString returns the key itself.
vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    tDateTimeParser: () => '',
    language: 'en-us',
    dateLocaleLanguage: 'en-us',
  }),
}));

// Mock the frame context so the bubble uses the main document.
vi.mock('../../../context/CometChatFrameContext', () => ({
  useCometChatFrameContext: () => ({ iframeDocument: null, iframeWindow: null, iframe: null }),
}));

// Mock the copy icon asset (svg import).
vi.mock('../../../assets/Copy.svg', () => ({ default: 'copy-icon.svg' }));

/** Build a message exposing getAssistantMessageData().getText(). */
function makeAssistantMessage(text: string | undefined): CometChat.BaseMessage {
  return {
    getAssistantMessageData: () => ({ getText: () => text }),
  } as unknown as CometChat.BaseMessage;
}

describe('CometChatAIAssistantBubble', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when there is no text', () => {
    const { container } = render(<CometChatAIAssistantBubble message={makeAssistantMessage('')} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when the message exposes no text accessors', () => {
    const message = {} as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatAIAssistantBubble message={message} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders plain text content', () => {
    const { container } = render(
      <CometChatAIAssistantBubble message={makeAssistantMessage('Hello there')} />
    );
    const content = container.querySelector('.cometchat-ai-assistant-bubble__content');
    expect(content?.textContent).toContain('Hello there');
  });

  it('renders markdown (bold) as HTML', () => {
    const { container } = render(
      <CometChatAIAssistantBubble message={makeAssistantMessage('**bold**')} />
    );
    const content = container.querySelector('.cometchat-ai-assistant-bubble__content');
    expect(content?.querySelector('b')?.textContent).toBe('bold');
  });

  it('sanitizes script tags from rendered HTML (XSS prevention)', () => {
    const { container } = render(
      <CometChatAIAssistantBubble message={makeAssistantMessage('<script>alert(1)</script>safe')} />
    );
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.textContent).toContain('safe');
  });

  it('defaults alignment to left', () => {
    const { container } = render(
      <CometChatAIAssistantBubble message={makeAssistantMessage('hi')} />
    );
    expect(container.firstElementChild?.getAttribute('data-alignment')).toBe('left');
  });

  it('applies alignment="right" when provided', () => {
    const { container } = render(
      <CometChatAIAssistantBubble message={makeAssistantMessage('hi')} alignment="right" />
    );
    expect(container.firstElementChild?.getAttribute('data-alignment')).toBe('right');
  });

  it('applies a custom className alongside the base class', () => {
    const { container } = render(
      <CometChatAIAssistantBubble message={makeAssistantMessage('hi')} className="extra" />
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain('cometchat-ai-assistant-bubble');
    expect(root?.className).toContain('extra');
  });

  it('falls back to getText() for TextMessage-like messages', () => {
    const message = {
      getText: () => 'from getText',
    } as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatAIAssistantBubble message={message} />);
    expect(
      container.querySelector('.cometchat-ai-assistant-bubble__content')?.textContent
    ).toContain('from getText');
  });

  it('falls back to data.text when no accessor methods return text', () => {
    const message = { data: { text: 'data text' } } as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatAIAssistantBubble message={message} />);
    expect(
      container.querySelector('.cometchat-ai-assistant-bubble__content')?.textContent
    ).toContain('data text');
  });

  it('falls back to data.content when data.text is absent', () => {
    const message = { data: { content: 'data content' } } as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatAIAssistantBubble message={message} />);
    expect(
      container.querySelector('.cometchat-ai-assistant-bubble__content')?.textContent
    ).toContain('data content');
  });

  it('renders the copy button with the default (not-copied) label', () => {
    render(<CometChatAIAssistantBubble message={makeAssistantMessage('hi')} />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('title')).toBe('ai_copy');
    expect(button.getAttribute('aria-label')).toBe('accessibility_copy_message');
  });

  it('copies text via navigator.clipboard and toggles to copied state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CometChatAIAssistantBubble message={makeAssistantMessage('copy me')} />);
    fireEvent.click(screen.getByRole('button'));

    expect(writeText).toHaveBeenCalledWith('copy me');
    await waitFor(() => {
      expect(screen.getByRole('button').getAttribute('title')).toBe('ai_copied');
    });
    // The "Copied!" text span appears in the copied state.
    expect(screen.getByText('ai_copied')).toBeInTheDocument();
  });

  it('resets the copied state after the timeout', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CometChatAIAssistantBubble message={makeAssistantMessage('copy me')} />);
    fireEvent.click(screen.getByRole('button'));

    // flush the resolved clipboard promise + setState
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('button').getAttribute('title')).toBe('ai_copied');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button').getAttribute('title')).toBe('ai_copy');
  });

  it('uses the execCommand fallback when clipboard API is unavailable', () => {
    Object.assign(navigator, { clipboard: undefined });
    const execCommand = vi.fn();
    // jsdom does not implement execCommand by default
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    render(<CometChatAIAssistantBubble message={makeAssistantMessage('fallback text')} />);
    fireEvent.click(screen.getByRole('button'));

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(screen.getByRole('button').getAttribute('title')).toBe('ai_copied');
  });
});
