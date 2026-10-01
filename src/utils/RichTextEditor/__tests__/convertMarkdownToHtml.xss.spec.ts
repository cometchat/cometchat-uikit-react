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

  // Pasting a link takes this path rather than the as-you-type detector, so the
  // markers inside an address are all present at once and must not be paired up.
  describe('URL shielding', () => {
    it('leaves a URL with two underscores untouched', () => {
      const url = 'https://example.com/file/d/1AbCdEfGhIj_kLmNoPqRsTu/view?usp=share_link';
      expect(convertMarkdownToHtml(url)).toBe(`<p>${url}</p>`);
    });

    it('does not italicise underscores inside a bare URL', () => {
      expect(convertMarkdownToHtml('https://example.com/a_b_c')).toBe(
        '<p>https://example.com/a_b_c</p>'
      );
    });

    it('protects the other inline markers inside a URL', () => {
      expect(convertMarkdownToHtml('https://example.com/a*b*c')).toBe(
        '<p>https://example.com/a*b*c</p>'
      );
      expect(convertMarkdownToHtml('https://example.com/a~~b~~c')).toBe(
        '<p>https://example.com/a~~b~~c</p>'
      );
    });

    it('protects www. URLs', () => {
      expect(convertMarkdownToHtml('www.example.com/my_file_name')).toBe(
        '<p>www.example.com/my_file_name</p>'
      );
    });

    it('still converts markers that wrap a URL', () => {
      expect(convertMarkdownToHtml('**https://example.com/a_b_c**')).toBe(
        '<p><strong>https://example.com/a_b_c</strong></p>'
      );
      expect(convertMarkdownToHtml('_https://example.com/abc_')).toBe(
        '<p><em>https://example.com/abc</em></p>'
      );
    });

    it('still converts formatting elsewhere in the same text', () => {
      expect(convertMarkdownToHtml('https://example.com/a_b_c and _really italic_ here')).toBe(
        '<p>https://example.com/a_b_c and <em>really italic</em> here</p>'
      );
    });

    it('leaves intra-word underscores alone but still formats at a boundary', () => {
      expect(convertMarkdownToHtml('my_var_name')).toBe('<p>my_var_name</p>');
      expect(convertMarkdownToHtml('my_var_name and _real_ here')).toBe(
        '<p>my_var_name and <em>real</em> here</p>'
      );
    });

    it('keeps a markdown link whose URL has underscores intact', () => {
      const result = convertMarkdownToHtml('[Q3](https://example.com/d/abc_def?usp=share_link)');
      expect(result).toContain('href="https://example.com/d/abc_def?usp=share_link"');
      expect(result).toContain('>Q3</a>');
    });

    it('still blocks dangerous schemes in a markdown link', () => {
      expect(convertMarkdownToHtml('[bad](javascript:alert(1))')).toContain('href="#"');
    });
  });
});
