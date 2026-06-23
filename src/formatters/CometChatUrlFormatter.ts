import { CometChatTextFormatter } from './CometChatTextFormatter';

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

  private urls: string[] = [];

  getRegex(): RegExp {
    return /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/gi;
  }

  format(text: string): string {
    if (!text) {
      this.originalText = '';
      this.formattedText = '';
      this.urls = [];
      this.metadata = { urls: [] };
      return '';
    }

    this.originalText = text;
    this.urls = [];

    // Protect markdown links [text](url) from double-processing
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const placeholders: string[] = [];
    let protectedText = text.replace(markdownLinkRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `__COMETCHAT_LINK_${String(idx)}__`;
    });

    // Protect existing <a> tags
    const existingLinkRegex = /<a\s[^>]*href="[^"]*"[^>]*>[^<]*<\/a>/gi;
    protectedText = protectedText.replace(existingLinkRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `__COMETCHAT_LINK_${String(idx)}__`;
    });

    // Process bare URLs
    this.formattedText = protectedText.replace(this.getRegex(), match => {
      // Strip trailing punctuation that's likely not part of the URL
      const cleaned = match.replace(/[).,;:!?]+$/, '');
      const trailing = match.slice(cleaned.length);
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
