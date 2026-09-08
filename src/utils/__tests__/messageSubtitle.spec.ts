import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { getMessageSubtitle } from '../messageSubtitle';

const ICON_PREFIX = 'test-icon';

function textMessage(
  text: string,
  opts: { metadata?: Record<string, unknown>; senderUid?: string; senderName?: string } = {}
): CometChat.BaseMessage {
  return {
    getType: () => 'text',
    getText: () => text,
    getMetadata: () => opts.metadata ?? {},
    getSender: () => ({
      getUid: () => opts.senderUid ?? 'other',
      getName: () => opts.senderName ?? 'Other',
    }),
  } as unknown as CometChat.BaseMessage;
}

function mediaMessage(
  type: 'image' | 'video' | 'audio' | 'file',
  opts: { names?: string[]; caption?: string } = {}
): CometChat.BaseMessage {
  const names = opts.names ?? ['photo.png'];
  return {
    getType: () => type,
    getAttachments: () => names.map(name => ({ getName: () => name })),
    getCaption: () => opts.caption ?? '',
    getSender: () => ({ getUid: () => 'other', getName: () => 'Other' }),
  } as unknown as CometChat.BaseMessage;
}

function customMessage(
  type: string,
  opts: { conversationText?: string } = {}
): CometChat.BaseMessage {
  return {
    getType: () => type,
    getCategory: () => 'custom',
    getConversationText: () => opts.conversationText ?? '',
    getSender: () => ({ getUid: () => 'other', getName: () => 'Other' }),
  } as unknown as CometChat.BaseMessage;
}

// `t` returns the key so the English fallbacks are exercised deterministically,
// independent of any shared localize instance leaking in from another test.
const keyThrough = (key: string): string => key;

describe('getMessageSubtitle', () => {
  describe('rich text', () => {
    it('renders markdown bold as HTML', () => {
      const html = getMessageSubtitle(textMessage('hello **world**'), {
        iconClassPrefix: ICON_PREFIX,
      });
      expect(html).toBe('hello <b>world</b>');
    });

    it('renders italic, strikethrough and inline code', () => {
      const html = getMessageSubtitle(textMessage('_a_ ~~b~~ `c`'), {
        iconClassPrefix: ICON_PREFIX,
      });
      expect(html).toBe('<i>a</i> <s>b</s> <code>c</code>');
    });

    it('prefers the rich-text HTML stored in metadata over the plain body', () => {
      const message = textMessage('plain fallback', {
        metadata: { richText: { html: '<b>formatted</b>', hasFormatting: true } },
      });
      expect(getMessageSubtitle(message, { iconClassPrefix: ICON_PREFIX })).toBe(
        '<b>formatted</b>'
      );
    });

    it('ignores metadata HTML when hasFormatting is false', () => {
      const message = textMessage('plain body', {
        metadata: { richText: { html: '<b>stale</b>', hasFormatting: false } },
      });
      expect(getMessageSubtitle(message, { iconClassPrefix: ICON_PREFIX })).toBe('plain body');
    });

    it('escapes unknown tags instead of dropping them, so payloads read as inert text', () => {
      const html = getMessageSubtitle(textMessage('<script>alert(1)</script>'), {
        iconClassPrefix: ICON_PREFIX,
      });
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('collapses newlines — a preview is a single line', () => {
      const html = getMessageSubtitle(textMessage('one\ntwo   three'), {
        iconClassPrefix: ICON_PREFIX,
      });
      expect(html).toBe('one two three');
    });

    it('renders a mention as its display name', () => {
      const message = textMessage('hi <@uid:bob>');
      Object.assign(message, {
        getMentionedUsers: () => [{ getUid: () => 'bob', getName: () => 'Bob' }],
      });
      expect(getMessageSubtitle(message, { iconClassPrefix: ICON_PREFIX })).toContain('@Bob');
    });
  });

  describe('media icons', () => {
    it('prefixes an icon span carrying the caller’s class prefix', () => {
      const html = getMessageSubtitle(mediaMessage('image'), { iconClassPrefix: ICON_PREFIX });
      expect(html).toContain(`class="${ICON_PREFIX} ${ICON_PREFIX}--image"`);
    });

    it.each(['image', 'video', 'audio', 'file'] as const)('emits a %s icon', type => {
      const html = getMessageSubtitle(mediaMessage(type), { iconClassPrefix: ICON_PREFIX });
      expect(html).toContain(`${ICON_PREFIX}--${type}`);
    });

    it('labels a lone attachment with its file name', () => {
      const html = getMessageSubtitle(mediaMessage('file', { names: ['report.pdf'] }), {
        iconClassPrefix: ICON_PREFIX,
      });
      expect(html).toContain('report.pdf');
    });

    it('shows the caption instead of the file name when there is one', () => {
      const html = getMessageSubtitle(
        mediaMessage('image', { names: ['a.png'], caption: 'at the **beach**' }),
        { iconClassPrefix: ICON_PREFIX }
      );
      expect(html).toContain('at the <b>beach</b>');
      expect(html).not.toContain('a.png');
    });

    it('counts multiple attachments rather than naming one of them', () => {
      const html = getMessageSubtitle(mediaMessage('image', { names: ['a.png', 'b.png'] }), {
        iconClassPrefix: ICON_PREFIX,
        t: key => (key === 'media_edit_preview_image_plural' ? 'Photos' : key),
      });
      expect(html).toContain('2 Photos');
      expect(html).not.toContain('a.png');
    });
  });

  describe('sender prefix', () => {
    it('is omitted by default', () => {
      expect(getMessageSubtitle(textMessage('hi'), { iconClassPrefix: ICON_PREFIX })).toBe('hi');
    });

    it('names the sender when requested', () => {
      const html = getMessageSubtitle(textMessage('hi', { senderName: 'Alice' }), {
        iconClassPrefix: ICON_PREFIX,
        includeSenderPrefix: true,
      });
      expect(html).toBe('Alice: hi');
    });

    it('says "You" when the sender is the logged-in user', () => {
      const html = getMessageSubtitle(textMessage('hi', { senderUid: 'me' }), {
        iconClassPrefix: ICON_PREFIX,
        includeSenderPrefix: true,
        loggedInUserId: 'me',
        youLabel: 'You',
      });
      expect(html).toBe('You: hi');
    });
  });

  describe('custom / extension messages', () => {
    const opts = { iconClassPrefix: ICON_PREFIX, t: keyThrough };

    it('labels a poll, sticker, and collaborative doc/whiteboard (not the raw key)', () => {
      expect(getMessageSubtitle(customMessage('extension_poll'), opts)).toBe('Poll');
      expect(getMessageSubtitle(customMessage('extension_sticker'), opts)).toBe('Sticker');
      expect(getMessageSubtitle(customMessage('extension_document'), opts)).toBe(
        'Collaborative Document'
      );
      expect(getMessageSubtitle(customMessage('extension_whiteboard'), opts)).toBe(
        'Collaborative Whiteboard'
      );
    });

    it('no longer leaks the raw extension type key', () => {
      expect(getMessageSubtitle(customMessage('extension_document'), opts)).not.toBe(
        'extension_document'
      );
    });

    it('uses conversationText for an app-defined custom type', () => {
      expect(
        getMessageSubtitle(customMessage('app_custom', { conversationText: 'Custom thing' }), opts)
      ).toBe('Custom thing');
    });

    it('falls back to the type when a custom message has no conversationText', () => {
      expect(getMessageSubtitle(customMessage('app_custom'), opts)).toBe('app_custom');
    });
  });
});
