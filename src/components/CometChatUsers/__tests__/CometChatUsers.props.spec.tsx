/**
 * The public props of <CometChatUsers />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. Only the SDK is mocked.
 *
 * View props are covered in CometChatUsersFlat.spec.tsx, `autoFocus` in
 * CometChatUsersRoot.autofocus.spec.tsx.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUsers } from '../CometChatUsers';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
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
    UsersRequestBuilder: vi.fn(function (this: Record<string, unknown>) {
      this.setLimit = sdk.setLimit.mockReturnValue(this);
      this.setSearchKeyword = sdk.setSearchKeyword.mockReturnValue(this);
      this.build = () => ({ fetchNext: sdk.fetchNext });
    }),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

function user(uid: string, name: string) {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => 'online',
    getAvatar: () => '',
    getBlockedByMe: () => false,
    getHasBlockedMe: () => false,
  } as unknown as CometChat.User;
}

const alice = user('zz-alice', 'Alice');
const bob = user('yy-bob', 'Bob');

/** A request builder an app passes in, returning its own users. */
function appBuilder(users: CometChat.User[]) {
  const fetchNext = vi.fn().mockResolvedValue(users);
  const builder = { setSearchKeyword: vi.fn(), build: vi.fn(() => ({ fetchNext })) };
  builder.setSearchKeyword.mockReturnValue(builder);
  return builder;
}
const asBuilder = (b: ReturnType<typeof appBuilder>) => b as unknown as CometChat.UsersRequestBuilder;

const row = (name: string) => screen.getByRole('option', { name: new RegExp(name) });
const loaded = () => screen.findByRole('option', { name: /Alice/ });

beforeEach(() => {
  sdk.fetchNext.mockReset().mockResolvedValue([alice, bob]);
  sdk.setLimit.mockClear();
  sdk.setSearchKeyword.mockClear();
});

describe('CometChatUsers props', () => {
  describe('request builders and search', () => {
    it('without a builder, fetches 30 users at a time with no search keyword', async () => {
      covers('CometChatUsers.usersRequestBuilder', 'default');
      covers('CometChatUsers.searchKeyword', 'default');
      render(<CometChatUsers />);
      await loaded();
      expect(sdk.setLimit).toHaveBeenCalledWith(30);
      expect(sdk.setSearchKeyword).not.toHaveBeenCalled();
    });

    it("an app's users builder is the one fetched from", async () => {
      covers('CometChatUsers.usersRequestBuilder', 'used');
      const builder = appBuilder([user('c', 'Carol')]);
      render(<CometChatUsers usersRequestBuilder={asBuilder(builder)} />);
      expect(await screen.findByRole('option', { name: /Carol/ })).toBeInTheDocument();
      expect(builder.build).toHaveBeenCalled();
      expect(sdk.fetchNext).not.toHaveBeenCalled();
    });

    it('searchKeyword filters the first fetch', async () => {
      covers('CometChatUsers.searchKeyword', 'set');
      covers('CometChatUsers.searchRequestBuilder', 'default');
      render(<CometChatUsers searchKeyword="al" />);
      await loaded();
      expect(sdk.setSearchKeyword).toHaveBeenCalledWith('al');
    });

    it("a search uses the app's search builder", async () => {
      covers('CometChatUsers.searchRequestBuilder', 'used');
      const search = appBuilder([user('d', 'Dana')]);
      render(<CometChatUsers searchKeyword="da" searchRequestBuilder={asBuilder(search)} />);
      expect(await screen.findByRole('option', { name: /Dana/ })).toBeInTheDocument();
      expect(search.setSearchKeyword).toHaveBeenCalledWith('da');
      expect(sdk.fetchNext).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('onItemClick gets the clicked user', async () => {
      covers('CometChatUsers.onItemClick', 'called');
      const onItemClick = vi.fn();
      render(<CometChatUsers onItemClick={onItemClick} />);
      fireEvent.click(await loaded());
      expect(onItemClick).toHaveBeenCalledWith(alice);
    });

    it('onSelect reports a selection and a deselection', async () => {
      covers('CometChatUsers.onSelect', 'called');
      const onSelect = vi.fn();
      render(<CometChatUsers selectionMode="multiple" onSelect={onSelect} />);
      fireEvent.click(await loaded());
      expect(onSelect).toHaveBeenLastCalledWith(alice, true);
      fireEvent.click(row('Alice'));
      expect(onSelect).toHaveBeenLastCalledWith(alice, false);
    });

    it('onError gets the error when fetching fails', async () => {
      covers('CometChatUsers.onError', 'called');
      const error = { code: 'ERR', message: 'no network' };
      sdk.fetchNext.mockRejectedValue(error);
      const onError = vi.fn();
      render(<CometChatUsers onError={onError} />);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('onEmpty fires when the first fetch finds nobody', async () => {
      covers('CometChatUsers.onEmpty', 'called');
      sdk.fetchNext.mockResolvedValue([]);
      const onEmpty = vi.fn();
      render(<CometChatUsers onEmpty={onEmpty} />);
      await waitFor(() => {
        expect(onEmpty).toHaveBeenCalled();
      });
    });
  });

  describe('selection', () => {
    it('by default rows have no checkbox or radio button', async () => {
      covers('CometChatUsers.selectionMode', 'default', 'none');
      for (const props of [{ selectionMode: 'none' as const }, {}]) {
        const view = render(<CometChatUsers {...props} />);
        await loaded();
        expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        view.unmount();
      }
    });

    it('single gives each row a radio button, and picking another moves the selection', async () => {
      covers('CometChatUsers.selectionMode', 'single');
      render(<CometChatUsers selectionMode="single" />);
      fireEvent.click(await loaded());
      expect(within(row('Alice')).getByRole('radio')).toBeChecked();
      fireEvent.click(row('Bob'));
      expect(within(row('Alice')).getByRole('radio')).not.toBeChecked();
      expect(within(row('Bob')).getByRole('radio')).toBeChecked();
    });

    it('multiple gives each row a checkbox and keeps every pick', async () => {
      covers('CometChatUsers.selectionMode', 'multiple');
      render(<CometChatUsers selectionMode="multiple" />);
      fireEvent.click(await loaded());
      fireEvent.click(row('Bob'));
      expect(within(row('Alice')).getByRole('checkbox')).toBeChecked();
      expect(within(row('Bob')).getByRole('checkbox')).toBeChecked();
    });

    it('showSelectedUsersPreview shows the picked users above the list; it is off by default', async () => {
      covers('CometChatUsers.showSelectedUsersPreview', 'true', 'false', 'default');
      const { container, unmount } = render(<CometChatUsers selectionMode="multiple" showSelectedUsersPreview />);
      fireEvent.click(await loaded());
      expect(container.querySelector('.cometchat-users__selected-preview')).toHaveTextContent('Alice');
      unmount();

      for (const props of [{ showSelectedUsersPreview: false }, {}]) {
        const view = render(<CometChatUsers selectionMode="multiple" {...props} />);
        fireEvent.click(await loaded());
        expect(view.container.querySelector('.cometchat-users__selected-preview')).toBeNull();
        view.unmount();
      }
    });

    it('activeUser highlights that row; by default none is', async () => {
      covers('CometChatUsers.activeUser', 'set', 'default');
      const { unmount } = render(<CometChatUsers activeUser={bob} />);
      await loaded();
      expect(row('Bob')).toHaveClass('cometchat-users__item--active');
      expect(row('Alice')).not.toHaveClass('cometchat-users__item--active');
      unmount();

      const { container } = render(<CometChatUsers />);
      await loaded();
      expect(container.querySelector('.cometchat-users__item--active')).toBeNull();
    });
  });

  describe('display', () => {
    it('hideSearch removes the search box; it is shown by default', async () => {
      covers('CometChatUsers.hideSearch', 'true', 'false', 'default');
      const { unmount } = render(<CometChatUsers hideSearch />);
      await loaded();
      expect(screen.queryByRole('searchbox')).toBeNull();
      unmount();
      for (const props of [{ hideSearch: false }, {}]) {
        const view = render(<CometChatUsers {...props} />);
        expect(await screen.findByRole('searchbox')).toBeInTheDocument();
        view.unmount();
      }
    });

    it("hideUserStatus removes the online dot; shown by default; the prop wins over the app's global setting", async () => {
      covers('CometChatUsers.hideUserStatus', 'true', 'false', 'default', 'overrides-context');
      const dots = (container: HTMLElement) => container.querySelectorAll('.cometchat-avatar__status-indicator').length;

      let view = render(<CometChatUsers hideUserStatus />);
      await loaded();
      expect(dots(view.container)).toBe(0);
      view.unmount();

      for (const props of [{ hideUserStatus: false }, {}]) {
        view = render(<CometChatUsers {...props} />);
        await loaded();
        expect(dots(view.container)).toBe(2);
        view.unmount();
      }

      // Global setting alone hides it; the prop set to false shows it again.
      view = render(
        <GlobalConfigProvider config={{ hideUserStatus: true }}>
          <CometChatUsers />
        </GlobalConfigProvider>
      );
      await loaded();
      expect(dots(view.container)).toBe(0);
      view.unmount();
      view = render(
        <GlobalConfigProvider config={{ hideUserStatus: true }}>
          <CometChatUsers hideUserStatus={false} />
        </GlobalConfigProvider>
      );
      await loaded();
      expect(dots(view.container)).toBe(2);
    });

    it('showSectionHeader groups rows under initials; on by default, by name', async () => {
      covers('CometChatUsers.showSectionHeader', 'true', 'false', 'default');
      covers('CometChatUsers.sectionHeaderKey', 'default');
      const letters = (container: HTMLElement) =>
        Array.from(container.querySelectorAll('.cometchat-users__section-header-text')).map(el => el.textContent);

      for (const props of [{ showSectionHeader: true }, {}]) {
        const view = render(<CometChatUsers {...props} />);
        await loaded();
        expect(letters(view.container)).toEqual(['A', 'B']);
        view.unmount();
      }
      const { container } = render(<CometChatUsers showSectionHeader={false} />);
      await loaded();
      expect(letters(container)).toEqual([]);
    });

    it('sectionHeaderKey picks what the initials come from', async () => {
      covers('CometChatUsers.sectionHeaderKey', 'set');
      const { container } = render(<CometChatUsers sectionHeaderKey="getUid" />);
      await loaded();
      const letters = Array.from(container.querySelectorAll('.cometchat-users__section-header-text')).map(el => el.textContent);
      expect(letters).toEqual(['Z', 'Y']);
    });

    it('showScrollbar shows the list scrollbar; hidden by default', async () => {
      covers('CometChatUsers.showScrollbar', 'true', 'false', 'default');
      for (const [props, hidden] of [
        [{ showScrollbar: true }, false],
        [{ showScrollbar: false }, true],
        [{}, true],
      ] as const) {
        const view = render(<CometChatUsers {...props} />);
        await loaded();
        expect(screen.getByRole('listbox').classList.contains('cometchat-users__list--hide-scrollbar')).toBe(hidden);
        view.unmount();
      }
    });

    it('autoFocus={false} leaves focus where it is', async () => {
      covers('CometChatUsers.autoFocus', 'false');
      render(<CometChatUsers autoFocus={false} />);
      await loaded();
      expect(screen.getByRole('listbox')).not.toHaveFocus();
    });

    it("options adds a menu to each row whose items act on that row's user; no menu by default", async () => {
      covers('CometChatUsers.options', 'set', 'default');
      const onClick = vi.fn();
      const { unmount } = render(<CometChatUsers options={() => [{ id: 'block', title: 'Block', onClick }]} />);
      await loaded();
      fireEvent.click(within(row('Bob')).getByRole('button', { name: /more/i }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Block' }));
      expect(onClick).toHaveBeenCalledWith(bob);
      unmount();

      render(<CometChatUsers />);
      await loaded();
      expect(within(row('Bob')).queryByRole('button', { name: /more/i })).toBeNull();
    });
  });
});
