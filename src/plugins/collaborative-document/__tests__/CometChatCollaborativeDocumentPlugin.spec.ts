import { describe, it, expect } from 'vitest';
import { CometChatCollaborativeDocumentPlugin } from '../CometChatCollaborativeDocumentPlugin';

function mockDocMsg() {
  return {
    getId: () => 1,
    getType: () => 'extension_document',
    getCategory: () => 'custom',
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getDeletedAt: () => null,
    getMetadata: () => ({
      '@injected': { extensions: { document: { document_url: 'https://doc.example.com' } } },
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

describe('CometChatCollaborativeDocumentPlugin', () => {
  it('has correct id and message types', () => {
    expect(CometChatCollaborativeDocumentPlugin.id).toBe('collaborative-document');
    expect(CometChatCollaborativeDocumentPlugin.messageTypes).toContain('extension_document');
    expect(CometChatCollaborativeDocumentPlugin.messageCategories).toContain('custom');
  });

  it('renderBubble returns a React element', () => {
    const el = CometChatCollaborativeDocumentPlugin.renderBubble(mockDocMsg(), ctx);
    expect(el).not.toBeNull();
  });

  it('getOptions returns array', () => {
    const opts = CometChatCollaborativeDocumentPlugin.getOptions!(mockDocMsg(), ctx);
    expect(Array.isArray(opts)).toBe(true);
  });

  it('getLastMessagePreview returns document text', () => {
    expect(
      CometChatCollaborativeDocumentPlugin.getLastMessagePreview!(mockDocMsg(), {} as any)
    ).toBe('Collaborative Document');
  });
});
