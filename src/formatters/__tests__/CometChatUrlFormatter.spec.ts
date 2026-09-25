import { describe, it, expect, beforeEach } from 'vitest';
import { CometChatUrlFormatter } from '../CometChatUrlFormatter';

describe('CometChatUrlFormatter', () => {
  let formatter: CometChatUrlFormatter;

  beforeEach(() => {
    formatter = new CometChatUrlFormatter();
  });

  it('has id "url-formatter"', () => {
    expect(formatter.id).toBe('url-formatter');
  });

  it('has priority 100', () => {
    expect(formatter.priority).toBe(100);
  });

  it('returns empty string for empty input', () => {
    expect(formatter.format('')).toBe('');
    expect(formatter.format(null as unknown as string)).toBe('');
  });

  it('detects https:// URLs', () => {
    const result = formatter.format('Visit https://example.com today');
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain('class="cometchat-link"');
  });

  it('detects http:// URLs', () => {
    const result = formatter.format('Visit http://example.com today');
    expect(result).toContain('<a href="http://example.com"');
  });

  it('detects www. URLs and prepends https://', () => {
    const result = formatter.format('Visit www.example.com today');
    expect(result).toContain('href="https://www.example.com"');
    expect(result).toContain('>www.example.com</a>');
  });

  it('creates links with security attributes', () => {
    const result = formatter.format('https://example.com');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('strips trailing punctuation from URLs', () => {
    const result = formatter.format('Check https://example.com.');
    expect(result).toContain('>https://example.com</a>.');
  });

  it('strips trailing comma from URLs', () => {
    const result = formatter.format('See https://example.com, and more');
    expect(result).toContain('>https://example.com</a>,');
  });

  it('protects existing <a> tags from double-processing', () => {
    const input =
      'See <a href="https://example.com" class="cometchat-link">https://example.com</a> here';
    const result = formatter.format(input);
    // Should not create nested <a> tags
    const anchorCount = (result.match(/<a /g) ?? []).length;
    expect(anchorCount).toBe(1);
  });

  it('protects existing <a> tags whose text contains nested inline markup (color/bold)', () => {
    // A markdown link whose label was already turned into a colored span by an earlier formatter.
    const input =
      '<a href="https://www.google.com" target="_blank" rel="noopener noreferrer" class="cometchat-link"><span style="color:#e11">link</span></a>';
    const result = formatter.format(input);
    // The href URL must NOT be re-linkified into the attribute — exactly one anchor, intact.
    expect((result.match(/<a /g) ?? []).length).toBe(1);
    expect(result).toBe(input);
    expect(result).not.toContain('href="<a');
  });

  it('protects markdown links from double-processing', () => {
    const input = 'See [Example](https://example.com) here';
    const result = formatter.format(input);
    expect(result).toContain('[Example](https://example.com)');
  });

  it('getUrls returns detected URLs', () => {
    formatter.format('Visit https://a.com and https://b.com');
    const urls = formatter.getUrls();
    expect(urls).toHaveLength(2);
    expect(urls).toContain('https://a.com');
    expect(urls).toContain('https://b.com');
  });

  it('handles text with no URLs', () => {
    const result = formatter.format('No links here');
    expect(result).toBe('No links here');
    expect(formatter.getUrls()).toHaveLength(0);
  });

  it('reset clears URLs', () => {
    formatter.format('https://example.com');
    expect(formatter.getUrls()).toHaveLength(1);
    formatter.reset();
    expect(formatter.getUrls()).toHaveLength(0);
  });

  // Links must not be generated inside code spans, and a URL carrying multiple
  // underscores must linkify in full.
  describe('code spans and multi-underscore URLs', () => {
    it('does not linkify inside inline code', () => {
      const input = '<code>https://example.com/a_b_c</code>';
      const result = formatter.format(input);
      expect(result).toBe(input);
      expect(formatter.getUrls()).toHaveLength(0);
    });

    it('does not linkify inside a code block', () => {
      const input = '<pre><code>https://example.com/a_b_c</code></pre>';
      const result = formatter.format(input);
      expect(result).toBe(input);
      expect(formatter.getUrls()).toHaveLength(0);
    });

    it('still linkifies a URL outside a code span in the same text', () => {
      const result = formatter.format('<code>https://a.com</code> and https://b.com');
      expect(result).toContain('<code>https://a.com</code>');
      expect(result).toContain('<a href="https://b.com"');
      expect(formatter.getUrls()).toEqual(['https://b.com']);
    });

    it('linkifies a URL with two underscores in full', () => {
      const url = 'https://example.com/file/d/1AbCdEfGhIj_kLmNoPqRsTu-9vWxY/view?usp=share_link';
      const result = formatter.format(url);
      expect(result).toContain(`href="${url}"`);
      expect(formatter.getUrls()).toEqual([url]);
    });
  });

  // The composer parks the caret in a U+200B text node after converting a markdown
  // span. If one of those lands inside a URL it is invisible but breaks the href,
  // including in messages already stored that way.
  describe('zero-width characters in URLs', () => {
    it('strips a zero-width space from the href and link text', () => {
      const result = formatter.format('https://example.com/a_b_​c');
      expect(result).toContain('href="https://example.com/a_b_c"');
      expect(result).not.toContain('​');
      expect(formatter.getUrls()).toEqual(['https://example.com/a_b_c']);
    });

    it('strips zero-width non-joiner and joiner too', () => {
      const result = formatter.format('https://example.com/a‌b‍c');
      expect(result).toContain('href="https://example.com/abc"');
    });

    it('treats U+FEFF as a boundary, since it counts as whitespace', () => {
      const result = formatter.format('https://example.com/abc﻿d');
      expect(result).toContain('href="https://example.com/abc"');
    });

    it('keeps trailing punctuation outside the link', () => {
      const result = formatter.format('See https://example.com/a​b.');
      expect(result).toContain('href="https://example.com/ab"');
      expect(result).toContain('</a>.');
    });
  });

  // The shapes an address takes in ordinary use. The trailing-punctuation rule
  // is the one piece of this formatter that has to tell an address apart from
  // the sentence around it, so these guard it against a change made for a
  // harder case.
  describe('everyday addresses', () => {
    it.each([
      ['https://google.com', 'https://google.com'],
      ['http://example.com', 'http://example.com'],
      ['www.google.com', 'https://www.google.com'],
      [
        'https://github.com/cometchat/chat-uikit-react',
        'https://github.com/cometchat/chat-uikit-react',
      ],
      ['https://example.com/path/to/page', 'https://example.com/path/to/page'],
      ['https://example.com/search?q=hello&lang=en', 'https://example.com/search?q=hello&lang=en'],
      ['https://example.com/page#section-2', 'https://example.com/page#section-2'],
      ['https://sub.domain.example.co.uk/a/b', 'https://sub.domain.example.co.uk/a/b'],
      ['http://localhost:3000/chat', 'http://localhost:3000/chat'],
      ['https://192.168.1.10:8080/x', 'https://192.168.1.10:8080/x'],
      ['https://example.com/a_b_c', 'https://example.com/a_b_c'],
    ])('links %s in full', (input, href) => {
      const result = new CometChatUrlFormatter().format(input);
      expect(result).toContain(`href="${href}"`);
      expect(result).toContain(`>${input}</a>`);
    });

    it('links every address in a sentence', () => {
      const result = new CometChatUrlFormatter().format(
        'Links: https://a.com, https://b.com and https://c.com'
      );
      expect(Array.from(result.matchAll(/href="([^"]*)"/g), m => m[1])).toEqual([
        'https://a.com',
        'https://b.com',
        'https://c.com',
      ]);
    });

    it('leaves text with no address alone', () => {
      const text = 'Hello world, no links here';
      expect(new CometChatUrlFormatter().format(text)).toBe(text);
    });
  });

  describe('addresses that end in a parenthesis', () => {
    // Wikipedia qualifies an ambiguous title with a parenthesis, so these are
    // ordinary links to paste into a chat, not an edge case.
    it('keeps a balanced closing paren in the href and the label', () => {
      const url = 'https://en.wikipedia.org/wiki/Mercury_(planet)';
      const result = new CometChatUrlFormatter().format(url);
      expect(result).toContain(`href="${url}"`);
      expect(result).toContain(`>${url}</a>`);
    });

    it('leaves a paren that closes the surrounding sentence outside the link', () => {
      const result = new CometChatUrlFormatter().format('(see https://example.com/page)');
      expect(result).toContain('href="https://example.com/page"');
      expect(result.endsWith(')')).toBe(true);
    });

    it('still trims ordinary sentence punctuation', () => {
      const result = new CometChatUrlFormatter().format(
        'See https://en.wikipedia.org/wiki/Mercury_(planet).'
      );
      expect(result).toContain('href="https://en.wikipedia.org/wiki/Mercury_(planet)"');
      expect(result.endsWith('.')).toBe(true);
    });
  });
});
