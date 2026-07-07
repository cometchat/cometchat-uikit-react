import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const mockInit = vi.fn();
const mockInitFromSettings = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockGetLoggedinUser = vi.fn();
const mockCreateUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSendMessage = vi.fn();
const mockSendMediaMessage = vi.fn();
const mockSendCustomMessage = vi.fn();
const mockAddLoginListener = vi.fn();
const mockRemoveLoginListener = vi.fn();
const mockGetConversationUpdateSettings = vi.fn();
const mockSetSource = vi.fn();

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    init: (...args: unknown[]) => mockInit(...args),
    initFromSettings: (...args: unknown[]) => mockInitFromSettings(...args),
    login: (...args: unknown[]) => mockLogin(...args),
    logout: (...args: unknown[]) => mockLogout(...args),
    getLoggedinUser: (...args: unknown[]) => mockGetLoggedinUser(...args),
    createUser: (...args: unknown[]) => mockCreateUser(...args),
    updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
    sendMediaMessage: (...args: unknown[]) => mockSendMediaMessage(...args),
    sendCustomMessage: (...args: unknown[]) => mockSendCustomMessage(...args),
    addLoginListener: (...args: unknown[]) => mockAddLoginListener(...args),
    removeLoginListener: (...args: unknown[]) => mockRemoveLoginListener(...args),
    getConversationUpdateSettings: (...args: unknown[]) =>
      mockGetConversationUpdateSettings(...args),
    setSource: (...args: unknown[]) => mockSetSource(...args),
    CATEGORY_MESSAGE: 'message',
    CATEGORY_CUSTOM: 'custom',
    CATEGORY_ACTION: 'action',
    CATEGORY_CALL: 'call',
    CATEGORY_INTERACTIVE: 'interactive',
    MESSAGE_TYPE: {
      TEXT: 'text',
      FILE: 'file',
      IMAGE: 'image',
      AUDIO: 'audio',
      VIDEO: 'video',
      ASSISTANT: 'assistant',
      TOOL_ARGUMENTS: 'toolArguments',
      TOOL_RESULT: 'toolResults',
    },
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    ACTION_TYPE: {
      MEMBER_JOINED: 'joined',
      MEMBER_LEFT: 'left',
      MEMBER_ADDED: 'added',
      MEMBER_BANNED: 'banned',
      MEMBER_UNBANNED: 'unbanned',
      MEMBER_KICKED: 'kicked',
      MEMBER_INVITED: 'invited',
      MEMBER_SCOPE_CHANGED: 'scopeChanged',
    },
    GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    CALL_STATUS: {
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
    CALL_MODE: {
      DEFAULT: 'default',
      GRID: 'grid',
      SINGLE: 'single',
      SPOTLIGHT: 'spotlight',
      TILE: 'tile',
    },
    GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
    ModerationStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      DISAPPROVED: 'disapproved',
      UNMODERATED: 'unmoderated',
    },
    MessageCategory: { AGENTIC: 'agentic' },
    AI_ASSISTANT_EVENTS: {
      RUN_STARTED: 'run_started',
      TEXT_MESSAGE_START: 'text_message_start',
      TEXT_MESSAGE_CONTENT: 'text_message_content',
      TEXT_MESSAGE_END: 'text_message_end',
      RUN_FINISHED: 'run_finished',
      TOOL_CALL_STARTED: 'tool_call_start',
      TOOL_CALL_ENDED: 'tool_call_end',
      TOOL_CALL_ARGUMENT: 'tool_call_args',
      TOOL_CALL_RESULT: 'tool_call_result',
    },
    AppSettingsBuilder: class {
      subscribePresenceForAllUsers() {
        return this;
      }
      subscribePresenceForFriends() {
        return this;
      }
      subscribePresenceForRoles() {
        return this;
      }
      setRegion() {
        return this;
      }
      autoEstablishSocketConnection() {
        return this;
      }
      overrideAdminHost() {
        return this;
      }
      overrideClientHost() {
        return this;
      }
      setStorageMode() {
        return this;
      }
      build() {
        return {};
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    ConversationUpdateSettings: class ConversationUpdateSettings {},
    StorageMode: { LOCAL: 'localStorage', NONE: 'none' },
    LoginListener: class LoginListener {
      constructor(public handlers: Record<string, unknown>) {}
    },
  },
}));

vi.mock('../CometChatCalls', () => ({
  CometChatUIKitCalls: null,
  loadCallsSDK: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../resources/CometChatLocalize/CometChatLocalize', () => {
  let sharedInstance: unknown = null;
  return {
    CometChatLocalize: class {
      static getSharedInstance() {
        return sharedInstance;
      }
      static setSharedInstance(inst: unknown) {
        sharedInstance = inst;
      }
      init() {}
    },
  };
});

// We need to access the CometChatUIKit class and reset its static state between tests.
// Since it uses private static fields, we'll use a workaround.
import { CometChatUIKit } from '../CometChatUIKit';
import { UIKitSettingsBuilder } from '../UIKitSettings';

function buildTestSettings() {
  return new UIKitSettingsBuilder()
    .setAppId('test-app-id')
    .setRegion('us')
    .setAuthKey('test-auth-key')
    .build();
}

describe('CometChatUIKit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConversationUpdateSettings.mockResolvedValue(null);
  });

  describe('init', () => {
    it('should call CometChat.init with app ID and settings', async () => {
      mockInit.mockResolvedValue(true);
      mockGetLoggedinUser.mockResolvedValue(null);

      const settings = buildTestSettings();
      await CometChatUIKit.init(settings);

      expect(mockInit).toHaveBeenCalledWith('test-app-id', expect.any(Object));
      expect(CometChatUIKit.isInitialized()).toBe(true);
    });

    it('should store settings after initialization', async () => {
      mockInit.mockResolvedValue(true);
      mockGetLoggedinUser.mockResolvedValue(null);

      const settings = buildTestSettings();
      await CometChatUIKit.init(settings);

      expect(CometChatUIKit.getSettings()).toBe(settings);
    });

    it('should resume existing session if user is logged in', async () => {
      const mockUser = { getUid: () => 'user1', getAuthToken: () => 'tok' };
      mockInit.mockResolvedValue(true);
      mockGetLoggedinUser.mockResolvedValue(mockUser);

      const settings = buildTestSettings();
      const result = await CometChatUIKit.init(settings);

      expect(result).toBe(mockUser);
      expect(CometChatUIKit.getLoggedInUser()).toBe(mockUser);
    });

    it('should return null if no existing session', async () => {
      mockInit.mockResolvedValue(true);
      mockGetLoggedinUser.mockResolvedValue(null);

      // Reset internal state by logging out first
      mockLogout.mockResolvedValue(undefined);
      await CometChatUIKit.logout();

      const settings = buildTestSettings();
      const result = await CometChatUIKit.init(settings);

      expect(result).toBeNull();
    });

    it('should set source for analytics', async () => {
      mockInit.mockResolvedValue(true);
      mockGetLoggedinUser.mockResolvedValue(null);

      await CometChatUIKit.init(buildTestSettings());

      expect(mockSetSource).toHaveBeenCalledWith('uikit-v7', 'web', 'reactjs');
    });
  });

  describe('initFromSettings', () => {
    const ssrSettings = {
      appId: 'test-app-id',
      region: 'us',
      credentials: { authKey: 'test-auth-key' },
      uiKit: {},
    } as unknown as CometChat.CometChatSettings;

    it('does not reference window when it is undefined (SSR/Node safe)', async () => {
      mockInitFromSettings.mockResolvedValue(true);
      mockGetLoggedinUser.mockResolvedValue(null);

      // Simulate a server environment (Next.js SSR / Node) with no `window`.
      const originalWindow = globalThis.window;
      (globalThis as { window?: unknown }).window = undefined;
      try {
        await expect(CometChatUIKit.initFromSettings(ssrSettings)).resolves.toBeNull();
        expect(mockInitFromSettings).toHaveBeenCalledWith(ssrSettings);
      } finally {
        (globalThis as { window?: unknown }).window = originalWindow;
      }
    });

    it('registers window metadata when window is available', async () => {
      mockInitFromSettings.mockResolvedValue(true);
      mockGetLoggedinUser.mockResolvedValue(null);

      await CometChatUIKit.initFromSettings(ssrSettings);

      expect((window as unknown as Record<string, unknown>).CometChatUiKit).toEqual({
        name: '@cometchat/chat-uikit-react',
        version: '7.0.3',
      });
    });
  });

  describe('login', () => {
    it('should call CometChat.login with uid and authKey', async () => {
      const mockUser = { getUid: () => 'user1', getAuthToken: () => 'tok' };
      mockLogin.mockResolvedValue(mockUser);
      mockGetLoggedinUser.mockResolvedValue(null);

      const result = await CometChatUIKit.login('user1');

      expect(mockLogin).toHaveBeenCalledWith('user1', 'test-auth-key');
      expect(result).toBe(mockUser);
      expect(CometChatUIKit.getLoggedInUser()).toBe(mockUser);
    });

    it('should reuse existing session if already logged in', async () => {
      const mockUser = { getUid: () => 'user1', getAuthToken: () => 'tok' };
      mockGetLoggedinUser.mockResolvedValue(mockUser);

      const result = await CometChatUIKit.login('user1');

      expect(mockLogin).not.toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });
  });

  describe('loginWithAuthToken', () => {
    it('should call CometChat.login with token', async () => {
      const mockUser = { getUid: () => 'user1', getAuthToken: () => 'tok' };
      mockLogin.mockResolvedValue(mockUser);

      const result = await CometChatUIKit.loginWithAuthToken('my-auth-token');

      expect(mockLogin).toHaveBeenCalledWith('my-auth-token');
      expect(result).toBe(mockUser);
    });
  });

  describe('logout', () => {
    it('should call CometChat.logout and clear user', async () => {
      mockLogout.mockResolvedValue(undefined);

      await CometChatUIKit.logout();

      expect(mockLogout).toHaveBeenCalled();
      expect(CometChatUIKit.getLoggedInUser()).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should call CometChat.createUser with user and authKey', async () => {
      const mockUser = { getUid: () => 'new-user' };
      mockCreateUser.mockResolvedValue(mockUser);

      const result = await CometChatUIKit.createUser(mockUser as any);

      expect(mockCreateUser).toHaveBeenCalledWith(mockUser, 'test-auth-key');
      expect(result).toBe(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should call CometChat.updateUser with user and authKey', async () => {
      const mockUser = { getUid: () => 'user1' };
      mockUpdateUser.mockResolvedValue(mockUser);

      const result = await CometChatUIKit.updateUser(mockUser as any);

      expect(mockUpdateUser).toHaveBeenCalledWith(mockUser, 'test-auth-key');
      expect(result).toBe(mockUser);
    });
  });

  describe('sendTextMessage', () => {
    it('should set muid and sentAt, then call CometChat.sendMessage', async () => {
      const mockMsg = {
        getMuid: () => '',
        setMuid: vi.fn(),
        getSentAt: () => 0,
        setSentAt: vi.fn(),
        getSender: () => ({ getUid: () => 'sender-uid' }),
      };
      mockSendMessage.mockResolvedValue(mockMsg);

      await CometChatUIKit.sendTextMessage(mockMsg as any);

      expect(mockMsg.setMuid).toHaveBeenCalled();
      expect(mockMsg.setSentAt).toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith(mockMsg);
    });

    it('should not override existing muid and sentAt', async () => {
      const mockMsg = {
        getMuid: () => 'existing-muid',
        setMuid: vi.fn(),
        getSentAt: () => 12345,
        setSentAt: vi.fn(),
        getSender: () => ({ getUid: () => 'sender-uid' }),
      };
      mockSendMessage.mockResolvedValue(mockMsg);

      await CometChatUIKit.sendTextMessage(mockMsg as any);

      expect(mockMsg.setMuid).not.toHaveBeenCalled();
      expect(mockMsg.setSentAt).not.toHaveBeenCalled();
    });
  });

  describe('sendMediaMessage', () => {
    it('should call CometChat.sendMediaMessage', async () => {
      const mockMsg = {
        getMuid: () => 'muid',
        setMuid: vi.fn(),
        getSentAt: () => 100,
        setSentAt: vi.fn(),
        getSender: () => ({ getUid: () => 'sender-uid' }),
      };
      mockSendMediaMessage.mockResolvedValue(mockMsg);

      await CometChatUIKit.sendMediaMessage(mockMsg as any);

      expect(mockSendMediaMessage).toHaveBeenCalledWith(mockMsg);
    });
  });

  describe('sendCustomMessage', () => {
    it('should call CometChat.sendCustomMessage', async () => {
      const mockMsg = {
        getMuid: () => 'muid',
        setMuid: vi.fn(),
        getSentAt: () => 100,
        setSentAt: vi.fn(),
        getSender: () => ({ getUid: () => 'sender-uid' }),
      };
      mockSendCustomMessage.mockResolvedValue(mockMsg);

      await CometChatUIKit.sendCustomMessage(mockMsg as any);

      expect(mockSendCustomMessage).toHaveBeenCalledWith(mockMsg);
    });
  });

  describe('static getters', () => {
    it('isCallingReady should return boolean', () => {
      expect(typeof CometChatUIKit.isCallingReady()).toBe('boolean');
    });

    it('getConversationUpdateSettings should return settings or null', () => {
      const result = CometChatUIKit.getConversationUpdateSettings();
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
});
