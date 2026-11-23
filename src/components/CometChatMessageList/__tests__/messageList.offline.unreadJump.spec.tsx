/**
 * Offline ON, a chat opened with "start from unread" or at a message id (push,
 * deep link) jumps to that message from the cache. When the message is neither
 * cached nor reachable, the list opens on the newest cached page as a normal
 * offline open: no error state and no scroll target (Aditya, 2026-11-04).
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { CometChat } from "@cometchat/chat-sdk-javascript";

const managers: Record<string, ReturnType<typeof vi.fn>>[] = [];
let makeManager: () => Record<string, ReturnType<typeof vi.fn>>;

vi.mock("../CometChatMessageListManager", () => ({
  CometChatMessageListManager: vi.fn().mockImplementation(() => {
    const m = makeManager();
    managers.push(m);
    return m;
  }),
}));
vi.mock("../CometChatMessageList.sound", () => ({
  playIncomingSound: vi.fn(),
}));

import { useMessageListInit } from "../useMessageListInit";
import { messageListReducer } from "../CometChatMessageList.reducer";
import {
  initialMessageListState,
  type CometChatMessageListAction,
  type CometChatMessageListState,
  type CometChatUseMessageListOptions,
} from "../CometChatMessageList.types";
import type { MessageListRefs } from "../messageListRefs";
import { OfflineHub } from "../../../utils/offline/hub";
import { serverIdOf } from "../../../utils/offline/identity";
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from "../../../testing/offline-sdk-fake";

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

const conversation = {
  getLastReadMessageId: () => "40",
  getUnreadMessageCount: () => 5,
};

function run(opts: {
  startFromUnreadMessages?: boolean;
  goToMessageId?: number;
  onError?: (error: unknown) => void;
}) {
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: null },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: "" },
    groupRef: { current: undefined },
    stateRef: { current: initialMessageListState },
    optionsRef: {
      current: { loggedInUser: me } as CometChatUseMessageListOptions,
    },
    initializeRef: { current: null },
    pendingMessagesMap: {},
  };
  const actions: CometChatMessageListAction[] = [];
  let state: CometChatMessageListState = initialMessageListState;
  const dispatch = (action: CometChatMessageListAction) => {
    actions.push(action);
    state = messageListReducer(state, action);
    refs.stateRef.current = state;
  };
  renderHook(() =>
    useMessageListInit(
      {
        user: peer,
        group: undefined,
        loggedInUser: me,
        messagesRequestBuilder: undefined,
        parentMessageId: undefined,
        startFromUnreadMessages: false,
        goToMessageId: undefined,
        messageTypes: ["text"],
        messageCategories: ["message"],
        onError: undefined,
        onActiveChatChanged: undefined,
        ...opts,
      } as Parameters<typeof useMessageListInit>[0],
      refs,
      dispatch,
    ),
  );
  void React;
  return {
    actions,
    get state() {
      return state;
    },
  };
}

describe("offline ON: open at a target message that may not be cached", () => {
  let fake: OfflineSdkFake;
  let details: ReturnType<typeof vi.fn>;
  let previous: ReturnType<typeof vi.fn>;
  let next: ReturnType<typeof vi.fn>;
  let resetPrevious: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    managers.length = 0;
    details = vi.fn();
    resetPrevious = vi.fn();
    next = vi
      .fn()
      .mockImplementation(
        (h: {
          onCached: (p: unknown[]) => void;
          onServer: (p: unknown[]) => void;
        }) => {
          h.onCached(range(41, 50));
          h.onServer(range(41, 50));
          return Promise.resolve();
        },
      );
    previous = vi.fn();
    makeManager = () =>
      ({
        getConversationTwoPhase: vi.fn().mockResolvedValue(conversation),
        getMessageDetailsTwoPhase: details,
        fetchPreviousTwoPhase: previous,
        fetchNextTwoPhase: next,
        resetPreviousRequest: resetPrevious,
        initNextRequest: vi.fn(),
        getPageLimit: () => 30,
        markAsDelivered: vi.fn().mockResolvedValue(undefined),
        markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      }) as never;
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it("a plain open: a stale cached newest page that does not join the server page is dropped (D13-R2)", async () => {
    previous.mockImplementation(
      (h: {
        onCached: (p: unknown[]) => void;
        onServer: (p: unknown[]) => void;
      }) => {
        h.onCached(range(100, 149));
        h.onServer(range(350, 399));
        return Promise.resolve();
      },
    );
    const run1 = run({});
    await waitFor(() => {
      expect(run1.state.hasReachedLatest).toBe(true);
    });
    expect(run1.state.messages.map(serverIdOf)).toEqual(
      range(350, 399).map(serverIdOf),
    );
    expect(run1.state.hasMore).toBe(true);
  });

  const cases: [
    string,
    { startFromUnreadMessages?: boolean; goToMessageId?: number },
  ][] = [
    ["start from unread", { startFromUnreadMessages: true }],
    ["goToMessageId", { goToMessageId: 40 }],
  ];

  for (const [name, opts] of cases) {
    it(`${name}: the target is cached, so the window around it opens and scrolls to it`, async () => {
      details.mockResolvedValue(fromPeer(40));
      previous.mockImplementation(
        (h: {
          onCached: (p: unknown[]) => void;
          onServer: (p: unknown[]) => void;
        }) => {
          h.onCached(range(10, 39));
          h.onServer(range(10, 39));
          return Promise.resolve();
        },
      );
      const run1 = run(opts);
      await waitFor(() => {
        expect(
          run1.actions.some((a) => a.type === "SET_SCROLL_TO_MESSAGE"),
        ).toBe(true);
      });
      expect(
        run1.actions.find((a) => a.type === "SET_SCROLL_TO_MESSAGE"),
      ).toMatchObject({
        messageId: 40,
      });
      expect(resetPrevious).toHaveBeenCalledWith(40);
      const ids = run1.state.messages.map(serverIdOf);
      expect(ids).toContain(40);
      expect(ids).toContain(39);
      expect(ids).toContain(41);
    });

    it(`${name}: the target is not cached and the device is offline, so the newest cached page opens, no error view, onError once, no scroll target`, async () => {
      fake.connected = false;
      details.mockResolvedValue(null);
      previous.mockImplementation(
        (h: {
          onCached: (p: unknown[]) => void;
          onError: (e: unknown, notConnected: boolean) => void;
        }) => {
          h.onCached(range(61, 90));
          h.onError(new Error("offline"), true);
          return Promise.resolve();
        },
      );
      const onError = vi.fn();
      const run1 = run({ ...opts, onError });
      await waitFor(() => {
        expect(
          run1.actions.some((a) => a.type === "SET_HAS_REACHED_LATEST"),
        ).toBe(true);
      });
      // D84: the jump that could not reach the server keeps the rows and stays silent.
      expect(onError).not.toHaveBeenCalled();
      const types = run1.actions.map((a) => a.type);
      expect(types).not.toContain("SET_SCROLL_TO_MESSAGE");
      expect(types).not.toContain("OFFLINE_AROUND_START");
      expect(types).not.toContain("FETCH_PREVIOUS_ERROR");
      expect(next).not.toHaveBeenCalled();
      // The newest page is read with no anchor.
      expect(resetPrevious).toHaveBeenCalledWith();
      expect(run1.state.messages.map(serverIdOf)).toEqual(
        range(61, 90).map(serverIdOf),
      );
      expect(run1.state.hasReachedLatest).toBe(true);
      expect(run1.state.scrollToMessageId).toBeFalsy();
      expect(run1.state.offlineScrollAnchor ?? null).toBeNull();
      expect(run1.state.error ?? null).toBeNull();
    });
  }
  it("D84 rule 3: a plain open offline with nothing cached is the \"Connect to load\" error state and one onError", async () => {
    fake.connected = false;
    previous.mockImplementation(
      (h: {
        onCached: (p: unknown[]) => void;
        onError: (e: unknown, notConnected: boolean) => void;
      }) => {
        h.onCached([]);
        h.onError(new Error("offline"), true);
        return Promise.resolve();
      },
    );
    const onError = vi.fn();
    const run1 = run({ onError });
    await waitFor(() => {
      expect(run1.state.fetchState).toBe("error");
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(run1.state.connectToLoad).toBe(true);
    expect(run1.state.messages).toEqual([]);
  });

  it("D84 rule 2: a plain open with cached rows and a failing offline server read keeps the rows and stays silent", async () => {
    fake.connected = false;
    previous.mockImplementation(
      (h: {
        onCached: (p: unknown[]) => void;
        onError: (e: unknown, notConnected: boolean) => void;
      }) => {
        h.onCached(range(61, 90));
        h.onError(new Error("offline"), true);
        return Promise.resolve();
      },
    );
    const onError = vi.fn();
    const run1 = run({ onError });
    await waitFor(() => {
      expect(run1.state.hasReachedLatest).toBe(true);
    });
    expect(onError).not.toHaveBeenCalled();
    expect(run1.state.fetchState).toBe("loaded");
    expect(run1.state.connectToLoad).not.toBe(true);
    expect(run1.state.messages.map(serverIdOf)).toEqual(
      range(61, 90).map(serverIdOf),
    );
    expect(run1.state.offlineFooter).toBe("connect_to_load_more");
  });
  it("D84 rule 5: a plain open with cached rows and a real server error keeps the rows and reports onError once", async () => {
    previous.mockImplementation(
      (h: {
        onCached: (p: unknown[]) => void;
        onError: (e: unknown, notConnected: boolean) => void;
      }) => {
        h.onCached(range(61, 90));
        h.onError(new Error("boom"), false);
        return Promise.resolve();
      },
    );
    const onError = vi.fn();
    const run1 = run({ onError });
    await waitFor(() => {
      expect(run1.state.hasReachedLatest).toBe(true);
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(run1.state.fetchState).toBe("loaded");
    expect(run1.state.messages.map(serverIdOf)).toEqual(
      range(61, 90).map(serverIdOf),
    );
  });

  it("D84 rule 4: a plain open that fails with a server error is the error view (not \"Connect to load\") and one onError", async () => {
    previous.mockImplementation(
      (h: { onError: (e: unknown, notConnected: boolean) => void }) => {
        h.onError(new Error("boom"), false);
        return Promise.resolve();
      },
    );
    const onError = vi.fn();
    const run1 = run({ onError });
    await waitFor(() => {
      expect(run1.state.fetchState).toBe("error");
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(run1.state.connectToLoad).not.toBe(true);
  });
});
