/**
 * Unit tests for useCometChatMessageComposer hook.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockCometChat } from '../../../testing/mock-sdk';
import { buildTextMessage } from '../../../testing/mock-builders';

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

vi.mock('../../../utils/wavConversion', () => ({
  convertToWav: vi.fn(),
}));

vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn() },
}));

import { useCometChatMessageComposer } from '../useCometChatMessageComposer';
import { CometChatSoundManager } from '../../../resources/CometChatSoundManager/CometChatSoundManager';
import * as ComposerManager from '../CometChatMessageComposerManager';
import { convertToWav } from '../../../utils/wavConversion';
import { CometChatLogger } from '../../../utils/CometChatLogger';

function makeUser(uid = 'user-1') {
  return {
    getUid: () => uid,
    getName: () => 'Test User',
    getStatus: () => 'online',
  } as unknown as CometChat.User;
}

function makeTextMessage(id: number, text: string) {
  return {
    getId: () => id,
    getText: () => text,
    getType: () => 'text',
    getMetadata: () => ({}),
  } as unknown as CometChat.TextMessage;
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

  // Compact composer mic <-> send swap (R8.5): the mic is visible only when there
  // is no text AND the tray is empty. A non-empty tray hides the mic (Send takes
  // its place); clearing the tray restores the mic because it is state-driven.
  describe('mic/send visibility (compact composer swap)', () => {
    type TrayItemInput = import('../CometChatMessageComposer.types').TrayItem;
    type TrayItemStatusInput = import('../CometChatMessageComposer.types').TrayItemStatus;

    function makeTrayItem(fileId: string, status: TrayItemStatusInput): TrayItemInput {
      return {
        fileId,
        file: {} as File,
        kind: 'image',
        status,
        percent: status === 'success' ? 100 : 0,
      };
    }

    it('shows the mic when the tray is empty and text is empty', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      expect(result.current.state.tray.items).toHaveLength(0);
      expect(result.current.showVoiceButton).toBe(true);
    });

    it('hides the mic when the tray is non-empty (Send takes its place)', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.dispatch({
          type: 'TRAY_ADD',
          items: [makeTrayItem('f1', 'uploading')],
          batchId: 'batch-1',
        });
      });
      expect(result.current.showVoiceButton).toBe(false);
    });

    it('keeps the mic hidden when text is present (existing behavior)', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.setText('Hello');
      });
      expect(result.current.state.tray.items).toHaveLength(0);
      expect(result.current.showVoiceButton).toBe(false);
    });

    it('restores the mic when the tray is cleared (clear-to-restore)', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.dispatch({
          type: 'TRAY_ADD',
          items: [makeTrayItem('f1', 'success')],
          batchId: 'batch-1',
        });
      });
      expect(result.current.showVoiceButton).toBe(false);
      act(() => {
        result.current.dispatch({ type: 'TRAY_CLEAR' });
      });
      expect(result.current.state.tray.items).toHaveLength(0);
      expect(result.current.showVoiceButton).toBe(true);
    });

    it('restores the mic when the last tray item is removed', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      act(() => {
        result.current.dispatch({
          type: 'TRAY_ADD',
          items: [makeTrayItem('f1', 'success')],
          batchId: 'batch-1',
        });
      });
      expect(result.current.showVoiceButton).toBe(false);
      act(() => {
        result.current.dispatch({ type: 'TRAY_REMOVE', fileId: 'f1' });
      });
      expect(result.current.showVoiceButton).toBe(true);
    });

    it('enables Send only when every tray item is success (all-or-nothing)', () => {
      const { result } = renderHook(() => useCometChatMessageComposer({}));
      // Mixed statuses -> Send disabled even with empty text.
      act(() => {
        result.current.dispatch({
          type: 'TRAY_ADD',
          items: [makeTrayItem('f1', 'success'), makeTrayItem('f2', 'uploading')],
          batchId: 'batch-1',
        });
      });
      expect(result.current.canSend).toBe(false);
      // All success -> Send enabled (tray gating overrides the empty-text rule).
      act(() => {
        result.current.dispatch({
          type: 'TRAY_SET_ATTACHMENT',
          fileId: 'f2',
          attachment: {} as CometChat.Attachment,
        });
      });
      expect(result.current.canSend).toBe(true);
    });
  });

  describe('sendBatch routing (regression: attachments must send)', () => {
    type TrayItemInput = import('../CometChatMessageComposer.types').TrayItem;

    function makeSuccessItem(fileId: string): TrayItemInput {
      return {
        fileId,
        file: new File([''], 'photo.jpg', { type: 'image/jpeg' }),
        kind: 'image',
        status: 'success',
        percent: 100,
        attachment: {
          getUrl: () => 'http://cdn/photo.jpg',
        } as unknown as CometChat.Attachment,
      };
    }

    it('sendBatch sends media messages when tray has items and user/SDK are available', async () => {
      // Setup SDK as initialized + logged-in
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue({
        getUid: () => 'u1',
        getName: () => 'User',
      });

      const { result } = renderHook(() =>
        useCometChatMessageComposer({ user: { getUid: () => 'u2' } as any })
      );

      // Stage a success item into the tray.
      act(() => {
        result.current.dispatch({
          type: 'TRAY_ADD',
          items: [makeSuccessItem('f1')],
          batchId: 'batch-send-test',
        });
      });

      expect(result.current.state.tray.items).toHaveLength(1);
      expect(result.current.canSend).toBe(true);

      // Call sendBatch — should call SDK sendMediaMessage.
      await act(async () => {
        await result.current.sendBatch();
      });

      expect(mockCometChat.sendMediaMessage).toHaveBeenCalled();
      // Tray should be cleared after send.
      expect(result.current.state.tray.items).toHaveLength(0);
    });

    it('sendBatch does NOT call sendMessage (text-only)', async () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue({
        getUid: () => 'u1',
        getName: () => 'User',
      });

      const { result } = renderHook(() =>
        useCometChatMessageComposer({ user: { getUid: () => 'u2' } as any })
      );

      act(() => {
        result.current.dispatch({
          type: 'TRAY_ADD',
          items: [makeSuccessItem('f1')],
          batchId: 'batch-txt-test',
        });
        result.current.setText('caption text');
      });

      await act(async () => {
        await result.current.sendBatch();
      });

      // sendMediaMessage is called (for the attachment), NOT sendMessage (text-only).
      expect(mockCometChat.sendMediaMessage).toHaveBeenCalled();
      expect(mockCometChat.sendMessage).not.toHaveBeenCalled();
    });
  });

  /**
   * The outgoing-message sound.
   *
   * `disableSoundForMessage` was accepted, forwarded here and never read — there was no sound call
   * in the send path at all, so the setting could not do anything and neither could the default.
   * Played on the ack, which is where v6 played it.
   */
  describe('outgoing message sound', () => {
    /* `CometChatSoundManager.play` here is a vi.fn() the module mock installed — these assertions
       read the spy, they never call the method, so the unbound-method rule does not apply. */
    /* eslint-disable @typescript-eslint/unbound-method */
    const sendAs = async (options: Parameters<typeof useCometChatMessageComposer>[0]) => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      mockCometChat.getLoggedinUser = vi.fn().mockResolvedValue(makeUser('user-1'));
      const { result } = renderHook(() =>
        useCometChatMessageComposer({ user: makeUser('user-1'), ...options })
      );
      act(() => {
        result.current.setText('Hello');
      });
      await act(async () => {
        await result.current.sendMessage();
      });
    };

    it('plays on a successful send by default', async () => {
      await sendAs({});
      expect(CometChatSoundManager.play).toHaveBeenCalledWith('outgoingMessage', undefined);
    });

    it('stays silent when disableSoundForMessage is set', async () => {
      await sendAs({ disableSoundForMessage: true });
      expect(CometChatSoundManager.play).not.toHaveBeenCalled();
    });

    it('uses customSoundForMessage when given', async () => {
      await sendAs({ customSoundForMessage: '/sounds/ping.wav' });
      expect(CometChatSoundManager.play).toHaveBeenCalledWith(
        'outgoingMessage',
        '/sounds/ping.wav'
      );
    });
    /* eslint-enable @typescript-eslint/unbound-method */
  });

  describe('sendMediaMessage (voice note)', () => {
    function sent(): { file: File; getMetadata: () => Record<string, unknown> } {
      return (mockCometChat.sendMediaMessage as ReturnType<typeof vi.fn>).mock.lastCall?.[0] as {
        file: File;
        getMetadata: () => Record<string, unknown>;
      };
    }

    const recording = () =>
      new File(['webm-audio'], 'voice-recording.wav', { type: 'audio/webm;codecs=opus' });
    const wav = new Blob(['wav-audio'], { type: 'audio/wav' });

    beforeEach(() => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
      vi.mocked(convertToWav).mockReset();
    });

    it('sends a voice note as WAV with its length in whole seconds, rounded down', async () => {
      vi.mocked(convertToWav).mockResolvedValue({ wav, durationSeconds: 3.75 });
      const { result } = renderHook(() => useCometChatMessageComposer({ user: makeUser() }));

      await act(async () => {
        await result.current.sendMediaMessage(recording(), 'audio', { isVoiceNote: true });
      });

      expect(sent().file.type).toBe('audio/wav');
      expect(sent().file.name).toBe('voice-recording.wav');
      expect(sent().getMetadata()).toMatchObject({
        audioType: 'voice_note',
        audioDuration: 3,
        fileName: 'voice-recording.wav',
        fileType: 'audio/wav',
        fileSize: wav.size,
      });
    });

    it.each(['note.webm', 'note'])(
      'names a converted voice note .wav when given %s',
      async name => {
        vi.mocked(convertToWav).mockResolvedValue({ wav, durationSeconds: 2 });
        const { result } = renderHook(() => useCometChatMessageComposer({ user: makeUser() }));

        await act(async () => {
          await result.current.sendMediaMessage(
            new File(['webm-audio'], name, { type: 'audio/webm' }),
            'audio',
            { isVoiceNote: true }
          );
        });

        expect(sent().file.name).toBe('note.wav');
        expect(sent().getMetadata()).toMatchObject({ fileName: 'note.wav', fileType: 'audio/wav' });
      }
    );

    it('stamps at least 1 second for a sub-second voice note', async () => {
      vi.mocked(convertToWav).mockResolvedValue({ wav, durationSeconds: 0.3 });
      const { result } = renderHook(() => useCometChatMessageComposer({ user: makeUser() }));

      await act(async () => {
        await result.current.sendMediaMessage(recording(), 'audio', { isVoiceNote: true });
      });

      expect(sent().getMetadata()).toMatchObject({ audioDuration: 1 });
    });

    it('sends the original recording, without a length, when conversion fails', async () => {
      const error = new Error('EncodingError');
      vi.mocked(convertToWav).mockRejectedValue(error);
      const warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
      const { result } = renderHook(() => useCometChatMessageComposer({ user: makeUser() }));

      await act(async () => {
        await result.current.sendMediaMessage(recording(), 'audio', { isVoiceNote: true });
      });

      expect(warn).toHaveBeenCalledWith('CometChatMessageComposer', expect.any(String), error);
      warn.mockRestore();
      expect(sent().file.type).toBe('audio/webm;codecs=opus');
      expect(sent().getMetadata()).toMatchObject({ audioType: 'voice_note' });
      expect(sent().getMetadata()).not.toHaveProperty('audioDuration');
    });

    it('clears the reply before converting, and the voice note still quotes it', async () => {
      let finishConversion: (value: { wav: Blob; durationSeconds: number }) => void = () =>
        undefined;
      vi.mocked(convertToWav).mockReturnValue(
        new Promise(resolve => {
          finishConversion = resolve;
        })
      );
      const reply = buildTextMessage({ id: 7 }) as unknown as CometChat.BaseMessage;
      const nextReply = buildTextMessage({ id: 8 }) as unknown as CometChat.BaseMessage;
      const { result, rerender } = renderHook(
        ({ messageToReply }) => useCometChatMessageComposer({ user: makeUser(), messageToReply }),
        { initialProps: { messageToReply: reply } }
      );

      let sending: Promise<void> = Promise.resolve();
      act(() => {
        sending = result.current.sendMediaMessage(recording(), 'audio', { isVoiceNote: true });
      });
      expect(result.current.state.messageToReply).toBeNull();

      // A new reply picked while the voice note converts stays in the composer.
      rerender({ messageToReply: nextReply });
      await act(async () => {
        finishConversion({ wav, durationSeconds: 2 });
        await sending;
      });

      expect(result.current.state.messageToReply).toBe(nextReply);
      expect((sent() as unknown as { quotedMessageId: number }).quotedMessageId).toBe(7);
    });

    it('does not convert audio that is not a voice note', async () => {
      const { result } = renderHook(() => useCometChatMessageComposer({ user: makeUser() }));
      const song = new File(['mp3-audio'], 'song.mp3', { type: 'audio/mpeg' });

      await act(async () => {
        await result.current.sendMediaMessage(song, 'audio');
      });

      expect(convertToWav).not.toHaveBeenCalled();
      expect(sent().file.type).toBe('audio/mpeg');
      expect(sent().getMetadata()).not.toHaveProperty('audioDuration');
    });
  });
});
