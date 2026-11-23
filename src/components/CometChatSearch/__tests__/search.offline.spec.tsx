/**
 * CometChatSearch on the offline (ON) path (UIT-LIST-02, BEH-SNAP-04, D83):
 * a keyword has no cache, so a search that cannot reach the server is a failed
 * search like any other: the error view (the app's own if passed) and one
 * onError, never "No results"; it runs again once on reconnect. A newer search
 * drops a late answer; the integrator's builder is copied. OFF keeps today's error.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatSearchMessages } from '../useCometChatSearchMessages';
import { useCometChatSearchConversations } from '../useCometChatSearchConversations';
import { CometChatSearchMessagesManager } from '../CometChatSearchMessagesManager';
import { CometChatSearchConversationsManager } from '../CometChatSearchConversationsManager';
import { CometChatSearchRoot } from '../CometChatSearchRoot';
import {
  CometChatSearchOfflineContext,
  bothScopesFailed,
  searchOfflineKind,
} from '../searchOffline';
import type { CometChatSearchFilter } from '../CometChatSearch.types';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const NOT_CONNECTED = { code: 'FAILED_TO_FETCH' };
const filters: never[] = [];

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('CometChatSearch offline', () => {
  let fake: OfflineSdkFake;
  let onConnected: (() => void) | undefined;

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    onConnected = undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(((
      _id: string,
      listener: { onConnected?: () => void }
    ) => {
      onConnected = listener.onConnected;
    }) as never);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
    vi.spyOn(CometChat, 'addMessageListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeMessageListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'addUserListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeUserListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'addGroupListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeGroupListener').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
  });

  it('D84 rule 7: messages: not connected is "Connect to search" and no onError; it runs again once on reconnect', async () => {
    const search = vi
      .spyOn(CometChatSearchMessagesManager.prototype, 'search')
      .mockRejectedValueOnce(NOT_CONNECTED)
      .mockResolvedValue({ results: [], hasMore: false });
    const onError = vi.fn();
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useCometChatSearchMessages({
        searchKeyword: 'hello',
        activeFilters: filters,
        onError,
        onStateChange,
      })
    );
    await waitFor(() => {
      expect(result.current.connectToSearch).toBe(true);
    });
    expect(result.current.fetchState).toBe('empty');
    expect(onError).not.toHaveBeenCalled();
    expect(onStateChange).toHaveBeenLastCalledWith('empty');
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(search).toHaveBeenCalledTimes(2);
    });
    // Answered (no match): the plain empty view, and a later reconnect does not search again.
    await waitFor(() => {
      expect(result.current.connectToSearch).toBe(false);
    });
    expect(result.current.fetchState).toBe('empty');
    act(() => {
      onConnected?.();
    });
    expect(search).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it('D84 rule 7: a reconnect search that fails again is still "Connect to search", with no onError', async () => {
    const search = vi
      .spyOn(CometChatSearchMessagesManager.prototype, 'search')
      .mockRejectedValue(NOT_CONNECTED);
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useCometChatSearchMessages({ searchKeyword: 'hello', activeFilters: filters, onError })
    );
    await waitFor(() => {
      expect(result.current.connectToSearch).toBe(true);
    });
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(search).toHaveBeenCalledTimes(2);
    });
    // The second rejection settles a tick after the call, so wait for its outcome too.
    await waitFor(() => {
      expect(result.current.connectToSearch).toBe(true);
      expect(result.current.fetchState).toBe('empty');
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('conversations: not connected is "Connect to search" with no onError, another error is the error view with onError; only the not-connected one runs again on reconnect', async () => {
    const search = vi
      .spyOn(CometChatSearchConversationsManager.prototype, 'search')
      .mockRejectedValueOnce(NOT_CONNECTED)
      .mockResolvedValueOnce({ results: [], hasMore: false })
      .mockRejectedValueOnce({ code: 'ERR_SERVER' });
    const onError = vi.fn();
    const { result, rerender } = renderHook(
      ({ keyword }: { keyword: string }) =>
        useCometChatSearchConversations({
          searchKeyword: keyword,
          activeFilters: filters,
          onError,
        }),
      { initialProps: { keyword: 'al' } }
    );
    await waitFor(() => {
      expect(result.current.connectToSearch).toBe(true);
    });
    expect(result.current.fetchState).toBe('empty');
    expect(onError).not.toHaveBeenCalled();
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(search).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(result.current.connectToSearch).toBe(false);
    });
    expect(result.current.fetchState).toBe('empty');
    rerender({ keyword: 'alice' });
    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledTimes(3);
    act(() => {
      onConnected?.();
    });
    expect(search).toHaveBeenCalledTimes(3);
  });

  it("a newer search drops the older search's late answer", async () => {
    const first = deferred<{ results: CometChat.BaseMessage[]; hasMore: boolean }>();
    const second = deferred<{ results: CometChat.BaseMessage[]; hasMore: boolean }>();
    vi.spyOn(CometChatSearchMessagesManager.prototype, 'search')
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(
      ({ keyword }: { keyword: string }) =>
        useCometChatSearchMessages({ searchKeyword: keyword, activeFilters: filters }),
      { initialProps: { keyword: 'a' } }
    );
    rerender({ keyword: 'ab' });
    const fresh = new CometChat.TextMessage('peer', 'ab', 'user');
    await act(async () => {
      second.resolve({ results: [fresh], hasMore: false });
      await second.promise;
    });
    await act(async () => {
      first.reject(NOT_CONNECTED);
      await first.promise.catch(() => undefined);
    });
    expect(result.current.messages).toEqual([fresh]);
    expect(result.current.fetchState).toBe('loaded');
  });

  it("the integrator's builder is copied on the offline path", async () => {
    const search = vi
      .spyOn(CometChatSearchMessagesManager.prototype, 'search')
      .mockResolvedValue({ results: [], hasMore: false });
    const builder = new CometChat.MessagesRequestBuilder();
    renderHook(() =>
      useCometChatSearchMessages({
        searchKeyword: 'x',
        activeFilters: filters,
        messagesRequestBuilder: builder,
      })
    );
    await waitFor(() => {
      expect(search).toHaveBeenCalledTimes(1);
    });
    const passed = search.mock.calls[0]?.[5];
    expect(passed).toBeInstanceOf(CometChat.MessagesRequestBuilder);
    expect(passed).not.toBe(builder);
  });

  it('D84 rule 7 + addition A: both scopes offline show "Connect to search" with its second line, never "No results", and no onError', async () => {
    vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(NOT_CONNECTED);
    vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockRejectedValue(
      NOT_CONNECTED
    );
    const onError = vi.fn();
    render(<CometChatSearchRoot defaultSearchText="hello" onError={onError} />);
    await waitFor(() => {
      expect(screen.getAllByText(/search_connect_to_search_messages$/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/search_connect_to_search_subtitle/).length).toBeGreaterThan(0);
    // The search screen's own title key (Android: cometchat_connect_to_search_messages), not the lists'.
    expect(screen.queryByText(/^search_connect_to_search$/)).toBeNull();
    expect(screen.queryByText(/search_no_result_title|No results/)).toBeNull();
    expect(screen.queryByText(/search_error_title/)).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it("D84: the app's own empty view is shown for an offline keyword search", async () => {
    vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(NOT_CONNECTED);
    vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockRejectedValue(
      NOT_CONNECTED
    );
    render(<CometChatSearchRoot defaultSearchText="hello" emptyView={<span>my own empty</span>} />);
    await waitFor(() => {
      expect(screen.getAllByText('my own empty').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/search_connect_to_search/)).toBeNull();
  });

  it('D84: a mix of a not-connected scope and a server error takes the normal error path', async () => {
    vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(NOT_CONNECTED);
    vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockRejectedValue({
      code: 'ERR_SERVER',
    });
    const onError = vi.fn();
    render(<CometChatSearchRoot defaultSearchText="hello" onError={onError} />);
    await waitFor(() => {
      expect(screen.getAllByText(/search_error_title/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/search_connect_to_search/)).toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("D84: the app's own error view is shown for a real search error", async () => {
    vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue({
      code: 'ERR_SERVER',
    });
    vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockRejectedValue({
      code: 'ERR_SERVER',
    });
    render(<CometChatSearchRoot defaultSearchText="hello" errorView={<span>my own error</span>} />);
    await waitFor(() => {
      expect(screen.getAllByText('my own error').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/search_error_title/)).toBeNull();
  });

  it('D84 (Android): one scope searched by keyword and not connected is "Connect to search" with the search screen\'s own text and second line, no onError', async () => {
    vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(NOT_CONNECTED);
    const onError = vi.fn();
    render(<CometChatSearchRoot defaultSearchText="hello" searchIn={['messages']} onError={onError} />);
    await waitFor(() => {
      expect(screen.getAllByText(/search_connect_to_search_messages$/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/search_connect_to_search_subtitle/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/search_no_result_title/)).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it('D84 (Android): the app\'s own empty view wins over "Connect to search" for one scope too', async () => {
    vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(NOT_CONNECTED);
    render(
      <CometChatSearchRoot
        defaultSearchText="hello"
        searchIn={['messages']}
        emptyView={<span>my own empty</span>}
      />
    );
    await waitFor(() => {
      expect(screen.getAllByText('my own empty').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/search_connect_to_search/)).toBeNull();
  });

  it('D84 (Android): a filter-only search that cannot reach the server shows the plain empty state, never "Connect to search" or "Connect to load", and no onError', async () => {
    const read = scriptedRead('Messages');
    vi.spyOn(CometChatSearchMessagesManager.prototype, 'startFilterRead').mockReturnValue({
      request: { fetchPrevious: read.fn } as unknown as CometChat.MessagesRequest,
      limit: 2,
    });
    const onError = vi.fn();
    render(<CometChatSearchRoot initialSearchFilter="photos" onError={onError} />);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([]);
    });
    act(() => {
      read.last().fail();
    });
    await waitFor(() => {
      expect(screen.getAllByText(/search_no_result_title/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/connect_to_search|connect_to_load/)).toBeNull();
    expect(screen.queryByText(/search_error_title/)).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  describe('D84 (Android): one scope fails with a real error and nothing is shown', () => {
    const SERVER_ERROR = { code: 'ERR_SERVER' };
    const message = () => {
      const m = new CometChat.TextMessage('peer', 'found', 'user');
      m.setId(1);
      // Named: Chat SDK 4.3.0's User.getName() throws on a user with no name (4.3.1 returns it
      // as is), and this test is about rule 5, not about nameless users.
      const sender = new CometChat.User('me');
      sender.setName('Me');
      const receiver = new CometChat.User('peer');
      receiver.setName('Peer');
      m.setSender(sender);
      m.setReceiver(receiver);
      return m;
    };

    it('the messages scope fails and the conversations scope finds nothing: the plain empty state, no onError, and a reconnect does not search again', async () => {
      const messages = vi
        .spyOn(CometChatSearchMessagesManager.prototype, 'search')
        .mockRejectedValue(SERVER_ERROR);
      const conversations = vi
        .spyOn(CometChatSearchConversationsManager.prototype, 'search')
        .mockResolvedValue({ results: [], hasMore: false });
      const onError = vi.fn();
      render(<CometChatSearchRoot defaultSearchText="hello" onError={onError} />);
      await waitFor(() => {
        expect(screen.getAllByText(/search_no_result_title/).length).toBeGreaterThan(0);
      });
      expect(screen.queryByText(/search_error_title/)).toBeNull();
      expect(screen.queryByText(/search_connect_to_search/)).toBeNull();
      expect(onError).not.toHaveBeenCalled();
      act(() => {
        onConnected?.();
      });
      expect(messages).toHaveBeenCalledTimes(1);
      expect(conversations).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('the conversations scope fails and the messages scope finds nothing: the same', async () => {
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockRejectedValue(
        SERVER_ERROR
      );
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockResolvedValue({
        results: [],
        hasMore: false,
      });
      const onError = vi.fn();
      render(<CometChatSearchRoot defaultSearchText="hello" onError={onError} />);
      await waitFor(() => {
        expect(screen.getAllByText(/search_no_result_title/).length).toBeGreaterThan(0);
      });
      expect(screen.queryByText(/search_error_title/)).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    });

    it("the app's own empty view is shown, never its error view", async () => {
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(SERVER_ERROR);
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockResolvedValue({
        results: [],
        hasMore: false,
      });
      const onError = vi.fn();
      render(
        <CometChatSearchRoot
          defaultSearchText="hello"
          emptyView={<span>my own empty</span>}
          errorView={<span>my own error</span>}
          onError={onError}
        />
      );
      await waitFor(() => {
        expect(screen.getAllByText('my own empty').length).toBeGreaterThan(0);
      });
      expect(screen.queryByText('my own error')).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    });

    it('the only scope on screen failing is its own error view, with onError (nothing to wait for)', async () => {
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(SERVER_ERROR);
      const onError = vi.fn();
      render(
        <CometChatSearchRoot defaultSearchText="hello" searchIn={['messages']} onError={onError} />
      );
      // The regression: the failure was held for a scope that never renders, so
      // the screen showed the plain "No results" and onError was never called —
      // while with offline off the same error shows the error view and reports it.
      await waitFor(() => {
        expect(screen.getAllByText(/search_error_title/).length).toBeGreaterThan(0);
      });
      expect(screen.queryByText(/search_no_result_title/)).toBeNull();
      expect(onError).toHaveBeenCalledWith(SERVER_ERROR);
    });

    it('offline OFF: the only scope on screen failing is the same error view with onError (parity)', async () => {
      fake.setEnabled(false);
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(SERVER_ERROR);
      const onError = vi.fn();
      render(
        <CometChatSearchRoot defaultSearchText="hello" searchIn={['messages']} onError={onError} />
      );
      await waitFor(() => {
        expect(screen.getAllByText(/search_error_title/).length).toBeGreaterThan(0);
      });
      expect(screen.queryByText(/search_no_result_title/)).toBeNull();
      expect(onError).toHaveBeenCalledWith(SERVER_ERROR);
    });

    it('a filter-only messages search that fails with a real error is the error view, with onError', async () => {
      const read = scriptedRead('Messages');
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'startFilterRead').mockReturnValue({
        request: { fetchPrevious: read.fn } as unknown as CometChat.MessagesRequest,
        limit: 2,
      });
      const onError = vi.fn();
      render(<CometChatSearchRoot initialSearchFilter="photos" onError={onError} />);
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().cached([]);
      });
      act(() => {
        read.last().fail(SERVER_ERROR);
      });
      // A filter leaves one scope on screen, so its real failure is the error
      // view at once. (Offline past the cache is still the plain empty state.)
      await waitFor(() => {
        expect(screen.getAllByText(/search_error_title/).length).toBeGreaterThan(0);
      });
      expect(screen.queryByText(/search_no_result_title/)).toBeNull();
      expect(onError).toHaveBeenCalledWith(SERVER_ERROR);
    });

    it('a filter-only conversations search that fails with a real error is the error view, with onError', async () => {
      const read = scriptedRead('Conversations');
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'startFilterRead').mockReturnValue({
        fetchNext: read.fn,
      } as unknown as CometChat.ConversationsRequest);
      const onError = vi.fn();
      render(<CometChatSearchRoot initialSearchFilter="unread" onError={onError} />);
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().cached([]);
      });
      act(() => {
        read.last().fail(SERVER_ERROR);
      });
      // A filter leaves one scope on screen, so its real failure is the error
      // view at once. (Offline past the cache is still the plain empty state.)
      await waitFor(() => {
        expect(screen.getAllByText(/search_error_title/).length).toBeGreaterThan(0);
      });
      expect(screen.queryByText(/search_no_result_title/)).toBeNull();
      expect(onError).toHaveBeenCalledWith(SERVER_ERROR);
    });

    it('results from the other scope stay and the failure still reaches onError once (rule 5)', async () => {
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockRejectedValue(
        SERVER_ERROR
      );
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockResolvedValue({
        results: [message()],
        hasMore: false,
      });
      const onError = vi.fn();
      render(<CometChatSearchRoot defaultSearchText="hello" onError={onError} />);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      expect(onError).toHaveBeenCalledWith(SERVER_ERROR);
      expect(screen.queryByText(/search_error_title|search_no_result_title/)).toBeNull();
    });

    it('both scopes failing with real errors is still the error view with onError', async () => {
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockRejectedValue(
        SERVER_ERROR
      );
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(SERVER_ERROR);
      const onError = vi.fn();
      render(<CometChatSearchRoot defaultSearchText="hello" onError={onError} />);
      await waitFor(() => {
        expect(screen.getAllByText(/search_error_title/).length).toBeGreaterThan(0);
      });
      expect(screen.queryByText(/search_no_result_title/)).toBeNull();
      expect(onError).toHaveBeenCalled();
    });

    it('offline OFF: the same one-scope failure stays as today, with onError', async () => {
      fake.setEnabled(false);
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(SERVER_ERROR);
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockResolvedValue({
        results: [],
        hasMore: false,
      });
      const onError = vi.fn();
      render(<CometChatSearchRoot defaultSearchText="hello" onError={onError} />);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      expect(screen.queryByText(/search_no_result_title/)).toBeNull();
    });

    it('a scope holds its real error for the screen, drops it when the search ends, and stops saying it failed', async () => {
      const hold = vi.fn();
      const report = vi.fn();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CometChatSearchOfflineContext.Provider
          value={{
            kinds: { conversations: null, messages: null },
            report,
            hold,
            bothScopesActive: true,
          }}
        >
          {children}
        </CometChatSearchOfflineContext.Provider>
      );
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockRejectedValue(
        SERVER_ERROR
      );
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(SERVER_ERROR);
      const onError = vi.fn();
      const conversations = renderHook(
        ({ keyword }: { keyword: string }) =>
          useCometChatSearchConversations({
            searchKeyword: keyword,
            activeFilters: filters,
            onError,
          }),
        { wrapper, initialProps: { keyword: 'al' } }
      );
      const messages = renderHook(
        ({ keyword }: { keyword: string }) =>
          useCometChatSearchMessages({ searchKeyword: keyword, activeFilters: filters, onError }),
        { wrapper, initialProps: { keyword: 'al' } }
      );
      await waitFor(() => {
        expect(conversations.result.current.searchFailed).toBe(true);
        expect(messages.result.current.searchFailed).toBe(true);
      });
      expect(conversations.result.current.fetchState).toBe('empty');
      expect(hold).toHaveBeenCalledWith('conversations', SERVER_ERROR);
      expect(hold).toHaveBeenCalledWith('messages', SERVER_ERROR);
      expect(onError).not.toHaveBeenCalled();
      conversations.rerender({ keyword: '' });
      messages.rerender({ keyword: '' });
      await waitFor(() => {
        expect(conversations.result.current.searchFailed).toBe(false);
        expect(messages.result.current.searchFailed).toBe(false);
      });
      expect(hold).toHaveBeenLastCalledWith('messages', null);
      hold.mockClear();
      conversations.unmount();
      messages.unmount();
      expect(hold).toHaveBeenCalledWith('conversations', null);
      expect(hold).toHaveBeenCalledWith('messages', null);
    });

    it('the screen reads the scopes: only a real failure joins another failure into the error view', () => {
      expect(searchOfflineKind(false, true)).toBe('failed');
      expect(searchOfflineKind(true, false)).toBe('search');
      expect(searchOfflineKind(undefined)).toBeNull();
      expect(bothScopesFailed('failed', 'failed')).toBe(true);
      expect(bothScopesFailed('failed', 'search')).toBe(true);
      expect(bothScopesFailed('search', 'failed')).toBe(true);
      expect(bothScopesFailed('search', 'search')).toBe(false);
      expect(bothScopesFailed('failed', null)).toBe(false);
      expect(bothScopesFailed(null, 'search')).toBe(false);
    });
  });

  describe('offline OFF', () => {
    it("a not-connected rejection is today's error state and onError", async () => {
      fake.setEnabled(false);
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(NOT_CONNECTED);
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchMessages({ searchKeyword: 'hello', activeFilters: filters, onError })
      );
      await waitFor(() => {
        expect(result.current.fetchState).toBe('error');
      });
      expect(onError).toHaveBeenCalledTimes(1);
      // No offline field appears on the hook's result.
      expect(result.current).not.toHaveProperty('connectToSearch');
      expect(result.current).not.toHaveProperty('connectToLoad');
    });

    it("passes the integrator's own builder, as today", async () => {
      fake.setEnabled(false);
      const search = vi
        .spyOn(CometChatSearchConversationsManager.prototype, 'search')
        .mockResolvedValue({ results: [], hasMore: false });
      const builder = new CometChat.ConversationsRequestBuilder();
      renderHook(() =>
        useCometChatSearchConversations({
          searchKeyword: 'x',
          activeFilters: filters,
          conversationsRequestBuilder: builder,
        })
      );
      await waitFor(() => {
        expect(search).toHaveBeenCalledTimes(1);
      });
      expect(search.mock.calls[0]?.[2]).toBe(builder);
    });
  });

  it('messages: logout clears the results and drops a late answer; a cache reset searches again', async () => {
    const message = new CometChat.TextMessage('peer', 'hello', 'user');
    const late = deferred<{ results: CometChat.BaseMessage[]; hasMore: boolean }>();
    const search = vi
      .spyOn(CometChatSearchMessagesManager.prototype, 'search')
      .mockResolvedValueOnce({ results: [message], hasMore: false })
      .mockReturnValueOnce(late.promise)
      .mockResolvedValue({ results: [message], hasMore: false });
    const { result, rerender } = renderHook(
      ({ keyword }: { keyword: string }) =>
        useCometChatSearchMessages({ searchKeyword: keyword, activeFilters: filters }),
      { initialProps: { keyword: 'hello' } }
    );
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });
    rerender({ keyword: 'hello again' });
    const hub = OfflineHub.getInstance();
    act(() => {
      hub.session.emit(1);
    });
    expect(result.current.messages).toEqual([]);
    await act(async () => {
      late.resolve({ results: [message], hasMore: false });
      await late.promise;
    });
    expect(result.current.messages).toEqual([]);
    expect(search).toHaveBeenCalledTimes(2);
    act(() => {
      hub.cacheReset.emit({ gen: 1, reason: 'KEY_LOST', pendingMessagesLost: 0 });
    });
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });
    expect(search).toHaveBeenCalledTimes(3);
  });

  it('conversations: logout clears the results; a cache reset searches again', async () => {
    const conversation = {
      getConversationId: () => 'c1',
    } as unknown as CometChat.Conversation;
    const search = vi
      .spyOn(CometChatSearchConversationsManager.prototype, 'search')
      .mockResolvedValue({ results: [conversation], hasMore: false });
    const { result } = renderHook(() =>
      useCometChatSearchConversations({ searchKeyword: 'hello', activeFilters: filters })
    );
    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });
    const hub = OfflineHub.getInstance();
    act(() => {
      hub.session.emit(1);
    });
    expect(result.current.conversations).toEqual([]);
    act(() => {
      hub.cacheReset.emit({ gen: 1, reason: 'KEY_LOST', pendingMessagesLost: 0 });
    });
    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });
    expect(search).toHaveBeenCalledTimes(2);
  });

  describe('filter-only reads are two-phase (README §3.9, AC-10.1)', () => {
    // Stable arrays: the hook re-reads when its filters change identity.
    const photos: CometChatSearchFilter[] = ['photos'];
    const unread: CometChatSearchFilter[] = ['unread'];
    const message = (id: number) => {
      const m = new CometChat.TextMessage('peer', `m${String(id)}`, 'user');
      m.setId(id);
      return m;
    };
    const ids = (list: CometChat.BaseMessage[]) => list.map(m => m.getId());

    function scriptManager() {
      const read = scriptedRead('Messages');
      const spy = vi
        .spyOn(CometChatSearchMessagesManager.prototype, 'startFilterRead')
        .mockReturnValue({
          request: { fetchPrevious: read.fn } as unknown as CometChat.MessagesRequest,
          limit: 2,
        });
      return { read, spy };
    }

    function mount() {
      return renderHook(() =>
        useCometChatSearchMessages({ searchKeyword: '', activeFilters: photos })
      );
    }

    it('messages: the device’s matches paint first, newest first; the server page replaces them', async () => {
      const { read } = scriptManager();
      const { result } = mount();
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      expect(read.last().listener).toBeDefined();
      act(() => {
        read.last().cached([message(1), message(2)]);
      });
      expect(ids(result.current.messages)).toEqual([2, 1]);
      expect(result.current.fetchState).toBe('loaded');
      act(() => {
        read.last().server([message(2), message(3)]);
      });
      expect(ids(result.current.messages)).toEqual([3, 2]);
      expect(result.current.hasMore).toBe(true);
    });

    it('D84 rule 2: messages: offline keeps what the device has, no error view, no onError', async () => {
      const { read } = scriptManager();
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchMessages({ searchKeyword: '', activeFilters: photos, onError })
      );
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().cached([message(1)]);
      });
      act(() => {
        read.last().fail();
      });
      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(ids(result.current.messages)).toEqual([1]);
      expect(onError).not.toHaveBeenCalled();
    });

    it('D84 (Android): messages: filters only, offline with nothing on the device is the plain empty state, not "Connect to search" or "Connect to load", no onError, and a reconnect does not run it again', async () => {
      const { read, spy } = scriptManager();
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchMessages({ searchKeyword: '', activeFilters: photos, onError })
      );
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().cached([]);
      });
      act(() => {
        read.last().fail();
      });
      await waitFor(() => {
        expect(result.current.fetchState).toBe('empty');
      });
      expect(result.current).not.toHaveProperty('connectToLoad');
      expect(result.current.connectToSearch).toBeFalsy();
      expect(onError).not.toHaveBeenCalled();
      act(() => {
        onConnected?.();
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(read.calls).toHaveLength(1);
    });

    it('D83 rule 2: messages: a load-more page offline keeps the rows and stays silent', async () => {
      const { read } = scriptManager();
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchMessages({ searchKeyword: '', activeFilters: photos, onError })
      );
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().server([message(5), message(6)]);
      });
      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });
      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });
      act(() => {
        void result.current.loadMore();
      });
      await waitFor(() => {
        expect(read.calls).toHaveLength(2);
      });
      act(() => {
        read.last().fail();
      });
      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(ids(result.current.messages)).toEqual([6, 5]);
      expect(onError).not.toHaveBeenCalled();
    });

    it('messages: load more reads the next page two-phase, without repeating a row', async () => {
      const { read } = scriptManager();
      const { result } = mount();
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().server([message(5), message(6)]);
      });
      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });
      /* The SDK's second read arrives once the first has settled. */
      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });
      act(() => {
        void result.current.loadMore();
      });
      await waitFor(() => {
        expect(read.calls).toHaveLength(2);
      });
      act(() => {
        read.last().cached([message(3), message(4)]);
      });
      expect(ids(result.current.messages)).toEqual([6, 5, 4, 3]);
      act(() => {
        read.last().server([message(4)]);
      });
      expect(ids(result.current.messages)).toEqual([6, 5, 4]);
      expect(result.current.hasMore).toBe(false);
    });

    it('messages: a keyword is still the server’s only (no cache for a keyword)', async () => {
      const { spy } = scriptManager();
      const search = vi
        .spyOn(CometChatSearchMessagesManager.prototype, 'search')
        .mockResolvedValue({ results: [], hasMore: false });
      renderHook(() =>
        useCometChatSearchMessages({ searchKeyword: 'hello', activeFilters: photos })
      );
      await waitFor(() => {
        expect(search).toHaveBeenCalledTimes(1);
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('offline off: filters only keep today’s single fetch', async () => {
      fake.setEnabled(false);
      const { spy } = scriptManager();
      const search = vi
        .spyOn(CometChatSearchMessagesManager.prototype, 'search')
        .mockResolvedValue({ results: [], hasMore: false });
      mount();
      await waitFor(() => {
        expect(search).toHaveBeenCalledTimes(1);
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('conversations: the device’s matches paint first; the server page replaces them', async () => {
      const read = scriptedRead('Conversations');
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'startFilterRead').mockReturnValue({
        fetchNext: read.fn,
      } as unknown as CometChat.ConversationsRequest);
      const row = (id: string) =>
        ({ getConversationId: () => id }) as unknown as CometChat.Conversation;
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: '', activeFilters: unread })
      );
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      expect(read.last().listener).toBeDefined();
      act(() => {
        read.last().cached([row('a'), row('b')]);
      });
      expect(result.current.conversations.map(c => c.getConversationId())).toEqual(['a', 'b']);
      act(() => {
        read.last().server([row('b'), row('c')]);
      });
      expect(result.current.conversations.map(c => c.getConversationId())).toEqual(['b', 'c']);
      expect(result.current.hasMore).toBe(false);
    });

    it('D84 rule 2: conversations: offline with the device’s matches shows them, no onError', async () => {
      const read = scriptedRead('Conversations');
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'startFilterRead').mockReturnValue({
        fetchNext: read.fn,
      } as unknown as CometChat.ConversationsRequest);
      const onError = vi.fn();
      const row = { getConversationId: () => 'a' } as unknown as CometChat.Conversation;
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: '', activeFilters: unread, onError })
      );
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().cached([row]);
      });
      act(() => {
        read.last().fail();
      });
      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(result.current.conversations).toHaveLength(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('D84 (Android): conversations: filters only, offline with nothing on the device is the plain empty state, not "Connect to search" or "Connect to load", and no onError', async () => {
      const read = scriptedRead('Conversations');
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'startFilterRead').mockReturnValue({
        fetchNext: read.fn,
      } as unknown as CometChat.ConversationsRequest);
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: '', activeFilters: unread, onError })
      );
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().cached([]);
      });
      act(() => {
        read.last().fail();
      });
      await waitFor(() => {
        expect(result.current.fetchState).toBe('empty');
      });
      expect(result.current).not.toHaveProperty('connectToLoad');
      expect(result.current.connectToSearch).toBeFalsy();
      expect(onError).not.toHaveBeenCalled();
    });

    it('D84 (Android): a filter-only read that fails with a real error is still the error view and onError', async () => {
      const read = scriptedRead('Conversations');
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'startFilterRead').mockReturnValue({
        fetchNext: read.fn,
      } as unknown as CometChat.ConversationsRequest);
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: '', activeFilters: unread, onError })
      );
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      act(() => {
        read.last().cached([]);
      });
      act(() => {
        read.last().fail({ code: 'ERR_SERVER' });
      });
      await waitFor(() => {
        expect(result.current.fetchState).toBe('error');
      });
      expect(result.current).not.toHaveProperty('connectToLoad');
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});
