import { describe, it, expect } from 'vitest';
import { CometChatTextFormatter } from '../CometChatTextFormatter';
import { mergeFormatters } from '../mergeFormatters';

function fmt(id: string, priority = 100): CometChatTextFormatter {
  return new (class extends CometChatTextFormatter {
    readonly id = id;
    override priority = priority;
    getRegex(): RegExp {
      return /a/g;
    }
    format(text: string): string {
      return text;
    }
  })();
}

describe('mergeFormatters', () => {
  it('appends distinct formatters', () => {
    const out = mergeFormatters([fmt('a'), fmt('b')], [fmt('c')]);
    expect(out.map(f => f.id)).toEqual(['a', 'b', 'c']);
  });

  it('dedupes by id with extra winning on collision', () => {
    const base = fmt('a', 10);
    const override = fmt('a', 99);
    const out = mergeFormatters([base, fmt('b')], [override]);
    expect(out.map(f => f.id)).toEqual(['a', 'b']);
    expect(out.find(f => f.id === 'a')?.priority).toBe(99); // override won
  });

  it('returns base unchanged when extra is empty', () => {
    const base = [fmt('a'), fmt('b')];
    expect(mergeFormatters(base, [])).toBe(base);
  });

  it('handles empty/missing inputs', () => {
    expect(mergeFormatters()).toEqual([]);
    expect(mergeFormatters(undefined, [fmt('x')]).map(f => f.id)).toEqual(['x']);
  });
});
