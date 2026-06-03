import { describe, it, expect } from 'vitest';
import { CometChatCollaborativeWhiteboardPlugin } from '../CometChatCollaborativeWhiteboardPlugin';

function mockWbMsg() {
  return {
    getId: () => 1,
    getType: () => 'extension_whiteboard',
    getCategory: () => 'custom',
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getDeletedAt: () => null,
    getMetadata: () => ({
      '@injected': { extensions: { whiteboard: { board_url: 'https://wb.example.com' } } },
    }),
    getParentMessageId: () => 0,
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'u2', getName: () => 'Bob', getRole: () => '' }),
  } as any;
}

const ctx = {
  loggedInUser: { getUid: () => 'u1' } as any,
  alignment: 'right' as const,
  theme: 'light' as const,
};

describe('CometChatCollaborativeWhiteboardPlugin', () => {
  it('has correct id and message types', () => {
    expect(CometChatCollaborativeWhiteboardPlugin.id).toBe('collaborative-whiteboard');
    expect(CometChatCollaborativeWhiteboardPlugin.messageTypes).toContain('extension_whiteboard');
    expect(CometChatCollaborativeWhiteboardPlugin.messageCategories).toContain('custom');
  });

  it('renderBubble returns a React element', () => {
    const el = CometChatCollaborativeWhiteboardPlugin.renderBubble(mockWbMsg(), ctx);
    expect(el).not.toBeNull();
  });

  it('getOptions returns array', () => {
    const opts = CometChatCollaborativeWhiteboardPlugin.getOptions!(mockWbMsg(), ctx);
    expect(Array.isArray(opts)).toBe(true);
  });

  it('getLastMessagePreview returns whiteboard text', () => {
    expect(
      CometChatCollaborativeWhiteboardPlugin.getLastMessagePreview!(mockWbMsg(), {} as any)
    ).toBe('Collaborative Whiteboard');
  });
});
