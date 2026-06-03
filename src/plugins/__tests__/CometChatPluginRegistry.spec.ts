import { describe, it, expect } from 'vitest';
import { CometChatPluginRegistry } from '../CometChatPluginRegistry';
import type { CometChatMessagePlugin } from '../plugin.types';

// Minimal mock plugins
const textPlugin: CometChatMessagePlugin = {
  id: 'text',
  messageTypes: ['text'],
  messageCategories: ['message'],
  renderBubble: () => null,
};

const imagePlugin: CometChatMessagePlugin = {
  id: 'image',
  messageTypes: ['image'],
  messageCategories: ['message'],
  renderBubble: () => null,
};

const deletePlugin: CometChatMessagePlugin = {
  id: 'delete',
  messageTypes: [],
  messageCategories: [],
  renderBubble: () => null,
};

// Mock message factory
function mockMessage(type: string, category: string, deletedAt: number | null = null) {
  return {
    getType: () => type,
    getCategory: () => category,
    getDeletedAt: () => deletedAt,
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
}

describe('CometChatPluginRegistry', () => {
  it('findPlugin returns correct plugin for text messages', () => {
    const registry = new CometChatPluginRegistry([textPlugin, imagePlugin, deletePlugin]);
    const found = registry.findPlugin(mockMessage('text', 'message'));
    expect(found?.id).toBe('text');
  });

  it('findPlugin returns correct plugin for image messages', () => {
    const registry = new CometChatPluginRegistry([textPlugin, imagePlugin, deletePlugin]);
    const found = registry.findPlugin(mockMessage('image', 'message'));
    expect(found?.id).toBe('image');
  });

  it('findPlugin returns delete plugin for deleted messages', () => {
    const registry = new CometChatPluginRegistry([textPlugin, deletePlugin]);
    const found = registry.findPlugin(mockMessage('text', 'message', Date.now()));
    expect(found?.id).toBe('delete');
  });

  it('findPlugin returns undefined for unknown types', () => {
    const registry = new CometChatPluginRegistry([textPlugin]);
    const found = registry.findPlugin(mockMessage('unknown', 'unknown'));
    expect(found).toBeUndefined();
  });

  it('register returns a new registry instance', () => {
    const registry1 = new CometChatPluginRegistry([textPlugin]);
    const registry2 = registry1.register(imagePlugin);
    expect(registry2).not.toBe(registry1);
    expect(registry2.getAll()).toHaveLength(2);
    expect(registry1.getAll()).toHaveLength(1);
  });

  it('getAllMessageTypes returns deduplicated types', () => {
    const registry = new CometChatPluginRegistry([textPlugin, imagePlugin]);
    const types = registry.getAllMessageTypes();
    expect(types).toEqual(['text', 'image']);
  });

  it('getAllMessageCategories returns deduplicated categories', () => {
    const registry = new CometChatPluginRegistry([textPlugin, imagePlugin]);
    const categories = registry.getAllMessageCategories();
    expect(categories).toEqual(['message']);
  });

  it('empty registry returns empty arrays', () => {
    const registry = new CometChatPluginRegistry();
    expect(registry.getAll()).toHaveLength(0);
    expect(registry.getAllMessageTypes()).toEqual([]);
    expect(registry.getAllMessageCategories()).toEqual([]);
  });
});
