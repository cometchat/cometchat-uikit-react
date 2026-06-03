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
});
