import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, cleanMarkdown, convertHtmlToMarkdown } from '../HtmlToMarkdown';

describe('HtmlToMarkdown', () => {
  describe('htmlToMarkdown', () => {
    it('should return empty string for null/undefined/empty input', () => {
      expect(htmlToMarkdown('')).toBe('');
      expect(htmlToMarkdown(null as unknown as string)).toBe('');
      expect(htmlToMarkdown(undefined as unknown as string)).toBe('');
    });

    it('should return plain text unchanged', () => {
      expect(htmlToMarkdown('Hello world')).toBe('Hello world');
    });

    describe('bold', () => {
      it('should convert <b> to **text**', () => {
        expect(htmlToMarkdown('<b>bold</b>')).toBe('**bold**');
      });

      it('should convert <strong> to **text**', () => {
        expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**');
      });
    });

    describe('italic', () => {
      it('should convert <i> to _text_', () => {
        expect(htmlToMarkdown('<i>italic</i>')).toBe('_italic_');
      });

      it('should convert <em> to _text_', () => {
        expect(htmlToMarkdown('<em>italic</em>')).toBe('_italic_');
      });
    });

    describe('strikethrough', () => {
      it('should convert <s> to ~~text~~', () => {
        expect(htmlToMarkdown('<s>strike</s>')).toBe('~~strike~~');
      });

      it('should convert <del> to ~~text~~', () => {
        expect(htmlToMarkdown('<del>deleted</del>')).toBe('~~deleted~~');
      });
    });

    describe('underline', () => {
      it('should convert <u> to <u>text</u>', () => {
        expect(htmlToMarkdown('<u>underline</u>')).toBe('<u>underline</u>');
      });
    });

    describe('inline code', () => {
      it('should wrap inline code in backticks', () => {
        expect(htmlToMarkdown('<code>const x = 1</code>')).toBe('`const x = 1`');
      });

      it('should return empty for code with only whitespace', () => {
        expect(htmlToMarkdown('<code>   </code>')).toBe('');
      });
    });

    describe('code blocks', () => {
      it('should convert <pre><code>code</code></pre> to triple backticks', () => {
        const result = htmlToMarkdown('<pre><code>function hello() {}</code></pre>');
        expect(result).toBe('```function hello() {}```');
      });

      it('should handle pre without code element', () => {
        const result = htmlToMarkdown('<pre>raw code</pre>');
        expect(result).toBe('```raw code```');
      });
    });

    describe('blockquotes', () => {
      it('should convert <blockquote> to > text', () => {
        const result = htmlToMarkdown('<blockquote>quoted text</blockquote>');
        expect(result).toBe('> quoted text');
      });
    });

    describe('links', () => {
      it('should convert <a href="url">text</a> to [text](url)', () => {
        const result = htmlToMarkdown('<a href="https://example.com">Click here</a>');
        expect(result).toBe('[Click here](https://example.com)');
      });

      it('should use href as text if no text content', () => {
        const result = htmlToMarkdown('<a href="https://example.com"></a>');
        expect(result).toBe('[https://example.com](https://example.com)');
      });
    });

    describe('ordered lists', () => {
      it('should convert <ol><li> to numbered list', () => {
        const result = htmlToMarkdown('<ol><li>first</li><li>second</li></ol>');
        expect(result).toContain('1. first');
        expect(result).toContain('2. second');
      });

      it('should respect start attribute', () => {
        const result = htmlToMarkdown('<ol start="3"><li>third</li><li>fourth</li></ol>');
        expect(result).toContain('3. third');
        expect(result).toContain('4. fourth');
      });
    });

    describe('unordered lists', () => {
      it('should convert <ul><li> to bullet list', () => {
        const result = htmlToMarkdown('<ul><li>apple</li><li>banana</li></ul>');
        expect(result).toContain('• apple');
        expect(result).toContain('• banana');
      });
    });

    describe('mentions', () => {
      it('should convert user mention span to <@uid:id>', () => {
        const html =
          '<span class="cometchat-mentions" data-uid="user123" data-mention-type="user">@Alice</span>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('<@uid:user123>');
      });

      it('should convert channel mention span to <@all:id>', () => {
        const html =
          '<span class="cometchat-mentions" data-uid="all" data-mention-type="channel">@everyone</span>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('<@all:all>');
      });

      it('should fallback to text content if no uid', () => {
        const html =
          '<span class="cometchat-mentions" data-uid="" data-mention-type="user">@Unknown</span>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('@Unknown');
      });
    });

    describe('line breaks and paragraphs', () => {
      it('should convert <br> to newline', () => {
        const result = htmlToMarkdown('line1<br>line2');
        expect(result).toContain('line1\nline2');
      });

      it('should add newline after <p> and <div>', () => {
        const result = htmlToMarkdown('<p>para1</p><p>para2</p>');
        expect(result).toContain('para1\n');
        expect(result).toContain('para2');
      });
    });

    describe('nested formatting', () => {
      it('should handle bold inside italic', () => {
        const result = htmlToMarkdown('<i><b>bold italic</b></i>');
        expect(result).toBe('_**bold italic**_');
      });
    });

    describe('inline markers wrapping multi-line content', () => {
      it('should re-wrap bold markers per line when content has newlines', () => {
        // A <p> inside <b> produces a trailing newline, exercising the
        // multi-line branch of wrapInlineMarker.
        const result = htmlToMarkdown('<b><p>line1</p>line2</b>');
        expect(result).toContain('**line1**');
        expect(result).toContain('**line2**');
      });

      it('should preserve blank lines without wrapping them', () => {
        const result = htmlToMarkdown('<i><div>a</div><div>b</div></i>');
        // each div adds a newline; blank lines stay blank (not "__")
        expect(result).toContain('_a_');
        expect(result).toContain('_b_');
        expect(result).not.toContain('__');
      });

      it('should wrap underline markers per line for multi-line content', () => {
        const result = htmlToMarkdown('<u><div>a</div>b</u>');
        expect(result).toContain('<u>a</u>');
        expect(result).toContain('<u>b</u>');
      });

      it('should wrap strikethrough markers per line for multi-line content', () => {
        const result = htmlToMarkdown('<s><div>a</div>b</s>');
        expect(result).toContain('~~a~~');
        expect(result).toContain('~~b~~');
      });
    });

    describe('inline formatting containing a pre block', () => {
      it('bold with nested pre returns inner content unwrapped', () => {
        const result = htmlToMarkdown('<b><pre><code>x</code></pre></b>');
        expect(result).toBe('```x```');
      });

      it('italic with nested pre returns inner content unwrapped', () => {
        const result = htmlToMarkdown('<i><pre>x</pre></i>');
        expect(result).toBe('```x```');
      });

      it('underline with nested pre returns inner content unwrapped', () => {
        const result = htmlToMarkdown('<u><pre>x</pre></u>');
        expect(result).toBe('```x```');
      });

      it('strikethrough with nested pre returns inner content unwrapped', () => {
        const result = htmlToMarkdown('<del><pre>x</pre></del>');
        expect(result).toBe('```x```');
      });
    });

    describe('multi-line inline code', () => {
      it('wraps each non-empty line of multi-line code in backticks', () => {
        // <br> inside <code> yields newlines -> multi-line code branch.
        const result = htmlToMarkdown('<code>line1<br>line2</code>');
        expect(result).toContain('`line1`');
        expect(result).toContain('`line2`');
      });

      it('drops blank lines in multi-line code', () => {
        const result = htmlToMarkdown('<code>a<br><br>b</code>');
        const lines = result.split('\n');
        expect(lines).toContain('`a`');
        expect(lines).toContain('`b`');
        // blank line collapses to empty entry, not a backtick pair
        expect(result).not.toContain('``');
      });

      it('strips zero-width spaces from inline code', () => {
        const result = htmlToMarkdown('<code>​hi​</code>');
        expect(result).toBe('`hi`');
      });
    });

    describe('code inside pre returns raw inner content', () => {
      it('code element whose parent is PRE is not double-wrapped', () => {
        // The PRE handler delegates; the CODE branch's parent-is-PRE guard
        // returns innerContent directly.
        const result = htmlToMarkdown('<pre><code>hello</code></pre>');
        expect(result).toBe('```hello```');
      });
    });

    describe('blockquote trailing blank lines', () => {
      it('removes trailing blank lines before prefixing quote markers', () => {
        const result = htmlToMarkdown('<blockquote>line1<br><br></blockquote>');
        expect(result).toBe('> line1');
      });

      it('prefixes each line of a multi-line blockquote', () => {
        const result = htmlToMarkdown('<blockquote>a<br>b</blockquote>');
        expect(result).toBe('> a\n> b');
      });
    });

    describe('ordered list edge cases', () => {
      it('skips empty list items and does not increment numbering for them', () => {
        const result = htmlToMarkdown('<ol><li>first</li><li></li><li>second</li></ol>');
        expect(result).toContain('1. first');
        expect(result).toContain('2. second');
        expect(result).not.toContain('3.');
      });

      it('defaults to 1 when start attribute is not a number', () => {
        const result = htmlToMarkdown('<ol start="abc"><li>one</li></ol>');
        expect(result).toContain('1. one');
      });
    });

    describe('nested lists', () => {
      it('indents nested unordered list under its parent', () => {
        const html = '<ul><li>parent<ul><li>child</li></ul></li></ul>';
        const result = htmlToMarkdown(html);
        expect(result).toContain('• parent');
        expect(result).toContain('    • child');
      });

      it('indents nested ordered list under its parent', () => {
        const html = '<ol><li>parent<ol><li>child</li></ol></li></ol>';
        const result = htmlToMarkdown(html);
        expect(result).toContain('1. parent');
        expect(result).toContain('    1. child');
      });

      it('processes element children (e.g. bold) inside a list item', () => {
        const result = htmlToMarkdown('<ul><li><b>bolded</b> item</li></ul>');
        expect(result).toContain('• **bolded** item');
      });

      it('skips whitespace-only unordered list items', () => {
        const result = htmlToMarkdown('<ul><li>a</li><li>   </li></ul>');
        const bulletCount = (result.match(/•/g) ?? []).length;
        expect(bulletCount).toBe(1);
      });
    });

    describe('code block content extraction', () => {
      it('converts mention spans inside a pre to SDK format', () => {
        const html =
          '<pre><code><span class="cometchat-mentions" data-uid="u9" data-mention-type="user">@Bob</span> hi</code></pre>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('```<@uid:u9> hi```');
      });

      it('converts channel mention spans inside a pre to all format', () => {
        const html =
          '<pre><code><span class="cometchat-mentions" data-uid="all" data-mention-type="channel">@everyone</span></code></pre>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('```<@all:all>```');
      });

      it('falls back to text content for mention spans without uid inside pre', () => {
        const html =
          '<pre><code><span class="cometchat-mentions" data-uid="" data-mention-type="user">@X</span></code></pre>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('```@X```');
      });

      it('converts <br> inside pre to newlines', () => {
        const result = htmlToMarkdown('<pre>a<br>b</pre>');
        expect(result).toBe('```a\nb```');
      });

      it('inserts a newline before nested div/p inside pre', () => {
        const result = htmlToMarkdown('<pre>a<div>b</div></pre>');
        expect(result).toBe('```a\nb```');
      });

      it('recurses through other nested elements inside pre', () => {
        const result = htmlToMarkdown('<pre><span>a</span><span>b</span></pre>');
        expect(result).toBe('```ab```');
      });
    });

    describe('plain spans', () => {
      it('returns inner content for spans without the mention class', () => {
        const result = htmlToMarkdown('<span class="other">plain</span>');
        expect(result).toBe('plain');
      });

      it('falls back to inner content for a span with no class at all', () => {
        const result = htmlToMarkdown('<span>just text</span>');
        expect(result).toBe('just text');
      });
    });

    describe('unknown / non-element nodes', () => {
      it('passes through unknown tags by returning inner content', () => {
        const result = htmlToMarkdown('<section>content</section>');
        expect(result).toBe('content');
      });

      it('ignores comment nodes', () => {
        const result = htmlToMarkdown('a<!-- comment -->b');
        expect(result).toBe('ab');
      });
    });
  });

  describe('cleanMarkdown', () => {
    it('should remove empty code blocks (triple backticks with only whitespace)', () => {
      const result = cleanMarkdown('before``` ```after');
      expect(result).toBe('beforeafter');
    });

    it('should remove empty inline code (backticks with only whitespace)', () => {
      const result = cleanMarkdown('before` `after');
      expect(result).toBe('beforeafter');
    });

    it('should collapse multiple newlines to two', () => {
      const result = cleanMarkdown('line1\n\n\n\nline2');
      expect(result).toBe('line1\n\nline2');
    });

    it('should trim leading and trailing whitespace', () => {
      const result = cleanMarkdown('   hello   ');
      expect(result).toBe('hello');
    });

    it('should handle zero-width characters in empty code blocks', () => {
      const result = cleanMarkdown('```\u200B```');
      expect(result).toBe('');
    });
  });

  describe('convertHtmlToMarkdown', () => {
    it('should convert html and clean the result', () => {
      const html = '<b>bold</b>';
      const result = convertHtmlToMarkdown(html);
      expect(result).toBe('**bold**');
    });

    it('should remove empty code blocks from converted html', () => {
      const html = '<code> </code>text';
      const result = convertHtmlToMarkdown(html);
      expect(result).toBe('text');
    });

    it('should return empty string for empty input', () => {
      expect(convertHtmlToMarkdown('')).toBe('');
    });
  });
});
