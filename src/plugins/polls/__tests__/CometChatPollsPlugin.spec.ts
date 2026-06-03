import { describe, it, expect } from 'vitest';
import { CometChatPollsPlugin } from '../CometChatPollsPlugin';

function mockPollMsg() {
  return {
    getId: () => 1,
    getType: () => 'extension_poll',
    getCategory: () => 'custom',
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getDeletedAt: () => null,
    getCustomData: () => ({ question: 'Favorite color?' }),
    getMetadata: () => ({
      '@injected': {
        extensions: {
          polls: {
            id: 'p1',
            question: 'Favorite color?',
            options: { '1': 'Red' },
            results: { total: 0, options: {} },
          },
        },
      },
    }),
    getParentMessageId: () => 0,
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'u2', getName: () => 'Bob', getRole: () => '' }),
  } as any;
}

const mockContext = {
  loggedInUser: { getUid: () => 'u1' } as any,
  alignment: 'left' as const,
  theme: 'light' as const,
};

describe('CometChatPollsPlugin', () => {
  it('has correct id and message types', () => {
    expect(CometChatPollsPlugin.id).toBe('polls');
    expect(CometChatPollsPlugin.messageTypes).toContain('extension_poll');
    expect(CometChatPollsPlugin.messageCategories).toContain('custom');
  });

  it('renderBubble returns a React element', () => {
    const el = CometChatPollsPlugin.renderBubble(mockPollMsg(), mockContext);
    expect(el).not.toBeNull();
  });

  it('getOptions returns array of options', () => {
    const opts = CometChatPollsPlugin.getOptions!(mockPollMsg(), mockContext);
    expect(Array.isArray(opts)).toBe(true);
    expect(opts.length).toBeGreaterThan(0);
  });

  it('getLastMessagePreview returns poll question', () => {
    const preview = CometChatPollsPlugin.getLastMessagePreview!(mockPollMsg(), {} as any);
    expect(preview).toContain('Favorite color?');
  });

  it('getLastMessagePreview returns fallback for missing question', () => {
    const msg = { ...mockPollMsg(), getCustomData: () => ({}) };
    const preview = CometChatPollsPlugin.getLastMessagePreview!(msg, {} as any);
    expect(preview).toBe('Poll');
  });
});
