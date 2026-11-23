/** The manager's two-phase message-details read (offline ON). */
import { afterEach, describe, expect, it, vi } from "vitest";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatMessageListManager } from "../CometChatMessageListManager";

const sdk = CometChat as unknown as { getMessageDetails: unknown };
const original = Object.getOwnPropertyDescriptor(
  CometChat,
  "getMessageDetails",
);
const make = () =>
  new CometChatMessageListManager({
    user: new CometChat.User({ uid: "p", name: "p" }),
  } as never);
const msg = { id: 40 };

function stub(
  impl: (
    id: string,
    l: Record<string, (x?: unknown) => void>,
  ) => Promise<unknown>,
) {
  Object.defineProperty(sdk, "getMessageDetails", {
    value: vi.fn(impl),
    configurable: true,
    writable: true,
  });
}

describe("getMessageDetailsTwoPhase", () => {
  afterEach(() => {
    if (original)
      Object.defineProperty(CometChat, "getMessageDetails", original);
  });

  it("resolves with the cached copy first", async () => {
    stub((_id, l) => {
      l.onCachedMessage?.(msg);
      return new Promise(() => undefined);
    });
    await expect(make().getMessageDetailsTwoPhase(40)).resolves.toBe(msg);
  });

  it("resolves with the server copy when nothing is cached", async () => {
    stub((_id, l) => {
      l.onServerMessage?.(msg);
      return Promise.resolve(msg);
    });
    await expect(make().getMessageDetailsTwoPhase(40)).resolves.toBe(msg);
  });

  it("resolves null, never rejects, when not cached and not reachable", async () => {
    stub((_id, l) => {
      l.onError?.(new Error("offline"));
      return Promise.reject(new Error("offline"));
    });
    await expect(make().getMessageDetailsTwoPhase(40)).resolves.toBeNull();
  });

  it("resolves null when the SDK throws synchronously", async () => {
    Object.defineProperty(sdk, "getMessageDetails", {
      value: () => {
        throw new Error("x");
      },
      configurable: true,
      writable: true,
    });
    await expect(make().getMessageDetailsTwoPhase(40)).resolves.toBeNull();
  });

  it("onFail hears the error once when it answers null", async () => {
    const error = Object.assign(new Error("not connected"), {
      code: "FAILED_TO_FETCH",
    });
    stub((_id, l) => {
      l.onError?.(error);
      return Promise.reject(error);
    });
    const onFail = vi.fn();
    await expect(make().getMessageDetailsTwoPhase(40, onFail)).resolves.toBeNull();
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(onFail).toHaveBeenCalledWith(error);
  });

  it("onFail is not called when a copy was found", async () => {
    stub((_id, l) => {
      l.onCachedMessage?.(msg);
      return Promise.reject(new Error("offline"));
    });
    const onFail = vi.fn();
    await expect(make().getMessageDetailsTwoPhase(40, onFail)).resolves.toBe(msg);
    expect(onFail).not.toHaveBeenCalled();
  });
});
