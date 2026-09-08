import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  resolvePinSaveFeatures,
  getPinSaveFeatures,
  resetPinSaveFeatures,
} from '../pinSaveFeatures';

describe('pinSaveFeatures', () => {
  beforeEach(() => {
    resetPinSaveFeatures();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetPinSaveFeatures();
  });

  it('resolves both flags from the SDK', async () => {
    vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(false);
    vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(false);

    await expect(resolvePinSaveFeatures()).resolves.toEqual({
      pinMessage: true,
      saveMessage: false,
      pinConversation: false,
    });
  });

  it('reports everything-off before resolution completes', () => {
    expect(getPinSaveFeatures()).toEqual({
      pinMessage: false,
      saveMessage: false,
      pinConversation: false,
    });
  });

  it('caches — a second call does not hit the SDK again', async () => {
    const pin = vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(true);

    await resolvePinSaveFeatures();
    await resolvePinSaveFeatures();

    expect(pin).toHaveBeenCalledTimes(1);
  });

  it('de-duplicates concurrent callers into one SDK call', async () => {
    const pin = vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(true);

    await Promise.all([
      resolvePinSaveFeatures(),
      resolvePinSaveFeatures(),
      resolvePinSaveFeatures(),
    ]);

    expect(pin).toHaveBeenCalledTimes(1);
  });

  it('degrades to disabled when the SDK rejects', async () => {
    vi.spyOn(CometChat, 'isPinMessageEnabled').mockRejectedValue(new Error('offline'));
    vi.spyOn(CometChat, 'isSaveMessageEnabled').mockRejectedValue(new Error('offline'));
    vi.spyOn(CometChat, 'isPinConversationEnabled').mockRejectedValue(new Error('offline'));

    await expect(resolvePinSaveFeatures()).resolves.toEqual({
      pinMessage: false,
      saveMessage: false,
      pinConversation: false,
    });
  });

  it('degrades to disabled when the SDK build lacks the methods', async () => {
    const sdk = CometChat as unknown as Record<string, unknown>;
    const originalPin = sdk.isPinMessageEnabled;
    const originalSave = sdk.isSaveMessageEnabled;
    const originalPinConv = sdk.isPinConversationEnabled;
    delete sdk.isPinMessageEnabled;
    delete sdk.isSaveMessageEnabled;
    delete sdk.isPinConversationEnabled;

    try {
      await expect(resolvePinSaveFeatures()).resolves.toEqual({
        pinMessage: false,
        saveMessage: false,
        pinConversation: false,
      });
    } finally {
      sdk.isPinMessageEnabled = originalPin;
      sdk.isSaveMessageEnabled = originalSave;
      sdk.isPinConversationEnabled = originalPinConv;
    }
  });

  it('caches the resolved value for synchronous reads', async () => {
    vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(true);

    await resolvePinSaveFeatures();

    expect(getPinSaveFeatures()).toEqual({
      pinMessage: true,
      saveMessage: true,
      pinConversation: true,
    });
  });

  it('reset clears the cache so a re-login re-resolves', async () => {
    vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(true);
    await resolvePinSaveFeatures();

    resetPinSaveFeatures();

    expect(getPinSaveFeatures()).toEqual({
      pinMessage: false,
      saveMessage: false,
      pinConversation: false,
    });
  });

  // Guards the reset-during-resolve race: an earlier resolution is still in flight
  // (e.g. a prior login's warm-up, or a logout→login) when a reset + re-resolve
  // happens with the flags now readable as true. The stale in-flight resolution can
  // settle *after* the reset — and must not clobber the newer post-reset value.
  it('a stale pre-reset resolution does not clobber the post-reset value (login race)', async () => {
    // Pre-login warm-up: flags read false, but held pending so it lands late.
    let releaseStale = (): void => {};
    const stalePending = new Promise<void>(resolve => {
      releaseStale = resolve;
    });
    vi.spyOn(CometChat, 'isPinMessageEnabled').mockReturnValue(stalePending.then(() => false));
    vi.spyOn(CometChat, 'isSaveMessageEnabled').mockReturnValue(stalePending.then(() => false));
    vi.spyOn(CometChat, 'isPinConversationEnabled').mockReturnValue(stalePending.then(() => false));

    const stale = resolvePinSaveFeatures(); // in flight, not settled

    // Login: reset, then re-resolve with the flags now readable as enabled.
    resetPinSaveFeatures();
    vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(true);
    vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(true);
    await resolvePinSaveFeatures();

    expect(getPinSaveFeatures()).toEqual({
      pinMessage: true,
      saveMessage: true,
      pinConversation: true,
    });

    // Let the stale warm-up finally settle — the cache must stay on the fresh value.
    releaseStale();
    await stale;

    expect(getPinSaveFeatures()).toEqual({
      pinMessage: true,
      saveMessage: true,
      pinConversation: true,
    });
  });
});
