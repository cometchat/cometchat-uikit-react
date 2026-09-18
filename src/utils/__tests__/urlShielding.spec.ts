import { describe, it, expect } from 'vitest';
import { shieldUrls, markersInsideUrl } from '../urlShielding';

describe('shieldUrls', () => {
  it('hides a URL from marker rules and restores it', () => {
    const url = 'https://example.com/a_b_c';
    const { text, restore } = shieldUrls(url);
    expect(text).not.toContain('_');
    expect(restore(text)).toBe(url);
  });

  it('leaves ordinary text alone', () => {
    const { text, restore } = shieldUrls('my_var_name');
    expect(text).toBe('my_var_name');
    expect(restore(text)).toBe('my_var_name');
  });

  it('leaves trailing punctuation outside the shielded span', () => {
    const { text, restore } = shieldUrls('See https://example.com/a_b_c.');
    expect(text.endsWith('.')).toBe(true);
    expect(restore(text)).toBe('See https://example.com/a_b_c.');
  });

  it('leaves a wrapping marker outside the shielded span', () => {
    const { text } = shieldUrls('**https://example.com/a_b_c**');
    expect(text.startsWith('**')).toBe(true);
    expect(text.endsWith('**')).toBe(true);
  });

  it('leaves the closing paren of a markdown link outside', () => {
    const { text } = shieldUrls('[l](https://example.com/a_b_c)');
    expect(text.endsWith(')')).toBe(true);
  });

  it('shields several URLs independently', () => {
    const input = 'https://a.com/x_y_z and https://b.com/p_q_r';
    const { text, restore } = shieldUrls(input);
    expect(text).not.toContain('_');
    expect(restore(text)).toBe(input);
  });

  it('shields www. and http:// forms', () => {
    for (const url of ['www.example.com/a_b_c', 'http://example.com/a_b_c']) {
      const { text, restore } = shieldUrls(url);
      expect(text).not.toContain('_');
      expect(restore(text)).toBe(url);
    }
  });

  it('restore is a no-op when nothing was shielded', () => {
    const { restore } = shieldUrls('plain text');
    expect(restore('anything')).toBe('anything');
  });
});

describe('markersInsideUrl', () => {
  const url = 'https://example.com/a_b_';

  it('reports markers inside a URL', () => {
    // The `_b_` span at the end of a part-typed URL.
    expect(markersInsideUrl(url, url.length - 3, url.length)).toBe(true);
  });

  it('ignores markers outside any URL', () => {
    const text = 'https://example.com/x and _it_';
    expect(markersInsideUrl(text, text.length - 4, text.length)).toBe(false);
  });

  it('allows markers that wrap a URL', () => {
    const text = '_https://example.com/abc_';
    expect(markersInsideUrl(text, 0, text.length)).toBe(false);
  });

  it('returns false when there is no URL at all', () => {
    expect(markersInsideUrl('my_var_', 3, 7)).toBe(false);
  });
});
