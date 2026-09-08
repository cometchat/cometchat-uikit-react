import type { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Abstract base class for text formatters.
 *
 * Formatters detect patterns in text and apply formatting transformations.
 * They can be chained together — each formatter receives the output of the
 * previous one. Formatters are applied in order of their `priority` property
 * (lower = earlier in pipeline).
 *
 * DISPLAY (text → HTML) is handled by `format`/`getRegex` — both have defaults, so a formatter can
 * instead just override `customLogicToFormatText`.
 *
 * A formatter MAY additionally own live composer INPUT: the composer assigns
 * `inputElementReference` and fans keystrokes to `onKeyUp`/`onKeyDown`, and the formatter mutates the
 * editor DOM directly (with kit-provided `getCaretPosition`/`setCaretPosition` defaults). Display-only
 * formatters simply omit that.
 *
 * @example
 * ```typescript
 * class HashtagFormatter extends CometChatTextFormatter {
 *   readonly id = 'hashtag-formatter';
 *   priority = 50;
 *   getRegex() { return /(#\w+)/g; }
 *   format(text: string): string {
 *     this.originalText = text;
 *     this.formattedText = text.replace(this.getRegex(), '<span class="hashtag">$1</span>');
 *     return this.formattedText;
 *   }
 * }
 * ```
 */
export abstract class CometChatTextFormatter {
  /** Formatter priority (lower = earlier in pipeline). Default is 100. */
  priority = 100;

  /** Unique identifier for this formatter. */
  abstract readonly id: string;

  /** The original unformatted text. */
  protected originalText = '';

  /** The formatted text after applying transformations. */
  protected formattedText = '';

  /** Metadata extracted during formatting (e.g., mentions, URLs). */
  protected metadata: Record<string, unknown> = {};

  /**
   * Regex for detecting formattable content (display pipeline). Default returns the first of
   * `regexPatterns`, or a never-matching pattern. Override for display-only formatters.
   */
  getRegex(): RegExp {
    return this.regexPatterns[0] ?? /(?!)/;
  }

  /**
   * Format input text → HTML for DISPLAY. Default stores state and delegates to
   * `getFormattedText(text)` → `customLogicToFormatText`, so an imperative formatter only overrides
   * `customLogicToFormatText`. v7-style formatters may override `format` directly.
   */
  format(text: string): string {
    this.originalText = text;
    this.formattedText = this.getFormattedText(text);
    return this.formattedText;
  }

  /**
   * No arg (v7): the formatted text from the last `format()`.
   * With `inputText`: produce formatted HTML for that text via `customLogicToFormatText`.
   */
  getFormattedText(inputText?: string): string {
    if (inputText === undefined) return this.formattedText;
    return this.customLogicToFormatText(inputText);
  }

  /**
   * No arg (v7): the original text from the last `format()`.
   * With `inputText`: strip THIS formatter's markup back to storable text, using
   * `regexToReplaceFormatting` (each pattern's group 1 is kept). Override for custom stripping.
   */
  getOriginalText(inputText?: string): string {
    if (inputText === undefined) return this.originalText;
    let out = inputText;
    for (const pattern of this.regexToReplaceFormatting) out = out.replace(pattern, '$1');
    return out;
  }

  /**
   * The consumer's display transform. Default: identity. Override to wrap patterns, e.g.
   * `return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')`.
   */
  customLogicToFormatText(text: string): string {
    return text;
  }

  /** Get metadata extracted during formatting. */
  getMetadata(): Record<string, unknown> {
    return this.metadata;
  }

  /** Reset the formatter state. */
  reset(): void {
    this.originalText = '';
    this.formattedText = '';
    this.metadata = {};
  }

  /**
   * Check if this formatter should process the given text.
   * Override to conditionally skip formatting. Default: always format.
   */
  shouldFormat(
    _text: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _message?: CometChat.BaseMessage // eslint-disable-line @typescript-eslint/no-unused-vars
  ): boolean {
    return true;
  }

  // --- Optional imperative input ---
  // A formatter can OWN live composer editing: the composer assigns
  // `inputElementReference` and fans keystrokes to `onKeyUp`/`onKeyDown`, and the formatter mutates
  // the editor DOM directly. Do SURGICAL edits (split/wrap only the matched text nodes, skip
  // protected nodes) — NOT `innerText → innerHTML`, which flattens bold/mentions. The kit supplies
  // robust caret defaults (below) + history integration.

  /** The composer's contenteditable input. Assigned by the composer — do not set by hand. */
  inputElementReference: HTMLElement | null = null;
  /** Character that starts this formatter's tracking (e.g. '#'). */
  trackCharacter = '';
  /** Whether a tracking session is active (convenience flag; formatter-managed). */
  startTracking = false;
  /** Patterns this formatter matches while formatting the live input / for `getRegex`. */
  protected regexPatterns: RegExp[] = [];
  /** Patterns used to strip this formatter's markup back to storable text (group 1 kept). */
  protected regexToReplaceFormatting: RegExp[] = [];
  /** Consumer key/re-render callbacks . */
  protected keyUpCallBack?: (event: KeyboardEvent) => void;
  protected keyDownCallBack?: (event: KeyboardEvent) => void;
  protected reRenderCallBack?: () => void;

  setInputElementReference(element: HTMLElement | null): void {
    this.inputElementReference = element;
  }
  setTrackingCharacter(character: string): void {
    this.trackCharacter = character;
  }
  setRegexPatterns(patterns: RegExp[]): void {
    this.regexPatterns = patterns;
  }
  getRegexPatterns(): RegExp[] {
    return this.regexPatterns;
  }
  setRegexToReplaceFormatting(patterns: RegExp[]): void {
    this.regexToReplaceFormatting = patterns;
  }
  setKeyUpCallBack(callback: (event: KeyboardEvent) => void): void {
    this.keyUpCallBack = callback;
  }
  setKeyDownCallBack(callback: (event: KeyboardEvent) => void): void {
    this.keyDownCallBack = callback;
  }
  setReRender(callback: () => void): void {
    this.reRenderCallBack = callback;
  }
  reRender(): void {
    this.reRenderCallBack?.();
  }

  /**
   * Lifecycle hook the composer calls AFTER assigning `inputElementReference`. Override for one-time
   * setup. (The composer now assigns the reference for you.)
   */
  initializeComposerTracking(): void {
    /* no-op by default */
  }

  /** Called by the composer on every keyup/keydown. Default delegates to the callbacks. */
  onKeyUp(event: KeyboardEvent): void {
    this.keyUpCallBack?.(event);
  }
  onKeyDown(event: KeyboardEvent): void {
    this.keyDownCallBack?.(event);
  }

  /**
   * Re-scan and reformat the live input. DEFAULT: replace the input's `innerHTML` with
   * `getFormattedText(text)`. WARNING: this default FLATTENS other formatting (bold, mentions) —
   * power formatters should OVERRIDE `formatText` to do surgical DOM edits (split/wrap only the
   * matched text nodes) and skip protected nodes. See the Hashtag sample.
   */
  formatText(): void {
    const root = this.inputElementReference;
    if (!root) return;
    const input = root.innerText !== '' ? root.innerText : (root.textContent ?? '');
    root.innerHTML = this.getFormattedText(input);
    this.reRender();
  }

  /**
   * The caret's position as a character offset within the input (kit-provided default;
   * structure-aware, iframe-safe). Override only for exotic needs.
   */
  getCaretPosition(): number {
    const root = this.inputElementReference;
    if (!root) return 0;
    const sel = root.ownerDocument.defaultView?.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.endContainer)) return 0;
    const pre = range.cloneRange();
    pre.selectNodeContents(root);
    pre.setEnd(range.endContainer, range.endOffset);
    return pre.toString().length;
  }

  /**
   * Restore the caret from a character offset (kit-provided default). Walks text nodes rather than
   * indexing `childNodes[0]`, so it stays correct after wrapping introduces nested spans.
   */
  setCaretPosition(position: number): void {
    const root = this.inputElementReference;
    if (!root) return;
    const sel = root.ownerDocument.defaultView?.getSelection();
    if (!sel) return;
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const range = root.ownerDocument.createRange();
    let consumed = 0;
    let node = walker.nextNode() as Text | null;
    while (node) {
      if (position <= consumed + node.data.length) {
        range.setStart(node, Math.min(position - consumed, node.data.length));
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      consumed += node.data.length;
      node = walker.nextNode() as Text | null;
    }
    // Offset past the end — park at the end of the content.
    range.selectNodeContents(root);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
