import { describe, it, expect } from 'vitest';
import { sanitizeHtml, escapeUserHtml, stripInvalidMentionFormats } from '../sanitizeHtml';

describe('sanitizeHtml', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as unknown as string)).toBe('');
    expect(sanitizeHtml('   ')).toBe('');
  });

  it('strips <script> tags', () => {
    const result = sanitizeHtml('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('strips event handlers', () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
  });

  it('preserves allowed tags', () => {
    const result = sanitizeHtml('<span class="test">Hello</span>');
    expect(result).toContain('<span');
    expect(result).toContain('class="test"');
  });

  it('preserves <a> tags with allowed attributes', () => {
    const result = sanitizeHtml('<a href="https://example.com" class="cometchat-link">Link</a>');
    expect(result).toContain('<a');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('class="cometchat-link"');
  });

  it('preserves data attributes for mentions', () => {
    const result = sanitizeHtml(
      '<span class="cometchat-mentions" data-uid="user1" data-mention-type="other">@User</span>'
    );
    expect(result).toContain('data-uid="user1"');
    expect(result).toContain('data-mention-type="other"');
  });

  it('adds target and rel to links via hook', () => {
    const result = sanitizeHtml('<a href="https://example.com">Link</a>');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('preserves formatting tags', () => {
    const result = sanitizeHtml('<strong>bold</strong> <em>italic</em> <code>code</code>');
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
    expect(result).toContain('<code>');
  });
});

describe('escapeUserHtml', () => {
  it('returns empty string for empty input', () => {
    expect(escapeUserHtml('')).toBe('');
    expect(escapeUserHtml(null as unknown as string)).toBe('');
  });

  it('escapes < > characters in HTML tags', () => {
    const result = escapeUserHtml('<script>alert("xss")</script>');
    expect(result).toContain('&lt;script&gt;');
    // Quotes are not escaped — only angle brackets in HTML tags are
    expect(result).toContain('"xss"');
  });

  it('does not escape single quotes (only HTML tags are escaped)', () => {
    const result = escapeUserHtml("it's a test");
    expect(result).toBe("it's a test");
  });

  it('preserves SDK user mention patterns', () => {
    const result = escapeUserHtml('Hello <@uid:user123> world');
    expect(result).toContain('<@uid:user123>');
  });

  it('preserves SDK channel mention patterns', () => {
    const result = escapeUserHtml('Hello <@all:everyone> world');
    expect(result).toContain('<@all:everyone>');
  });

  it('escapes non-mention angle brackets', () => {
    const result = escapeUserHtml('Hello <b>bold</b> <@uid:user1>');
    expect(result).toContain('&lt;b&gt;');
    expect(result).toContain('<@uid:user1>');
  });
});

describe('stripInvalidMentionFormats', () => {
  it('returns empty string for empty input', () => {
    expect(stripInvalidMentionFormats('')).toBe('');
  });

  it('preserves valid <@uid:xxx> mentions', () => {
    const result = stripInvalidMentionFormats('Hello <@uid:user123>');
    expect(result).toBe('Hello <@uid:user123>');
  });

  it('preserves valid <@all:xxx> mentions', () => {
    const result = stripInvalidMentionFormats('Hello <@all:everyone>');
    expect(result).toBe('Hello <@all:everyone>');
  });

  it('strips invalid mention formats', () => {
    const result = stripInvalidMentionFormats('Hello <@john:John Doe>');
    expect(result).toBe('Hello ');
  });

  it('strips multiple invalid mentions', () => {
    const result = stripInvalidMentionFormats('<@foo:bar> and <@baz:qux>');
    expect(result).toBe(' and ');
  });
});
