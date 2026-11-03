/**
 * The public props of <CometChatGroups />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. Only the SDK is mocked.
 *
 * The state, header, item and title/trailing views are covered in CometChatGroupsFlat.spec.tsx,
 * `children` in CometChatGroupsUI.spec.tsx.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroups } from '../CometChatGroups';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  fetchNext: vi.fn(),
  setLimit: vi.fn(),
  setSearchKeyword: vi.fn(),
}));

// jsdom has no IntersectionObserver (used by the list's infinite scroll).
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() }))
);

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    GroupsRequestBuilder: vi.fn(function (this: Record<string, unknown>) {
      this.setLimit = sdk.setLimit.mockReturnValue(this);
      this.setSearchKeyword = sdk.setSearchKeyword.mockReturnValue(this);
      this.build = () => ({ fetchNext: sdk.fetchNext });
    }),
    GroupListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    getLoggedinUser: vi.fn().mockResolvedValue({ getUid: () => 'me' }),
    GroupType: { Public: 'public', Private: 'private', Password: 'password' },
  },
}));

function group(guid: string, name: string, type = 'public') {
  return {
    getGuid: () => guid,
    getName: () => name,
    getIcon: () => '',
    getType: () => type,
    getMembersCount: () => 3,
    getHasJoined: () => true,
  } as unknown as CometChat.Group;
}

const design = group('design', 'Design', 'private');
const sales = group('sales', 'Sales');

/** A request builder an app passes in, returning its own groups. */
function appBuilder(groups: CometChat.Group[]) {
  const fetchNext = vi.fn().mockResolvedValue(groups);
  const builder = { setSearchKeyword: vi.fn(), build: vi.fn(() => ({ fetchNext })) };
  builder.setSearchKeyword.mockReturnValue(builder);
  return builder;
}
const asBuilder = (b: ReturnType<typeof appBuilder>) => b as unknown as CometChat.GroupsRequestBuilder;

const row = (name: string) => screen.getByRole('option', { name: new RegExp(name) });
const loaded = () => screen.findByRole('option', { name: /Design/ });

beforeEach(() => {
  sdk.fetchNext.mockReset().mockResolvedValue([design, sales]);
  sdk.setLimit.mockClear();
  sdk.setSearchKeyword.mockClear();
});

describe('CometChatGroups props', () => {
  describe('request builders and search', () => {
    it('without a builder, fetches 30 groups at a time with no search keyword', async () => {
      covers('CometChatGroups.groupsRequestBuilder', 'default');
      covers('CometChatGroups.searchKeyword', 'default');
      render(<CometChatGroups />);
      await loaded();
      expect(sdk.setLimit).toHaveBeenCalledWith(30);
      expect(sdk.setSearchKeyword).not.toHaveBeenCalled();
    });

    it("an app's groups builder is the one fetched from", async () => {
      covers('CometChatGroups.groupsRequestBuilder', 'used');
      const builder = appBuilder([group('ops', 'Ops')]);
      render(<CometChatGroups groupsRequestBuilder={asBuilder(builder)} />);
      expect(await screen.findByRole('option', { name: /Ops/ })).toBeInTheDocument();
      expect(builder.build).toHaveBeenCalled();
      expect(sdk.fetchNext).not.toHaveBeenCalled();
    });

    it('searchKeyword filters the first fetch', async () => {
      covers('CometChatGroups.searchKeyword', 'set');
      covers('CometChatGroups.searchRequestBuilder', 'default');
      render(<CometChatGroups searchKeyword="de" />);
      await loaded();
      expect(sdk.setSearchKeyword).toHaveBeenCalledWith('de');
    });

    it("a search uses the app's search builder", async () => {
      covers('CometChatGroups.searchRequestBuilder', 'used');
      const search = appBuilder([group('dev', 'Developers')]);
      render(<CometChatGroups searchKeyword="dev" searchRequestBuilder={asBuilder(search)} />);
      expect(await screen.findByRole('option', { name: /Developers/ })).toBeInTheDocument();
      expect(search.setSearchKeyword).toHaveBeenCalledWith('dev');
      expect(sdk.fetchNext).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('onItemClick gets the clicked group', async () => {
      covers('CometChatGroups.onItemClick', 'called');
      const onItemClick = vi.fn();
      render(<CometChatGroups onItemClick={onItemClick} />);
      fireEvent.click(await loaded());
      expect(onItemClick).toHaveBeenCalledWith(design);
    });

    it('onSelect reports a selection and a deselection', async () => {
      covers('CometChatGroups.onSelect', 'called');
      const onSelect = vi.fn();
      render(<CometChatGroups selectionMode="multiple" onSelect={onSelect} />);
      fireEvent.click(await loaded());
      expect(onSelect).toHaveBeenLastCalledWith(design, true);
      fireEvent.click(row('Design'));
      expect(onSelect).toHaveBeenLastCalledWith(design, false);
    });

    it('onError gets the error when fetching fails', async () => {
      covers('CometChatGroups.onError', 'called');
      const error = { code: 'ERR', message: 'no network' };
      sdk.fetchNext.mockRejectedValue(error);
      const onError = vi.fn();
      render(<CometChatGroups onError={onError} />);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('onEmpty fires when the first fetch finds no groups', async () => {
      covers('CometChatGroups.onEmpty', 'called');
      sdk.fetchNext.mockResolvedValue([]);
      const onEmpty = vi.fn();
      render(<CometChatGroups onEmpty={onEmpty} />);
      await waitFor(() => {
        expect(onEmpty).toHaveBeenCalled();
      });
    });
  });

  describe('selection', () => {
    it('by default rows have no checkbox or radio button', async () => {
      covers('CometChatGroups.selectionMode', 'default', 'none');
      for (const props of [{ selectionMode: 'none' as const }, {}]) {
        const view = render(<CometChatGroups {...props} />);
        await loaded();
        expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        view.unmount();
      }
    });

    it('single gives each row a radio button, and picking another moves the selection', async () => {
      covers('CometChatGroups.selectionMode', 'single');
      render(<CometChatGroups selectionMode="single" />);
      fireEvent.click(await loaded());
      expect(within(row('Design')).getByRole('radio')).toBeChecked();
      fireEvent.click(row('Sales'));
      expect(within(row('Design')).getByRole('radio')).not.toBeChecked();
      expect(within(row('Sales')).getByRole('radio')).toBeChecked();
    });

    it('multiple gives each row a checkbox and keeps every pick', async () => {
      covers('CometChatGroups.selectionMode', 'multiple');
      render(<CometChatGroups selectionMode="multiple" />);
      fireEvent.click(await loaded());
      fireEvent.click(row('Sales'));
      expect(within(row('Design')).getByRole('checkbox')).toBeChecked();
      expect(within(row('Sales')).getByRole('checkbox')).toBeChecked();
    });

    it('activeGroup highlights that row; by default none is', async () => {
      covers('CometChatGroups.activeGroup', 'set', 'default');
      const { unmount } = render(<CometChatGroups activeGroup={sales} />);
      await loaded();
      expect(row('Sales')).toHaveClass('cometchat-groups__item--active');
      expect(row('Design')).not.toHaveClass('cometchat-groups__item--active');
      unmount();

      const { container } = render(<CometChatGroups />);
      await loaded();
      expect(container.querySelector('.cometchat-groups__item--active')).toBeNull();
    });
  });

  describe('display', () => {
    it('hideSearch removes the search box; it is shown by default', async () => {
      covers('CometChatGroups.hideSearch', 'true', 'false', 'default');
      const { unmount } = render(<CometChatGroups hideSearch />);
      await loaded();
      expect(screen.queryByRole('searchbox')).toBeNull();
      unmount();
      for (const props of [{ hideSearch: false }, {}]) {
        const view = render(<CometChatGroups {...props} />);
        expect(await screen.findByRole('searchbox')).toBeInTheDocument();
        view.unmount();
      }
    });

    it("hideGroupType removes the private group's badge; shown by default", async () => {
      covers('CometChatGroups.hideGroupType', 'true', 'false', 'default');
      const badges = (container: HTMLElement) => container.querySelectorAll('.cometchat-groups__item-type-badge').length;
      let view = render(<CometChatGroups hideGroupType />);
      await loaded();
      expect(badges(view.container)).toBe(0);
      view.unmount();
      for (const props of [{ hideGroupType: false }, {}]) {
        view = render(<CometChatGroups {...props} />);
        await loaded();
        expect(badges(view.container)).toBe(1);
        view.unmount();
      }
    });

    it('showScrollbar shows the list scrollbar; hidden by default', async () => {
      covers('CometChatGroups.showScrollbar', 'true', 'false', 'default');
      for (const [props, hidden] of [
        [{ showScrollbar: true }, false],
        [{ showScrollbar: false }, true],
        [{}, true],
      ] as const) {
        const view = render(<CometChatGroups {...props} />);
        await loaded();
        expect(screen.getByRole('listbox').classList.contains('cometchat-groups__list--hide-scrollbar')).toBe(hidden);
        view.unmount();
      }
    });

    it("options adds a menu to each row whose items act on that row's group; no menu by default", async () => {
      covers('CometChatGroups.options', 'set', 'default');
      const onClick = vi.fn();
      const { unmount } = render(<CometChatGroups options={() => [{ id: 'leave', title: 'Leave', onClick }]} />);
      await loaded();
      fireEvent.click(within(row('Sales')).getByRole('button', { name: /more/i }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Leave' }));
      expect(onClick).toHaveBeenCalledWith(sales);
      unmount();

      render(<CometChatGroups />);
      await loaded();
      expect(within(row('Sales')).queryByRole('button', { name: /more/i })).toBeNull();
    });

    it('leadingView and subtitleView replace the avatar and the member count', async () => {
      covers('CometChatGroups.leadingView', 'custom');
      covers('CometChatGroups.subtitleView', 'custom');
      const { container } = render(
        <CometChatGroups leadingView={g => <b>lead-{g.getGuid()}</b>} subtitleView={g => <i>sub-{g.getGuid()}</i>} />
      );
      await loaded();
      expect(row('Design')).toHaveTextContent('lead-design');
      expect(row('Design')).toHaveTextContent('sub-design');
      expect(container.querySelector('.cometchat-groups__item-avatar')).toBeNull();
      expect(row('Design')).not.toHaveTextContent(/3 /);
    });
  });
});
