import { describe, it, expect, vi, afterEach } from 'vitest';
import { CometChatRichTextFormatter } from '../CometChatRichTextFormatter';

describe('CometChatRichTextFormatter', () => {
  let formatter: CometChatRichTextFormatter;

  beforeEach(() => {
    formatter = new CometChatRichTextFormatter();
  });

  describe('id and priority', () => {
    it('should have id "rich-text-formatter"', () => {
      expect(formatter.id).toBe('rich-text-formatter');
    });

    it('should have priority 200', () => {
      expect(formatter.priority).toBe(200);
    });
  });

  describe('getRegex', () => {
    it('should match HTML tags', () => {
      const regex = formatter.getRegex();
      expect(regex.test('<b>bold</b>')).toBe(true);
      expect(regex.test('<strong>bold</strong>')).toBe(true);
      expect(regex.test('<i>italic</i>')).toBe(true);
      expect(regex.test('<code>code</code>')).toBe(true);
      expect(regex.test('plain text')).toBe(false);
    });
  });

  describe('shouldFormat', () => {
    it('should return true for HTML content', () => {
      expect(formatter.shouldFormat('<b>bold</b>')).toBe(true);
      expect(formatter.shouldFormat('<pre><code>code</code></pre>')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(formatter.shouldFormat('hello world')).toBe(false);
      expect(formatter.shouldFormat('**bold**')).toBe(false);
    });
  });

  describe('format - empty input', () => {
    it('should return empty string for empty input', () => {
      expect(formatter.format('')).toBe('');
    });

    it('should return empty for null', () => {
      expect(formatter.format(null as unknown as string)).toBe('');
    });
  });

  describe('format - plain text passthrough', () => {
    it('should pass through plain text unchanged', () => {
      expect(formatter.format('hello world')).toBe('hello world');
    });

    it('should pass through markdown text unchanged', () => {
      expect(formatter.format('**bold** _italic_')).toBe('**bold** _italic_');
    });
  });

  describe('format - bold', () => {
    it('should convert <b> to **', () => {
      const result = formatter.format('<b>bold</b>');
      expect(result).toBe('**bold**');
    });

    it('should convert <strong> to **', () => {
      const result = formatter.format('<strong>bold</strong>');
      expect(result).toBe('**bold**');
    });
  });

  describe('format - italic', () => {
    it('should convert <i> to _', () => {
      const result = formatter.format('<i>italic</i>');
      expect(result).toBe('_italic_');
    });

    it('should convert <em> to _', () => {
      const result = formatter.format('<em>italic</em>');
      expect(result).toBe('_italic_');
    });
  });

  describe('format - underline', () => {
    it('should convert <u> to <u> markdown', () => {
      const result = formatter.format('<u>underline</u>');
      expect(result).toBe('<u>underline</u>');
    });
  });

  describe('format - strikethrough', () => {
    it('should convert <s> to ~~', () => {
      const result = formatter.format('<s>strike</s>');
      expect(result).toBe('~~strike~~');
    });

    it('should convert <del> to ~~', () => {
      const result = formatter.format('<del>deleted</del>');
      expect(result).toBe('~~deleted~~');
    });
  });

  describe('format - code', () => {
    it('should convert <code> to backticks', () => {
      const result = formatter.format('<code>code</code>');
      expect(result).toBe('`code`');
    });

    it('should convert <pre><code> to triple backticks', () => {
      const result = formatter.format('<pre><code>block</code></pre>');
      expect(result).toContain('```');
      expect(result).toContain('block');
    });
  });

  describe('format - blockquote', () => {
    it('should convert <blockquote> to >', () => {
      const result = formatter.format('<blockquote>quoted</blockquote>');
      expect(result).toBe('> quoted');
    });
  });

  describe('format - links', () => {
    it('should convert <a> to [text](url)', () => {
      const result = formatter.format('<a href="https://example.com">Click</a>');
      expect(result).toBe('[Click](https://example.com)');
    });
  });

  describe('format - lists', () => {
    it('should convert <ol> to numbered list', () => {
      const result = formatter.format('<ol><li>first</li><li>second</li></ol>');
      expect(result).toContain('1. first');
      expect(result).toContain('2. second');
    });

    it('should convert <ul> to bullet list', () => {
      const result = formatter.format('<ul><li>apple</li><li>banana</li></ul>');
      expect(result).toContain('• apple');
      expect(result).toContain('• banana');
    });
  });

  describe('format - line breaks', () => {
    it('should convert <br> to newline', () => {
      const result = formatter.format('line1<br>line2');
      expect(result).toContain('line1\nline2');
    });

    it('should handle <p> tags', () => {
      const result = formatter.format('<p>para1</p><p>para2</p>');
      expect(result).toContain('para1');
      expect(result).toContain('para2');
    });
  });

  describe('format - mentions', () => {
    it('should convert user mention spans to SDK format', () => {
      const html =
        '<span class="cometchat-mentions" data-uid="user1" data-mention-type="user">@Alice</span>';
      const result = formatter.format(html);
      expect(result).toBe('<@uid:user1>');
    });

    it('should convert channel mentions to @all format', () => {
      const html =
        '<span class="cometchat-mentions" data-uid="all" data-mention-type="channel">@everyone</span>';
      const result = formatter.format(html);
      expect(result).toBe('<@all:all>');
    });
  });

  describe('format - stores text', () => {
    it('should store originalText', () => {
      formatter.format('<b>bold</b>');
      expect(formatter.getOriginalText()).toBe('<b>bold</b>');
    });

    it('should store formattedText', () => {
      formatter.format('<b>bold</b>');
      expect(formatter.getFormattedText()).toBe('**bold**');
    });
  });

  describe('format - nested formatting', () => {
    it('should handle bold inside italic', () => {
      const result = formatter.format('<i><b>bold italic</b></i>');
      expect(result).toBe('_**bold italic**_');
    });

    it('should not wrap inline markers around a nested pre block', () => {
      const result = formatter.format('<b><pre><code>code</code></pre></b>');
      expect(result).not.toContain('**');
      expect(result).toContain('```');
      expect(result).toContain('code');
    });

    it('should not wrap italic markers around a nested pre block', () => {
      const result = formatter.format('<i><pre><code>x</code></pre></i>');
      expect(result).not.toContain('_');
    });

    it('should not wrap underline markers around a nested pre block', () => {
      const result = formatter.format('<u><pre><code>x</code></pre></u>');
      expect(result).not.toContain('<u>');
    });

    it('should not wrap strikethrough markers around a nested pre block', () => {
      const result = formatter.format('<s><pre><code>x</code></pre></s>');
      expect(result).not.toContain('~~');
    });
  });

  describe('format - strikethrough variants', () => {
    it('should convert <strike> to ~~', () => {
      expect(formatter.format('<strike>old</strike>')).toBe('~~old~~');
    });
  });

  describe('format - wrapPerLine multiline', () => {
    it('should wrap bold markers per-line when content spans multiple lines', () => {
      const result = formatter.format('<b>line1<br>line2</b>');
      expect(result).toBe('**line1**\n**line2**');
    });

    it('should preserve blank lines without wrapping when wrapping per-line', () => {
      const result = formatter.format('<b>line1<br><br>line2</b>');
      // blank middle line should not be wrapped
      expect(result).toContain('**line1**');
      expect(result).toContain('**line2**');
      expect(result).not.toContain('****');
    });
  });

  describe('format - inline code edge cases', () => {
    it('should render a link inside inline code as a markdown link', () => {
      const html = '<code><a href="https://x.com">site</a></code>';
      expect(formatter.format(html)).toBe('[site](https://x.com)');
    });

    it('should drop empty inline code', () => {
      // zero-width space only → cleaned to empty
      expect(formatter.format('<code>​</code>')).toBe('');
    });

    it('should wrap each non-empty line of multiline inline code', () => {
      const result = formatter.format('<code>a<br>b</code>');
      expect(result).toBe('`a`\n`b`');
    });

    it('should preserve bold formatting inside inline code', () => {
      const result = formatter.format('<code>x <b>y</b></code>');
      expect(result).toBe('`x **y**`');
    });

    it('should preserve italic formatting inside inline code', () => {
      const result = formatter.format('<code>a<i>b</i></code>');
      expect(result).toBe('`a_b_`');
    });

    it('should preserve underline formatting inside inline code', () => {
      const result = formatter.format('<code>a<u>b</u></code>');
      expect(result).toBe('`a<u>b</u>`');
    });

    it('should preserve strikethrough formatting inside inline code', () => {
      const result = formatter.format('<code>a<s>b</s></code>');
      expect(result).toBe('`a~~b~~`');
    });

    it('should output only the link when inline code contains a link (link takes precedence)', () => {
      const result = formatter.format('<code>see <a href="https://y.com">y</a></code>');
      expect(result).toBe('[y](https://y.com)');
    });

    it('should treat mentions inside inline code as plain text', () => {
      const html =
        '<code><span class="cometchat-mentions" data-uid="u1" data-mention-type="user">@Bob</span></code>';
      expect(formatter.format(html)).toBe('`@Bob`');
    });
  });

  describe('format - code block edge cases', () => {
    it('should convert mention spans inside a code block to SDK format', () => {
      const html =
        '<pre><code><span class="cometchat-mentions" data-uid="u9" data-mention-type="user">@Sue</span></code></pre>';
      const result = formatter.format(html);
      expect(result).toContain('<@uid:u9>');
    });

    it('should convert channel mention inside a code block to @all', () => {
      const html =
        '<pre><code><span class="cometchat-mentions" data-uid="all" data-mention-type="channel">@here</span></code></pre>';
      const result = formatter.format(html);
      expect(result).toContain('<@all:all>');
    });

    it('should convert <br> inside code block to newline', () => {
      const result = formatter.format('<pre><code>a<br>b</code></pre>');
      expect(result).toBe('```\na\nb\n```');
    });

    it('should treat div/p inside code block as line breaks', () => {
      const result = formatter.format('<pre><code><div>a</div><div>b</div></code></pre>');
      expect(result).toContain('a');
      expect(result).toContain('b');
    });

    it('should strip inline formatting inside a code block to plain text', () => {
      const result = formatter.format('<pre><code><b>bold</b></code></pre>');
      expect(result).toBe('```\nbold\n```');
    });

    it('should handle a <pre> without a <code> child', () => {
      const result = formatter.format('<pre>raw code</pre>');
      expect(result).toBe('```\nraw code\n```');
    });
  });

  describe('format - mention fallback', () => {
    it('should fall back to visible text when mention span has no uid', () => {
      const html = '<span class="cometchat-mentions">@Unknown</span>';
      expect(formatter.format(html)).toBe('@Unknown');
    });

    it('should treat a non-mention span as a passthrough container', () => {
      const html = '<span class="foo">plain</span>';
      expect(formatter.format(html)).toBe('plain');
    });
  });

  describe('format - blockquote edge cases', () => {
    it('should strip trailing blank lines inside a blockquote', () => {
      const result = formatter.format('<blockquote>line<br><br></blockquote>');
      expect(result).toBe('> line');
    });

    it('should quote each line of a multiline blockquote', () => {
      const result = formatter.format('<blockquote>a<br>b</blockquote>');
      expect(result).toBe('> a\n> b');
    });
  });

  describe('format - ordered list numbering', () => {
    it('should respect the start attribute', () => {
      const result = formatter.format('<ol start="5"><li>a</li><li>b</li></ol>');
      expect(result).toContain('5. a');
      expect(result).toContain('6. b');
    });

    it('should default to 1 when start attribute is not a number', () => {
      const result = formatter.format('<ol start="abc"><li>a</li></ol>');
      expect(result).toContain('1. a');
    });

    it('should use lower-alpha markers for nested ordered lists (depth 1)', () => {
      const html = '<ol><li>top<ol><li>sub1</li><li>sub2</li></ol></li></ol>';
      const result = formatter.format(html);
      expect(result).toContain('1. top');
      expect(result).toContain('a. sub1');
      expect(result).toContain('b. sub2');
    });

    it('should use lower-roman markers for doubly-nested ordered lists (depth 2)', () => {
      const html = '<ol><li>a<ol><li>b<ol><li>deep1</li><li>deep2</li></ol></li></ol></li></ol>';
      const result = formatter.format(html);
      expect(result).toContain('i. deep1');
      expect(result).toContain('ii. deep2');
    });

    it('should skip empty list items in numbering', () => {
      const result = formatter.format('<ol><li>a</li><li></li><li>b</li></ol>');
      expect(result).toContain('1. a');
      expect(result).toContain('2. b');
      expect(result).not.toContain('3.');
    });
  });

  describe('format - nested unordered lists', () => {
    it('should indent nested bullet lists', () => {
      const html = '<ul><li>top<ul><li>sub</li></ul></li></ul>';
      const result = formatter.format(html);
      expect(result).toContain('• top');
      expect(result).toContain('    • sub');
    });
  });

  describe('format - list item content', () => {
    it('should flatten div/p inside a list item onto one line', () => {
      const html = '<ul><li><div>part one</div><div>part two</div></li></ul>';
      const result = formatter.format(html);
      expect(result).toContain('• part one part two');
    });

    it('should treat <br> inside a list item as a space', () => {
      const html = '<ul><li>a<br>b</li></ul>';
      const result = formatter.format(html);
      expect(result).toContain('• a b');
    });
  });

  describe('format - link fallback', () => {
    it('should use href as text when the anchor has no inner content', () => {
      const result = formatter.format('<a href="https://z.com"></a>');
      expect(result).toBe('[https://z.com](https://z.com)');
    });
  });

  describe('cleanMarkdown', () => {
    it('should collapse 3+ consecutive newlines into 2', () => {
      const result = formatter.format('<p>a</p><br><br><br><br><p>b</p>');
      expect(result).not.toContain('\n\n\n');
    });

    it('should remove empty code fences', () => {
      const result = formatter.format('<pre><code>   </code></pre>');
      expect(result).toBe('');
    });
  });

  describe('format - SSR fallback (no document)', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should use regex-based conversion when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      const result = formatter.format('<b>bold</b> <i>it</i> <s>st</s>');
      expect(result).toContain('**bold**');
      expect(result).toContain('_it_');
      expect(result).toContain('~~st~~');
    });

    it('should convert <strong>, <em>, <del>, <code> and links in fallback mode', () => {
      vi.stubGlobal('document', undefined);
      const html =
        '<strong>b</strong><em>e</em><del>d</del><code>c</code><a href="https://q.com">q</a>';
      const result = formatter.format(html);
      expect(result).toContain('**b**');
      expect(result).toContain('_e_');
      expect(result).toContain('~~d~~');
      expect(result).toContain('`c`');
      expect(result).toContain('[q](https://q.com)');
    });

    it('should convert <br> and block tags to newlines and strip unknown tags in fallback', () => {
      vi.stubGlobal('document', undefined);
      const result = formatter.format('<div>a</div>x<br>y<span>z</span>');
      expect(result).toContain('a');
      expect(result).toContain('x');
      expect(result).toContain('y');
      expect(result).toContain('z');
      expect(result).not.toContain('<span>');
    });
  });
});
