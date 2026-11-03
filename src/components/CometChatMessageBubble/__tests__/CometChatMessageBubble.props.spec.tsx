/**
 * The public props of <CometChatMessageBubble />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. Only the SDK is mocked, where the reaction list reads who
 * reacted; jsdom's missing ResizeObserver and layout are stubbed where the bubble measures itself.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChatMessageOption } from '../../../plugins/plugin.types';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import { buildGroup, buildTextMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

/**
 * jsdom has no ResizeObserver. Each one the bubble (or its reactions bar) makes is kept, so a test can
 * report a size for the element it watches.
 */
const observers: { callback: ResizeObserverCallback; targets: Element[] }[] = [];
class RecordingResizeObserver {
  targets: Element[] = [];
  constructor(public callback: ResizeObserverCallback) {
    observers.push(this);
  }
  observe(target: Element) {
    this.targets.push(target);
  }
  unobserve() {}
  disconnect() {}
}
/** Report `width` for every element with `className` being watched. */
function resize(className: string, width: number) {
  act(() => {
    for (const observer of observers) {
      const target = observer.targets.find(t => t.classList.contains(className));
      if (target) {
        const entry = { target, contentRect: { width } } as unknown as ResizeObserverEntry;
        observer.callback([entry], observer as unknown as ResizeObserver);
      }
    }
  });
}

const now = Math.floor(Date.now() / 1000);
const tenDaysAgo = now - 10 * 24 * 60 * 60;
const bob = buildUser({ uid: 'bob', name: 'Bob', avatar: '' });
const team = buildGroup({ guid: 'team', name: 'Team' }) as unknown as CometChat.Group;

function reaction(emoji: string, count: number, reactedByMe = false) {
  return {
    getReaction: () => emoji,
    getCount: () => count,
    getReactedByMe: () => reactedByMe,
  } as unknown as CometChat.ReactionCount;
}

/** A text message (#42) Bob sent just now; delivered, unless the overrides say otherwise. */
function message(
  overrides: Parameters<typeof buildTextMessage>[0] & { reactions?: CometChat.ReactionCount[] } = {}
) {
  const { reactions = [], ...rest } = overrides;
  return {
    ...buildTextMessage({ id: 42, text: 'Hello there', sender: bob, sentAt: now, ...rest }),
    getReactions: () => reactions,
  } as unknown as CometChat.BaseMessage;
}

function option(id: string, title: string): CometChatMessageOption {
  return { id, title, onClick: vi.fn() };
}

type Props = Partial<React.ComponentProps<typeof CometChatMessageBubble>>;
function Bubble(props: Props) {
  return (
    <CometChatMessageBubble message={message()} alignment="left" contentView={<span>Hello there</span>} {...props} />
  );
}
const show = (props: Props = {}) => render(<Bubble {...props} />);

const article = () => screen.getByRole('article');
const bubble = (container: HTMLElement) => container.querySelector('.cometchat-message-bubble');
/** A part of the bubble that has to be there: `.cometchat-message-bubble__<name>`. */
const part = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`.cometchat-message-bubble__${name}`)!;
const body = (container: HTMLElement) => part(container, 'body');
const avatar = () => screen.queryByRole('button', { name: 'Avatar for Bob' });
const senderName = (container: HTMLElement) => container.querySelector('.cometchat-message-bubble__sender-name');
const threadLink = () => screen.queryByRole('button', { name: /view thread/ });
const visible = 'cometchat-message-bubble__options--visible';

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CometChatMessageBubble props', () => {
  describe('message and layout', () => {
    it('message is what the bubble describes: sender, type, time, receipt, edit and replies', () => {
      covers('CometChatMessageBubble.message', 'set');
      const sent = message({ sentAt: tenDaysAgo, readAt: tenDaysAgo, editedAt: tenDaysAgo, replyCount: 1 });
      const { container } = show({ alignment: 'right', message: sent });
      expect(screen.getByRole('article', { name: 'Bob, text message' })).toBeInTheDocument();
      expect(body(container)).toHaveClass('cometchat-message-bubble__text-message');
      expect(container.querySelector('time')).toHaveAttribute('datetime', new Date(tenDaysAgo * 1000).toISOString());
      expect(screen.getByRole('img', { name: 'Read' })).toBeInTheDocument();
      expect(screen.getByText('Edited')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1 reply, view thread' })).toBeInTheDocument();
    });

    it('contentView is drawn in the bubble body', () => {
      covers('CometChatMessageBubble.contentView', 'custom');
      const { container } = show({ contentView: <p>Custom content</p> });
      const content = part(container, 'body-content-view');
      expect(within(content).getByText('Custom content')).toBeInTheDocument();
      expect(body(container)).toContainElement(content);
    });

    it('alignment="left" draws an incoming bubble: incoming colours, avatar and name in a group, no receipt', () => {
      covers('CometChatMessageBubble.alignment', 'left');
      const { container } = show({ alignment: 'left', group: team, message: message({ readAt: now }) });
      expect(bubble(container)).toHaveClass('cometchat-message-bubble-incoming');
      expect(bubble(container)).not.toHaveClass('cometchat-message-bubble-outgoing');
      expect(article()).not.toHaveClass('cometchat-message-bubble__wrapper--outgoing');
      expect(avatar()).toBeInTheDocument();
      expect(senderName(container)).toHaveTextContent('Bob');
      expect(screen.queryByRole('img', { name: 'Read' })).toBeNull();
    });

    it('alignment="right" draws an outgoing bubble: outgoing colours and the receipt, no avatar or name', () => {
      covers('CometChatMessageBubble.alignment', 'right');
      const { container } = show({ alignment: 'right', group: team, message: message({ readAt: now }) });
      expect(bubble(container)).toHaveClass('cometchat-message-bubble-outgoing');
      expect(bubble(container)).not.toHaveClass('cometchat-message-bubble-incoming');
      expect(article()).toHaveClass('cometchat-message-bubble__wrapper--outgoing');
      expect(screen.getByRole('img', { name: 'Read' })).toBeInTheDocument();
      expect(avatar()).toBeNull();
      expect(senderName(container)).toBeNull();
    });

    it('alignment="center" draws an action bubble: no status row, options or thread link', () => {
      covers('CometChatMessageBubble.alignment', 'center');
      const { container } = show({
        alignment: 'center',
        message: message({ replyCount: 2 }),
        options: [option('copy', 'Copy')],
        toggleOptionsVisibility: true,
      });
      expect(bubble(container)).toHaveClass('cometchat-message-bubble-action');
      expect(bubble(container)).not.toHaveClass('cometchat-message-bubble-incoming');
      expect(bubble(container)).not.toHaveClass('cometchat-message-bubble-outgoing');
      expect(screen.getByText('Hello there')).toBeInTheDocument();
      expect(screen.queryByRole('status')).toBeNull();
      expect(container.querySelector('time')).toBeNull();
      expect(screen.queryByRole('toolbar')).toBeNull();
      expect(threadLink()).toBeNull();
    });

    it('bubbleVariant="incoming" gives a right-aligned bubble the incoming colours; its layout stays outgoing', () => {
      covers('CometChatMessageBubble.bubbleVariant', 'incoming');
      const { container } = show({ alignment: 'right', bubbleVariant: 'incoming' });
      expect(bubble(container)).toHaveClass('cometchat-message-bubble-incoming');
      expect(bubble(container)).not.toHaveClass('cometchat-message-bubble-outgoing');
      expect(article()).toHaveClass('cometchat-message-bubble__wrapper--outgoing');
      expect(screen.getByRole('img', { name: 'Delivered' })).toBeInTheDocument();
    });

    it('bubbleVariant="outgoing" gives a left-aligned bubble the outgoing colours; its layout stays incoming', () => {
      covers('CometChatMessageBubble.bubbleVariant', 'outgoing');
      const { container } = show({ alignment: 'left', group: team, bubbleVariant: 'outgoing' });
      expect(bubble(container)).toHaveClass('cometchat-message-bubble-outgoing');
      expect(bubble(container)).not.toHaveClass('cometchat-message-bubble-incoming');
      expect(article()).not.toHaveClass('cometchat-message-bubble__wrapper--outgoing');
      expect(avatar()).toBeInTheDocument();
    });

    it('without bubbleVariant the colours follow the alignment', () => {
      covers('CometChatMessageBubble.bubbleVariant', 'default');
      for (const [alignment, palette, other] of [
        ['left', 'incoming', 'outgoing'],
        ['right', 'outgoing', 'incoming'],
      ] as const) {
        const { container, unmount } = show({ alignment });
        expect(bubble(container)).toHaveClass(`cometchat-message-bubble-${palette}`);
        expect(bubble(container)).not.toHaveClass(`cometchat-message-bubble-${other}`);
        unmount();
      }
    });

    it('className is added to the article; by default it has only its own', () => {
      covers('CometChatMessageBubble.className', 'set', 'default');
      const view = show({ className: 'app-bubble' });
      expect(article()).toHaveClass('app-bubble', 'cometchat-message-bubble__wrapper');
      view.unmount();

      show();
      expect([...article().classList]).toEqual(['cometchat-message-bubble__wrapper']);
    });

    it('setRef receives the article element', () => {
      covers('CometChatMessageBubble.setRef', 'set');
      const ref = React.createRef<HTMLDivElement>();
      const view = show({ setRef: ref });
      expect(ref.current).toBe(article());
      view.unmount();

      const callbackRef = vi.fn();
      show({ setRef: callbackRef });
      expect(callbackRef).toHaveBeenCalledWith(article());
    });
  });

  describe('accessibility', () => {
    it('ariaPosinset places the article in the list; left out, the article has no position', () => {
      covers('CometChatMessageBubble.ariaPosinset', 'set', 'default');
      const view = show({ ariaPosinset: 3 });
      expect(article()).toHaveAttribute('aria-posinset', '3');
      view.unmount();

      show();
      expect(article()).not.toHaveAttribute('aria-posinset');
    });

    it('ariaSetsize gives the length of the list; left out, the article has none', () => {
      covers('CometChatMessageBubble.ariaSetsize', 'set', 'default');
      const view = show({ ariaSetsize: 10 });
      expect(article()).toHaveAttribute('aria-setsize', '10');
      view.unmount();

      show();
      expect(article()).not.toHaveAttribute('aria-setsize');
    });

    it('isSelected marks the article selected and highlights it; not selected by default', () => {
      covers('CometChatMessageBubble.isSelected', 'true', 'false', 'default');
      const view = show({ isSelected: true });
      expect(article()).toHaveAttribute('aria-selected', 'true');
      expect(article()).toHaveClass('cometchat-message-bubble__wrapper--selected');
      view.unmount();

      for (const props of [{ isSelected: false }, {}]) {
        const { unmount } = show(props);
        expect(article()).not.toHaveAttribute('aria-selected');
        expect(article()).not.toHaveClass('cometchat-message-bubble__wrapper--selected');
        unmount();
      }
    });
  });

  describe('sender: group, avatar and name', () => {
    it('group shows the avatar and name of the sender on incoming messages; without one, neither', () => {
      covers('CometChatMessageBubble.group', 'set', 'default');
      const view = show({ group: team });
      expect(avatar()).toBeInTheDocument();
      expect(senderName(view.container)).toHaveTextContent('Bob');
      view.unmount();

      const { container } = show();
      expect(avatar()).toBeNull();
      expect(senderName(container)).toBeNull();
    });

    it('hideAvatar removes the avatar from incoming group messages; shown by default', () => {
      covers('CometChatMessageBubble.hideAvatar', 'true', 'false', 'default');
      const view = show({ group: team, hideAvatar: true });
      expect(avatar()).toBeNull();
      expect(view.container.querySelector('.cometchat-message-bubble__leading-view')).toBeNull();
      expect(senderName(view.container)).toHaveTextContent('Bob');
      view.unmount();

      for (const props of [{ hideAvatar: false }, {}]) {
        const { unmount } = show({ group: team, ...props });
        expect(avatar()).toBeInTheDocument();
        unmount();
      }
    });

    it('forceShowAvatar shows the avatar on an incoming one-to-one message; off by default', () => {
      covers('CometChatMessageBubble.forceShowAvatar', 'true', 'false', 'default');
      const view = show({ forceShowAvatar: true });
      expect(avatar()).toBeInTheDocument();
      view.unmount();

      for (const props of [{ forceShowAvatar: false }, {}]) {
        const { unmount } = show(props);
        expect(avatar()).toBeNull();
        unmount();
      }
    });

    it('hideSenderName removes the name from incoming group messages; shown by default', () => {
      covers('CometChatMessageBubble.hideSenderName', 'true', 'false', 'default');
      const view = show({ group: team, hideSenderName: true });
      expect(senderName(view.container)).toBeNull();
      expect(avatar()).toBeInTheDocument();
      view.unmount();

      for (const props of [{ hideSenderName: false }, {}]) {
        const { container, unmount } = show({ group: team, ...props });
        expect(senderName(container)).toHaveTextContent('Bob');
        unmount();
      }
    });

    it('onAvatarClick gets the sender, from a click or the keyboard', () => {
      covers('CometChatMessageBubble.onAvatarClick', 'called');
      const onAvatarClick = vi.fn();
      show({ group: team, onAvatarClick });
      fireEvent.click(avatar()!);
      expect(onAvatarClick).toHaveBeenLastCalledWith(bob);
      fireEvent.keyDown(avatar()!, { key: 'Enter' });
      expect(onAvatarClick).toHaveBeenCalledTimes(2);
    });

    it('leadingView replaces the avatar, and is drawn even where no avatar would be', () => {
      covers('CometChatMessageBubble.leadingView', 'custom');
      const sent = message();
      const leadingView = vi.fn((m: CometChat.BaseMessage) => <span>Badge of {m.getSender().getName()}</span>);
      const view = show({ group: team, message: sent, leadingView });
      expect(within(part(view.container, 'leading-view')).getByText('Badge of Bob')).toBeInTheDocument();
      expect(avatar()).toBeNull();
      expect(leadingView).toHaveBeenCalledWith(sent);
      view.unmount();

      show({ alignment: 'right', leadingView });
      expect(screen.getByText('Badge of Bob')).toBeInTheDocument();
    });

    it('headerView replaces the sender name, and is drawn outside a group too', () => {
      covers('CometChatMessageBubble.headerView', 'custom');
      const sent = message();
      const headerView = vi.fn((m: CometChat.BaseMessage) => <strong>From {m.getSender().getName()}</strong>);
      const view = show({ group: team, message: sent, headerView });
      expect(within(part(view.container, 'header-view')).getByText('From Bob')).toBeInTheDocument();
      expect(senderName(view.container)).toBeNull();
      expect(headerView).toHaveBeenCalledWith(sent);
      view.unmount();

      show({ headerView });
      expect(screen.getByText('From Bob')).toBeInTheDocument();
    });
  });

  describe('status: time and receipt', () => {
    it('hideTimestamp removes the time; shown by default', () => {
      covers('CometChatMessageBubble.hideTimestamp', 'true', 'false', 'default');
      const view = show({ hideTimestamp: true });
      expect(view.container.querySelector('time')).toBeNull();
      view.unmount();

      for (const props of [{ hideTimestamp: false }, {}]) {
        const { container, unmount } = show(props);
        expect(container.querySelector('time')).toHaveAttribute('datetime', new Date(now * 1000).toISOString());
        unmount();
      }
    });

    it('messageSentAtDateTimeFormat formats the time; by default it is the time of day, whatever the date', () => {
      covers('CometChatMessageBubble.messageSentAtDateTimeFormat', 'set', 'default');
      const old = message({ sentAt: tenDaysAgo });
      const sentAt = new Date(tenDaysAgo * 1000);
      const two = (n: number) => String(n).padStart(2, '0');

      const view = show({ message: old, messageSentAtDateTimeFormat: { otherDays: 'DD/MM/YYYY' } });
      expect(view.container.querySelector('time')).toHaveTextContent(
        `${two(sentAt.getDate())}/${two(sentAt.getMonth() + 1)}/${String(sentAt.getFullYear())}`
      );
      view.unmount();

      const { container } = show({ message: old });
      const hours = sentAt.getHours() % 12 || 12;
      expect(container.querySelector('time')).toHaveTextContent(
        `${two(hours)}:${two(sentAt.getMinutes())} ${sentAt.getHours() < 12 ? 'am' : 'pm'}`
      );
    });

    it("hideReceipts removes the receipt; shown by default; the prop wins over the app's global setting", () => {
      covers('CometChatMessageBubble.hideReceipts', 'true', 'false', 'default', 'overrides-context');
      const read = { alignment: 'right' as const, message: message({ readAt: now }) };
      const receipt = () => screen.queryByRole('img', { name: 'Read' });

      let view = show({ ...read, hideReceipts: true });
      expect(receipt()).toBeNull();
      view.unmount();
      for (const props of [{ hideReceipts: false }, {}]) {
        view = show({ ...read, ...props });
        expect(receipt()).toBeInTheDocument();
        view.unmount();
      }

      // The global setting alone hides it; the prop set either way wins over it.
      const withGlobal = (hideReceipts: boolean, props: Props) =>
        render(
          <GlobalConfigProvider config={{ hideReceipts }}>
            <Bubble {...read} {...props} />
          </GlobalConfigProvider>
        );
      view = withGlobal(true, {});
      expect(receipt()).toBeNull();
      view.unmount();
      view = withGlobal(true, { hideReceipts: false });
      expect(receipt()).toBeInTheDocument();
      view.unmount();
      withGlobal(false, { hideReceipts: true });
      expect(receipt()).toBeNull();
    });

    it('showError shows the error receipt in place of the real one; off by default', () => {
      covers('CometChatMessageBubble.showError', 'true', 'false', 'default');
      const read = { alignment: 'right' as const, message: message({ readAt: now }) };
      const view = show({ ...read, showError: true });
      expect(screen.getByRole('img', { name: 'Error' })).toHaveClass('cometchat-receipts-error');
      expect(screen.queryByRole('img', { name: 'Read' })).toBeNull();
      view.unmount();

      for (const props of [{ showError: false }, {}]) {
        const { unmount } = show({ ...read, ...props });
        expect(screen.getByRole('img', { name: 'Read' })).toHaveClass('cometchat-receipts-read');
        expect(screen.queryByRole('img', { name: 'Error' })).toBeNull();
        unmount();
      }
    });

    it('statusInfoView replaces the time and receipt', () => {
      covers('CometChatMessageBubble.statusInfoView', 'custom');
      const sent = message({ readAt: now });
      const statusInfoView = vi.fn((m: CometChat.BaseMessage) => <span>Seen, #{m.getId()}</span>);
      const { container } = show({ alignment: 'right', message: sent, statusInfoView });
      expect(within(screen.getByRole('status')).getByText('Seen, #42')).toBeInTheDocument();
      expect(container.querySelector('time')).toBeNull();
      expect(screen.queryByRole('img', { name: 'Read' })).toBeNull();
      expect(statusInfoView).toHaveBeenCalledWith(sent);
    });
  });

  describe('thread', () => {
    it('hideThreadView removes the reply-count link; shown by default', () => {
      covers('CometChatMessageBubble.hideThreadView', 'true', 'false', 'default');
      const replied = message({ replyCount: 2 });
      const view = show({ message: replied, hideThreadView: true });
      expect(threadLink()).toBeNull();
      view.unmount();

      for (const props of [{ hideThreadView: false }, {}]) {
        const { unmount } = show({ message: replied, ...props });
        expect(screen.getByRole('button', { name: '2 replies, view thread' })).toHaveTextContent('2 Replies');
        unmount();
      }
    });

    it('onThreadRepliesClick gets the message when the reply-count link is clicked', () => {
      covers('CometChatMessageBubble.onThreadRepliesClick', 'called');
      const replied = message({ replyCount: 2 });
      const onThreadRepliesClick = vi.fn();
      show({ message: replied, onThreadRepliesClick });
      fireEvent.click(screen.getByRole('button', { name: '2 replies, view thread' }));
      expect(onThreadRepliesClick).toHaveBeenCalledWith(replied);
    });

    it('threadView replaces the reply-count link, and is drawn even with no replies', () => {
      covers('CometChatMessageBubble.threadView', 'custom');
      const replied = message({ replyCount: 2 });
      const threadView = vi.fn((m: CometChat.BaseMessage) => <span>{m.getReplyCount()} answers</span>);
      const view = show({ message: replied, threadView });
      expect(within(part(view.container, 'body-thread-view')).getByText('2 answers')).toBeInTheDocument();
      expect(threadLink()).toBeNull();
      expect(threadView).toHaveBeenCalledWith(replied);
      view.unmount();

      show({ threadView });
      expect(screen.getByText('0 answers')).toBeInTheDocument();
    });
  });

  describe('reply, footer and bottom views', () => {
    it('replyView is drawn in the bubble, above the content', () => {
      covers('CometChatMessageBubble.replyView', 'custom');
      const { container } = show({ replyView: <blockquote>Lunch at noon?</blockquote> });
      const reply = container.querySelector('.cometchat-message-bubble__body-reply-view');
      expect(reply).toHaveTextContent('Lunch at noon?');
      expect(body(container)).toContainElement(reply as HTMLElement);
      expect(reply?.nextElementSibling).toHaveClass('cometchat-message-bubble__body-content-view');
    });

    it('footerView replaces the reactions under the bubble', async () => {
      covers('CometChatMessageBubble.footerView', 'custom');
      const reacted = message({ reactions: [reaction('👍', 2)] });
      // Without it the reactions bar is drawn there (loaded lazily: wait for it once).
      const plain = show({ message: reacted });
      await screen.findByRole('group', { name: 'Reactions' });
      plain.unmount();

      const footerView = vi.fn((m: CometChat.BaseMessage) => <span>Footer of #{m.getId()}</span>);
      const { container } = show({ message: reacted, footerView });
      expect(container.querySelector('.cometchat-message-bubble__body-footer-view')).toHaveTextContent('Footer of #42');
      expect(screen.queryByRole('group', { name: 'Reactions' })).toBeNull();
      expect(footerView).toHaveBeenCalledWith(reacted);
    });

    it('bottomView is drawn under the bubble body, as wide as the body', () => {
      covers('CometChatMessageBubble.bottomView', 'custom');
      const sent = message();
      const bottomView = vi.fn((m: CometChat.BaseMessage) => <span>Blocked: #{m.getId()}</span>);
      const { container } = show({ message: sent, bottomView });
      const bottom = part(container, 'body-bottom-view');
      expect(bottom).toHaveTextContent('Blocked: #42');
      expect(body(container)).not.toContainElement(bottom);
      expect(bottom.style.maxWidth).toBe('240px');
      expect(bottomView).toHaveBeenCalledWith(sent);
    });
  });

  describe('reactions', () => {
    it('onReactionChipClick gets the message id and the emoji of the chip clicked', async () => {
      covers('CometChatMessageBubble.onReactionChipClick', 'called');
      const onReactionChipClick = vi.fn();
      show({ message: message({ reactions: [reaction('👍', 2), reaction('🎉', 1)] }), onReactionChipClick });
      fireEvent.click(await screen.findByRole('button', { name: '🎉 reacted by 1' }));
      expect(onReactionChipClick).toHaveBeenCalledWith(42, '🎉');
    });

    it('onReactorClick gets the reaction and the message when your row in the reaction list is clicked', async () => {
      covers('CometChatMessageBubble.onReactorClick', 'called');
      const me = buildUser({ uid: 'me', name: 'Me', avatar: '' });
      const mine = {
        getReaction: () => '👍',
        getReactedBy: () => me,
        getMessageId: () => 42,
      } as unknown as CometChat.Reaction;
      vi.spyOn(CometChat, 'isInitialized').mockReturnValue(true);
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(me as unknown as CometChat.User);
      vi.spyOn(CometChat, 'ReactionsRequestBuilder').mockImplementation(function () {
        const builder = {
          setLimit: () => builder,
          setMessageId: () => builder,
          setReaction: () => builder,
          build: () => ({ fetchNext: () => Promise.resolve([mine]) }),
        };
        return builder as unknown as CometChat.ReactionsRequestBuilder;
      });
      const reacted = message({ reactions: [reaction('👍', 1, true), reaction('🎉', 1)] });
      const onReactorClick = vi.fn();
      show({ message: reacted, onReactorClick });

      await screen.findByRole('group', { name: 'Reactions' });
      // A narrow bubble: one chip fits, the other goes behind "+1".
      resize('cometchat-message-bubble__body-content-view', 60);
      fireEvent.click(screen.getByRole('button', { name: '1 more reactions' }));
      fireEvent.click(await screen.findByRole('listitem', { name: 'You reacted with 👍. Click to remove' }));
      expect(onReactorClick).toHaveBeenCalledWith(mine, reacted);
    });
  });

  describe('options', () => {
    it('options fill a toolbar beside the bubble whose items act on this message; no toolbar by default', () => {
      covers('CometChatMessageBubble.options', 'set', 'default');
      const sent = message();
      const copy = option('copy', 'Copy');
      const view = show({ message: sent, options: [copy] });
      fireEvent.click(within(screen.getByRole('toolbar')).getByRole('button', { name: 'Copy' }));
      expect(copy.onClick).toHaveBeenCalledWith(sent);
      view.unmount();

      show();
      expect(screen.queryByRole('toolbar')).toBeNull();
    });

    it('onOptionClick gets the option and the message after the option has run', () => {
      covers('CometChatMessageBubble.onOptionClick', 'called');
      const sent = message();
      const copy = option('copy', 'Copy');
      const onOptionClick = vi.fn();
      show({ message: sent, options: [copy], onOptionClick });
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
      expect(onOptionClick).toHaveBeenCalledWith(copy, sent);
      expect(vi.mocked(copy.onClick).mock.invocationCallOrder[0]).toBeLessThan(onOptionClick.mock.invocationCallOrder[0]!);
    });

    it('quickOptionsCount sets how many options sit in the toolbar, the rest under "More options"; 2 by default', () => {
      covers('CometChatMessageBubble.quickOptionsCount', 'set', 'default');
      const options = [option('copy', 'Copy'), option('reply', 'Reply'), option('edit', 'Edit'), option('delete', 'Delete')];
      const quick = () =>
        within(screen.getByRole('toolbar'))
          .getAllByRole('button')
          .filter(button => !button.hasAttribute('aria-haspopup'))
          .map(button => button.getAttribute('aria-label'));
      const more = () => {
        fireEvent.click(screen.getByRole('button', { name: 'More options' }));
        return screen.getAllByRole('menuitem', { hidden: true }).map(item => item.textContent);
      };

      const view = show({ options, quickOptionsCount: 3 });
      expect(quick()).toEqual(['Copy', 'Reply', 'Edit']);
      expect(more()).toEqual(['Delete']);
      view.unmount();

      show({ options });
      expect(quick()).toEqual(['Copy', 'Reply']);
      expect(more()).toEqual(['Edit', 'Delete']);
    });

    it('toggleOptionsVisibility={true} shows the options without hovering', () => {
      covers('CometChatMessageBubble.toggleOptionsVisibility', 'true');
      show({ options: [option('copy', 'Copy')], toggleOptionsVisibility: true });
      expect(screen.getByRole('toolbar')).toHaveClass(visible);
    });

    it('toggleOptionsVisibility={false} keeps the options hidden, even on hover', () => {
      covers('CometChatMessageBubble.toggleOptionsVisibility', 'false');
      const { container } = show({ options: [option('copy', 'Copy')], toggleOptionsVisibility: false });
      fireEvent.mouseEnter(body(container));
      expect(screen.getByRole('toolbar')).not.toHaveClass(visible);
    });

    it('by default the options show on hover and hide shortly after the pointer leaves', () => {
      covers('CometChatMessageBubble.toggleOptionsVisibility', 'default');
      vi.useFakeTimers();
      const { container } = show({ options: [option('copy', 'Copy')] });
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).not.toHaveClass(visible);
      fireEvent.mouseEnter(body(container));
      expect(toolbar).toHaveClass(visible);

      fireEvent.mouseLeave(part(container, 'body-container'));
      expect(toolbar).toHaveClass(visible);
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(toolbar).not.toHaveClass(visible);
    });

    it('interactive by default: hovering the body reveals the options toolbar', () => {
      covers('CometChatMessageBubble.disableInteraction', 'false', 'default');
      for (const props of [{ disableInteraction: false }, {}]) {
        const { container, unmount } = show({ options: [option('copy', 'Copy')], ...props });
        expect(body(container)).toHaveAttribute('role', 'presentation');
        expect(screen.getByRole('toolbar')).not.toHaveClass(visible);
        fireEvent.mouseEnter(body(container));
        expect(screen.getByRole('toolbar')).toHaveClass(visible);
        unmount();
      }
    });

    it("the options toolbar takes the body's height by default", () => {
      covers('CometChatMessageBubble.includeBottomViewHeight', 'false', 'default');
      vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
        return this.classList.contains('cometchat-message-bubble__body') ? 48 : 0;
      });
      for (const props of [{ includeBottomViewHeight: false }, {}]) {
        const { container, unmount } = show({ options: [option('copy', 'Copy')], ...props });
        // The body is measured on the next render, here the one hovering causes.
        fireEvent.mouseEnter(body(container));
        expect(screen.getByRole('toolbar').style.height).toBe('48px');
        unmount();
      }
    });
  });
});
