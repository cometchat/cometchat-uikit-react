import { describe, it, expect, beforeEach } from 'vitest';
import { detectAndConvertMarkdown } from '../MarkdownDetector';
import type { EditorContext } from '../../formats/format.types';

// detectAndConvertMarkdown only reads ctx.getWindow() to access the selection.
const ctx = { getWindow: () => window } as unknown as EditorContext;

describe('MarkdownDetector', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.contentEditable = 'true';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function setTextAndCursor(text: string) {
    container.textContent = text;
    const textNode = container.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, text.length);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    return textNode;
  }

  describe('bold detection', () => {
    it('should convert **text** to <strong>', () => {
      setTextAndCursor('**hello**');
      const result = detectAndConvertMarkdown(ctx);
      expect(result).toBe(true);
      const strong = container.querySelector('strong');
      expect(strong).not.toBeNull();
      expect(strong?.textContent).toBe('hello');
    });

    it('should convert *text* to <strong>', () => {
      setTextAndCursor('*hello*');
      const result = detectAndConvertMarkdown(ctx);
      expect(result).toBe(true);
      const strong = container.querySelector('strong');
      expect(strong).not.toBeNull();
      expect(strong?.textContent).toBe('hello');
    });
  });

  describe('italic detection', () => {
    it('should convert _text_ to <em>', () => {
      setTextAndCursor('_hello_');
      const result = detectAndConvertMarkdown(ctx);
      expect(result).toBe(true);
      const em = container.querySelector('em');
      expect(em).not.toBeNull();
      expect(em?.textContent).toBe('hello');
    });
  });

  describe('strikethrough detection', () => {
    it('should convert ~~text~~ to <s>', () => {
      setTextAndCursor('~~hello~~');
      const result = detectAndConvertMarkdown(ctx);
      expect(result).toBe(true);
      const s = container.querySelector('s');
      expect(s).not.toBeNull();
      expect(s?.textContent).toBe('hello');
    });
  });

  describe('inline code detection', () => {
    it('should convert `text` to <code>', () => {
      setTextAndCursor('`hello`');
      const result = detectAndConvertMarkdown(ctx);
      expect(result).toBe(true);
      const code = container.querySelector('code');
      expect(code).not.toBeNull();
      expect(code?.textContent).toBe('hello');
    });
  });

  describe('underline detection', () => {
    it('should convert <u>text</u> to <u> element', () => {
      setTextAndCursor('<u>hello</u>');
      const result = detectAndConvertMarkdown(ctx);
      expect(result).toBe(true);
      const u = container.querySelector('u');
      expect(u).not.toBeNull();
      expect(u?.textContent).toBe('hello');
    });
  });

  describe('link detection', () => {
    it('should convert [text](url) to <a>', () => {
      setTextAndCursor('[Google](https://google.com)');
      const result = detectAndConvertMarkdown(ctx);
      expect(result).toBe(true);
      const a = container.querySelector('a');
      expect(a).not.toBeNull();
      expect(a?.textContent).toBe('Google');
      expect(a?.href).toBe('https://google.com/');
      expect(a?.target).toBe('_blank');
    });
  });

  describe('no match', () => {
    it('should return false for plain text', () => {
      setTextAndCursor('hello world');
      const result = detectAndConvertMarkdown(ctx);
      expect(result).toBe(false);
    });

    it('should return false when selection is empty', () => {
      const result = detectAndConvertMarkdown(ctx);
      // No selection set up in this case
      expect(result).toBe(false);
    });
  });

  // Markdown markers inside a URL are address characters, not formatting. Without
  // this guard, typing a link with two underscores italicises the span between
  // them live in the composer, and the caret-parking ZWSP lands inside the URL,
  // which later corrupts the href of the sent message.
  describe('URL awareness', () => {
    /** Type text one character at a time, running the detector after each keystroke. */
    function typeText(text: string): string {
      const sel = window.getSelection()!;
      for (const ch of text) {
        const node = sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
        if (node?.nodeType !== Node.TEXT_NODE) {
          const created = document.createTextNode(ch);
          container.appendChild(created);
          const range = document.createRange();
          range.setStart(created, 1);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          const offset = sel.getRangeAt(0).startOffset;
          const textNode = node as Text;
          const content = textNode.textContent ?? '';
          textNode.textContent = content.slice(0, offset) + ch + content.slice(offset);
          const range = document.createRange();
          range.setStart(textNode, offset + 1);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        detectAndConvertMarkdown(ctx);
      }
      return container.innerHTML;
    }

    it('leaves a URL with two underscores untouched while typing', () => {
      const url = 'https://example.com/file/d/1AbCdEfGhIj_kLmNoPqRsTu/view?usp=share_link';
      expect(typeText(url)).toBe(url);
    });

    it('does not italicise underscores inside a bare URL', () => {
      expect(typeText('https://example.com/a_b_c')).toBe('https://example.com/a_b_c');
    });

    it('leaves no zero-width character inside a URL', () => {
      expect(typeText('https://example.com/a_b_c')).not.toContain('​');
    });

    it('protects the other inline markers inside a URL', () => {
      expect(typeText('https://example.com/a*b*c')).toBe('https://example.com/a*b*c');
    });

    it('protects www. and http:// forms', () => {
      expect(typeText('www.example.com/a_b_c')).toBe('www.example.com/a_b_c');
    });

    it('still converts markers that wrap a URL', () => {
      expect(typeText('_https://example.com/abc_')).toContain('<em>https://example.com/abc</em>');
    });

    it('still converts a markdown link whose URL has underscores', () => {
      expect(typeText('[label](https://example.com/a_b_c)')).toContain(
        'href="https://example.com/a_b_c"'
      );
    });

    it('still converts formatting elsewhere in the same text', () => {
      expect(typeText('https://example.com/x and _it_ here')).toContain('<em>it</em>');
    });

    it('leaves intra-word underscores alone but still formats at a boundary', () => {
      expect(typeText('my_var_name')).toBe('my_var_name');
    });

    it('still italicises a properly delimited marker', () => {
      expect(typeText('say _hello_ now')).toContain('<em>hello</em>');
    });
  });
});
