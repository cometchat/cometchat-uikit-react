import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Mock the composer context so we can drive reply mode / quoted message directly.
const mockCtx = {
  isInReplyMode: true,
  messageToReply: null as unknown,
  closePreview: vi.fn(),
};
vi.mock('../CometChatMessageComposer.context', () => ({
  useCometChatMessageComposerContext: () => mockCtx,
}));

import { CometChatMessageComposerReplyPreview } from '../CometChatMessageComposerReplyPreview';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import { buildUser, buildTextMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

function renderPreview() {
  return render(
    <LocaleProvider>
      <CometChatMessageComposerReplyPreview />
    </LocaleProvider>
  );
}

describe('CometChatMessageComposerReplyPreview — sender label', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(
      buildUser({ uid: 'me', name: 'Me' }) as never
    );
  });

  it('shows "You" when the quoted message was sent by the logged-in user', () => {
    mockCtx.messageToReply = buildTextMessage({
      sender: buildUser({ uid: 'me', name: 'Me' }) as never,
    }) as unknown as CometChat.BaseMessage;
    renderPreview();
    const senderEl = document.querySelector('.cometchat-message-composer__reply-preview-sender');
    expect(senderEl?.textContent).toBe('You');
  });

  it('shows the sender name when the quoted message was sent by another user', () => {
    mockCtx.messageToReply = buildTextMessage({
      sender: buildUser({ uid: 'other', name: 'Alice' }) as never,
    }) as unknown as CometChat.BaseMessage;
    renderPreview();
    const senderEl = document.querySelector('.cometchat-message-composer__reply-preview-sender');
    expect(senderEl?.textContent).toBe('Alice');
  });
});
