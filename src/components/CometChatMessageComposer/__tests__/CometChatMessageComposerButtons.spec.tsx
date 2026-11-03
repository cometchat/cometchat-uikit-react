/**
 * Unit tests for the composer's sticker, emoji and voice buttons: toggling their
 * panels, what each does with a selection, and the sticker send flow (optimistic
 * publish, thread / reply wiring, success and failure).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';

const mocks = vi.hoisted(() => ({
  ctx: {} as Record<string, unknown>,
  publish: vi.fn(),
}));

vi.mock('../CometChatMessageComposer.context', () => ({
  useCometChatMessageComposerContext: () => mocks.ctx,
}));
vi.mock('../../../hooks/usePublishEvent', () => ({ usePublishEvent: () => mocks.publish }));
vi.mock('../../CometChatStickersKeyboard/CometChatStickersKeyboard', () => ({
  CometChatStickersKeyboard: ({ onStickerClick }: { onStickerClick: (e: unknown) => void }) => (
    <button type="button" onClick={() => onStickerClick({ stickerUrl: 'https://x.test/cat.png', stickerName: 'cat' })}>
      pick sticker
    </button>
  ),
}));
vi.mock('../../base/CometChatEmojiKeyboard', () => ({
  CometChatEmojiKeyboard: ({ onEmojiClick }: { onEmojiClick: (e: string) => void }) => (
    <button type="button" onClick={() => onEmojiClick('😀')}>
      pick emoji
    </button>
  ),
}));

import { CometChatMessageComposerStickerButton } from '../CometChatMessageComposerStickerButton';
import { CometChatMessageComposerEmojiButton } from '../CometChatMessageComposerEmojiButton';
import { CometChatMessageComposerVoiceButton } from '../CometChatMessageComposerVoiceButton';
import { CometChatMessageStatus } from '../../../context/CometChatEvents.types';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';

const withLocale = (ui: React.ReactElement) => render(<LocaleProvider>{ui}</LocaleProvider>);

function setCtx(overrides: Record<string, unknown> = {}) {
  mocks.ctx = {
    contentToDisplay: 'none',
    setContentToDisplay: vi.fn(),
    user: { getUid: () => 'bob' },
    group: undefined,
    parentMessageId: undefined,
    messageToReply: null,
    closePreview: vi.fn(),
    onError: vi.fn(),
    isInEditMode: false,
    playOutgoingSound: vi.fn(),
    insertEmoji: vi.fn(),
    isRecording: false,
    setRecording: vi.fn(),
    showVoiceButton: true,
    ...overrides,
  };
}

const ctxFn = (name: string) => mocks.ctx[name] as ReturnType<typeof vi.fn>;
const sentStatuses = () => mocks.publish.mock.calls.map(c => (c[0] as { status: string }).status);

describe('CometChatMessageComposerStickerButton', () => {
  let send: MockInstance<typeof CometChat.sendCustomMessage>;
  let initialized: MockInstance<typeof CometChat.isInitialized>;

  beforeEach(() => {
    vi.clearAllMocks();
    setCtx();
    initialized = vi.spyOn(CometChat, 'isInitialized').mockReturnValue(true);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue({ getUid: () => 'me' } as never);
    send = vi.spyOn(CometChat, 'sendCustomMessage').mockImplementation(m => Promise.resolve(m));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const button = () => screen.getByRole('button', { name: 'Sticker' });
  const sentMessage = () => send.mock.calls[0]![0];

  it('toggles the sticker keyboard', () => {
    withLocale(<CometChatMessageComposerStickerButton />);
    expect(button()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button());
    expect(ctxFn('setContentToDisplay')).toHaveBeenCalledWith('stickers');
  });

  it('closes the keyboard when it is already open', () => {
    setCtx({ contentToDisplay: 'stickers' });
    withLocale(<CometChatMessageComposerStickerButton />);
    expect(button()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(button());
    expect(ctxFn('setContentToDisplay')).toHaveBeenCalledWith('none');
  });

  it('is disabled while editing a message', () => {
    setCtx({ isInEditMode: true });
    withLocale(<CometChatMessageComposerStickerButton />);
    expect(button()).toBeDisabled();
  });

  it('sends the picked sticker to a user: optimistic first, then confirmed with a sound', async () => {
    setCtx({ contentToDisplay: 'stickers' });
    withLocale(<CometChatMessageComposerStickerButton />);
    fireEvent.click(screen.getByText('pick sticker'));

    expect(ctxFn('setContentToDisplay')).toHaveBeenCalledWith('none');
    await waitFor(() => expect(sentStatuses()).toEqual([CometChatMessageStatus.inprogress, CometChatMessageStatus.success]));
    const msg = sentMessage();
    expect(msg.getType()).toBe('extension_sticker');
    expect(msg.getReceiverId()).toBe('bob');
    expect(msg.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.USER);
    expect(msg.getCustomData()).toEqual({ sticker_url: 'https://x.test/cat.png', sticker_name: 'cat' });
    expect(msg.getMuid()).toMatch(/^_/);
    expect(ctxFn('playOutgoingSound')).toHaveBeenCalled();
    expect(ctxFn('closePreview')).not.toHaveBeenCalled();
  });

  it('in a group thread, sets the parent; when replying, quotes and then closes the reply preview', async () => {
    const quoted = { getId: () => 5 };
    setCtx({
      contentToDisplay: 'stickers',
      user: undefined,
      group: { getGuid: () => 'g1' },
      parentMessageId: 77,
      messageToReply: quoted,
    });
    withLocale(<CometChatMessageComposerStickerButton />);
    fireEvent.click(screen.getByText('pick sticker'));

    await waitFor(() => expect(ctxFn('closePreview')).toHaveBeenCalled());
    const msg = sentMessage();
    expect(msg.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
    expect(msg.getParentMessageId()).toBe(77);
    expect((msg as unknown as { getQuotedMessage: () => unknown }).getQuotedMessage()).toBe(quoted);
  });

  it('sends nothing without a receiver or before the SDK is initialised', () => {
    setCtx({ contentToDisplay: 'stickers', user: undefined });
    const { unmount } = withLocale(<CometChatMessageComposerStickerButton />);
    fireEvent.click(screen.getByText('pick sticker'));
    unmount();

    setCtx({ contentToDisplay: 'stickers' });
    initialized.mockReturnValue(false);
    withLocale(<CometChatMessageComposerStickerButton />);
    fireEvent.click(screen.getByText('pick sticker'));

    expect(send).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  it('reports a failed send', async () => {
    send.mockRejectedValue({ code: 'ERR_BLOCKED' });
    setCtx({ contentToDisplay: 'stickers' });
    withLocale(<CometChatMessageComposerStickerButton />);
    fireEvent.click(screen.getByText('pick sticker'));
    await waitFor(() => expect(ctxFn('onError')).toHaveBeenCalledWith({ code: 'ERR_BLOCKED' }));
    expect(ctxFn('playOutgoingSound')).not.toHaveBeenCalled();
  });

  // Known issue: a failed sticker send never publishes an error status (text and media sends
  // do), so the optimistic sticker stays "sending" in the list with no failed state.
  it.fails('a failed send marks the optimistic sticker as failed', async () => {
    send.mockRejectedValue({ code: 'ERR_BLOCKED' });
    setCtx({ contentToDisplay: 'stickers' });
    withLocale(<CometChatMessageComposerStickerButton />);
    fireEvent.click(screen.getByText('pick sticker'));
    await waitFor(() => expect(ctxFn('onError')).toHaveBeenCalled());
    expect(sentStatuses()).toEqual([CometChatMessageStatus.inprogress, CometChatMessageStatus.error]);
  });
});

describe('CometChatMessageComposerEmojiButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCtx();
  });

  const button = () => document.querySelector<HTMLButtonElement>('.cometchat-message-composer__emoji-button')!;

  it('toggles the emoji keyboard', () => {
    withLocale(<CometChatMessageComposerEmojiButton />);
    expect(button()).toHaveAttribute('aria-haspopup', 'dialog');
    fireEvent.click(button());
    expect(ctxFn('setContentToDisplay')).toHaveBeenCalledWith('emojiKeyboard');
  });

  it('inserts the picked emoji and returns focus to the end of the input', () => {
    setCtx({ contentToDisplay: 'emojiKeyboard' });
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => frames.push(cb));
    const input = document.createElement('div');
    input.setAttribute('role', 'textbox');
    input.setAttribute('contenteditable', 'true');
    input.tabIndex = 0;
    input.textContent = 'hi ';
    document.body.appendChild(input);

    withLocale(<CometChatMessageComposerEmojiButton />);
    expect(button()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByText('pick emoji'));

    expect(ctxFn('insertEmoji')).toHaveBeenCalledWith('😀');
    // Focus moves on the next frame, after the popover has restored its own focus.
    frames.forEach(frame => frame(0));
    expect(document.activeElement).toBe(input);
    const range = window.getSelection()!.getRangeAt(0);
    expect(range.collapsed).toBe(true);
    expect(range.startContainer).toBe(input);
    expect(range.startOffset).toBe(input.childNodes.length);
    input.remove();
  });
});

describe('CometChatMessageComposerVoiceButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCtx();
  });

  const button = () => screen.getByRole('button');

  it('starts recording and shows the recorder', () => {
    withLocale(<CometChatMessageComposerVoiceButton />);
    fireEvent.click(button());
    expect(ctxFn('setRecording')).toHaveBeenCalledWith(true);
    expect(ctxFn('setContentToDisplay')).toHaveBeenCalledWith('voiceRecording');
  });

  it('is replaced by the recorder while recording', () => {
    setCtx({ isRecording: true });
    const { container } = withLocale(<CometChatMessageComposerVoiceButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is hidden from keyboard and screen readers when there is text to send', () => {
    setCtx({ showVoiceButton: false });
    withLocale(<CometChatMessageComposerVoiceButton />);
    const btn = screen.getByRole('button', { hidden: true });
    expect(btn).toHaveAttribute('tabindex', '-1');
    expect(btn).toHaveAttribute('aria-hidden', 'true');
    expect(btn).toHaveClass('cometchat-message-composer__voice-button--hidden');
  });

  it('Enter starts recording', () => {
    withLocale(<CometChatMessageComposerVoiceButton />);
    fireEvent.keyDown(button(), { key: 'Enter' });
    expect(ctxFn('setRecording')).toHaveBeenCalledWith(true);
  });

  // Known issue: onKeyDown prevents the default and toggles recording for every key, so
  // Tab / Shift+Tab on the mic button start a recording instead of moving focus.
  it.fails('Tab moves focus on instead of starting a recording', () => {
    withLocale(<CometChatMessageComposerVoiceButton />);
    const tab = fireEvent.keyDown(button(), { key: 'Tab' });
    expect(tab).toBe(true);
    expect(ctxFn('setRecording')).not.toHaveBeenCalled();
  });
});
