
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CallingExtension } from "../components/Calling/CallingExtension";
import { ExtensionsDataSource } from "../components/Extensions/ExtensionsDataSource";

/**
 * Represents the settings required to initialize the CometChat SDK.
 * This class holds various configuration options, such as app credentials, socket connection settings, and feature toggles.
 * 
 * @class UIKitSettings
 */
export class UIKitSettings {
  /**
   * Unique ID for the app, available on the CometChat dashboard.
   * @type {string}
   */
  readonly appId?: string;

  /**
   * Region for the app, such as "us" or "eu".
   * @type {string}
   */
  readonly region?: string;

  /**
   * Sets the subscription type for presence.
   * @type {string}
   */
  readonly subscriptionType?: string;

  /**
   * Configures WebSocket connections. When set to true, establishes connection automatically on app initialization.
   * @type {boolean}
   * @default true
   */
  readonly autoEstablishSocketConnection?: boolean;

  /**
   * Authentication key for the app, available on the CometChat dashboard.
   * @type {string}
   */
  readonly authKey?: string;

  /**
   * Token representing the device, used for push notifications.
   * @type {string}
   */
  readonly deviceToken?: string;

  /**
   * API key for Google services.
   * @type {string}
   */
  readonly googleApiKey?: string;

  /**
   * Flag to disable the calling feature.
   * @type {boolean}
   * @default false
   */
  readonly disableCalling: boolean;

  /**
   * Subscribes to user presence for users having the specified roles.
   * @type {string[]}
   */
  readonly roles?: string[];

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
   * Data source for managing UI extensions.
   * @type {ExtensionsDataSource[]}
   */
  readonly extensions?: ExtensionsDataSource[];
    /**
   * Data source for managing  calls.
   * @type {ExtensionsDataSource}
   */
    readonly callingExtension?:CallingExtension;

  /**
   * Storage mode for persisting data.
   * @type {CometChat.StorageMode}
   */
  readonly storageMode: CometChat.StorageMode

  /**
   * Private constructor to initialize the settings using the provided builder.
   * @param {UIKitSettingsBuilder} builder - The builder instance containing the settings configuration.
   */
  private constructor(builder: UIKitSettingsBuilder) {
    this.appId = builder.appId;
    this.region = builder.region;
    this.subscriptionType = builder.subscriptionType;
    this.autoEstablishSocketConnection = builder.autoEstablishSocketConnection ?? true;
    this.authKey = builder.authKey;
    this.deviceToken = builder.deviceToken;
    this.googleApiKey = builder.googleApiKey;
    this.disableCalling = builder.disableCalling;
    this.adminHost = builder.adminHost;
    this.clientHost = builder.clientHost;
    this.extensions = builder.extensions;
    this.callingExtension  = builder.callingExtension;
    this.roles = builder.roles;
    this.storageMode = builder.storageMode || CometChat.StorageMode.LOCAL;
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
  public getAppId(): string {
    return this.appId!;
  }

  /**
  * Retrieves the region.
  * @returns {string} The region of the app.
  */
  public getRegion(): string {
    return this.region!;
  }

  /**
   * Retrieves the roles for presence subscription.
   * @returns {string[]} The list of roles subscribed to presence.
   */
  public getRoles(): string[] {
    return this.roles!;
  }

  /**
   * Retrieves the subscription type for presence.
   * @returns {string} The subscription type.
   */
  public getSubscriptionType(): string {
    return this.subscriptionType!;
  }

  /**
   * Retrieves the authentication key.
   * @returns {string} The authentication key.
   */
  public getAuthKey(): string {
    return this.authKey!;
  }

  /**
   * Checks if auto-establish socket connection is enabled.
   * @returns {boolean} True if auto-establish is enabled, otherwise false.
   */
  public isAutoEstablishSocketConnection(): boolean {
    return this.autoEstablishSocketConnection!;
  }

  /**
   * Retrieves the custom admin host URL.
   * @returns {string} The admin host URL.
   */
  public getAdminHost(): string {
    return this.adminHost!
  }

  /**
   * Retrieves the custom client host URL.
   * @returns {string} The client host URL.
   */
  public getClientHost(): string {
    return this.clientHost!
  }

  /**
   * Retrieves the list of UI extensions.
   * @returns {ExtensionsDataSource[]} The list of UI extensions.
   */
  public getExtensions(): ExtensionsDataSource[] {
    return this.extensions!
  }
    /**
   * Retrieves the calling extension.
   * @returns {ExtensionsDataSource[]}
   */
    public getCallsExtension(): ExtensionsDataSource {
      return this.callingExtension!;
    }

  /**
   * Retrieves the storage mode.
   * @returns {CometChat.StorageMode} The storage mode.
   */
  public getStorageMode(): CometChat.StorageMode {
    return this.storageMode;
  }
}

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
   * @type {string}
   */
  subscriptionType?: string;

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
   * Token representing the device, used for push notifications.
   * @type {string}
   */
  deviceToken?: string;

  /**
   * API key for Google services.
   * @type {string}
   */
  googleApiKey?: string;

  /**
   * Data source for managing UI extensions.
   * @type {ExtensionsDataSource[]}
   */
  extensions?: ExtensionsDataSource[];
    /**
   * Data source for managing calls extension.
   * @type {CallingExtension}
   */
    callingExtension?: CallingExtension;
  

  /**
   * Flag to disable the calling feature.
   * @type {boolean}
   * @default false
   */
  disableCalling = false;

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
  storageMode?: CometChat.StorageMode

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
  public setAppId(appId: string): UIKitSettingsBuilder {
    this.appId = appId;
    return this;
  }

  /**
   * Sets the region.
   * @param {string} region - The region of the app.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public setRegion(region: string): UIKitSettingsBuilder {
    this.region = region;
    return this;
  }

  /**
   * Subscribes to presence updates for all users.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public subscribePresenceForAllUsers(): UIKitSettingsBuilder {
    this.subscriptionType = 'ALL_USERS';
    return this;
  }

  /**
   * Subscribes to presence updates for specific roles.
   * @param {string[]} roles - The roles to subscribe to.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public subscribePresenceForRoles(roles: string[]): UIKitSettingsBuilder {
    this.subscriptionType = 'ROLES';
    this.roles = roles;
    return this;
  }

  /**
   * Subscribes to presence updates for specific roles.
   * @param {string[]} roles - The roles to subscribe to.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public subscribePresenceForFriends(): UIKitSettingsBuilder {
    this.subscriptionType = 'FRIENDS';
    return this;
  }

  /**
   * Sets the roles for presence subscription.
   * @param {string[]} roles - The roles to subscribe to.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public setRoles(roles: string[]): UIKitSettingsBuilder {
    this.roles = roles;
    return this;
  }

  /**
   * Enables or disables the auto-establish socket connection.
   * @param {boolean} autoEstablishSocketConnection - True to enable, false to disable.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public setAutoEstablishSocketConnection(
    autoEstablishSocketConnection: boolean
  ): UIKitSettingsBuilder {
    this.autoEstablishSocketConnection = autoEstablishSocketConnection;
    return this;
  }

  /**
   * Sets the authentication key.
   * @param {string} authKey - The authentication key.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public setAuthKey(authKey: string): UIKitSettingsBuilder {
    this.authKey = authKey;
    return this;
  }

  /**
   * Sets the custom admin host URL.
   * @param {string} adminHost - The admin host URL.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public setAdminHost(adminHost: string): UIKitSettingsBuilder {
    this.adminHost = adminHost
    return this;
  }

  /**
   * Sets the custom client host URL.
   * @param {string} clientHost - The client host URL.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public setClientHost(clientHost: string): UIKitSettingsBuilder {
    this.clientHost = clientHost
    return this;
  }

  /**
   * Sets the list of UI extensions.
   * @param {ExtensionsDataSource[]} extensions - The list of UI extensions.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
  public setExtensions(extensions: ExtensionsDataSource[]): UIKitSettingsBuilder {
    this.extensions = extensions
    return this
  }
    /**
   * Sets the calling extension.
   * @param {ExtensionsDataSource} calling.
   * @returns {UIKitSettingsBuilder} The builder instance.
   */
    public setCallsExtension(callingExtension: CallingExtension): UIKitSettingsBuilder {
      this.callingExtension = callingExtension;
      return this
    }

  /** 
   * Sets the storage mode.
   * @param {CometChat.StorageMode} storageMode - The storage mode.
   * @returns {UIKitSettingsBuilder} The builder instance.
  */
  public setStorageMode(storageMode: CometChat.StorageMode): UIKitSettingsBuilder {
    this.storageMode = storageMode;
    return this;
  }
}
