/**
 * Unit tests for CometChatMessageComposer.reducer.
 * Pure function tests — no mocking needed.
 */
import { describe, it, expect } from 'vitest';
import {
  composerReducer,
  initialComposerState,
  selectCanSend,
  type CometChatMessageComposerState,
} from '../CometChatMessageComposer.reducer';
import type { TrayItem } from '../CometChatMessageComposer.types';

function makeTrayItem(overrides: Partial<TrayItem> = {}): TrayItem {
  return {
    fileId: 'file-1',
    file: new File(['x'], 'x.bin'),
    kind: 'image',
    status: 'uploading',
    percent: 0,
    ...overrides,
  };
}

function makeTextMessage(id: number, text: string) {
  return {
    getId: () => id,
    getText: () => text,
    getType: () => 'text',
    getMetadata: () => ({}),
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.TextMessage;
}

function makeBaseMessage(id: number) {
  return {
    getId: () => id,
    getType: () => 'text',
    getCategory: () => 'message',
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
}

describe('composerReducer', () => {
  describe('initial state', () => {
    it('has empty text', () => {
      expect(initialComposerState.text).toBe('');
    });
    it('has null textMessageToEdit', () => {
      expect(initialComposerState.textMessageToEdit).toBeNull();
    });
    it('has null messageToReply', () => {
      expect(initialComposerState.messageToReply).toBeNull();
    });
    it('has contentToDisplay set to "none"', () => {
      expect(initialComposerState.contentToDisplay).toBe('none');
    });
    it('has sendState set to "idle"', () => {
      expect(initialComposerState.sendState).toBe('idle');
    });
    it('has isRecording set to false', () => {
      expect(initialComposerState.isRecording).toBe(false);
    });
    it('has isDraggingOver set to false', () => {
      expect(initialComposerState.isDraggingOver).toBe(false);
    });
    it('has error set to null', () => {
      expect(initialComposerState.error).toBeNull();
    });
  });

  describe('SET_TEXT', () => {
    it('updates text in state', () => {
      const state = composerReducer(initialComposerState, { type: 'SET_TEXT', text: 'Hello' });
      expect(state.text).toBe('Hello');
    });

    it('clears text when empty string is dispatched', () => {
      const withText: CometChatMessageComposerState = { ...initialComposerState, text: 'Hello' };
      const state = composerReducer(withText, { type: 'SET_TEXT', text: '' });
      expect(state.text).toBe('');
    });

    it('does not mutate other state fields', () => {
      const state = composerReducer(initialComposerState, { type: 'SET_TEXT', text: 'Hi' });
      expect(state.sendState).toBe(initialComposerState.sendState);
      expect(state.isRecording).toBe(initialComposerState.isRecording);
    });
  });

  describe('SET_SEND_STATE', () => {
    it('updates sendState to "sending"', () => {
      const state = composerReducer(initialComposerState, {
        type: 'SET_SEND_STATE',
        sendState: 'sending',
      });
      expect(state.sendState).toBe('sending');
    });

    it('updates sendState to "sent"', () => {
      const state = composerReducer(initialComposerState, {
        type: 'SET_SEND_STATE',
        sendState: 'sent',
      });
      expect(state.sendState).toBe('sent');
    });

    it('updates sendState to "error"', () => {
      const state = composerReducer(initialComposerState, {
        type: 'SET_SEND_STATE',
        sendState: 'error',
      });
      expect(state.sendState).toBe('error');
    });

    it('updates sendState back to "idle"', () => {
      const sending: CometChatMessageComposerState = {
        ...initialComposerState,
        sendState: 'sending',
      };
      const state = composerReducer(sending, { type: 'SET_SEND_STATE', sendState: 'idle' });
      expect(state.sendState).toBe('idle');
    });
  });

  describe('SET_EDIT_MESSAGE', () => {
    it('sets textMessageToEdit to the provided message', () => {
      const msg = makeTextMessage(1, 'Edit me');
      const state = composerReducer(initialComposerState, {
        type: 'SET_EDIT_MESSAGE',
        message: msg,
      });
      expect(state.textMessageToEdit).toBe(msg);
    });

    it('sets text from message.getText()', () => {
      const msg = makeTextMessage(1, 'Original text');
      const state = composerReducer(initialComposerState, {
        type: 'SET_EDIT_MESSAGE',
        message: msg,
      });
      expect(state.text).toBe('Original text');
    });

    it('clears messageToReply when entering edit mode', () => {
      const replyMsg = makeBaseMessage(5);
      const withReply: CometChatMessageComposerState = {
        ...initialComposerState,
        messageToReply: replyMsg,
      };
      const editMsg = makeTextMessage(1, 'Edit');
      const state = composerReducer(withReply, { type: 'SET_EDIT_MESSAGE', message: editMsg });
      expect(state.messageToReply).toBeNull();
    });

    it('clears textMessageToEdit when message is null', () => {
      const editMsg = makeTextMessage(1, 'Edit');
      const withEdit: CometChatMessageComposerState = {
        ...initialComposerState,
        textMessageToEdit: editMsg,
        text: 'Edit',
      };
      const state = composerReducer(withEdit, { type: 'SET_EDIT_MESSAGE', message: null });
      expect(state.textMessageToEdit).toBeNull();
    });
  });

  describe('SET_REPLY_MESSAGE', () => {
    it('sets messageToReply to the provided message', () => {
      const msg = makeBaseMessage(10);
      const state = composerReducer(initialComposerState, {
        type: 'SET_REPLY_MESSAGE',
        message: msg,
      });
      expect(state.messageToReply).toBe(msg);
    });

    it('clears textMessageToEdit when entering reply mode', () => {
      const editMsg = makeTextMessage(1, 'Edit');
      const withEdit: CometChatMessageComposerState = {
        ...initialComposerState,
        textMessageToEdit: editMsg,
      };
      const replyMsg = makeBaseMessage(10);
      const state = composerReducer(withEdit, { type: 'SET_REPLY_MESSAGE', message: replyMsg });
      expect(state.textMessageToEdit).toBeNull();
    });

    it('clears messageToReply when message is null', () => {
      const replyMsg = makeBaseMessage(10);
      const withReply: CometChatMessageComposerState = {
        ...initialComposerState,
        messageToReply: replyMsg,
      };
      const state = composerReducer(withReply, { type: 'SET_REPLY_MESSAGE', message: null });
      expect(state.messageToReply).toBeNull();
    });
  });

  describe('SET_CONTENT_TO_DISPLAY', () => {
    it('updates contentToDisplay to "attachments"', () => {
      const state = composerReducer(initialComposerState, {
        type: 'SET_CONTENT_TO_DISPLAY',
        content: 'attachments',
      });
      expect(state.contentToDisplay).toBe('attachments');
    });

    it('updates contentToDisplay to "emojiKeyboard"', () => {
      const state = composerReducer(initialComposerState, {
        type: 'SET_CONTENT_TO_DISPLAY',
        content: 'emojiKeyboard',
      });
      expect(state.contentToDisplay).toBe('emojiKeyboard');
    });

    it('updates contentToDisplay to "none"', () => {
      const withEmoji: CometChatMessageComposerState = {
        ...initialComposerState,
        contentToDisplay: 'emojiKeyboard',
      };
      const state = composerReducer(withEmoji, { type: 'SET_CONTENT_TO_DISPLAY', content: 'none' });
      expect(state.contentToDisplay).toBe('none');
    });
  });

  describe('SET_ERROR', () => {
    it('sets error message', () => {
      const state = composerReducer(initialComposerState, {
        type: 'SET_ERROR',
        error: 'Network error',
      });
      expect(state.error).toBe('Network error');
    });

    it('clears error when null is dispatched', () => {
      const withError: CometChatMessageComposerState = {
        ...initialComposerState,
        error: 'Some error',
      };
      const state = composerReducer(withError, { type: 'SET_ERROR', error: null });
      expect(state.error).toBeNull();
    });
  });

  describe('SET_RECORDING', () => {
    it('sets isRecording to true', () => {
      const state = composerReducer(initialComposerState, {
        type: 'SET_RECORDING',
        isRecording: true,
      });
      expect(state.isRecording).toBe(true);
    });

    it('sets isRecording to false', () => {
      const recording: CometChatMessageComposerState = {
        ...initialComposerState,
        isRecording: true,
      };
      const state = composerReducer(recording, { type: 'SET_RECORDING', isRecording: false });
      expect(state.isRecording).toBe(false);
    });
  });

  describe('SET_DRAGGING', () => {
    it('sets isDraggingOver to true', () => {
      const state = composerReducer(initialComposerState, {
        type: 'SET_DRAGGING',
        isDragging: true,
      });
      expect(state.isDraggingOver).toBe(true);
    });

    it('sets isDraggingOver to false', () => {
      const dragging: CometChatMessageComposerState = {
        ...initialComposerState,
        isDraggingOver: true,
      };
      const state = composerReducer(dragging, { type: 'SET_DRAGGING', isDragging: false });
      expect(state.isDraggingOver).toBe(false);
    });
  });

  describe('RESET', () => {
    it('resets state to initialComposerState', () => {
      const modified: CometChatMessageComposerState = {
        ...initialComposerState,
        text: 'Some text',
        sendState: 'error',
        isRecording: true,
        isDraggingOver: true,
        error: 'Some error',
        contentToDisplay: 'emojiKeyboard',
      };
      const state = composerReducer(modified, { type: 'RESET' });
      expect(state).toEqual(initialComposerState);
    });
  });

  describe('unknown action', () => {
    it('returns unchanged state for unknown action type', () => {
      const state = composerReducer(
        initialComposerState,
        // @ts-expect-error — intentionally testing unknown action
        { type: 'UNKNOWN_ACTION' }
      );
      expect(state).toBe(initialComposerState);
    });
  });

  describe('tray initial state', () => {
    it('starts with a null batchId and no items', () => {
      expect(initialComposerState.tray).toEqual({ batchId: null, items: [] });
    });
  });

  describe('TRAY_ADD', () => {
    it('appends items to an empty tray', () => {
      const item = makeTrayItem({ fileId: 'a' });
      const state = composerReducer(initialComposerState, { type: 'TRAY_ADD', items: [item] });
      expect(state.tray.items).toEqual([item]);
    });

    it('sets batchId when provided', () => {
      const state = composerReducer(initialComposerState, {
        type: 'TRAY_ADD',
        items: [makeTrayItem()],
        batchId: 'batch-1',
      });
      expect(state.tray.batchId).toBe('batch-1');
    });

    it('preserves existing batchId when batchId is omitted', () => {
      const withBatch: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem({ fileId: 'a' })] },
      };
      const state = composerReducer(withBatch, {
        type: 'TRAY_ADD',
        items: [makeTrayItem({ fileId: 'b' })],
      });
      expect(state.tray.batchId).toBe('batch-1');
    });

    it('appends new items after existing ones (attach order preserved)', () => {
      const withBatch: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem({ fileId: 'a' })] },
      };
      const state = composerReducer(withBatch, {
        type: 'TRAY_ADD',
        items: [makeTrayItem({ fileId: 'b' })],
      });
      expect(state.tray.items.map(i => i.fileId)).toEqual(['a', 'b']);
    });

    it('does not mutate the previous tray items array', () => {
      const withBatch: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem({ fileId: 'a' })] },
      };
      composerReducer(withBatch, { type: 'TRAY_ADD', items: [makeTrayItem({ fileId: 'b' })] });
      expect(withBatch.tray.items).toHaveLength(1);
    });
  });

  describe('TRAY_UPDATE_STATUS', () => {
    it('updates the status of the matching item only', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: {
          batchId: 'batch-1',
          items: [makeTrayItem({ fileId: 'a' }), makeTrayItem({ fileId: 'b' })],
        },
      };
      const next = composerReducer(state, {
        type: 'TRAY_UPDATE_STATUS',
        fileId: 'a',
        status: 'failed',
      });
      expect(next.tray.items[0].status).toBe('failed');
      expect(next.tray.items[1].status).toBe('uploading');
    });

    it('stores the error when provided', () => {
      const err = new Error('boom');
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem({ fileId: 'a' })] },
      };
      const next = composerReducer(state, {
        type: 'TRAY_UPDATE_STATUS',
        fileId: 'a',
        status: 'rejected',
        error: err,
      });
      expect(next.tray.items[0].error).toBe(err);
    });

    it('is a no-op when the fileId does not match', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem({ fileId: 'a' })] },
      };
      const next = composerReducer(state, {
        type: 'TRAY_UPDATE_STATUS',
        fileId: 'zzz',
        status: 'success',
      });
      expect(next.tray.items[0].status).toBe('uploading');
    });
  });

  describe('TRAY_UPDATE_PROGRESS', () => {
    it('updates percent for the matching item', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem({ fileId: 'a', percent: 0 })] },
      };
      const next = composerReducer(state, {
        type: 'TRAY_UPDATE_PROGRESS',
        fileId: 'a',
        percent: 42,
      });
      expect(next.tray.items[0].percent).toBe(42);
    });

    it('leaves other items unchanged', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: {
          batchId: 'batch-1',
          items: [
            makeTrayItem({ fileId: 'a', percent: 0 }),
            makeTrayItem({ fileId: 'b', percent: 10 }),
          ],
        },
      };
      const next = composerReducer(state, {
        type: 'TRAY_UPDATE_PROGRESS',
        fileId: 'a',
        percent: 90,
      });
      expect(next.tray.items[1].percent).toBe(10);
    });
  });

  describe('TRAY_SET_ATTACHMENT', () => {
    it('sets the attachment and marks the item success', () => {
      const attachment = {
        getUrl: () => 'https://x',
      } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.Attachment;
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem({ fileId: 'a' })] },
      };
      const next = composerReducer(state, {
        type: 'TRAY_SET_ATTACHMENT',
        fileId: 'a',
        attachment,
      });
      expect(next.tray.items[0].attachment).toBe(attachment);
      expect(next.tray.items[0].status).toBe('success');
    });
  });

  describe('TRAY_REMOVE', () => {
    it('removes the matching item', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: {
          batchId: 'batch-1',
          items: [makeTrayItem({ fileId: 'a' }), makeTrayItem({ fileId: 'b' })],
        },
      };
      const next = composerReducer(state, { type: 'TRAY_REMOVE', fileId: 'a' });
      expect(next.tray.items.map(i => i.fileId)).toEqual(['b']);
    });

    it('keeps the batchId when items remain after removal', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: {
          batchId: 'batch-1',
          items: [makeTrayItem({ fileId: 'a' }), makeTrayItem({ fileId: 'b' })],
        },
      };
      const next = composerReducer(state, { type: 'TRAY_REMOVE', fileId: 'a' });
      expect(next.tray.batchId).toBe('batch-1');
      expect(next.tray.items.map(i => i.fileId)).toEqual(['b']);
    });

    it('drops the batchId to null when the last item is removed', () => {
      // An emptied tray must not retain a batchId — otherwise the next upload
      // re-attaches to this (now fully cancelled) SDK group. Matches TRAY_CLEAR.
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem({ fileId: 'a' })] },
      };
      const next = composerReducer(state, { type: 'TRAY_REMOVE', fileId: 'a' });
      expect(next.tray).toEqual({ batchId: null, items: [] });
    });
  });

  describe('TRAY_CLEAR', () => {
    it('resets the tray to empty with a null batchId', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: {
          batchId: 'batch-1',
          items: [makeTrayItem({ fileId: 'a' }), makeTrayItem({ fileId: 'b' })],
        },
      };
      const next = composerReducer(state, { type: 'TRAY_CLEAR' });
      expect(next.tray).toEqual({ batchId: null, items: [] });
    });

    it('leaves non-tray state intact', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        text: 'hello',
        tray: { batchId: 'batch-1', items: [makeTrayItem()] },
      };
      const next = composerReducer(state, { type: 'TRAY_CLEAR' });
      expect(next.text).toBe('hello');
    });
  });

  describe('RESET clears the tray', () => {
    it('restores the empty tray slice', () => {
      const state: CometChatMessageComposerState = {
        ...initialComposerState,
        tray: { batchId: 'batch-1', items: [makeTrayItem()] },
      };
      const next = composerReducer(state, { type: 'RESET' });
      expect(next.tray).toEqual({ batchId: null, items: [] });
    });
  });

  describe('selectCanSend (derived)', () => {
    it('is false for an empty tray', () => {
      expect(selectCanSend({ batchId: null, items: [] })).toBe(false);
    });

    it('is true when all items are success', () => {
      const tray = {
        batchId: 'batch-1',
        items: [
          makeTrayItem({ fileId: 'a', status: 'success' }),
          makeTrayItem({ fileId: 'b', status: 'success' }),
        ],
      };
      expect(selectCanSend(tray)).toBe(true);
    });

    it('is false when any item is uploading', () => {
      const tray = {
        batchId: 'batch-1',
        items: [
          makeTrayItem({ fileId: 'a', status: 'success' }),
          makeTrayItem({ fileId: 'b', status: 'uploading' }),
        ],
      };
      expect(selectCanSend(tray)).toBe(false);
    });

    it('is false when any item is failed or rejected', () => {
      expect(
        selectCanSend({
          batchId: 'b',
          items: [
            makeTrayItem({ fileId: 'a', status: 'success' }),
            makeTrayItem({ fileId: 'b', status: 'failed' }),
          ],
        })
      ).toBe(false);
      expect(
        selectCanSend({
          batchId: 'b',
          items: [makeTrayItem({ fileId: 'a', status: 'rejected' })],
        })
      ).toBe(false);
    });
  });
});
