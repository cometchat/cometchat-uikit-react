/**
 * Tests for the mentions dropdown's keyboard-navigation controller.
 *
 * The child list components (CometChatGroupMembers / CometChatUsers) are mocked
 * to render simple role="option" rows so we can drive the imperative handle
 * (moveHighlight / selectHighlighted) exactly as the composer's editor does.
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CometChatMessageComposerMentionsList } from '../CometChatMessageComposerMentionsList';
import type { CometChatMessageComposerMentionsListHandle } from '../CometChatMessageComposerMentionsList';

const HIGHLIGHT_ATTR = 'data-cc-mention-active';

const members = [
  { getUid: () => 'u1', getName: () => 'Alice' },
  { getUid: () => 'u2', getName: () => 'Bob' },
  { getUid: () => 'u3', getName: () => 'Carol' },
];

// Render each member as a role="option" row that mirrors the real list's click.
vi.mock('../../CometChatGroupMembers/CometChatGroupMembers', () => ({
  CometChatGroupMembers: ({ onItemClick }: { onItemClick: (m: unknown) => void }) => (
    <div role="listbox">
      {members.map(m => (
        <div
          key={m.getUid()}
          role="option"
          aria-selected={false}
          tabIndex={0}
          onClick={() => onItemClick(m)}
          onKeyDown={() => onItemClick(m)}
        >
          {m.getName()}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../CometChatUsers/CometChatUsers', () => ({
  CometChatUsers: () => null,
}));

vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: {
    Root: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Image: () => null,
    Initials: () => null,
  },
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (k: string) => k }),
}));

const fakeGroup = {
  getName: () => 'My Group',
  getIcon: () => '',
} as never;

function renderList(
  handle: React.RefObject<CometChatMessageComposerMentionsListHandle>,
  extraProps: Partial<React.ComponentProps<typeof CometChatMessageComposerMentionsList>> = {}
) {
  return render(
    <CometChatMessageComposerMentionsList
      ref={handle}
      isOpen
      searchKeyword=""
      group={fakeGroup}
      // @all disabled so options are just the three members
      disableMentionAll
      onItemClick={onItemClick}
      {...extraProps}
    />
  );
}

let onItemClick: ReturnType<typeof vi.fn>;

describe('CometChatMessageComposerMentionsList keyboard navigation', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView.
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    cleanup();
    onItemClick = vi.fn();
  });

  function options(container: HTMLElement) {
    return Array.from(container.querySelectorAll('[role="option"]')) as HTMLElement[];
  }

  it('highlights the first option when the dropdown opens', () => {
    const ref = React.createRef<CometChatMessageComposerMentionsListHandle>();
    const { container } = renderList(ref);

    const [first, second] = options(container);
    expect(first?.getAttribute(HIGHLIGHT_ATTR)).toBe('true');
    expect(second?.getAttribute(HIGHLIGHT_ATTR)).toBeNull();
  });

  it('moveHighlight(1) advances and wraps around', () => {
    const ref = React.createRef<CometChatMessageComposerMentionsListHandle>();
    const { container } = renderList(ref);
    const opts = options(container);

    ref.current?.moveHighlight(1); // 0 -> 1
    expect(opts[1]?.getAttribute(HIGHLIGHT_ATTR)).toBe('true');
    expect(opts[0]?.getAttribute(HIGHLIGHT_ATTR)).toBeNull();

    ref.current?.moveHighlight(1); // 1 -> 2
    ref.current?.moveHighlight(1); // 2 -> 0 (wrap)
    expect(opts[0]?.getAttribute(HIGHLIGHT_ATTR)).toBe('true');
    expect(opts[2]?.getAttribute(HIGHLIGHT_ATTR)).toBeNull();
  });

  it('moveHighlight(-1) wraps to the last option', () => {
    const ref = React.createRef<CometChatMessageComposerMentionsListHandle>();
    const { container } = renderList(ref);
    const opts = options(container);

    ref.current?.moveHighlight(-1); // 0 -> last (wrap)
    expect(opts[opts.length - 1]?.getAttribute(HIGHLIGHT_ATTR)).toBe('true');
  });

  it('selectHighlighted clicks the highlighted option', () => {
    const ref = React.createRef<CometChatMessageComposerMentionsListHandle>();
    renderList(ref);

    ref.current?.moveHighlight(1); // highlight Bob
    const selected = ref.current?.selectHighlighted();

    expect(selected).toBe(true);
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(members[1]);
  });

  it('selectHighlighted defaults to the first option when none was moved', () => {
    const ref = React.createRef<CometChatMessageComposerMentionsListHandle>();
    renderList(ref);

    ref.current?.selectHighlighted();
    expect(onItemClick).toHaveBeenCalledWith(members[0]);
  });

  // --- aria-activedescendant wiring (review follow-up) ---

  it('gives the highlighted option an id and reports it for aria-activedescendant', () => {
    const ref = React.createRef<CometChatMessageComposerMentionsListHandle>();
    const onHighlightChange = vi.fn();
    const { container } = renderList(ref, { onHighlightChange });
    const opts = options(container);

    // Opening highlights the first option and reports its id.
    expect(opts[0]?.id).toBeTruthy();
    expect(onHighlightChange).toHaveBeenLastCalledWith(opts[0]?.id);

    ref.current?.moveHighlight(1);
    expect(opts[1]?.id).toBeTruthy();
    expect(opts[1]?.id).not.toBe(opts[0]?.id);
    expect(onHighlightChange).toHaveBeenLastCalledWith(opts[1]?.id);
  });

  it('reports null when the dropdown closes', () => {
    const ref = React.createRef<CometChatMessageComposerMentionsListHandle>();
    const onHighlightChange = vi.fn();
    const { rerender } = renderList(ref, { onHighlightChange });

    rerender(
      <CometChatMessageComposerMentionsList
        ref={ref}
        isOpen={false}
        searchKeyword=""
        group={fakeGroup}
        disableMentionAll
        onItemClick={onItemClick}
        onHighlightChange={onHighlightChange}
      />
    );

    expect(onHighlightChange).toHaveBeenLastCalledWith(null);
  });

  it('uses the listbox id given by the composer', () => {
    const ref = React.createRef<CometChatMessageComposerMentionsListHandle>();
    const { container } = renderList(ref, { listboxId: 'composer-1-listbox' });

    expect(container.querySelector('.cometchat-message-composer__mentions-list')?.id).toBe(
      'composer-1-listbox'
    );
    expect(options(container)[0]?.id).toContain('composer-1-listbox');
  });

  it('two lists without an explicit id do not share one', () => {
    const refA = React.createRef<CometChatMessageComposerMentionsListHandle>();
    const refB = React.createRef<CometChatMessageComposerMentionsListHandle>();
    const { container: a } = renderList(refA);
    const { container: b } = renderList(refB);

    const idA = a.querySelector('.cometchat-message-composer__mentions-list')?.id;
    const idB = b.querySelector('.cometchat-message-composer__mentions-list')?.id;
    expect(idA).toBeTruthy();
    expect(idA).not.toBe(idB);
  });
});
