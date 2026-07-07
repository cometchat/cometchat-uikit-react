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

// Developer card plugin: empty messageTypes acts as a category-only wildcard.
const cardPlugin: CometChatMessagePlugin = {
  id: 'card',
  messageTypes: [],
  messageCategories: ['card'],
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

  it('findPlugin matches a wildcard plugin (empty messageTypes) by category for any type', () => {
    const registry = new CometChatPluginRegistry([textPlugin, cardPlugin, deletePlugin]);
    // Developer card type is arbitrary — both resolve to the card plugin by category.
    expect(registry.findPlugin(mockMessage('buy_button', 'card'))?.id).toBe('card');
    expect(registry.findPlugin(mockMessage('product', 'card'))?.id).toBe('card');
  });

  it('wildcard plugin does not match other categories', () => {
    const registry = new CometChatPluginRegistry([textPlugin, cardPlugin]);
    // category 'message' must still go to the text plugin, never the card wildcard.
    expect(registry.findPlugin(mockMessage('text', 'message'))?.id).toBe('text');
    // a type that no strict plugin handles in a non-card category yields no match.
    expect(registry.findPlugin(mockMessage('buy_button', 'message'))).toBeUndefined();
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
