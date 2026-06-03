import type { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Abstract base class for text formatters.
 *
 * Formatters detect patterns in text and apply formatting transformations.
 * They can be chained together — each formatter receives the output of the
 * previous one. Formatters are applied in order of their `priority` property
 * (lower = earlier in pipeline).
 *
 * Formatters handle ONLY bubble display (text → HTML). Composer input
 * handling and message metadata are separate concerns.
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

  /** Get the regex pattern for detecting formattable content. */
  abstract getRegex(): RegExp;

  /**
   * Format the input text by applying transformations.
   * Must store originalText, apply transformations, store formattedText, and return it.
   */
  abstract format(text: string): string;

  /** Get the formatted text after format() has been called. */
  getFormattedText(): string {
    return this.formattedText;
  }

  /** Get the original unformatted text. */
  getOriginalText(): string {
    return this.originalText;
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
}
