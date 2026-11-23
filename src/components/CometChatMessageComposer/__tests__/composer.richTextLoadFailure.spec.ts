/**
 * The rich-text formatter is lazy-loaded on send. If that load (or
 * the conversion) fails, e.g. a chunk fetch offline in a production build, the
 * double-send guard must be released so the next send still goes out.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));
vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn() },
}));
const formatterFailures = { remaining: 0 };
vi.mock('../../../formatters/CometChatRichTextFormatter', () => ({
  CometChatRichTextFormatter: class {
    constructor() {
      if (formatterFailures.remaining > 0) {
        formatterFailures.remaining -= 1;
        throw new Error('Failed to fetch dynamically imported module');
      }
    }
    format(html: string) {
      return html.replace(/<[^>]+>/g, '');
    }
  },
}));

import { useCometChatMessageComposer } from '../useCometChatMessageComposer';

type Sdk = Record<string, unknown>;
const sdk = mockCometChat as unknown as Sdk;
const user = {
  getUid: () => 'peer',
  getName: () => 'Peer',
  getStatus: () => 'online',
} as unknown as import('@cometchat/chat-sdk-javascript').User;

let saved: Record<string, unknown>;
beforeEach(() => {
  vi.clearAllMocks();
  saved = {
    sendMessage: sdk.sendMessage,
    isInitialized: sdk.isInitialized,
    getLoggedinUser: sdk.getLoggedinUser,
  };
  sdk.isInitialized = vi.fn().mockReturnValue(true);
  sdk.getLoggedinUser = vi.fn().mockResolvedValue(null);
  sdk.sendMessage = vi.fn((m: unknown) => Promise.resolve(m));
});
afterEach(() => {
  Object.assign(sdk, saved);
  formatterFailures.remaining = 0;
});

describe('rich-text send when the formatter fails to load', () => {
  it('a failed load rejects that send but does not block the next one', async () => {
    formatterFailures.remaining = 1;
    const { result } = renderHook(() => useCometChatMessageComposer({ user }));
    act(() => {
      result.current.setText('first');
    });
    await act(async () => {
      await expect(result.current.sendMessage(undefined, '<p>first</p>')).rejects.toThrow(
        /dynamically imported module/
      );
    });
    expect(sdk.sendMessage).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.sendMessage(undefined, '<p>second</p>');
    });
    expect(sdk.sendMessage).toHaveBeenCalledTimes(1);
  });
});
