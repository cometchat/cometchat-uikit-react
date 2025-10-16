import { Subject, of, BehaviorSubject, Subscription } from 'rxjs';
import { concatMap, delay, tap } from 'rxjs/operators';
import { CometChatUIKitConstants } from '../constants/CometChatUIKitConstants';
import { CometChatAIAssistantTools } from '../modals/CometChatAIAssistantTools';

/**
 * Interface representing streaming message data that contains both the original message event
 * and the accumulated streamed text content that has been processed so far.
 */
export interface IStreamData {
  message:CometChat.AIAssistantBaseEvent,
  streamedMessages?: string;

}
/**
 * RxJS subjects for managing message streaming
 */
const messageSubject = new Subject<IStreamData>();
const messageQueue = new Subject<CometChat.AIAssistantBaseEvent>();

/**
 * Subscription for the message processing pipeline
 */
let subscription: Subscription | null;

/**
 * Storage for accumulated content by message ID during streaming
 */
let streamedMessages: { [messageId: string]: string } = {};

/**
 * Configurable typing speed delay for text message content chunks
 */
let streamSpeed = 30;

let toolKitActions: CometChatAIAssistantTools;

/**
 * BehaviorSubject to track streaming state
 */
const streamingStateSubject = new BehaviorSubject<boolean>(false);

/**
 * Observable stream for streaming state changes
 */
export const streamingState$ = streamingStateSubject.asObservable();

/**
 * Observable stream for message updates
 */
export const messageStream = messageSubject.asObservable();
const toolEventsMap = [
  CometChatUIKitConstants.streamMessageTypes.tool_call_args,
  CometChatUIKitConstants.streamMessageTypes.tool_call_end,
  CometChatUIKitConstants.streamMessageTypes.tool_call_result,
  CometChatUIKitConstants.streamMessageTypes.tool_call_start
]

/**
 * Initializes the message processing pipeline with configurable delays
 * Processes messages sequentially with appropriate timing delays for different message types
 */
const initializeMessageProcessor = () => {
  if (subscription) {
    subscription.unsubscribe();
  }
  subscription = messageQueue.pipe(
    concatMap((msg: CometChat.AIAssistantBaseEvent) => {
      let delayTime = 0;

      // Configure delays based on message type for realistic streaming experience
      if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.run_started) {
        delayTime = 0; // Thinking delay before response begins
      }
      // Configure delays based on message type for realistic streaming experience
      else if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.tool_call_args) {
        delayTime = 500;
      }
      else if (toolEventsMap.includes(msg.getType())) {
        delayTime = 100;
      }
      else if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.text_message_start) {
        delayTime = 0;
      }
      else if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.text_message_content) {
        delayTime = streamSpeed;
      } else if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.run_finished) {
        streamingStateSubject.next(false);
      }

      return of(msg).pipe(
        delay(delayTime),
        tap(() => processMessage(msg))
      );
    })
  ).subscribe();
};

// Initialize the processor on service load
initializeMessageProcessor();

/**
 * Starts a new streaming message session
 * Resets accumulated content and initializes the message processor
 */
export const startStreamingMessage = () => {
  streamedMessages = {};
  initializeMessageProcessor();
  streamingStateSubject.next(true);
};

/**
 * Handles incoming websocket messages by adding them to the processing queue
 * @param msg - The message update to process
 */
export const handleWebsocketMessage = (msg: CometChat.AIAssistantBaseEvent) => {
  messageQueue.next(msg);
};

/**
 * Processes individual messages based on their type and manages content accumulation
 * @param msg - The message update to process
 */
const processMessage = (msg: CometChat.AIAssistantBaseEvent) => {
  // Handle different message types for streaming workflow
  if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.run_started) {
    streamedMessages[msg.getMessageId()] = '';
    messageSubject.next({message:msg});
  }
  if (toolEventsMap.includes(msg.getType())) {
    streamedMessages[msg.getMessageId()] = '';
    messageSubject.next({ message: msg });
  }
  else if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.text_message_start) {
    streamedMessages[msg.getMessageId()] = '';
    messageSubject.next({message:msg});
  } else if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.text_message_content) {
    // Accumulate content deltas for streaming text display
    if (!streamedMessages[msg.getMessageId()]) {
      streamedMessages[msg.getMessageId()] = '';
    }
    streamedMessages[msg.getMessageId()] += (msg as CometChat.AIAssistantContentReceivedEvent).getDelta() || '';

    // Emit message with accumulated content for real-time display
    const streamingMessage = {
      message:msg,
      streamedMessages: streamedMessages[msg.getMessageId()]
    };
    messageSubject.next(streamingMessage);
  } else if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.text_message_end) {
    messageSubject.next({
      message:msg,
      streamedMessages: streamedMessages[msg.getMessageId()] || ''
    });
  } else if (msg.getType() === CometChatUIKitConstants.streamMessageTypes.run_finished) {
    messageSubject.next({
      message:msg,
      streamedMessages: streamedMessages[msg.getMessageId()] || ''
    });
  }
};

/**
 * Sets the typing speed delay for text message content chunks
 * @param delay - The delay in milliseconds between text content chunks (default: 80ms)
 */
export const setStreamSpeed = (delay: number) => {
  if (delay !== streamSpeed) {
     streamSpeed = delay;

  }

};

/**
 * Gets the current typing speed delay for text message content chunks
 * @returns The current delay in milliseconds
 */
export const getStreamSpeed = (): number => {
  return streamSpeed;
};
export const getAIAssistantTools = (): CometChatAIAssistantTools => {
   return toolKitActions;
};
export const setAIAssistantTools = (actions:CometChatAIAssistantTools): void => {
  toolKitActions = actions;
};

/**
 * Stops the streaming message session and cleans up resources
 * Unsubscribes from the message processor and resets accumulated content
 */
export const stopStreamingMessage = () => {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
  streamedMessages = {};
  streamingStateSubject.next(false);
};

export const emitStreamingState = (state: boolean) => {
  streamingStateSubject.next(state);
};