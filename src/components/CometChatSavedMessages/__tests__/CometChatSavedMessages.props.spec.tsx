/**
 * The public props of <CometChatSavedMessages />, one case each: the prop is set (or left out) on
 * the real component and the test checks what it changes. Only the SDK is mocked: its messages
 * request builder and the logged-in user, as in the other specs here.
 *
 * Queries go by class and text, not by role. A role query computes styles, and once the panel has
 * focused a row (it does a frame after mounting when there is no close button) jsdom's selector
 * engine throws on the row's numeric id while matching the calls SDK's `:has()` rule.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSavedMessages } from '../CometChatSavedMessages';
import type { CometChatSavedMessagesProps } from '../CometChatSavedMessages.types';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { covers } from '../../../testing/covers';

/** Local noon, so the rows' dates don't depend on the machine's timezone. */
const day = (date: number) => new Date(2025, 0, date, 12).getTime() / 1000;

function savedMessage(id: number, text: string, sentAt: number): CometChat.BaseMessage {
  return {
    getId: () => id,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({ getUid: () => 'bob', getName: () => 'Bob', getAvatar: () => '', getStatus: () => 'online' }),
    getReceiverType: () => 'user',
    getReceiverId: () => 'me',
    getReceiver: () => ({ getName: () => 'Me', getAvatar: () => '' }),
    getText: () => text,
    getSentAt: () => sentAt,
    getMetadata: () => ({}),
    getParentMessageId: () => 0,
    getSavedAt: () => sentAt,
    isSaved: () => true,
    isPinned: () => false,
  } as unknown as CometChat.BaseMessage;
}

// Newest first, the order the panel shows them in.
const lunch = savedMessage(1, 'Lunch at noon', day(15));
const launch = savedMessage(2, 'Launch #friday', day(14));

const pageOf = (messages: CometChat.BaseMessage[]) => () => Promise.resolve([...messages]);

/** The SDK's own builder, which the panel makes when the app passes none. */
const fetchPrevious = vi.fn();
const sdkBuilder = { setLimit: vi.fn(), setSaved: vi.fn(), build: vi.fn() };

/** A builder an app passes in, returning its own saved messages. */
function appBuilder(messages: CometChat.BaseMessage[]) {
  const appFetch = vi.fn(pageOf(messages));
  const builder = { setLimit: vi.fn(), setSaved: vi.fn(), build: vi.fn(() => ({ fetchPrevious: appFetch, getLimit: () => 5 })) };
  builder.setLimit.mockReturnValue(builder);
  builder.setSaved.mockReturnValue(builder);
  return builder;
}

const rows = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.cometchat-saved-messages__item'));
const panel = (container: HTMLElement) => container.querySelector('.cometchat-saved-messages');
const closeButton = (container: HTMLElement) => container.querySelector<HTMLElement>('.cometchat-saved-messages__header-close');

/** The real panel, once its first page of rows is on screen. */
async function show(props: CometChatSavedMessagesProps = {}) {
  const view = render(<CometChatSavedMessages {...props} />);
  await waitFor(() => {
    expect(rows(view.container)).toHaveLength(2);
  });
  return view;
}

function row(container: HTMLElement, index: number) {
  const found = rows(container)[index];
  if (!found) throw new Error(`no row ${String(index)}`);
  return found;
}

/** The Unsave action mounts on hover. */
function unsaveButton(rowEl: HTMLElement) {
  fireEvent.mouseEnter(rowEl);
  return rowEl.querySelector<HTMLElement>('.cometchat-saved-messages__item-unsave');
}

class HashtagFormatter extends CometChatTextFormatter {
  readonly id = 'test-hashtag';
  override customLogicToFormatText(text: string): string {
    return text.replace(/#(\w+)/g, '<span class="test-hashtag">#$1</span>');
  }
}

beforeEach(() => {
  fetchPrevious.mockReset().mockImplementation(pageOf([lunch, launch]));
  sdkBuilder.setLimit.mockReset().mockReturnValue(sdkBuilder);
  sdkBuilder.setSaved.mockReset().mockReturnValue(sdkBuilder);
  sdkBuilder.build.mockReset().mockReturnValue({ fetchPrevious, getLimit: () => 30 });
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(
    () => sdkBuilder as unknown as CometChat.MessagesRequestBuilder
  );
  vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue({ getUid: () => 'me', getName: () => 'Me' } as unknown as CometChat.User);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CometChatSavedMessages props', () => {
  describe('request builder', () => {
    it('without a builder, the SDK builder reads saved messages 30 at a time', async () => {
      covers('CometChatSavedMessages.messagesRequestBuilder', 'default');
      await show();
      expect(sdkBuilder.setLimit).toHaveBeenCalledWith(30);
      expect(sdkBuilder.setSaved).toHaveBeenCalledWith(true);
      expect(fetchPrevious).toHaveBeenCalled();
    });

    it("an app's builder is read as supplied, with setSaved re-asserted and its page size kept", async () => {
      covers('CometChatSavedMessages.messagesRequestBuilder', 'used');
      const builder = appBuilder([savedMessage(7, 'From the app', day(10))]);
      render(<CometChatSavedMessages messagesRequestBuilder={builder as unknown as CometChat.MessagesRequestBuilder} />);
      expect(await screen.findByText('From the app')).toBeInTheDocument();
      expect(builder.setSaved).toHaveBeenCalledWith(true);
      expect(builder.setLimit).not.toHaveBeenCalled();
      expect(sdkBuilder.build).not.toHaveBeenCalled();
      expect(fetchPrevious).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('onItemClick gets the clicked message', async () => {
      covers('CometChatSavedMessages.onItemClick', 'called');
      const onItemClick = vi.fn();
      const { container } = await show({ onItemClick });
      fireEvent.click(row(container, 1));
      expect(onItemClick).toHaveBeenCalledTimes(1);
      expect(onItemClick).toHaveBeenCalledWith(launch);
    });

    it('onClose fires from the close button and from Escape', async () => {
      covers('CometChatSavedMessages.onClose', 'called');
      const onClose = vi.fn();
      const { container } = await show({ onClose });
      const close = closeButton(container);
      if (!close) throw new Error('no close button');
      fireEvent.click(close);
      expect(onClose).toHaveBeenCalledTimes(1);
      const root = panel(container);
      if (!root) throw new Error('no panel');
      fireEvent.keyDown(root, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('display', () => {
    it('hideCloseButton removes the close button; it is shown by default', async () => {
      covers('CometChatSavedMessages.hideCloseButton', 'true', 'false', 'default');
      const view = await show({ hideCloseButton: true });
      expect(closeButton(view.container)).toBeNull();
      expect(screen.getByText('Saved Messages')).toBeInTheDocument();
      view.unmount();
      for (const props of [{ hideCloseButton: false }, {}]) {
        const next = await show(props);
        expect(closeButton(next.container)).toHaveAttribute('aria-label', 'Close');
        next.unmount();
      }
    });

    it('hideUnsaveMessageOption makes the rows read-only; by default each row offers Unsave, which asks first', async () => {
      covers('CometChatSavedMessages.hideUnsaveMessageOption', 'true', 'false', 'default');
      let view = await show({ hideUnsaveMessageOption: true });
      for (const rowEl of rows(view.container)) {
        expect(unsaveButton(rowEl)).toBeNull();
      }
      view.unmount();

      for (const props of [{ hideUnsaveMessageOption: false }, {}]) {
        view = await show(props);
        const unsave = unsaveButton(row(view.container, 0));
        expect(unsave).toHaveAttribute('aria-label', 'Unsave message');
        if (!unsave) throw new Error('no Unsave action');
        fireEvent.click(unsave);
        expect(await screen.findByText('Unsave Message')).toBeInTheDocument();
        view.unmount();
      }
    });

    it("textFormatters format each row's preview; by default the preview is left as it is", async () => {
      covers('CometChatSavedMessages.textFormatters', 'set', 'default');
      const preview = (container: HTMLElement) => row(container, 1).querySelector('.cometchat-saved-messages__item-preview');

      let view = await show({ textFormatters: [new HashtagFormatter()] });
      expect(preview(view.container)?.querySelector('.test-hashtag')).toHaveTextContent('#friday');
      view.unmount();

      view = await show();
      expect(preview(view.container)).toHaveTextContent('Launch #friday');
      expect(preview(view.container)?.querySelector('.test-hashtag')).toBeNull();
    });

    it("className is added to the panel's own class; by default it has only its own", async () => {
      covers('CometChatSavedMessages.className', 'set', 'default');
      let view = await show({ className: 'app-saved' });
      expect(panel(view.container)).toHaveClass('cometchat-saved-messages', 'app-saved');
      view.unmount();

      view = await show();
      expect(panel(view.container)?.className).toBe('cometchat-saved-messages');
    });
  });

  describe('views', () => {
    it('headerView replaces the title row and its close button', async () => {
      covers('CometChatSavedMessages.headerView', 'custom');
      const { container } = await show({ headerView: <h2>My saved</h2> });
      expect(screen.getByText('My saved')).toBeInTheDocument();
      expect(screen.queryByText('Saved Messages')).toBeNull();
      expect(closeButton(container)).toBeNull();
    });

    it('loadingView replaces the shimmer while the first page loads', async () => {
      covers('CometChatSavedMessages.loadingView', 'custom');
      fetchPrevious.mockImplementation(() => new Promise<never>(() => undefined));
      const { container } = render(<CometChatSavedMessages loadingView={<p>Fetching saves…</p>} />);
      expect(await screen.findByText('Fetching saves…')).toBeInTheDocument();
      expect(container.querySelector('.cometchat-saved-messages__shimmer')).toBeNull();
    });

    it('emptyView replaces the empty state', async () => {
      covers('CometChatSavedMessages.emptyView', 'custom');
      fetchPrevious.mockImplementation(pageOf([]));
      render(<CometChatSavedMessages emptyView={<p>Nothing saved</p>} />);
      expect(await screen.findByText('Nothing saved')).toBeInTheDocument();
      expect(screen.queryByText('No saved messages yet')).toBeNull();
    });

    it('errorView replaces the error state', async () => {
      covers('CometChatSavedMessages.errorView', 'custom');
      fetchPrevious.mockRejectedValue(new Error('offline'));
      render(<CometChatSavedMessages errorView={<p>Could not load saves</p>} />);
      expect(await screen.findByText('Could not load saves')).toBeInTheDocument();
      expect(screen.queryByText('OOPS!')).toBeNull();
    });

    it('itemView replaces each row', async () => {
      covers('CometChatSavedMessages.itemView', 'custom');
      const { container } = render(<CometChatSavedMessages itemView={m => <p>Saved #{String(m.getId())}</p>} />);
      expect(await screen.findByText('Saved #1')).toBeInTheDocument();
      expect(screen.getByText('Saved #2')).toBeInTheDocument();
      expect(rows(container)).toHaveLength(0);
    });

    it("the List's own itemView wins over the one given to Root", async () => {
      covers('CometChatSavedMessages.itemView', 'overrides-context');
      const fromRoot = (m: CometChat.BaseMessage) => <p>root {String(m.getId())}</p>;
      let view = render(
        <CometChatSavedMessages.Root itemView={fromRoot}>
          <CometChatSavedMessages.List itemView={m => <p>list {String(m.getId())}</p>} />
        </CometChatSavedMessages.Root>
      );
      expect(await screen.findByText('list 1')).toBeInTheDocument();
      expect(screen.queryByText('root 1')).toBeNull();
      view.unmount();

      // Without its own, the List renders Root's.
      view = render(
        <CometChatSavedMessages.Root itemView={fromRoot}>
          <CometChatSavedMessages.List />
        </CometChatSavedMessages.Root>
      );
      expect(await screen.findByText('root 1')).toBeInTheDocument();
    });

    it('children replace the default layout', async () => {
      covers('CometChatSavedMessages.children', 'custom');
      const { container } = render(
        <CometChatSavedMessages.Root>
          <p>Pinned to the side</p>
          <CometChatSavedMessages.List />
        </CometChatSavedMessages.Root>
      );
      await waitFor(() => {
        expect(rows(container)).toHaveLength(2);
      });
      expect(screen.getByText('Pinned to the side')).toBeInTheDocument();
      expect(screen.queryByText('Saved Messages')).toBeNull();
      expect(closeButton(container)).toBeNull();
    });
  });
});
