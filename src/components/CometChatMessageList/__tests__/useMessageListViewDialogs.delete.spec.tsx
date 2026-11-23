/**
 * The delete-confirm toast must report what actually happened.
 *
 * No SDK queues a delete of an already-sent message while offline: the call is refused and the
 * message stays on screen. `deleteMessage` swallows that failure (it goes to `onError`), so the
 * confirm handler used to show "Message deleted successfully." either way.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useMessageListViewDialogs } from '../useMessageListViewDialogs';
import { buildTextMessage } from '../../../testing/mock-builders';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEvent } from '../../../context/CometChatEvents.types';
import { isOfflineOn, isSdkConnected } from '../../../utils/offline/gate';

vi.mock('../../../utils/offline/gate', () => ({
  isOfflineOn: vi.fn(() => false),
  isSdkConnected: vi.fn(() => true),
}));

const loggedInUser = { getUid: () => 'u1' } as unknown as CometChat.User;

function harness(deleteMessage: (id: number) => Promise<unknown>) {
  return renderHook(() =>
    useMessageListViewDialogs({
      loggedInUser,
      scrollContainerRef: { current: null },
      deleteMessage,
      markMessageAsUnread: vi.fn().mockResolvedValue(undefined),
      reactToMessage: vi.fn().mockResolvedValue(undefined),
      goToMessage: vi.fn().mockResolvedValue(undefined),
      getLocalizedString: (key: string) => key, // assert the key, not the copy
    })
  );
}

beforeEach(() => {
  vi.mocked(isOfflineOn).mockReturnValue(false);
  vi.mocked(isSdkConnected).mockReturnValue(true);
});

describe('the delete-confirm toast', () => {
  it('reports a failure instead of claiming the message was deleted', async () => {
    const message = buildTextMessage({ id: 11 });
    const { result } = harness(vi.fn().mockResolvedValue(false));

    act(() => { result.current.handleDeleteMessage(message as unknown as CometChat.BaseMessage); });
    expect(result.current.deleteTarget).toBe(message);

    await act(async () => { await result.current.handleDeleteConfirm(); });

    expect(result.current.toast).toEqual({ text: 'message_list_error_subtitle', variant: 'error' });
    expect(result.current.deleteTarget).toBeNull();
  });

  it('reports success when the delete went through', async () => {
    const message = buildTextMessage({ id: 12 });
    const { result } = harness(vi.fn().mockResolvedValue(true));

    act(() => { result.current.handleDeleteMessage(message as unknown as CometChat.BaseMessage); });
    await act(async () => { await result.current.handleDeleteConfirm(); });

    expect(result.current.toast).toEqual({ text: 'message_list_message_deleted', variant: 'default' });
  });

  it('reads a hook that reports nothing as done, as it did before', async () => {
    const message = buildTextMessage({ id: 13 });
    const { result } = harness(vi.fn().mockResolvedValue(undefined));

    act(() => { result.current.handleDeleteMessage(message as unknown as CometChat.BaseMessage); });
    await act(async () => { await result.current.handleDeleteConfirm(); });

    expect(result.current.toast.text).toBe('message_list_message_deleted');
  });
});

describe('a delete refused while the device is offline', () => {
  it('names the cause instead of showing the generic error', async () => {
    vi.mocked(isOfflineOn).mockReturnValue(true);
    vi.mocked(isSdkConnected).mockReturnValue(false);
    const message = buildTextMessage({ id: 14 });
    const { result } = harness(vi.fn().mockResolvedValue(false));

    act(() => { result.current.handleDeleteMessage(message as unknown as CometChat.BaseMessage); });
    await act(async () => { await result.current.handleDeleteConfirm(); });

    expect(result.current.toast).toEqual({
      text: 'message_list_option_delete_failed',
      variant: 'error',
    });
  });

  it('keeps the generic error when the connection is up', async () => {
    vi.mocked(isOfflineOn).mockReturnValue(true);
    vi.mocked(isSdkConnected).mockReturnValue(true);
    const message = buildTextMessage({ id: 15 });
    const { result } = harness(vi.fn().mockResolvedValue(false));

    act(() => { result.current.handleDeleteMessage(message as unknown as CometChat.BaseMessage); });
    await act(async () => { await result.current.handleDeleteConfirm(); });

    expect(result.current.toast.text).toBe('message_list_error_subtitle');
  });
});

/**
 * An edit of an already-sent message is refused offline, and the composer leaves
 * edit mode before the request without putting the text back (as the Android kit
 * does). Nothing told the user it had not happened: the typed text just vanished
 * (QA item 3 on the qa.4 build).
 */
describe('a failed edit', () => {
  function eventHarness() {
    let emit: (event: CometChatEvent) => void = () => undefined;
    const value = {
      subscribe: (handler: (event: CometChatEvent) => void) => {
        emit = handler;
        return () => undefined;
      },
      publish: () => undefined,
    };
    const view = renderHook(
      () =>
        useMessageListViewDialogs({
          loggedInUser,
          scrollContainerRef: { current: null },
          deleteMessage: vi.fn().mockResolvedValue(true),
          markMessageAsUnread: vi.fn().mockResolvedValue(undefined),
          reactToMessage: vi.fn().mockResolvedValue(undefined),
          goToMessage: vi.fn().mockResolvedValue(undefined),
          getLocalizedString: (key: string) => key,
        }),
      {
        wrapper: ({ children }) => (
          <CometChatEventsContext.Provider value={value}>
            {children}
          </CometChatEventsContext.Provider>
        ),
      }
    );
    return { ...view, fire: (event: CometChatEvent) => emit(event) };
  }

  it('shows an error toast', () => {
    const { result, fire } = eventHarness();
    const message = buildTextMessage({ id: 16 }) as unknown as CometChat.BaseMessage;

    act(() => {
      fire({ type: 'ui:compose/edit', message, status: 'error', parentMessageId: null } as unknown as CometChatEvent);
    });

    expect(result.current.toast).toEqual({ text: 'message_list_error_subtitle', variant: 'error' });
  });

  it('says nothing when the edit went through', () => {
    const { result, fire } = eventHarness();
    const message = buildTextMessage({ id: 17 }) as unknown as CometChat.BaseMessage;

    act(() => {
      fire({ type: 'ui:compose/edit', message, status: 'success', parentMessageId: null } as unknown as CometChatEvent);
    });

    expect(result.current.toast.text).toBe('');
  });
});
