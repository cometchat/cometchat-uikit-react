import { describe, it, expect } from 'vitest';
import { CometChatDeletePlugin } from '../CometChatDeletePlugin';
import type { CometChatMessagePluginContext } from '../../../plugin.types';
import { buildUser } from '../../../../testing/mock-builders';

const mockContext: CometChatMessagePluginContext = {
  loggedInUser: buildUser() as never,
  alignment: 'right',
  theme: 'light',
};

describe('CometChatDeletePlugin', () => {
  it('has id "delete"', () => {
    expect(CometChatDeletePlugin.id).toBe('delete');
  });

  it('has empty messageTypes', () => {
    expect(CometChatDeletePlugin.messageTypes).toEqual([]);
  });

  it('has empty messageCategories', () => {
    expect(CometChatDeletePlugin.messageCategories).toEqual([]);
  });

  it('renderBubble returns a React element', () => {
    const mockMessage = {
      getDeletedAt: () => Date.now(),
      getSender: () => buildUser(),
      getType: () => 'text',
      getCategory: () => 'message',
    } as never;

    const element = CometChatDeletePlugin.renderBubble(mockMessage, mockContext);
    expect(element).not.toBeNull();
  });

  it('getOptions returns empty array', () => {
    const mockMessage = { getDeletedAt: () => Date.now() } as never;
    const options = CometChatDeletePlugin.getOptions!(mockMessage, mockContext);
    expect(options).toEqual([]);
  });

  it('getLastMessagePreview returns "This message was deleted"', () => {
    const mockMessage = { getDeletedAt: () => Date.now() } as never;
    const preview = CometChatDeletePlugin.getLastMessagePreview!(mockMessage, buildUser() as never);
    expect(preview).toBe('This message was deleted');
  });
});
