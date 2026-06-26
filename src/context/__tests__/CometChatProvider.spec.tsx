/* eslint-disable @typescript-eslint/unbound-method */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────
//
// The provider builds the plugin registry itself (from the `plugins` prop merged
// with defaults) and reads `CometChatUIKit.isInitialized()` to decide whether to
// mount the events provider. SDK init/login are the consumer's responsibility and
// are NOT handled here, so there are no init/login/settings-builder concerns.

// Capture the plugins passed into the CometChatPluginRegistry constructor.
// Hoisted so the vi.mock factories below can reference them.
const { registryArgs, DEFAULT_PLUGIN } = vi.hoisted(() => ({
  registryArgs: [] as unknown[][],
  DEFAULT_PLUGIN: { id: 'default', messageTypes: ['text'], messageCategories: ['message'] },
}));

vi.mock('../../plugins/CometChatPluginRegistry', () => ({
  CometChatPluginRegistry: class {
    plugins: unknown[];
    constructor(plugins: unknown[]) {
      this.plugins = plugins;
      registryArgs.push(plugins);
    }
  },
}));

vi.mock('../../plugins/core', () => ({ defaultPlugins: [DEFAULT_PLUGIN] }));

vi.mock('../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: {
    isInitialized: vi.fn(() => true),
  },
}));

// Child providers — render-through wrappers that expose received props.
vi.mock('../PluginRegistryContext', () => ({
  CometChatPluginRegistryContext: {
    Provider: ({ children }: { value: unknown; children: React.ReactNode }) => (
      <div data-testid="plugin-registry">{children}</div>
    ),
  },
}));
vi.mock('../GlobalConfigContext', () => ({
  GlobalConfigProvider: ({ config, children }: { config: unknown; children: React.ReactNode }) => (
    <div data-testid="global-config" data-config={JSON.stringify(config)}>
      {children}
    </div>
  ),
}));
vi.mock('../ThemeProvider', () => ({
  CometChatThemeProvider: ({ theme, children }: { theme: unknown; children: React.ReactNode }) => (
    <div data-testid="theme" data-theme={String(theme)}>
      {children}
    </div>
  ),
}));
vi.mock('../locale/LocaleProvider', () => ({
  LocaleProvider: ({ locale, children }: { locale: unknown; children: React.ReactNode }) => (
    <div data-testid="locale" data-locale={String(locale)}>
      {children}
    </div>
  ),
}));
vi.mock('../CometChatEventsProvider', () => ({
  CometChatEventsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="events-provider">{children}</div>
  ),
}));

import { CometChatProvider } from '../CometChatProvider';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';

describe('CometChatProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registryArgs.length = 0;
    vi.mocked(CometChatUIKit.isInitialized).mockReturnValue(true);
  });

  it('renders children and the full provider stack', () => {
    render(
      <CometChatProvider>
        <div data-testid="child">hello</div>
      </CometChatProvider>
    );
    expect(screen.getByTestId('plugin-registry')).toBeInTheDocument();
    expect(screen.getByTestId('global-config')).toBeInTheDocument();
    expect(screen.getByTestId('theme')).toBeInTheDocument();
    expect(screen.getByTestId('locale')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('hello');
  });

  it('builds the plugin registry from the plugins prop merged with defaults', () => {
    const plugins = [
      { id: 'custom', messageTypes: ['custom'], messageCategories: ['custom'] },
    ] as never;
    render(
      <CometChatProvider plugins={plugins}>
        <span>c</span>
      </CometChatProvider>
    );
    expect(registryArgs[0]).toEqual([...plugins, DEFAULT_PLUGIN]);
  });

  it('uses only the default plugins when no plugins prop is provided', () => {
    render(
      <CometChatProvider>
        <span>c</span>
      </CometChatProvider>
    );
    expect(registryArgs[0]).toEqual([DEFAULT_PLUGIN]);
  });

  it('removePlugins filters out matching plugins (including defaults)', () => {
    render(
      <CometChatProvider removePlugins={[{ text: 'text', category: 'message' }]}>
        <span>c</span>
      </CometChatProvider>
    );
    // The default plugin (text/message) is excluded.
    expect(registryArgs[0]).toEqual([]);
  });

  it('passes config, theme, and locale through to the respective providers', () => {
    const config = { hideReceipts: true } as never;
    render(
      <CometChatProvider config={config} theme="dark" locale="fr">
        <span>c</span>
      </CometChatProvider>
    );
    expect(screen.getByTestId('global-config')).toHaveAttribute(
      'data-config',
      JSON.stringify(config)
    );
    expect(screen.getByTestId('theme')).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByTestId('locale')).toHaveAttribute('data-locale', 'fr');
  });

  it('wraps children in CometChatEventsProvider only when the UIKit is initialized', () => {
    const { rerender } = render(
      <CometChatProvider>
        <span data-testid="child">c</span>
      </CometChatProvider>
    );
    expect(screen.getByTestId('events-provider')).toBeInTheDocument();

    vi.mocked(CometChatUIKit.isInitialized).mockReturnValue(false);
    rerender(
      <CometChatProvider>
        <span data-testid="child">c</span>
      </CometChatProvider>
    );
    expect(screen.queryByTestId('events-provider')).not.toBeInTheDocument();
    // children still rendered directly
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('has the expected displayName', () => {
    expect(CometChatProvider.displayName).toBe('CometChatProvider');
  });
});
