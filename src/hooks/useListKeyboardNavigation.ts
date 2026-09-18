import { useCallback } from 'react';

/**
 * Options for {@link useListKeyboardNavigation}.
 */
export interface UseListKeyboardNavigationOptions {
  /**
   * CSS selector matching the focusable list items inside the container.
   * Default: `[role="option"]`.
   */
  itemSelector?: string;
  /**
   * Wrap focus from last→first (and first→last) at the ends. When false
   * (WCAG listbox default), focus clamps at the first/last item.
   */
  loop?: boolean;
  /**
   * Whether keyboard navigation is active. When false the handler is a no-op.
   * Default: true.
   */
  enabled?: boolean;
}

/**
 * Arrow-key focus navigation for list components (WCAG listbox/list pattern).
 *
 * Returns an `onKeyDown` handler to attach to the list container. ArrowDown /
 * ArrowUp move focus between the container's focusable items, and Home / End
 * jump to the first / last item. Because the handler is attached to the
 * container, it also catches key events bubbling from a focused item (or a
 * focusable child of an item, e.g. a checkbox).
 *
 * The items keep their own `tabIndex`, so Tab still works; the arrows simply
 * move DOM focus between them. Enter/Space activation stays with each item.
 */
export function useListKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseListKeyboardNavigationOptions = {}
): (e: React.KeyboardEvent) => void {
  const { itemSelector = '[role="option"]', loop = false, enabled = true } = options;

  return useCallback(
    (e: React.KeyboardEvent) => {
      // Skip events another widget already handled (a consumer itemView's own
      // dropdown) and modified arrows (e.g. Alt+ArrowDown opens a native select).
      if (!enabled || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const { key } = e;
      if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') return;

      const container = containerRef.current;
      if (!container) return;

      const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
      if (items.length === 0) return;

      // Resolve the item that currently holds focus. Focus may sit on a child of
      // an item (e.g. a checkbox), so walk up to the nearest item element.
      const active = container.ownerDocument.activeElement as HTMLElement | null;
      const currentItem = active?.closest<HTMLElement>(itemSelector) ?? null;
      const currentIndex = currentItem ? items.indexOf(currentItem) : -1;

      let nextIndex: number;
      switch (key) {
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = items.length - 1;
          break;
        case 'ArrowDown':
          nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
          if (nextIndex >= items.length) nextIndex = loop ? 0 : items.length - 1;
          break;
        default: // ArrowUp
          nextIndex = currentIndex === -1 ? items.length - 1 : currentIndex - 1;
          if (nextIndex < 0) nextIndex = loop ? items.length - 1 : 0;
          break;
      }

      const target = items[nextIndex];
      if (target) {
        e.preventDefault();
        // Overlay roots (action sheet, dialog) run their own arrow-key focus
        // walk on an ancestor and do not check defaultPrevented, so without
        // this the focus moves twice for one keypress.
        e.stopPropagation();
        target.focus();
      }
    },
    [containerRef, itemSelector, loop, enabled]
  );
}
