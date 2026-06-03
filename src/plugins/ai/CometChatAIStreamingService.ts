/**
 * CometChatAIStreamingService
 *
 * Module-level streaming service for AI assistant messages.
 *
 * Architecture:
 * - Single global message queue processed sequentially (no drops)
 * - Per-chatId streaming state tracked via Map<chatId, StreamState>
 * - Subscribers notified via Set<listener> per chatId
 * - Configurable stream speed (typing delay between text chunks)
 * - Tool call execution via CometChatAIAssistantTools
 *
 * This is a plain TypeScript module (not a React hook or class) so it can be
 * imported by both the streaming bubble and the AI assistant chat component.
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatStreamState } from './ai.types';
import { CometChatAIAssistantTools } from './ai.types';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

// ---------------------------------------------------------------------------
// Stream state store
// ---------------------------------------------------------------------------

const streamStateMap = new Map<string, CometChatStreamState>();
const streamListeners = new Map<string, Set<() => void>>();

// Stable default — same reference every time, so useSyncExternalStore
// doesn't trigger a re-render when no state exists for a chatId yet.
const DEFAULT_STREAM_STATE: CometChatStreamState = Object.freeze({
  text: '',
  isComplete: false,
  activeToolCall: null,
  toolExecutionText: '',
  isThinking: false,
  hasContent: false,
  hasError: false,
  hasStarted: false,
});

export function getStreamState(chatId: string): CometChatStreamState {
  return streamStateMap.get(chatId) ?? DEFAULT_STREAM_STATE;
}

function setStreamState(
  chatId: string,
  updater: (prev: CometChatStreamState) => CometChatStreamState
): void {
  const prev = getStreamState(chatId);
  const next = updater(prev);
  streamStateMap.set(chatId, next);
  notifyListeners(chatId);
}

function notifyListeners(chatId: string): void {
  streamListeners.get(chatId)?.forEach(listener => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeToStreamState(chatId: string, listener: () => void): () => void {
  if (!streamListeners.has(chatId)) {
    streamListeners.set(chatId, new Set());
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  streamListeners.get(chatId)!.add(listener);
  return () => {
    streamListeners.get(chatId)?.delete(listener);
    if (streamListeners.get(chatId)?.size === 0) {
      streamListeners.delete(chatId);
    }
  };
}

// ---------------------------------------------------------------------------
// Message queue (sequential processing, no drops)
// ---------------------------------------------------------------------------

interface QueueItem {
  event: CometChat.AIAssistantBaseEvent;
  chatId: string;
}

let messageQueue: QueueItem[] = [];
let isProcessing = false;
let streamSpeedMs = 30;
let aiTools: CometChatAIAssistantTools | null = null;

// Per-run accumulated tool args
const toolCallArgsMap = new Map<string, string>(); // keyed by runId
const toolCallNameMap = new Map<string, string>(); // keyed by runId

export function setStreamSpeed(ms: number): void {
  streamSpeedMs = ms;
}

export function getStreamSpeed(): number {
  return streamSpeedMs;
}

export function setAIAssistantTools(tools: CometChatAIAssistantTools): void {
  aiTools = tools;
}

export function getAIAssistantTools(): CometChatAIAssistantTools | null {
  return aiTools;
}

/**
 * Push an AI stream event into the processing queue.
 * Called by the SDK listener in CometChatAIAssistantChat.
 */
export function handleWebsocketMessage(
  event: CometChat.AIAssistantBaseEvent,
  chatId: string
): void {
  messageQueue.push({ event, chatId });
  if (!isProcessing) {
    void processQueue();
  }
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  while (messageQueue.length > 0) {
    const item = messageQueue.shift();
    if (!item) break;

    const { event, chatId } = item;
    const type = event.getType();

    // Apply delay for text content chunks (typing effect)
    let delayMs = 0;
    if (type === CometChatUIKitConstants.streamMessageTypes.text_message_content) {
      delayMs = streamSpeedMs;
    } else if (type === CometChatUIKitConstants.streamMessageTypes.tool_call_args) {
      delayMs = 0;
    }

    if (delayMs > 0) {
      await new Promise<void>(resolve => setTimeout(resolve, delayMs));
    }

    processEvent(event, chatId);
  }

  isProcessing = false;
}

function processEvent(event: CometChat.AIAssistantBaseEvent, chatId: string): void {
  const type = event.getType();
  const runId = event.getMessageId();
  const { streamMessageTypes } = CometChatUIKitConstants;

  switch (type) {
    case streamMessageTypes.run_started: {
      setStreamState(chatId, () => ({
        text: '',
        isComplete: false,
        activeToolCall: null,
        toolExecutionText: '',
        isThinking: true,
        hasContent: false,
        hasError: false,
        hasStarted: true,
      }));
      break;
    }

    case streamMessageTypes.text_message_start: {
      setStreamState(chatId, prev => ({
        ...prev,
        isThinking: false,
      }));
      break;
    }

    case streamMessageTypes.text_message_content: {
      const contentEvent = event as CometChat.AIAssistantContentReceivedEvent;
      const delta = typeof contentEvent.getDelta === 'function' ? contentEvent.getDelta() : '';
      setStreamState(chatId, prev => ({
        ...prev,
        text: prev.text + delta,
        hasContent: true,
        isThinking: false,
      }));
      break;
    }

    case streamMessageTypes.text_message_end: {
      // Text is already accumulated — no state change needed
      break;
    }

    case streamMessageTypes.tool_call_start: {
      const toolEvent = event as CometChat.AIAssistantToolStartedEvent;
      const toolName =
        typeof toolEvent.getToolCallName === 'function' ? toolEvent.getToolCallName() : '';
      toolCallNameMap.set(runId, toolName);
      toolCallArgsMap.set(runId, '');

      // Get execution text from event data if available
      const eventData = (
        event as unknown as { getData?: () => { executionText?: string } }
      ).getData?.();
      const executionText = eventData?.executionText ?? '';

      setStreamState(chatId, prev => ({
        ...prev,
        activeToolCall: toolName,
        toolExecutionText: executionText,
        isThinking: false,
      }));
      break;
    }

    case streamMessageTypes.tool_call_args: {
      const argEvent = event as CometChat.AIAssistantToolArgumentEvent;
      const delta = typeof argEvent.getDelta === 'function' ? argEvent.getDelta() : '';
      const prev = toolCallArgsMap.get(runId) ?? '';
      toolCallArgsMap.set(runId, prev + delta);
      break;
    }

    case streamMessageTypes.tool_call_end: {
      const toolName = toolCallNameMap.get(runId);
      const rawArgs = toolCallArgsMap.get(runId) ?? '';

      // Execute the tool handler if registered
      if (toolName && aiTools) {
        const handler = aiTools.getAction(toolName);
        if (handler) {
          try {
            handler(JSON.parse(rawArgs) as Record<string, unknown>);
          } catch {
            // Malformed JSON — ignore
          }
        }
      }

      setStreamState(chatId, prev => ({
        ...prev,
        activeToolCall: null,
        toolExecutionText: '',
      }));

      toolCallNameMap.delete(runId);
      toolCallArgsMap.delete(runId);
      break;
    }

    case streamMessageTypes.run_finished: {
      setStreamState(chatId, prev => ({
        ...prev,
        isComplete: true,
        isThinking: false,
        activeToolCall: null,
        toolExecutionText: '',
      }));
      break;
    }

    default:
      break;
  }
}

/**
 * Start a new streaming session for a chatId.
 * Resets state and marks streaming as active.
 */
export function startStreamingMessage(chatId: string): void {
  streamStateMap.set(chatId, {
    text: '',
    isComplete: false,
    activeToolCall: null,
    toolExecutionText: '',
    isThinking: true,
    hasContent: false,
    hasError: false,
    hasStarted: true,
  });
  notifyListeners(chatId);
}

/**
 * Stop streaming for a chatId and clean up state.
 */
export function stopStreamingMessage(chatId: string): void {
  streamStateMap.delete(chatId);
  toolCallArgsMap.clear();
  toolCallNameMap.clear();
  // Drain the queue for this chatId
  messageQueue = messageQueue.filter(item => item.chatId !== chatId);
  notifyListeners(chatId);
}

/**
 * Mark a streaming session as having an error (e.g., network offline).
 */
export function setStreamError(chatId: string): void {
  setStreamState(chatId, prev => ({
    ...prev,
    hasError: true,
    isThinking: false,
    activeToolCall: null,
  }));
}

/**
 * Check if streaming is currently active for a chatId.
 */
export function isStreaming(chatId: string): boolean {
  const state = streamStateMap.get(chatId);
  return state !== undefined && state.hasStarted && !state.isComplete;
}
