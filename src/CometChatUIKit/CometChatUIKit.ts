import { CometChat } from '@cometchat/chat-sdk-javascript';
import { UIKitSettings, UIKitSettingsBuilder, type CometChatOfflineConfig } from './UIKitSettings';
import { CometChatUIKitCalls, loadCallsSDK } from './CometChatCalls';
import { CometChatLocalize } from '../resources/CometChatLocalize/CometChatLocalize';
import type { CometChatEvent } from '../context/CometChatEvents.types';
import { CometChatMessageStatus } from '../context/CometChatEvents.types';
// Imported from the specific module, not the `../utils` barrel: the barrel pulls
// in CometChatUIKitConstants (via the streaming factory), which widens this
// module's graph and breaks consumers that stub the SDK.
import { resetPinSaveFeatures, resolvePinSaveFeatures } from '../utils/pinSaveFeatures';
import { resetPinSaveLimits, resolvePinSaveLimits } from '../utils/pinSaveLimits';
import { UIKIT_METADATA } from '../version';
import { OfflineHub } from '../utils/offline/hub';
import { hasOfflineSdk, isOfflineOn } from '../utils/offline/gate';
import { sendWithStatePromise, type OfflineSendKind } from '../utils/offline/send';

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
  private static _initialized = false;
  /** Settings from the initFromSettings() (ai-agent) path; routes the Calls SDK through initFromSettings too. Null on plain init(). */
  private static _callsInitSettings: CometChat.CometChatSettings | null = null;
  private static _callingReady = false;
  private static _loginListenerId: string | null = null;
  private static _conversationUpdateSettings: CometChat.ConversationUpdateSettings | null = null;
  private static _emit: ((event: CometChatEvent) => void) | null = null;

  // --- Emit bridge (static ↔ React context) ---

  /**
   * Register the emit function from CometChatEventsProvider.
   * Called internally by the provider on mount/unmount.
   */
  static _setEmit(fn: ((event: CometChatEvent) => void) | null): void {
    CometChatUIKit._emit = fn;
    // The offline hub's public events (send state, cache reset) reach the same bus.
    OfflineHub.getInstance().setPublicEmit(fn);
  }

  // --- Getters ---

  /** Returns the UIKit settings used during initialization. */
  static getSettings(): UIKitSettings | null {
    return CometChatUIKit._settings;
  }

  /** Returns the currently logged-in user (synchronous). */
  static getLoggedInUser(): CometChat.User | null {
    return CometChatUIKit._loggedInUser;
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
    // Plain init(): clear any ai-agent settings so the Calls SDK uses plain init().
    CometChatUIKit._callsInitSettings = null;

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

    // Offline support: pass-through only, and only on an SDK at the kit's offline
    // floor. `setOfflineConfig` exists on 4.3.0 too, so without the floor check the
    // SDK would queue and cache below the floor while the kit's screens act online.
    const offlineConfig = settings.getOfflineConfig();
    const offlineBuilder = appSettingsBuilder as unknown as {
      setOfflineConfig?: (config: unknown) => unknown;
    };
    if (offlineConfig && hasOfflineSdk() && typeof offlineBuilder.setOfflineConfig === 'function') {
      offlineBuilder.setOfflineConfig(offlineConfig);
    }

    const appSettings = appSettingsBuilder.build();

    // Set source for analytics
    if (typeof CometChat.setSource === 'function') {
      CometChat.setSource('uikit-v7', 'web', 'reactjs');
    }

    // Set window metadata for debugging/support
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).CometChatUiKit = { ...UIKIT_METADATA };
    }

    // Initialize SDK
    await CometChat.init(settings.getAppId(), appSettings);
    CometChatUIKit._initialized = true;
    // The offline hub registers once the SDK is up, whatever the offline state
    // (its listeners are inert while offline is off).
    OfflineHub.getInstance().start();

    // Initialize locale — only if no shared instance exists yet.
    // When used with CometChatProvider, the LocaleProvider may have already
    // created and configured the shared instance before init() completes.
    if (!CometChatLocalize.getSharedInstance()) {
      const localize = new CometChatLocalize();
      localize.init();
      CometChatLocalize.setSharedInstance(localize);
    }

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

  /**
   * @internal
   * File-based init for AI agent skills.
   * Calls CometChat.initFromSettings(settings) which sets
   * integrationSource = "ai-agent" in persistent storage.
   *
   * This method is completely independent of init() — new→new, old→old.
   * Regular init(uikitSettings) does NOT set the integrationSource flag.
   *
   * Offline support works the same as on init(): pass `offlineConfig` (the
   * config `UIKitSettingsBuilder.setOfflineConfig()` takes) and it reaches the
   * SDK as `chatSDK.offline`, replacing any value in the settings file. Without
   * it, the file's `chatSDK.offline` reaches the SDK unchanged.
   *
   * @param settings - The parsed cometchat-settings.json object.
   * @param offlineConfig - Optional offline support settings for the Chat SDK.
   */
  static initFromSettings(
    settings: CometChat.CometChatSettings,
    offlineConfig?: CometChatOfflineConfig
  ): Promise<CometChat.User | null> {
    // Offline: a code-level config wins over the file's; the caller's object is left as is.
    // `chatSDK.offline` is typed by SDK 4.3+ only; it is read and written
    // structurally so the kit also compiles against 4.2.x (peer ^4.2.0).
    if (offlineConfig) {
      settings = {
        ...settings,
        chatSDK: {
          ...settings.chatSDK,
          offline: offlineConfig,
        } as CometChat.CometChatSettings['chatSDK'],
      };
    }
    const fileOffline: unknown = (settings.chatSDK as { offline?: unknown } | undefined)?.offline;
    const effectiveOffline: CometChatOfflineConfig | undefined =
      typeof fileOffline === 'boolean'
        ? { enabled: fileOffline }
        : fileOffline && typeof fileOffline === 'object'
          ? (fileOffline as CometChatOfflineConfig)
          : undefined;
    // Below the kit's offline floor the SDK is not told to run offline either, or it
    // would queue and cache while the kit's screens act online. The caller's object
    // is never changed: `chatSDK.offline` is dropped from a copy.
    if (effectiveOffline && !hasOfflineSdk()) {
      const chatSDK = { ...(settings.chatSDK as Record<string, unknown>) };
      delete chatSDK.offline;
      settings = { ...settings, chatSDK: chatSDK as CometChat.CometChatSettings['chatSDK'] };
    }

    // Extract authKey from credentials
    const credentials = settings.credentials as Record<string, unknown> | undefined;
    const authKey = credentials?.authKey as string | undefined;

    // Extract UIKit-specific settings
    const uiKitConfig = settings.uiKit;
    const callingEnabled = !!uiKitConfig?.callsSDK;

    // Capture settings so _initCalling() routes the Calls SDK through initFromSettings (ai-agent).
    CometChatUIKit._callsInitSettings = settings;

    // Build UIKitSettings so downstream code (login, calling, etc.) works
    const builder = new UIKitSettingsBuilder().setAppId(settings.appId).setRegion(settings.region);
    if (authKey) builder.setAuthKey(authKey);
    if (callingEnabled) builder.setCallingEnabled(true);
    // Same as init(): the kit's settings carry the offline config the SDK was given.
    if (effectiveOffline && hasOfflineSdk()) builder.setOfflineConfig(effectiveOffline);
    CometChatUIKit._settings = builder.build();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (CometChat.setSource) {
      CometChat.setSource('uikit-v7', 'web', 'reactjs');
    }

    return new Promise((resolve, reject) => {
      // Analytics: register UIKit metadata on the window for tracking.
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).CometChatUiKit = { ...UIKIT_METADATA };
      }

      // CRITICAL: Call initFromSettings — NOT init().
      // Only initFromSettings writes integrationSource = "ai-agent".
      // `chatSDK.offline` (from the file or `offlineConfig`) reaches the SDK here.
      CometChat.initFromSettings(settings)
        .then(() => {
          CometChatUIKit._initialized = true;
          OfflineHub.getInstance().start();

          // Initialize locale
          if (!CometChatLocalize.getSharedInstance()) {
            const localize = new CometChatLocalize();
            localize.init();
            CometChatLocalize.setSharedInstance(localize);
          }

          CometChat.getLoggedinUser()
            .then((user: CometChat.User | null) => {
              if (user) {
                CometChatUIKit._loggedInUser = user;
                void CometChatUIKit._postLogin();
              }
              resolve(user);
            })
            .catch((error: unknown) => {
              console.log(error);
              reject(error instanceof Error ? error : new Error(String(error)));
            });
        })
        .catch((error: unknown) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
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
    // Drop the pin/save flags and caps with the session.
    resetPinSaveFeatures();
    resetPinSaveLimits();
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
   * Send a text message with optimistic UI updates.
   * Emits 'ui:message/sent' at each stage (inprogress → success/error).
   */
  static async sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage> {
    CometChatUIKit._prepareMessage(message);

    // Offline support: one gate read for this send; the ON path resolves on
    // sent, rejects on a final or direct failure, never because it was queued.
    if (isOfflineOn()) return CometChatUIKit._sendOffline(message, 'text');

    // Optimistic: show in message list immediately
    CometChatUIKit._emit?.({
      type: 'ui:message/sent',
      message,
      status: CometChatMessageStatus.inprogress,
    });

    try {
      const sent = await CometChat.sendMessage(message);
      // Confirm: update pending → sent
      CometChatUIKit._emit?.({
        type: 'ui:message/sent',
        message: sent,
        status: CometChatMessageStatus.success,
      });
      return sent;
    } catch (error) {
      // Error: mark as failed
      const meta = (message.getMetadata() as Record<string, unknown> | null) ?? {};
      message.setMetadata({ ...meta, error });
      CometChatUIKit._emit?.({
        type: 'ui:message/sent',
        message,
        status: CometChatMessageStatus.error,
      });
      throw error;
    }
  }

  /**
   * Send a media message with optimistic UI updates.
   * Emits 'ui:message/sent' at each stage (inprogress → success/error).
   */
  static async sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.BaseMessage> {
    CometChatUIKit._prepareMessage(message);

    // Offline support: one gate read for this send; the ON path resolves on
    // sent, rejects on a final or direct failure, never because it was queued.
    if (isOfflineOn()) return CometChatUIKit._sendOffline(message, 'media');

    // Optimistic: show in message list immediately
    CometChatUIKit._emit?.({
      type: 'ui:message/sent',
      message,
      status: CometChatMessageStatus.inprogress,
    });

    try {
      const sent = await CometChat.sendMediaMessage(message);
      // Confirm: update pending → sent
      CometChatUIKit._emit?.({
        type: 'ui:message/sent',
        message: sent,
        status: CometChatMessageStatus.success,
      });
      return sent;
    } catch (error) {
      // Error: mark as failed
      const meta = (message.getMetadata() as Record<string, unknown> | null) ?? {};
      message.setMetadata({ ...meta, error });
      CometChatUIKit._emit?.({
        type: 'ui:message/sent',
        message,
        status: CometChatMessageStatus.error,
      });
      throw error;
    }
  }

  /**
   * Send a custom message with optimistic UI updates.
   * Emits 'ui:message/sent' at each stage (inprogress → success/error).
   */
  static async sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage> {
    CometChatUIKit._prepareMessage(message);

    // Offline support: one gate read for this send; the ON path resolves on
    // sent, rejects on a final or direct failure, never because it was queued.
    if (isOfflineOn()) return CometChatUIKit._sendOffline(message, 'custom');

    // Optimistic: show in message list immediately
    CometChatUIKit._emit?.({
      type: 'ui:message/sent',
      message,
      status: CometChatMessageStatus.inprogress,
    });

    try {
      const sent = await CometChat.sendCustomMessage(message);
      // Confirm: update pending → sent
      CometChatUIKit._emit?.({
        type: 'ui:message/sent',
        message: sent,
        status: CometChatMessageStatus.success,
      });
      return sent;
    } catch (error) {
      // Error: mark as failed
      const meta = (message.getMetadata() as Record<string, unknown> | null) ?? {};
      message.setMetadata({ ...meta, error });
      CometChatUIKit._emit?.({
        type: 'ui:message/sent',
        message,
        status: CometChatMessageStatus.error,
      });
      throw error;
    }
  }

  // --- Private helpers ---

  /**
   * The offline (ON) path of the send statics: announce `inprogress` once, as
   * today; the offline send helper reports the rest.
   */
  private static _sendOffline(
    message: CometChat.BaseMessage,
    kind: OfflineSendKind
  ): Promise<CometChat.BaseMessage> {
    CometChatUIKit._emit?.({
      type: 'ui:message/sent',
      message,
      status: CometChatMessageStatus.inprogress,
    });
    return sendWithStatePromise(message, kind);
  }

  /** Post-login initialization: calls SDK, conversation settings, login listener. */
  private static async _postLogin(): Promise<void> {
    // Tell the offline hub who is signed in (a different uid ends the old session).
    OfflineHub.getInstance().onLogin(CometChatUIKit._loggedInUser);

    // Resolve the pin/save feature flags and caps here — the ONLY place they're
    // warmed. They read the app-settings blob, and on a cold cache the SDK fetches
    // /v3/settings, which needs an auth token; doing this pre-login (at init) fired
    // that request without a token and failed it, hiding the features until a
    // refresh. By _postLogin the token exists, so the fetch succeeds; on a warm
    // cache (e.g. refresh while logged in) it's a local read. reset() first so a
    // prior session's values can't linger; the epoch guard in those modules keeps a
    // late reset from being clobbered. Fire-and-forget — consumers re-render via
    // usePinSaveFeatures once it lands. Runs on every entry point: fresh login,
    // auth-token login, and existing-session restore during init() (i.e. refresh).
    resetPinSaveFeatures();
    resetPinSaveLimits();
    void resolvePinSaveFeatures();
    void resolvePinSaveLimits();

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

      const callsInitSettings = CometChatUIKit._callsInitSettings;
      if (callsInitSettings && typeof callsSDK.initFromSettings === 'function') {
        // ai-agent path: initFromSettings writes integrationSource = "ai-agent".
        // typeof guard degrades to plain init() for older (optional peer) SDKs.
        await callsSDK.initFromSettings(callsInitSettings);
      } else {
        // Plain init() path — unchanged for developers.
        const callAppSetting = settings?.getCallAppSettings() ?? {
          appId: settings?.getAppId(),
          region: settings?.getRegion(),
        };

        await callsSDK.init(callAppSetting);
      }

      CometChatUIKit._callingReady = true;
    } catch (error) {
      console.error('CometChatUIKit: Calls SDK initialization failed:', error);
    }
  }

  /** Prepare a message for sending (set muid, sentAt, sender). */
  private static _prepareMessage(message: CometChat.BaseMessage): void {
    if (!message.getMuid()) {
      message.setMuid(`_${Math.random().toString(36).slice(2, 12)}`);
    }
    if (!message.getSentAt()) {
      message.setSentAt(Math.floor(Date.now() / 1000));
    }
    // Set sender to logged-in user if not already set (needed for optimistic UI).
    // getSender() may return an empty/uninitialized User object for freshly constructed messages.
    const senderUid = (message.getSender() as { getUid?: () => string } | undefined)?.getUid?.();
    if (!senderUid && CometChatUIKit._loggedInUser) {
      message.setSender(CometChatUIKit._loggedInUser);
    }
  }

  /** Throw if not initialized. */
  private static _checkInitialized(): void {
    if (!CometChatUIKit._initialized) {
      throw new Error('CometChatUIKit: Not initialized. Call CometChatUIKit.init() first.');
    }
  }
}
