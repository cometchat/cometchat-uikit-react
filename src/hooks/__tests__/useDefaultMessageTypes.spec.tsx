import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';
import type { CometChatMessagePlugin } from '../../plugins/plugin.types';
import { useDefaultMessageTypes, useDefaultMessageCategories } from '../useDefaultMessageTypes';

const plugin = (
  id: string,
  messageTypes: string[],
  messageCategories: string[]
): CometChatMessagePlugin =>
  ({ id, messageTypes, messageCategories, renderBubble: () => null }) as never;

const wrapperFor = (registry: CometChatPluginRegistry) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <CometChatPluginRegistryContext.Provider value={registry}>
        {children}
      </CometChatPluginRegistryContext.Provider>
    );
  };

describe('useDefaultMessageTypes / useDefaultMessageCategories', () => {
  it('returns the deduplicated union of active plugin types/categories', () => {
    const registry = new CometChatPluginRegistry([
      plugin('text', ['text'], ['message']),
      plugin('image', ['image'], ['message']),
      plugin('polls', ['extension_poll'], ['custom']),
    ]);
    const wrapper = wrapperFor(registry);

    const types = renderHook(() => useDefaultMessageTypes(), { wrapper });
    const cats = renderHook(() => useDefaultMessageCategories(), { wrapper });

    expect(types.result.current).toEqual(['text', 'image', 'extension_poll']);
    expect(cats.result.current).toEqual(['message', 'custom']);
  });

  it('matches exactly what the registry computes (single source of truth)', () => {
    const registry = new CometChatPluginRegistry([
      plugin('text', ['text'], ['message']),
      plugin('custom', ['my_type'], ['custom']),
    ]);
    const wrapper = wrapperFor(registry);

    const { result } = renderHook(() => useDefaultMessageTypes(), { wrapper });
    expect(result.current).toEqual(registry.getAllMessageTypes());
  });

  it('reflects removed plugins — a removed type is absent', () => {
    // Registry without the polls plugin (as removePlugins would produce).
    const registry = new CometChatPluginRegistry([plugin('text', ['text'], ['message'])]);
    const wrapper = wrapperFor(registry);

    const { result } = renderHook(() => useDefaultMessageTypes(), { wrapper });
    expect(result.current).not.toContain('extension_poll');
  });

  it('throws when used outside a CometChatProvider', () => {
    expect(() => renderHook(() => useDefaultMessageTypes())).toThrow(
      /CometChatPluginRegistryContext/
    );
  });
});
