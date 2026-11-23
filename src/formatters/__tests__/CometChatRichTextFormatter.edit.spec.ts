import { describe, it, expect } from 'vitest';
import {
  CometChatRichTextFormatter,
  formatRichTextForEdit,
} from '../CometChatRichTextFormatter';
import { convertMarkdownToHtml } from '../../utils/RichTextEditor/RichTextEditor';

/**
 * Editing a message must keep every blank line. The edit composer is
 * seeded with `convertMarkdownToHtml(storedText)`, so saving unchanged must
 * store exactly the original text.
 */
describe('formatRichTextForEdit', () => {
  const edit = (html: string) =>
    formatRichTextForEdit(new CometChatRichTextFormatter(), html);
  const roundTrip = (text: string) => edit(convertMarkdownToHtml(text));

  describe('round trip of stored text through the edit composer', () => {
    it.each([1, 2, 3, 4, 5])(
      'keeps %i blank line(s) between paragraphs',
      (n) => {
        const text = `Para1${'\n'.repeat(n + 1)}Para2`;
        expect(roundTrip(text)).toBe(text);
      },
    );

    it('keeps single line breaks', () => {
      expect(roundTrip('A\nB\nC')).toBe('A\nB\nC');
    });

    it('keeps blank lines around a list', () => {
      const text = 'Intro\n\n\n• one\n• two\n\n\n\nOutro';
      expect(roundTrip(text)).toBe(text);
    });

    it('keeps blank lines around an ordered list', () => {
      const text = 'Intro\n\n\n1. one\n2. two\n\n\nOutro';
      expect(roundTrip(text)).toBe(text);
    });

    it('keeps blank lines after a blockquote', () => {
      const text = 'A\n\n\n> q\n\n\nB';
      expect(roundTrip(text)).toBe(text);
    });

    it('keeps consecutive blockquote lines on separate lines', () => {
      const text = '> a\n> b\n\n\nB';
      expect(roundTrip(text)).toBe(text);
    });

    it('keeps blank lines after a code block', () => {
      const text = 'A\n\n\n```\nx = 1\n```\n\n\nB';
      expect(roundTrip(text)).toBe(text);
    });

    it('keeps blank lines with inline formatting and mentions', () => {
      const text = '**bold** <@uid:bob>\n\n\n\n_it_';
      expect(roundTrip(text)).toBe(text);
    });
  });

  describe('HTML the editor produces while the user edits (captured from Chrome)', () => {
    it('keeps newlines Shift+Enter typed inside a paragraph', () => {
      expect(edit('<p>A</p><br><br><p>B\n\nC</p>')).toBe('A\n\n\nB\n\nC');
    });

    it('treats the trailing newline in a block as the line placeholder', () => {
      // Two Shift+Enter at the end of 'A' adds two blank lines to the existing two.
      expect(edit('<p>A\n\n\n</p><br><br><p>B</p>')).toBe('A\n\n\n\n\nB');
    });

    it('counts an empty <div><br></div> or <p><br></p> as one line', () => {
      expect(edit('A<div><br></div><div><br></div><div>B</div>')).toBe(
        'A\n\n\nB',
      );
      expect(edit('<p>A</p><p><br></p><p><br></p><p>B</p>')).toBe('A\n\n\nB');
    });

    it('starts a block that follows inline text on its own line', () => {
      expect(edit('A<div>B</div>')).toBe('A\nB');
    });

    it('trims leading and trailing blank lines', () => {
      expect(edit('<br><br><p>A</p><br><br>')).toBe('A');
    });
  });

  describe('blocks inside a list item', () => {
    // A list item is one line. A block nested inside it must not start a new
    // line on edit, or the rest of the item drops out of the list. Edit gives
    // the same text as send here.
    const send = (html: string) => new CometChatRichTextFormatter().format(html);

    it.each([
      ['a <p> inside a <div> in an <li>', '<ul><li><div>X<p>Y</p></div></li></ul>'],
      ['a <div> inside a <div> in an <li>', '<ul><li><div>X<div>Y</div></div></li></ul>'],
      ['an ordered list item', '<ol><li><div>X<p>Y</p></div></li></ol>'],
      ['a block inside inline formatting', '<ul><li><b>X<div>Y</div></b></li></ul>'],
    ])('keeps %s on one line', (_name, html) => {
      const result = edit(html);
      expect(result).not.toContain('\n');
      expect(result).toBe(send(html));
    });

    it('still keeps each item on its own line and blank lines around the list', () => {
      expect(edit('Intro<br><br><ul><li><div>X<p>Y</p></div></li><li>Z</li></ul><br>Outro')).toBe(
        'Intro\n\n• XY\n• Z\n\nOutro',
      );
    });
  });

  it('does not change format(), which send uses', () => {
    const formatter = new CometChatRichTextFormatter();
    const html = '<p>A</p><br><br><br><p>B</p>';
    expect(formatRichTextForEdit(formatter, html)).toBe('A\n\n\n\nB');
    expect(formatter.format(html)).toBe('A\n\nB');
  });

  it('resets the edit mode when conversion throws', () => {
    const formatter = new CometChatRichTextFormatter();
    const original = formatter.format.bind(formatter);
    formatter.format = () => {
      throw new Error('boom');
    };
    expect(() => formatRichTextForEdit(formatter, '<p>A</p>')).toThrow('boom');
    formatter.format = original;
    expect(formatter.format('<p>A</p><br><br><br><p>B</p>')).toBe('A\n\nB');
  });
});
