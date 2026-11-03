/**
 * Unit tests for the flat <CometChatUsers /> API: plain props go straight to
 * Root's own layout, while convenience views build the layout from the parts
 * (header, search, selected preview, state views and the item slots).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { covers } from '../../../testing/covers';

const mocks = vi.hoisted(() => ({
  ctx: { hideSearch: false, showSelectedUsersPreview: false },
  rootProps: undefined as Record<string, unknown> | undefined,
  listItemView: undefined as ((user: unknown) => unknown) | undefined,
}));

const { part } = vi.hoisted(() => ({
  part:
    (name: string) =>
    ({ children }: { children?: React.ReactNode }) => <div data-testid={name}>{children}</div>,
}));

vi.mock('../CometChatUsers.context', () => ({ useCometChatUsersContext: () => mocks.ctx }));
vi.mock('../CometChatUsersRoot', () => ({
  CometChatUsersRoot: ({ children, ...props }: { children?: React.ReactNode }) => {
    mocks.rootProps = props;
    return <div data-testid="root">{children ?? 'root default layout'}</div>;
  },
}));
vi.mock('../CometChatUsersHeader', () => ({ CometChatUsersHeader: part('header') }));
vi.mock('../CometChatUsersSearchBar', () => ({ CometChatUsersSearchBar: part('search') }));
vi.mock('../CometChatUsersSelectedPreview', () => ({
  CometChatUsersSelectedPreview: part('selected-preview'),
}));
vi.mock('../CometChatUsersLoadingState', () => ({ CometChatUsersLoadingState: part('loading') }));
vi.mock('../CometChatUsersErrorState', () => ({ CometChatUsersErrorState: part('error') }));
vi.mock('../CometChatUsersEmptyState', () => ({ CometChatUsersEmptyState: part('empty') }));
vi.mock('../CometChatUsersSectionHeader', () => ({
  CometChatUsersSectionHeader: part('section-header'),
}));
vi.mock('../CometChatUsersList', () => ({
  CometChatUsersList: ({ itemView }: { itemView?: (user: unknown) => React.ReactNode }) => {
    mocks.listItemView = itemView;
    return <div data-testid="list" />;
  },
}));
vi.mock('../CometChatUsersItem', () => ({
  CometChatUsersItem: (props: Record<string, React.ReactNode>) => (
    <div data-testid="item">
      {props.leadingView}|{props.titleView}|{props.subtitleView}|{props.trailingView}
    </div>
  ),
}));

import { CometChatUsers } from '../CometChatUsers';
import { CometChatUsersRoot } from '../CometChatUsersRoot';
import { CometChatUsersList } from '../CometChatUsersList';

const alice = { getUid: () => 'alice', getName: () => 'Alice' } as unknown as CometChat.User;

function renderItem() {
  const itemView = mocks.listItemView;
  if (!itemView) throw new Error('the list was not given an itemView');
  return render(<>{itemView(alice)}</>);
}

describe('CometChatUsers (flat API)', () => {
  beforeEach(() => {
    mocks.ctx = { hideSearch: false, showSelectedUsersPreview: false };
    mocks.rootProps = undefined;
    mocks.listItemView = undefined;
  });

  it('without view props, lets Root render its own layout and passes the props through', () => {
    const onItemClick = vi.fn();
    render(<CometChatUsers onItemClick={onItemClick} selectionMode="multiple" />);
    expect(screen.getByTestId('root')).toHaveTextContent('root default layout');
    expect(mocks.rootProps).toMatchObject({ onItemClick, selectionMode: 'multiple' });
  });

  it('with a view prop, renders the default parts inside Root', () => {
    covers('CometChatUsers.emptyView', 'custom');
    render(<CometChatUsers emptyView={<span>nobody here</span>} />);
    for (const id of ['header', 'search', 'loading', 'error', 'list']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(screen.getByTestId('empty')).toHaveTextContent('nobody here');
    expect(screen.queryByTestId('selected-preview')).toBeNull();
  });

  it('custom header, loading and error views replace or fill the defaults', () => {
    covers('CometChatUsers.headerView', 'custom');
    covers('CometChatUsers.loadingView', 'custom');
    covers('CometChatUsers.errorView', 'custom');
    render(
      <CometChatUsers
        headerView={<b>my header</b>}
        loadingView={<i>wait</i>}
        errorView={<i>broken</i>}
      />
    );
    expect(screen.queryByTestId('header')).toBeNull();
    expect(screen.getByText('my header')).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toHaveTextContent('wait');
    expect(screen.getByTestId('error')).toHaveTextContent('broken');
  });

  it('follows the context for search and the selected-users preview', () => {
    mocks.ctx = { hideSearch: true, showSelectedUsersPreview: true };
    render(<CometChatUsers headerView={null} />);
    expect(screen.queryByTestId('search')).toBeNull();
    expect(screen.getByTestId('selected-preview')).toBeInTheDocument();
  });

  it('a custom item view is handed to the list as is', () => {
    covers('CometChatUsers.itemView', 'custom');
    const itemView = (user: CometChat.User) => <span>row {user.getName()}</span>;
    render(<CometChatUsers itemView={itemView} />);
    expect(mocks.listItemView).toBe(itemView);
  });

  it('slot views build each row from the default item', () => {
    covers('CometChatUsers.leadingView', 'custom');
    covers('CometChatUsers.titleView', 'custom');
    covers('CometChatUsers.subtitleView', 'custom');
    covers('CometChatUsers.trailingView', 'custom');
    render(
      <CometChatUsers
        leadingView={u => `L-${u.getUid()}`}
        titleView={u => `T-${u.getUid()}`}
        subtitleView={u => `S-${u.getUid()}`}
        trailingView={u => `R-${u.getUid()}`}
      />
    );
    renderItem();
    expect(screen.getByTestId('item')).toHaveTextContent('L-alice|T-alice|S-alice|R-alice');
  });

  it('a single slot view leaves the other slots empty', () => {
    render(<CometChatUsers subtitleView={u => `S-${u.getUid()}`} />);
    renderItem();
    expect(screen.getByTestId('item')).toHaveTextContent('||S-alice|');
  });

  it('without item or slot views, the list keeps its own rows', () => {
    render(<CometChatUsers emptyView={<span />} />);
    expect(mocks.listItemView).toBeUndefined();
  });

  it('exposes the compound parts', () => {
    expect(CometChatUsers.Root).toBe(CometChatUsersRoot);
    expect(CometChatUsers.List).toBe(CometChatUsersList);
    expect(CometChatUsers.SelectedPreview).toBeDefined();
    expect(CometChatUsers.SectionHeader).toBeDefined();
  });
});
