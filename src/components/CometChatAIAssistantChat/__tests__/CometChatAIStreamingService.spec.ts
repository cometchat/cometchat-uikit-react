/**
 * Unit tests for CometChatAIStreamingService: the typing-delay queue, the
 * run / text / tool-call state machine, tool handler execution, stopping and
 * erroring a stream, and the subscriber store. Card events live in
 * CometChatAIStreamingService.card.spec.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleWebsocketMessage,
  getStreamState,
  subscribeToStreamState,
  startStreamingMessage,
  stopStreamingMessage,
  setStreamError,
  setStreamSpeed,
  getStreamSpeed,
  setAIAssistantTools,
  getAIAssistantTools,
  isStreaming,
} from '../CometChatAIStreamingService';
import { CometChatAIAssistantTools } from '../ai.types';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

const T = CometChatUIKitConstants.streamMessageTypes;

interface EventFields {
  runId?: string;
  delta?: string;
  toolName?: string;
  executionText?: string;
}

function ev(type: string, fields: EventFields = {}): CometChat.AIAssistantBaseEvent {
  return {
    getType: () => type,
    getMessageId: () => fields.runId ?? 'run-1',
    getDelta: () => fields.delta ?? '',
    getToolCallName: () => fields.toolName ?? '',
    getData: () => ({ executionText: fields.executionText }),
  } as unknown as CometChat.AIAssistantBaseEvent;
}

let chatSeq = 0;
let chat: string;

describe('CometChatAIStreamingService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    chat = `chat-${String(++chatSeq)}`;
    setStreamSpeed(30);
  });

  afterEach(async () => {
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  });

  describe('state store', () => {
    it('returns one stable, idle default for a chat that has never streamed', () => {
      const a = getStreamState('never-seen');
      expect(a).toBe(getStreamState('never-seen-either'));
      expect(a).toMatchObject({ text: '', hasStarted: false, isComplete: false, streamCards: [] });
      expect(isStreaming('never-seen')).toBe(false);
    });

    it('notifies subscribers of their own chat only, and stops after unsubscribe', () => {
      const mine = vi.fn();
      const other = vi.fn();
      const off = subscribeToStreamState(chat, mine);
      subscribeToStreamState(`${chat}-other`, other);

      startStreamingMessage(chat, 1);
      expect(mine).toHaveBeenCalledTimes(1);
      expect(other).not.toHaveBeenCalled();

      off();
      setStreamError(chat);
      expect(mine).toHaveBeenCalledTimes(1);
    });

    it('a throwing subscriber does not stop the others being notified', () => {
      const good = vi.fn();
      subscribeToStreamState(chat, () => {
        throw new Error('listener blew up');
      });
      subscribeToStreamState(chat, good);
      expect(() => {
        startStreamingMessage(chat);
      }).not.toThrow();
      expect(good).toHaveBeenCalled();
    });
  });

  describe('starting, finishing and stopping', () => {
    it('startStreamingMessage puts the chat into a thinking, streaming state for that run', () => {
      startStreamingMessage(chat, 42);
      expect(getStreamState(chat)).toMatchObject({
        isThinking: true,
        hasStarted: true,
        isComplete: false,
        currentRunId: '42',
      });
      expect(isStreaming(chat)).toBe(true);
    });

    it('startStreamingMessage without a run id falls back to a timestamp id', () => {
      vi.setSystemTime(1_700_000_000_000);
      startStreamingMessage(chat);
      expect(getStreamState(chat).currentRunId).toBe('1700000000000');
    });

    it('run_started resets any previous text and adopts the event run id', () => {
      setStreamSpeed(0);
      startStreamingMessage(chat, 'old');
      handleWebsocketMessage(ev(T.text_message_content, { delta: 'stale' }), chat);
      handleWebsocketMessage(ev(T.run_started, { runId: 'r2' }), chat);
      expect(getStreamState(chat)).toMatchObject({
        text: '',
        hasContent: false,
        isThinking: true,
        currentRunId: 'r2',
      });
    });

    it('run_started without a message id falls back to a timestamp run id', () => {
      vi.setSystemTime(1_700_000_000_123);
      handleWebsocketMessage(ev(T.run_started, { runId: '' }), chat);
      expect(getStreamState(chat).currentRunId).toBe('1700000000123');
    });

    it('run_finished completes the stream and clears any tool indicator', () => {
      handleWebsocketMessage(ev(T.run_started), chat);
      handleWebsocketMessage(ev(T.tool_call_start, { toolName: 'search' }), chat);
      handleWebsocketMessage(ev(T.run_finished), chat);
      expect(getStreamState(chat)).toMatchObject({
        isComplete: true,
        isThinking: false,
        activeToolCall: null,
        toolExecutionText: '',
      });
      expect(isStreaming(chat)).toBe(false);
    });

    it('stopStreamingMessage resets the chat to idle and notifies subscribers', () => {
      startStreamingMessage(chat, 1);
      const listener = vi.fn();
      subscribeToStreamState(chat, listener);
      stopStreamingMessage(chat);
      expect(getStreamState(chat).hasStarted).toBe(false);
      expect(isStreaming(chat)).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('stopStreamingMessage drops queued chunks for that chat but not for others', async () => {
      const other = `${chat}-b`;
      startStreamingMessage(chat, 1);
      startStreamingMessage(other, 2);
      handleWebsocketMessage(ev(T.text_message_content, { delta: 'A1' }), chat);
      handleWebsocketMessage(ev(T.text_message_content, { delta: 'A2' }), chat);
      handleWebsocketMessage(ev(T.text_message_content, { delta: 'B1' }), other);

      // A1 is already in flight; A2 is still queued and must be discarded.
      stopStreamingMessage(chat);
      await vi.runAllTimersAsync();

      expect(getStreamState(chat).text).not.toContain('A2');
      expect(getStreamState(other).text).toBe('B1');
    });

    it('setStreamError flags the stream and clears the thinking/tool indicators', () => {
      handleWebsocketMessage(ev(T.run_started), chat);
      handleWebsocketMessage(ev(T.tool_call_start, { toolName: 'search' }), chat);
      setStreamError(chat);
      expect(getStreamState(chat)).toMatchObject({
        hasError: true,
        isThinking: false,
        activeToolCall: null,
      });
    });
  });

  describe('text streaming', () => {
    it('reveals text chunks one per stream-speed interval, in order', async () => {
      startStreamingMessage(chat, 1);
      handleWebsocketMessage(ev(T.text_message_start), chat);
      expect(getStreamState(chat).isThinking).toBe(false);

      handleWebsocketMessage(ev(T.text_message_content, { delta: 'Hel' }), chat);
      handleWebsocketMessage(ev(T.text_message_content, { delta: 'lo' }), chat);
      handleWebsocketMessage(ev(T.text_message_content, { delta: '!' }), chat);

      await vi.advanceTimersByTimeAsync(29);
      expect(getStreamState(chat).text).toBe('');
      await vi.advanceTimersByTimeAsync(1);
      expect(getStreamState(chat)).toMatchObject({ text: 'Hel', hasContent: true });
      await vi.advanceTimersByTimeAsync(30);
      expect(getStreamState(chat).text).toBe('Hello');
      await vi.advanceTimersByTimeAsync(30);
      expect(getStreamState(chat).text).toBe('Hello!');
    });

    it('honours a changed stream speed', async () => {
      setStreamSpeed(100);
      expect(getStreamSpeed()).toBe(100);
      startStreamingMessage(chat, 1);
      handleWebsocketMessage(ev(T.text_message_content, { delta: 'x' }), chat);
      await vi.advanceTimersByTimeAsync(99);
      expect(getStreamState(chat).text).toBe('');
      await vi.advanceTimersByTimeAsync(1);
      expect(getStreamState(chat).text).toBe('x');
    });

    it('with speed 0 text appears immediately', () => {
      setStreamSpeed(0);
      startStreamingMessage(chat, 1);
      handleWebsocketMessage(ev(T.text_message_content, { delta: 'now' }), chat);
      expect(getStreamState(chat).text).toBe('now');
    });

    it('events queued behind a text chunk wait for it — run_finished never overtakes text', async () => {
      startStreamingMessage(chat, 1);
      handleWebsocketMessage(ev(T.text_message_content, { delta: 'Answer' }), chat);
      handleWebsocketMessage(ev(T.text_message_end), chat);
      handleWebsocketMessage(ev(T.run_finished), chat);

      expect(getStreamState(chat).isComplete).toBe(false);
      await vi.advanceTimersByTimeAsync(30);
      expect(getStreamState(chat)).toMatchObject({ text: 'Answer', isComplete: true });
    });

    it('a content event without a delta accessor adds nothing', () => {
      setStreamSpeed(0);
      startStreamingMessage(chat, 1);
      const bare = {
        getType: () => T.text_message_content,
        getMessageId: () => 'run-1',
      } as unknown as CometChat.AIAssistantBaseEvent;
      handleWebsocketMessage(bare, chat);
      expect(getStreamState(chat).text).toBe('');
    });

    it('ignores unknown event types', () => {
      startStreamingMessage(chat, 1);
      const before = getStreamState(chat);
      handleWebsocketMessage(ev('something_new'), chat);
      expect(getStreamState(chat)).toBe(before);
    });
  });

  describe('tool calls', () => {
    it('shows the running tool with its execution text, then clears it on end', () => {
      startStreamingMessage(chat, 1);
      handleWebsocketMessage(
        ev(T.tool_call_start, { runId: 't1', toolName: 'weather', executionText: 'Checking…' }),
        chat
      );
      expect(getStreamState(chat)).toMatchObject({
        activeToolCall: 'weather',
        toolExecutionText: 'Checking…',
        isThinking: false,
      });

      handleWebsocketMessage(ev(T.tool_call_end, { runId: 't1' }), chat);
      expect(getStreamState(chat)).toMatchObject({ activeToolCall: null, toolExecutionText: '' });
    });

    it('runs the registered handler with the accumulated JSON arguments', () => {
      const weather = vi.fn();
      const tools = new CometChatAIAssistantTools({ weather });
      setAIAssistantTools(tools);
      expect(getAIAssistantTools()).toBe(tools);

      handleWebsocketMessage(ev(T.tool_call_start, { runId: 't2', toolName: 'weather' }), chat);
      handleWebsocketMessage(ev(T.tool_call_args, { runId: 't2', delta: '{"city":' }), chat);
      handleWebsocketMessage(ev(T.tool_call_args, { runId: 't2', delta: '"Paris"}' }), chat);
      expect(weather).not.toHaveBeenCalled();

      handleWebsocketMessage(ev(T.tool_call_end, { runId: 't2' }), chat);
      expect(weather).toHaveBeenCalledTimes(1);
      expect(weather).toHaveBeenCalledWith({ city: 'Paris' });
    });

    it('does not run the handler on malformed arguments, and still clears the indicator', () => {
      const weather = vi.fn();
      setAIAssistantTools(new CometChatAIAssistantTools({ weather }));
      handleWebsocketMessage(ev(T.tool_call_start, { runId: 't3', toolName: 'weather' }), chat);
      handleWebsocketMessage(ev(T.tool_call_args, { runId: 't3', delta: '{"city":' }), chat);
      expect(() => {
        handleWebsocketMessage(ev(T.tool_call_end, { runId: 't3' }), chat);
      }).not.toThrow();
      expect(weather).not.toHaveBeenCalled();
      expect(getStreamState(chat).activeToolCall).toBeNull();
    });

    it('a throwing handler does not break the stream', () => {
      setAIAssistantTools(
        new CometChatAIAssistantTools({
          boom: () => {
            throw new Error('handler failed');
          },
        })
      );
      handleWebsocketMessage(ev(T.tool_call_start, { runId: 't4', toolName: 'boom' }), chat);
      handleWebsocketMessage(ev(T.tool_call_args, { runId: 't4', delta: '{}' }), chat);
      handleWebsocketMessage(ev(T.tool_call_end, { runId: 't4' }), chat);
      handleWebsocketMessage(ev(T.run_finished), chat);
      expect(getStreamState(chat).isComplete).toBe(true);
    });

    it('ignores tools with no registered handler', () => {
      const weather = vi.fn();
      setAIAssistantTools(new CometChatAIAssistantTools({ weather }));
      handleWebsocketMessage(ev(T.tool_call_start, { runId: 't5', toolName: 'unknown' }), chat);
      handleWebsocketMessage(ev(T.tool_call_args, { runId: 't5', delta: '{}' }), chat);
      handleWebsocketMessage(ev(T.tool_call_end, { runId: 't5' }), chat);
      expect(weather).not.toHaveBeenCalled();
    });

    it('arguments are tracked per run, so a later call starts from empty args', () => {
      const echo = vi.fn();
      setAIAssistantTools(new CometChatAIAssistantTools({ echo }));
      handleWebsocketMessage(ev(T.tool_call_start, { runId: 't6', toolName: 'echo' }), chat);
      handleWebsocketMessage(ev(T.tool_call_args, { runId: 't6', delta: '{"n":1}' }), chat);
      handleWebsocketMessage(ev(T.tool_call_end, { runId: 't6' }), chat);
      handleWebsocketMessage(ev(T.tool_call_start, { runId: 't6', toolName: 'echo' }), chat);
      handleWebsocketMessage(ev(T.tool_call_args, { runId: 't6', delta: '{"n":2}' }), chat);
      handleWebsocketMessage(ev(T.tool_call_end, { runId: 't6' }), chat);
      expect(echo.mock.calls).toEqual([[{ n: 1 }], [{ n: 2 }]]);
    });

    it('tool_call_start without accessors still shows an (unnamed) tool', () => {
      const bare = {
        getType: () => T.tool_call_start,
        getMessageId: () => 't7',
      } as unknown as CometChat.AIAssistantBaseEvent;
      handleWebsocketMessage(bare, chat);
      expect(getStreamState(chat)).toMatchObject({ activeToolCall: '', toolExecutionText: '' });
    });
  });
});
