/**
 * The kit's SDK floor for offline support: Chat SDK 4.3.1 or later.
 *
 * Published 4.3.0 already has `isOfflineEnabled` and every other offline static
 * and listener class, so feature detection alone turned offline fully on with
 * it — without the 4.3.1 fixes the kit relies on (cross-session cache writes, a
 * catch-up page wiping the cached conversations, sends stuck PENDING after a
 * short drop, `getName()` throwing on a nameless cached user), and without
 * `ConversationsRequest.getPinnedBy()`, which leaves the conversations
 * reconcile half-on. The floor also probes
 * `CometChat.OfflineCacheResetReason.SCHEMA_RESET`, which first ships in 4.3.1.
 *
 * Review: Aanshi B1 on #2460; Angular does the same (1755d3a8 / 2f9f270f).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { hasOfflineSdk, isOfflineOn } from '../gate';
import { OfflineHub } from '../hub';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { UIKitSettingsBuilder } from '../../../CometChatUIKit/UIKitSettings';

/** Published 4.3.0's enum: every reset reason except the 4.3.1 one. */
const RESET_REASONS_430 = Object.freeze({
  KEY_LOST: 'KEY_LOST',
  WRONG_KEY: 'WRONG_KEY',
  CORRUPTED: 'CORRUPTED',
  ESCALATED: 'ESCALATED',
  ENCRYPTION_CHANGED: 'ENCRYPTION_CHANGED',
});

/** Reshape the installed fake as published 4.3.0: drop SCHEMA_RESET only. */
function shapeAs430(): void {
  Object.defineProperty(CometChat, 'OfflineCacheResetReason', {
    value: { ...RESET_REASONS_430 },
    configurable: true,
    writable: true,
  });
}

describe('offline SDK floor: 4.3.1', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  it('is on with a 4.3.1-shaped SDK', () => {
    expect(hasOfflineSdk()).toBe(true);
    expect(isOfflineOn()).toBe(true);
  });

  it('stays off on a 4.3.0-shaped SDK, whose isOfflineEnabled answers true', () => {
    shapeAs430();
    expect(
      (CometChat as unknown as { isOfflineEnabled: () => boolean }).isOfflineEnabled()
    ).toBe(true);
    expect(hasOfflineSdk()).toBe(false);
    expect(isOfflineOn()).toBe(false);
  });

  it('stays off when the SDK has no OfflineCacheResetReason at all (4.2.x)', () => {
    Reflect.deleteProperty(CometChat as unknown as Record<string, unknown>, 'OfflineCacheResetReason');
    expect(hasOfflineSdk()).toBe(false);
    expect(isOfflineOn()).toBe(false);
  });

  it('stays off when the enum exists but SCHEMA_RESET is not the expected value', () => {
    Object.defineProperty(CometChat, 'OfflineCacheResetReason', {
      value: { ...RESET_REASONS_430, SCHEMA_RESET: undefined },
      configurable: true,
      writable: true,
    });
    expect(hasOfflineSdk()).toBe(false);
    expect(isOfflineOn()).toBe(false);
  });

  describe('the hub registers nothing below the floor', () => {
    it('registers no SDK listener on a 4.3.0-shaped SDK', () => {
      shapeAs430();
      OfflineHub.getInstance().start();
      expect(fake.callsTo('addOfflineMessageListener')).toEqual([]);
      expect(fake.callsTo('addSyncListener')).toEqual([]);
      expect(fake.callsTo('addOfflineCacheResetListener')).toEqual([]);
    });

    it('registers its listeners on a 4.3.1-shaped SDK', () => {
      OfflineHub.getInstance().start();
      expect(fake.callsTo('addOfflineMessageListener')).toHaveLength(1);
      expect(fake.callsTo('addSyncListener')).toHaveLength(1);
      expect(fake.callsTo('addOfflineCacheResetListener')).toHaveLength(1);
    });
  });

  describe('the SDK is not told to run offline below the floor', () => {
    /** Records every setOfflineConfig the kit makes on the SDK's AppSettingsBuilder. */
    function recordingBuilder(): { received: unknown[]; restore: () => void } {
      const sdk = CometChat as unknown as Record<string, unknown>;
      const saved = Object.getOwnPropertyDescriptor(sdk, 'AppSettingsBuilder');
      const received: unknown[] = [];
      // 4.3.0 and 4.3.1 both have setOfflineConfig, so the stub always offers it:
      // the floor, not the member's presence, must decide.
      function RecordingAppSettingsBuilder(): unknown {
        const builder: unknown = new Proxy(
          {},
          {
            get(_target, prop) {
              if (prop === 'build') return () => ({});
              if (prop === 'setOfflineConfig') {
                return (config: unknown) => {
                  received.push(config);
                  return builder;
                };
              }
              return () => builder;
            },
          }
        );
        return builder;
      }
      Object.defineProperty(sdk, 'AppSettingsBuilder', {
        value: RecordingAppSettingsBuilder,
        configurable: true,
        writable: true,
      });
      return {
        received,
        restore: () => {
          if (saved) Object.defineProperty(sdk, 'AppSettingsBuilder', saved);
          else Reflect.deleteProperty(sdk, 'AppSettingsBuilder');
        },
      };
    }

    const settings = () =>
      new UIKitSettingsBuilder()
        .setAppId('app')
        .setRegion('us')
        .setAuthKey('key')
        .setOfflineConfig({ enabled: true })
        .build();

    it('init passes the offline config to the SDK only at the floor', async () => {
      const recorder = recordingBuilder();
      vi.spyOn(CometChat, 'init').mockResolvedValue(true);
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null as never);
      try {
        await CometChatUIKit.init(settings());
        expect(recorder.received).toEqual([{ enabled: true }]);

        // A 4.3.0-shaped SDK: the config never reaches it, so the SDK runs online
        // only, as the kit's screens do.
        recorder.received.length = 0;
        shapeAs430();
        await CometChatUIKit.init(settings());
        expect(recorder.received).toEqual([]);
      } finally {
        recorder.restore();
      }
    });

    it('initFromSettings drops chatSDK.offline below the floor, without changing the caller object', async () => {
      shapeAs430();
      const fileSettings = {
        appId: 'app',
        region: 'us',
        credentials: { authKey: 'key' },
        chatSDK: { autoEstablishSocketConnection: true, offline: true },
      } as unknown as Parameters<typeof CometChatUIKit.initFromSettings>[0];
      const spy = vi.spyOn(CometChat, 'initFromSettings').mockResolvedValue(true);
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null as never);

      await CometChatUIKit.initFromSettings(fileSettings, { enabled: true });

      const passed = spy.mock.calls[0]?.[0] as { chatSDK: Record<string, unknown> };
      expect('offline' in passed.chatSDK).toBe(false);
      expect(passed.chatSDK.autoEstablishSocketConnection).toBe(true);
      // The caller's own object is untouched.
      expect((fileSettings as unknown as { chatSDK: { offline: unknown } }).chatSDK.offline).toBe(
        true
      );
    });

    it('initFromSettings passes chatSDK.offline through at the floor', async () => {
      const fileSettings = {
        appId: 'app',
        region: 'us',
        credentials: { authKey: 'key' },
        chatSDK: { autoEstablishSocketConnection: true },
      } as unknown as Parameters<typeof CometChatUIKit.initFromSettings>[0];
      const spy = vi.spyOn(CometChat, 'initFromSettings').mockResolvedValue(true);
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null as never);

      await CometChatUIKit.initFromSettings(fileSettings, { enabled: true });

      const passed = spy.mock.calls[0]?.[0] as { chatSDK: Record<string, unknown> };
      expect(passed.chatSDK.offline).toEqual({ enabled: true });
    });
  });
});
