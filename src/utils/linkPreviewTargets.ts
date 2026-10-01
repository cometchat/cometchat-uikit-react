/**
 * Choosing which link previews a message should show.
 *
 * The link-preview extension scans the raw message text and returns a preview
 * for every address it finds there. A link carries two: the target it opens,
 * and the label a reader sees. Those are usually different kinds of thing —
 * `[our pricing](https://acme.com/pricing)` yields one address — but a label
 * can itself be an address, and then the extension previews both.
 *
 * Previewing the label advertises a destination the message never goes to: for
 * `[www.google.com](https://drive.google.com/file/d/…)` the bubble showed a
 * Google card above the Drive card, and clicking the link opened neither of the
 * two places the cards described. Slack previews the destination only, and so
 * does this.
 *
 * The same reasoning covers an address written as code, which the bubble
 * deliberately renders as unclickable monospace while the extension previews it
 * anyway. Both are a card for somewhere the message does not go.
 */

import { URL_PATTERN, trimUrlTrailing } from './urlShielding';

/**
 * A markdown link as the composer stores one.
 *
 * The target admits one level of balanced parens, because an address can end in
 * one: `[Mercury](https://en.wikipedia.org/wiki/Mercury_(planet))`. Stopping at
 * the first `)` captured `…/Mercury_(planet`, which matches nothing the
 * extension reports, and left the real closing paren behind in the text — the
 * same confusion between an address's paren and markdown's that `trimUrlTrailing`
 * resolves for the renderer.
 */
const MARKDOWN_LINK = /\[([^\]]*)\]\(((?:[^()]|\([^()]*\))*)\)/g;

/**
 * The same link as an HTML anchor. A message can carry either form: the bubble
 * converts anchors to markdown before formatting, for text sent by another
 * platform or an older client, so the stored text is not always markdown.
 * Matching both here means the choice of previews does not depend on which
 * form a message happens to be in.
 */
const HTML_LINK = /<a\s[^>]*href=(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Code, fenced or inline, in either the markdown or the HTML form. Marking text
 * as code is a statement that it is to be read rather than followed, and the
 * bubble honours that \u2014 an address in backticks renders as monospace text with
 * no anchor. The longer fence has to be tried before the single backtick, or it
 * matches the fence's first two characters as an empty span.
 */
const CODE = /```[\s\S]*?```|<pre><code>[\s\S]*?<\/code><\/pre>|<code>[\s\S]*?<\/code>|`[^`\n]+`/g;

/** Zero-width characters an editor may have parked inside an address. */
const ZERO_WIDTH = /\u200B|\u200C|\u200D|\uFEFF/g;

/**
 * Reduce an address to a form every spelling of the same destination shares.
 *
 * The two sides being compared are written by different authors: one is what
 * someone typed into the message, the other is what the extension resolved and
 * echoed back. They agree on where the link goes and disagree on almost
 * everything else — `www.google.com` against `http://www.google.com/` is the
 * same destination written three ways. So the scheme, a leading `www.`, a
 * trailing slash and case are all dropped before comparing.
 *
 * Both sides go through this, so discarding a distinction can only merge two
 * spellings that were already about to be compared, never separate them. The
 * cost is that `http://x` and `https://x` are treated as one destination, which
 * for choosing a preview is what we want.
 */
function compareForm(url: string): string {
  const result = trimUrlTrailing(url.trim().replace(ZERO_WIDTH, ''))
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
  return result.toLowerCase();
}

/**
 * The host an address sits on, as a weaker way to recognise the same
 * destination when the exact addresses disagree.
 *
 * The extension reports where it ended up, not what it was given, so a site
 * that redirects — `https://www.facebook.com/` becoming a login or locale
 * address — reports a path the message never contained. The host survives that
 * and is enough to tell which of a message's addresses a preview came from.
 */
function hostOf(url: string): string {
  return compareForm(url).split(/[/?#]/)[0] ?? '';
}

/** Every address appearing in a fragment of message text. */
function addressesIn(text: string): string[] {
  return Array.from(text.matchAll(URL_PATTERN), match => compareForm(match[0])).filter(Boolean);
}

/**
 * An anchor whose angle brackets arrived escaped, which is how a message sent
 * by some clients is stored. The bubble decodes these before formatting, and
 * the same text is decoded here so the anchor is seen either way.
 */
const ENCODED_ANCHOR = /&lt;(\/?)(a)((?:\s[^&]*)?)&gt;/gi;

/** The message text split into its code and its prose. */
interface SplitText {
  /** Everything inside a code fence or span, joined. */
  code: string;
  /** The rest, with each code region replaced by a space. */
  prose: string;
}

/**
 * Separate code from prose, so an address can be read as one or the other.
 *
 * A space replaces each code region rather than nothing, so text either side of
 * a span cannot join up into an address that was never written.
 */
function splitCode(text: string): SplitText {
  let code = '';
  const prose = text.replace(CODE, match => {
    code += ` ${match}`;
    return ' ';
  });
  return { code, prose };
}

/** A link's two addresses: where it goes, and what it shows. */
interface LinkParts {
  label: string;
  target: string;
}

/** Every link in the text, in any of the forms a message can carry. */
function linksIn(text: string): LinkParts[] {
  const links: LinkParts[] = [];
  for (const match of text.matchAll(MARKDOWN_LINK)) {
    links.push({ label: match[1] ?? '', target: match[2] ?? '' });
  }
  for (const match of text.matchAll(HTML_LINK)) {
    // Either quote style captures the href; only one of the two groups is set.
    links.push({ label: match[3] ?? '', target: match[1] ?? match[2] ?? '' });
  }
  return links;
}

/**
 * Keep the previews for the addresses a message's links actually open.
 *
 * Where a message contains links, their targets are the answer: a preview for
 * anything else came from text that leads nowhere, and describes a place the
 * reader cannot reach from this message. A link pasted from the clipboard,
 * whose label and target are the same address, keeps its preview — that
 * address is a destination.
 *
 * An address the message only ever shows as code is dropped first, whether or
 * not the message links anywhere. Marking text as code says it is to be read
 * rather than followed, and the bubble honours that by rendering it as
 * monospace with no anchor — but the extension scans the raw text and returns a
 * card for it regardless.
 *
 * What remains is judged one preview at a time, on the strongest evidence that
 * fits it: the exact address, then the host, which survives the redirect the
 * extension may have followed. An address matching a target is kept and one
 * matching only a label is dropped, and a preview that nothing ties to the
 * message either way is kept — dropping it on no evidence would be worse than
 * showing it.
 *
 * Per preview rather than per list, because ranking the whole list and keeping
 * only its best tier discarded previews nothing had anything against: one
 * exactly-matching link dropped the card for a shortened bare URL beside it.
 */
export function selectDestinationPreviews<T extends { url: string }>(
  previews: readonly T[],
  text: string
): readonly T[] {
  if (previews.length === 0 || !text) return previews;

  const decoded = text.replace(ENCODED_ANCHOR, '<$1$2$3>');
  // Code is read, not followed, so nothing inside it is a link or a destination.
  const { code, prose } = splitCode(decoded);
  const links = linksIn(prose);

  const labels = new Set<string>();
  const destinations = new Set<string>();

  for (const { label, target } of links) {
    for (const address of addressesIn(label)) labels.add(address);
    const destination = compareForm(target);
    if (destination) destinations.add(destination);
  }

  // Replaced by a space, so two adjacent links cannot form a third address
  // across the join.
  const outsideLinks = prose.replace(MARKDOWN_LINK, ' ').replace(HTML_LINK, ' ');
  for (const address of addressesIn(outsideLinks)) {
    destinations.add(address);
  }

  // An address the message only ever shows as code is somewhere it does not go.
  // The extension scans the raw text and finds it anyway, so a bubble that
  // renders `https://example.com` as plain monospace with no anchor was still
  // topped by a full card for it. An address that also appears outside the code
  // keeps its preview — the code is then a second mention, not the only one.
  const codeAddresses = new Set(addressesIn(code));
  const candidates =
    codeAddresses.size === 0
      ? previews
      : previews.filter(preview => {
          const address = compareForm(preview.url);
          return destinations.has(address) || !codeAddresses.has(address);
        });

  // Nothing outside the code links anywhere, so there is no target to match
  // against and no label to rule anything out.
  if (links.length === 0) return candidates;

  const destinationHosts = new Set(Array.from(destinations, hostOf));
  const labelHosts = new Set(Array.from(labels, hostOf));

  // Judged one preview at a time. Ranking the whole list and keeping only its
  // best tier discarded previews that nothing had anything against: a message
  // with one exactly-matching link dropped the card for a shortened bare URL
  // beside it, because the extension had resolved that one to where it landed
  // and so it could only ever have matched on the host.
  //
  // Strongest evidence first. An exact address settles it either way before the
  // host is consulted, which is what separates a label from a target sharing a
  // host — `[https://acme.com/a](https://acme.com/b)` is one address the message
  // shows and another it opens.
  return candidates.filter(preview => {
    const address = compareForm(preview.url);
    if (destinations.has(address)) return true;
    if (labels.has(address)) return false;

    const host = hostOf(preview.url);
    if (destinationHosts.has(host)) return true;
    if (labelHosts.has(host)) return false;

    // Nothing ties it to the message either way. The extension may have
    // followed a redirect, and dropping a preview on no evidence would be worse
    // than showing one.
    return true;
  });
}
