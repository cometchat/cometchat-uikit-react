/**
 * Unit tests for CometChatStreamMessageBubble driven through the real
 * streaming service: thinking → tool → text → complete transitions, run
 * ownership and snapshots, copy, offline errors and streamed cards.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatStreamMessageBubble } from '../CometChatStreamMessageBubble';
import {
  handleWebsocketMessage,
  setStreamSpeed,
  startStreamingMessage,
  stopStreamingMessage,
} from '../CometChatAIStreamingService';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEventsContextValue } from '../../../context/CometChatEvents.types';

const cards = vi.hoisted(() => ({
  onAction: null as null | ((e: { action: unknown }) => void),
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key }),
}));
vi.mock('../../../assets/Copy.svg', () => ({ default: 'copy-icon.svg' }));
vi.mock('@cometchat/cards-react', () => ({
  CometChatCardView: ({
    cardJson,
    themeMode,
    onAction,
  }: {
    cardJson: string;
    themeMode: string;
    onAction: (e: { action: unknown }) => void;
  }) => {
    cards.onAction = onAction;
    return <div data-testid="card-view" data-card-json={cardJson} data-theme={themeMode} />;
  },
}));

const T = CometChatUIKitConstants.streamMessageTypes;
const CHAT = 'agent-bubble';

function emit(type: string, fields: Record<string, unknown> = {}) {
  const event = {
    getType: () => type,
    getMessageId: () => (fields.runId as string | undefined) ?? 'r1',
    getDelta: () => fields.delta ?? '',
    getToolCallName: () => fields.toolName ?? '',
    getData: () => ({ executionText: fields.executionText }),
    getCardId: () => fields.cardId ?? '',
    getExecutionText: () => fields.executionText ?? '',
    getCard: () => fields.card,
  } as unknown as CometChat.AIAssistantBaseEvent;
  act(() => {
    handleWebsocketMessage(event, CHAT);
  });
}

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value });
}

const bubbleText = (container: HTMLElement) =>
  container.querySelector('.cometchat-stream-message-bubble__content');

describe('CometChatStreamMessageBubble', () => {
  beforeEach(() => {
    setStreamSpeed(0);
    stopStreamingMessage(CHAT);
    cards.onAction = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('shows "Thinking..." until the first text chunk, then the rendered markdown', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    const { container } = render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    expect(screen.getByText('Thinking...')).toBeInTheDocument();

    emit(T.text_message_content, { delta: 'Hello **world**' });
    expect(screen.queryByText('Thinking...')).toBeNull();
    expect(bubbleText(container)?.querySelector('b')?.textContent).toBe('world');
    expect(bubbleText(container)?.textContent).toBe('Hello world');
    // No copy button while the answer is still streaming.
    expect(screen.queryByRole('button', { name: 'accessibility_copy_message' })).toBeNull();
  });

  it('accumulates chunks as they arrive', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    const { container } = render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    emit(T.text_message_content, { delta: 'One ' });
    emit(T.text_message_content, { delta: 'two' });
    expect(bubbleText(container)?.textContent).toBe('One two');
  });

  it('shows the tool being run, with a fallback label, and hides it when the tool ends', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);

    emit(T.tool_call_start, { runId: 'tc', toolName: 'search', executionText: 'Searching docs' });
    expect(screen.getByText('Searching docs')).toBeInTheDocument();
    expect(screen.queryByText('Thinking...')).toBeNull();
    emit(T.tool_call_end, { runId: 'tc' });
    expect(screen.queryByText('Searching docs')).toBeNull();

    emit(T.tool_call_start, { runId: 'tc2', toolName: 'lookup' });
    expect(screen.getByText('Executing lookup...')).toBeInTheDocument();
  });

  it('offers copy once complete; copying writes the raw text and briefly shows "copied"', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    emit(T.text_message_content, { delta: 'Use **bold**' });
    emit(T.run_finished);

    const copy = screen.getByRole('button', { name: 'accessibility_copy_message' });
    await act(async () => {
      fireEvent.click(copy);
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('Use **bold**');
    expect(screen.getByRole('button', { name: 'ai_copied' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'accessibility_copy_message' })).toBeInTheDocument();
  });

  it('falls back to execCommand("copy") when the Clipboard API is unavailable', () => {
    vi.useFakeTimers();
    setClipboard(undefined);
    let copiedValue: string | undefined;
    const execCommand = vi.fn(() => {
      copiedValue = document.querySelector('textarea')?.value;
      return true;
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      writable: true,
      value: execCommand,
    });

    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    emit(T.text_message_content, { delta: 'plain answer' });
    emit(T.run_finished);
    fireEvent.click(screen.getByRole('button', { name: 'accessibility_copy_message' }));

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(copiedValue).toBe('plain answer');
    expect(document.querySelector('textarea')).toBeNull();
    expect(screen.getByRole('button', { name: 'ai_copied' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'accessibility_copy_message' })).toBeInTheDocument();
  });

  it('a finished bubble keeps its answer when the next run starts in the same chat', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    const first = render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    emit(T.text_message_content, { delta: 'first answer' });
    emit(T.run_finished);

    act(() => {
      startStreamingMessage(CHAT, 'r2');
    });
    const second = render(<CometChatStreamMessageBubble chatId={CHAT} runId="r2" />);
    emit(T.text_message_content, { delta: 'second' });

    expect(bubbleText(first.container)?.textContent).toBe('first answer');
    expect(bubbleText(second.container)?.textContent).toBe('second');
  });

  it('a bubble interrupted mid-stream by a newer run freezes on what it had shown', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    const { container } = render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    emit(T.text_message_content, { delta: 'partial' });

    act(() => {
      startStreamingMessage(CHAT, 'r2');
    });
    emit(T.text_message_content, { delta: 'other run' });
    expect(bubbleText(container)?.textContent).toBe('partial');
    expect(screen.queryByText('Thinking...')).toBeNull();
  });

  it('keeps its finished text after the chat is reset (new chat)', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    const { container } = render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    emit(T.text_message_content, { delta: 'kept' });
    act(() => {
      stopStreamingMessage(CHAT);
    });
    expect(bubbleText(container)?.textContent).toBe('kept');
  });

  it('a bubble for a run that is not the current one renders empty', () => {
    act(() => {
      startStreamingMessage(CHAT, 'current');
    });
    const { container } = render(<CometChatStreamMessageBubble chatId={CHAT} runId="stale" />);
    emit(T.text_message_content, { delta: 'not mine' });
    expect(screen.queryByText('Thinking...')).toBeNull();
    expect(bubbleText(container)).toBeNull();
  });

  it('without a runId it follows whatever run is live in the chat', () => {
    act(() => {
      startStreamingMessage(CHAT, 'any');
    });
    const { container } = render(<CometChatStreamMessageBubble chatId={CHAT} />);
    emit(T.text_message_content, { delta: 'live' });
    expect(bubbleText(container)?.textContent).toBe('live');
  });

  it('going offline mid-stream replaces the bubble with the no-internet message', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText('ai_assistant_chat_no_internet')).toBeInTheDocument();
    expect(screen.queryByText('Thinking...')).toBeNull();
  });

  it('stops listening for offline events once unmounted', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    const { unmount } = render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    unmount();
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    const again = render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);
    expect(again.queryByText('ai_assistant_chat_no_internet')).toBeNull();
  });

  it('shows a card-shaped loader while a card is generated, then the card itself', () => {
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    render(<CometChatStreamMessageBubble chatId={CHAT} runId="r1" />);

    emit(T.card_start, { cardId: 'c1', executionText: 'Building your itinerary' });
    emit(T.card_start, { cardId: 'c2' });
    expect(screen.getByRole('status', { name: 'Building your itinerary' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
    expect(screen.getByRole('status', { name: 'accessibility_loading_card' })).toBeInTheDocument();

    emit(T.card, { cardId: 'c1', card: { version: '1.0', body: [] } });
    expect(screen.queryByRole('status', { name: 'Building your itinerary' })).toBeNull();
    const view = screen.getByTestId('card-view');
    expect(JSON.parse(view.getAttribute('data-card-json') ?? '')).toEqual({
      version: '1.0',
      body: [],
    });
    expect(view).toHaveAttribute('data-theme', 'light');
  });

  it('forwards a card action as a ui:card/action event carrying the placeholder message', () => {
    const publish = vi.fn();
    const events = { subscribe: () => () => undefined, publish } as CometChatEventsContextValue;
    const message = { getId: () => 7 } as unknown as CometChat.BaseMessage;
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    render(
      <CometChatEventsContext.Provider value={events}>
        <CometChatStreamMessageBubble chatId={CHAT} runId="r1" message={message} />
      </CometChatEventsContext.Provider>
    );
    emit(T.card, { cardId: 'c1', card: { v: 1 } });

    const action = { type: 'openUrl', url: 'https://example.com' };
    act(() => {
      cards.onAction?.({ action });
    });
    expect(publish).toHaveBeenCalledWith({ type: 'ui:card/action', message, action });
  });

  it('does not publish card actions when it has no message to attribute them to', () => {
    const publish = vi.fn();
    const events = { subscribe: () => () => undefined, publish } as CometChatEventsContextValue;
    act(() => {
      startStreamingMessage(CHAT, 'r1');
    });
    render(
      <CometChatEventsContext.Provider value={events}>
        <CometChatStreamMessageBubble chatId={CHAT} runId="r1" />
      </CometChatEventsContext.Provider>
    );
    emit(T.card, { cardId: 'c1', card: { v: 1 } });
    act(() => {
      cards.onAction?.({ action: { type: 'x' } });
    });
    expect(publish).not.toHaveBeenCalled();
  });

  it('exposes alignment and caller className on the live region', () => {
    const { container } = render(
      <CometChatStreamMessageBubble chatId={CHAT} alignment="right" className="extra" />
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('cometchat-stream-message-bubble', 'extra');
    expect(root).toHaveAttribute('data-alignment', 'right');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });
});
