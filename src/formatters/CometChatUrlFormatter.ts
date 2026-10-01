import { CometChatTextFormatter } from './CometChatTextFormatter';
import { trimUrlTrailing } from '../utils/urlShielding';

/**
 * Formatter for URLs in text.
 *
 * Detects URL patterns (http://, https://, www.) and converts them to
 * clickable links with security attributes. Protects existing `<a>` tags
 * and markdown links from double-processing.
 */
export class CometChatUrlFormatter extends CometChatTextFormatter {
  readonly id = 'url-formatter';
  override priority = 100;

  /**
   * Zero-width characters are editor artifacts - the composer inserts U+200B to
   * park the caret after a converted markdown span. They are invisible in the
   * bubble but corrupt the href, so they are dropped from detected URLs. This
   * also repairs messages already stored with one embedded.
   */
  private static readonly ZERO_WIDTH = /\u200B|\u200C|\u200D|\uFEFF/g;

  private urls: string[] = [];

  override getRegex(): RegExp {
    return /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/gi;
  }

  override format(text: string): string {
    if (!text) {
      this.originalText = '';
      this.formattedText = '';
      this.urls = [];
      this.metadata = { urls: [] };
      return '';
    }

    this.originalText = text;
    this.urls = [];

    const placeholders: string[] = [];
    const protect = (match: string): string => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `__COMETCHAT_LINK_${String(idx)}__`;
    };

    // Protect code blocks and inline code FIRST — a URL inside a code span is
    // shown verbatim by design and must not be turned into a link.
    const codeRegex = /<pre><code>[\s\S]*?<\/code><\/pre>|<code>[\s\S]*?<\/code>/gi;
    let protectedText = text.replace(codeRegex, protect);

    // Protect markdown links [text](url) from double-processing
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    protectedText = protectedText.replace(markdownLinkRegex, protect);

    // Protect existing <a> tags. Uses [\s\S]*? (not [^<]*) for the link body so
    // links whose text carries nested inline markup are still protected — a
    // custom colour <span>, a mention, or a markdown link with a bold label.
    // Otherwise the anchor goes unprotected and the bare URL inside href="…"
    // gets re-linkified, corrupting the tag.
    const existingLinkRegex = /<a\s[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
    protectedText = protectedText.replace(existingLinkRegex, protect);

    // Process bare URLs
    this.formattedText = protectedText.replace(this.getRegex(), match => {
      // Strip trailing punctuation that's likely not part of the URL. A closing
      // paren is decided by balance, so `/wiki/Mercury_(planet)` keeps its own.
      const withoutTrailing = trimUrlTrailing(match, /[.,;:!?]+$/);
      const trailing = match.slice(withoutTrailing.length);
      const cleaned = withoutTrailing.replace(CometChatUrlFormatter.ZERO_WIDTH, '');
      this.urls.push(cleaned);
      const href = cleaned.startsWith('www.') ? `https://${cleaned}` : cleaned;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="cometchat-link">${cleaned}</a>${trailing}`;
    });

    // Restore placeholders
    this.formattedText = this.formattedText.replace(
      /__COMETCHAT_LINK_(\d+)__/g,
      (_, idx) => placeholders[parseInt(idx as string, 10)] ?? ''
    );

    this.metadata = { urls: this.urls };
    return this.formattedText;
  }

  /** Get detected URLs from the last format() call. */
  getUrls(): string[] {
    return [...this.urls];
  }

  override reset(): void {
    super.reset();
    this.urls = [];
  }
}
