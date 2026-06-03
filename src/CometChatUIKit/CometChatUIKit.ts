import { CometChat } from '@cometchat/chat-sdk-javascript';
import { UIKitSettings } from './UIKitSettings';
import { CometChatPluginRegistry } from '../plugins/CometChatPluginRegistry';
import { defaultPlugins } from '../plugins/core';
import { CometChatUIKitCalls, loadCallsSDK } from './CometChatCalls';
import { CometChatLocalize } from '../resources/CometChatLocalize/CometChatLocalize';

/**
 * CometChatUIKit — static facade for initializing and interacting with the UIKit.
 *
 * Provides a single entry point for:
 * - SDK initialization (with UIKit-specific configuration)
 * - User login/logout with session resumption
 * - Plugin registry management
 * - Calling SDK initialization
 * - Convenience send methods (for non-React usage)
 *
 * Usage:
 * ```typescript
 * import { CometChatUIKit, UIKitSettingsBuilder } from '@cometchat/chat-uikit-react';
 *
 * const settings = new UIKitSettingsBuilder()
 *   .setAppId('APP_ID')
 *   .setRegion('us')
 *   .setAuthKey('AUTH_KEY')
 *   .subscribePresenceForAllUsers()
 *   .setCallingEnabled(true)
 *   .build();
 *
 * await CometChatUIKit.init(settings);
 * const user = await CometChatUIKit.login('superhero1');
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CometChatUIKit {
  // --- Static state ---
  private static _settings: UIKitSettings | null = null;
  private static _loggedInUser: CometChat.User | null = null;
  private static _pluginRegistry: CometChatPluginRegistry | null = null;
  private static _initialized = false;
  private static _callingReady = false;
  private static _loginListenerId: string | null = null;
  private static _conversationUpdateSettings: CometChat.ConversationUpdateSettings | null = null;

  // --- Getters ---

  /** Returns the UIKit settings used during initialization. */
  static getSettings(): UIKitSettings | null {
    return CometChatUIKit._settings;
  }

  /** Returns the currently logged-in user (synchronous). */
  static getLoggedInUser(): CometChat.User | null {
    return CometChatUIKit._loggedInUser;
  }

  /** Returns the plugin registry instance. */
  static getPluginRegistry(): CometChatPluginRegistry | null {
    return CometChatUIKit._pluginRegistry;
  }

  /** Returns whether the SDK has been initialized. */
  static isInitialized(): boolean {
    return CometChatUIKit._initialized;
  }

  /** Returns whether the Calls SDK is ready. */
  static isCallingReady(): boolean {
    return CometChatUIKit._callingReady;
  }

  /** Returns the conversation update settings fetched from the dashboard. */
  static getConversationUpdateSettings(): CometChat.ConversationUpdateSettings | null {
    return CometChatUIKit._conversationUpdateSettings;
  }

  // --- Initialization ---

  /**
   * Initialize the CometChat SDK and UIKit.
   *
   * This:
   * 1. Validates settings
   * 2. Builds AppSettings from UIKitSettings
   * 3. Calls CometChat.init()
   * 4. Sets source metadata for analytics
   * 5. Sets up plugin registry
   * 6. Resumes existing session (if any)
   * 7. Initializes Calls SDK (if enabled)
   */
  static async init(settings: UIKitSettings): Promise<CometChat.User | null> {
    CometChatUIKit._settings = settings;

    // Build SDK AppSettings from UIKitSettings
    const appSettingsBuilder = new CometChat.AppSettingsBuilder();

    if (settings.getRoles().length > 0) {
      appSettingsBuilder.subscribePresenceForRoles(settings.getRoles());
    } else if (settings.getSubscriptionType() === 'ALL_USERS') {
      appSettingsBuilder.subscribePresenceForAllUsers();
    } else if (settings.getSubscriptionType() === 'FRIENDS') {
      appSettingsBuilder.subscribePresenceForFriends();
    }

    appSettingsBuilder.autoEstablishSocketConnection(settings.isAutoEstablishSocketConnection());
    appSettingsBuilder.setRegion(settings.getRegion());

    const adminHost = settings.getAdminHost();
    if (adminHost) {
      appSettingsBuilder.overrideAdminHost(adminHost);
    }
    const clientHost = settings.getClientHost();
    if (clientHost) {
      appSettingsBuilder.overrideClientHost(clientHost);
    }
    appSettingsBuilder.setStorageMode(settings.getStorageMode());

    const appSettings = appSettingsBuilder.build();

    // Set source for analytics
    if (typeof CometChat.setSource === 'function') {
      CometChat.setSource('uikit-v7', 'web', 'reactjs');
    }

    // Set window metadata for debugging/support
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).CometChatUiKit = {
        name: '@cometchat/chat-uikit-react',
        version: '7.0.0-beta.1',
      };
    }

    // Initialize SDK
    await CometChat.init(settings.getAppId(), appSettings);
    CometChatUIKit._initialized = true;

    // Set up plugin registry
    const userPlugins = settings.getPlugins();
    const allPlugins = userPlugins ? [...defaultPlugins, ...userPlugins] : defaultPlugins;
    CometChatUIKit._pluginRegistry = new CometChatPluginRegistry(allPlugins);

    // Initialize locale
    const localize = new CometChatLocalize();
    localize.init();
    CometChatLocalize.setSharedInstance(localize);

    // Check for existing session
    try {
      const existingUser = await CometChat.getLoggedinUser();
      if (existingUser) {
        CometChatUIKit._loggedInUser = existingUser;
        await CometChatUIKit._postLogin();
      }
    } catch {
      // No existing session — that's fine
    }

    return CometChatUIKit._loggedInUser;
  }

  // --- Login ---

  /**
   * Log in a user by UID.
   * Requires authKey to be set in UIKitSettings.
   */
  static async login(uid: string): Promise<CometChat.User> {
    CometChatUIKit._checkInitialized();

    const authKey = CometChatUIKit._settings?.getAuthKey();
    if (!authKey) {
      throw new Error('CometChatUIKit.login: authKey is required in UIKitSettings for UID login');
    }

    // Check if already logged in
    const existing = await CometChat.getLoggedinUser();
    if (existing) {
      CometChatUIKit._loggedInUser = existing;
      await CometChatUIKit._postLogin();
      return existing;
    }

    const user = await CometChat.login(uid, authKey);
    CometChatUIKit._loggedInUser = user;
    await CometChatUIKit._postLogin();
    return user;
  }

  /**
   * Log in a user with an auth token.
   */
  static async loginWithAuthToken(authToken: string): Promise<CometChat.User> {
    CometChatUIKit._checkInitialized();

    const user = await CometChat.login(authToken);
    CometChatUIKit._loggedInUser = user;
    await CometChatUIKit._postLogin();
    return user;
  }

  // --- Logout ---

  /**
   * Log out the current user.
   */
  static async logout(): Promise<void> {
    await CometChat.logout();
    CometChatUIKit._loggedInUser = null;
    CometChatUIKit._callingReady = false;
    // Remove login listener
    if (CometChatUIKit._loginListenerId) {
      CometChat.removeLoginListener(CometChatUIKit._loginListenerId);
      CometChatUIKit._loginListenerId = null;
    }
  }

  // --- User management ---

  /**
   * Create a new user.
   * Requires authKey in UIKitSettings.
   */
  static async createUser(user: CometChat.User): Promise<CometChat.User> {
    CometChatUIKit._checkInitialized();
    const authKey = CometChatUIKit._settings?.getAuthKey();
    if (!authKey) {
      throw new Error('CometChatUIKit.createUser: authKey is required');
    }
    return CometChat.createUser(user, authKey);
  }

  /**
   * Update an existing user.
   * Requires authKey in UIKitSettings.
   */
  static async updateUser(user: CometChat.User): Promise<CometChat.User> {
    CometChatUIKit._checkInitialized();
    const authKey = CometChatUIKit._settings?.getAuthKey();
    if (!authKey) {
      throw new Error('CometChatUIKit.updateUser: authKey is required');
    }
    return CometChat.updateUser(user, authKey);
  }

  // --- Send methods (convenience for non-React usage) ---

  /**
   * Send a text message.
   * Sets muid and sentAt if not already set.
   */
  static async sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage> {
    CometChatUIKit._prepareMessage(message);
    return CometChat.sendMessage(message);
  }

  /**
   * Send a media message.
   * Sets muid and sentAt if not already set.
   */
  static async sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.BaseMessage> {
    CometChatUIKit._prepareMessage(message);
    return CometChat.sendMediaMessage(message);
  }

  /**
   * Send a custom message.
   * Sets muid and sentAt if not already set.
   */
  static async sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage> {
    CometChatUIKit._prepareMessage(message);
    return CometChat.sendCustomMessage(message);
  }

  // --- Private helpers ---

  /** Post-login initialization: calls SDK, conversation settings, login listener. */
  private static async _postLogin(): Promise<void> {
    // Fetch conversation update settings from dashboard
    try {
      CometChatUIKit._conversationUpdateSettings = await CometChat.getConversationUpdateSettings();
    } catch {
      // Non-fatal — use defaults
    }

    // Attach login listener to keep _loggedInUser in sync
    CometChatUIKit._attachLoginListener();

    // Initialize Calls SDK if enabled
    if (CometChatUIKit._settings?.isCallingEnabled()) {
      await CometChatUIKit._initCalling();
    }
  }

  /** Attach SDK login listener to track login/logout from other tabs or direct SDK calls. */
  private static _attachLoginListener(): void {
    if (CometChatUIKit._loginListenerId) {
      CometChat.removeLoginListener(CometChatUIKit._loginListenerId);
    }

    CometChatUIKit._loginListenerId = `CometChatUIKit_login_${String(Date.now())}`;
    CometChat.addLoginListener(
      CometChatUIKit._loginListenerId,
      new CometChat.LoginListener({
        loginSuccess: (user: CometChat.User) => {
          CometChatUIKit._loggedInUser = user;
        },
        logoutSuccess: () => {
          CometChatUIKit._loggedInUser = null;
          CometChatUIKit._callingReady = false;
        },
      })
    );
  }

  /** Initialize the Calls SDK. */
  private static async _initCalling(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const callsSDK = CometChatUIKitCalls ?? (await loadCallsSDK());

      if (!callsSDK) return;

      const settings = CometChatUIKit._settings;
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

      const callAppSetting = settings?.getCallAppSettings() ?? {
        appId: settings?.getAppId(),
        region: settings?.getRegion(),
      };

      await callsSDK.init(callAppSetting);

      const loggedInUser = CometChatUIKit._loggedInUser;
      if (loggedInUser) {
        const authToken = loggedInUser.getAuthToken();
        if (authToken) {
          await callsSDK.loginWithAuthToken(authToken);
        }
      }

      CometChatUIKit._callingReady = true;
    } catch (error) {
      console.error('CometChatUIKit: Calls SDK initialization failed:', error);
    }
  }

  /** Prepare a message for sending (set muid, sentAt). */
  private static _prepareMessage(message: CometChat.BaseMessage): void {
    if (!message.getMuid()) {
      message.setMuid(`_${Math.random().toString(36).slice(2, 12)}`);
    }
    if (!message.getSentAt()) {
      message.setSentAt(Math.floor(Date.now() / 1000));
    }
  }

  /** Throw if not initialized. */
  private static _checkInitialized(): void {
    if (!CometChatUIKit._initialized) {
      throw new Error('CometChatUIKit: Not initialized. Call CometChatUIKit.init() first.');
    }
  }
}
