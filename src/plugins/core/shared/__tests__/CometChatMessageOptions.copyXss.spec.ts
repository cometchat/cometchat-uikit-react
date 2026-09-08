/**
 * B5 — the Copy handler's plain-text branch must not write unescaped message text
 * into `div.innerHTML`.
 *
 * Path: msg.getText() → stripMarkdownFormatting() (strips markdown markers only,
 * no escaping) → applyDisplayFormatters() (no escaping) → `tmp.innerHTML = …`.
 * The text/html branch a few lines up escapes via `escapeUserHtml`; this one must
 * too. Only runs when `context.textFormatters` is non-empty.
 *
 * jsdom does not load images, so `onerror` never fires here the way it does in a
 * real browser. This asserts the *sink*: that attacker markup is not parsed into
 * live elements, and that the copied plain text is unchanged for normal content.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../utils/translateMessage', () => ({
  translateMessage: vi.fn(),
}));

import { getTextMessageOptions, MESSAGE_OPTION_IDS } from '../CometChatMessageOptions';
import { buildUser, buildGroup, buildTextMessage } from '../../../../testing/mock-builders';
import { CometChatTextFormatter } from '../../../../formatters/CometChatTextFormatter';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessagePluginContext } from '../../../plugin.types';

/** Pass-through formatter — enough to make `context.textFormatters` non-empty. */
class NoopFormatter extends CometChatTextFormatter {
  readonly id = 'noop';
}

/** Wraps #hashtags, mirroring the sample app's HashtagFormatter. */
class HashtagFormatter extends CometChatTextFormatter {
  readonly id = 'hashtag';
  override format(text: string): string {
    return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
  }
}

/** Runs the Copy option and returns { html, plain } as written to the clipboard. */
function runCopy(
  text: string,
  formatters: CometChatTextFormatter[] = [new NoopFormatter()]
): { plain: string; innerHTMLWrites: string[] } {
  const message = buildTextMessage({ text }) as unknown as CometChat.BaseMessage;
  const context: CometChatMessagePluginContext = {
    loggedInUser: buildUser({ uid: 'me-1', name: 'Me' }) as unknown as CometChat.User,
    group: buildGroup({ guid: 'group-1' }) as unknown as CometChat.Group,
    alignment: 'right',
    theme: 'light',
    textFormatters: formatters,
  };

  // Force the non-ClipboardItem branch: the handler then calls
  // navigator.clipboard.writeText(plainText), handing us the exact plain text.
  delete (globalThis as unknown as { ClipboardItem?: unknown }).ClipboardItem;
  const writeText = vi.fn();
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: { writeText, write: vi.fn() },
  });

  const innerHTMLWrites: string[] = [];
  // `innerHTML` lives on Element.prototype in jsdom (not HTMLElement.prototype),
  // so walk the chain — hooking the wrong one silently swallows the write.
  let proto: object | null = globalThis.HTMLElement.prototype as unknown as object;
  while (proto !== null && !Object.getOwnPropertyDescriptor(proto, 'innerHTML')) {
    proto = Object.getPrototypeOf(proto) as object | null;
  }
  if (proto === null) throw new Error('innerHTML descriptor not found on the prototype chain');
  const original = Object.getOwnPropertyDescriptor(proto, 'innerHTML');
  Object.defineProperty(proto, 'innerHTML', {
    configurable: true,
    set(this: HTMLElement, value: string) {
      innerHTMLWrites.push(value);
      original?.set?.call(this, value);
    },
    get(this: HTMLElement) {
      return original?.get?.call(this) as string;
    },
  });

  try {
    getTextMessageOptions(message, context)
      .find(o => o.id === MESSAGE_OPTION_IDS.copy)
      ?.onClick(message);
  } finally {
    if (original) Object.defineProperty(proto, 'innerHTML', original);
  }

  return {
    plain: (writeText.mock.calls[0]?.[0] as string | undefined) ?? '',
    innerHTMLWrites,
  };
}

describe('Copy option — XSS sink is closed', () => {
  it('does not parse attacker markup into live elements', () => {
    const { innerHTMLWrites, plain } = runCopy('<img src=x onerror="window.__XSS__=1">');
    // Nothing reaching innerHTML may contain a live img/onerror.
    expect(innerHTMLWrites.some(v => /<img/i.test(v))).toBe(false);
    // The visible text is still copied faithfully.
    expect(plain).toBe('<img src=x onerror="window.__XSS__=1">');
  });

  it('neutralises a caption-style payload with a different loader', () => {
    const { innerHTMLWrites } = runCopy('<video src=x onerror="alert(1)"></video>');
    expect(innerHTMLWrites.some(v => /<video/i.test(v))).toBe(false);
  });
});

describe('Copy option — plain-text output is unchanged for normal content', () => {
  const cases: [name: string, input: string, expected: string][] = [
    ['plain text', 'hello world', 'hello world'],
    ['bold markdown', 'hello **world**', 'hello world'],
    ['italic markdown', 'hello _world_', 'hello world'],
    ['strikethrough', 'hello ~~world~~', 'hello world'],
    ['inline code', 'run `npm test`', 'run npm test'],
    ['hashtag', 'ship it #release', 'ship it #release'],
    ['url', 'see https://a.com/b?x=1&y=2', 'see https://a.com/b?x=1&y=2'],
    ['emoji', 'nice 🎉 work', 'nice 🎉 work'],
    ['ampersand', 'Tom & Jerry', 'Tom & Jerry'],
    ['newlines', 'line1\nline2', 'line1\nline2'],
    ['quotes', `she said "hi" and 'bye'`, `she said "hi" and 'bye'`],
    ['math-ish', 'a < b > c', 'a < b > c'],
  ];

  it.each(cases)('%s', (_name, input, expected) => {
    expect(runCopy(input).plain).toBe(expected);
  });

  it('keeps hashtag text when a real formatter wraps it in markup', () => {
    expect(runCopy('ship it #release', [new HashtagFormatter()]).plain).toBe('ship it #release');
  });

  it('is identical with and without formatters for plain content', () => {
    const withFormatters = runCopy('hello **world** #tag').plain;
    const withoutFormatters = runCopy('hello **world** #tag', []).plain;
    expect(withFormatters).toBe(withoutFormatters);
  });
});
