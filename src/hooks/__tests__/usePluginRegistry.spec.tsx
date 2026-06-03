import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { usePluginRegistry } from '../usePluginRegistry';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';
import type { CometChatMessagePlugin } from '../../plugins/plugin.types';

const testPlugin: CometChatMessagePlugin = {
  id: 'test',
  messageTypes: ['test'],
  messageCategories: ['message'],
  renderBubble: () => null,
};

describe('usePluginRegistry', () => {
  it('throws when used outside a provider', () => {
    // Suppress console.error for the expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePluginRegistry());
    }).toThrow('usePluginRegistry: no CometChatPluginRegistryContext found');

    spy.mockRestore();
  });

  it('returns the registry when provider is present', () => {
    const registry = new CometChatPluginRegistry([testPlugin]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CometChatPluginRegistryContext.Provider value={registry}>
        {children}
      </CometChatPluginRegistryContext.Provider>
    );

    const { result } = renderHook(() => usePluginRegistry(), { wrapper });

    expect(result.current).toBe(registry);
  });

  it('registry contains the expected plugins', () => {
    const registry = new CometChatPluginRegistry([testPlugin]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CometChatPluginRegistryContext.Provider value={registry}>
        {children}
      </CometChatPluginRegistryContext.Provider>
    );

    const { result } = renderHook(() => usePluginRegistry(), { wrapper });

    expect(result.current.getAll()).toHaveLength(1);
    expect(result.current.getAll()[0]?.id).toBe('test');
  });

  it('returns updated registry when provider value changes', () => {
    const registry1 = new CometChatPluginRegistry([testPlugin]);
    const registry2 = new CometChatPluginRegistry([]);

    let currentRegistry = registry1;

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CometChatPluginRegistryContext.Provider value={currentRegistry}>
        {children}
      </CometChatPluginRegistryContext.Provider>
    );

    const { result, rerender } = renderHook(() => usePluginRegistry(), { wrapper });

    expect(result.current.getAll()).toHaveLength(1);

    currentRegistry = registry2;
    rerender();

    expect(result.current.getAll()).toHaveLength(0);
  });
});
