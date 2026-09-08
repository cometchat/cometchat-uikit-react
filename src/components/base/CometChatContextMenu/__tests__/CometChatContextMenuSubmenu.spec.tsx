import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChatContextMenu } from '../CometChatContextMenu';
import type { CometChatContextMenuItemData } from '../CometChatContextMenu.types';

/**
 * Both the dropdown and the submenu panel position themselves inside
 * requestAnimationFrame, and the submenu additionally uses hover-intent timers.
 * Fake timers let us flush both deterministically.
 */
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const OPEN_DELAY = 120;
const CLOSE_DELAY = 250;

const onPin = vi.fn();
const onSave = vi.fn();
const onCopy = vi.fn();

const DEFAULT_SUBMENU: CometChatContextMenuItemData[] = [
  { id: 'pin-message', title: 'Pin message', onClick: onPin },
  { id: 'save-message', title: 'Save message', onClick: onSave },
];

/** `null` means "no submenu key at all" — distinct from an empty array. */
function makeItems(
  submenu: CometChatContextMenuItemData[] | null = DEFAULT_SUBMENU
): CometChatContextMenuItemData[] {
  return [
    { id: 'copy', title: 'Copy', onClick: onCopy },
    {
      id: 'organize',
      title: 'Organize',
      onClick: vi.fn(),
      ...(submenu === null ? {} : { submenu }),
    },
  ];
}

/**
 * Flush the panel's positioning rAF. Until it runs the panel is
 * `visibility: hidden`, which zeroes the accessible name of its children and
 * makes name-based queries miss — so every open path needs this.
 */
function flushPositioning() {
  act(() => {
    vi.advanceTimersByTime(32);
  });
}

function openDropdown(
  items: CometChatContextMenuItemData[],
  props: Partial<{ submenuDirection: 'start' | 'end' }> = {}
) {
  const result = render(
    <CometChatContextMenu.Root items={items} topMenuSize={0} placement="bottom" {...props} />
  );
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
  });
  act(() => {
    vi.advanceTimersByTime(16);
  });
  return result;
}

function getRow() {
  return screen.getByRole('menuitem', { name: /Organize/, hidden: true });
}

function openSubmenuByHover() {
  // The wrapper owns the hover-intent region, not the row itself.
  const wrapper = getRow().closest('.cometchat-context-menu__submenu');
  act(() => {
    fireEvent.mouseEnter(wrapper!);
  });
  // First advance fires the hover-intent timer, which flips isOpen. The panel's
  // positioning rAF is only scheduled by the effect that runs after that render,
  // so it needs a second advance to flush.
  act(() => {
    vi.advanceTimersByTime(OPEN_DELAY + 1);
  });
  flushPositioning();
  return wrapper!;
}

/** The fly-out panel, located structurally rather than by role. */
function getPanel(): HTMLElement {
  const panel = document.querySelector<HTMLElement>('.cometchat-context-menu__submenu-panel');
  if (!panel) throw new Error('submenu panel is not open');
  return panel;
}

describe('CometChatContextMenuSubmenu — rendering', () => {
  it('renders an item with a submenu as a disclosure row, not a plain item', () => {
    openDropdown(makeItems());
    const row = getRow();
    expect(row).toHaveAttribute('aria-haspopup', 'menu');
    expect(row).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not render the fly-out until opened', () => {
    openDropdown(makeItems());
    expect(screen.queryByRole('menuitem', { name: 'Pin message', hidden: true })).toBeNull();
  });

  it('renders a plain item when submenu is absent', () => {
    openDropdown(makeItems(null));
    expect(getRow()).not.toHaveAttribute('aria-haspopup');
  });

  it('renders a plain item when submenu is an empty array', () => {
    openDropdown(makeItems([]));
    expect(getRow()).not.toHaveAttribute('aria-haspopup');
  });
});

describe('CometChatContextMenuSubmenu — hover intent', () => {
  it('opens on hover after the intent delay', () => {
    openDropdown(makeItems());
    openSubmenuByHover();
    expect(screen.getByRole('menuitem', { name: 'Pin message', hidden: true })).toBeInTheDocument();
    expect(getRow()).toHaveAttribute('aria-expanded', 'true');
  });

  it('does NOT open before the intent delay elapses', () => {
    openDropdown(makeItems());
    const wrapper = getRow().closest('.cometchat-context-menu__submenu');
    act(() => {
      fireEvent.mouseEnter(wrapper!);
    });
    act(() => {
      vi.advanceTimersByTime(OPEN_DELAY - 20);
    });
    expect(screen.queryByRole('menuitem', { name: 'Pin message', hidden: true })).toBeNull();
  });

  it('cancels the pending open when the pointer leaves before the delay', () => {
    openDropdown(makeItems());
    const wrapper = getRow().closest('.cometchat-context-menu__submenu');
    act(() => {
      fireEvent.mouseEnter(wrapper!);
    });
    act(() => {
      vi.advanceTimersByTime(OPEN_DELAY - 20);
      fireEvent.mouseLeave(wrapper!);
    });
    act(() => {
      vi.advanceTimersByTime(OPEN_DELAY + CLOSE_DELAY + 32);
    });
    expect(screen.queryByRole('menuitem', { name: 'Pin message', hidden: true })).toBeNull();
  });

  it('stays open during the close grace period — diagonal travel to the panel', () => {
    openDropdown(makeItems());
    const wrapper = openSubmenuByHover();
    act(() => {
      fireEvent.mouseLeave(wrapper);
    });
    // Mid-flight: the pointer has left the row but the panel is still reachable.
    act(() => {
      vi.advanceTimersByTime(CLOSE_DELAY - 50);
    });
    expect(screen.getByRole('menuitem', { name: 'Pin message', hidden: true })).toBeInTheDocument();
  });

  it('closes once the close delay fully elapses', () => {
    openDropdown(makeItems());
    const wrapper = openSubmenuByHover();
    act(() => {
      fireEvent.mouseLeave(wrapper);
    });
    act(() => {
      vi.advanceTimersByTime(CLOSE_DELAY + 32);
    });
    expect(screen.queryByRole('menuitem', { name: 'Pin message', hidden: true })).toBeNull();
  });

  it('re-entering during the grace period keeps it open', () => {
    openDropdown(makeItems());
    const wrapper = openSubmenuByHover();
    act(() => {
      fireEvent.mouseLeave(wrapper);
      vi.advanceTimersByTime(CLOSE_DELAY - 50);
      fireEvent.mouseEnter(wrapper);
      vi.advanceTimersByTime(CLOSE_DELAY + 32);
    });
    expect(screen.getByRole('menuitem', { name: 'Pin message', hidden: true })).toBeInTheDocument();
  });
});

describe('CometChatContextMenuSubmenu — click behaviour', () => {
  it('the disclosure row never fires the parent item onClick', () => {
    const parentClick = vi.fn();
    const items: CometChatContextMenuItemData[] = [
      {
        id: 'organize',
        title: 'Organize',
        onClick: parentClick,
        submenu: [{ id: 'pin-message', title: 'Pin message', onClick: onPin }],
      },
    ];
    openDropdown(items);
    act(() => {
      fireEvent.click(getRow());
    });
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('clicking the row toggles the fly-out open, then closed', () => {
    openDropdown(makeItems());
    act(() => {
      fireEvent.click(getRow());
    });
    flushPositioning();
    expect(screen.getByRole('menuitem', { name: 'Pin message', hidden: true })).toBeInTheDocument();

    act(() => {
      fireEvent.click(getRow());
    });
    expect(screen.queryByRole('menuitem', { name: 'Pin message', hidden: true })).toBeNull();
  });

  it('selecting a leaf fires its onClick and closes the whole menu', () => {
    onPin.mockClear();
    openDropdown(makeItems());
    openSubmenuByHover();
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Pin message', hidden: true }));
    });
    expect(onPin).toHaveBeenCalledTimes(1);
    // Whole menu collapsed — the parent row is gone too.
    expect(screen.queryByRole('menuitem', { name: /Organize/, hidden: true })).toBeNull();
  });

  it('a disabled row does not open', () => {
    const items: CometChatContextMenuItemData[] = [
      {
        id: 'organize',
        title: 'Organize',
        onClick: vi.fn(),
        disabled: true,
        submenu: [{ id: 'pin-message', title: 'Pin message', onClick: onPin }],
      },
    ];
    openDropdown(items);
    const row = screen.getByRole('menuitem', { name: /Organize/, hidden: true });
    act(() => {
      fireEvent.click(row);
      vi.advanceTimersByTime(OPEN_DELAY + 32);
    });
    expect(screen.queryByRole('menuitem', { name: 'Pin message', hidden: true })).toBeNull();
  });
});

describe('CometChatContextMenuSubmenu — keyboard', () => {
  it('ArrowRight opens the fly-out in LTR', () => {
    openDropdown(makeItems());
    act(() => {
      fireEvent.keyDown(getRow(), { key: 'ArrowRight' });
    });
    flushPositioning();
    expect(screen.getByRole('menuitem', { name: 'Pin message', hidden: true })).toBeInTheDocument();
  });

  it('Enter opens the fly-out', () => {
    openDropdown(makeItems());
    act(() => {
      fireEvent.keyDown(getRow(), { key: 'Enter' });
    });
    flushPositioning();
    expect(screen.getByRole('menuitem', { name: 'Pin message', hidden: true })).toBeInTheDocument();
  });

  it('ArrowLeft collapses only the fly-out, leaving the parent menu open', () => {
    openDropdown(makeItems());
    openSubmenuByHover();
    const panel = getPanel();
    act(() => {
      fireEvent.keyDown(panel, { key: 'ArrowLeft' });
    });
    expect(screen.queryByRole('menuitem', { name: 'Pin message', hidden: true })).toBeNull();
    // The parent list survives — this is the key distinction from Escape-closes-all.
    expect(screen.getByRole('menuitem', { name: /Organize/, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Copy', hidden: true })).toBeInTheDocument();
  });

  it('Escape inside the fly-out collapses only that level', () => {
    openDropdown(makeItems());
    openSubmenuByHover();
    const panel = getPanel();
    act(() => {
      fireEvent.keyDown(panel, { key: 'Escape' });
    });
    expect(screen.queryByRole('menuitem', { name: 'Pin message', hidden: true })).toBeNull();
    expect(screen.getByRole('menuitem', { name: /Organize/, hidden: true })).toBeInTheDocument();
  });

  it('ArrowDown moves between fly-out children and wraps', () => {
    openDropdown(makeItems());
    openSubmenuByHover();
    const panel = getPanel();
    const pin = screen.getByRole('menuitem', { name: 'Pin message', hidden: true });
    const save = screen.getByRole('menuitem', { name: 'Save message', hidden: true });

    act(() => {
      pin.focus();
      fireEvent.keyDown(panel, { key: 'ArrowDown' });
    });
    expect(document.activeElement).toBe(save);

    act(() => {
      fireEvent.keyDown(panel, { key: 'ArrowDown' });
    });
    expect(document.activeElement).toBe(pin);
  });
});

describe('CometChatContextMenuSubmenu — parent navigation isolation', () => {
  it('parent ArrowDown does not walk into an open fly-out', () => {
    openDropdown(makeItems());
    openSubmenuByHover();

    const dropdown = screen.getAllByRole('menu', { hidden: true })[0];
    const copy = screen.getByRole('menuitem', { name: 'Copy', hidden: true });
    act(() => {
      copy.focus();
      fireEvent.keyDown(dropdown as Element, { key: 'ArrowDown' });
    });

    // Focus lands on the Organize row — never on a fly-out child.
    expect(document.activeElement).toBe(getRow());
    expect(document.activeElement).not.toBe(
      screen.getByRole('menuitem', { name: 'Pin message', hidden: true })
    );
  });
});

describe('CometChatContextMenuSubmenu — direction', () => {
  it('accepts submenuDirection="start" without error', () => {
    openDropdown(makeItems(), { submenuDirection: 'start' });
    openSubmenuByHover();
    const panel = getPanel();
    expect(panel).toBeInTheDocument();
    expect(panel.style.left).not.toBe('');
  });

  it('accepts submenuDirection="end" without error', () => {
    openDropdown(makeItems(), { submenuDirection: 'end' });
    openSubmenuByHover();
    const panel = getPanel();
    expect(panel).toBeInTheDocument();
    expect(panel.style.left).not.toBe('');
  });
});
