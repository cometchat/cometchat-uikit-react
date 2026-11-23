/**
 * Offline ON with rows on screen, a jump (quoted message, search result, go to
 * message) to a message that is not saved keeps the rows exactly as they are, as on Android
 * (`MessageListOfflineReads.kt` @ca5b4e18 `jumpLocked` → `showRowsOrError`, `:375-383`,
 * `:685-691`). The target is looked up first; the rows are replaced only once it is found. A
 * failure is detected by the read failing, not by the connection state, so the SDK's 15-18 s
 * window before it notices a lost socket makes no difference. A not-connected failure is silent;
 * a real error reaches `onError` once. The jump is not retried on reconnect (`:919-933`).
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { messageListReducer } from "../CometChatMessageList.reducer";
import {
  initialMessageListState,
  type CometChatMessageListAction,
  type CometChatMessageListState,
  type CometChatUseMessageListOptions,
} from "../CometChatMessageList.types";
import type { MessageListRefs } from "../messageListRefs";
import type { CometChatMessageListManager } from "../CometChatMessageListManager";
import { useMessageListEvents } from "../useMessageListEvents";
import { useMessageListScroll } from "../useMessageListScroll";
import { OfflineHub } from "../../../utils/offline/hub";
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from "../../../testing/offline-sdk-fake";
import { CometChatEventsContext } from "../../../context/CometChatEventsContext";
import type { CometChatSDKEvent } from "../../../context/CometChatEvents.types";

vi.mock("../CometChatMessageList.sound", () => ({
  playIncomingSound: vi.fn(),
}));

const me = new CometChat.User({ uid: "me", name: "me" });
const peer = new CometChat.User({ uid: "peer", name: "peer" });

function fromPeer(id: number) {
  return offlineMessage(textMessage(`p${String(id)}`, "me", "user", "peer"), {
    id,
    sentAt: id,
  });
}
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => fromPeer(from + i));
const idsOf = (rows: CometChat.BaseMessage[]) => rows.map((m) => m.getId());

const notConnected = { code: "FAILED_TO_FETCH", message: "not connected" };
const realError = { code: "ERR_MESSAGE_NOT_FOUND", message: "no such message" };

type Details = (
  id: number,
  onFail?: (error: unknown) => void,
) => Promise<unknown>;
interface PageHandlers {
  onCached: (p: CometChat.BaseMessage[]) => void;
  onServer: (p: CometChat.BaseMessage[]) => void;
  onError: (e: unknown, notConnected: boolean) => void;
}

function harness(initial: Partial<CometChatMessageListState>) {
  let state: CometChatMessageListState = {
    ...initialMessageListState,
    ...initial,
  };
  const actions: CometChatMessageListAction[] = [];
  const manager = {
    getMessageDetailsTwoPhase: vi.fn<Details>(),
    fetchPreviousTwoPhase: vi.fn<(h: PageHandlers) => Promise<void>>(),
    fetchNextTwoPhase: vi.fn<(h: PageHandlers) => Promise<void>>(),
    fetchAroundMessageId: vi.fn(),
    resetPreviousRequest: vi.fn(),
    initNextRequest: vi.fn(),
    getPageLimit: () => 30,
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAsDelivered: vi.fn().mockResolvedValue(undefined),
    markConversationAsRead: vi.fn().mockResolvedValue(undefined),
  };
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: manager as unknown as CometChatMessageListManager },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: "" },
    groupRef: { current: undefined },
    stateRef: { current: state },
    optionsRef: {
      current: { loggedInUser: me } as CometChatUseMessageListOptions,
    },
    initializeRef: { current: null },
    reconnectEdgesRef: { current: null },
    pendingMessagesMap: {},
  };
  const dispatch = (action: CometChatMessageListAction) => {
    actions.push(action);
    state = messageListReducer(state, action);
    refs.stateRef.current = state;
  };
  return {
    refs,
    manager,
    dispatch,
    actions,
    get state() {
      return state;
    },
  };
}

/** The target lookup fails: the device has no copy and the read errs (the SDK answers null). */
function lookupFails(h: ReturnType<typeof harness>, error: unknown) {
  h.manager.getMessageDetailsTwoPhase.mockImplementation((_id, onFail) => {
    onFail?.(error);
    return Promise.resolve(null);
  });
}

/** Every page read fails as it does offline past the cache. */
function pagesFailOffline(h: ReturnType<typeof harness>) {
  const fail = (page: PageHandlers) => {
    page.onError(notConnected, true);
    return Promise.resolve();
  };
  h.manager.fetchPreviousTwoPhase.mockImplementation(fail);
  h.manager.fetchNextTwoPhase.mockImplementation(fail);
}

describe("an offline jump to a message that is not saved keeps the rows", () => {
  let fake: OfflineSdkFake;
  const handlers = new Set<(e: CometChatSDKEvent) => void>();
  const onError = vi.fn();

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    handlers.clear();
    onError.mockClear();
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  function mount(h: ReturnType<typeof harness>) {
    const bridge = {
      subscribe: (fn: (e: CometChatSDKEvent) => void) => {
        handlers.add(fn);
        return () => handlers.delete(fn);
      },
      publish: vi.fn(),
    };
    return renderHook(
      () => {
        useMessageListEvents(
          {
            user: peer,
            group: undefined,
            loggedInUser: me,
            messagesRequestBuilder: undefined,
            parentMessage: undefined,
            parentMessageId: undefined,
            messageTypes: ["text"],
            messageCategories: ["message"],
            disableSoundForMessages: false,
            customSoundForMessages: undefined,
            scrollToBottomOnNewMessages: false,
            hideReceipts: false,
          },
          h.refs,
          h.dispatch,
        );
        return useMessageListScroll(
          {
            user: peer,
            group: undefined,
            messagesRequestBuilder: undefined,
            parentMessageId: undefined,
            messageTypes: ["text"],
            messageCategories: ["message"],
            onError,
            onConversationMarkedAsRead: undefined,
            isAgentChat: false,
          },
          h.refs,
          h.dispatch,
        );
      },
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <CometChatEventsContext.Provider value={bridge}>
            {children}
          </CometChatEventsContext.Provider>
        ),
      },
    );
  }
  const reconnect = async () => {
    await act(async () => {
      handlers.forEach((fn) => {
        fn({ type: "connection/connected" });
      });
      await Promise.resolve();
    });
  };

  /** Rows 31-60 on screen with the older edge blocked offline. */
  const onScreen = () =>
    harness({
      messages: range(31, 60),
      fetchState: "loaded",
      hasMore: true,
      hasReachedLatest: true,
      offlineFooter: "connect_to_load_more",
    });

  /** The state a kept-rows jump must leave exactly as it was. */
  function expectRowsKept(
    h: ReturnType<typeof harness>,
    before: CometChatMessageListState,
  ) {
    expect(h.state.messages).toBe(before.messages);
    expect(idsOf(h.state.messages)).toEqual(idsOf(range(31, 60)));
    expect(h.state.fetchState).toBe("loaded");
    expect(h.state.error ?? null).toBeNull();
    expect(h.state.connectToLoad).toBeFalsy();
    expect(h.state.scrollToMessageId ?? null).toBeNull();
    expect(h.state.offlineScrollAnchor ?? null).toBeNull();
    expect(h.state.offlineFooter).toBe(before.offlineFooter);
    expect(h.refs.generationRef.current).toBe(0);
    const types = h.actions.map((a) => a.type);
    expect(types).not.toContain("RESET");
    expect(types).not.toContain("FETCH_PREVIOUS_START");
    // Nothing reads around the target, and the older-page cursor is untouched.
    expect(h.manager.fetchPreviousTwoPhase).not.toHaveBeenCalled();
    expect(h.manager.fetchNextTwoPhase).not.toHaveBeenCalled();
    expect(h.manager.resetPreviousRequest).not.toHaveBeenCalled();
  }

  it("the SDK still reports connected (its detection window): rows kept, nothing else changes, no onError", async () => {
    fake.connected = true;
    const h = onScreen();
    lookupFails(h, notConnected);
    pagesFailOffline(h);
    const before = h.state;
    const { result } = mount(h);
    await act(async () => {
      await result.current.goToMessage(5);
    });
    expect(h.manager.getMessageDetailsTwoPhase).toHaveBeenCalledTimes(1);
    expectRowsKept(h, before);
    expect(onError).not.toHaveBeenCalled();
  });

  it("the SDK reports disconnected: rows kept, nothing else changes, no onError", async () => {
    fake.connected = false;
    const h = onScreen();
    lookupFails(h, notConnected);
    pagesFailOffline(h);
    const before = h.state;
    const { result } = mount(h);
    await act(async () => {
      await result.current.goToMessage(5);
    });
    expectRowsKept(h, before);
    expect(onError).not.toHaveBeenCalled();
  });

  it("a real error: rows kept and onError once with that error", async () => {
    fake.connected = true;
    const h = onScreen();
    lookupFails(h, realError);
    const before = h.state;
    const { result } = mount(h);
    await act(async () => {
      await result.current.goToMessage(5);
    });
    expectRowsKept(h, before);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(realError);
  });

  it("paging works after a kept-rows jump, and a reconnect loads the blocked edge without retrying the jump", async () => {
    fake.connected = false;
    const h = onScreen();
    lookupFails(h, notConnected);
    const { result } = mount(h);
    await act(async () => {
      await result.current.goToMessage(5);
    });
    h.manager.fetchPreviousTwoPhase.mockImplementation((page) => {
      page.onCached(range(1, 30));
      page.onServer(range(1, 30));
      return Promise.resolve();
    });
    fake.connected = true;
    await reconnect();
    await vi.waitFor(() => {
      expect(h.state.offlineFooter).toBe("none");
    });
    expect(h.manager.fetchPreviousTwoPhase).toHaveBeenCalledTimes(1);
    expect(idsOf(h.state.messages)).toEqual(idsOf(range(1, 60)));
    // The jump is not retried on reconnect.
    expect(h.manager.getMessageDetailsTwoPhase).toHaveBeenCalledTimes(1);
    expect(h.state.scrollToMessageId ?? null).toBeNull();
  });

  it("a saved target still jumps: the window around it replaces the rows", async () => {
    fake.connected = false;
    const h = onScreen();
    h.manager.getMessageDetailsTwoPhase.mockResolvedValue(fromPeer(5));
    h.manager.fetchPreviousTwoPhase.mockImplementation((page) => {
      page.onCached(range(1, 4));
      page.onError(notConnected, true);
      return Promise.resolve();
    });
    h.manager.fetchNextTwoPhase.mockImplementation((page) => {
      page.onCached(range(6, 10));
      page.onError(notConnected, true);
      return Promise.resolve();
    });
    const { result } = mount(h);
    await act(async () => {
      await result.current.goToMessage(5);
    });
    expect(h.actions.map((a) => a.type)).toContain("RESET");
    expect(h.refs.generationRef.current).toBe(1);
    expect(idsOf(h.state.messages)).toEqual(idsOf(range(1, 10)));
    expect(h.state.scrollToMessageId).toBe(5);
    expect(h.manager.resetPreviousRequest).toHaveBeenCalledWith(5);
    // The target was looked up once; the window read did not look it up again.
    expect(h.manager.getMessageDetailsTwoPhase).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("two quick jumps: the later one wins, whichever lookup answers first", async () => {
    fake.connected = true;
    const h = onScreen();
    let answerFirst: (m: unknown) => void = () => undefined;
    h.manager.getMessageDetailsTwoPhase
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answerFirst = resolve;
          }),
      )
      .mockImplementationOnce((_id, onFail) => {
        onFail?.(notConnected);
        return Promise.resolve(null);
      });
    const { result } = mount(h);
    let first: Promise<void> = Promise.resolve();
    await act(async () => {
      first = result.current.goToMessage(5);
      await result.current.goToMessage(7);
    });
    // The earlier jump's target answers last: it is superseded and changes nothing.
    await act(async () => {
      answerFirst(fromPeer(5));
      await first;
    });
    expect(idsOf(h.state.messages)).toEqual(idsOf(range(31, 60)));
    expect(h.actions.map((a) => a.type)).not.toContain("RESET");
    expect(h.manager.fetchPreviousTwoPhase).not.toHaveBeenCalled();
  });

  it("an opening jump (nothing on screen) with the SDK reporting connected opens on the newest saved page", async () => {
    fake.connected = true;
    const h = harness({});
    lookupFails(h, notConnected);
    h.manager.fetchPreviousTwoPhase.mockImplementation((page) => {
      page.onCached(range(61, 90));
      page.onError(notConnected, true);
      return Promise.resolve();
    });
    const { result } = mount(h);
    await act(async () => {
      await result.current.goToMessage(5);
    });
    expect(h.manager.resetPreviousRequest).toHaveBeenCalledWith();
    expect(idsOf(h.state.messages)).toEqual(idsOf(range(61, 90)));
    expect(h.state.fetchState).not.toBe("error");
    expect(h.state.scrollToMessageId ?? null).toBeNull();
    expect(h.manager.fetchNextTwoPhase).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("offline off: the jump is unchanged (the list resets and reads around the target)", async () => {
    fake.setEnabled(false);
    const h = onScreen();
    h.manager.fetchAroundMessageId.mockResolvedValue({
      messages: range(1, 10),
      hasMoreNewer: true,
    });
    const { result } = mount(h);
    await act(async () => {
      await result.current.goToMessage(5);
    });
    expect(h.actions[0]?.type).toBe("RESET");
    expect(h.manager.getMessageDetailsTwoPhase).not.toHaveBeenCalled();
    expect(h.manager.fetchAroundMessageId).toHaveBeenCalledWith(5);
    expect(idsOf(h.state.messages)).toEqual(idsOf(range(1, 10)));
    expect(h.state.scrollToMessageId).toBe(5);
  });

  it("H1: the connection returns while an empty list read is in flight; once it fails, the list reads again once", async () => {
    const h = harness({ fetchState: "loading", messages: [] });
    const initialize = vi.fn();
    h.refs.initializeRef.current = initialize;
    mount(h);
    await reconnect();
    expect(initialize).not.toHaveBeenCalled();
    // The read in flight now gives up, not connected: the "Connect to load messages" error view.
    act(() => {
      h.dispatch({
        type: "OFFLINE_PAGE_ERROR",
        direction: "previous",
        notConnected: true,
        error: "not connected",
      });
    });
    expect(h.state.fetchState).toBe("error");
    await vi.waitFor(() => {
      expect(initialize).toHaveBeenCalledTimes(1);
    });
    expect(h.refs.generationRef.current).toBe(1);
  });
});
