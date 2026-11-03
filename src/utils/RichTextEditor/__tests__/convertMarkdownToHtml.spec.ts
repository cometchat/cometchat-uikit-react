import { describe, it, expect } from 'vitest';
import { convertMarkdownToHtml } from '../RichTextEditor';

/**
 * Structural behaviour of the paste-time markdown converter (block constructs).
 * Escaping / scheme blocking lives in convertMarkdownToHtml.xss.spec.ts.
 */
describe('convertMarkdownToHtml — blocks', () => {
  it('wraps plain lines in paragraphs and keeps blank lines as <br>', () => {
    expect(convertMarkdownToHtml('a\n\nb')).toBe('<p>a</p><br><p>b</p>');
  });

  describe('lists', () => {
    it.each([
      ['1. a\n2. b', '<ol><li>a</li><li>b</li></ol>'],
      ['i. roman\nii. two', '<ol><li>roman</li><li>two</li></ol>'],
      ['a. alpha', '<ol><li>alpha</li></ol>'],
      ['- a\n- b', '<ul><li>a</li><li>b</li></ul>'],
      ['• a', '<ul><li>a</li></ul>'],
    ])('%j → %s', (md, html) => {
      expect(convertMarkdownToHtml(md)).toBe(html);
    });

    it('applies inline markdown inside list items', () => {
      expect(convertMarkdownToHtml('- **b** and _i_')).toBe(
        '<ul><li><strong>b</strong> and <em>i</em></li></ul>'
      );
    });

    it('switching list type at the same depth closes the previous list', () => {
      expect(convertMarkdownToHtml('1. a\n- b')).toBe('<ol><li>a</li></ol><ul><li>b</li></ul>');
      expect(convertMarkdownToHtml('- a\n1. b')).toBe('<ul><li>a</li></ul><ol><li>b</li></ol>');
    });

    it('nests on four-space indentation and returns to the outer list', () => {
      expect(convertMarkdownToHtml('1. a\n    a. b\n    b. c\n2. d')).toBe(
        '<ol><li>a</li><ol><li>b</li><li>c</li></ol><li>d</li></ol>'
      );
      expect(convertMarkdownToHtml('- a\n    - b\n- c')).toBe(
        '<ul><li>a</li><ul><li>b</li></ul><li>c</li></ul>'
      );
      expect(convertMarkdownToHtml('- a\n    1. b\n- c')).toBe(
        '<ul><li>a</li><ol><li>b</li></ol><li>c</li></ul>'
      );
    });

    it('opens intermediate levels when the first item is already indented', () => {
      const ol = document.createElement('div');
      ol.innerHTML = convertMarkdownToHtml('    1. x');
      expect(ol.querySelector('ol ol li')?.textContent).toBe('x');

      const ul = document.createElement('div');
      ul.innerHTML = convertMarkdownToHtml('        - deep');
      expect(ul.querySelector('ul ul ul li')?.textContent).toBe('deep');
    });

    it('a following paragraph, quote or fence closes open lists', () => {
      expect(convertMarkdownToHtml('1. a\ntext')).toBe('<ol><li>a</li></ol><p>text</p>');
      expect(convertMarkdownToHtml('- a\n> q')).toBe('<ul><li>a</li></ul><blockquote>q</blockquote>');
      expect(convertMarkdownToHtml('1. a\n```\nx\n```')).toBe(
        '<ol><li>a</li></ol><pre><code>x</code></pre>'
      );
      expect(convertMarkdownToHtml('- a\n\n- b')).toBe(
        '<ul><li>a</li></ul><br><ul><li>b</li></ul>'
      );
    });
  });

  describe('code blocks', () => {
    it('keeps fenced content verbatim (escaped), without inline formatting', () => {
      expect(convertMarkdownToHtml('```\nconst a = 1 < 2;\n**not bold**\n```')).toBe(
        '<pre><code>const a = 1 &lt; 2;\n**not bold**</code></pre>'
      );
    });

    it('does not treat list or quote markers inside a fence as blocks', () => {
      expect(convertMarkdownToHtml('```\n- a\n> b\n```')).toBe(
        '<pre><code>- a\n&gt; b</code></pre>'
      );
    });

    it('accepts the single-line ```code``` form', () => {
      expect(convertMarkdownToHtml('```inline <b>```')).toBe(
        '<pre><code>inline &lt;b&gt;</code></pre>'
      );
    });

    it('closes an unterminated fence at the end of the text', () => {
      expect(convertMarkdownToHtml('```\nunclosed')).toBe('<pre><code>unclosed</code></pre>');
    });

    it('emits nothing for a lone opening fence', () => {
      expect(convertMarkdownToHtml('```')).toBe('');
    });
  });

  describe('blockquotes', () => {
    it('converts > lines and applies inline markdown', () => {
      expect(convertMarkdownToHtml('> quoted **b**')).toBe(
        '<blockquote>quoted <strong>b</strong></blockquote>'
      );
      expect(convertMarkdownToHtml('>tight')).toBe('<blockquote>tight</blockquote>');
    });
  });

  describe('inline', () => {
    it('converts strikethrough and markdown links', () => {
      expect(convertMarkdownToHtml('~~gone~~')).toBe('<p><s>gone</s></p>');
      expect(convertMarkdownToHtml('[a](https://x.test/?q="1")')).toBe(
        '<p><a href="https://x.test/?q=&quot;1&quot;" target="_blank" rel="noopener noreferrer">a</a></p>'
      );
    });

    it('blocks data:, vbscript: and file: link schemes', () => {
      for (const url of ['data:text/html,x', 'VBScript:x', 'file:///etc/passwd']) {
        expect(convertMarkdownToHtml(`[x](${url})`)).toContain('href="#"');
      }
    });
  });
});
