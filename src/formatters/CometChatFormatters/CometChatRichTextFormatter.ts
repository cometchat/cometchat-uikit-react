import { CometChatTextFormatter } from "./CometChatTextFormatter";
import { MentionsTargetElement } from "../../Enums/Enums";
import { convertHtmlToMarkdown } from "../../utils/HtmlToMarkdown";

/**
 * CometChatRichTextFormatter
 * 
 * Handles rich text formatting for CometChat messages.
 * - COMPOSER SIDE: Converts HTML from contenteditable to markdown for storage
 * - BUBBLE SIDE: Passes through text as-is (markdown rendering handled by CometChatMarkdownFormatter)
 */
export class CometChatRichTextFormatter extends CometChatTextFormatter {
  constructor() {
    super();
    this.setId("rich-text-formatter");
  }

  /**
   * BUBBLE SIDE: Pass through text as-is
   * The CometChatMarkdownFormatter handles converting markdown to HTML for display
   */
  override getFormattedText(
    inputText: string,
    _params?: { mentionsTargetElement?: MentionsTargetElement }
  ): string {
    if (!inputText) return inputText;
    return inputText;
  }

  /**
   * COMPOSER SIDE: Convert HTML from contenteditable to markdown
   * This is called before sending the message to convert the rich HTML to markdown format
   */
  override getOriginalText(inputText: string | null | undefined): string {
    if (!inputText) return "";
    
    // Check if the input contains HTML tags that need conversion
    // If it's already plain text or markdown, return as-is
    if (!this.containsHtmlTags(inputText)) {
      return inputText;
    }
    
    // Convert HTML to markdown
    const result = convertHtmlToMarkdown(inputText);
    return result;
  }

  /**
   * Check if the input contains HTML tags that need conversion
   */
  private containsHtmlTags(text: string): boolean {
    // Check for common HTML tags used in rich text editing
    const htmlTagPattern = /<(b|strong|i|em|u|s|strike|del|code|pre|blockquote|a|ol|ul|li|br|div|p|span)[^>]*>/i;
    return htmlTagPattern.test(text);
  }

  /**
   * Register click handlers for links in bubbles
   */
  override registerEventListeners(
    span: Element,
    _classList: DOMTokenList
  ): Element {
    return span;
  }
}
