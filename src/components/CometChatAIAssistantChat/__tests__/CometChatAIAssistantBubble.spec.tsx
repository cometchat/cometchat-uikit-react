import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantBubble } from '../CometChatAIAssistantBubble';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

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

// Stub the card renderer so we can assert it receives the stringified payload.
vi.mock('@cometchat/cards-react', () => ({
  CometChatCardView: ({ cardJson }: { cardJson: string }) => (
    <div data-testid="card-view" data-card-json={cardJson} />
  ),
}));

/**
 * Build a message exposing getAssistantMessageData().getText().
 * Pass a receiverType to simulate a group agent message (which hides the
 * inline copy button); omit it for a 1:1 message (which keeps it).
 */
function makeAssistantMessage(
  text: string | undefined,
  receiverType: string = CometChatUIKitConstants.MessageReceiverType.user
): CometChat.BaseMessage {
  return {
    getAssistantMessageData: () => ({ getText: () => text }),
    getReceiverType: () => receiverType,
  } as unknown as CometChat.BaseMessage;
}

/** Build a message exposing ordered content blocks via getElements(). */
function makeElementsMessage(
  elements: { type: string; data: unknown }[],
  flatText?: string,
  receiverType: string = CometChatUIKitConstants.MessageReceiverType.user
): CometChat.BaseMessage {
  return {
    getAssistantMessageData: () => ({ getText: () => flatText }),
    getElements: () => elements.map(e => ({ getType: () => e.type, getData: () => e.data })),
    getReceiverType: () => receiverType,
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
      getReceiverType: () => CometChatUIKitConstants.MessageReceiverType.user,
    } as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatAIAssistantBubble message={message} />);
    expect(
      container.querySelector('.cometchat-ai-assistant-bubble__content')?.textContent
    ).toContain('from getText');
  });

  it('falls back to data.text when no accessor methods return text', () => {
    const message = {
      data: { text: 'data text' },
      getReceiverType: () => CometChatUIKitConstants.MessageReceiverType.user,
    } as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatAIAssistantBubble message={message} />);
    expect(
      container.querySelector('.cometchat-ai-assistant-bubble__content')?.textContent
    ).toContain('data text');
  });

  it('falls back to data.content when data.text is absent', () => {
    const message = {
      data: { content: 'data content' },
      getReceiverType: () => CometChatUIKitConstants.MessageReceiverType.user,
    } as unknown as CometChat.BaseMessage;
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

  it('renders the inline copy button for a 1:1 (non-group) message', () => {
    render(
      <CometChatAIAssistantBubble
        message={makeAssistantMessage('hi', CometChatUIKitConstants.MessageReceiverType.user)}
      />
    );
    expect(screen.queryByRole('button')).toBeInTheDocument();
  });

  it('hides the inline copy button for a group agent message', () => {
    const { container } = render(
      <CometChatAIAssistantBubble
        message={makeAssistantMessage('hi', CometChatUIKitConstants.MessageReceiverType.group)}
      />
    );
    expect(screen.queryByRole('button')).toBeNull();
    // content still renders
    expect(
      container.querySelector('.cometchat-ai-assistant-bubble__content')?.textContent
    ).toContain('hi');
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

  it('renders text and card blocks in array order from getElements()', () => {
    const message = makeElementsMessage(
      [
        { type: 'text', data: 'Intro line' },
        { type: 'card', data: { card: { version: '1.0' }, cardId: 'c1' } },
        { type: 'text', data: 'Outro line' },
      ],
      'flat fallback'
    );
    const { container } = render(<CometChatAIAssistantBubble message={message} />);

    // Card renderer receives the stringified card payload, no transformation.
    const cardView = screen.getByTestId('card-view');
    expect(cardView.getAttribute('data-card-json')).toBe(JSON.stringify({ version: '1.0' }));

    // Blocks appear in array order: text → card → text.
    const blocks = Array.from(
      container.querySelectorAll(
        '.cometchat-ai-assistant-bubble__content, [data-testid="card-view"]'
      )
    );
    expect(blocks).toHaveLength(3);
    expect(blocks[0]?.textContent).toContain('Intro line');
    expect(blocks[1]?.getAttribute('data-testid')).toBe('card-view');
    expect(blocks[2]?.textContent).toContain('Outro line');
  });

  it('skips a card block whose card payload is missing', () => {
    const message = makeElementsMessage([{ type: 'card', data: {} }], 'flat fallback');
    render(<CometChatAIAssistantBubble message={message} />);
    expect(screen.queryByTestId('card-view')).toBeNull();
  });

  it('hides the inline copy button for a group message rendered via getElements() (card + text)', () => {
    const message = makeElementsMessage(
      [
        { type: 'text', data: 'Here is a card' },
        { type: 'card', data: { card: { version: '1.0' }, cardId: 'c1' } },
      ],
      'Here is a card',
      CometChatUIKitConstants.MessageReceiverType.group
    );
    render(<CometChatAIAssistantBubble message={message} />);
    // Card still renders, but no inline copy button (group uses context-menu copy).
    expect(screen.getByTestId('card-view')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the inline copy button for a 1:1 message rendered via getElements()', () => {
    const message = makeElementsMessage(
      [{ type: 'text', data: 'Here is a card' }],
      'Here is a card',
      CometChatUIKitConstants.MessageReceiverType.user
    );
    render(<CometChatAIAssistantBubble message={message} />);
    expect(screen.queryByRole('button')).toBeInTheDocument();
  });

  it('falls back to flat getText() rendering when getElements() is empty (regression)', () => {
    const message = makeElementsMessage([], 'plain assistant reply');
    const { container } = render(<CometChatAIAssistantBubble message={message} />);
    expect(screen.queryByTestId('card-view')).toBeNull();
    expect(
      container.querySelector('.cometchat-ai-assistant-bubble__content')?.textContent
    ).toContain('plain assistant reply');
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
