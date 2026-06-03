import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { GlobalConfigProvider, useGlobalConfig } from '../GlobalConfigContext';

describe('GlobalConfigContext', () => {
  it('returns empty object when no provider is present', () => {
    const { result } = renderHook(() => useGlobalConfig());
    expect(result.current).toEqual({});
  });

  it('returns provided config values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalConfigProvider config={{ hideReceipts: true, hideUserStatus: false }}>
        {children}
      </GlobalConfigProvider>
    );
    const { result } = renderHook(() => useGlobalConfig(), { wrapper });
    expect(result.current.hideReceipts).toBe(true);
    expect(result.current.hideUserStatus).toBe(false);
  });

  it('returns undefined for unset fields', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalConfigProvider config={{ hideReceipts: true }}>{children}</GlobalConfigProvider>
    );
    const { result } = renderHook(() => useGlobalConfig(), { wrapper });
    expect(result.current.hideReceipts).toBe(true);
    expect(result.current.hideUserStatus).toBeUndefined();
  });
});
