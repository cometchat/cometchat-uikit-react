export { RichTextEditor } from './RichTextEditor';
export type {
  CometChatRichTextEditorConfig,
  CometChatRichTextFormatState,
  CometChatHistoryEntry,
} from './RichTextEditor.types';
export { DEFAULT_FORMAT_STATE } from './RichTextEditor.types';

// Format commands (for direct access or extension)
export type { EditorContext, FormatCommand } from './formats/format.types';
export {
  BoldFormat,
  ItalicFormat,
  UnderlineFormat,
  StrikethroughFormat,
} from './formats/InlineFormat';
export { InlineCodeFormat } from './formats/InlineCodeFormat';
export { CodeBlockFormat } from './formats/CodeBlockFormat';
export { BlockquoteFormat } from './formats/BlockquoteFormat';
export { OrderedListFormat, BulletListFormat } from './formats/ListFormat';
export { LinkFormat } from './formats/LinkFormat';

// History manager (for advanced use cases)
export { HistoryManager } from './history/HistoryManager';
