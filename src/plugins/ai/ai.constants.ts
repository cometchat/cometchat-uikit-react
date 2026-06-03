/**
 * AI Plugin Constants
 */

export const AI_CONSTANTS = {
  /** Plugin ID for the AI assistant plugin. */
  pluginId: 'ai-assistant',

  /** Message type for AI assistant messages. */
  messageType: 'assistant',

  /** Message type for tool argument messages. */
  toolArgumentsType: 'toolArguments',

  /** Message type for tool result messages. */
  toolResultsType: 'toolResults',

  /** Message category for agentic messages. */
  messageCategory: 'agentic',

  /** Default panel title. */
  defaultPanelTitle: 'AI Assistant',

  /** Default input placeholder. */
  defaultInputPlaceholder: 'Ask AI anything...',

  /** Maximum message history to keep in the panel. */
  maxHistoryLength: 100,

  /** Streaming cursor character. */
  streamingCursor: '▋',

  /** Delay (ms) before hiding the streaming cursor after completion. */
  cursorHideDelay: 500,
} as const;
