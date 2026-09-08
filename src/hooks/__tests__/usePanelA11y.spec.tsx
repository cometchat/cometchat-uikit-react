import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React, { useRef } from 'react';
import { usePanelA11y } from '../usePanelA11y';

function Panel({
  onDismiss,
  enabled = true,
  trapFocus = true,
  empty = false,
}: {
  onDismiss?: () => void;
  enabled?: boolean;
  trapFocus?: boolean;
  empty?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  usePanelA11y({ containerRef: ref, onDismiss, enabled, trapFocus });
  return (
    <div ref={ref} data-testid="panel" tabIndex={-1}>
      {!empty && (
        <>
          <button type="button">first</button>
          <button type="button">middle</button>
          <button type="button">last</button>
        </>
      )}
    </div>
  );
}

/** The hook defers initial focus one frame, so tests have to let it land. */
async function flushFrame() {
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      resolve(null);
    });
  });
}

describe('usePanelA11y', () => {
  it('moves focus to the first control when the panel opens', async () => {
    const { getByText } = render(<Panel />);
    await flushFrame();
    expect(document.activeElement).toBe(getByText('first'));
  });

  it('falls back to the panel itself when it holds nothing focusable', async () => {
    const { getByTestId } = render(<Panel empty />);
    await flushFrame();
    expect(document.activeElement).toBe(getByTestId('panel'));
  });

  it('dismisses on Escape', async () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<Panel onDismiss={onDismiss} />);
    await flushFrame();
    fireEvent.keyDown(getByTestId('panel'), { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not let Escape reach a listener further up', async () => {
    // Otherwise closing the panel would also close whatever hosts it.
    const outer = vi.fn();
    const { getByTestId } = render(
      <div onKeyDown={outer}>
        <Panel onDismiss={vi.fn()} />
      </div>
    );
    await flushFrame();
    fireEvent.keyDown(getByTestId('panel'), { key: 'Escape' });
    expect(outer).not.toHaveBeenCalled();
  });

  it('wraps Tab from the last control back to the first', async () => {
    const { getByText } = render(<Panel />);
    await flushFrame();
    getByText('last').focus();
    fireEvent.keyDown(getByText('last'), { key: 'Tab' });
    expect(document.activeElement).toBe(getByText('first'));
  });

  it('wraps Shift+Tab from the first control to the last', async () => {
    const { getByText } = render(<Panel />);
    await flushFrame();
    getByText('first').focus();
    fireEvent.keyDown(getByText('first'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(getByText('last'));
  });

  it('leaves Tab alone in the middle of the panel', async () => {
    const { getByText } = render(<Panel />);
    await flushFrame();
    getByText('middle').focus();
    fireEvent.keyDown(getByText('middle'), { key: 'Tab' });
    // Not intercepted — the browser's own order applies.
    expect(document.activeElement).toBe(getByText('middle'));
  });

  it('lets Tab escape when the trap is off', async () => {
    const { getByText } = render(<Panel trapFocus={false} />);
    await flushFrame();
    getByText('last').focus();
    fireEvent.keyDown(getByText('last'), { key: 'Tab' });
    expect(document.activeElement).toBe(getByText('last'));
  });

  it('restores focus to whatever was focused before', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const { unmount } = render(<Panel />);
    await flushFrame();
    unmount();

    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('does nothing at all while disabled', async () => {
    const onDismiss = vi.fn();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const { getByTestId } = render(<Panel enabled={false} onDismiss={onDismiss} />);
    await flushFrame();

    expect(document.activeElement).toBe(outside);
    fireEvent.keyDown(getByTestId('panel'), { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();
    outside.remove();
  });
});

describe('usePanelA11y — focus restoration is polite', () => {
  it('leaves focus alone when something else claimed it', async () => {
    const before = document.createElement('button');
    const claimant = document.createElement('button');
    document.body.append(before, claimant);
    before.focus();

    const { unmount } = render(<Panel />);
    await flushFrame();

    // Something outside the panel takes focus while it is open.
    claimant.focus();
    unmount();

    expect(document.activeElement).toBe(claimant);
    before.remove();
    claimant.remove();
  });
});

describe('usePanelA11y — stable across re-renders', () => {
  /** Mirrors a real caller: an inline arrow, new identity every render. */
  function Host({ tick }: { tick: number }) {
    const ref = useRef<HTMLDivElement>(null);
    usePanelA11y({
      containerRef: ref,
      onDismiss: () => {
        /* new identity each render, on purpose */
      },
    });
    return (
      <div ref={ref} data-testid="panel" tabIndex={-1}>
        <button type="button">first</button>
        <button type="button">second</button>
        <span data-testid="tick">{tick}</span>
      </div>
    );
  }

  it('does not re-grab focus when the host re-renders', async () => {
    // The bug: onDismiss was an effect dependency, so an inline arrow tore the
    // effect down and set it up again every render, re-running focus-on-open and
    // dragging the panel's scroll position with it.
    const { rerender, getByText, getByTestId } = render(<Host tick={0} />);
    await flushFrame();
    expect(document.activeElement).toBe(getByText('first'));

    // The user moves focus, then something unrelated re-renders the host.
    getByText('second').focus();
    rerender(<Host tick={1} />);
    await flushFrame();

    expect(getByTestId('tick')).toHaveTextContent('1');
    expect(document.activeElement).toBe(getByText('second'));
  });

  it('still dismisses with the newest callback', async () => {
    // The ref must not go stale — Escape has to call the current handler.
    const first = vi.fn();
    const second = vi.fn();
    function Swappable({ handler }: { handler: () => void }) {
      const ref = useRef<HTMLDivElement>(null);
      usePanelA11y({ containerRef: ref, onDismiss: handler });
      return (
        <div ref={ref} data-testid="panel" tabIndex={-1}>
          <button type="button">only</button>
        </div>
      );
    }

    const { rerender, getByTestId } = render(<Swappable handler={first} />);
    await flushFrame();
    rerender(<Swappable handler={second} />);

    fireEvent.keyDown(getByTestId('panel'), { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
