/**
 * Format Commands — barrel export.
 *
 * All formatting operations are exported from here.
 */

export type { EditorContext, FormatCommand } from './format.types';

// Inline formats (bold, italic, underline, strikethrough)
export {
  BoldFormat,
  ItalicFormat,
  UnderlineFormat,
  StrikethroughFormat,
  clearInlineOverrides,
  deactivateUnderline,
  isDeactivated,
  isActivated,
  queryInlineFormatState,
} from './InlineFormat';

// Inline code
export { InlineCodeFormat } from './InlineCodeFormat';

// Code block
export { CodeBlockFormat } from './CodeBlockFormat';

// Blockquote
export { BlockquoteFormat } from './BlockquoteFormat';

// Lists (ordered + bullet)
export {
  OrderedListFormat,
  BulletListFormat,
  fixOrderedListContinuation,
  handleListEnter,
  handleListIndent,
  handleListOutdent,
  applyListStyles,
} from './ListFormat';

// Link
export { LinkFormat, setLink, getCurrentLink, getCurrentLinkText } from './LinkFormat';
