import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CometChatTextFormatter } from '../CometChatTextFormatter';
import { CometChatRichTextFormatter } from '../CometChatRichTextFormatter';

/** Minimal v6-style imperative formatter (hashtag), exercising the Part-3 base surface. */
class HashtagFormatter extends CometChatTextFormatter {
  readonly id = 'hashtag';
  constructor() {
    super();
    this.setTrackingCharacter('#');
    this.setRegexPatterns([/#(\w+)/g]);
    this.setRegexToReplaceFormatting([/<span class="hashtag">([\s\S]*?)<\/span>/g]);
  }
  override customLogicToFormatText(text: string): string {
    return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
  }
}

describe('CometChatTextFormatter — v6 imperative surface (Part 3, W1)', () => {
  it('getFormattedText(text) delegates to customLogicToFormatText; no-arg returns stored', () => {
    const f = new HashtagFormatter();
    expect(f.getFormattedText('hi #world')).toBe('hi <span class="hashtag">#world</span>');
    // format() stores it; no-arg getter returns the stored result.
    f.format('a #b');
    expect(f.getFormattedText()).toBe('a <span class="hashtag">#b</span>');
  });

  it('getOriginalText(text) strips markup via regexToReplaceFormatting; no-arg returns stored', () => {
    const f = new HashtagFormatter();
    const html = 'hi <span class="hashtag">#world</span>';
    expect(f.getOriginalText(html)).toBe('hi #world');
    f.format('x');
    expect(f.getOriginalText()).toBe('x'); // no-arg → originalText from last format()
  });

  it('getRegex() defaults to the first registered pattern', () => {
    const f = new HashtagFormatter();
    expect(f.getRegex().source).toBe(/#(\w+)/g.source);
  });

  it('trackCharacter and regex getters reflect the setters', () => {
    const f = new HashtagFormatter();
    expect(f.trackCharacter).toBe('#');
    expect(f.getRegexPatterns()).toHaveLength(1);
  });

  it('onKeyUp/onKeyDown delegate to the registered callbacks', () => {
    const f = new HashtagFormatter();
    const up = vi.fn();
    const down = vi.fn();
    f.setKeyUpCallBack(up);
    f.setKeyDownCallBack(down);
    const e = new KeyboardEvent('keyup');
    f.onKeyUp(e);
    f.onKeyDown(e);
    expect(up).toHaveBeenCalledWith(e);
    expect(down).toHaveBeenCalledWith(e);
  });

  it('reRender() invokes the registered callback', () => {
    const f = new HashtagFormatter();
    const cb = vi.fn();
    f.setReRender(cb);
    f.reRender();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  describe('send serialization (W2): getOriginalText strips imperative markup', () => {
    it('strips the formatter markup back to storable text, preserving other formatting', () => {
      const bridge = new CometChatRichTextFormatter([new HashtagFormatter()]);
      const html = '<b>bold</b> <span class="hashtag">#world</span>';
      expect(bridge.format(html)).toBe('**bold** #world');
    });

    it('leaves messages without the formatter markup unchanged', () => {
      const bridge = new CometChatRichTextFormatter([new HashtagFormatter()]);
      expect(bridge.format('<i>hi</i> there')).toBe('_hi_ there');
    });
  });

  describe('kit-provided caret defaults', () => {
    let el: HTMLDivElement;
    beforeEach(() => {
      el = document.createElement('div');
      el.contentEditable = 'true';
      document.body.appendChild(el);
    });
    afterEach(() => el.remove());

    it('getCaretPosition / setCaretPosition round-trip as character offsets', () => {
      el.textContent = 'hello world';
      const f = new HashtagFormatter();
      f.setInputElementReference(el);

      f.setCaretPosition(5);
      expect(f.getCaretPosition()).toBe(5);

      f.setCaretPosition(11); // end
      expect(f.getCaretPosition()).toBe(11);
    });

    it('setCaretPosition walks nested spans (offset in a node other than the first)', () => {
      el.innerHTML = 'hi <span class="hashtag">#tag</span> end';
      const f = new HashtagFormatter();
      f.setInputElementReference(el);

      f.setCaretPosition(5); // inside "#tag" (hi ␣ # t | a g)
      const sel = window.getSelection()!;
      // Caret landed inside the span's text node, not childNodes[0].
      expect(sel.getRangeAt(0).startContainer.parentElement?.className).toBe('hashtag');
      expect(f.getCaretPosition()).toBe(5);
    });
  });
});
