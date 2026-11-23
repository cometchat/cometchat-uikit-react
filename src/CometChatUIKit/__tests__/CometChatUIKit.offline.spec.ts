/**
 * Offline support at init: the settings pass-through, and the hub started from
 * init() and initFromSettings() once the SDK's own init has resolved.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../CometChatUIKit';
import { UIKitSettingsBuilder } from '../UIKitSettings';
import { OfflineHub } from '../../utils/offline/hub';
import { installOfflineSdk, type OfflineSdkFake } from '../../testing/offline-sdk-fake';

describe('CometChatUIKit offline init', () => {
  let fake: OfflineSdkFake | null = null;
  let resolveInit: () => void = () => undefined;
  const builderProto = CometChat.AppSettingsBuilder.prototype as unknown as Record<string, unknown>;
  const savedSetOfflineConfig = Object.getOwnPropertyDescriptor(builderProto, 'setOfflineConfig');

  beforeEach(() => {
    OfflineHub.resetForTests();
    vi.spyOn(CometChat, 'init').mockImplementation(
      () =>
        new Promise<boolean>(resolve => {
          resolveInit = () => {
            resolve(true);
          };
        })
    );
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake?.restore();
    fake = null;
    if (savedSetOfflineConfig) {
      Object.defineProperty(builderProto, 'setOfflineConfig', savedSetOfflineConfig);
    } else {
      Reflect.deleteProperty(builderProto, 'setOfflineConfig');
    }
    OfflineHub.resetForTests();
  });

  it('passes the offline config to the SDK builder and starts the hub after SDK init', async () => {
    fake = installOfflineSdk({ enabled: false });
    const setOfflineConfig = vi.fn(function (this: unknown) {
      return this;
    });
    Object.defineProperty(CometChat.AppSettingsBuilder.prototype, 'setOfflineConfig', {
      value: setOfflineConfig,
      configurable: true,
      writable: true,
    });
    const settings = new UIKitSettingsBuilder()
      .setAppId('app')
      .setRegion('us')
      .setOfflineConfig({ enabled: true, maxPendingMessages: 20 })
      .build();
    expect(settings.getOfflineConfig()).toEqual({ enabled: true, maxPendingMessages: 20 });

    const done = CometChatUIKit.init(settings);
    await Promise.resolve();
    expect(setOfflineConfig).toHaveBeenCalledWith({ enabled: true, maxPendingMessages: 20 });
    // Not before the SDK's own init has resolved.
    expect(fake.callsTo('addOfflineMessageListener')).toHaveLength(0);
    resolveInit();
    await done;
    // Registered even though offline is off right now (inert until it is on).
    expect(fake.callsTo('addOfflineMessageListener')).toHaveLength(1);
    expect(OfflineHub.getInstance().isStarted).toBe(true);
  });

  it('on an SDK without offline support: no setOfflineConfig, nothing registered, init succeeds', async () => {
    fake = installOfflineSdk({ absent: true });
    Reflect.deleteProperty(builderProto, 'setOfflineConfig');
    const add = vi.spyOn(CometChat, 'addMessageListener');
    const settings = new UIKitSettingsBuilder()
      .setAppId('app')
      .setRegion('us')
      .setOfflineConfig({ enabled: true })
      .build();
    const done = CometChatUIKit.init(settings);
    resolveInit();
    await expect(done).resolves.toBeNull();
    expect(add).not.toHaveBeenCalled();
  });

  it('initFromSettings starts the hub after the SDK resolves', async () => {
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'initFromSettings').mockResolvedValue(true as never);
    await CometChatUIKit.initFromSettings({
      appId: 'app',
      region: 'us',
      chatSDK: { offline: { enabled: true } },
    } as unknown as CometChat.CometChatSettings);
    expect(fake.callsTo('addOfflineMessageListener')).toHaveLength(1);
  });

  it('initFromSettings hands a code-level offlineConfig to the SDK as chatSDK.offline', async () => {
    // The fake carries the kit's SDK floor probe, so the test does not depend on
    // the SDK version that happens to be installed (it fails on 4.3.0 without it).
    fake = installOfflineSdk({ enabled: false });
    const spy = vi.spyOn(CometChat, 'initFromSettings').mockResolvedValue(true as never);
    const fileSettings = {
      appId: 'app',
      region: 'us',
      chatSDK: { autoEstablishSocketConnection: true, offline: { enabled: false } },
    } as unknown as CometChat.CometChatSettings;
    await CometChatUIKit.initFromSettings(fileSettings, { enabled: true, maxConversations: 7 });
    const passed = spy.mock.calls[0]?.[0] as unknown as { chatSDK: Record<string, unknown> };
    expect(passed.chatSDK.offline).toEqual({ enabled: true, maxConversations: 7 });
    expect(passed.chatSDK.autoEstablishSocketConnection).toBe(true);
    // The caller's object is not changed.
    expect((fileSettings.chatSDK as { offline: unknown }).offline).toEqual({ enabled: false });
    expect(CometChatUIKit.getSettings()?.getOfflineConfig()).toEqual({ enabled: true, maxConversations: 7 });
  });

  it('initFromSettings without offlineConfig passes the file offline block unchanged', async () => {
    fake = installOfflineSdk({ enabled: false });
    const spy = vi.spyOn(CometChat, 'initFromSettings').mockResolvedValue(true as never);
    const fileSettings = {
      appId: 'app',
      region: 'us',
      chatSDK: { offline: true },
    } as unknown as CometChat.CometChatSettings;
    await CometChatUIKit.initFromSettings(fileSettings);
    expect(spy.mock.calls[0]?.[0]).toBe(fileSettings);
    expect(CometChatUIKit.getSettings()?.getOfflineConfig()).toEqual({ enabled: true });
  });

  it('settings without an offline config leave the SDK builder untouched', () => {
    const settings = new UIKitSettingsBuilder().setAppId('app').setRegion('us').build();
    expect(settings.getOfflineConfig()).toBeUndefined();
  });
});
