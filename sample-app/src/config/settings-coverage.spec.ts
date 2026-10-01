import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_DOCKED_CLOSE_ICON,
  DEFAULT_DOCKED_OPEN_ICON,
  defaultSettings,
  dockedToggleIcon,
  storedSettingsDefaults,
  resolveSettings,
} from './defaultSettings';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(here, '..');

/**
 * Settings that intentionally have no effect inside the sample app.
 *
 * These belong to the builder shell, the no-code widget, or the theming layer — all of which
 * live outside `sample-app/`. Listing them here is deliberate: an unlisted, unwired key is a
 * bug (a builder toggle that silently does nothing), so this list should be read before it is
 * added to.
 */
const NOT_SAMPLE_APP_CONCERNS = new Set([
  // Theming — applied by the builder writing CSS variables onto `.cometchat[data-theme]`.
  // `font`/`size` are read by each consumer's useBuilderTheme, never by the sample app; they
  // only passed the old check because `size` also matches `size="large"` on CometChatAvatar.
  'font',
  'size',
  // `theme` belongs here for the same reason, and was missing: it appeared wired only because
  // `App.tsx` reads `props.theme`, which is its own mount-time prop — `index.tsx` fills it from
  // `getBrowserTheme()`, not from settings. The consumers are what read `style.theme`
  // (`uikit-builder-app-lowcode/src/App.tsx`), exactly as they do for the colours below.
  'theme',
  'brandColor',
  'primaryTextLight',
  'primaryTextDark',
  'secondaryTextLight',
  'secondaryTextDark',
  // No-code widget chrome — consumed by @cometchat/chat-embed only.
  'docked',
  'buttonBackGround',
  'buttonShape',
  'openIcon',
  'closeIcon',
  'customJs',
  'customCss',
  'dockedAlignment',
  // AI agent shell — rendered by the builder's agent view, not the sample app.
  'chatHistory',
  'newChat',
  'agentIcon',
  'showAgentIcon',
  // Only meaningful alongside a default chat id, which the no-code widget supplies at runtime
  // (`renderComponent({ defaultChatID, chatType })`). The sample app has no equivalent entry
  // point — it always opens on the conversation list.
  'chatType',
]);

/** Every `.ts`/`.tsx` file under `sample-app/src`, excluding the schema and defaults themselves. */
function collectSources(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'locales' || entry === 'assets') continue;
      collectSources(full, acc);
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;
    if (/settings\.types\.ts$|defaultSettings\.ts$|settings-coverage\.spec\.ts$/.test(full))
      continue;
    acc.push(full);
  }
  return acc;
}

/**
 * Leaf setting names declared in the schema.
 *
 * A property is a leaf when its type doesn't reference another interface in the file — that
 * covers `boolean`, `string`, unions like `'left' | 'right' | string`, and `TabName[]`, while
 * skipping the grouping objects. `CometChatBuilderConfig` is excluded: it's the transport
 * envelope (`builderId`, `settings`), not a feature toggle.
 */
function leafSettingKeys(): string[] {
  const schema = readFileSync(join(here, 'settings.types.ts'), 'utf8');

  const interfaceNames = new Set([...schema.matchAll(/^export interface (\w+)/gm)].map(m => m[1]));

  const keys = new Set<string>();
  for (const block of schema.matchAll(/^export interface (\w+)[^{]*\{([\s\S]*?)^\}/gm)) {
    const [, name, body] = block;
    if (name === 'CometChatBuilderConfig') continue;
    for (const prop of body.matchAll(/^\s+(\w+)\??:\s*([^;]+);/gm)) {
      const [, key, type] = prop;
      const referencesInterface = [...interfaceNames].some(i =>
        new RegExp(`\\b${i}\\b`).test(type)
      );
      if (!referencesInterface) keys.add(key);
    }
  }
  return [...keys].sort();
}

/**
 * Source text with comments removed, so a key only mentioned in prose cannot look wired.
 *
 * Crude on purpose: it does not track strings, so a `//` inside a string literal truncates that
 * line. That direction is safe — it can only *hide* a match, which surfaces as a loud failure
 * rather than a silently inert toggle.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/**
 * Receivers that are never the settings object, matched against the expression to the left of
 * the dot. Anything on the `CometChat*` SDK/UI Kit surface (`CometChat.createGroup`,
 * `CometChatUIKit.createGroup`) is the SDK doing the thing, not the app reading a toggle.
 */
const NOT_A_SETTINGS_RECEIVER = /(^|[^A-Za-z0-9_$])CometChat[A-Za-z0-9_$]*$/;

/**
 * True when `key` is read off something that could plausibly be the settings object.
 *
 * A bare `\bkey\b` search counted any mention at all, so `groupManagement.createGroup` was
 * reported as wired by `CometChat.createGroup(group)` in CometChatCreateGroup.tsx — a completely
 * inert toggle passed this check. Requiring a dot fixed that case but only that one: the old
 * `(?<!CometChat)` lookbehind inspects exactly the nine characters before the dot, so every other
 * name on the SDK surface walked straight through it (`CometChatUIKit.createGroup` ends in
 * "ChatUIKit", which is not "CometChat"). This captures the receiver and tests it instead.
 *
 * Deliberately still *permissive* about which receiver counts — `core.editMessage` and
 * `featureProps.settings.chatFeatures...` are both legitimate, and enumerating them would make
 * this a second copy of the wiring. It rejects the one family that is known to be wrong.
 */
function isReadAsSetting(key: string, sources: string): boolean {
  const re = new RegExp(`([A-Za-z0-9_$.\\]?]*)\\.\\s*${key}\\b`, 'g');
  for (const match of sources.matchAll(re)) {
    if (!NOT_A_SETTINGS_RECEIVER.test(match[1])) return true;
  }
  return false;
}

describe('builder settings coverage', () => {
  const sources = stripComments(
    collectSources(srcRoot)
      .map(f => readFileSync(f, 'utf8'))
      .join('\n')
  );
  const keys = leafSettingKeys();

  it('declares a non-trivial schema', () => {
    expect(keys.length).toBeGreaterThan(50);
  });

  it('wires every setting that is a sample-app concern', () => {
    const unwired = keys.filter(
      key => !NOT_SAMPLE_APP_CONCERNS.has(key) && !isReadAsSetting(key, sources)
    );
    expect(
      unwired,
      `unwired settings — add the gate, or justify it in NOT_SAMPLE_APP_CONCERNS`
    ).toEqual([]);
  });

  it('does not count the SDK surface as wiring', () => {
    // The whole point of the receiver check. Each of these is the SDK performing the action,
    // not the app reading the toggle that gates it.
    expect(isReadAsSetting('createGroup', 'CometChat.createGroup(group)')).toBe(false);
    expect(isReadAsSetting('createGroup', 'CometChatUIKit.createGroup(group)')).toBe(false);
    expect(isReadAsSetting('createGroup', 'await CometChatUIKitUtility.createGroup()')).toBe(false);
    // ...while a genuine read still counts, wherever it is rooted.
    expect(isReadAsSetting('createGroup', 'if (groupManagement.createGroup) {')).toBe(true);
    expect(
      isReadAsSetting('createGroup', 'props.settings.chatFeatures.groupManagement.createGroup')
    ).toBe(true);
  });

  it('does not count a mention in a comment as wiring', () => {
    expect(stripComments('// reads settings.createGroup one day')).not.toMatch(/createGroup/);
    expect(stripComments('/** wires .createGroup */')).not.toMatch(/createGroup/);
    expect(stripComments('const x = core.createGroup; // and here')).toMatch(/core\.createGroup/);
  });

  it('keeps the exclusion list honest — every excluded key still exists in the schema', () => {
    const stale = [...NOT_SAMPLE_APP_CONCERNS].filter(key => !keys.includes(key));
    expect(stale, 'exclusions naming settings that no longer exist').toEqual([]);
  });
});

describe('resolveSettings', () => {
  it('returns the plain sample app defaults when given nothing', () => {
    // No input means no builder, so the answer is the app's own behaviour, not a variant's.
    expect(resolveSettings(undefined)).toEqual(defaultSettings);
    expect(resolveSettings(null)).toEqual(defaultSettings);
  });

  it('resolves an empty blob to the stored defaults, not the sample app ones', () => {
    // `{}` is a real stored payload that happens to mention nothing — an existing variant. It
    // must not pick up the eight opt-in features the way the no-builder case does.
    expect(resolveSettings({})).toEqual(storedSettingsDefaults);
    expect(resolveSettings({}).chatFeatures.coreMessagingExperience.pinMessage).toBe(false);
    expect(defaultSettings.chatFeatures.coreMessagingExperience.pinMessage).toBe(true);
  });

  it('deep-merges a partial without dropping sibling keys', () => {
    const resolved = resolveSettings({
      chatFeatures: { coreMessagingExperience: { editMessage: false } },
    });
    expect(resolved.chatFeatures.coreMessagingExperience.editMessage).toBe(false);
    // untouched siblings survive
    expect(resolved.chatFeatures.coreMessagingExperience.deleteMessage).toBe(true);
    expect(resolved.chatFeatures.deeperUserEngagement.reactions).toBe(true);
  });

  it('replaces arrays wholesale rather than merging them', () => {
    const resolved = resolveSettings({ layout: { tabs: ['chats'] } });
    expect(resolved.layout.tabs).toEqual(['chats']);
  });

  it('tolerates payloads missing newer keys', () => {
    // A settings blob predating the opt-in keys must still resolve completely — and those keys
    // must come back false, which is what keeps an existing variant behaving as it always has.
    const legacy = { chatFeatures: { coreMessagingExperience: { typingIndicator: false } } };
    const resolved = resolveSettings(legacy);
    const core = resolved.chatFeatures.coreMessagingExperience;
    expect(core.typingIndicator).toBe(false);
    expect(core.editMessage).toBe(true);
    expect(core.markAsUnread).toBe(false);
    expect(core.pinMessage).toBe(false);
    expect(core.saveMessage).toBe(false);
    expect(core.pinConversation).toBe(false);
    expect(core.threadSubscription).toBe(false);
    expect(core.multipleAttachments).toBe(false);
  });

  it('does not mutate the defaults', () => {
    resolveSettings({ layout: { withSideBar: false } });
    expect(defaultSettings.layout.withSideBar).toBe(true);
  });
});

/**
 * The docked toggle button's icons.
 *
 * Nothing in the sample app renders them — the button belongs to the no-code widget — but the
 * values are declared here, so this is the only place they can be guarded.
 */
describe('docked button icons', () => {
  it("default to the widget package's CDN copies, not an empty string", () => {
    expect(defaultSettings.noCode.styles.openIcon).toBe(DEFAULT_DOCKED_OPEN_ICON);
    expect(defaultSettings.noCode.styles.closeIcon).toBe(DEFAULT_DOCKED_CLOSE_ICON);

    // The paths are a public contract: unhashed, under dist/icons, so the URLs stay resolvable.
    const cdnIcon =
      /^https:\/\/cdn\.jsdelivr\.net\/npm\/@cometchat\/chat-embed@[^/]+\/dist\/icons\/docked_\w+_icon\.svg$/;
    expect(DEFAULT_DOCKED_OPEN_ICON).toMatch(cdnIcon);
    expect(DEFAULT_DOCKED_CLOSE_ICON).toMatch(cdnIcon);
  });

  it('are filled in for a stored blob that omits them', () => {
    // Both shapes a variant saved before the icons existed can take: no `noCode` at all, and a
    // `noCode` that mentions something else.
    expect(resolveSettings({}).noCode.styles.openIcon).toBe(DEFAULT_DOCKED_OPEN_ICON);
    expect(resolveSettings({ noCode: { docked: true } }).noCode.styles.closeIcon).toBe(
      DEFAULT_DOCKED_CLOSE_ICON
    );
  });

  it('are left empty when the blob says empty — which is why the button falls back too', () => {
    // The merge's contract is that a present value wins, and the dashboard does store "" for an
    // icon nobody uploaded. Restoring the default above therefore cannot be the whole fix, which is
    // what `dockedToggleIcon` is for. Asserted here so that if the merge behaviour ever changes,
    // whoever changes it can see why the second half exists.
    expect(resolveSettings({ noCode: { styles: { openIcon: '' } } }).noCode.styles.openIcon).toBe(
      ''
    );
  });

  describe('dockedToggleIcon', () => {
    it('uses what the customer configured', () => {
      const styles = {
        openIcon: 'https://example.test/open.png',
        closeIcon: 'https://example.test/close.png',
      };
      expect(dockedToggleIcon(styles, false)).toBe('https://example.test/open.png');
      expect(dockedToggleIcon(styles, true)).toBe('https://example.test/close.png');
    });

    it('falls back for every shape of "not configured"', () => {
      // Each of these reaches the button in practice: "" is what the dashboard stores for an icon
      // nobody uploaded, whitespace is what the builder's icon field saves if you clear it by
      // hand, and undefined is the settings blob predating the field.
      for (const styles of [{}, { openIcon: '' }, { openIcon: '   ' }, { openIcon: undefined }]) {
        expect(dockedToggleIcon(styles, false)).toBe(DEFAULT_DOCKED_OPEN_ICON);
      }
      for (const styles of [
        {},
        { closeIcon: '' },
        { closeIcon: '\n\t' },
        { closeIcon: undefined },
      ]) {
        expect(dockedToggleIcon(styles, true)).toBe(DEFAULT_DOCKED_CLOSE_ICON);
      }
    });

    it('falls back when there are no styles at all', () => {
      // The provider's first render, before settings resolve.
      expect(dockedToggleIcon(undefined, false)).toBe(DEFAULT_DOCKED_OPEN_ICON);
      expect(dockedToggleIcon(undefined, true)).toBe(DEFAULT_DOCKED_CLOSE_ICON);
    });

    it('never returns an empty string', () => {
      // The whole point: an empty src is a blank button, so there is no input that produces one.
      for (const isOpen of [true, false]) {
        for (const styles of [undefined, {}, { openIcon: '', closeIcon: '' }]) {
          expect(dockedToggleIcon(styles, isOpen)).not.toBe('');
        }
      }
    });
  });
});

describe('default settings preserve current sample-app behaviour', () => {
  it('leaves AI copilot features off, matching the UI Kit defaults', () => {
    // showSmartReplies / showConversationStarters / showConversationSummaryButton all default
    // to false in the UI Kit; enabling them here would silently change the sample app.
    expect(defaultSettings.chatFeatures.aiUserCopilot).toEqual({
      conversationStarter: false,
      conversationSummary: false,
      smartReply: false,
    });
  });

  it('enables every tab, so the tab bar renders as before', () => {
    expect(defaultSettings.layout.tabs).toEqual(['chats', 'calls', 'users', 'groups']);
    expect(defaultSettings.layout.withSideBar).toBe(true);
  });
});
