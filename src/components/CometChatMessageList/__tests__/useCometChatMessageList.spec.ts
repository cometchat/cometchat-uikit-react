/**
 * Unit tests for useCometChatMessageList, the orchestration hook. The sub-hooks
 * have their own specs; here they are stubbed so the tests cover only what this
 * hook decides: the logged-in user guard, the thread id, receipt and type
 * defaults, thread-only option overrides, and the derived state flags.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  loggedInUser: { getUid: () => 'me' } as { getUid: () => string } | null,
  globalConfig: {} as { hideReceipts?: boolean },
  init: vi.fn(),
  events: vi.fn(),
  actions: { deleteMessage: vi.fn(), markMessageAsUnread: vi.fn(), reactToMessage: vi.fn() },
  scroll: {
    fetchPrevious: vi.fn(),
    fetchNext: vi.fn(),
    setAtBottom: vi.fn(),
    clearNewMessageCount: vi.fn(),
    markConversationAsReadIfUnread: vi.fn(),
    scrollToMessage: vi.fn(),
    goToMessage: vi.fn(),
    scrollToBottom: vi.fn(),
  },
  initialState: { fetchState: 'idle' as string },
}));

vi.mock('../../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: { getLoggedInUser: () => mocks.loggedInUser },
}));
vi.mock('../../../context/GlobalConfigContext', () => ({ useGlobalConfig: () => mocks.globalConfig }));
vi.mock('../../../hooks/useDefaultMessageTypes', () => ({
  useDefaultMessageTypes: () => ['text', 'image'],
  useDefaultMessageCategories: () => ['message'],
}));
vi.mock('../useMessageListInit', () => ({ useMessageListInit: mocks.init }));
vi.mock('../useMessageListEvents', () => ({ useMessageListEvents: mocks.events }));
vi.mock('../useMessageListActions', () => ({ useMessageListActions: () => mocks.actions }));
vi.mock('../useMessageListScroll', () => ({ useMessageListScroll: () => mocks.scroll }));
vi.mock('../CometChatMessageList.reducer', async importOriginal => {
  const actual = await importOriginal<typeof import('../CometChatMessageList.reducer')>();
  return {
    ...actual,
    get initialMessageListState() {
      return { ...actual.initialMessageListState, ...mocks.initialState };
    },
  };
});

import { useCometChatMessageList } from '../useCometChatMessageList';
import type { CometChatUseMessageListOptions } from '../CometChatMessageList.types';

const bob = { getUid: () => 'bob' };
const run = (options: Partial<CometChatUseMessageListOptions> = {}) =>
  renderHook(() => useCometChatMessageList({ user: bob, ...options } as unknown as CometChatUseMessageListOptions)).result
    .current;

const initOptions = () => mocks.init.mock.calls.at(-1)![0] as Record<string, unknown>;
const eventOptions = () => mocks.events.mock.calls.at(-1)![0] as Record<string, unknown>;

describe('useCometChatMessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loggedInUser = { getUid: () => 'me' };
    mocks.globalConfig = {};
    mocks.initialState = { fetchState: 'idle' };
  });

  describe('logged-in user', () => {
    it('falls back to the UIKit user when none is passed', () => {
      expect(run().loggedInUser).toBe(mocks.loggedInUser);
    });

    it('prefers the prop', () => {
      const prop = { getUid: () => 'prop' };
      expect(run({ loggedInUser: prop as never }).loggedInUser).toBe(prop);
      expect(initOptions().loggedInUser).toBe(prop);
    });

    it('throws a clear error outside an authenticated session', () => {
      mocks.loggedInUser = null;
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => run()).toThrow(/requires a logged-in user/);
    });
  });

  describe('thread', () => {
    it('takes the thread id from parentMessage over the deprecated parentMessageId', () => {
      run({ parentMessage: { getId: () => 42 } as never, parentMessageId: 7 } as never);
      expect(initOptions().parentMessageId).toBe(42);
      expect(eventOptions().parentMessageId).toBe(42);
    });

    it('still honours parentMessageId on its own', () => {
      run({ parentMessageId: 7 } as never);
      expect(initOptions().parentMessageId).toBe(7);
    });

    it('in a thread, hides "reply in thread" and "mark as unread" whatever the props say', () => {
      const { options } = run({ parentMessageId: 7, hideReplyInThreadOption: false, showMarkAsUnreadOption: true } as never);
      expect(options.hideReplyInThreadOption).toBe(true);
      expect(options.showMarkAsUnreadOption).toBe(false);
    });

    it('outside a thread, passes those options through', () => {
      const { options } = run({ hideReplyInThreadOption: true, showMarkAsUnreadOption: true });
      expect(options.hideReplyInThreadOption).toBe(true);
      expect(options.showMarkAsUnreadOption).toBe(true);
    });
  });

  describe('hideReceipts', () => {
    it('defaults to false', () => {
      expect(run().options.hideReceipts).toBe(false);
    });

    it('falls back to the global config', () => {
      mocks.globalConfig = { hideReceipts: true };
      expect(run().options.hideReceipts).toBe(true);
      expect(eventOptions().hideReceipts).toBe(true);
    });

    it('an explicit false prop wins over the global config', () => {
      mocks.globalConfig = { hideReceipts: true };
      expect(run({ hideReceipts: false }).options.hideReceipts).toBe(false);
    });
  });

  it('uses the registry message types and categories unless given its own', () => {
    run();
    expect(initOptions()).toMatchObject({ messageTypes: ['text', 'image'], messageCategories: ['message'] });
    run({ messageTypes: ['custom'], messageCategories: ['custom'] });
    expect(initOptions()).toMatchObject({ messageTypes: ['custom'], messageCategories: ['custom'] });
  });

  it('passes agent-chat settings to init with their defaults', () => {
    run();
    expect(initOptions()).toMatchObject({ isAgentChat: false, loadLastAgentConversation: false, startFromUnreadMessages: false });
    run({ isAgentChat: true, loadLastAgentConversation: true } as never);
    expect(initOptions()).toMatchObject({ isAgentChat: true, loadLastAgentConversation: true });
  });

  it('exposes the sub-hook actions', () => {
    const result = run();
    expect(result.deleteMessage).toBe(mocks.actions.deleteMessage);
    expect(result.reactToMessage).toBe(mocks.actions.reactToMessage);
    expect(result.fetchPrevious).toBe(mocks.scroll.fetchPrevious);
    expect(result.scrollToBottom).toBe(mocks.scroll.scrollToBottom);
  });

  it.each([
    ['loading', { isLoading: true, isEmpty: false, isError: false }],
    ['empty', { isLoading: false, isEmpty: true, isError: false }],
    ['error', { isLoading: false, isEmpty: false, isError: true }],
    ['loaded', { isLoading: false, isEmpty: false, isError: false }],
  ])('derives the flags for the %s state', (fetchState, flags) => {
    mocks.initialState = { fetchState };
    expect(run()).toMatchObject(flags);
  });

  it('fills the option bag with defaults', () => {
    const { options } = run();
    expect(options).toMatchObject({
      quickOptionsCount: 2,
      messageAlignment: 1,
      hideAvatar: false,
      smartRepliesDelayDuration: 10000,
      smartRepliesKeywords: ['what', 'when', 'why', 'who', 'where', 'how', '?'],
    });
  });

  // Keywords are passed explicitly: the default keyword array is created on every
  // render, so with defaults the bag is rebuilt each time.
  it('keeps the option bag identity across re-renders with the same options', () => {
    const options = { user: bob, smartRepliesKeywords: ['?'] } as unknown as CometChatUseMessageListOptions;
    const { result, rerender } = renderHook(() => useCometChatMessageList(options));
    const first = result.current.options;
    rerender();
    expect(result.current.options).toBe(first);
  });
});
