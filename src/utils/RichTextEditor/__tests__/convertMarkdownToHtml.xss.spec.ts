import { describe, it, expect } from 'vitest';
import { convertMarkdownToHtml } from '../RichTextEditor';

/**
 * XSS regression suite for the markdown→HTML conversion used on raw paste (cmd+shift+v).
 * Output is parsed into a detached DOM; raw HTML must not survive as live markup.
 */

/** Parse conversion output into a detached element for structural assertions. */
function parse(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

function expectInert(root: HTMLElement) {
  expect(root.querySelector('img')).toBeNull();
  expect(root.querySelector('script')).toBeNull();
  expect(root.querySelector('svg')).toBeNull();
  expect(root.querySelector('iframe')).toBeNull();
  for (const el of Array.from(root.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.startsWith('on')).toBe(false);
      if (attr.name === 'href' || attr.name === 'src') {
        expect(attr.value.toLowerCase().replace(/\s/g, '')).not.toContain('javascript:');
      }
    }
  }
}

describe('convertMarkdownToHtml — XSS', () => {
  const liveTagPayloads = [
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '<svg/onload=alert(1)>',
    '<iframe src=javascript:alert(1)></iframe>',
    '**<img src=x onerror=alert(1)>**',
  ];

  for (const payload of liveTagPayloads) {
    it(`escapes raw HTML: ${payload.slice(0, 32)}`, () => {
      const out = convertMarkdownToHtml(payload);
      // No live tag string in the output, and nothing dangerous once parsed.
      expect(out).not.toMatch(/<img/i);
      expect(out).not.toMatch(/<script/i);
      expect(out).not.toMatch(/<svg/i);
      expect(out).not.toMatch(/<iframe/i);
      expect(out).toContain('&lt;');
      expectInert(parse(out));
    });
  }

  it('escapes HTML inside a fenced code block', () => {
    const out = convertMarkdownToHtml('```\n<img src=x onerror=alert(1)>\n```');
    expect(out).toContain('<pre><code>');
    expect(out).not.toMatch(/<img/i);
    expect(out).toContain('&lt;img');
    expectInert(parse(out));
  });

  it('neutralizes javascript: links', () => {
    const out = convertMarkdownToHtml('[click](javascript:alert(1))');
    expect(out).toContain('href="#"');
    expectInert(parse(out));
  });

  it('neutralizes obfuscated javascript: links (control chars in scheme)', () => {
    const out = convertMarkdownToHtml('[click](java\tscript:alert(1))');
    expect(out).toContain('href="#"');
    expectInert(parse(out));
  });

  it('prevents attribute breakout via quotes in the URL', () => {
    const out = convertMarkdownToHtml('[x](https://a" onmouseover="alert(1))');
    // The quote is escaped, so the anchor must NOT gain an onmouseover attribute.
    const anchor = parse(out).querySelector('a');
    expect(anchor).toBeTruthy();
    expect(anchor?.hasAttribute('onmouseover')).toBe(false);
    expectInert(parse(out));
  });

  it('preserves legitimate http(s) links', () => {
    const out = convertMarkdownToHtml('[Example](https://example.com)');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('>Example<');
  });

  it('still converts safe markdown formatting', () => {
    expect(convertMarkdownToHtml('**bold**')).toContain('<strong>bold</strong>');
    expect(convertMarkdownToHtml('`code`')).toContain('<code>code</code>');
  });

  it('preserves <u> underline syntax', () => {
    expect(convertMarkdownToHtml('<u>under</u>')).toContain('<u>under</u>');
  });
});
