import { describe, it, expect } from 'vitest';
import { CometChatMarkdownFormatter } from '../CometChatMarkdownFormatter';

describe('CometChatMarkdownFormatter', () => {
  let formatter: CometChatMarkdownFormatter;

  beforeEach(() => {
    formatter = new CometChatMarkdownFormatter();
  });

  describe('id and priority', () => {
    it('should have id "markdown-formatter"', () => {
      expect(formatter.id).toBe('markdown-formatter');
    });

    it('should have priority 10', () => {
      expect(formatter.priority).toBe(10);
    });
  });

  describe('getRegex', () => {
    it('should return a regex that matches markdown patterns', () => {
      const regex = formatter.getRegex();
      expect(regex).toBeInstanceOf(RegExp);
      expect('**bold**'.match(regex)).not.toBeNull();
      expect('`code`'.match(regex)).not.toBeNull();
      expect('> quote'.match(regex)).not.toBeNull();
    });
  });

  describe('format - empty and falsy input', () => {
    it('should return empty string for empty input', () => {
      expect(formatter.format('')).toBe('');
    });

    it('should return empty string for null-like input', () => {
      expect(formatter.format(null as unknown as string)).toBe('');
      expect(formatter.format(undefined as unknown as string)).toBe('');
    });

    it('should set originalText and formattedText to empty for empty input', () => {
      formatter.format('');
      expect(formatter.getOriginalText()).toBe('');
      expect(formatter.getFormattedText()).toBe('');
    });
  });

  describe('format - inline formatting', () => {
    it('should convert **bold** to <b>bold</b>', () => {
      expect(formatter.format('**hello**')).toBe('<b>hello</b>');
    });

    it('should convert _italic_ to <i>italic</i>', () => {
      expect(formatter.format('_hello_')).toBe('<i>hello</i>');
    });

    it('should convert __underline__ to <u>underline</u>', () => {
      expect(formatter.format('__hello__')).toBe('<u>hello</u>');
    });

    it('should convert ++underline++ to <u>underline</u>', () => {
      expect(formatter.format('++hello++')).toBe('<u>hello</u>');
    });

    it('should convert ~~strikethrough~~ to <s>strikethrough</s>', () => {
      expect(formatter.format('~~hello~~')).toBe('<s>hello</s>');
    });

    it('should convert `inline code` to <code>inline code</code>', () => {
      expect(formatter.format('`const x = 1`')).toBe('<code>const x = 1</code>');
    });

    it('should handle multiple inline formats in one line', () => {
      const result = formatter.format('**bold** and _italic_');
      expect(result).toContain('<b>bold</b>');
      expect(result).toContain('<i>italic</i>');
    });
  });

  describe('format - code blocks', () => {
    it('should convert ```code``` to <pre><code>code</code></pre>', () => {
      expect(formatter.format('```hello world```')).toBe('<pre><code>hello world</code></pre>');
    });

    it('should not apply inline formatting inside code blocks', () => {
      const result = formatter.format('```**not bold** _not italic_```');
      expect(result).toBe('<pre><code>**not bold** _not italic_</code></pre>');
    });

    it('should handle multi-line code blocks', () => {
      const input = '```\nline1\nline2\n```';
      const result = formatter.format(input);
      expect(result).toContain('<pre><code>');
      expect(result).toContain('line1');
      expect(result).toContain('line2');
    });
  });

  describe('format - links', () => {
    it('should convert [text](url) to anchor tag', () => {
      const result = formatter.format('[Google](https://google.com)');
      expect(result).toBe(
        '<a href="https://google.com" target="_blank" rel="noopener noreferrer" class="cometchat-link">Google</a>'
      );
    });

    it('should handle multiple links', () => {
      const result = formatter.format('[A](http://a.com) and [B](http://b.com)');
      expect(result).toContain('href="http://a.com"');
      expect(result).toContain('href="http://b.com"');
    });
  });

  describe('format - blockquotes', () => {
    it('should convert > text to <blockquote>text</blockquote>', () => {
      const result = formatter.format('> hello');
      expect(result).toBe('<blockquote>hello</blockquote>');
    });

    it('should handle multi-line blockquotes', () => {
      const result = formatter.format('> line1\n> line2');
      expect(result).toBe('<blockquote>line1\nline2</blockquote>');
    });

    it('should handle &gt; encoded blockquotes', () => {
      const result = formatter.format('&gt; hello');
      expect(result).toBe('<blockquote>hello</blockquote>');
    });
  });

  describe('format - ordered lists', () => {
    it('should convert numbered items to <ol>', () => {
      const result = formatter.format('1. first\n2. second');
      expect(result).toContain('<ol');
      expect(result).toContain('<li');
      expect(result).toContain('first');
      expect(result).toContain('second');
      expect(result).toContain('</ol>');
    });

    it('should handle nested ordered lists', () => {
      const result = formatter.format('1. first\n    1. nested');
      expect(result).toContain('lower-alpha');
      expect(result).toContain('nested');
    });
  });

  describe('format - unordered lists', () => {
    it('should convert bullet items to <ul>', () => {
      const result = formatter.format('• first\n• second');
      expect(result).toContain('<ul');
      expect(result).toContain('<li');
      expect(result).toContain('first');
      expect(result).toContain('second');
      expect(result).toContain('</ul>');
    });

    it('should handle dash items', () => {
      const result = formatter.format('- first\n- second');
      expect(result).toContain('<ul');
      expect(result).toContain('first');
      expect(result).toContain('second');
    });

    it('should handle nested unordered lists', () => {
      const result = formatter.format('• first\n    • nested');
      expect(result).toContain('circle');
      expect(result).toContain('nested');
    });
  });

  describe('format - stores original and formatted text', () => {
    it('should store originalText', () => {
      formatter.format('**bold**');
      expect(formatter.getOriginalText()).toBe('**bold**');
    });

    it('should store formattedText', () => {
      formatter.format('**bold**');
      expect(formatter.getFormattedText()).toBe('<b>bold</b>');
    });
  });

  describe('stripMarkdownForConversation', () => {
    it('should convert bold to <b> tags', () => {
      expect(formatter.stripMarkdownForConversation('**bold**')).toBe('<b>bold</b>');
    });

    it('should convert italic to <i> tags', () => {
      expect(formatter.stripMarkdownForConversation('_italic_')).toBe('<i>italic</i>');
    });

    it('should convert underline __ to <u> tags', () => {
      expect(formatter.stripMarkdownForConversation('__under__')).toBe('<u>under</u>');
    });

    it('should convert underline ++ to <u> tags', () => {
      expect(formatter.stripMarkdownForConversation('++under++')).toBe('<u>under</u>');
    });

    it('should convert strikethrough to <s> tags', () => {
      expect(formatter.stripMarkdownForConversation('~~strike~~')).toBe('<s>strike</s>');
    });

    it('should convert inline code to <code> tags', () => {
      expect(formatter.stripMarkdownForConversation('`code`')).toBe('<code>code</code>');
    });

    it('should strip links to just text', () => {
      expect(formatter.stripMarkdownForConversation('[Click](http://url.com)')).toBe('Click');
    });

    it('should strip blockquote markers', () => {
      expect(formatter.stripMarkdownForConversation('> quoted')).toBe('quoted');
    });

    it('should strip code blocks to content only', () => {
      expect(formatter.stripMarkdownForConversation('```code block```')).toBe('code block');
    });

    it('should strip zero-width spaces', () => {
      expect(formatter.stripMarkdownForConversation('hello\u200Bworld')).toBe('helloworld');
    });

    it('should handle multi-line text', () => {
      const input = '**bold**\n_italic_';
      const result = formatter.stripMarkdownForConversation(input);
      expect(result).toContain('<b>bold</b>');
      expect(result).toContain('<i>italic</i>');
    });
  });
});
