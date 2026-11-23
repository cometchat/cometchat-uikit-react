import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { copyRequestBuilder } from '../copyRequestBuilder';
import { CometChatMessageListManager } from '../../components/CometChatMessageList/CometChatMessageListManager';
import { CometChatSavedMessagesManager } from '../../components/CometChatSavedMessages/CometChatSavedMessagesManager';

// D4: the kit must never change a MessagesRequestBuilder the integrator passed in.
describe('copyRequestBuilder (D4)', () => {
  it('keeps the prototype and own fields, and setters land on the copy only', () => {
    const original = new CometChat.MessagesRequestBuilder().setUID('peer').setLimit(20);
    const copy = copyRequestBuilder(original);
    expect(copy).not.toBe(original);
    expect(Object.getPrototypeOf(copy)).toBe(Object.getPrototypeOf(original));
    copy.setMessageId(42);
    expect((original as unknown as { messageId?: number }).messageId).toBeUndefined();
    expect(copy.build().getLimit()).toBe(20);
  });

  it('the message list manager anchors pagination on a copy of the integrator builder', () => {
    const builder = new CometChat.MessagesRequestBuilder().setUID('peer').setLimit(25);
    const before = { ...(builder as unknown as Record<string, unknown>) };
    const manager = new CometChatMessageListManager({ builder });
    manager.initNextRequest(99);
    expect({ ...(builder as unknown as Record<string, unknown>) }).toEqual(before);
  });

  it('the saved messages manager sets the saved flag on a copy', async () => {
    const builder = new CometChat.MessagesRequestBuilder().setLimit(10);
    // No network in a unit test: the built request answers an empty page.
    Object.assign(builder, {
      build: () => ({
        getLimit: () => 10,
        fetchPrevious: () => Promise.resolve([]),
        fetchNext: () => Promise.resolve([]),
      }),
    });
    const before = { ...(builder as unknown as Record<string, unknown>) };
    const manager = new CometChatSavedMessagesManager(builder);
    await manager.fetchFirst().catch(() => undefined);
    expect((builder as unknown as { saved?: boolean }).saved).toBeUndefined();
    expect({ ...(builder as unknown as Record<string, unknown>) }).toEqual(before);
  });
});
