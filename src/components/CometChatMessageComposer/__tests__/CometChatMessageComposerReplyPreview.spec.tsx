import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Mock the composer context so we can drive reply mode / quoted message directly.
const mockCtx = {
  isInReplyMode: true,
  messageToReply: null as unknown,
  closePreview: vi.fn(),
  textFormatters: undefined as unknown,
};
vi.mock('../CometChatMessageComposer.context', () => ({
  useCometChatMessageComposerContext: () => mockCtx,
}));

import { CometChatMessageComposerReplyPreview } from '../CometChatMessageComposerReplyPreview';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
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

// Regression: a custom text formatter whose regex could match a `#hex` must NOT corrupt the inline
// `#6852d6` fallback inside a resolved mention span. Fixed by running custom formatters on the
// mention-TOKEN text before mentions become inline-styled spans.
class RegexHashtagFormatter extends CometChatTextFormatter {
  readonly id = 'test-hashtag';
  override priority = 100;
  override customLogicToFormatText(text: string): string {
    // The same word-boundary regex the real sample HashtagFormatter uses — ` #hex` would otherwise
    // match inside `color: var(--…, #6852d6)`.
    return text.replace(/(^|\s|>)#(\w+)/g, '$1<span class="custom-hashtag">#$2</span>');
  }
}

describe('CometChatMessageComposerReplyPreview — custom formatters × mentions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx.textFormatters = undefined;
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(
      buildUser({ uid: 'me', name: 'Me' }) as never
    );
  });

  function quotedMessageWithMention() {
    return {
      ...buildTextMessage({ sender: buildUser({ uid: 'other', name: 'Alice' }) as never }),
      getText: () => 'hey <@uid:u1> #cool',
      getMentionedUsers: () => [{ getUid: () => 'u1', getName: () => 'Cars Demo' }],
    } as unknown as CometChat.BaseMessage;
  }

  it('does not shatter a mention span when a hashtag formatter is active', () => {
    mockCtx.messageToReply = quotedMessageWithMention();
    mockCtx.textFormatters = [new RegexHashtagFormatter()];
    renderPreview();

    const subtitle = document.querySelector('.cometchat-message-composer__reply-preview-subtitle')!;

    // Visible text is clean — no leaked style fragments like `#6852d6);` or `font-weight`.
    expect(subtitle.textContent).toBe('hey @Cars Demo #cool');
    expect(subtitle.textContent).not.toContain('6852d6');
    expect(subtitle.textContent).not.toContain('font-weight');
    // The mention span is intact and the hashtag was still formatted.
    const mentionSpan = subtitle.querySelector('span[style*="6852d6"]');
    expect(mentionSpan?.textContent).toBe('@Cars Demo');
    expect(subtitle.querySelector('.custom-hashtag')?.textContent).toBe('#cool');
  });

  it('protects mention tokens even from a formatter whose regex matches the token internals', () => {
    // This pathological formatter matches `@word` — which WOULD match the `@uid` inside a raw
    // `<@uid:u1>` token and shatter it, if tokens were not sentinel-protected first.
    class AtWordFormatter extends CometChatTextFormatter {
      readonly id = 'test-atword';
      override priority = 50;
      override customLogicToFormatText(text: string): string {
        return text.replace(/@(\w+)/g, '<span class="atword">@$1</span>');
      }
    }

    mockCtx.messageToReply = {
      ...buildTextMessage({ sender: buildUser({ uid: 'other', name: 'Alice' }) as never }),
      getText: () => 'hey <@uid:u1>',
      getMentionedUsers: () => [{ getUid: () => 'u1', getName: () => 'Cars Demo' }],
    } as unknown as CometChat.BaseMessage;
    mockCtx.textFormatters = [new AtWordFormatter()];
    renderPreview();

    const subtitle = document.querySelector('.cometchat-message-composer__reply-preview-subtitle')!;

    // Token survived: the mention resolved to its styled span with clean text.
    expect(subtitle.textContent).toBe('hey @Cars Demo');
    const mentionSpan = subtitle.querySelector('span[style*="6852d6"]');
    expect(mentionSpan?.textContent).toBe('@Cars Demo');
    // The formatter never got to wrap the token internals.
    expect(subtitle.innerHTML).not.toContain('@uid');
    expect(subtitle.querySelector('.atword')).toBeNull();
  });
});
