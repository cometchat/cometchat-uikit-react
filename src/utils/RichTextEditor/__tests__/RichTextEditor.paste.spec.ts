import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mountEditor,
  cleanupEditors,
  setCaret,
  selectRange,
  textNodeOf,
  installExecCommand,
  installQueryCommandState,
  paste,
} from './rteHarness';

afterEach(() => {
  cleanupEditors();
  vi.restoreAllMocks();
});

/** Mount an editor with a caret at the end of a paragraph and a recording execCommand. */
function setup(config: Parameters<typeof mountEditor>[0] = {}, html = '<p>x</p>') {
  const exec = installExecCommand();
  const ctx = mountEditor(config, html);
  if (ctx.el.textContent) {
    const t = textNodeOf(ctx.el);
    setCaret(t, t.length);
  }
  return { ...ctx, exec };
}

/** The HTML handed to execCommand('insertHTML'), parsed for structural assertions. */
function insertedHtml(exec: ReturnType<typeof installExecCommand>): HTMLElement {
  const call = exec.mock.calls.find(c => c[0] === 'insertHTML');
  expect(call).toBeDefined();
  const div = document.createElement('div');
  div.innerHTML = call?.[2] ?? '';
  return div;
}

describe('paste — guards', () => {
  it('ignores a paste event without clipboard data', () => {
    const { el, exec } = setup();
    const evt = paste(el, null);
    expect(evt.defaultPrevented).toBe(false);
    expect(exec).not.toHaveBeenCalled();
  });

  it('blocks file pastes (handled by the composer, not inserted as content)', () => {
    const { el, exec } = setup();
    const evt = paste(el, { files: true, text: 'name.png' });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).not.toHaveBeenCalled();
    expect(el.innerHTML).toBe('<p>x</p>');
  });

  it('inserts plain text only when formatting is disabled', () => {
    const { el, exec } = setup({ enableFormatting: false });
    const evt = paste(el, { text: '**bold**', html: '<b>bold</b>' });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith('insertText', false, '**bold**');
    expect(el.textContent).toBe('x**bold**');
  });

  it('leaves whitespace-only text to the browser', () => {
    const { el, exec } = setup();
    expect(paste(el, { text: '   ' }).defaultPrevented).toBe(false);
    expect(exec).not.toHaveBeenCalled();
  });
});

describe('paste — inside a code block', () => {
  it('splices plain text into the text node at the caret, ignoring HTML', () => {
    const onUpdate = vi.fn();
    const { el, exec } = setup({ onUpdate }, '<pre><code>abcd</code></pre>');
    const t = textNodeOf(el);
    setCaret(t, 2);
    const evt = paste(el, { text: '<b>X</b>\n', html: '<b>X</b>' });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).not.toHaveBeenCalled();
    expect(t.data).toBe('ab<b>X</b>\ncd');
    expect(el.querySelector('pre b')).toBeNull();
    expect(window.getSelection()!.getRangeAt(0).startOffset).toBe(2 + '<b>X</b>\n'.length);
    expect(onUpdate).toHaveBeenLastCalledWith(el.innerHTML, el.textContent);
  });

  it('creates the text node when the code block is empty', () => {
    const { el } = setup({}, '<pre><code></code></pre>');
    const code = el.querySelector('code')!;
    setCaret(code, 0);
    paste(el, { text: 'let a = 1;' });
    expect(code.textContent).toBe('let a = 1;');
    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer).toBe(code.firstChild);
    expect(range.startOffset).toBe(10);
  });

  it('inserts at the start when the caret is before the first child of <code>', () => {
    const { el } = setup({}, '<pre><code>abc</code></pre>');
    const code = el.querySelector('code')!;
    setCaret(code, 0);
    paste(el, { text: 'X' });
    expect(code.textContent).toBe('Xabc');
  });

  it('falls back to the <pre> when there is no inner <code>', () => {
    const { el } = setup({}, '<pre></pre>');
    const pre = el.querySelector('pre')!;
    setCaret(pre, 0);
    paste(el, { text: 'raw' });
    expect(pre.textContent).toBe('raw');
  });

  // Known issue: with the caret on the <code> element, its child-index offset is used as a character offset, so pasting after the text node lands inside it.
  it.fails('inserts after the text when the caret is after the last child of <code>', () => {
    const { el } = setup({}, '<pre><code>abc</code></pre>');
    const code = el.querySelector('code')!;
    setCaret(code, 1);
    paste(el, { text: 'X' });
    expect(code.textContent).toBe('abcX');
  });
});

describe('paste — URL onto a selection', () => {
  it('turns the selected text into a link', () => {
    const { el, exec } = setup({}, '<p>click here</p>');
    installQueryCommandState();
    const t = textNodeOf(el);
    selectRange(t, 6, t, 10);
    const evt = paste(el, { text: ' https://example.com/page ' });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).toHaveBeenCalledWith('createLink', false, 'https://example.com/page');
    expect(exec).not.toHaveBeenCalledWith('insertText', false, expect.anything());
  });

  it('a URL without a selection is left to the browser', () => {
    const { el, exec } = setup();
    expect(paste(el, { text: 'https://example.com' }).defaultPrevented).toBe(false);
    expect(exec).not.toHaveBeenCalled();
  });

  it('a non-URL onto a selection is not linked', () => {
    const { el, exec } = setup({}, '<p>click here</p>');
    const t = textNodeOf(el);
    selectRange(t, 0, t, 5);
    paste(el, { text: 'not a url' });
    expect(exec).not.toHaveBeenCalledWith('createLink', false, expect.anything());
  });
});

describe('paste — plain text', () => {
  it('converts markdown to HTML and inserts it', () => {
    const onUpdate = vi.fn();
    const { el, exec } = setup({ onUpdate });
    const evt = paste(el, { text: '- one\n- two' });
    expect(evt.defaultPrevented).toBe(true);
    const html = insertedHtml(exec);
    expect(Array.from(html.querySelectorAll('ul > li')).map(li => li.textContent)).toEqual([
      'one',
      'two',
    ]);
    expect(el.querySelectorAll('li')).toHaveLength(2);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('never inserts raw markup from plain text', () => {
    const { el, exec } = setup();
    paste(el, { text: '<img src=x onerror=alert(1)>' });
    expect(el.querySelector('img')).toBeNull();
    expect(exec.mock.calls.some(c => /<img/i.test(c[2] ?? ''))).toBe(false);
  });

  // convertMarkdownToHtml always wraps a line in <p>, so plain text also goes through
  // insertHTML; browsers merge a single pasted paragraph into the current line.
  it('pastes text without markdown as a single paragraph', () => {
    const { el, exec } = setup();
    paste(el, { text: 'just words' });
    expect(exec).toHaveBeenCalledWith('insertHTML', false, '<p>just words</p>');
  });
});

describe('paste — HTML', () => {
  it('pastes complex layouts (tables) as plain text', () => {
    const { el, exec } = setup();
    const evt = paste(el, {
      text: 'a\tb',
      html: '<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>',
    });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).toHaveBeenCalledWith('insertText', false, 'a\tb');
    expect(exec).not.toHaveBeenCalledWith('insertHTML', false, expect.anything());
  });

  it('keeps semantic formatting and drops every attribute', () => {
    const { el, exec } = setup();
    paste(el, {
      text: 'bold italic',
      html: '<b style="color:red" class="x" onclick="alert(1)">bold</b> <em id="e">italic</em> <s>s</s> <code>c</code>',
    });
    const html = insertedHtml(exec);
    expect(html.innerHTML).toBe('<b>bold</b> <em>italic</em> <s>s</s> <code>c</code>');
  });

  it('unwraps unknown wrappers and separates unwrapped blocks with <br>', () => {
    const { el, exec } = setup();
    paste(el, {
      text: 'one two',
      html: '<div class="bubble"><span style="x">one</span></div><div><font>two</font></div><section>three</section>',
    });
    expect(insertedHtml(exec).innerHTML).toBe('one<br>two<br>three');
  });

  it('does not double a <br> already preceding an unwrapped block', () => {
    const { el, exec } = setup();
    paste(el, { text: 'a b', html: 'a<br><div>b</div>' });
    expect(insertedHtml(exec).innerHTML).toBe('a<br>b');
  });

  it('removes <script> elements (their text stays inert)', () => {
    const { el, exec } = setup();
    paste(el, { text: 'hi', html: '<p>hi</p><script>alert(1)</script>' });
    const html = insertedHtml(exec);
    expect(html.querySelector('script')).toBeNull();
    expect(html.querySelector('p')!.textContent).toBe('hi');
  });

  it('drops comments and non-element nodes', () => {
    const { el, exec } = setup();
    paste(el, { text: 'a', html: '<!-- note --><i>a</i>' });
    expect(insertedHtml(exec).innerHTML).toBe('<i>a</i>');
  });

  it('keeps links with only href, forcing target=_blank and rel=noopener', () => {
    const { el, exec } = setup();
    paste(el, {
      text: 'site',
      html: '<a href="https://example.com/" target="_self" onmouseover="x()">site</a><a>bare</a>',
    });
    const [a, bare] = Array.from(insertedHtml(exec).querySelectorAll('a'));
    expect(a!.getAttribute('href')).toBe('https://example.com/');
    expect(a!.getAttribute('target')).toBe('_blank');
    expect(a!.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a!.hasAttribute('onmouseover')).toBe(false);
    expect(bare!.hasAttribute('href')).toBe(false);
  });

  it('keeps mention chips, minus their inline style', () => {
    const { el, exec } = setup();
    paste(el, {
      text: '@Ann',
      html: '<span class="cometchat-mention" data-uid="u1" contenteditable="false" style="color:red">@Ann</span>',
    });
    const chip = insertedHtml(exec).querySelector('span')!;
    expect(chip.getAttribute('data-uid')).toBe('u1');
    expect(chip.className).toBe('cometchat-mention');
    expect(chip.hasAttribute('style')).toBe(false);
  });

  it('collapses runs of <br> and trims leading / trailing ones', () => {
    const { el, exec } = setup();
    paste(el, { text: 'a b', html: '<br><br>a<br><br><br><br>b<br>' });
    expect(insertedHtml(exec).innerHTML).toBe('a<br><br>b');
  });

  it('falls back to plain text when sanitising leaves nothing', () => {
    const { el, exec } = setup();
    paste(el, { text: 'alt text', html: '<img src="x.png">' });
    expect(exec).toHaveBeenCalledWith('insertText', false, 'alt text');
    expect(exec).not.toHaveBeenCalledWith('insertHTML', false, expect.anything());
  });

  it('runs the custom formatter pre/post hooks around the sanitiser', () => {
    const preprocessPastedHtml = vi.fn((html: string) =>
      html.replace(/<span class="color">(.*?)<\/span>/, '{{color:$1}}')
    );
    const postprocessPastedHtml = vi.fn((html: string) =>
      html.replace(/\{\{color:(.*?)\}\}/, '<mark>$1</mark>')
    );
    const { el, exec } = setup({ preprocessPastedHtml, postprocessPastedHtml });
    paste(el, { text: 'red', html: '<p><span class="color">red</span></p>' });
    expect(preprocessPastedHtml).toHaveBeenCalledWith('<p><span class="color">red</span></p>');
    expect(postprocessPastedHtml).toHaveBeenCalledWith('<p>{{color:red}}</p>');
    expect(exec).toHaveBeenCalledWith('insertHTML', false, '<p><mark>red</mark></p>');
  });

  it('skips the post hook when sanitising leaves nothing', () => {
    const postprocessPastedHtml = vi.fn((html: string) => html);
    const { el } = setup({ postprocessPastedHtml });
    paste(el, { text: 'x', html: '<img src="x.png">' });
    expect(postprocessPastedHtml).not.toHaveBeenCalled();
  });

  // Known issue: pasted <a> hrefs are copied verbatim, so javascript: links survive the paste sanitizer (the markdown paste path blocks them).
  it.fails('neutralises javascript: links in pasted HTML', () => {
    const { el, exec } = setup();
    paste(el, { text: 'click', html: '<a href="javascript:alert(1)">click</a>' });
    const a = insertedHtml(exec).querySelector('a')!;
    expect((a.getAttribute('href') ?? '').toLowerCase()).not.toContain('javascript:');
  });

  // Known issue: mention spans are cloned wholesale (only `style` removed), so event-handler attributes on them (and on anything nested inside) survive, contrary to the "keep class and data-uid" intent.
  it.fails('strips event handlers from pasted mention spans', () => {
    const { el, exec } = setup();
    paste(el, {
      text: '@Ann',
      html: '<span data-uid="u1" class="cometchat-mention" onmouseover="alert(1)">@Ann<img src="x" onerror="alert(1)"></span>',
    });
    const chip = insertedHtml(exec).querySelector('span')!;
    expect(chip.hasAttribute('onmouseover')).toBe(false);
    expect(chip.querySelector('[onerror]')).toBeNull();
  });
});
