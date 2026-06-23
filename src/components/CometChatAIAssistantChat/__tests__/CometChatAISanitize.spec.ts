import { describe, it, expect } from 'vitest';
import { sanitizeAIHtml, AI_ALLOWED_TAGS, AI_ALLOWED_ATTR } from '../CometChatAISanitize';

describe('CometChatAISanitize', () => {
  describe('allowlist constants', () => {
    it('exposes a frozen-like list of allowed tags including common formatting tags', () => {
      expect(Array.isArray(AI_ALLOWED_TAGS)).toBe(true);
      // A representative subset must be present.
      for (const tag of [
        'span',
        'strong',
        'em',
        'code',
        'pre',
        'blockquote',
        'a',
        'p',
        'table',
        'img',
        'hr',
      ]) {
        expect(AI_ALLOWED_TAGS).toContain(tag);
      }
    });

    it('exposes a list of allowed attributes including mention data attributes', () => {
      expect(Array.isArray(AI_ALLOWED_ATTR)).toBe(true);
      for (const attr of ['class', 'href', 'src', 'style', 'data-uid', 'data-mention-type']) {
        expect(AI_ALLOWED_ATTR).toContain(attr);
      }
    });
  });

  describe('sanitizeAIHtml - empty / falsy input', () => {
    it('returns empty string for empty string', () => {
      expect(sanitizeAIHtml('')).toBe('');
    });

    it('returns empty string for null input', () => {
      expect(sanitizeAIHtml(null as unknown as string)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(sanitizeAIHtml(undefined as unknown as string)).toBe('');
    });
  });

  describe('sanitizeAIHtml - allowed content preserved', () => {
    it('keeps plain text untouched', () => {
      expect(sanitizeAIHtml('Hello world')).toBe('Hello world');
    });

    it('preserves allowed formatting tags', () => {
      const out = sanitizeAIHtml('<strong>bold</strong> and <em>italic</em>');
      expect(out).toContain('<strong>bold</strong>');
      expect(out).toContain('<em>italic</em>');
    });

    it('preserves blockquote and code blocks', () => {
      const out = sanitizeAIHtml('<blockquote><pre><code>code</code></pre></blockquote>');
      expect(out).toContain('<blockquote>');
      expect(out).toContain('<pre>');
      expect(out).toContain('<code>');
      expect(out).toContain('code');
    });

    it('preserves lists', () => {
      const out = sanitizeAIHtml('<ul><li>a</li><li>b</li></ul>');
      expect(out).toContain('<ul>');
      expect(out).toContain('<li>a</li>');
      expect(out).toContain('<li>b</li>');
    });

    it('preserves ordered lists', () => {
      const out = sanitizeAIHtml('<ol><li>one</li></ol>');
      expect(out).toContain('<ol>');
      expect(out).toContain('<li>one</li>');
    });

    it('preserves headings', () => {
      const out = sanitizeAIHtml('<h1>Title</h1><h6>Sub</h6>');
      expect(out).toContain('<h1>Title</h1>');
      expect(out).toContain('<h6>Sub</h6>');
    });

    it('preserves tables', () => {
      const out = sanitizeAIHtml(
        '<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>D</td></tr></tbody></table>'
      );
      expect(out).toContain('<table>');
      expect(out).toContain('<th>H</th>');
      expect(out).toContain('<td>D</td>');
    });

    it('preserves hr and br', () => {
      const out = sanitizeAIHtml('line<br>break<hr>');
      expect(out).toMatch(/<br\s*\/?>/);
      expect(out).toMatch(/<hr\s*\/?>/);
    });
  });

  describe('sanitizeAIHtml - allowed attributes', () => {
    it('keeps href, target and rel on anchors', () => {
      const out = sanitizeAIHtml(
        '<a href="https://example.com" target="_blank" rel="noopener">link</a>'
      );
      expect(out).toContain('href="https://example.com"');
      expect(out).toContain('target="_blank"');
      expect(out).toContain('rel="noopener"');
    });

    it('keeps class and mention data attributes on span', () => {
      const out = sanitizeAIHtml(
        '<span class="cometchat-mentions" data-uid="u1" data-mention-type="user">@A</span>'
      );
      expect(out).toContain('class="cometchat-mentions"');
      expect(out).toContain('data-uid="u1"');
      expect(out).toContain('data-mention-type="user"');
    });

    it('keeps src, alt, width and height on images', () => {
      const out = sanitizeAIHtml(
        '<img src="https://example.com/x.png" alt="pic" width="10" height="20">'
      );
      expect(out).toContain('src="https://example.com/x.png"');
      expect(out).toContain('alt="pic"');
      expect(out).toContain('width="10"');
      expect(out).toContain('height="20"');
    });

    it('keeps inline style attribute', () => {
      const out = sanitizeAIHtml('<span style="color:red">x</span>');
      expect(out).toContain('style="color:red"');
    });
  });

  describe('sanitizeAIHtml - disallowed content stripped', () => {
    it('removes script tags entirely', () => {
      const out = sanitizeAIHtml('<p>safe</p><script>alert(1)</script>');
      expect(out).toContain('safe');
      expect(out.toLowerCase()).not.toContain('<script');
      expect(out.toLowerCase()).not.toContain('alert(1)');
    });

    it('strips disallowed tags but keeps their text content', () => {
      const out = sanitizeAIHtml('<div>kept</div>');
      // div is not in the allowlist, so the tag is removed but text remains.
      expect(out).toContain('kept');
      expect(out).not.toContain('<div');
    });

    it('removes event handler attributes', () => {
      const out = sanitizeAIHtml('<a href="#" onclick="evil()">x</a>');
      expect(out.toLowerCase()).not.toContain('onclick');
      expect(out.toLowerCase()).not.toContain('evil()');
    });

    it('removes disallowed attributes such as id', () => {
      const out = sanitizeAIHtml('<span id="foo" class="bar">x</span>');
      expect(out).not.toContain('id="foo"');
      expect(out).toContain('class="bar"');
    });

    it('neutralizes javascript: hrefs', () => {
      const out = sanitizeAIHtml('<a href="javascript:alert(1)">x</a>');
      expect(out.toLowerCase()).not.toContain('javascript:alert(1)');
    });

    it('strips script nested inside an allowed blockquote', () => {
      const out = sanitizeAIHtml('<blockquote><script>alert(1)</script>quote</blockquote>');
      expect(out).toContain('<blockquote>');
      expect(out).toContain('quote');
      expect(out.toLowerCase()).not.toContain('<script');
    });
  });

  describe('sanitizeAIHtml - returns a string in all cases', () => {
    it('always returns a string type', () => {
      expect(typeof sanitizeAIHtml('<b>x</b>')).toBe('string');
      expect(typeof sanitizeAIHtml('')).toBe('string');
    });
  });
});
