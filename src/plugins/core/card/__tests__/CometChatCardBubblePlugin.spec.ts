import { describe, it, expect } from 'vitest';
import { CometChatCardBubblePlugin } from '../CometChatCardBubblePlugin';
import type { CometChatMessagePluginContext } from '../../../plugin.types';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

function mockUser(uid: string): CometChat.User {
  return { getUid: () => uid, getName: () => uid } as unknown as CometChat.User;
}

/** Card message mock — own message so sender-only options (delete/info) survive filtering. */
function mockCardMessage(text: string, senderUid = 'me'): CometChat.BaseMessage {
  return {
    getText: () => text,
    getSender: () => mockUser(senderUid),
    getParentMessageId: () => 0,
    getCategory: () => 'card',
    getType: () => 'buy_button',
  } as unknown as CometChat.BaseMessage;
}

function mockContext(): CometChatMessagePluginContext {
  return {
    loggedInUser: mockUser('me'),
    alignment: 'right',
    theme: 'light',
  } as unknown as CometChatMessagePluginContext;
}

describe('CometChatCardBubblePlugin', () => {
  it('is a category-only wildcard plugin (card category, empty types)', () => {
    expect(CometChatCardBubblePlugin.id).toBe('card');
    expect(CometChatCardBubblePlugin.messageTypes).toEqual([]);
    expect(CometChatCardBubblePlugin.messageCategories).toEqual(['card']);
  });

  it('getOptions returns the text option set minus edit and copy', () => {
    const options =
      CometChatCardBubblePlugin.getOptions?.(mockCardMessage('Buy now'), mockContext()) ?? [];
    const ids = options.map(o => o.id);

    expect(ids).not.toContain('edit');
    expect(ids).not.toContain('copy');
    // Other inherited options remain (own message → delete/info present).
    expect(ids).toContain('react');
    expect(ids).toContain('reply');
    expect(ids).toContain('delete');
  });

  it('getLastMessagePreview returns text when present', () => {
    const preview = CometChatCardBubblePlugin.getLastMessagePreview?.(
      mockCardMessage('Sneaker X — Buy Now'),
      mockUser('me')
    );
    expect(preview).toBe('Sneaker X — Buy Now');
  });

  it('getLastMessagePreview falls back to "Card Message" when text is empty', () => {
    const preview = CometChatCardBubblePlugin.getLastMessagePreview?.(
      mockCardMessage(''),
      mockUser('me')
    );
    expect(preview).toBe('Card Message');
  });

  it('getLastMessagePreview uses the localized fallback when provided', () => {
    const preview = CometChatCardBubblePlugin.getLastMessagePreview?.(
      mockCardMessage(''),
      mockUser('me'),
      key => (key === 'card_message_fallback' ? 'Tarjeta' : key)
    );
    expect(preview).toBe('Tarjeta');
  });
});
