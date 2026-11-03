/**
 * Unit tests for CometChatFrameProvider: resolving the host iframe when it is
 * already present, added later (directly or nested), replaced by a re-render,
 * reloaded, or inaccessible; the retry back-off; and cleanup on unmount.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import {
  CometChatFrameProvider,
  useCometChatFrameContext,
  type CometChatFrameContextValue,
} from '../CometChatFrameContext';

let seen: CometChatFrameContextValue = { iframe: null, iframeWindow: null, iframeDocument: null };
function Probe() {
  seen = useCometChatFrameContext();
  return null;
}

function addIframe(id: string, parent: HTMLElement = document.body): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.id = id;
  parent.appendChild(iframe);
  return iframe;
}

const renderProvider = (iframeId = 'host-frame') =>
  render(
    <CometChatFrameProvider iframeId={iframeId}>
      <Probe />
    </CometChatFrameProvider>
  );

describe('CometChatFrameProvider', () => {
  beforeEach(() => {
    seen = { iframe: null, iframeWindow: null, iframeDocument: null };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('without a provider, consumers get null frame values', () => {
    render(<Probe />);
    expect(seen).toEqual({ iframe: null, iframeWindow: null, iframeDocument: null });
  });

  it('resolves an iframe that is already in the page', async () => {
    const iframe = addIframe('host-frame');
    renderProvider();
    await waitFor(() => expect(seen.iframe).toBe(iframe));
    expect(seen.iframeWindow).toBe(iframe.contentWindow);
    expect(seen.iframeDocument).toBe(iframe.contentDocument);
  });

  it('resolves an iframe added later, directly or inside a wrapper', async () => {
    renderProvider();
    expect(seen.iframe).toBeNull();

    const direct = addIframe('host-frame');
    await waitFor(() => expect(seen.iframe).toBe(direct));

    direct.remove();
    const wrapper = document.createElement('section');
    const nested = addIframe('host-frame', wrapper);
    document.body.appendChild(wrapper);
    await waitFor(() => expect(seen.iframe).toBe(nested));
  });

  it('follows the iframe when a host re-render replaces the element', async () => {
    const first = addIframe('host-frame');
    renderProvider();
    await waitFor(() => expect(seen.iframe).toBe(first));

    first.remove();
    const second = addIframe('host-frame');
    await waitFor(() => expect(seen.iframe).toBe(second));
    expect(seen.iframeWindow).toBe(second.contentWindow);
  });

  it('ignores unrelated DOM changes', async () => {
    const iframe = addIframe('host-frame');
    renderProvider();
    await waitFor(() => expect(seen.iframe).toBe(iframe));
    const before = seen;
    document.body.appendChild(document.createElement('div'));
    document.body.appendChild(document.createTextNode('text'));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(seen).toBe(before);
  });

  it('re-resolves when the iframe reloads', async () => {
    const iframe = addIframe('host-frame');
    const getById = vi.spyOn(document, 'getElementById');
    renderProvider();
    await waitFor(() => expect(seen.iframe).toBe(iframe));
    const calls = getById.mock.calls.length;
    act(() => {
      iframe.dispatchEvent(new Event('load'));
    });
    expect(getById.mock.calls.length).toBeGreaterThan(calls);
    expect(seen.iframe).toBe(iframe);
  });

  it('retries with back-off until the iframe appears, then stops', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const getById = vi.spyOn(document, 'getElementById');
    renderProvider();
    const afterMount = getById.mock.calls.length;

    // First retry after 100 ms, the next after 200 ms.
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(getById.mock.calls.length).toBe(afterMount);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(getById.mock.calls.length).toBe(afterMount + 1);

    getById.mockRestore();
    const iframe = document.createElement('iframe');
    iframe.id = 'host-frame';
    // Present for lookups, but not added through a mutation the observer would see first.
    vi.spyOn(document, 'getElementById').mockReturnValue(iframe);
    Object.defineProperty(iframe, 'contentWindow', { value: window });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(seen.iframe).toBe(iframe);
    expect(seen.iframeDocument).toBe(document);
  });

  it('gives up with a warning after ten retries', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderProvider();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(console.warn).toHaveBeenCalledWith(
      'CometChatFrameProvider: Failed to initialize iframe after 10 attempts'
    );
    expect(seen.iframe).toBeNull();
  });

  it('warns and keeps retrying when the iframe content cannot be read', () => {
    vi.useFakeTimers();
    const iframe = addIframe('host-frame');
    Object.defineProperty(iframe, 'contentDocument', {
      get() {
        throw new Error('cross-origin');
      },
    });
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    renderProvider();
    expect(console.warn).toHaveBeenCalledWith(
      'CometChatFrameProvider: Failed to access iframe content:',
      expect.any(Error)
    );
    expect(seen.iframe).toBeNull();
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it('stops observing, retrying and listening on unmount', () => {
    vi.useFakeTimers();
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderProvider();
    unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();

    const iframe = addIframe('host-frame');
    const remove = vi.spyOn(iframe, 'removeEventListener');
    renderProvider().unmount();
    expect(remove).toHaveBeenCalledWith('load', expect.any(Function));
  });
});
