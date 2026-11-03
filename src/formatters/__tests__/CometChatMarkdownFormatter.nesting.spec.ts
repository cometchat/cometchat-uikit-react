/**
 * Unit tests for CometChatMarkdownFormatter's nested lists (ordered and bullet,
 * going in and back out), link normalisation, mentions inside formatting, and
 * the conversation preview's list-marker normalisation.
 */
import { describe, it, expect } from 'vitest';
import { CometChatMarkdownFormatter } from '../CometChatMarkdownFormatter';

const formatter = () => new CometChatMarkdownFormatter();

function html(markdown: string): HTMLDivElement {
  const div = document.createElement('div');
  div.innerHTML = formatter().format(markdown);
  return div;
}

/** Each list item's own text (without nested lists) with its list's style type. */
function items(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('li')).map(li => {
    const own = Array.from(li.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent)
      .join('')
      .trim();
    const style = li.parentElement?.style.listStyleType ?? '';
    return `${style}:${own}`;
  });
}

describe('CometChatMarkdownFormatter nesting', () => {
  describe('ordered lists', () => {
    it('nests by indentation as decimal, alpha, then roman, and comes back out', () => {
      const root = html(
        ['1. one', '    a. one-a', '        i. one-a-i', '    b. one-b', '2. two'].join('\n')
      );
      expect(items(root)).toEqual([
        'decimal:one',
        'lower-alpha:one-a',
        'lower-roman:one-a-i',
        'lower-alpha:one-b',
        'decimal:two',
      ]);
      expect(root.querySelectorAll(':scope > ol')).toHaveLength(1);
    });

    it('closes all nested lists when a paragraph follows', () => {
      const root = html(['1. one', '    a. inner', 'after'].join('\n'));
      expect(root.querySelector('ol ol')).not.toBeNull();
      expect(root.lastChild?.textContent).toContain('after');
      expect(root.querySelector('ol')?.textContent).not.toContain('after');
    });

    it('a multi-letter roman marker nests under a lettered item, but stays in the top list otherwise', () => {
      const nested = html(['1. one', '    a. alpha', '    ii. roman'].join('\n'));
      expect(items(nested)).toEqual(['decimal:one', 'lower-alpha:alpha', 'lower-roman:roman']);

      const topLevel = html(['1. one', 'ii. two'].join('\n'));
      expect(items(topLevel)).toEqual(['decimal:one', 'decimal:two']);
    });

    it('a single letter, even "i.", is a lettered item', () => {
      expect(items(html('i. first'))).toEqual(['lower-alpha:first']);
    });
  });

  describe('bullet lists', () => {
    it('nests as disc, circle, then square, and comes back out', () => {
      const root = html(['- a', '    - b', '        - c', '- d'].join('\n'));
      expect(items(root)).toEqual(['disc:a', 'circle:b', 'square:c', 'disc:d']);
      expect(root.querySelectorAll(':scope > ul')).toHaveLength(1);
    });

    it('steps back one level at a time', () => {
      const root = html(['- a', '    - b', '        - c', '    - d'].join('\n'));
      expect(items(root)).toEqual(['disc:a', 'circle:b', 'square:c', 'circle:d']);
    });
  });

  describe('links', () => {
    const href = (markdown: string) =>
      html(markdown).querySelector('a')?.getAttribute('href') ?? null;

    it('adds https:// to bare domains but keeps anchors and relative paths', () => {
      expect(href('[site](example.com/x)')).toBe('https://example.com/x');
      expect(href('[top](#top)')).toBe('#top');
      expect(href('[docs](/docs)')).toBe('/docs');
      expect(href('[up](../readme)')).toBe('../readme');
      expect(href('[mail](mailto:a@b.test)')).toBe('mailto:a@b.test');
    });

    it('drops dangerous schemes, even when obfuscated', () => {
      expect(href('[x](javascript:alert(1))')).toBeNull();
      expect(href('[x](java\tscript:alert(1))')).toBeNull();
    });
  });

  it('keeps mention tokens intact inside formatting', () => {
    const out = formatter().format('**hi <@uid:under_score_id> there**');
    expect(out).toContain('<@uid:under_score_id>');
    expect(out).toMatch(/^<(b|strong)>/);
  });
});

describe('stripMarkdownForConversation list markers', () => {
  const preview = (markdown: string) => formatter().stripMarkdownForConversation(markdown);

  it('renumbers old-style nested "1." markers as letters, then roman numerals', () => {
    const old = [
      '1. one',
      '    1. sub',
      '    1. sub',
      '        1. deep',
      '        1. deep',
      '    1. sub',
      '2. two',
    ].join('\n');
    expect(preview(old).split('\n')).toEqual([
      '1. one',
      '    a. sub',
      '    b. sub',
      '        i. deep',
      '        ii. deep',
      '    c. sub',
      '2. two',
    ]);
  });

  it('restarts the letters after a non-list line and leaves new-style markers alone', () => {
    const text = [
      '1. one',
      '    1. sub',
      'break',
      '1. again',
      '    1. sub',
      '    b. already lettered',
    ].join('\n');
    expect(preview(text).split('\n')).toEqual([
      '1. one',
      '    a. sub',
      'break',
      '1. again',
      '    a. sub',
      '    b. already lettered',
    ]);
  });

  it('continues past z and counts roman numerals properly', () => {
    const many = ['1. top', ...Array.from({ length: 27 }, () => '    1. x')].join('\n');
    expect(preview(many).split('\n').at(-1)).toBe('    aa. x');

    const roman = ['1. top', '    1. sub', ...Array.from({ length: 4 }, () => '        1. y')].join(
      '\n'
    );
    expect(preview(roman).split('\n').at(-1)).toBe('        iv. y');
  });
});
