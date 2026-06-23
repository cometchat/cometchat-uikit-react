/* eslint-disable @typescript-eslint/unbound-method */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const useCometChatInit = vi.fn();
const useCometChatLogin = vi.fn();

vi.mock('../../hooks/useCometChatInit', () => ({
  useCometChatInit: (opts: unknown) => useCometChatInit(opts),
}));
vi.mock('../../hooks/useCometChatLogin', () => ({
  useCometChatLogin: (opts: unknown) => useCometChatLogin(opts),
}));

vi.mock('../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: {
    getPluginRegistry: vi.fn(() => ({ id: 'registry' })),
  },
}));

// Capture the builder method chain to assert settings construction.
// `builderCalls` is hoisted with the vi.mock factory via vi.hoisted.
const { builderCalls } = vi.hoisted(() => ({
  builderCalls: {} as Record<string, unknown[] | undefined>,
}));

vi.mock('../../CometChatUIKit/UIKitSettings', () => {
  class MockBuilder {
    setAppId(v: unknown) {
      (builderCalls.setAppId ??= []).push(v);
      return this;
    }
    setRegion(v: unknown) {
      (builderCalls.setRegion ??= []).push(v);
      return this;
    }
    subscribePresenceForAllUsers() {
      (builderCalls.subscribePresenceForAllUsers ??= []).push(true);
      return this;
    }
    setCallingEnabled(v: unknown) {
      (builderCalls.setCallingEnabled ??= []).push(v);
      return this;
    }
    setAuthKey(v: unknown) {
      (builderCalls.setAuthKey ??= []).push(v);
      return this;
    }
    setPlugins(v: unknown) {
      (builderCalls.setPlugins ??= []).push(v);
      return this;
    }
    build() {
      (builderCalls.build ??= []).push(true);
      return { __built: true } as unknown;
    }
  }
  return { UIKitSettingsBuilder: MockBuilder };
});

// Child providers — render-through wrappers that expose received props.
vi.mock('../PluginRegistryContext', () => ({
  CometChatPluginRegistryContext: {
    Provider: ({ value, children }: { value: unknown; children: React.ReactNode }) => (
      <div data-testid="plugin-registry" data-value={JSON.stringify(value)}>
        {children}
      </div>
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
    for (const k of Object.keys(builderCalls)) builderCalls[k] = undefined;
    useCometChatInit.mockReturnValue({ initState: 'initialized', initError: null });
    useCometChatLogin.mockReturnValue({ loginState: 'idle', loginError: null, loggedInUser: null });
  });

  it('renders children and the full provider stack', () => {
    render(
      <CometChatProvider appId="APP" region="us">
        <div data-testid="child">hello</div>
      </CometChatProvider>
    );
    expect(screen.getByTestId('plugin-registry')).toBeInTheDocument();
    expect(screen.getByTestId('global-config')).toBeInTheDocument();
    expect(screen.getByTestId('theme')).toBeInTheDocument();
    expect(screen.getByTestId('locale')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('hello');
  });

  it('builds settings from individual props', () => {
    render(
      <CometChatProvider appId="APP" region="eu" authKey="KEY" callingEnabled>
        <span>c</span>
      </CometChatProvider>
    );
    expect(builderCalls.setAppId).toEqual(['APP']);
    expect(builderCalls.setRegion).toEqual(['eu']);
    expect(builderCalls.subscribePresenceForAllUsers).toEqual([true]);
    expect(builderCalls.setCallingEnabled).toEqual([true]);
    expect(builderCalls.setAuthKey).toEqual(['KEY']);
    expect(builderCalls.build).toEqual([true]);
    // settings object built from builder is passed to init
    const initArg = useCometChatInit.mock.calls[0][0] as Record<string, unknown>;
    expect(initArg.settings).toEqual({ __built: true });
  });

  it('does not call setAuthKey/setPlugins when not provided', () => {
    render(
      <CometChatProvider appId="APP" region="us">
        <span>c</span>
      </CometChatProvider>
    );
    expect(builderCalls.setAuthKey).toBeUndefined();
    expect(builderCalls.setPlugins).toBeUndefined();
  });

  it('passes plugins to the builder when provided', () => {
    const plugins = [{ id: 'p1' }] as never;
    render(
      <CometChatProvider appId="APP" region="us" plugins={plugins}>
        <span>c</span>
      </CometChatProvider>
    );
    expect(builderCalls.setPlugins).toEqual([plugins]);
  });

  it('uses a pre-built settings object directly and skips the builder', () => {
    const settings = { preBuilt: true } as never;
    render(
      <CometChatProvider settings={settings} uid="superhero1">
        <span>c</span>
      </CometChatProvider>
    );
    expect(builderCalls.setAppId).toBeUndefined();
    expect(builderCalls.build).toBeUndefined();
    const initArg = useCometChatInit.mock.calls[0][0] as Record<string, unknown>;
    expect(initArg.settings).toBe(settings);
  });

  it('throws when neither settings nor appId/region are provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <CometChatProvider>
          <span>c</span>
        </CometChatProvider>
      )
    ).toThrow(/Either `settings` or both `appId` and `region`/);
    spy.mockRestore();
  });

  it('forwards login props (authToken/uid) to useCometChatLogin', () => {
    const onLoginSuccess = vi.fn();
    const onError = vi.fn();
    render(
      <CometChatProvider
        appId="APP"
        region="us"
        authToken="tok"
        uid="u1"
        onError={onError}
        onLoginSuccess={onLoginSuccess}
      >
        <span>c</span>
      </CometChatProvider>
    );
    const loginArg = useCometChatLogin.mock.calls[0][0] as Record<string, unknown>;
    expect(loginArg.authToken).toBe('tok');
    expect(loginArg.uid).toBe('u1');
    expect(loginArg.initState).toBe('initialized');
    expect(loginArg.onLoginSuccess).toBe(onLoginSuccess);
    expect(loginArg.onError).toBe(onError);
  });

  it('provides the plugin registry from CometChatUIKit', () => {
    render(
      <CometChatProvider appId="APP" region="us">
        <span>c</span>
      </CometChatProvider>
    );
    expect(CometChatUIKit.getPluginRegistry).toHaveBeenCalled();
    expect(screen.getByTestId('plugin-registry')).toHaveAttribute(
      'data-value',
      JSON.stringify({ id: 'registry' })
    );
  });

  it('passes config, theme, and locale through to the respective providers', () => {
    const config = { hideReceipts: true } as never;
    render(
      <CometChatProvider appId="APP" region="us" config={config} theme="dark" locale="fr">
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

  it('wraps children in CometChatEventsProvider only when initialized', () => {
    const { rerender } = render(
      <CometChatProvider appId="APP" region="us">
        <span data-testid="child">c</span>
      </CometChatProvider>
    );
    expect(screen.getByTestId('events-provider')).toBeInTheDocument();

    useCometChatInit.mockReturnValue({ initState: 'initializing', initError: null });
    rerender(
      <CometChatProvider appId="APP" region="us">
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
