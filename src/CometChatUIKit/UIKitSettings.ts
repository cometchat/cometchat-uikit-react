import { CometChat } from '@cometchat/chat-sdk-javascript';

// ---------------------------------------------------------------------------
// UIKitSettings
// ---------------------------------------------------------------------------

export type CometChatPresenceSubscription = 'ALL_USERS' | 'FRIENDS' | 'ROLES';

/**
 * Represents the settings required to initialize the CometChat UIKit.
 * This class holds various configuration options, such as app credentials,
 * socket connection settings, and feature toggles.
 *
 * @class UIKitSettings
 */
export class UIKitSettings {
  /**
   * Unique ID for the app, available on the CometChat dashboard.
   * @type {string}
   */
  readonly appId: string;

  /**
   * Region for the app, such as "us" or "eu".
   * @type {string}
   */
  readonly region: string;

  /**
   * Sets the subscription type for presence.
   * @type {CometChatPresenceSubscription}
   */
  readonly subscriptionType: CometChatPresenceSubscription;

  /**
   * Subscribes to user presence for users having the specified roles.
   * @type {string[]}
   */
  readonly roles: string[];

  /**
   * Configures WebSocket connections. When set to true, establishes connection
   * automatically on app initialization.
   * @type {boolean}
   * @default true
   */
  readonly autoEstablishSocketConnection: boolean;

  /**
   * Authentication key for the app, available on the CometChat dashboard.
   * @type {string}
   */
  readonly authKey?: string;

  /**
   * Custom admin URL, used instead of the default admin URL for dedicated deployments.
   * @type {string}
   */
  readonly adminHost?: string;

  /**
   * Custom client URL, used instead of the default client URL for dedicated deployments.
   * @type {string}
   */
  readonly clientHost?: string;

  /**
   * Storage mode for persisting data.
   * @type {CometChat.StorageMode}
   */
  readonly storageMode: CometChat.StorageMode;

  /**
   * Whether calling functionality is enabled.
   * When true, the Calls SDK is initialized after login.
   * When false (default), call buttons are hidden across all components.
   * @type {boolean}
   * @default false
   */
  readonly callingEnabled: boolean;

  /**
   * Custom CallAppSettings to use when initializing the Calls SDK.
   * If not provided, the UIKit builds default settings from appId and region.
   * Pass a plain object: `{ appId: 'APP_ID', region: 'us' }`.
   * @type {any}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly callAppSettings?: any;

  /**
   * Private constructor to initialize the settings using the provided builder.
   * @param {UIKitSettingsBuilder} builder - The builder instance containing the settings configuration.
   */
  private constructor(builder: UIKitSettingsBuilder) {
    this.appId = builder.appId ?? '';
    this.region = builder.region ?? '';
    this.subscriptionType = builder.subscriptionType ?? 'ALL_USERS';
    this.roles = builder.roles ?? [];
    this.autoEstablishSocketConnection = builder.autoEstablishSocketConnection ?? true;
    this.authKey = builder.authKey;
    this.adminHost = builder.adminHost;
    this.clientHost = builder.clientHost;
    this.storageMode = builder.storageMode ?? CometChat.StorageMode.LOCAL;
    this.callingEnabled = builder.callingEnabled ?? false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.callAppSettings = builder.callAppSettings;
  }

  /**
   * Creates an instance of UIKitSettings from the provided builder.
   * @param {UIKitSettingsBuilder} builder - The builder instance containing the settings configuration.
   * @returns {UIKitSettings} A new instance of UIKitSettings.
   */
  static fromBuilder(builder: UIKitSettingsBuilder): UIKitSettings {
    return new UIKitSettings(builder);
  }

  /**
   * Retrieves the app ID.
   * @returns {string} The unique ID of the app.
   */
  getAppId(): string {
    return this.appId;
  }

  /**
   * Retrieves the region.
   * @returns {string} The region of the app.
   */
  getRegion(): string {
    return this.region;
  }

  /**
   * Retrieves the subscription type for presence.
   * @returns {CometChatPresenceSubscription} The subscription type.
   */
  getSubscriptionType(): CometChatPresenceSubscription {
    return this.subscriptionType;
  }

  /**
   * Retrieves the roles for presence subscription.
   * @returns {string[]} The list of roles subscribed to presence.
   */
  getRoles(): string[] {
    return this.roles;
  }

  /**
   * Checks if auto-establish socket connection is enabled.
   * @returns {boolean} True if auto-establish is enabled, otherwise false.
   */
  isAutoEstablishSocketConnection(): boolean {
    return this.autoEstablishSocketConnection;
  }

  /**
   * Retrieves the authentication key.
   * @returns {string | undefined} The authentication key.
   */
  getAuthKey(): string | undefined {
    return this.authKey;
  }

  /**
   * Retrieves the custom admin host URL.
   * @returns {string | undefined} The admin host URL.
   */
  getAdminHost(): string | undefined {
    return this.adminHost;
  }

  /**
   * Retrieves the custom client host URL.
   * @returns {string | undefined} The client host URL.
   */
  getClientHost(): string | undefined {
    return this.clientHost;
  }

  /**
   * Retrieves the storage mode.
   * @returns {CometChat.StorageMode} The storage mode.
   */
  getStorageMode(): CometChat.StorageMode {
    return this.storageMode;
  }

  /**
   * Checks if calling functionality is enabled.
   * @returns {boolean} True if calling is enabled, otherwise false.
   */
  isCallingEnabled(): boolean {
    return this.callingEnabled;
  }

  /**
   * Retrieves the custom CallAppSettings for Calls SDK initialization.
   * @returns {any | undefined} The custom CallAppSettings, or undefined if not set.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCallAppSettings(): any {
    return this.callAppSettings;
  }
}

// ---------------------------------------------------------------------------
// UIKitSettingsBuilder
// ---------------------------------------------------------------------------

/**
 * Builder class for constructing UIKitSettings instances.
 * Provides a fluent API for configuring the UIKit initialization settings.
 *
 * @class UIKitSettingsBuilder
 */
export class UIKitSettingsBuilder {
  /**
   * Unique ID for the app, available on the CometChat dashboard.
   * @type {string}
   */
  appId?: string;

  /**
   * Region for the app, such as "us" or "eu".
   * @type {string}
   */
  region?: string;

  /**
   * Sets the subscription type for presence.
   * @type {CometChatPresenceSubscription}
   */
  subscriptionType?: CometChatPresenceSubscription;

  /**
   * Subscribes to user presence for users having the specified roles.
   * @type {string[]}
   */
  roles?: string[];

  /**
   * Configures WebSocket connections.
   * @type {boolean}
   */
  autoEstablishSocketConnection?: boolean;

  /**
   * Authentication key for the app, available on the CometChat dashboard.
   * @type {string}
   */
  authKey?: string;

  /**
   * Custom admin URL, used instead of the default admin URL for dedicated deployments.
   * @type {string}
   */
  adminHost?: string;

  /**
   * Custom client URL, used instead of the default client URL for dedicated deployments.
   * @type {string}
   */
  clientHost?: string;

  /**
   * Storage mode for persisting data.
   * @type {CometChat.StorageMode}
   */
  storageMode?: CometChat.StorageMode;

  /**
   * Whether calling functionality is enabled.
   * @type {boolean}
   * @default false
   */
  callingEnabled?: boolean;

  /**
   * Custom CallAppSettings for Calls SDK initialization.
   * @type {any}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callAppSettings?: any;

  /**
   * Builds and returns an instance of UIKitSettings.
   * @returns {UIKitSettings} A new instance of UIKitSettings with the specified configuration.
   */
  build(): UIKitSettings {
    return UIKitSettings.fromBuilder(this);
  }

  /**
   * Sets the app ID.
   * @param {string} appId - The unique ID of the app.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setAppId(appId: string): this {
    this.appId = appId;
    return this;
  }

  /**
   * Sets the region.
   * @param {string} region - The region of the app.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setRegion(region: string): this {
    this.region = region;
    return this;
  }

  /**
   * Sets the authentication key.
   * @param {string} authKey - The authentication key.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setAuthKey(authKey: string): this {
    this.authKey = authKey;
    return this;
  }

  /**
   * Subscribes to presence updates for all users.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  subscribePresenceForAllUsers(): this {
    this.subscriptionType = 'ALL_USERS';
    return this;
  }

  /**
   * Subscribes to presence updates for friends.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  subscribePresenceForFriends(): this {
    this.subscriptionType = 'FRIENDS';
    return this;
  }

  /**
   * Subscribes to presence updates for specific roles.
   * @param {string[]} roles - The roles to subscribe to.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  subscribePresenceForRoles(roles: string[]): this {
    this.subscriptionType = 'ROLES';
    this.roles = roles;
    return this;
  }

  /**
   * Sets the roles for presence subscription.
   * @param {string[]} roles - The roles to subscribe to.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setRoles(roles: string[]): this {
    this.roles = roles;
    return this;
  }

  /**
   * Enables or disables the auto-establish socket connection.
   * @param {boolean} value - True to enable, false to disable.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setAutoEstablishSocketConnection(value: boolean): this {
    this.autoEstablishSocketConnection = value;
    return this;
  }

  /**
   * Sets the custom admin host URL.
   * @param {string} host - The admin host URL.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setAdminHost(host: string): this {
    this.adminHost = host;
    return this;
  }

  /**
   * Sets the custom client host URL.
   * @param {string} host - The client host URL.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setClientHost(host: string): this {
    this.clientHost = host;
    return this;
  }

  /**
   * Sets the storage mode.
   * @param {CometChat.StorageMode} mode - The storage mode.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setStorageMode(mode: CometChat.StorageMode): this {
    this.storageMode = mode;
    return this;
  }

  /**
   * Enables or disables calling functionality.
   * @param {boolean} enabled - True to enable, false to disable.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  setCallingEnabled(enabled: boolean): this {
    this.callingEnabled = enabled;
    return this;
  }

  /**
   * Sets custom CallAppSettings for Calls SDK initialization.
   * If not set, the UIKit builds default settings from appId and region.
   *
   * @example
   * ```typescript
   * new UIKitSettingsBuilder()
   *   .setCallingEnabled(true)
   *   .setCallAppSettings({ appId: 'APP_ID', region: 'us' })
   *   .build();
   * ```
   *
   * @param {any} callAppSettings - The CallAppSettings object.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCallAppSettings(callAppSettings: any): this {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.callAppSettings = callAppSettings;
    return this;
  }
}
