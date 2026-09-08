import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageReplyPreview } from '../CometChatMessageReplyPreview';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';

/**
 * Test doubles that reproduce the real formatters' behavior for the reply-preview
 * regression: a whitespace/`>`-anchored hashtag formatter (like the sample app's) and a
 * `{color:…}`-token color formatter. The bug: running these AFTER mentions become inline
 * hex-styled spans made the hashtag regex match the `#6852d6` inside a mention's `style`
 * and shred the tag. The fix applies formatters on the mention-TOKEN text first, with the
 * tokens sentinel-protected.
 */
class TrapHashtagFormatter extends CometChatTextFormatter {
  readonly id = 'test-hashtag';
  override priority = 50;
  override format(text: string): string {
    return text.replace(
      /(^|\s|>)#(\w+)/g,
      (_m, pre: string, tag: string) => `${pre}<span class="test-hashtag">#${tag}</span>`
    );
  }
}

class TrapColorFormatter extends CometChatTextFormatter {
  readonly id = 'test-color';
  override priority = 60;
  override format(text: string): string {
    return text.replace(
      /\{color:(#[0-9a-fA-F]{3,6})\}([\s\S]*?)\{\/color\}/g,
      (_m, color: string, inner: string) =>
        `<span class="cc-color" style="color:${color}">${inner}</span>`
    );
  }
}

/** A quoted text message with no richText metadata, forcing the raw-text fallback path. */
function quotedTextMessage(text: string, mentions: { uid: string; name: string }[] = []) {
  return {
    getId: () => 1,
    getType: () => 'text',
    getCategory: () => 'message',
    getText: () => text,
    getDeletedAt: () => 0,
    getSender: () => ({ getUid: () => 'other', getName: () => 'Other' }),
    getMentionedUsers: () => mentions.map(m => ({ getUid: () => m.uid, getName: () => m.name })),
    getMetadata: () => ({}), // no richText → raw-text path (where formatters apply)
  } as unknown as CometChat.BaseMessage;
}

function renderPreview(message: CometChat.BaseMessage, textFormatters: CometChatTextFormatter[]) {
  return render(
    <CometChatMessageReplyPreview
      quotedMessage={message}
      alignment="left"
      textFormatters={textFormatters}
    />
  );
}

describe('CometChatMessageReplyPreview — custom formatting', () => {
  it('renders a mention as a span and does NOT let a hashtag formatter shred it (the trap)', () => {
    const message = quotedTextMessage('hey <@uid:u1> and #real', [
      { uid: 'u1', name: 'Andrew Joseph' },
    ]);
    const { container } = renderPreview(message, [new TrapHashtagFormatter()]);
    const html = container.innerHTML;

    // The mention renders as ONE intact styled span. In the regression it was
    // shredded (its `<span style="color: var(--…, ` prefix consumed and the hex
    // turned into a hashtag span), so this exact intact span would be absent.
    expect(html).toContain(
      '<span style="color: var(--cometchat-primary-color, #6852d6); font-weight: 500;">@Andrew Joseph</span>'
    );
    // The hex color inside the mention's style must NOT have been wrapped as a hashtag.
    expect(html).not.toContain('test-hashtag">#6852d6');
    // A genuine hashtag in the body still formats.
    expect(html).toContain('<span class="test-hashtag">#real</span>');
  });

  it('renders custom color tokens as spans', () => {
    const message = quotedTextMessage('{color:#ff0000}hi{/color} there');
    const { container } = renderPreview(message, [new TrapColorFormatter()]);
    const html = container.innerHTML;
    expect(html).toContain('cc-color');
    expect(html).toContain('color:#ff0000');
    expect(html).toContain('hi');
    // The raw token must not survive.
    expect(html).not.toContain('{color:#ff0000}');
  });

  it('handles colored text AND a mention together without corruption', () => {
    const message = quotedTextMessage('{color:#00ff00}hi{/color} <@uid:u1>', [
      { uid: 'u1', name: 'Andrew Joseph' },
    ]);
    const { container } = renderPreview(message, [
      new TrapColorFormatter(),
      new TrapHashtagFormatter(),
    ]);
    const html = container.innerHTML;
    expect(html).toContain('cc-color');
    expect(html).toContain('color:#00ff00');
    expect(html).toContain('@Andrew Joseph');
    // Neither token nor a shredded mention.
    expect(html).not.toContain('{color:#00ff00}');
    expect(html).not.toContain('test-hashtag">#6852d6');
  });

  it('does not touch mentions when no custom formatters are passed', () => {
    const message = quotedTextMessage('hey <@uid:u1>', [{ uid: 'u1', name: 'Andrew Joseph' }]);
    const { container } = renderPreview(message, []);
    expect(container.innerHTML).toContain('@Andrew Joseph');
  });
});
