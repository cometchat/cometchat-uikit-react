import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock the SDK (type-only import in source, but mock keeps it safe) ---
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
  },
}));

// --- Mock the markdown formatter so copyOption doesn't pull heavy deps ---
const mockFormat = vi.fn((text: string) => `<p>${text}</p>`);
vi.mock('../../../../formatters/CometChatMarkdownFormatter', () => ({
  CometChatMarkdownFormatter: vi.fn().mockImplementation(() => ({
    format: mockFormat,
  })),
}));

// --- Mock translation util so translateOption is deterministic ---
const mockTranslateMessage = vi.fn();
vi.mock('../../../../utils/CometChatTranslationUtils', () => ({
  translateMessage: (...args: unknown[]) => mockTranslateMessage(...args),
}));

import {
  getMediaMessageOptions,
  getTextMessageOptions,
  MESSAGE_OPTION_IDS,
} from '../CometChatMessageOptions';
import {
  buildUser,
  buildTextMessage,
  buildMediaMessage,
  buildGroup,
} from '../../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessagePluginContext, CometChatMessageOption } from '../../../plugin.types';

// --- Helpers ---

const ME = 'me-1';
const OTHER = 'other-2';

function loggedInUser() {
  return buildUser({ uid: ME, name: 'Me' }) as unknown as CometChat.User;
}

function createContext(
  overrides: Partial<CometChatMessagePluginContext> = {}
): CometChatMessagePluginContext {
  return {
    loggedInUser: loggedInUser(),
    alignment: 'right',
    theme: 'light',
    // showMarkAsUnreadOption defaults to undefined → markAsUnread filtered out unless set
    ...overrides,
  };
}

function ownTextMessage(over: Record<string, unknown> = {}) {
  return buildTextMessage({
    sender: buildUser({ uid: ME, name: 'Me' }),
    ...over,
  }) as unknown as CometChat.BaseMessage;
}

function othersTextMessage(over: Record<string, unknown> = {}) {
  return buildTextMessage({
    sender: buildUser({ uid: OTHER, name: 'Other' }),
    ...over,
  }) as unknown as CometChat.BaseMessage;
}

function othersMediaMessage(over: Record<string, unknown> = {}) {
  return buildMediaMessage({
    sender: buildUser({ uid: OTHER, name: 'Other' }),
    ...over,
  }) as unknown as CometChat.BaseMessage;
}

function ids(options: CometChatMessageOption[]): string[] {
  return options.map(o => o.id);
}

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom provides `navigator` but not a clipboard implementation; stub it.
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: {
      write: vi.fn().mockResolvedValue(undefined),
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

// ──────────────────────────────────────────────────────────────────────────

describe('CometChatMessageOptions - MESSAGE_OPTION_IDS', () => {
  it('exposes the expected option id constants', () => {
    expect(MESSAGE_OPTION_IDS.react).toBe('react');
    expect(MESSAGE_OPTION_IDS.reply).toBe('reply');
    expect(MESSAGE_OPTION_IDS.replyInThread).toBe('reply-in-thread');
    expect(MESSAGE_OPTION_IDS.copy).toBe('copy');
    expect(MESSAGE_OPTION_IDS.edit).toBe('edit');
    expect(MESSAGE_OPTION_IDS.delete).toBe('delete');
    expect(MESSAGE_OPTION_IDS.messageInfo).toBe('message-info');
    expect(MESSAGE_OPTION_IDS.flag).toBe('flag');
    expect(MESSAGE_OPTION_IDS.sendPrivately).toBe('send-privately');
    expect(MESSAGE_OPTION_IDS.markAsUnread).toBe('mark-as-unread');
    expect(MESSAGE_OPTION_IDS.translate).toBe('translate');
  });
});

describe('getTextMessageOptions', () => {
  it('returns an array with titles, ids and icons', () => {
    const options = getTextMessageOptions(ownTextMessage(), createContext());
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) {
      expect(typeof o.id).toBe('string');
      expect(typeof o.title).toBe('string');
      expect(o.iconURL).toBeTruthy();
      expect(typeof o.onClick).toBe('function');
    }
  });

  describe('sender vs receiver filtering (1:1 chat)', () => {
    it('own message includes senderOnly options (edit/delete/info) and excludes receiverOnly (flag/mark unread)', () => {
      const options = getTextMessageOptions(ownTextMessage(), createContext());
      const got = ids(options);
      expect(got).toContain(MESSAGE_OPTION_IDS.edit);
      expect(got).toContain(MESSAGE_OPTION_IDS.delete);
      expect(got).toContain(MESSAGE_OPTION_IDS.messageInfo);
      // receiverOnly options must be absent for own message
      expect(got).not.toContain(MESSAGE_OPTION_IDS.flag);
      expect(got).not.toContain(MESSAGE_OPTION_IDS.markAsUnread);
      expect(got).not.toContain(MESSAGE_OPTION_IDS.sendPrivately);
    });

    it("other's message excludes senderOnly options and includes receiverOnly flag", () => {
      const options = getTextMessageOptions(othersTextMessage(), createContext());
      const got = ids(options);
      expect(got).not.toContain(MESSAGE_OPTION_IDS.edit);
      expect(got).not.toContain(MESSAGE_OPTION_IDS.delete);
      expect(got).not.toContain(MESSAGE_OPTION_IDS.messageInfo);
      expect(got).toContain(MESSAGE_OPTION_IDS.flag);
    });

    it('always includes non-restricted options react/reply/copy/translate', () => {
      const options = getTextMessageOptions(othersTextMessage(), createContext());
      const got = ids(options);
      expect(got).toContain(MESSAGE_OPTION_IDS.react);
      expect(got).toContain(MESSAGE_OPTION_IDS.reply);
      expect(got).toContain(MESSAGE_OPTION_IDS.copy);
      expect(got).toContain(MESSAGE_OPTION_IDS.translate);
    });
  });

  describe('group-only filtering (sendPrivately)', () => {
    it("excludes sendPrivately in 1:1 chat for other's message", () => {
      const options = getTextMessageOptions(othersTextMessage(), createContext());
      expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.sendPrivately);
    });

    it("includes sendPrivately in a group for other's message", () => {
      const ctx = createContext({ group: buildGroup() as unknown as CometChat.Group });
      const options = getTextMessageOptions(othersTextMessage(), ctx);
      expect(ids(options)).toContain(MESSAGE_OPTION_IDS.sendPrivately);
    });

    it('excludes sendPrivately in a group for own message (receiverOnly)', () => {
      const ctx = createContext({ group: buildGroup() as unknown as CometChat.Group });
      const options = getTextMessageOptions(ownTextMessage(), ctx);
      expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.sendPrivately);
    });
  });

  describe('thread filtering (replyInThread)', () => {
    it('includes replyInThread for a top-level message', () => {
      const options = getTextMessageOptions(
        ownTextMessage({ parentMessageId: 0 }),
        createContext()
      );
      expect(ids(options)).toContain(MESSAGE_OPTION_IDS.replyInThread);
    });

    it('excludes replyInThread for a message already in a thread', () => {
      const options = getTextMessageOptions(
        ownTextMessage({ parentMessageId: 42 }),
        createContext()
      );
      expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.replyInThread);
    });
  });

  describe('mark-as-unread toggle', () => {
    it("excludes markAsUnread by default for other's message", () => {
      const options = getTextMessageOptions(othersTextMessage(), createContext());
      expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.markAsUnread);
    });

    it("includes markAsUnread for other's message when showMarkAsUnreadOption is true", () => {
      const ctx = createContext({ showMarkAsUnreadOption: true });
      const options = getTextMessageOptions(othersTextMessage(), ctx);
      expect(ids(options)).toContain(MESSAGE_OPTION_IDS.markAsUnread);
    });

    it('still excludes markAsUnread for own message (receiverOnly) even when enabled', () => {
      const ctx = createContext({ showMarkAsUnreadOption: true });
      const options = getTextMessageOptions(ownTextMessage(), ctx);
      expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.markAsUnread);
    });
  });

  describe('hide* toggles', () => {
    const cases: [keyof CometChatMessagePluginContext, string, () => CometChat.BaseMessage][] = [
      ['hideReplyOption', MESSAGE_OPTION_IDS.reply, ownTextMessage],
      ['hideReplyInThreadOption', MESSAGE_OPTION_IDS.replyInThread, ownTextMessage],
      ['hideEditMessageOption', MESSAGE_OPTION_IDS.edit, ownTextMessage],
      ['hideDeleteMessageOption', MESSAGE_OPTION_IDS.delete, ownTextMessage],
      ['hideCopyMessageOption', MESSAGE_OPTION_IDS.copy, ownTextMessage],
      ['hideReactionOption', MESSAGE_OPTION_IDS.react, ownTextMessage],
      ['hideMessageInfoOption', MESSAGE_OPTION_IDS.messageInfo, ownTextMessage],
      ['hideFlagMessageOption', MESSAGE_OPTION_IDS.flag, othersTextMessage],
      ['hideTranslateMessageOption', MESSAGE_OPTION_IDS.translate, ownTextMessage],
    ];

    it.each(cases)('%s removes the %s option', (toggle, optionId, makeMessage) => {
      const visible = getTextMessageOptions(makeMessage(), createContext());
      expect(ids(visible)).toContain(optionId);

      const hidden = getTextMessageOptions(
        makeMessage(),
        createContext({ [toggle]: true } as Partial<CometChatMessagePluginContext>)
      );
      expect(ids(hidden)).not.toContain(optionId);
    });

    it('hideMessagePrivatelyOption removes sendPrivately in a group', () => {
      const group = buildGroup() as unknown as CometChat.Group;
      const visible = getTextMessageOptions(othersTextMessage(), createContext({ group }));
      expect(ids(visible)).toContain(MESSAGE_OPTION_IDS.sendPrivately);

      const hidden = getTextMessageOptions(
        othersTextMessage(),
        createContext({ group, hideMessagePrivatelyOption: true })
      );
      expect(ids(hidden)).not.toContain(MESSAGE_OPTION_IDS.sendPrivately);
    });
  });
});

describe('getMediaMessageOptions', () => {
  it('does NOT include copy/edit/translate (media-only set)', () => {
    const got = ids(getMediaMessageOptions(ownTextMessage(), createContext()));
    expect(got).not.toContain(MESSAGE_OPTION_IDS.copy);
    expect(got).not.toContain(MESSAGE_OPTION_IDS.edit);
    expect(got).not.toContain(MESSAGE_OPTION_IDS.translate);
  });

  it('own media message includes delete & info, excludes flag', () => {
    const own = buildMediaMessage({
      sender: buildUser({ uid: ME }),
    }) as unknown as CometChat.BaseMessage;
    const got = ids(getMediaMessageOptions(own, createContext()));
    expect(got).toContain(MESSAGE_OPTION_IDS.delete);
    expect(got).toContain(MESSAGE_OPTION_IDS.messageInfo);
    expect(got).not.toContain(MESSAGE_OPTION_IDS.flag);
  });

  it("other's media message includes react/reply/flag, excludes delete", () => {
    const got = ids(getMediaMessageOptions(othersMediaMessage(), createContext()));
    expect(got).toContain(MESSAGE_OPTION_IDS.react);
    expect(got).toContain(MESSAGE_OPTION_IDS.reply);
    expect(got).toContain(MESSAGE_OPTION_IDS.flag);
    expect(got).not.toContain(MESSAGE_OPTION_IDS.delete);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// onClick behaviour — exercises the factory callbacks (branch coverage)
// ──────────────────────────────────────────────────────────────────────────

function findOption(options: CometChatMessageOption[], id: string): CometChatMessageOption {
  const opt = options.find(o => o.id === id);
  if (!opt) throw new Error(`option ${id} not found`);
  return opt;
}

describe('option onClick handlers', () => {
  it('react -> calls onReactToMessage', () => {
    const onReactToMessage = vi.fn();
    const ctx = createContext({ onReactToMessage });
    const msg = ownTextMessage();
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.react).onClick(msg);
    expect(onReactToMessage).toHaveBeenCalledWith(msg);
  });

  it('reply -> publishes reply event and calls onReplyMessage', () => {
    const publish = vi.fn();
    const onReplyMessage = vi.fn();
    const ctx = createContext({ publish, onReplyMessage });
    const msg = ownTextMessage({ parentMessageId: 7 });
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.reply).onClick(msg);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui:compose/reply', message: msg, parentMessageId: 7 })
    );
    expect(onReplyMessage).toHaveBeenCalledWith(msg);
  });

  it('reply -> parentMessageId null when message has no parent', () => {
    const publish = vi.fn();
    const ctx = createContext({ publish });
    const msg = ownTextMessage({ parentMessageId: 0 });
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.reply).onClick(msg);
    expect(publish).toHaveBeenCalledWith(expect.objectContaining({ parentMessageId: null }));
  });

  it('replyInThread -> calls onThreadClick', () => {
    const onThreadClick = vi.fn();
    const ctx = createContext({ onThreadClick });
    const msg = ownTextMessage();
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.replyInThread).onClick(msg);
    expect(onThreadClick).toHaveBeenCalledWith(msg);
  });

  it('edit -> publishes edit event and calls onEditMessage', () => {
    const publish = vi.fn();
    const onEditMessage = vi.fn();
    const ctx = createContext({ publish, onEditMessage });
    const msg = ownTextMessage();
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.edit).onClick(msg);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui:compose/edit', message: msg })
    );
    expect(onEditMessage).toHaveBeenCalledWith(msg);
  });

  it('delete -> calls onDeleteMessage', () => {
    const onDeleteMessage = vi.fn();
    const ctx = createContext({ onDeleteMessage });
    const msg = ownTextMessage();
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.delete).onClick(msg);
    expect(onDeleteMessage).toHaveBeenCalledWith(msg);
  });

  it('message-info -> calls onMessageInfo', () => {
    const onMessageInfo = vi.fn();
    const ctx = createContext({ onMessageInfo });
    const msg = ownTextMessage();
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.messageInfo).onClick(msg);
    expect(onMessageInfo).toHaveBeenCalledWith(msg);
  });

  it('flag -> calls onFlagMessage', () => {
    const onFlagMessage = vi.fn();
    const ctx = createContext({ onFlagMessage });
    const msg = othersTextMessage();
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.flag).onClick(msg);
    expect(onFlagMessage).toHaveBeenCalledWith(msg);
  });

  it('mark-as-unread -> calls onMarkAsUnread', () => {
    const onMarkAsUnread = vi.fn();
    const ctx = createContext({ onMarkAsUnread, showMarkAsUnreadOption: true });
    const msg = othersTextMessage();
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.markAsUnread).onClick(msg);
    expect(onMarkAsUnread).toHaveBeenCalledWith(msg);
  });

  it('send-privately -> publishes ui:open-chat with the sender', () => {
    const publish = vi.fn();
    const sender = buildUser({ uid: OTHER, name: 'Other' });
    const ctx = createContext({
      publish,
      group: buildGroup() as unknown as CometChat.Group,
    });
    const msg = buildTextMessage({ sender }) as unknown as CometChat.BaseMessage;
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.sendPrivately).onClick(msg);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui:open-chat', user: sender })
    );
  });

  it('option handlers are safe when optional callbacks are absent', () => {
    const ctx = createContext(); // no callbacks
    const msg = ownTextMessage();
    const options = getTextMessageOptions(msg, ctx);
    // none of these should throw despite undefined callbacks
    for (const id of [
      MESSAGE_OPTION_IDS.react,
      MESSAGE_OPTION_IDS.replyInThread,
      MESSAGE_OPTION_IDS.edit,
      MESSAGE_OPTION_IDS.delete,
      MESSAGE_OPTION_IDS.messageInfo,
    ]) {
      const opt = options.find(o => o.id === id);
      if (opt) expect(() => opt.onClick(msg)).not.toThrow();
    }
  });
});

describe('copy option onClick', () => {
  it('shows a toast and resolves mentions before copying', () => {
    const showToast = vi.fn();
    const mentioned = buildUser({ uid: 'alice', name: 'Alice' });
    const ctx = createContext({ showToast });
    const msg = buildTextMessage({
      sender: buildUser({ uid: ME }),
      text: 'Hi <@uid:alice> and <@all:team>',
    });
    // override mentioned users on the mock
    (msg as unknown as { getMentionedUsers: () => unknown[] }).getMentionedUsers = () => [
      mentioned,
    ];
    findOption(
      getTextMessageOptions(msg as unknown as CometChat.BaseMessage, ctx),
      MESSAGE_OPTION_IDS.copy
    ).onClick(msg as unknown as CometChat.BaseMessage);

    // The markdown formatter is invoked on resolved text
    expect(mockFormat).toHaveBeenCalled();
    const formatted = mockFormat.mock.calls[0][0];
    expect(formatted).toContain('@Alice');
    expect(formatted).toContain('@team');
    expect(showToast).toHaveBeenCalled();
  });

  it('handles a message with no mentions without throwing', () => {
    const showToast = vi.fn();
    const ctx = createContext({ showToast });
    const msg = ownTextMessage({ text: 'plain **bold** text' });
    expect(() =>
      findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.copy).onClick(msg)
    ).not.toThrow();
    expect(mockFormat).toHaveBeenCalled();
  });

  it('escapes raw HTML before building the clipboard HTML (XSS prevention)', () => {
    // Capture the text/html handed to Blob and enable the ClipboardItem path.
    const htmlParts: string[] = [];
    const globalRef = globalThis as unknown as {
      Blob: typeof Blob;
      ClipboardItem?: unknown;
    };
    const RealBlob = globalRef.Blob;
    const prevClipboardItem = globalRef.ClipboardItem;
    globalRef.Blob = class extends RealBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        if (opts?.type === 'text/html') htmlParts.push(parts.map(String).join(''));
      }
    } as typeof Blob;
    globalRef.ClipboardItem = class {
      constructor(public parts: Record<string, Blob>) {}
    };
    try {
      const ctx = createContext({ showToast: vi.fn() });
      const msg = ownTextMessage({ text: '<img src=x onerror=alert(1)>' });
      findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.copy).onClick(msg);

      const arg = mockFormat.mock.calls.at(-1)?.[0];
      expect(arg).not.toMatch(/<img/i);
      expect(arg).toContain('&lt;img');

      expect(htmlParts.at(-1)).toBeDefined();
      expect(htmlParts.at(-1)).not.toMatch(/<img/i);
    } finally {
      globalRef.Blob = RealBlob;
      globalRef.ClipboardItem = prevClipboardItem;
    }
  });
});

describe('translate option onClick', () => {
  it('shows already-translated toast when language is the same', async () => {
    mockTranslateMessage.mockResolvedValue({ isSameLanguage: true, translatedText: '' });
    const showToast = vi.fn();
    const ctx = createContext({ showToast });
    const msg = ownTextMessage();
    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.translate).onClick(msg);
    await vi.waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(mockTranslateMessage).toHaveBeenCalled();
  });

  it('sets translated metadata and publishes edit event on success', async () => {
    mockTranslateMessage.mockResolvedValue({
      isSameLanguage: false,
      translatedText: 'Hola',
    });
    const showToast = vi.fn();
    const publish = vi.fn();
    const ctx = createContext({ showToast, publish });
    const setMetadata = vi.fn();
    const msg = ownTextMessage();
    (msg as unknown as { setMetadata: typeof setMetadata }).setMetadata = setMetadata;

    findOption(getTextMessageOptions(msg, ctx), MESSAGE_OPTION_IDS.translate).onClick(msg);

    await vi.waitFor(() => expect(publish).toHaveBeenCalled());
    expect(setMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ translated_message: 'Hola' })
    );
    expect(publish).toHaveBeenCalledWith(expect.objectContaining({ type: 'message/edited' }));
    expect(showToast).toHaveBeenCalled();
  });
});

describe('localization (loc helper)', () => {
  it('uses getLocalizedString when it returns a real translation', () => {
    const getLocalizedString = vi.fn((key: string) =>
      key === 'message_list_option_react' ? 'Reagieren' : key
    );
    const options = getTextMessageOptions(ownTextMessage(), createContext({ getLocalizedString }));
    expect(findOption(options, MESSAGE_OPTION_IDS.react).title).toBe('Reagieren');
  });

  it('falls back to default label when localization returns the key unchanged', () => {
    const getLocalizedString = vi.fn((key: string) => key);
    const options = getTextMessageOptions(ownTextMessage(), createContext({ getLocalizedString }));
    expect(findOption(options, MESSAGE_OPTION_IDS.react).title).toBe('React');
  });

  it('uses default labels when no getLocalizedString is provided', () => {
    const options = getTextMessageOptions(ownTextMessage(), createContext());
    expect(findOption(options, MESSAGE_OPTION_IDS.reply).title).toBe('Reply');
    expect(findOption(options, MESSAGE_OPTION_IDS.copy).title).toBe('Copy');
  });
});
