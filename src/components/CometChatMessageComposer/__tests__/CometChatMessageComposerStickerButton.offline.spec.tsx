/**
 * The sticker send on the offline (ON) path: through the send helper (listener
 * form), a queued sticker is not a failure, a reply closes its preview once the
 * sticker is handed over, and a refused one is reported with no sound.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  installOfflineSdk,
  sendScripts,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';
import { OfflineHub } from '../../../utils/offline/hub';

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
    <button
      type="button"
      onClick={() => {
        onStickerClick({ stickerUrl: 'https://x.test/cat.png', stickerName: 'cat' });
      }}
    >
      pick sticker
    </button>
  ),
}));

import { CometChatMessageComposerStickerButton } from '../CometChatMessageComposerStickerButton';
import { CometChatMessageStatus } from '../../../context/CometChatEvents.types';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';

function setCtx(overrides: Record<string, unknown> = {}) {
  mocks.ctx = {
    contentToDisplay: 'stickers',
    setContentToDisplay: vi.fn(),
    user: { getUid: () => 'bob' },
    group: undefined,
    parentMessageId: undefined,
    messageToReply: null,
    closePreview: vi.fn(),
    onError: vi.fn(),
    isInEditMode: false,
    playOutgoingSound: vi.fn(),
    ...overrides,
  };
}

const ctxFn = (name: string) => mocks.ctx[name] as ReturnType<typeof vi.fn>;
const statuses = () => mocks.publish.mock.calls.map(c => (c[0] as { status: string }).status);

describe('CometChatMessageComposerStickerButton, offline ON', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    vi.clearAllMocks();
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'isInitialized').mockReturnValue(true);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(
      new CometChat.User({ uid: 'me', name: 'me' })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  function pick() {
    render(
      <LocaleProvider>
        <CometChatMessageComposerStickerButton />
      </LocaleProvider>
    );
    fireEvent.click(screen.getByText('pick sticker'));
  }

  it('a queued sticker: listener form, a sound, no error; the kit publishes no success itself', async () => {
    fake.scriptSend(sendScripts.queued('LS1'));
    setCtx();
    pick();
    await waitFor(() => {
      expect(ctxFn('playOutgoingSound')).toHaveBeenCalledTimes(1);
    });
    const [[message, listener]] = fake.callsTo('sendCustomMessage') as [
      [CometChat.CustomMessage, unknown],
    ];
    expect(listener).toBeDefined();
    expect(message.getType()).toBe('extension_sticker');
    expect(message.getCustomData()).toEqual({
      sticker_url: 'https://x.test/cat.png',
      sticker_name: 'cat',
    });
    expect(ctxFn('onError')).not.toHaveBeenCalled();
    expect(ctxFn('closePreview')).not.toHaveBeenCalled();
    // Only the optimistic publish: the hub, not the button, reports the outcome.
    expect(statuses()).toEqual([CometChatMessageStatus.inprogress]);
  });

  it('a reply sticker that was handed over closes the reply preview', async () => {
    fake.scriptSend(sendScripts.sent('LS2', 321));
    setCtx({ messageToReply: { getId: () => 9 } });
    pick();
    await waitFor(() => {
      expect(ctxFn('closePreview')).toHaveBeenCalledTimes(1);
    });
    expect(ctxFn('playOutgoingSound')).toHaveBeenCalledTimes(1);
  });

  it('a refused sticker is reported: onError, no sound, the reply preview stays', async () => {
    fake.scriptSend(sendScripts.refused('ERR_BLOCKED_BY_EXTENSION'));
    setCtx({ messageToReply: { getId: () => 9 } });
    pick();
    await waitFor(() => {
      expect(ctxFn('onError')).toHaveBeenCalledWith({ code: 'ERR_BLOCKED_BY_EXTENSION' });
    });
    expect(ctxFn('playOutgoingSound')).not.toHaveBeenCalled();
    expect(ctxFn('closePreview')).not.toHaveBeenCalled();
  });
});
