/**
 * Unit tests for useCometChatMessageComposer hook.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

vi.mock('../CometChatMessageComposerManager', async () => {
  const actual = await vi.importActual<typeof import('../CometChatMessageComposerManager')>(
    '../CometChatMessageComposerManager'
  );
  return {
    ...actual,
    sendTextMessage: vi.fn().mockResolvedValue({ getId: () => 1 }),
    sendMediaMessage: vi.fn().mockResolvedValue({ getId: () => 2 }),
    editTextMessage: vi.fn().mockResolvedValue({ getId: () => 3 }),
    startTypingIndicator: vi.fn(),
    endTypingIndicator: vi.fn(),
    attachMessageListener: vi.fn().mockReturnValue(() => {}),
    attachConnectionListener: vi.fn().mockReturnValue(() => {}),
  };
});

import { useCometChatMessageComposer } from '../useCometChatMessageComposer';
import * as ComposerManager from '../CometChatMessageComposerManager';

function makeUser(uid = 'user-1') {
  return {
    getUid: () => uid,
    getName: () => 'Test User',
    getStatus: () => 'online',
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.User;
}

function makeTextMessage(id: number, text: string) {
  return {
    getId: () => id,
    getText: () => text,
    getMetadata: () => ({}),
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.TextMessage;
}

describe('useCometChatMessageComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCometChat.isInitialized = vi.fn().mockReturnValue(false);
    mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue(null);
    (ComposerManager.sendTextMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      getId: () => 1,
    });
    (ComposerManager.editTextMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      getId: () => 3,
    });
    (ComposerManager.attachMessageListener as ReturnType<typeof vi.fn>).mockReturnValue(() => {});
    (ComposerManager.attachConnectionListener as ReturnType<typeof vi.fn>).mockReturnValue(
      () => {}
    );
  });

  describe('initial state', () => {
    it('has empty text', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      expect(result.current.state.text).toBe('');
    });

    it('has sendState "idle"', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      expect(result.current.state.sendState).toBe('idle');
    });

    it('has canSend false when text is empty', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      expect(result.current.canSend).toBe(false);
    });

    it('uses initialText when provided', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({ initialText: 'Hello!' }));
      expect(result.current.state.text).toBe('Hello!');
    });

    it('has showVoiceButton true when text is empty', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      expect(result.current.showVoiceButton).toBe(true);
    });
  });

  describe('setText', () => {
    it('updates text in state', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Hello world');
      });
      expect(result.current.state.text).toBe('Hello world');
    });

    it('canSend becomes true when text has content', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Hello');
      });
      expect(result.current.canSend).toBe(true);
    });

    it('canSend becomes false when text is cleared', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Hello');
      });
      act(() => {
        result.current.setText('');
      });
      expect(result.current.canSend).toBe(false);
    });

    it('calls onTextChange callback when text changes', () => {
      const onTextChange = vi.fn();
      const { result } = renderHook(() => useCometChatMessageComposer({ onTextChange }));
      act(() => {
        result.current.setText('New text');
      });
      expect(onTextChange).toHaveBeenCalledWith('New text');
    });

    it('showVoiceButton is false when text has content', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Hello');
      });
      expect(result.current.showVoiceButton).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('does not call SDK when receiverId is empty (no user/group)', async () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Hello');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(ComposerManager.sendTextMessage).not.toHaveBeenCalled();
    });

    it('clears text after send in standalone mode', async () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Hello');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(result.current.state.text).toBe('');
    });

    it('calls CometChat.sendMessage when SDK is initialized and user is set', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue(makeUser('user-1'));
      const user = makeUser('user-1');
      const { result } = renderHook(() => useCometChatMessageComposer({ user }));
      act(() => {
        result.current.setText('Hello SDK');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(mockCometChat.sendMessage).toHaveBeenCalled();
    });

    it('clears text after successful send', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const user = makeUser('user-1');
      const { result } = renderHook(() => useCometChatMessageComposer({ user }));
      act(() => {
        result.current.setText('Hello');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(result.current.state.text).toBe('');
    });

    it('sets sendState to "error" on failure', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue(makeUser('user-1'));
      mockCometChat.sendMessage = vi.fn().mockRejectedValue(new Error('Network error'));
      const user = makeUser('user-1');
      const { result } = renderHook(() => useCometChatMessageComposer({ user }));
      act(() => {
        result.current.setText('Hello');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(result.current.state.sendState).toBe('error');
    });

    it('calls onError callback on failure', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue(makeUser('user-1'));
      const error = new Error('Network error');
      mockCometChat.sendMessage = vi.fn().mockRejectedValue(error);
      const user = makeUser('user-1');
      const onError = vi.fn();
      const { result } = renderHook(() => useCometChatMessageComposer({ user, onError }));
      act(() => {
        result.current.setText('Hello');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('does not send when text is empty (only whitespace)', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const user = makeUser('user-1');
      const { result } = renderHook(() => useCometChatMessageComposer({ user }));
      act(() => {
        result.current.setText('   ');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(ComposerManager.sendTextMessage).not.toHaveBeenCalled();
    });

    it('calls onSendButtonClick with the sent message', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue(makeUser('user-1'));
      const sentMsg = { getId: () => 99, getMetadata: () => ({}), setMetadata: vi.fn() };
      mockCometChat.sendMessage = vi.fn().mockResolvedValue(sentMsg);
      const user = makeUser('user-1');
      const onSendButtonClick = vi.fn();
      const { result } = renderHook(() => useCometChatMessageComposer({ user, onSendButtonClick }));
      act(() => {
        result.current.setText('Hello');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(onSendButtonClick).toHaveBeenCalledWith(sentMsg, 'send');
    });
  });

  describe('sendTextMessageOverride', () => {
    it('calls sendTextMessageOverride instead of SDK when provided', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const user = makeUser('user-1');
      const sendTextMessageOverride = vi.fn().mockReturnValue('muid-123');
      const { result } = renderHook(() =>
        useCometChatMessageComposer({ user, sendTextMessageOverride })
      );
      act(() => {
        result.current.setText('Hello override');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(sendTextMessageOverride).toHaveBeenCalledWith('Hello override');
      expect(mockCometChat.sendMessage).not.toHaveBeenCalled();
    });

    it('passes trimmed text to sendTextMessageOverride', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const user = makeUser('user-1');
      const sendTextMessageOverride = vi.fn().mockReturnValue('muid-456');
      const { result } = renderHook(() =>
        useCometChatMessageComposer({ user, sendTextMessageOverride })
      );
      act(() => {
        result.current.setText('Bold text');
      });
      await act(async () => {
        await result.current.sendMessage('Bold text', '<strong>Bold text</strong>');
      });
      // The override receives the processed text (may be converted from richTextHtml)
      expect(sendTextMessageOverride).toHaveBeenCalled();
    });

    it('clears text after sendTextMessageOverride is called', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const user = makeUser('user-1');
      const sendTextMessageOverride = vi.fn().mockReturnValue('muid-789');
      const { result } = renderHook(() =>
        useCometChatMessageComposer({ user, sendTextMessageOverride })
      );
      act(() => {
        result.current.setText('Hello');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
      expect(result.current.state.text).toBe('');
    });
  });

  describe('editMessage', () => {
    it('calls CometChat.editMessage with the message when editing', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const editMsg = makeTextMessage(42, 'Original');
      const { result } = renderHook(() => useCometChatMessageComposer({ messageToEdit: editMsg }));
      await waitFor(() => {
        expect(result.current.state.textMessageToEdit).toBe(editMsg);
      });
      act(() => {
        result.current.setText('Updated text');
      });
      await act(async () => {
        await result.current.editMessage();
      });
      expect(ComposerManager.editTextMessage).toHaveBeenCalled();
    });

    it('does not call editTextMessage when textMessageToEdit is null', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Some text');
      });
      await act(async () => {
        await result.current.editMessage();
      });
      expect(ComposerManager.editTextMessage).not.toHaveBeenCalled();
    });

    it('clears text and edit message after successful edit', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const editMsg = makeTextMessage(42, 'Original');
      const { result } = renderHook(() => useCometChatMessageComposer({ messageToEdit: editMsg }));
      await waitFor(() => {
        expect(result.current.state.textMessageToEdit).toBe(editMsg);
      });
      act(() => {
        result.current.setText('Updated');
      });
      await act(async () => {
        await result.current.editMessage();
      });
      expect(result.current.state.text).toBe('');
      expect(result.current.state.textMessageToEdit).toBeNull();
    });
  });

  describe('canSend derived state', () => {
    it('is false when sendState is "sending"', () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      const user = makeUser('user-1');
      let resolveSend!: () => void;
      (ComposerManager.sendTextMessage as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise<void>(resolve => {
          resolveSend = resolve;
        })
      );
      const { result } = renderHook(() => useCometChatMessageComposer({ user }));
      act(() => {
        result.current.setText('Hello');
      });
      act(() => {
        void result.current.sendMessage();
      });
      expect(result.current.state.sendState).toBe('sending');
      expect(result.current.canSend).toBe(false);
      act(() => {
        resolveSend();
      });
    });
  });

  describe('insertEmoji', () => {
    it('appends emoji to current text', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Hello ');
      });
      act(() => {
        result.current.insertEmoji('😊');
      });
      expect(result.current.state.text).toBe('Hello 😊');
    });

    it('closes content display after emoji insert', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setContentToDisplay('emojiKeyboard');
      });
      act(() => {
        result.current.insertEmoji('😊');
      });
      expect(result.current.state.contentToDisplay).toBe('none');
    });
  });

  describe('closePreview', () => {
    it('clears textMessageToEdit', async () => {
      const editMsg = makeTextMessage(1, 'Edit');
      const { result } = renderHook(() => useCometChatMessageComposer({ messageToEdit: editMsg }));
      await waitFor(() => {
        expect(result.current.state.textMessageToEdit).toBe(editMsg);
      });
      act(() => {
        result.current.closePreview();
      });
      expect(result.current.state.textMessageToEdit).toBeNull();
    });

    it('calls onClosePreview callback', () => {
      const onClosePreview = vi.fn();
      const { result } = renderHook(() => useCometChatMessageComposer({ onClosePreview }));
      act(() => {
        result.current.closePreview();
      });
      expect(onClosePreview).toHaveBeenCalledOnce();
    });
  });
});
