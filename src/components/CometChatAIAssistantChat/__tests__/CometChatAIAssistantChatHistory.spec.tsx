/**
 * Unit tests for CometChatAIAssistantChatHistory: the request it builds, the
 * loading / empty / error / loaded states, opening, deleting and paginating
 * conversations, keyboard navigation and the imperative addMessage handle.
 */
import React, { createRef } from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantChatHistory } from '../CometChatAIAssistantChatHistory';
import type { CometChatAIAssistantChatHistoryHandle } from '../ai.types';

const sdk = vi.hoisted(() => ({
  fetchPrevious: vi.fn(),
  deleteMessage: vi.fn(),
  builderCalls: [] as [string, unknown][],
}));

vi.mock('@cometchat/chat-sdk-javascript', async importOriginal => {
  const actual = await importOriginal<typeof import('@cometchat/chat-sdk-javascript')>();
  class FakeBuilder {
    constructor() {
      sdk.builderCalls = [];
    }
    private record(name: string, arg: unknown) {
      sdk.builderCalls.push([name, arg]);
      return this;
    }
    hideReplies(v: boolean) {
      return this.record('hideReplies', v);
    }
    setLimit(v: number) {
      return this.record('setLimit', v);
    }
    setType(v: string) {
      return this.record('setType', v);
    }
    setCategory(v: string) {
      return this.record('setCategory', v);
    }
    hideDeletedMessages(v: boolean) {
      return this.record('hideDeletedMessages', v);
    }
    setUID(v: string) {
      return this.record('setUID', v);
    }
    setGUID(v: string) {
      return this.record('setGUID', v);
    }
    build() {
      return { fetchPrevious: sdk.fetchPrevious };
    }
  }
  Object.defineProperty(actual.CometChat, 'MessagesRequestBuilder', {
    configurable: true,
    writable: true,
    value: FakeBuilder,
  });
  Object.defineProperty(actual.CometChat, 'deleteMessage', {
    configurable: true,
    writable: true,
    value: sdk.deleteMessage,
  });
  return actual;
});

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key }),
}));

const DAY = 86_400;
// Noon UTC on 2024-03-10, far enough in the past to format as an absolute date.
const BASE = 1_710_072_000;

const agent = new CometChat.User('agent-1');
const otherAgent = new CometChat.User('agent-2');

function textMsg(id: number, text: string, sentAt = BASE): CometChat.TextMessage {
  const m = new CometChat.TextMessage('agent-1', text, 'user');
  m.setId(id);
  m.setSentAt(sentAt);
  return m;
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const rows = () => screen.queryAllByRole('option');
const rowTexts = () => rows().map(r => r.textContent);

describe('CometChatAIAssistantChatHistory', () => {
  beforeEach(() => {
    sdk.fetchPrevious.mockReset();
    sdk.deleteMessage.mockReset();
  });

  it('requests the agent’s top-level, non-deleted text messages, 30 at a time', async () => {
    sdk.fetchPrevious.mockResolvedValue([]);
    render(<CometChatAIAssistantChatHistory user={agent} />);
    await waitFor(() => {
      expect(sdk.fetchPrevious).toHaveBeenCalled();
    });
    expect(Object.fromEntries(sdk.builderCalls)).toEqual({
      hideReplies: true,
      setLimit: 30,
      setType: 'text',
      setCategory: 'message',
      hideDeletedMessages: true,
      setUID: 'agent-1',
    });
  });

  it('scopes the request to a group when given one instead of a user', async () => {
    sdk.fetchPrevious.mockResolvedValue([]);
    const group = new CometChat.Group('g-ai', 'AI group', 'public');
    render(<CometChatAIAssistantChatHistory group={group} />);
    await waitFor(() => {
      expect(sdk.fetchPrevious).toHaveBeenCalled();
    });
    expect(sdk.builderCalls).toContainEqual(['setGUID', 'g-ai']);
    expect(sdk.builderCalls.some(([n]) => n === 'setUID')).toBe(false);
  });

  it('shows a busy shimmer while the first page loads', () => {
    sdk.fetchPrevious.mockReturnValue(new Promise(() => undefined));
    render(<CometChatAIAssistantChatHistory user={agent} />);
    expect(screen.getByRole('list', { name: 'ai_assistant_chat_history_loading' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('lists conversations newest first and skips non-text messages', async () => {
    const custom = new CometChat.CustomMessage('agent-1', 'user', 'poll', {});
    sdk.fetchPrevious.mockResolvedValue([
      textMsg(1, 'oldest'),
      custom,
      textMsg(2, 'middle'),
      textMsg(3, 'newest'),
    ]);
    render(<CometChatAIAssistantChatHistory user={agent} />);
    await waitFor(() => {
      expect(rowTexts()).toEqual(['newest', 'middle', 'oldest']);
    });
  });

  it('shows the empty state and reports it when there is no history', async () => {
    sdk.fetchPrevious.mockResolvedValue([]);
    const onEmpty = vi.fn();
    render(<CometChatAIAssistantChatHistory user={agent} onEmpty={onEmpty} />);
    expect(await screen.findByText('No conversations yet')).toBeInTheDocument();
    expect(onEmpty).toHaveBeenCalledTimes(1);
  });

  it('renders a custom empty view', async () => {
    sdk.fetchPrevious.mockResolvedValue([]);
    render(<CometChatAIAssistantChatHistory user={agent} emptyStateView={<p>nothing yet</p>} />);
    expect(await screen.findByText('nothing yet')).toBeInTheDocument();
    expect(screen.queryByText('No conversations yet')).toBeNull();
  });

  it('shows an error alert and reports the error when the first page fails', async () => {
    const err = new CometChat.CometChatException({ code: 'ERR', message: 'down' });
    sdk.fetchPrevious.mockRejectedValue(err);
    const onError = vi.fn();
    render(<CometChatAIAssistantChatHistory user={agent} onError={onError} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('renders a custom error view', async () => {
    sdk.fetchPrevious.mockRejectedValue(new Error('down'));
    render(<CometChatAIAssistantChatHistory user={agent} errorStateView={<b>try later</b>} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('try later');
  });

  it('opens the newest conversation automatically when loadLastAgentConversation is set', async () => {
    const newest = textMsg(3, 'newest');
    sdk.fetchPrevious.mockResolvedValue([textMsg(1, 'old'), newest]);
    const onMessageClick = vi.fn();
    render(
      <CometChatAIAssistantChatHistory
        user={agent}
        loadLastAgentConversation
        onMessageClick={onMessageClick}
      />
    );
    await waitFor(() => {
      expect(onMessageClick).toHaveBeenCalledWith(newest);
    });
    expect(onMessageClick).toHaveBeenCalledTimes(1);
  });

  it('does not open anything by default', async () => {
    sdk.fetchPrevious.mockResolvedValue([textMsg(1, 'only')]);
    const onMessageClick = vi.fn();
    render(<CometChatAIAssistantChatHistory user={agent} onMessageClick={onMessageClick} />);
    await screen.findByText('only');
    expect(onMessageClick).not.toHaveBeenCalled();
  });

  it('opens a conversation on click', async () => {
    const m = textMsg(1, 'trip ideas');
    sdk.fetchPrevious.mockResolvedValue([m]);
    const onMessageClick = vi.fn();
    render(<CometChatAIAssistantChatHistory user={agent} onMessageClick={onMessageClick} />);
    fireEvent.click(await screen.findByText('trip ideas'));
    expect(onMessageClick).toHaveBeenCalledWith(m);
  });

  it('supports roving-tabindex keyboard navigation, Enter/Space to open and Escape to close', async () => {
    const [a, b, c] = [textMsg(1, 'c'), textMsg(2, 'b'), textMsg(3, 'a')];
    sdk.fetchPrevious.mockResolvedValue([a, b, c]);
    const onMessageClick = vi.fn();
    const onClose = vi.fn();
    render(
      <CometChatAIAssistantChatHistory
        user={agent}
        onMessageClick={onMessageClick}
        onClose={onClose}
      />
    );
    await screen.findByText('a');
    const [r0, r1, r2] = rows() as [HTMLElement, HTMLElement, HTMLElement];
    expect(rows().map(r => r.tabIndex)).toEqual([0, -1, -1]);

    fireEvent.keyDown(r0, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(r1);
    expect(rows().map(r => r.tabIndex)).toEqual([-1, 0, -1]);

    fireEvent.keyDown(r1, { key: 'ArrowDown' });
    fireEvent.keyDown(r2, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(r2);

    fireEvent.keyDown(r2, { key: 'ArrowUp' });
    fireEvent.keyDown(r1, { key: 'ArrowUp' });
    fireEvent.keyDown(r0, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(r0);

    fireEvent.keyDown(r1, { key: 'Enter' });
    fireEvent.keyDown(r2, { key: ' ' });
    expect(onMessageClick.mock.calls).toEqual([[b], [a]]);

    fireEvent.keyDown(r0, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the header close button', async () => {
    sdk.fetchPrevious.mockResolvedValue([]);
    const onClose = vi.fn();
    render(<CometChatAIAssistantChatHistory user={agent} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'ai_assistant_chat_history_close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await screen.findByText('No conversations yet');
  });

  it('starts a new chat from the New Chat row, which can be hidden', async () => {
    sdk.fetchPrevious.mockResolvedValue([]);
    const onNewChatClick = vi.fn();
    const { rerender } = render(
      <CometChatAIAssistantChatHistory user={agent} onNewChatClick={onNewChatClick} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'ai_assistant_chat_new_chat' }));
    expect(onNewChatClick).toHaveBeenCalledWith();

    rerender(
      <CometChatAIAssistantChatHistory user={agent} onNewChatClick={onNewChatClick} hideNewChat />
    );
    expect(screen.queryByRole('button', { name: 'ai_assistant_chat_new_chat' })).toBeNull();
    await screen.findByText('No conversations yet');
  });

  it('deletes a conversation without opening it, and tells the parent which one went', async () => {
    const keep = textMsg(1, 'keep');
    const drop = textMsg(2, 'drop');
    sdk.fetchPrevious.mockResolvedValue([keep, drop]);
    sdk.deleteMessage.mockResolvedValue({});
    const onMessageClick = vi.fn();
    const onNewChatClick = vi.fn();
    const onEmpty = vi.fn();
    render(
      <CometChatAIAssistantChatHistory
        user={agent}
        onMessageClick={onMessageClick}
        onNewChatClick={onNewChatClick}
        onEmpty={onEmpty}
      />
    );
    await screen.findByText('drop');
    const dropRow = screen.getByRole('option', { name: /^drop/ });
    fireEvent.click(within(dropRow).getByRole('button', { name: 'conversation_delete_icon_hover' }));

    await waitFor(() => {
      expect(rowTexts()).toEqual(['keep']);
    });
    expect(sdk.deleteMessage).toHaveBeenCalledWith('2');
    expect(onNewChatClick).toHaveBeenCalledWith(drop);
    expect(onMessageClick).not.toHaveBeenCalled();
    expect(onEmpty).not.toHaveBeenCalled();
  });

  it('deleting the last conversation switches to the empty state', async () => {
    sdk.fetchPrevious.mockResolvedValue([textMsg(1, 'only')]);
    sdk.deleteMessage.mockResolvedValue({});
    const onEmpty = vi.fn();
    render(<CometChatAIAssistantChatHistory user={agent} onEmpty={onEmpty} />);
    await screen.findByText('only');
    fireEvent.click(screen.getByRole('button', { name: 'conversation_delete_icon_hover' }));
    expect(await screen.findByText('No conversations yet')).toBeInTheDocument();
    expect(onEmpty).toHaveBeenCalledTimes(1);
  });

  it('keeps the row and reports the error when deletion fails', async () => {
    sdk.fetchPrevious.mockResolvedValue([textMsg(1, 'stays')]);
    const err = new Error('forbidden');
    sdk.deleteMessage.mockRejectedValue(err);
    const onError = vi.fn();
    const onNewChatClick = vi.fn();
    render(
      <CometChatAIAssistantChatHistory
        user={agent}
        onError={onError}
        onNewChatClick={onNewChatClick}
      />
    );
    await screen.findByText('stays');
    fireEvent.click(screen.getByRole('button', { name: 'conversation_delete_icon_hover' }));
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(err);
    });
    expect(rowTexts()).toEqual(['stays']);
    expect(onNewChatClick).not.toHaveBeenCalled();
  });

  describe('infinite scroll', () => {
    function scrollTo(list: HTMLElement, { atBottom }: { atBottom: boolean }) {
      Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
      Object.defineProperty(list, 'clientHeight', { configurable: true, value: 400 });
      Object.defineProperty(list, 'scrollTop', {
        configurable: true,
        value: atBottom ? 580 : 100,
      });
      fireEvent.scroll(list);
    }

    it('appends older conversations when scrolled to the bottom', async () => {
      sdk.fetchPrevious
        .mockResolvedValueOnce([textMsg(3, 'recent-2'), textMsg(4, 'recent-1')])
        .mockResolvedValueOnce([textMsg(1, 'older-2'), textMsg(2, 'older-1')]);
      render(<CometChatAIAssistantChatHistory user={agent} />);
      await screen.findByText('recent-1');

      const list = screen.getByRole('listbox');
      scrollTo(list, { atBottom: false });
      expect(sdk.fetchPrevious).toHaveBeenCalledTimes(1);

      scrollTo(list, { atBottom: true });
      await waitFor(() => {
        expect(rowTexts()).toEqual(['recent-1', 'recent-2', 'older-1', 'older-2']);
      });
    });

    it('ignores further scrolls while a page is in flight', async () => {
      const next = deferred<CometChat.BaseMessage[]>();
      sdk.fetchPrevious.mockResolvedValueOnce([textMsg(1, 'first')]).mockReturnValueOnce(next.promise);
      render(<CometChatAIAssistantChatHistory user={agent} />);
      await screen.findByText('first');

      const list = screen.getByRole('listbox');
      scrollTo(list, { atBottom: true });
      scrollTo(list, { atBottom: true });
      scrollTo(list, { atBottom: true });
      expect(sdk.fetchPrevious).toHaveBeenCalledTimes(2);

      await act(async () => {
        next.resolve([]);
        await next.promise;
      });
      // Reaching the end keeps the list instead of flipping to the empty state.
      expect(rowTexts()).toEqual(['first']);
    });

    it('a failing later page keeps the list and reports the error', async () => {
      const err = new Error('flaky');
      sdk.fetchPrevious.mockResolvedValueOnce([textMsg(1, 'first')]).mockRejectedValueOnce(err);
      const onError = vi.fn();
      render(<CometChatAIAssistantChatHistory user={agent} onError={onError} />);
      await screen.findByText('first');
      scrollTo(screen.getByRole('listbox'), { atBottom: true });
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(err);
      });
      expect(screen.queryByRole('alert')).toBeNull();
      expect(rowTexts()).toEqual(['first']);
    });
  });

  it('separates conversations from different days with a date label', async () => {
    sdk.fetchPrevious.mockResolvedValue([
      textMsg(1, 'two days ago', BASE - 2 * DAY),
      textMsg(2, 'yesterday-ish', BASE - DAY),
      textMsg(3, 'same day a', BASE),
      textMsg(4, 'same day b', BASE + 60),
    ]);
    const { container } = render(<CometChatAIAssistantChatHistory user={agent} />);
    await screen.findByText('same day a');
    const separators = container.querySelectorAll(
      '.cometchat-ai-assistant-chat-history__date-separator'
    );
    expect(separators).toHaveLength(2);
    expect(separators[0]?.textContent).toMatch(/2024/);
    // Each label sits directly above the first conversation of its day.
    expect(separators[0]?.nextElementSibling?.textContent).toBe('yesterday-ish');
    expect(separators[1]?.nextElementSibling?.textContent).toBe('two days ago');
  });

  it('addMessage puts a just-sent conversation at the top, even from the empty state', async () => {
    sdk.fetchPrevious.mockResolvedValue([]);
    const ref = createRef<CometChatAIAssistantChatHistoryHandle>();
    render(<CometChatAIAssistantChatHistory ref={ref} user={agent} />);
    await screen.findByText('No conversations yet');

    act(() => {
      ref.current?.addMessage(textMsg(10, 'brand new'));
    });
    expect(screen.queryByText('No conversations yet')).toBeNull();
    expect(rowTexts()).toEqual(['brand new']);

    act(() => {
      ref.current?.addMessage(textMsg(11, 'newer still'));
    });
    expect(rowTexts()).toEqual(['newer still', 'brand new']);
  });

  it('reloads from scratch when the agent changes', async () => {
    sdk.fetchPrevious.mockResolvedValueOnce([textMsg(1, 'agent one chat')]);
    const { rerender } = render(<CometChatAIAssistantChatHistory user={agent} />);
    await screen.findByText('agent one chat');

    sdk.fetchPrevious.mockResolvedValueOnce([textMsg(2, 'agent two chat')]);
    rerender(<CometChatAIAssistantChatHistory user={otherAgent} />);
    await waitFor(() => {
      expect(rowTexts()).toEqual(['agent two chat']);
    });
    expect(sdk.builderCalls).toContainEqual(['setUID', 'agent-2']);
  });

  // Known issue: fetchMessages bails out while isFetchingRef is set, so switching agents while the first page is still loading never fetches the new agent, and the old agent's page lands in the new list.
  it.fails('switching agent while the first page is loading shows only the new agent’s history', async () => {
    const first = deferred<CometChat.BaseMessage[]>();
    sdk.fetchPrevious
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([textMsg(2, 'agent two chat')]);
    const { rerender } = render(<CometChatAIAssistantChatHistory user={agent} />);
    rerender(<CometChatAIAssistantChatHistory user={otherAgent} />);

    await act(async () => {
      first.resolve([textMsg(1, 'agent one chat')]);
      await first.promise;
    });
    expect(sdk.fetchPrevious).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(rowTexts()).toEqual(['agent two chat']);
    });
  });
});
