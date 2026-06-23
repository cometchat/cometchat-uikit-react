import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatTextBubble } from '../CometChatTextBubble';
import { CometChatMarkdownFormatter } from '../../../formatters/CometChatMarkdownFormatter';
import { CometChatMentionsFormatter } from '../../../formatters/CometChatMentionsFormatter';
import { CometChatUrlFormatter } from '../../../formatters/CometChatUrlFormatter';

/**
 * XSS regression suite: bubble pipeline + conversation/search subtitle.
 * Proxy for "did not execute": no dangerous element/handler survives in the DOM.
 */

const defaultFormatters = () => [
  new CometChatMarkdownFormatter(),
  new CometChatMentionsFormatter(),
  new CometChatUrlFormatter(),
];

/** Assert a rendered fragment contains nothing that could execute script. */
function expectInert(root: HTMLElement) {
  expect(root.querySelector('script')).toBeNull();
  expect(root.querySelector('img')).toBeNull();
  expect(root.querySelector('svg')).toBeNull();
  expect(root.querySelector('iframe')).toBeNull();

  for (const el of Array.from(root.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.startsWith('on')).toBe(false); // no inline event handlers
      if (attr.name === 'href' || attr.name === 'src') {
        expect(attr.value.toLowerCase().replace(/\s/g, '')).not.toContain('javascript:');
      }
    }
  }
}

const PAYLOADS: { name: string; text: string }[] = [
  { name: 'basic img onerror', text: '<img src=x onerror=alert(1)>' },
  { name: 'script injection', text: '<script>alert(1)</script>' },
  { name: 'svg onload', text: '<svg/onload=alert(1)>' },
  { name: 'javascript: anchor', text: '<a href="javascript:alert(1)">click</a>' },
  { name: 'img inside inline code', text: '`<img src=x onerror=alert(1)>`' },
  { name: 'img inside code block', text: '```\n<img src=x onerror=alert(1)>\n```' },
  { name: 'allowed tag blockquote', text: '<blockquote>hello</blockquote>' },
  { name: 'allowed tag + handler', text: '<b onmouseover=alert(1)>hover me</b>' },
  {
    name: 'allowed tag + event + js url',
    text: '<a href="https://evil.com" onclick="alert(1)">link</a>',
  },
  { name: 'html inside markdown bold', text: '**<img src=x onerror=alert(1)>**' },
  {
    name: 'blockquote+img inside code block',
    text: '```<blockquote><img src=x onerror=alert(1)></blockquote>```',
  },
];

describe('CometChatTextBubble — XSS', () => {
  for (const { name, text } of PAYLOADS) {
    it(`neutralizes payload: ${name}`, () => {
      const { container } = render(
        <CometChatTextBubble text={text} textFormatters={defaultFormatters()} />
      );
      expectInert(container);
    });
  }

  it('renders HTML inside inline code as literal text', () => {
    const { container } = render(
      <CometChatTextBubble
        text={'`<img src=x onerror=alert(1)>`'}
        textFormatters={defaultFormatters()}
      />
    );
    // Rendered inside a <code> element as visible text, not as an <img>
    const code = container.querySelector('code');
    expect(code).toBeTruthy();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('renders HTML inside a code block as literal text (not as the real element)', () => {
    const { container } = render(
      <CometChatTextBubble
        text={'```\n<blockquote>hello</blockquote>\n```'}
        textFormatters={defaultFormatters()}
      />
    );
    // The code block must show the literal tags, and must NOT create a blockquote.
    expect(container.querySelector('pre')).toBeTruthy();
    expect(container.querySelector('blockquote')).toBeNull();
    expect(container.textContent).toContain('<blockquote>hello</blockquote>');
  });
});

describe('stripMarkdownForConversation — XSS (conversation/search subtitle)', () => {
  const formatter = new CometChatMarkdownFormatter();

  const subtitlePayloads = [
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '<svg/onload=alert(1)>',
    '`<img src=x onerror=alert(1)>`',
    '```\n<blockquote>hello</blockquote>\n```',
    '<blockquote>hello</blockquote>',
  ];

  for (const payload of subtitlePayloads) {
    it(`escapes raw HTML for: ${payload.slice(0, 32)}`, () => {
      const out = formatter.stripMarkdownForConversation(payload);
      // No live tag openings for dangerous/raw HTML elements.
      expect(out).not.toMatch(/<img/i);
      expect(out).not.toMatch(/<script/i);
      expect(out).not.toMatch(/<svg/i);
      expect(out).not.toMatch(/<blockquote/i);
      // Dangerous angle brackets are escaped instead.
      expect(out).toContain('&lt;');
    });
  }

  it('still converts markdown formatting to safe tags', () => {
    expect(formatter.stripMarkdownForConversation('**bold**')).toBe('<b>bold</b>');
    expect(formatter.stripMarkdownForConversation('`code`')).toBe('<code>code</code>');
  });
});
