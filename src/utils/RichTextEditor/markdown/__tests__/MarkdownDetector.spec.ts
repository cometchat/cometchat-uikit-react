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
});
