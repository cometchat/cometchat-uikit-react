import { describe, it, expect } from 'vitest';
import { shieldUrls, markersInsideUrl, trimUrlTrailing } from '../urlShielding';

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

  it('shields a balanced paren as part of the address', () => {
    const url = 'https://en.wikipedia.org/wiki/Mercury_(planet)';
    const { text, restore } = shieldUrls(url);
    expect(text).not.toContain(')');
    expect(restore(text)).toBe(url);
  });

  it('keeps the markdown paren outside a target that has balanced ones', () => {
    const { text } = shieldUrls('[Mercury](https://en.wikipedia.org/wiki/Mercury_(planet))');
    expect(text).toBe(text.replace(/\)+$/, '') + ')');
  });

  it('keeps a markdown link separable when the label is itself a URL', () => {
    // What pasting a copied link produces: the anchor's text is its own address.
    const url = 'https://drive.google.com/file/d/1g3Xz3EficX_lDKh/view?usp=drive_link';
    const { text, restore } = shieldUrls(`[${url}](${url})`);
    // Label and target are shielded separately, so `](` survives for the link rule.
    expect(text).toContain('](');
    expect(text).not.toContain('_');
    expect(restore(text)).toBe(`[${url}](${url})`);
  });

  it('shields an IPv6 host whole', () => {
    // `]` only ends the span when `(` follows it.
    const url = 'http://[::1]:3000/a_b_c';
    const { text, restore } = shieldUrls(url);
    expect(text).not.toContain('_');
    expect(restore(text)).toBe(url);
  });

  // Balance alone cannot tell an address's own paren from the one closing
  // `[label](…)`. Where the address holds an unmatched `(`, the parens add up
  // only by borrowing the link's paren, leaving nothing to close the link.
  it('hands back the paren that closes a markdown link', () => {
    const { text } = shieldUrls('[docs](https://example.com/a_(b)');
    expect(text.endsWith(')')).toBe(true);
    expect(text).toContain('](');
  });

  it('keeps the address paren when the link brings its own', () => {
    const { text, restore } = shieldUrls(
      '[Mercury](https://en.wikipedia.org/wiki/Mercury_(planet))'
    );
    expect(text.endsWith(')')).toBe(true);
    expect(restore(text)).toBe('[Mercury](https://en.wikipedia.org/wiki/Mercury_(planet))');
  });

  it('leaves a bare address with a balanced paren alone', () => {
    const url = 'https://en.wikipedia.org/wiki/Mercury_(planet)';
    const { text, restore } = shieldUrls(url);
    expect(text).not.toContain(')');
    expect(restore(text)).toBe(url);
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

describe('trimUrlTrailing', () => {
  // A closing paren ends both an address and the markdown that wraps one, so
  // the balance decides it rather than the position.
  it.each([
    [
      'https://en.wikipedia.org/wiki/Mercury_(planet)',
      'https://en.wikipedia.org/wiki/Mercury_(planet)',
    ],
    [
      'https://en.wikipedia.org/wiki/Python_(programming_language)',
      'https://en.wikipedia.org/wiki/Python_(programming_language)',
    ],
    [
      'https://learn.microsoft.com/api/string.format(v=vs.110)',
      'https://learn.microsoft.com/api/string.format(v=vs.110)',
    ],
    ['https://example.com/a_(b)_(c)', 'https://example.com/a_(b)_(c)'],
    // Nothing to close — the paren came from the text around the address.
    ['https://example.com/page)', 'https://example.com/page'],
    [
      'https://en.wikipedia.org/wiki/Mercury_(planet))',
      'https://en.wikipedia.org/wiki/Mercury_(planet)',
    ],
    // Ordinary sentence punctuation, and punctuation outside a balanced paren.
    ['https://example.com/page.', 'https://example.com/page'],
    [
      'https://en.wikipedia.org/wiki/Mercury_(planet).',
      'https://en.wikipedia.org/wiki/Mercury_(planet)',
    ],
    ['https://example.com/page**', 'https://example.com/page'],
    ['https://example.com/page', 'https://example.com/page'],
  ])('trims %s', (input, expected) => {
    expect(trimUrlTrailing(input)).toBe(expected);
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
