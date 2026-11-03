/**
 * Harness for the CometChatMessageList props specs: the real list, the real bubbles (drawn by the
 * text, group-action and delete plugins) and a real logged-in session, with only the SDK mocked
 * (see `messageListSdkMock.ts`). Kit events go through a small in-memory bus, the way
 * `CometChatEventsProvider` delivers SDK listener callbacks.
 *
 * jsdom has no layout, so the browser APIs the list leans on are given here: IntersectionObserver
 * (driven by the spec: "the bottom of the list is in view"), ResizeObserver, scrollIntoView.
 */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageList } from '../../CometChatMessageList';
import type { CometChatMessageListProps } from '../../CometChatMessageList.types';
import { CometChatUIKit } from '../../../../CometChatUIKit/CometChatUIKit';
import { UIKitSettingsBuilder } from '../../../../CometChatUIKit/UIKitSettings';
import { CometChatPluginRegistryContext } from '../../../../context/PluginRegistryContext';
import { CometChatEventsContext } from '../../../../context/CometChatEventsContext';
import type { CometChatEvent } from '../../../../context/CometChatEvents.types';
import {
  GlobalConfigProvider,
  type CometChatGlobalConfig,
} from '../../../../context/GlobalConfigContext';
import { CometChatPluginRegistry } from '../../../../plugins/CometChatPluginRegistry';
import { CometChatTextPlugin } from '../../../../plugins/core/text/CometChatTextPlugin';
import { CometChatGroupActionPlugin } from '../../../../plugins/core/group-action/CometChatGroupActionPlugin';
import { CometChatDeletePlugin } from '../../../../plugins/core/delete/CometChatDeletePlugin';
import { resetPinSaveFeatures } from '../../../../utils/pinSaveFeatures';
import { resetThreadSubscriptionGuards } from '../../../../utils/CometChatThreadSubscription';
import { buildGroup, buildUser } from '../../../../testing/mock-builders';
import { me, resetSdk, sdk } from './messageListSdkMock';

export { me, sdk };

// ─── People and places ──────────────────────────────────────────────────────

export const bob = buildUser({ uid: 'bob', name: 'Bob', avatar: '' });
export const alice = buildUser({ uid: 'alice', name: 'Alice', avatar: '' });
export const team = buildGroup({ guid: 'team', name: 'Team' });

type Person = typeof me;

export const asUser = (person: Person) => person as unknown as CometChat.User;
export const asGroup = (group: typeof team) => group as unknown as CometChat.Group;
export const asMessage = (message: object) => message as CometChat.BaseMessage;

/** Seconds; ten days back, so a message's date reads "DD MMM, YYYY" and its year is known. */
export const tenDaysAgo = Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60;
export const yearOf = (seconds: number) => String(new Date(seconds * 1000).getFullYear());

// ─── Messages ───────────────────────────────────────────────────────────────

export interface TextOptions {
  id: number;
  from: Person;
  text?: string;
  /** Sent to the group instead of in the 1:1 chat between me and Bob. */
  inGroup?: boolean;
  sentAt?: number;
  readAt?: number;
  deliveredAt?: number;
  replyCount?: number;
  parentId?: number;
  reactions?: CometChat.ReactionCount[];
  pinned?: boolean;
  saved?: boolean;
  moderationStatus?: string;
}

/**
 * A text message as the SDK hands it over: a `CometChat.TextMessage` (so the kit's
 * `instanceof` checks hold) carrying the given fields.
 */
export function text(options: TextOptions): CometChat.TextMessage {
  const { id, from } = options;
  const fromMe = from.getUid() === me.getUid();
  const receiverType = options.inGroup ? 'group' : 'user';
  const receiverId = options.inGroup ? team.getGuid() : fromMe ? bob.getUid() : me.getUid();
  let readAt = options.readAt ?? 0;
  let deliveredAt = options.deliveredAt ?? 0;
  let reactions = options.reactions ?? [];
  let replyCount = options.replyCount ?? 0;
  let metadata: object = {};
  let threadSubscribed = false;
  let pinnedAt = options.pinned ? tenDaysAgo : undefined;
  let savedAt = options.saved ? tenDaysAgo : undefined;
  const fields = {
    getId: () => id,
    getMuid: () => `muid-${String(id)}`,
    getText: () => options.text ?? `Message ${String(id)}`,
    getSender: () => from,
    getReceiverId: () => receiverId,
    getReceiver: () => receiverId,
    getReceiverType: () => receiverType,
    getType: () => 'text',
    getCategory: () => 'message',
    getSentAt: () => options.sentAt ?? tenDaysAgo + id * 60,
    getDeliveredAt: () => deliveredAt,
    setDeliveredAt: (at: number) => {
      deliveredAt = at;
    },
    getReadAt: () => readAt,
    setReadAt: (at: number) => {
      readAt = at;
    },
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getReactions: () => reactions,
    setReactions: (next: CometChat.ReactionCount[]) => {
      reactions = next;
    },
    getMetadata: () => metadata,
    setMetadata: (next: object) => {
      metadata = next;
    },
    getParentMessageId: () => options.parentId ?? 0,
    getReplyCount: () => replyCount,
    setReplyCount: (count: number) => {
      replyCount = count;
    },
    getMentionedUsers: () => [],
    getModerationStatus: () => options.moderationStatus ?? 'approved',
    getQuotedMessage: () => null,
    isThreadSubscribed: () => threadSubscribed,
    setThreadSubscribed: (value: unknown) => {
      threadSubscribed = value === true;
    },
    isPinned: () => pinnedAt !== undefined,
    getPinnedAt: () => pinnedAt,
    setPinnedAt: (at: number | undefined) => {
      pinnedAt = at;
    },
    getPinnedBy: () => (pinnedAt !== undefined ? from.getUid() : undefined),
    setPinnedBy: () => undefined,
    isSaved: () => savedAt !== undefined,
    getSavedAt: () => savedAt,
    setSavedAt: (at: number | undefined) => {
      savedAt = at;
    },
    getConversationId: () => `${receiverType}_${receiverType === 'group' ? team.getGuid() : bob.getUid()}`,
  };
  return Object.assign(
    Object.create(CometChat.TextMessage.prototype) as CometChat.TextMessage,
    fields
  );
}

/** "Alice joined" — a group action message, with the raw fields the action text is read from. */
export function joined(id: number, who: Person = alice): CometChat.BaseMessage {
  let readAt = 0;
  return asMessage({
    action: 'joined',
    actionBy: { uid: who.getUid(), name: who.getName() },
    actionOn: { uid: who.getUid(), name: who.getName() },
    getId: () => id,
    getMuid: () => `muid-${String(id)}`,
    getSender: () => who,
    getReceiverId: () => team.getGuid(),
    getReceiverType: () => 'group',
    getType: () => 'groupMember',
    getCategory: () => 'action',
    getSentAt: () => tenDaysAgo + id * 60,
    getDeliveredAt: () => 0,
    getReadAt: () => readAt,
    setReadAt: (at: number) => {
      readAt = at;
    },
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getReactions: () => [],
    setReactions: () => undefined,
    getMetadata: () => ({}),
    getParentMessageId: () => 0,
    getReplyCount: () => 0,
    getMessage: () => `${who.getName()} joined`,
    getAction: () => 'joined',
    getActionBy: () => who,
    getActionOn: () => who,
    getActionFor: () => team,
    getConversationId: () => `group_${team.getGuid()}`,
  });
}

/** What the SDK's getConversation resolves for the open chat. */
export function conversation(lastReadId: number | null, unread: number, id = 'user_bob') {
  return {
    getConversationId: () => id,
    getLastReadMessageId: () => (lastReadId === null ? '' : String(lastReadId)),
    getUnreadMessageCount: () => unread,
  };
}

/** A reactor in the reaction list. */
export function reactor(person: Person, emoji: string) {
  return {
    getReactedBy: () => person,
    getReaction: () => emoji,
    getMessageId: () => 1,
    getId: () => `${person.getUid()}-${emoji}`,
  } as unknown as CometChat.Reaction;
}

// ─── The kit around the list ────────────────────────────────────────────────

const handlers = new Set<(event: CometChatEvent) => void>();
/** Every UI event the list published. */
export const published: CometChatEvent[] = [];

/** The kit's event bus, in memory. `emit` is an SDK listener firing. */
export const events = {
  subscribe: (handler: (event: CometChatEvent) => void) => {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  },
  publish: (event: CometChatEvent) => {
    published.push(event);
    handlers.forEach(handler => {
      handler(event);
    });
  },
  emit: (event: CometChatEvent) => {
    act(() => {
      handlers.forEach(handler => {
        handler(event);
      });
    });
  },
};

/** The plugins the app runs with. Their types and categories are what the list fetches by default. */
export const registry = new CometChatPluginRegistry([
  CometChatTextPlugin,
  CometChatGroupActionPlugin,
  CometChatDeletePlugin,
]);

export const Kit: React.FC<{ children: React.ReactNode; config?: CometChatGlobalConfig }> = ({
  children,
  config,
}) => {
  const tree = (
    <CometChatEventsContext.Provider value={events}>
      <CometChatPluginRegistryContext.Provider value={registry}>
        {children}
      </CometChatPluginRegistryContext.Provider>
    </CometChatEventsContext.Provider>
  );
  return config ? <GlobalConfigProvider config={config}>{tree}</GlobalConfigProvider> : tree;
};

export type ListProps = Partial<CometChatMessageListProps>;

/** The list in the 1:1 chat with Bob (unless the props say otherwise). */
export function show(props: ListProps = {}, config?: CometChatGlobalConfig) {
  return render(
    <Kit {...(config && { config })}>
      <CometChatMessageList user={asUser(bob)} {...props} />
    </Kit>
  );
}

/** The list in the group chat. */
export function showGroup(props: ListProps = {}, config?: CometChatGlobalConfig) {
  return render(
    <Kit {...(config && { config })}>
      <CometChatMessageList group={asGroup(team)} {...props} />
    </Kit>
  );
}

/** The conversation as the server has it, oldest first. */
export function history(...messages: CometChat.BaseMessage[]): void {
  sdk.fetchPrevious.mockResolvedValue(messages);
}

/** The bubble text, once the list has loaded and the text plugin has drawn it. */
export const bubbleText = (value: string) =>
  screen.findByText(value, { selector: '.cometchat-text-bubble__text' });

/** The row a message is rendered in. */
export function row(container: HTMLElement, id: number): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-message-id="${String(id)}"]`);
  if (!el) throw new Error(`no row for message ${String(id)}`);
  return el;
}

/** The scroll area (role "log"). */
export const log = () => screen.getByRole('log', { name: 'Message list' });

// ─── Message options ────────────────────────────────────────────────────────

/** The option titles a message offers: the quick buttons, then the "More" menu. */
export function optionTitles(rowEl: HTMLElement): string[] {
  const toolbar = within(rowEl).queryByRole('toolbar');
  if (!toolbar) return [];
  const quick = within(toolbar)
    .queryAllByRole('button')
    .filter(button => button.getAttribute('aria-haspopup') === null)
    .map(button => button.getAttribute('aria-label') ?? '');
  const more = within(toolbar).queryByRole('button', { name: 'More options' });
  if (!more) return quick;
  fireEvent.click(more);
  const rest = within(toolbar)
    .queryAllByRole('menuitem', { hidden: true })
    .map(item => item.textContent ?? '');
  fireEvent.click(more);
  return [...quick, ...rest];
}

/** How many quick-option buttons a message shows next to its bubble. */
export function quickOptionCount(rowEl: HTMLElement): number {
  const toolbar = within(rowEl).getByRole('toolbar');
  return within(toolbar)
    .queryAllByRole('button')
    .filter(button => button.getAttribute('aria-haspopup') === null).length;
}

/** Pick an option off a message, from the quick buttons or the "More" menu. */
export function chooseOption(rowEl: HTMLElement, title: string): void {
  const toolbar = within(rowEl).getByRole('toolbar');
  const quick = within(toolbar).queryByRole('button', { name: title });
  if (quick) {
    fireEvent.click(quick);
    return;
  }
  fireEvent.click(within(toolbar).getByRole('button', { name: 'More options' }));
  // The menu stays visibility:hidden until it has measured itself, which hides the items'
  // accessible names from a name query; match on their text instead.
  const item = within(toolbar)
    .getAllByRole('menuitem', { hidden: true })
    .find(candidate => candidate.textContent === title);
  if (!item) throw new Error(`no "${title}" option`);
  fireEvent.click(item);
}

// ─── Browser APIs jsdom lacks ───────────────────────────────────────────────

interface Observed {
  callback: IntersectionObserverCallback;
  targets: Element[];
}
const intersectionObservers: Observed[] = [];

/**
 * An IntersectionObserver the spec drives. The list observes a sentinel at the bottom of the
 * scroll area to know whether the reader is at the end of the conversation.
 */
class FakeIntersectionObserver {
  private readonly observed: Observed;
  constructor(callback: IntersectionObserverCallback) {
    this.observed = { callback, targets: [] };
    intersectionObservers.push(this.observed);
  }
  observe(target: Element) {
    this.observed.targets.push(target);
  }
  unobserve(target: Element) {
    this.observed.targets = this.observed.targets.filter(t => t !== target);
  }
  disconnect() {
    this.observed.targets = [];
  }
  takeRecords() {
    return [];
  }
}

/** Scroll so the end of the conversation is (or is not) in view. */
export function bottomInView(visible: boolean): void {
  const sentinel = document.querySelector('.cometchat-message-list__bottom-sentinel');
  if (!sentinel) throw new Error('the list has no bottom sentinel');
  const watchers = intersectionObservers.filter(o => o.targets.includes(sentinel));
  act(() => {
    for (const watcher of watchers) {
      const entry = { isIntersecting: visible, target: sentinel } as IntersectionObserverEntry;
      watcher.callback([entry], {} as IntersectionObserver);
    }
  });
}

/** The width ResizeObserver reports for the elements it watches (none by default). */
export const layout = { width: undefined as number | undefined };

class FakeResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    if (layout.width === undefined) return;
    const entry = { target, contentRect: { width: layout.width } } as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
  unobserve() {
    /* nothing to release */
  }
  disconnect() {
    /* nothing to release */
  }
}

let scrollIntoView = vi.fn<(options?: boolean | ScrollIntoViewOptions) => void>();

/** The elements the list scrolled into view, in order. */
export const scrolledIntoView = (): unknown[] => scrollIntoView.mock.contexts;

/** Install the browser stand-ins; call at the top of each spec. */
export function installBrowser(): void {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
}

// ─── Session ────────────────────────────────────────────────────────────────

/** Initialise the kit the way an app does; the SDK reports `me` already logged in. */
export async function signIn(): Promise<void> {
  await CometChatUIKit.init(new UIKitSettingsBuilder().setAppId('app').setRegion('us').build());
}

/** Fresh SDK spies, bus and observers for each test. */
export function resetHarness(): void {
  resetSdk();
  resetPinSaveFeatures();
  resetThreadSubscriptionGuards();
  handlers.clear();
  published.length = 0;
  intersectionObservers.length = 0;
  layout.width = undefined;
  scrollIntoView = vi.fn<(options?: boolean | ScrollIntoViewOptions) => void>();
  Element.prototype.scrollIntoView = scrollIntoView;
}
