import { describe, it, expect } from 'vitest';
import { CometChatMessageTranslationPlugin } from '../CometChatMessageTranslationPlugin';

function mockTextMsg() {
  return {
    getId: () => 1,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getDeletedAt: () => null,
    getText: () => 'Hello',
    getMetadata: () => ({}),
    setMetadata: () => {},
  } as any;
}

function mockImageMsg() {
  return { ...mockTextMsg(), getType: () => 'image' };
}

function mockDeletedMsg() {
  return { ...mockTextMsg(), getDeletedAt: () => Date.now() };
}

const ctx = {
  loggedInUser: { getUid: () => 'u1' } as any,
  alignment: 'left' as const,
  theme: 'light' as const,
};

describe('CometChatMessageTranslationPlugin', () => {
  it('has correct id and empty message types', () => {
    expect(CometChatMessageTranslationPlugin.id).toBe('message-translation');
    expect(CometChatMessageTranslationPlugin.messageTypes).toEqual([]);
    expect(CometChatMessageTranslationPlugin.messageCategories).toEqual([]);
  });

  it('renderBubble returns null', () => {
    expect(CometChatMessageTranslationPlugin.renderBubble(mockTextMsg(), ctx)).toBeNull();
  });

  it('getOptions returns translate option for text messages', () => {
    const opts = CometChatMessageTranslationPlugin.getOptions!(mockTextMsg(), ctx);
    expect(opts.length).toBe(1);
    expect(opts[0].id).toBe('translate');
  });

  it('getOptions returns empty array for non-text messages', () => {
    const opts = CometChatMessageTranslationPlugin.getOptions!(mockImageMsg(), ctx);
    expect(opts).toEqual([]);
  });

  it('getOptions returns empty array for deleted messages', () => {
    const opts = CometChatMessageTranslationPlugin.getOptions!(mockDeletedMsg(), ctx);
    expect(opts).toEqual([]);
  });

  it('getLastMessagePreview returns empty string', () => {
    expect(CometChatMessageTranslationPlugin.getLastMessagePreview!(mockTextMsg(), {} as any)).toBe(
      ''
    );
  });
});
