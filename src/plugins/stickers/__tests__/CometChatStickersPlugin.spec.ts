import { describe, it, expect } from 'vitest';
import { CometChatStickersPlugin } from '../CometChatStickersPlugin';

function mockStickerMsg() {
  return {
    getId: () => 1,
    getType: () => 'extension_sticker',
    getCategory: () => 'custom',
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getDeletedAt: () => null,
    getMetadata: () => ({}),
    getCustomData: () => ({ sticker_url: 'https://example.com/sticker.png', sticker_name: 'Cool' }),
    getParentMessageId: () => 0,
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'u2', getName: () => 'Bob', getRole: () => '' }),
  } as any;
}

const ctx = {
  loggedInUser: { getUid: () => 'u1' } as any,
  alignment: 'left' as const,
  theme: 'light' as const,
};

describe('CometChatStickersPlugin', () => {
  it('has correct id and message types', () => {
    expect(CometChatStickersPlugin.id).toBe('stickers');
    expect(CometChatStickersPlugin.messageTypes).toContain('extension_sticker');
    expect(CometChatStickersPlugin.messageCategories).toContain('custom');
  });

  it('renderBubble returns a React element', () => {
    const el = CometChatStickersPlugin.renderBubble(mockStickerMsg(), ctx);
    expect(el).not.toBeNull();
  });

  it('getOptions returns array', () => {
    const opts = CometChatStickersPlugin.getOptions!(mockStickerMsg(), ctx);
    expect(Array.isArray(opts)).toBe(true);
  });

  it('getLastMessagePreview returns sticker emoji', () => {
    expect(CometChatStickersPlugin.getLastMessagePreview!(mockStickerMsg(), {} as any)).toBe(
      'Sticker'
    );
  });
});
