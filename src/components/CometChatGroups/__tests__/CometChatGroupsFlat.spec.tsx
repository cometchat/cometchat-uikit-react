/**
 * Unit tests for the flat <CometChatGroups /> API: plain props go straight to
 * Root's own layout, while convenience views build the layout from the parts,
 * showing the state view that matches the fetch state and the item slots.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { covers } from '../../../testing/covers';

const { part, mocks } = vi.hoisted(() => ({
  part:
    (name: string) =>
    ({ children }: { children?: React.ReactNode }) => <div data-testid={name}>{children}</div>,
  mocks: {
    ctx: { fetchState: 'loaded', groups: [] as unknown[], hideSearch: false },
    rootProps: undefined as Record<string, unknown> | undefined,
    listItemView: undefined as ((group: unknown) => unknown) | undefined,
  },
}));

vi.mock('../CometChatGroups.context', () => ({ useCometChatGroupsContext: () => mocks.ctx }));
vi.mock('../CometChatGroupsRoot', () => ({
  CometChatGroupsRoot: ({ children, ...props }: { children?: React.ReactNode }) => {
    mocks.rootProps = props;
    return <div data-testid="root">{children ?? 'root default layout'}</div>;
  },
}));
vi.mock('../CometChatGroupsHeader', () => ({ CometChatGroupsHeader: part('header') }));
vi.mock('../CometChatGroupsSearchBar', () => ({ CometChatGroupsSearchBar: part('search') }));
vi.mock('../CometChatGroupsLoadingState', () => ({ CometChatGroupsLoadingState: part('loading') }));
vi.mock('../CometChatGroupsErrorState', () => ({ CometChatGroupsErrorState: part('error') }));
vi.mock('../CometChatGroupsEmptyState', () => ({ CometChatGroupsEmptyState: part('empty') }));
vi.mock('../CometChatGroupsList', () => ({
  CometChatGroupsList: ({ itemView }: { itemView?: (group: unknown) => React.ReactNode }) => {
    mocks.listItemView = itemView;
    return <div data-testid="list" />;
  },
}));
vi.mock('../CometChatGroupsItem', () => ({
  CometChatGroupsItem: (props: Record<string, React.ReactNode>) => (
    <div data-testid="item">
      {props.leadingView}|{props.titleView}|{props.subtitleView}|{props.trailingView}
    </div>
  ),
}));

import { CometChatGroups } from '../CometChatGroups';
import { CometChatGroupsRoot } from '../CometChatGroupsRoot';

const designers = {
  getGuid: () => 'design',
  getName: () => 'Designers',
} as unknown as CometChat.Group;
const STATE_PARTS = ['loading', 'error', 'empty', 'list'];

const visibleStateParts = () => STATE_PARTS.filter(id => screen.queryByTestId(id) !== null);

describe('CometChatGroups (flat API)', () => {
  beforeEach(() => {
    mocks.ctx = { fetchState: 'loaded', groups: [], hideSearch: false };
    mocks.rootProps = undefined;
    mocks.listItemView = undefined;
  });

  it('without view props, lets Root render its own layout and passes the props through', () => {
    const onItemClick = vi.fn();
    render(<CometChatGroups onItemClick={onItemClick} />);
    expect(screen.getByTestId('root')).toHaveTextContent('root default layout');
    expect(mocks.rootProps).toMatchObject({ onItemClick });
  });

  it.each([
    ['loading', ['loading']],
    ['error', ['error']],
    ['empty', ['empty']],
    ['loaded', ['list']],
  ])('while %s, shows only the matching view', (fetchState, expected) => {
    mocks.ctx = { ...mocks.ctx, fetchState };
    render(<CometChatGroups headerView={<b>header</b>} />);
    expect(visibleStateParts()).toEqual(expected);
  });

  it('keeps showing the list while loading more groups', () => {
    mocks.ctx = { ...mocks.ctx, fetchState: 'loading', groups: [designers] };
    render(<CometChatGroups headerView={<b>header</b>} />);
    expect(visibleStateParts()).toEqual(['loading', 'list']);
  });

  it('custom state views fill the default containers', () => {
    covers('CometChatGroups.loadingView', 'custom');
    covers('CometChatGroups.errorView', 'custom');
    covers('CometChatGroups.emptyView', 'custom');
    const views = { loadingView: <i>wait</i>, errorView: <i>broken</i>, emptyView: <i>none</i> };
    for (const [fetchState, id, text] of [
      ['loading', 'loading', 'wait'],
      ['error', 'error', 'broken'],
      ['empty', 'empty', 'none'],
    ] as const) {
      mocks.ctx = { ...mocks.ctx, fetchState };
      const { unmount } = render(<CometChatGroups {...views} />);
      expect(screen.getByTestId(id)).toHaveTextContent(text);
      unmount();
    }
  });

  it('a custom header replaces the default, and search follows the context', () => {
    covers('CometChatGroups.headerView', 'custom');
    mocks.ctx = { ...mocks.ctx, hideSearch: true };
    render(<CometChatGroups headerView={<b>my header</b>} />);
    expect(screen.queryByTestId('header')).toBeNull();
    expect(screen.getByText('my header')).toBeInTheDocument();
    expect(screen.queryByTestId('search')).toBeNull();
  });

  it('shows the default header and search when only a state view is customised', () => {
    render(<CometChatGroups emptyView={<i>none</i>} />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('search')).toBeInTheDocument();
    expect(mocks.listItemView).toBeUndefined();
  });

  it('a custom item view is handed to the list as is', () => {
    covers('CometChatGroups.itemView', 'custom');
    const itemView = (group: CometChat.Group) => <span>{group.getName()}</span>;
    render(<CometChatGroups itemView={itemView} />);
    expect(mocks.listItemView).toBe(itemView);
  });

  it('slot views build each row from the default item', () => {
    covers('CometChatGroups.titleView', 'custom');
    covers('CometChatGroups.trailingView', 'custom');
    render(
      <CometChatGroups titleView={g => `T-${g.getGuid()}`} trailingView={g => `R-${g.getGuid()}`} />
    );
    const itemView = mocks.listItemView;
    if (!itemView) throw new Error('the list was not given an itemView');
    render(<>{itemView(designers)}</>);
    expect(screen.getByTestId('item')).toHaveTextContent('|T-design||R-design');
  });

  it('exposes the compound parts', () => {
    expect(CometChatGroups.Root).toBe(CometChatGroupsRoot);
    for (const name of [
      'List',
      'Item',
      'Header',
      'SearchBar',
      'EmptyState',
      'ErrorState',
      'LoadingState',
    ] as const) {
      expect(CometChatGroups[name]).toBeDefined();
    }
  });
});
