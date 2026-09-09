/**
 * Pin/Save option surfacing: feature flags × SBAC × eligibility × layout.
 *
 * These options are only ever built when the feature flags resolve true, so every
 * test here enables them explicitly — the default-off path is asserted separately.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { getTextMessageOptions, MESSAGE_OPTION_IDS } from '../CometChatMessageOptions';
import { resolvePinSaveFeatures, resetPinSaveFeatures } from '../../../../utils/pinSaveFeatures';
import { buildUser, buildTextMessage, buildGroup } from '../../../../testing/mock-builders';
import type { CometChatMessagePluginContext, CometChatMessageOption } from '../../../plugin.types';

const ME = 'me-1';
const OTHER = 'other-2';

function createContext(
  overrides: Partial<CometChatMessagePluginContext> = {}
): CometChatMessagePluginContext {
  return {
    loggedInUser: buildUser({ uid: ME, name: 'Me' }) as unknown as CometChat.User,
    alignment: 'right',
    theme: 'light',
    ...overrides,
  };
}

function message(over: Record<string, unknown> = {}) {
  return buildTextMessage({
    sender: buildUser({ uid: OTHER, name: 'Other' }),
    ...over,
  }) as unknown as CometChat.BaseMessage;
}

/** Give the message SDK-accurate pin/save accessors. */
function withPinSave(
  msg: CometChat.BaseMessage,
  state: { pinnedAt?: number; savedAt?: number }
): CometChat.BaseMessage {
  const target = msg as unknown as Record<string, unknown>;
  target.getPinnedAt = () => state.pinnedAt;
  target.getSavedAt = () => state.savedAt;
  target.isPinned = () => state.pinnedAt !== undefined;
  target.isSaved = () => state.savedAt !== undefined;
  return msg;
}

function ids(options: CometChatMessageOption[]): string[] {
  return options.map(o => o.id);
}

function findOrganize(options: CometChatMessageOption[]): CometChatMessageOption | undefined {
  return options.find(o => o.id === MESSAGE_OPTION_IDS.organize);
}

async function enableFeatures(pin: boolean, save: boolean) {
  resetPinSaveFeatures();
  vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(pin);
  vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(save);
  // Not exercised here, but it must be stubbed or resolution hangs on a real call.
  vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(false);
  await resolvePinSaveFeatures();
}

/** An admin-scoped group, so pin is permitted. */
function adminGroup() {
  const g = buildGroup() as unknown as CometChat.Group;
  (g as unknown as Record<string, unknown>).getScope = () => CometChat.GROUP_MEMBER_SCOPE.ADMIN;
  (g as unknown as Record<string, unknown>).getOwner = () => 'someone-else';
  return g;
}

function participantGroup() {
  const g = buildGroup() as unknown as CometChat.Group;
  (g as unknown as Record<string, unknown>).getScope = () =>
    CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
  (g as unknown as Record<string, unknown>).getOwner = () => 'someone-else';
  return g;
}

beforeEach(() => {
  resetPinSaveFeatures();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetPinSaveFeatures();
});

describe('feature flags', () => {
  it('surfaces nothing while the flags are unresolved (default off)', () => {
    const options = getTextMessageOptions(withPinSave(message(), {}), createContext());
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.organize);
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.pinMessage);
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.saveMessage);
  });

  it('nests pin + save under Organize when both flags are on', async () => {
    await enableFeatures(true, true);
    const options = getTextMessageOptions(withPinSave(message(), {}), createContext());
    const organize = findOrganize(options);
    expect(organize).toBeDefined();
    expect(organize?.submenu?.map(o => o.id)).toEqual([
      MESSAGE_OPTION_IDS.pinMessage,
      MESSAGE_OPTION_IDS.saveMessage,
    ]);
  });

  it('offers Save flat — never a one-item Organize — when only Save is enabled', async () => {
    await enableFeatures(false, true);
    const options = getTextMessageOptions(withPinSave(message(), {}), createContext());
    expect(ids(options)).toContain(MESSAGE_OPTION_IDS.saveMessage);
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.organize);
  });

  it('offers Pin flat when only Pin is enabled', async () => {
    await enableFeatures(true, false);
    const options = getTextMessageOptions(withPinSave(message(), {}), createContext());
    expect(ids(options)).toContain(MESSAGE_OPTION_IDS.pinMessage);
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.organize);
  });
});

describe('flags supplied via plugin context (the render-path source)', () => {
  // The renderer passes resolved flags down so a resolution landing after first
  // paint recomputes the memoized options. Reading only the module cache meant
  // the options never appeared at all — the gate was built but never armed.
  it('surfaces options from context even when the module cache is empty', () => {
    resetPinSaveFeatures();
    const options = getTextMessageOptions(
      withPinSave(message(), {}),
      createContext({ pinSaveFeatures: { pinMessage: true, saveMessage: true } })
    );
    expect(findOrganize(options)).toBeDefined();
  });

  it('context wins over the module cache', async () => {
    await enableFeatures(true, true);
    const options = getTextMessageOptions(
      withPinSave(message(), {}),
      createContext({ pinSaveFeatures: { pinMessage: false, saveMessage: false } })
    );
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.organize);
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.pinMessage);
  });

  it('falls back to the module cache when context omits the flags', async () => {
    await enableFeatures(true, true);
    const options = getTextMessageOptions(withPinSave(message(), {}), createContext());
    expect(findOrganize(options)).toBeDefined();
  });
});

describe('current state decides which of each pair is offered', () => {
  beforeEach(async () => {
    await enableFeatures(true, true);
  });

  it('offers Unpin, not Pin, on a pinned message', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), { pinnedAt: 123 }),
      createContext()
    );
    const sub = findOrganize(options)?.submenu?.map(o => o.id) ?? [];
    expect(sub).toContain(MESSAGE_OPTION_IDS.unpinMessage);
    expect(sub).not.toContain(MESSAGE_OPTION_IDS.pinMessage);
  });

  it('offers Unsave, not Save, on a saved message', () => {
    const options = getTextMessageOptions(withPinSave(message(), { savedAt: 5 }), createContext());
    const sub = findOrganize(options)?.submenu?.map(o => o.id) ?? [];
    expect(sub).toContain(MESSAGE_OPTION_IDS.unsaveMessage);
    expect(sub).not.toContain(MESSAGE_OPTION_IDS.saveMessage);
  });

  it('offers Unpin + Unsave when both are already set', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), { pinnedAt: 1, savedAt: 2 }),
      createContext()
    );
    expect(findOrganize(options)?.submenu?.map(o => o.id)).toEqual([
      MESSAGE_OPTION_IDS.unpinMessage,
      MESSAGE_OPTION_IDS.unsaveMessage,
    ]);
  });
});

describe('pin/unpin is offered to every member — the server enforces the role gate', () => {
  beforeEach(async () => {
    await enableFeatures(true, true);
  });

  it('a group admin gets Pin', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), {}),
      createContext({ group: adminGroup() })
    );
    expect(findOrganize(options)?.submenu?.map(o => o.id)).toContain(MESSAGE_OPTION_IDS.pinMessage);
  });

  it('a participant ALSO gets Pin now — nested with Save under Organize (no client gate)', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), {}),
      createContext({ group: participantGroup() })
    );
    expect(findOrganize(options)?.submenu?.map(o => o.id)).toEqual([
      MESSAGE_OPTION_IDS.pinMessage,
      MESSAGE_OPTION_IDS.saveMessage,
    ]);
  });

  it('a participant gets Unpin on a pinned message', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), { pinnedAt: 9 }),
      createContext({ group: participantGroup() })
    );
    expect(findOrganize(options)?.submenu?.map(o => o.id)).toContain(
      MESSAGE_OPTION_IDS.unpinMessage
    );
  });

  it('a participant still gets Unsave on a saved message (nested with Pin)', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), { savedAt: 9 }),
      createContext({ group: participantGroup() })
    );
    expect(findOrganize(options)?.submenu?.map(o => o.id)).toContain(
      MESSAGE_OPTION_IDS.unsaveMessage
    );
  });

  it('1-1 conversations offer pin — the server is the backstop', () => {
    const options = getTextMessageOptions(withPinSave(message(), {}), createContext());
    expect(findOrganize(options)?.submenu?.map(o => o.id)).toContain(MESSAGE_OPTION_IDS.pinMessage);
  });
});

describe('eligibility', () => {
  beforeEach(async () => {
    await enableFeatures(true, true);
  });

  it('excludes a deleted message', () => {
    const msg = withPinSave(message(), {});
    (msg as unknown as Record<string, unknown>).getDeletedAt = () => 1735689600;
    const options = getTextMessageOptions(msg, createContext());
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.organize);
  });

  it('excludes an optimistic message with no server id', () => {
    const msg = withPinSave(message(), {});
    (msg as unknown as Record<string, unknown>).getId = () => 0;
    const options = getTextMessageOptions(msg, createContext());
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.organize);
  });

  it('includes a thread reply — replies are pinnable and savable', () => {
    const msg = withPinSave(message(), {});
    (msg as unknown as Record<string, unknown>).getParentMessageId = () => 77;
    const options = getTextMessageOptions(msg, createContext());
    expect(findOrganize(options)).toBeDefined();
  });
});

describe('layout', () => {
  beforeEach(async () => {
    await enableFeatures(true, true);
  });

  it('flat layout surfaces both options top-level with no Organize wrapper', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), {}),
      createContext({ optionsLayout: 'flat' })
    );
    expect(ids(options)).toContain(MESSAGE_OPTION_IDS.pinMessage);
    expect(ids(options)).toContain(MESSAGE_OPTION_IDS.saveMessage);
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.organize);
  });

  it('Organize sits after Edit and before Translate', () => {
    // Own message so Edit is present.
    const own = withPinSave(
      buildTextMessage({
        sender: buildUser({ uid: ME, name: 'Me' }),
      }) as unknown as CometChat.BaseMessage,
      {}
    );
    const order = ids(getTextMessageOptions(own, createContext()));
    expect(order.indexOf(MESSAGE_OPTION_IDS.organize)).toBeGreaterThan(
      order.indexOf(MESSAGE_OPTION_IDS.edit)
    );
    expect(order.indexOf(MESSAGE_OPTION_IDS.organize)).toBeLessThan(
      order.indexOf(MESSAGE_OPTION_IDS.translate)
    );
  });

  it('the Organize row is a disclosure — its onClick does nothing', () => {
    const context = createContext();
    const onPin = vi.fn();
    context.onPinMessage = onPin;
    const options = getTextMessageOptions(withPinSave(message(), {}), context);
    const organize = findOrganize(options);
    organize?.onClick(message());
    expect(onPin).not.toHaveBeenCalled();
  });
});

describe('hide* toggles', () => {
  beforeEach(async () => {
    await enableFeatures(true, true);
  });

  it('hidePinMessageOption leaves Save flat', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), {}),
      createContext({ hidePinMessageOption: true })
    );
    expect(ids(options)).toContain(MESSAGE_OPTION_IDS.saveMessage);
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.pinMessage);
  });

  it('hiding both removes Organize entirely', () => {
    const options = getTextMessageOptions(
      withPinSave(message(), {}),
      createContext({ hidePinMessageOption: true, hideSaveMessageOption: true })
    );
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.organize);
    expect(ids(options)).not.toContain(MESSAGE_OPTION_IDS.saveMessage);
  });
});

describe('option callbacks', () => {
  beforeEach(async () => {
    await enableFeatures(true, true);
  });

  it('each leaf delegates to its plugin-context callback', () => {
    const onPinMessage = vi.fn();
    const onSaveMessage = vi.fn();
    const context = createContext({ onPinMessage, onSaveMessage });
    const msg = withPinSave(message(), {});

    const sub = findOrganize(getTextMessageOptions(msg, context))?.submenu ?? [];
    sub.find(o => o.id === MESSAGE_OPTION_IDS.pinMessage)?.onClick(msg);
    sub.find(o => o.id === MESSAGE_OPTION_IDS.saveMessage)?.onClick(msg);

    expect(onPinMessage).toHaveBeenCalledWith(msg);
    expect(onSaveMessage).toHaveBeenCalledWith(msg);
  });
});
