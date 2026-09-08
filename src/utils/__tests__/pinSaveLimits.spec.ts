import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { resolvePinSaveLimits, getPinSaveLimits, resetPinSaveLimits } from '../pinSaveLimits';

describe('pinSaveLimits', () => {
  beforeEach(() => {
    resetPinSaveLimits();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetPinSaveLimits();
  });

  it('resolves the three caps from the SDK', async () => {
    vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockResolvedValue(250);
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockResolvedValue(100);
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockResolvedValue(5);

    await expect(resolvePinSaveLimits()).resolves.toEqual({
      pinnedMessages: 250,
      savedMessages: 100,
      pinnedConversations: 5,
    });
  });

  it('reports everything-unknown before resolution completes', () => {
    expect(getPinSaveLimits()).toEqual({
      pinnedMessages: null,
      savedMessages: null,
      pinnedConversations: null,
    });
  });

  it('treats a non-positive or non-finite cap as unknown', async () => {
    vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockResolvedValue(0);
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockResolvedValue(-1);
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockResolvedValue(NaN);

    await expect(resolvePinSaveLimits()).resolves.toEqual({
      pinnedMessages: null,
      savedMessages: null,
      pinnedConversations: null,
    });
  });

  it('caches — a second call does not hit the SDK again', async () => {
    const pinned = vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockResolvedValue(250);
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockResolvedValue(100);
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockResolvedValue(5);

    await resolvePinSaveLimits();
    await resolvePinSaveLimits();

    expect(pinned).toHaveBeenCalledTimes(1);
  });

  it('de-duplicates concurrent callers into one SDK call', async () => {
    const pinned = vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockResolvedValue(250);
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockResolvedValue(100);
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockResolvedValue(5);

    await Promise.all([resolvePinSaveLimits(), resolvePinSaveLimits(), resolvePinSaveLimits()]);

    expect(pinned).toHaveBeenCalledTimes(1);
  });

  it('degrades to unknown when the SDK rejects', async () => {
    vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockRejectedValue(new Error('offline'));
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockRejectedValue(new Error('offline'));
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockRejectedValue(new Error('offline'));

    await expect(resolvePinSaveLimits()).resolves.toEqual({
      pinnedMessages: null,
      savedMessages: null,
      pinnedConversations: null,
    });
  });

  it('degrades to unknown when the SDK build lacks the methods', async () => {
    const sdk = CometChat as unknown as Record<string, unknown>;
    const originalPinned = sdk.getPinnedMessagesLimit;
    const originalSaved = sdk.getSavedMessagesLimit;
    const originalPinnedConv = sdk.getPinnedConversationsLimit;
    delete sdk.getPinnedMessagesLimit;
    delete sdk.getSavedMessagesLimit;
    delete sdk.getPinnedConversationsLimit;

    try {
      await expect(resolvePinSaveLimits()).resolves.toEqual({
        pinnedMessages: null,
        savedMessages: null,
        pinnedConversations: null,
      });
    } finally {
      sdk.getPinnedMessagesLimit = originalPinned;
      sdk.getSavedMessagesLimit = originalSaved;
      sdk.getPinnedConversationsLimit = originalPinnedConv;
    }
  });

  it('caches the resolved value for synchronous reads', async () => {
    vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockResolvedValue(250);
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockResolvedValue(100);
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockResolvedValue(5);

    await resolvePinSaveLimits();

    expect(getPinSaveLimits()).toEqual({
      pinnedMessages: 250,
      savedMessages: 100,
      pinnedConversations: 5,
    });
  });

  it('reset clears the cache so a re-login re-resolves', async () => {
    vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockResolvedValue(250);
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockResolvedValue(100);
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockResolvedValue(5);
    await resolvePinSaveLimits();

    resetPinSaveLimits();

    expect(getPinSaveLimits()).toEqual({
      pinnedMessages: null,
      savedMessages: null,
      pinnedConversations: null,
    });
  });

  // Mirrors the pinSaveFeatures guard: an older resolution still in flight when a
  // reset + re-resolve happens (e.g. logout→login) must not clobber the newer value.
  it('a stale pre-reset resolution does not clobber the post-reset value (login race)', async () => {
    let releaseStale = (): void => {};
    const stalePending = new Promise<void>(resolve => {
      releaseStale = resolve;
    });
    vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockReturnValue(stalePending.then(() => null));
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockReturnValue(stalePending.then(() => null));
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockReturnValue(
      stalePending.then(() => null)
    );

    const stale = resolvePinSaveLimits(); // in flight, not settled

    resetPinSaveLimits();
    vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockResolvedValue(250);
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockResolvedValue(100);
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockResolvedValue(5);
    await resolvePinSaveLimits();

    expect(getPinSaveLimits()).toEqual({
      pinnedMessages: 250,
      savedMessages: 100,
      pinnedConversations: 5,
    });

    releaseStale();
    await stale;

    expect(getPinSaveLimits()).toEqual({
      pinnedMessages: 250,
      savedMessages: 100,
      pinnedConversations: 5,
    });
  });
});
