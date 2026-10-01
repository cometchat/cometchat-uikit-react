import { describe, it, expect } from 'vitest';
import { selectDestinationPreviews } from '../linkPreviewTargets';

const DRIVE =
  'https://drive.google.com/file/d/1g3Xz3EficX_lDKhbvxxwcv8TKd-9fZkY/view?usp=drive_link';

/** The shape the link-preview extension returns, reduced to what matters here. */
const preview = (url: string) => ({ url });

describe('selectDestinationPreviews', () => {
  it('drops the preview for a label that is an address', () => {
    const text = `[www.google.com](${DRIVE})`;
    const result = selectDestinationPreviews(
      [preview('https://www.google.com'), preview(DRIVE)],
      text
    );
    expect(result.map(p => p.url)).toEqual([DRIVE]);
  });

  it('matches a label written without a scheme', () => {
    // The text says `www.google.com`; the extension reports the resolved form.
    const result = selectDestinationPreviews(
      [preview('https://www.google.com/')],
      `[www.google.com](${DRIVE})`
    );
    expect(result).toEqual([]);
  });

  it('keeps the preview for a pasted link, whose label is its own target', () => {
    const result = selectDestinationPreviews([preview(DRIVE)], `[${DRIVE}](${DRIVE})`);
    expect(result.map(p => p.url)).toEqual([DRIVE]);
  });

  it('keeps a label that is also linked to elsewhere in the message', () => {
    const text = `www.google.com and [www.google.com](${DRIVE})`;
    const result = selectDestinationPreviews(
      [preview('https://www.google.com'), preview(DRIVE)],
      text
    );
    expect(result).toHaveLength(2);
  });

  // A message can reach the bubble as markdown, as an HTML anchor, or with the
  // anchor's angle brackets escaped. Which form it is in must not change which
  // previews are shown.
  it('drops an address label written as an HTML anchor', () => {
    const text = `<a href="${DRIVE}" target="_blank">www.google.com</a>`;
    const result = selectDestinationPreviews(
      [preview('https://www.google.com'), preview(DRIVE)],
      text
    );
    expect(result.map(p => p.url)).toEqual([DRIVE]);
  });

  it('drops an address label written as a single-quoted HTML anchor', () => {
    const result = selectDestinationPreviews(
      [preview('https://www.google.com'), preview(DRIVE)],
      `<a href='${DRIVE}'>www.google.com</a>`
    );
    expect(result.map(p => p.url)).toEqual([DRIVE]);
  });

  it('drops an address label whose anchor arrived escaped', () => {
    const text = `&lt;a href="${DRIVE}"&gt;www.google.com&lt;/a&gt;`;
    const result = selectDestinationPreviews(
      [preview('https://www.google.com'), preview(DRIVE)],
      text
    );
    expect(result.map(p => p.url)).toEqual([DRIVE]);
  });

  it('keeps an HTML anchor whose label is its own target', () => {
    const result = selectDestinationPreviews([preview(DRIVE)], `<a href="${DRIVE}">${DRIVE}</a>`);
    expect(result.map(p => p.url)).toEqual([DRIVE]);
  });

  // The text and the extension are written by different authors and agree only
  // on where the link goes, so none of these spellings may block a match.
  it.each([
    'https://www.google.com/',
    'http://www.google.com/',
    'http://www.google.com',
    'https://google.com',
    'HTTPS://WWW.GOOGLE.COM/',
  ])('matches the label %s however the extension spells it', reported => {
    const result = selectDestinationPreviews(
      [preview(reported), preview(DRIVE)],
      `[www.google.com](${DRIVE})`
    );
    expect(result.map(p => p.url)).toEqual([DRIVE]);
  });

  it('matches the target however the extension spells it', () => {
    const reported = DRIVE.replace('https://', 'http://');
    const result = selectDestinationPreviews(
      [preview('https://www.google.com'), preview(reported)],
      `[www.google.com](${DRIVE})`
    );
    expect(result.map(p => p.url)).toEqual([reported]);
  });

  // A target the extension cannot read — one behind a login, say — leaves only
  // the label's preview in the metadata. Showing it would advertise a place the
  // reader cannot reach from this message, so the bubble shows nothing.
  describe('when the target has no preview of its own', () => {
    const TRACKER = 'https://tracker.internal.example.com/issue/4821/link-not-clickable';
    const text = `[https://www.facebook.com/](${TRACKER})`;

    it.each([
      'https://www.facebook.com',
      'https://www.facebook.com/',
      // Facebook redirects, so the reported address carries a path the message
      // never contained. Only the host still ties it back to the label.
      'https://www.facebook.com/login/',
      'https://facebook.com/?locale=en_GB',
    ])('drops the label-only preview reported as %s', reported => {
      expect(selectDestinationPreviews([preview(reported)], text)).toEqual([]);
    });

    // A known limit, recorded rather than fixed. Matching one subdomain up
    // would catch this, and would also make the label `www.google.com` match a
    // `drive.google.com` target — the very case this code exists for. Sharing a
    // registrable domain does not make two addresses the same destination, so
    // the host is as far as the match goes.
    it('does not recognise a redirect onto a different subdomain', () => {
      const reported = 'https://m.facebook.com/?_rdr';
      expect(selectDestinationPreviews([preview(reported)], text).map(p => p.url)).toEqual([
        reported,
      ]);
    });

    it('keeps a preview on the target host even when the address differs', () => {
      // The extension redirected on the target itself; this is still the
      // destination the reader is going to.
      const reported = 'https://tracker.internal.example.com/issue/4821';
      const result = selectDestinationPreviews(
        [preview('https://www.facebook.com/login/'), preview(reported)],
        text
      );
      expect(result.map(p => p.url)).toEqual([reported]);
    });

    it('keeps a preview it cannot tie to the text at all', () => {
      // Not the label's host either, so there is nothing to say it is wrong.
      const reported = 'https://cdn.example.com/card';
      expect(selectDestinationPreviews([preview(reported)], text).map(p => p.url)).toEqual([
        reported,
      ]);
    });
  });

  // Each preview is judged on its own. Ranking the whole list and keeping only
  // its best tier threw away previews nothing had anything against.
  describe('one preview matching exactly does not discard the others', () => {
    it('keeps a shortened bare URL the extension resolved elsewhere', () => {
      // `youtu.be` in the text, `youtube.com` in the metadata: it can only ever
      // match on the host, and the exact match on the other link must not
      // pre-empt that.
      const result = selectDestinationPreviews(
        [preview('https://docs.acme.com/start'), preview('https://www.youtube.com/watch?v=abc123')],
        'See [the docs](https://docs.acme.com/start) and https://youtu.be/abc123'
      );
      expect(result.map(p => p.url)).toEqual([
        'https://docs.acme.com/start',
        'https://www.youtube.com/watch?v=abc123',
      ]);
    });

    it('keeps a preview nothing in the message identifies', () => {
      const result = selectDestinationPreviews(
        [preview('https://docs.acme.com/start'), preview('https://cdn.example.com/card')],
        '[the docs](https://docs.acme.com/start)'
      );
      expect(result).toHaveLength(2);
    });

    it('still drops a label when another link matches exactly', () => {
      const result = selectDestinationPreviews(
        [preview('https://www.google.com'), preview(DRIVE), preview('https://b.com')],
        `[www.google.com](${DRIVE}) and https://b.com`
      );
      expect(result.map(p => p.url)).toEqual([DRIVE, 'https://b.com']);
    });
  });

  // The target's own closing paren, not markdown's. Reading it as markdown's
  // captured an address the extension never reports, leaving the match to the
  // host fallback alone.
  describe('a target whose address ends in a parenthesis', () => {
    const MERCURY = 'https://en.wikipedia.org/wiki/Mercury_(planet)';

    it('matches exactly, even beside a link that also matches', () => {
      const result = selectDestinationPreviews(
        [preview(MERCURY), preview('https://b.com/')],
        `[Mercury](${MERCURY}) and https://b.com`
      );
      expect(result.map(p => p.url)).toEqual([MERCURY, 'https://b.com/']);
    });

    it('matches on its own', () => {
      expect(
        selectDestinationPreviews([preview(MERCURY)], `[Mercury](${MERCURY})`).map(p => p.url)
      ).toEqual([MERCURY]);
    });

    it('still drops a label beside a parenthesised target', () => {
      const result = selectDestinationPreviews(
        [preview('https://www.google.com'), preview(MERCURY)],
        `[www.google.com](${MERCURY})`
      );
      expect(result.map(p => p.url)).toEqual([MERCURY]);
    });
  });

  it('prefers an exact target match over another preview on the same host', () => {
    const text = '[https://acme.com/a](https://acme.com/b)';
    const result = selectDestinationPreviews(
      [preview('https://acme.com/a'), preview('https://acme.com/b')],
      text
    );
    expect(result.map(p => p.url)).toEqual(['https://acme.com/b']);
  });

  // Marking an address as code says it is to be read, not followed.
  // The bubble renders it as monospace with no anchor, but the extension scans
  // the raw text and returns a card for it anyway.
  describe('addresses written as code', () => {
    const GOOGLE = 'https://google.com';

    it.each([
      ['inline code', '`https://google.com`'],
      ['fenced block', '```\nhttps://google.com\n```'],
      ['fenced, one line', '```https://google.com```'],
      ['html inline code', '<code>https://google.com</code>'],
      ['html code block', '<pre><code>https://google.com</code></pre>'],
      ['code among prose', 'Try `https://google.com` in your browser'],
    ])('drops the card for an address in %s', (_name, text) => {
      expect(selectDestinationPreviews([preview(GOOGLE)], text)).toEqual([]);
    });

    it('keeps the card when the address is also linked outside the code', () => {
      const text = 'Visit https://google.com — or type `https://google.com`';
      expect(selectDestinationPreviews([preview(GOOGLE)], text).map(p => p.url)).toEqual([GOOGLE]);
    });

    it('keeps the card for a different address outside the code', () => {
      const text = '`https://google.com` but see https://example.com';
      const result = selectDestinationPreviews(
        [preview(GOOGLE), preview('https://example.com')],
        text
      );
      expect(result.map(p => p.url)).toEqual(['https://example.com']);
    });

    it('does not treat a link inside code as a destination', () => {
      // The markdown is shown verbatim, so it leads nowhere.
      const text = '`[Google](https://google.com)`';
      expect(selectDestinationPreviews([preview(GOOGLE)], text)).toEqual([]);
    });

    it('still drops a label preview when the target is also in code', () => {
      const text = `[www.google.com](${DRIVE}) and \`${DRIVE}\``;
      const result = selectDestinationPreviews(
        [preview('https://www.google.com'), preview(DRIVE)],
        text
      );
      expect(result.map(p => p.url)).toEqual([DRIVE]);
    });

    it('leaves text with no code untouched', () => {
      const previews = [preview(GOOGLE)];
      expect(selectDestinationPreviews(previews, 'https://google.com')).toEqual(previews);
    });
  });

  it('keeps every preview when the message has no markdown link', () => {
    const text = 'www.google.com and https://example.com';
    const previews = [preview('https://www.google.com'), preview('https://example.com')];
    expect(selectDestinationPreviews(previews, text)).toEqual(previews);
  });

  it('keeps a preview whose address matches nothing in the text', () => {
    // The extension may have followed a redirect; that preview is still the
    // destination the reader is going to.
    const result = selectDestinationPreviews(
      [preview('https://sites.google.com/landing')],
      `[Our deck](${DRIVE})`
    );
    expect(result).toHaveLength(1);
  });

  it('keeps a plain-text label that is not an address', () => {
    const result = selectDestinationPreviews([preview(DRIVE)], `[Q3 deck](${DRIVE})`);
    expect(result.map(p => p.url)).toEqual([DRIVE]);
  });

  it('handles several markdown links in one message', () => {
    const text = '[www.google.com](https://a.com/x) and [www.bing.com](https://b.com/y)';
    const result = selectDestinationPreviews(
      [
        preview('https://www.google.com'),
        preview('https://a.com/x'),
        preview('https://www.bing.com'),
        preview('https://b.com/y'),
      ],
      text
    );
    expect(result.map(p => p.url)).toEqual(['https://a.com/x', 'https://b.com/y']);
  });

  it('does not form an address across two adjacent links', () => {
    const text = '[www.google.com](https://a.com)[www.bing.com](https://b.com)';
    const result = selectDestinationPreviews(
      [preview('https://a.com'), preview('https://b.com')],
      text
    );
    expect(result).toHaveLength(2);
  });

  it('ignores trailing punctuation after a label', () => {
    const result = selectDestinationPreviews(
      [preview('https://www.google.com')],
      `[www.google.com.](${DRIVE})`
    );
    expect(result).toEqual([]);
  });

  it('returns the input unchanged for empty previews or empty text', () => {
    expect(selectDestinationPreviews([], 'anything')).toEqual([]);
    const previews = [preview('https://a.com')];
    expect(selectDestinationPreviews(previews, '')).toEqual(previews);
  });
});
