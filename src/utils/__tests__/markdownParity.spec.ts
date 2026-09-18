import { describe, it, expect } from 'vitest';
import { convertMarkdownToHtml } from '../RichTextEditor/RichTextEditor';
import { convertHtmlToMarkdown } from '../HtmlToMarkdown';
import { escapeUserHtml } from '../sanitizeHtml';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';
import { CometChatUrlFormatter } from '../../formatters/CometChatUrlFormatter';
import { CometChatRichTextFormatter } from '../../formatters/CometChatRichTextFormatter';
import { detectAndConvertMarkdown } from '../RichTextEditor/markdown/MarkdownDetector';
import type { EditorContext } from '../RichTextEditor/formats/format.types';

/**
 * What the composer shows for text that was pasted, or restored from a draft or
 * an edit. This is the "preview".
 */
function composerPreview(text: string): string {
  return convertMarkdownToHtml(text).replace(/^<p>|<\/p>$/g, '');
}

/**
 * What the bubble shows once that composer content is sent. Mirrors
 * applyFormatters in CometChatTextBubble.
 */
function bubbleRender(text: string): string {
  const sent = convertHtmlToMarkdown(convertMarkdownToHtml(text));
  const markdown = new CometChatMarkdownFormatter();
  const url = new CometChatUrlFormatter();
  let result = escapeUserHtml(sent);
  result = markdown.shouldFormat(result) ? markdown.format(result) : result;
  result = url.shouldFormat(result) ? url.format(result) : result;
  return result;
}

/**
 * Reduce to the formatting shape. The composer emits strong/em because that is
 * what the browser produces natively; the bubble emits b/i. They render the
 * same and convert to the same markdown, so the comparison is on semantics.
 */
function shape(html: string): string {
  return (
    html
      .replace(/<(strong|b)>/g, '<B>')
      .replace(/<\/(strong|b)>/g, '</B>')
      .replace(/<(em|i)>/g, '<I>')
      .replace(/<\/(em|i)>/g, '</I>')
      // The bubble tags its anchors for the click handler; the composer does not.
      .replace(/ class="cometchat-link"/g, '')
      .trim()
  );
}

/**
 * The composer does not linkify a bare URL as you type — that would rewrite the
 * text under the caret. The bubble does. This is the one intended difference,
 * so it is normalised away rather than left to fail the comparison.
 */
function ignoreAutoLink(html: string): string {
  // Only unwrap anchors the URL formatter created from a bare URL, where the
  // link text is the address itself. A markdown link has a distinct label and
  // must still match the composer.
  return html.replace(
    /<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
    (match, href: string, label: string) =>
      href === label || href === `https://${label}` ? label : match
  );
}

describe('composer preview matches bubble render', () => {
  const CASES = [
    '**bold**',
    '*bold single*',
    '_italic_',
    '__underline__',
    '++underline++',
    '~~strike~~',
    '`code()`',
    'my_var_name',
    'plain text',
    '**bold** and _italic_ and ~~strike~~',
    '__under__ and ++under++ together',
    'https://example.com/a_b_c',
    'https://example.com/file/d/1AbCdEfGhIj_kLmN/view?usp=share_link',
    '[Q3](https://example.com/d/abc_def?usp=share_link)',
    '**https://example.com/a_b_c**',
    'text https://example.com/a_b_c and _italic_',
    // Combining markers.
    '**_both_**',
    '_**both**_',
    '**text_italic_text**',
    '**a**_b_',
    '___x___',
    '**b** https://x.com/a_b_c **b**',
    // Unclosed markers stay literal.
    '**bold',
    '_italic',
    // A code span binds tighter than emphasis.
    '`**not bold**`',
    '`https://x.com/a_b_c`',
    // A markdown link whose label is itself formatted.
    '[**bold**](https://x.com/a_b_c)',
    // Text that must not be mistaken for formatting.
    '2*3*4',
    'snake_case_name_here',
    'a_b',
    // URLs carrying each marker character.
    'https://x.com/a++b++c',
    'https://x.com/a`b`c',
    'https://x.com/a~~b~~c',
    'https://x.com/p?a_b#c_d',
    'https://en.wikipedia.org/wiki/Foo_(bar)_baz',
    '~~https://x.com/a_b_c~~',
    '🎉 _party_ 🎉',
    '> _quoted_ text',
    // Markers between word characters are literal, as in Slack.
    'snake_case_name_here',
    'file_name_here.txt',
    'a_b_c_d_e',
    'foo**bar**baz',
    'snake_case and _real_ mixed',
    // Markers delimited by punctuation or brackets still apply.
    'This is _important_.',
    '(_parens_)',
    // International text and non-ASCII neighbours (review #1). CJK is written
    // without spaces, so an ASCII-only boundary guard silently disabled
    // emphasis for those locales.
    '**重要**です',
    'これは**太字**、です',
    '**Hello**👋',
    '👋**Hello**',
    '«**bold**»',
    '„**bold**“',
    '**bold**-suffix',
    're-**check**',
    '**bold**—dash',
    '~~取り消し~~です',
    '[_bracket_]',
    'Really _yes_!',
    'a, _b_, c',
  ];

  for (const input of CASES) {
    it(`agrees on ${JSON.stringify(input)}`, () => {
      const preview = shape(composerPreview(input));
      const bubble = ignoreAutoLink(shape(bubbleRender(input)));
      expect(preview).toBe(bubble);
    });
  }
});

/**
 * The paste path above never inserts caret markers, so it cannot catch a bug
 * that only exists when a marker is converted while typing: the composer parks
 * the caret in a U+200B node after each conversion, and that character used to
 * be stored with the message and break the closing word-boundary check.
 */
describe('typed composer content matches the bubble after send', () => {
  const ctx = { getWindow: () => window } as unknown as EditorContext;

  /** Type one character at a time, running the as-you-type detector after each. */
  function typeText(text: string): string {
    const container = document.createElement('div');
    container.contentEditable = 'true';
    document.body.appendChild(container);
    const sel = window.getSelection()!;
    for (const ch of text) {
      const node = sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
      const range = document.createRange();
      if (node?.nodeType !== Node.TEXT_NODE) {
        const created = document.createTextNode(ch);
        container.appendChild(created);
        range.setStart(created, 1);
      } else {
        const offset = sel.getRangeAt(0).startOffset;
        const textNode = node as Text;
        const content = textNode.textContent ?? '';
        textNode.textContent = content.slice(0, offset) + ch + content.slice(offset);
        range.setStart(textNode, offset + 1);
      }
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      detectAndConvertMarkdown(ctx);
    }
    const html = container.innerHTML;
    document.body.removeChild(container);
    return html;
  }

  function render(markdown: string): string {
    const markdownFormatter = new CometChatMarkdownFormatter();
    const url = new CometChatUrlFormatter();
    let result = escapeUserHtml(markdown);
    result = markdownFormatter.shouldFormat(result) ? markdownFormatter.format(result) : result;
    return url.shouldFormat(result) ? url.format(result) : result;
  }

  const CASES = [
    '**bold** text',
    '**bold**',
    'this is _italic_ text',
    '~~strike~~ text',
    '__under__ text',
    '`https://x.com/a_b_c` after',
    '[l](https://x.com/a_b_c) after',
  ];

  for (const input of CASES) {
    it(`stores no caret marker and renders ${JSON.stringify(input)}`, () => {
      const composerHtml = typeText(input);
      const sent = new CometChatRichTextFormatter().format(composerHtml);
      expect(sent).not.toContain('\u200B');
      expect(ignoreAutoLink(shape(render(sent)))).toBe(
        ignoreAutoLink(shape(composerHtml.replace(/\u200B/g, '')))
      );
    });
  }

  // Review #2: each conversion parks the caret in a U+200B node, and the next
  // markers are typed into that same node. A boundary guard that treats the
  // zero-width character as a word character stops every conversion after the
  // first.
  it('keeps converting when markers are typed back to back', () => {
    const html = typeText('**bold**_italic_');
    expect(shape(html)).toContain('<B>bold</B>');
    expect(shape(html)).toContain('<I>italic</I>');
    expect(html).not.toContain('**');
    expect(html.replace(/\u200B/g, '')).not.toContain('_italic_');
  });

  it('converts a third marker run after two conversions', () => {
    const html = typeText('**a**_b_~~c~~');
    const shaped = shape(html);
    expect(shaped).toContain('<B>a</B>');
    expect(shaped).toContain('<I>b</I>');
    expect(html).toContain('<s>c</s>');
  });

  it('repairs a message already stored with a caret marker', () => {
    expect(render('**bold**\u200B text')).toBe('<b>bold</b> text');
    expect(render('this is _italic_\u200B text')).toBe('this is <i>italic</i> text');
  });

  it('keeps zero-width joiners, which bind multi-codepoint emoji', () => {
    const family = '👨‍👩‍👧';
    expect(render(`${family} _hi_`)).toBe(`${family} <i>hi</i>`);
  });
});

/**
 * The parity suites above only prove the composer and the bubble agree. If a
 * boundary guard makes both render the markers literally they agree perfectly,
 * which is exactly how the CJK/emoji regression (review #1) shipped unnoticed.
 * These assert the output itself.
 */
describe('emphasis applies next to non-ASCII neighbours', () => {
  const RENDERS: [string, string][] = [
    ['**重要**です', '<b>重要</b>です'],
    ['これは**太字**、です', 'これは<b>太字</b>、です'],
    ['**Hello**👋', '<b>Hello</b>👋'],
    ['👋**Hello**', '👋<b>Hello</b>'],
    ['«**bold**»', '«<b>bold</b>»'],
    ['**bold**-suffix', '<b>bold</b>-suffix'],
    ['re-**check**', 're-<b>check</b>'],
    ['**bold**—dash', '<b>bold</b>—dash'],
    ['~~取り消し~~です', '<s>取り消し</s>です'],
    ['_word_👋', '<i>word</i>👋'],
  ];

  for (const [input, expected] of RENDERS) {
    it(`renders ${JSON.stringify(input)}`, () => {
      expect(bubbleRender(input)).toBe(expected);
    });
  }

  // The underscore rule keeps its guard, which is the snake_case fix. CommonMark
  // treats intraword `_` as literal too, so this is intended, not a gap.
  const LITERAL: string[] = ['snake_case_name_here', 'my_var_name', 'a_b', 'file_name_here.txt'];
  for (const input of LITERAL) {
    it(`leaves ${JSON.stringify(input)} alone`, () => {
      expect(bubbleRender(input)).toBe(input);
    });
  }
});
