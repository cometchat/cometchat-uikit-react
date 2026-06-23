import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';
import { defaultPlugins } from '../../plugins/core';

// Capture the registry the provider passes into PluginRegistryContext.
let capturedRegistry: CometChatPluginRegistry | null = null;

vi.mock('../PluginRegistryContext', () => ({
  CometChatPluginRegistryContext: {
    Provider: ({
      value,
      children,
    }: {
      value: CometChatPluginRegistry;
      children: React.ReactNode;
    }) => {
      capturedRegistry = value;
      return <>{children}</>;
    },
  },
}));

// Pass-through wrappers for the rest of the provider stack.
vi.mock('../GlobalConfigContext', () => ({
  GlobalConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../ThemeProvider', () => ({
  CometChatThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../locale/LocaleProvider', () => ({
  LocaleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../CometChatEventsProvider', () => ({
  CometChatEventsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: { isInitialized: () => false },
}));

import { CometChatProvider } from '../CometChatProvider';

const idsOf = (reg: CometChatPluginRegistry | null) => reg?.getAll().map(p => p.id) ?? [];

describe('CometChatProvider removePlugins', () => {
  beforeEach(() => {
    capturedRegistry = null;
  });

  it('keeps all default plugins when removePlugins is not provided', () => {
    render(
      <CometChatProvider>
        <span>c</span>
      </CometChatProvider>
    );
    expect(idsOf(capturedRegistry)).toEqual(defaultPlugins.map(p => p.id));
  });

  it('excludes a default plugin matched by text + category', () => {
    render(
      <CometChatProvider removePlugins={[{ text: 'extension_poll', category: 'custom' }]}>
        <span>c</span>
      </CometChatProvider>
    );
    const ids = idsOf(capturedRegistry);
    expect(ids).not.toContain('polls');
    // Unrelated defaults remain.
    expect(ids).toContain('text');
    expect(ids).toContain('stickers');
  });

  it('does not remove a plugin when only one of text/category matches', () => {
    render(
      // 'text' type exists, but with the wrong category — must not match.
      <CometChatProvider removePlugins={[{ text: 'text', category: 'custom' }]}>
        <span>c</span>
      </CometChatProvider>
    );
    expect(idsOf(capturedRegistry)).toContain('text');
  });

  it('also excludes matching custom plugins passed via plugins', () => {
    const customPlugin = {
      id: 'my-custom',
      messageTypes: ['my_type'],
      messageCategories: ['custom'],
      renderBubble: () => null,
    } as never;
    render(
      <CometChatProvider
        plugins={[customPlugin]}
        removePlugins={[{ text: 'my_type', category: 'custom' }]}
      >
        <span>c</span>
      </CometChatProvider>
    );
    expect(idsOf(capturedRegistry)).not.toContain('my-custom');
  });
});
