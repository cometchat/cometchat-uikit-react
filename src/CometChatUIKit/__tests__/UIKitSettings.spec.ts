import { describe, it, expect, vi } from 'vitest';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    StorageMode: { LOCAL: 'localStorage', NONE: 'none' },
  },
}));

import { UIKitSettings, UIKitSettingsBuilder } from '../UIKitSettings';
import { CometChat } from '@cometchat/chat-sdk-javascript';

describe('UIKitSettingsBuilder', () => {
  it('should build UIKitSettings with default values', () => {
    const settings = new UIKitSettingsBuilder().build();
    expect(settings.getAppId()).toBe('');
    expect(settings.getRegion()).toBe('');
    expect(settings.getSubscriptionType()).toBe('ALL_USERS');
    expect(settings.getRoles()).toEqual([]);
    expect(settings.isAutoEstablishSocketConnection()).toBe(true);
    expect(settings.getAuthKey()).toBeUndefined();
    expect(settings.getAdminHost()).toBeUndefined();
    expect(settings.getClientHost()).toBeUndefined();
    expect(settings.getStorageMode()).toBe(CometChat.StorageMode.LOCAL);
    expect(settings.isCallingEnabled()).toBe(false);
    expect(settings.getCallAppSettings()).toBeUndefined();
  });

  it('should set appId and region', () => {
    const settings = new UIKitSettingsBuilder().setAppId('test-app-id').setRegion('us').build();
    expect(settings.getAppId()).toBe('test-app-id');
    expect(settings.getRegion()).toBe('us');
  });

  it('should set authKey', () => {
    const settings = new UIKitSettingsBuilder().setAuthKey('my-auth-key').build();
    expect(settings.getAuthKey()).toBe('my-auth-key');
  });

  it('should set subscribePresenceForAllUsers', () => {
    const settings = new UIKitSettingsBuilder().subscribePresenceForAllUsers().build();
    expect(settings.getSubscriptionType()).toBe('ALL_USERS');
  });

  it('should set subscribePresenceForFriends', () => {
    const settings = new UIKitSettingsBuilder().subscribePresenceForFriends().build();
    expect(settings.getSubscriptionType()).toBe('FRIENDS');
  });

  it('should set subscribePresenceForRoles with roles', () => {
    const settings = new UIKitSettingsBuilder()
      .subscribePresenceForRoles(['admin', 'moderator'])
      .build();
    expect(settings.getSubscriptionType()).toBe('ROLES');
    expect(settings.getRoles()).toEqual(['admin', 'moderator']);
  });

  it('should set roles directly', () => {
    const settings = new UIKitSettingsBuilder().setRoles(['user', 'editor']).build();
    expect(settings.getRoles()).toEqual(['user', 'editor']);
  });

  it('should set autoEstablishSocketConnection to false', () => {
    const settings = new UIKitSettingsBuilder().setAutoEstablishSocketConnection(false).build();
    expect(settings.isAutoEstablishSocketConnection()).toBe(false);
  });

  it('should set adminHost and clientHost', () => {
    const settings = new UIKitSettingsBuilder()
      .setAdminHost('https://admin.example.com')
      .setClientHost('https://client.example.com')
      .build();
    expect(settings.getAdminHost()).toBe('https://admin.example.com');
    expect(settings.getClientHost()).toBe('https://client.example.com');
  });

  it('should set storageMode', () => {
    const settings = new UIKitSettingsBuilder().setStorageMode(CometChat.StorageMode.NONE).build();
    expect(settings.getStorageMode()).toBe('none');
  });

  it('should set callingEnabled', () => {
    const settings = new UIKitSettingsBuilder().setCallingEnabled(true).build();
    expect(settings.isCallingEnabled()).toBe(true);
  });

  it('should set callAppSettings', () => {
    const callSettings = { appId: 'call-app-id', region: 'eu' };
    const settings = new UIKitSettingsBuilder().setCallAppSettings(callSettings).build();
    expect(settings.getCallAppSettings()).toEqual(callSettings);
  });

  it('should support fluent chaining', () => {
    const settings = new UIKitSettingsBuilder()
      .setAppId('app1')
      .setRegion('eu')
      .setAuthKey('key1')
      .setAutoEstablishSocketConnection(true)
      .setCallingEnabled(true)
      .subscribePresenceForAllUsers()
      .build();

    expect(settings.getAppId()).toBe('app1');
    expect(settings.getRegion()).toBe('eu');
    expect(settings.getAuthKey()).toBe('key1');
    expect(settings.isAutoEstablishSocketConnection()).toBe(true);
    expect(settings.isCallingEnabled()).toBe(true);
    expect(settings.getSubscriptionType()).toBe('ALL_USERS');
  });
});

describe('UIKitSettings.fromBuilder', () => {
  it('should create settings from a builder', () => {
    const builder = new UIKitSettingsBuilder();
    builder.appId = 'from-builder';
    builder.region = 'us';
    const settings = UIKitSettings.fromBuilder(builder);
    expect(settings.getAppId()).toBe('from-builder');
    expect(settings.getRegion()).toBe('us');
  });
});
