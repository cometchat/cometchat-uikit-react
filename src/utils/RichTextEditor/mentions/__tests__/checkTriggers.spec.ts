import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkTriggers } from '../MentionManager';

function setCaret(el: HTMLElement, offset: number): void {
  const range = document.createRange();
  range.setStart(el.firstChild!, offset);
  range.collapse(true);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
}

describe('checkTriggers (T7 trigger registry)', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });
  afterEach(() => {
    el.remove();
  });

  it('fires onStart with the query for a custom trigger char', () => {
    el.textContent = 'hello #foo';
    setCaret(el, 'hello #foo'.length);
    const onStart = vi.fn();
    const onEnd = vi.fn();

    checkTriggers([{ char: '#', onStart, onEnd }], window);

    expect(onStart).toHaveBeenCalledWith('foo');
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('fires onStart with an empty query right after typing the trigger char', () => {
    el.textContent = 'hey #';
    setCaret(el, 'hey #'.length);
    const onStart = vi.fn();

    checkTriggers([{ char: '#', onStart }], window);

    expect(onStart).toHaveBeenCalledWith('');
  });

  it('fires onEnd when the caret is not after a trigger', () => {
    el.textContent = 'hello world';
    setCaret(el, 'hello world'.length);
    const onStart = vi.fn();
    const onEnd = vi.fn();

    checkTriggers([{ char: '#', onStart, onEnd }], window);

    expect(onStart).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it('supports multiple triggers; first match in list order wins', () => {
    el.textContent = 'hey @bob';
    setCaret(el, 'hey @bob'.length);
    const at = vi.fn();
    const hash = vi.fn();

    checkTriggers(
      [
        { char: '@', onStart: at },
        { char: '#', onStart: hash },
      ],
      window
    );

    expect(at).toHaveBeenCalledWith('bob');
    expect(hash).not.toHaveBeenCalled();
  });

  it('requires the trigger char at a word boundary (start or whitespace)', () => {
    el.textContent = 'email@foo';
    setCaret(el, 'email@foo'.length);
    const onStart = vi.fn();
    const onEnd = vi.fn();

    checkTriggers([{ char: '@', onStart, onEnd }], window);

    expect(onStart).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });
});
