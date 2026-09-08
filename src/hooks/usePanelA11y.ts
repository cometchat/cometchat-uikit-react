import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface UsePanelA11yOptions {
  /** The panel element. Focus is moved into it and cycled within it. */
  containerRef: RefObject<HTMLElement | null>;
  /** Invoked on Escape. Also the panel's close action. */
  onDismiss?: (() => void) | undefined;
  /** Set false while the panel is closed. */
  enabled?: boolean;
  /**
   * Cycle Tab within the panel. Safe to leave on for a dismissible panel because
   * Escape always releases; turn it off for a region the user is meant to tab
   * straight out of.
   */
  trapFocus?: boolean;
}

/**
 * Keyboard contract for a dismissible panel: focus moves in on open, Tab cycles
 * inside, Escape dismisses, and focus returns to whatever opened it.
 *
 * Reads the document from the container's `ownerDocument` rather than the global,
 * so it keeps working when the kit is rendered inside an iframe.
 */
export function usePanelA11y(options: UsePanelA11yOptions): void {
  const { containerRef, onDismiss, enabled = true, trapFocus = true } = options;

  /**
   * Held in a ref, deliberately, so it is NOT an effect dependency.
   *
   * Callers pass an inline arrow (`onClose={() => setOpen(false)}`), which is a new
   * identity on every render. As a dependency that tore the effect down and set it
   * up again on every render of the host — re-running the "focus the first control"
   * step each time and yanking the panel's scroll position with it.
   *
   * Focus-on-open must happen once per open, not once per render.
   */
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const doc = container.ownerDocument;
    // Captured now so focus can be handed back to whatever opened the panel.
    const previouslyFocused = doc.activeElement as HTMLElement | null;

    // Deferred a frame: on the first render the panel is usually still showing a
    // loading state, so the control we want to land on may not exist yet.
    const frame = requestAnimationFrame(() => {
      const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      // preventScroll: the panel is already where it should be. Letting focus()
      // scroll would jump the list to wherever the first control happens to sit.
      (first ?? container).focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onDismissRef.current?.();
        return;
      }

      if (!trapFocus || event.key !== 'Tab') return;

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        // Nothing to land on — keep focus on the panel rather than letting it
        // escape to the page behind.
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = doc.activeElement;

      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('keydown', handleKeyDown);
      // Hand focus back only if nothing else has claimed it. Focus may sit inside
      // the panel, or have already fallen to <body> — React can detach the
      // subtree before this cleanup runs. Either way it is ours to return; any
      // other holder is not, and stealing from it would be worse than doing
      // nothing.
      const active = doc.activeElement;
      const focusIsOursToReturn = !active || active === doc.body || container.contains(active);
      if (focusIsOursToReturn && previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // `onDismiss` is intentionally absent — see onDismissRef above.
  }, [containerRef, enabled, trapFocus]);
}
