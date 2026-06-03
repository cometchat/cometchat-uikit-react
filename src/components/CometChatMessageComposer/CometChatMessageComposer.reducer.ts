import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatComposerSendState,
  CometChatComposerContentToDisplay,
} from './CometChatMessageComposer.types';

/** State for the CometChatMessageComposer component. */
export interface CometChatMessageComposerState {
  /** Current text in the input. */
  text: string;
  /** Message being edited (null when not in edit mode). */
  textMessageToEdit: CometChat.TextMessage | null;
  /** Message being replied to (null when not in reply mode). */
  messageToReply: CometChat.BaseMessage | null;
  /** Which overlay content is currently displayed. */
  contentToDisplay: CometChatComposerContentToDisplay;
  /** Send lifecycle state. */
  sendState: CometChatComposerSendState;
  /** Whether voice recording is active. */
  isRecording: boolean;
  /** Whether a file is being dragged over the composer. */
  isDraggingOver: boolean;
  /** Whether the mentions count warning is shown. */
  showMentionsCountWarning: boolean;
  /** Whether a validation error is shown. */
  showValidationError: boolean;
  /** Validation error text key (for localization). */
  validationErrorText: string | null;
  /** Whether the content has been modified from the original while in edit mode (includes formatting changes). */
  isEditDirty: boolean;
  /** Error message (null when no error). */
  error: string | null;
}

/** Actions for the message composer reducer. */
export type CometChatMessageComposerAction =
  | { type: 'SET_TEXT'; text: string }
  | { type: 'SET_EDIT_MESSAGE'; message: CometChat.TextMessage | null }
  | { type: 'SET_REPLY_MESSAGE'; message: CometChat.BaseMessage | null }
  | { type: 'SET_CONTENT_TO_DISPLAY'; content: CometChatComposerContentToDisplay }
  | { type: 'SET_SEND_STATE'; sendState: CometChatComposerSendState }
  | { type: 'SET_RECORDING'; isRecording: boolean }
  | { type: 'SET_DRAGGING'; isDragging: boolean }
  | { type: 'SET_MENTIONS_WARNING'; show: boolean }
  | { type: 'SET_VALIDATION_ERROR'; show: boolean; text?: string | null }
  | { type: 'SET_EDIT_DIRTY'; isDirty: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

export const initialComposerState: CometChatMessageComposerState = {
  text: '',
  textMessageToEdit: null,
  messageToReply: null,
  contentToDisplay: 'none',
  sendState: 'idle',
  isRecording: false,
  isDraggingOver: false,
  showMentionsCountWarning: false,
  showValidationError: false,
  validationErrorText: null,
  isEditDirty: false,
  error: null,
};

/** Reducer for CometChatMessageComposer state. Pure function — no side effects. */
export function composerReducer(
  state: CometChatMessageComposerState,
  action: CometChatMessageComposerAction
): CometChatMessageComposerState {
  switch (action.type) {
    case 'SET_TEXT':
      return { ...state, text: action.text };

    case 'SET_EDIT_MESSAGE':
      // Entering edit mode clears reply mode
      return {
        ...state,
        textMessageToEdit: action.message,
        messageToReply: action.message ? null : state.messageToReply,
        text: action.message ? action.message.getText() : state.text,
        isEditDirty: false,
      };

    case 'SET_REPLY_MESSAGE':
      // Entering reply mode clears edit mode
      return {
        ...state,
        messageToReply: action.message,
        textMessageToEdit: action.message ? null : state.textMessageToEdit,
      };

    case 'SET_CONTENT_TO_DISPLAY':
      return { ...state, contentToDisplay: action.content };

    case 'SET_SEND_STATE':
      return { ...state, sendState: action.sendState };

    case 'SET_RECORDING':
      return { ...state, isRecording: action.isRecording };

    case 'SET_DRAGGING':
      return { ...state, isDraggingOver: action.isDragging };

    case 'SET_MENTIONS_WARNING':
      return { ...state, showMentionsCountWarning: action.show };

    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        showValidationError: action.show,
        validationErrorText: action.text ?? null,
      };

    case 'SET_EDIT_DIRTY':
      return { ...state, isEditDirty: action.isDirty };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'RESET':
      return initialComposerState;

    default:
      return state;
  }
}
