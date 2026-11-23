/**
 * OfflineHub: the kit's single bridge from the Chat SDK's offline listeners to
 * the screens that are mounted.
 *
 * - Started by `CometChatUIKit.init()` / `initFromSettings()` once the SDK's own
 *   init has resolved; never at import (the package is `sideEffects: ["*.css"]`).
 *   Idempotent: a second init, StrictMode or a second provider registers nothing
 *   twice.
 * - Registers each SDK listener once, under its own id, and only those the
 *   installed SDK has. They are inert while offline is off: the SDK never fires
 *   them.
 * - Never unregistered on logout (SDK registrations survive logout/login). A
 *   logout or user switch clears the hub's own bookkeeping and bumps `gen`, so
 *   late callbacks from the old session are dropped by every screen.
 * - Fans out on private channels, never on `CometChatEventsProvider`. Integrators
 *   get only the additive public events (`ui:message/send-state-changed`,
 *   `ui:offline/cache-reset`) plus the existing `ui:message/sent`, emitted once
 *   per transition per `localMessageId`.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessageSendState,
  CometChatUIEvent,
} from '../../context/CometChatEvents.types';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';
import { CometChatLogger } from '../CometChatLogger';
import {
  hasOfflineSdk,
  hasSdkFunction,
  makeSdkListener,
  offlineSdk,
  type OfflineSdkSurface,
} from './gate';
import {
  clearAliases,
  localIdOf,
  muidOf,
  OfflineFailureReason,
  recordAlias,
  serverIdOf,
} from './identity';

export type OfflineSendState = CometChatMessageSendState;

export interface SendStateEvent {
  gen: number;
  localMessageId: string;
  message: CometChat.BaseMessage;
  state: OfflineSendState;
  /** `MessageFailureReason` for `failed` / `discarded`. */
  reason?: string;
  /**
   * A failure the outbox does not hold (an error with no prior pending, or a
   * queue-full / byte-overflow refusal): its Retry is a fresh send.
   */
  direct?: boolean;
}

export interface MessageSyncEvent {
  gen: number;
  messages: CometChat.BaseMessage[];
  outcome: string;
}
export interface ConversationSyncEvent {
  gen: number;
  conversations: CometChat.Conversation[];
}
export interface MessagesUpdatedEvent {
  gen: number;
  messages: CometChat.BaseMessage[];
}
export interface CacheResetEvent {
  gen: number;
  reason: string;
  pendingMessagesLost: number | null;
}
export interface MediaReadyEvent {
  gen: number;
  messageKey: string;
  urlKey: string;
  localPath: string;
}
export interface SyncFailedEvent {
  gen: number;
  phase: 'conversation' | 'message';
  error: unknown;
}

/** A user-facing notice; the message list and conversation list render these. */
export type OfflineNoticeKind =
  | 'unsent_message_removed'
  | 'queue_full'
  | 'file_too_large_offline'
  | 'messages_not_sent'
  | 'unsent_messages_lost'
  | 'unsent_messages_maybe_lost'
  /** Retry or Delete tapped while the send is under way (R162): try again shortly. */
  | 'send_in_flight';

export interface OfflineNotice {
  /** Unique per notice, for keys and dismissal. */
  id: number;
  gen: number;
  kind: OfflineNoticeKind;
  count?: number;
  /** The removed message, for Copy (text only). */
  message?: CometChat.BaseMessage;
  /** Conversation the notice belongs to; empty for a session-wide notice. */
  conversationId?: string;
  /** Only the message list with this key shows it (see `listKeyOf`). */
  listKey?: string;
}

type Handler<T> = (event: T) => void;

/** A synchronous, lossless fan-out to the mounted screens. */
export class OfflineChannel<T> {
  private readonly handlers = new Set<Handler<T>>();

  emit(event: T): void {
    for (const handler of Array.from(this.handlers)) {
      try {
        handler(event);
      } catch (error) {
        CometChatLogger.error('OfflineHub', 'Subscriber threw:', error);
      }
    }
  }

  subscribe(handler: Handler<T>): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  get size(): number {
    return this.handlers.size;
  }
}

const LISTENER_IDS = Object.freeze({
  outbox: 'uikit_react_offline_hub_outbox',
  sync: 'uikit_react_offline_hub_sync',
  cacheReset: 'uikit_react_offline_hub_cache_reset',
  media: 'uikit_react_offline_hub_media',
  messagesSynced: 'uikit_react_offline_hub_messages_synced',
  login: 'uikit_react_offline_hub_login',
});

const MAX_TRACKED_SENDS = 500;

/** Session-wide notices kept for a screen that mounts later. */
const MAX_BUFFERED_SESSION_NOTICES = 2;

/** A notice about the whole session (a cache reset), not one chat or message. */
export function isSessionWideNotice(notice: OfflineNotice): boolean {
  return notice.kind === 'unsent_messages_lost' || notice.kind === 'unsent_messages_maybe_lost';
}

/** Forward-only transitions; `failed → sending` is a retry, anything may become `sent`. */
function isForward(from: OfflineSendState | undefined, to: OfflineSendState): boolean {
  if (from === undefined) return true;
  if (from === to) return false;
  if (to === 'sent') return from !== 'discarded';
  if (from === 'sent' || from === 'discarded') return false;
  if (from === 'failed') return to === 'sending' || to === 'discarded';
  return true;
}

function normalizeReason(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const { code, reason } = raw as { code?: unknown; reason?: unknown };
    if (typeof code === 'string') return code;
    if (typeof reason === 'string') return reason;
  }
  return '';
}

/**
 * The map key of a chat whose read is waiting: the receiver, case-insensitive,
 * so a read remembered under one spelling of a uid is still found from a
 * conversation row's.
 */
function readKey(receiverId: string, receiverType: string): string {
  return `${receiverType.toLowerCase()}:${receiverId.toLowerCase()}`;
}

/** The conversation id a message belongs to, when the SDK has stamped it. */
export function conversationIdOf(message: CometChat.BaseMessage | null | undefined): string {
  try {
    const id = message?.getConversationId();
    return typeof id === 'string' ? id : '';
  } catch {
    return '';
  }
}

export class OfflineHub {
  private static instance: OfflineHub | null = null;

  static getInstance(): OfflineHub {
    OfflineHub.instance ??= new OfflineHub();
    return OfflineHub.instance;
  }

  /** Tests only: drop the singleton so each test starts clean. */
  static resetForTests(): void {
    OfflineHub.instance = null;
  }

  readonly sendState = new OfflineChannel<SendStateEvent>();
  readonly messageSync = new OfflineChannel<MessageSyncEvent>();
  readonly syncFailed = new OfflineChannel<SyncFailedEvent>();
  readonly conversationSync = new OfflineChannel<ConversationSyncEvent>();
  readonly messagesUpdated = new OfflineChannel<MessagesUpdatedEvent>();
  readonly cacheReset = new OfflineChannel<CacheResetEvent>();
  readonly mediaReady = new OfflineChannel<MediaReadyEvent>();
  readonly notice = new OfflineChannel<OfflineNotice>();
  /** Emits the new `gen` after a logout, user switch or cache reset. */
  readonly session = new OfflineChannel<number>();
  /** Emits the new `gen` after a logout or user switch only (not a cache reset). */
  readonly sessionEnd = new OfflineChannel<number>();
  /**
   * Emits the current `gen` when someone is signed in after a session ended: a
   * user switch, or a login after a logout. The lists that cleared themselves
   * on `session` load again from here, instead of staying blank until they are
   * remounted (Prajwal `useCometChatConversations.ts:849`). The first login of
   * the process ends no session and emits nothing, and neither does signing the
   * user already signed in back in, so a list on screen is never reloaded for
   * nothing.
   */
  readonly login = new OfflineChannel<number>();
  /**
   * Emits after a read this device made offline has reached the server: the
   * chat is read there now, so a list still showing the count its sync page
   * carried can clear it (Aanshi D3 on #2460).
   */
  readonly conversationRead = new OfflineChannel<{
    gen: number;
    id: string;
    type: string;
    /**
     * The id of the last message the user actually read offline, when the
     * read carried a mark. A listed row whose newest message is past it still
     * has unread messages — the server kept them unread too, so its count
     * must stand (N1). Absent when the whole chat was marked read.
     */
    upToId?: number;
  }>();

  private started = false;
  private genValue = 0;

  /**
   * "Unsent message removed" notices raised in the turn running now, cleared on
   * the next microtask. A cache reset with a known count reads it to tell
   * whether the user has already been told about those sends one by one (D5).
   */
  private discardNoticesThisTurn = 0;
  private noticeSeq = 0;
  private sessionUid: string | null = null;

  /**
   * The uid the hub has a session for, or `null` when nobody is signed in. A
   * list reloading on `login` reads it to see whether the chat it shows is the
   * user who just signed in (Aanshi Q2 on #2460).
   */
  get signedInUid(): string | null {
    return this.sessionUid;
  }
  /** Whether a session has ended since the last login (see `login`). */
  private sessionEnded = false;
  private publicEmit: ((event: CometChatUIEvent) => void) | null = null;
  /** Last state emitted publicly, per `localMessageId` (ON path only). */
  private readonly lastState = new Map<string, OfflineSendState>();
  /** Conversations whose read could not reach the server while offline. */
  private readonly readWhileOffline = new Map<
    string,
    { id: string; type: string; upTo?: CometChat.BaseMessage }
  >();
  /**
   * Own messages that failed without entering the outbox (failed "direct"),
   * keyed by muid. They have no FAILED status to derive from, so this
   * in-memory mark is their only record; it lasts the session, as a failed
   * send does today.
   */
  private readonly directFailures = new Map<string, string>();
  /**
   * The failure reason last reported for an outbox row, per `localMessageId`,
   * for an SDK whose message object does not carry `getFailureReason()`.
   */
  private readonly failureReasons = new Map<string, string>();
  /**
   * The acked copy of an own message, per `localMessageId`: a Delete chosen on
   * a row that went out meanwhile needs its server id (BEH-SEND-37, R162).
   */
  private readonly sentCopies = new Map<string, CometChat.BaseMessage>();
  /**
   * Own messages the user deleted while the SDK no longer held them, by
   * `localMessageId`: if a sent copy still arrives, it is deleted on the server.
   */
  private readonly deleteOnSent = new Set<string>();
  /**
   * Own messages whose refusal (queue full, file too large offline) already
   * raised its notice, by `localMessageId` (else muid). The SDK reports one
   * refusal twice, to the send's own `onError` and to the global outbox
   * listener; the notice shows once.
   */
  private readonly refusalNotices = new Set<string>();
  /**
   * Session-wide notices (a cache reset that lost unsent messages) not yet
   * shown by any screen. The SDK reports a reset once, often during init or
   * login before any list is mounted, so the hub keeps the latest ones until a
   * screen takes them (UIT-LIFE-05); each is shown in one place only.
   */
  private sessionNoticeBuffer: OfflineNotice[] = [];

  get gen(): number {
    return this.genValue;
  }

  get isStarted(): boolean {
    return this.started;
  }

  /**
   * Where the public events go: the event bus of the mounted
   * `CometChatEventsProvider` (set through `CometChatUIKit._setEmit`).
   */
  setPublicEmit(emit: ((event: CometChatUIEvent) => void) | null): void {
    this.publicEmit = emit;
  }

  /**
   * Register the SDK listeners. Safe to call from every init entry point and
   * more than once; only the first call registers.
   */
  start(): void {
    if (this.started) return;
    this.started = true;
    // An SDK below the offline floor gets nothing registered at all, so the kit
    // on SDK 4.2.x — and on 4.3.0, which is below the floor — behaves exactly as
    // before.
    if (!hasOfflineSdk()) return;
    this.register('addOfflineMessageListener', LISTENER_IDS.outbox, 'OfflineMessageListener', {
      onOutboxMessagePending: (m: CometChat.BaseMessage) => {
        this.onOutboxPending(m);
      },
      onOutboxMessageSent: (m: CometChat.BaseMessage) => {
        this.reportSendState(m, 'sent');
      },
      onOutboxMessageFailed: (m: CometChat.BaseMessage, reason: unknown) => {
        this.onOutboxFailed(m, reason);
      },
    });
    this.register('addSyncListener', LISTENER_IDS.sync, 'SyncListener', {
      onConversationSyncCompleted: (list: unknown) => {
        this.conversationSync.emit({
          gen: this.genValue,
          conversations: Array.isArray(list) ? (list as CometChat.Conversation[]) : [],
        });
      },
      onConversationSyncError: (error: unknown) => {
        this.syncFailed.emit({ gen: this.genValue, phase: 'conversation', error });
      },
      onMessageSyncCompleted: (list: unknown, outcome: unknown) => {
        this.onMessageSyncCompleted(list, outcome);
      },
      onMessageSyncError: (error: unknown) => {
        this.syncFailed.emit({ gen: this.genValue, phase: 'message', error });
      },
    });
    this.register(
      'addOfflineCacheResetListener',
      LISTENER_IDS.cacheReset,
      'OfflineCacheResetListener',
      {
        onOfflineCacheReset: (reason: unknown, lost: unknown) => {
          this.onCacheReset(reason, lost);
        },
      }
    );
    this.register('addMediaDownloadListener', LISTENER_IDS.media, 'MediaDownloadListener', {
      onMediaDownloaded: (messageKey: unknown, urlKey: unknown, localPath: unknown) => {
        this.mediaReady.emit({
          gen: this.genValue,
          messageKey:
            typeof messageKey === 'string'
              ? messageKey
              : typeof messageKey === 'number'
                ? String(messageKey)
                : '',
          urlKey: typeof urlKey === 'string' ? urlKey : '',
          localPath: typeof localPath === 'string' ? localPath : '',
        });
      },
    });
    try {
      CometChat.addMessageListener(
        LISTENER_IDS.messagesSynced,
        new CometChat.MessageListener({
          onMessagesSynced: (list: unknown) => {
            this.messagesUpdated.emit({
              gen: this.genValue,
              messages: Array.isArray(list) ? (list as CometChat.BaseMessage[]) : [],
            });
          },
        })
      );
    } catch (error) {
      CometChatLogger.error(
        'OfflineHub',
        'Could not register the synced-messages listener:',
        error
      );
    }
    try {
      CometChat.addLoginListener(
        LISTENER_IDS.login,
        new CometChat.LoginListener({
          loginSuccess: (user: CometChat.User) => {
            this.onLogin(user);
          },
          logoutSuccess: () => {
            this.endSession();
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('OfflineHub', 'Could not register the login listener:', error);
    }
  }

  private register(
    method: keyof OfflineSdkSurface,
    id: string,
    listenerClass: keyof OfflineSdkSurface,
    handlers: Record<string, unknown>
  ): void {
    if (!hasSdkFunction(method)) return;
    try {
      const add = offlineSdk()[method] as (id: string, listener: object) => void;
      add.call(offlineSdk(), id, makeSdkListener(listenerClass, handlers));
    } catch (error) {
      CometChatLogger.error('OfflineHub', `Could not register ${method}:`, error);
    }
  }

  // --- Session ---

  /** Record who is signed in; a different uid ends the previous session first. */
  onLogin(user: CometChat.User | null | undefined): void {
    let uid: string | null = null;
    try {
      uid = user?.getUid() ?? null;
    } catch {
      uid = null;
    }
    const previous = this.sessionUid;
    if (previous !== null && uid !== previous) this.endSession();
    this.sessionUid = uid;
    if (uid !== null && this.sessionEnded) {
      this.sessionEnded = false;
      this.login.emit(this.genValue);
    }
  }

  /** Logout, user switch: forget every per-session mark and bump `gen`. */
  endSession(): void {
    this.sessionEnded = true;
    this.lastState.clear();
    this.readWhileOffline.clear();
    this.directFailures.clear();
    this.failureReasons.clear();
    this.sentCopies.clear();
    this.deleteOnSent.clear();
    this.refusalNotices.clear();
    clearAliases();
    this.sessionNoticeBuffer = [];
    this.sessionUid = null;
    this.genValue++;
    this.session.emit(this.genValue);
    this.sessionEnd.emit(this.genValue);
  }

  // --- Sends ---

  /**
   * Report one transition of an own message's send. Both the per-send listener
   * and the outbox listener funnel through here, so each transition reaches
   * the screens and the public events exactly once per `localMessageId`.
   *
   * `announced` marks a `sending` the caller already announced publicly (the
   * composer publishes `inprogress` at compose time), so it is not announced
   * twice; `announced: false` asks for the public `inprogress`. Returns whether
   * the transition was new.
   */
  reportSendState(
    message: CometChat.BaseMessage,
    state: OfflineSendState,
    options: { reason?: string; direct?: boolean; announced?: boolean } = {}
  ): boolean {
    const localMessageId = localIdOf(message);
    if (state === 'failed' && options.direct) this.markDirectFailed(message, options.reason ?? '');
    else if (state !== 'failed') this.clearDirectFailed(message);
    const base = {
      gen: this.genValue,
      message,
      state,
      ...(options.reason !== undefined && { reason: options.reason }),
    };
    if (!localMessageId) {
      // Nothing to dedupe on: a message the SDK never queued (sent directly,
      // or refused). Its outcome, or its removal by the user, still has to
      // reach the screen. A `sending` without a handle is the composer's own.
      if (state === 'sending') return false;
      this.sendState.emit({
        ...base,
        localMessageId: '',
        ...(state !== 'sent' && { direct: true }),
      });
      this.emitPublic(message, state, options.reason);
      return true;
    }
    if (state === 'failed')
      this.remember(this.failureReasons, localMessageId, options.reason ?? '');
    else this.failureReasons.delete(localMessageId);
    if (state === 'sent') {
      this.remember(this.sentCopies, localMessageId, message);
      recordAlias(localMessageId, serverIdOf(message));
      if (this.deleteOnSent.delete(localMessageId)) {
        CometChat.deleteMessage(String(serverIdOf(message))).catch(() => undefined);
      }
    }
    const previous = this.lastState.get(localMessageId);
    if (!isForward(previous, state)) return false;
    this.track(localMessageId, state);
    this.sendState.emit({
      ...base,
      localMessageId,
      ...(options.direct !== undefined && { direct: options.direct }),
    });
    // `announced: true` = the caller already published `inprogress`; `false` =
    // publish it now (a fresh-send retry). Unset: a first `sending` is the
    // composer's own (already announced), a later one is a retry.
    if (state === 'sending' && (options.announced ?? previous === undefined)) {
      this.emitStateChanged(message, state, options.reason);
    } else {
      this.emitPublic(message, state, options.reason);
    }
    return true;
  }

  /** The failure reason last reported for an outbox row, or `''`. */
  failureReasonFor(localMessageId: string): string {
    return localMessageId ? (this.failureReasons.get(localMessageId) ?? '') : '';
  }

  /** The acked copy of the own message with this local handle, if it was sent this session. */
  sentCopyOf(localMessageId: string): CometChat.BaseMessage | undefined {
    return localMessageId ? this.sentCopies.get(localMessageId) : undefined;
  }

  /** Delete the sent copy of `localMessageId` on the server if it still arrives. */
  deleteWhenSent(localMessageId: string): void {
    this.deleteOnSent.add(localMessageId);
  }

  /** The state last reported for `localMessageId`, if any. */
  stateOf(localMessageId: string): OfflineSendState | undefined {
    return this.lastState.get(localMessageId);
  }

  /** Mark an own message failed (direct): not in the outbox, Retry is a fresh send. */
  markDirectFailed(message: CometChat.BaseMessage, reason: string): void {
    const muid = muidOf(message);
    if (muid) this.directFailures.set(muid, reason);
  }

  clearDirectFailed(message: CometChat.BaseMessage): void {
    const muid = muidOf(message);
    if (muid) this.directFailures.delete(muid);
  }

  /** The failure reason when `message` failed direct this session, else `undefined`. */
  directFailureOf(message: CometChat.BaseMessage | null | undefined): string | undefined {
    if (this.directFailures.size === 0) return undefined;
    const muid = muidOf(message);
    return muid ? this.directFailures.get(muid) : undefined;
  }

  /**
   * The notice for a send the outbox refused (`QUEUE_FULL`, `BYTE_OVERFLOW`),
   * raised once per message whichever SDK callback reports the refusal first
   * (UIK-SEND-03). Any other reason raises nothing.
   */
  raiseRefusalNotice(message: CometChat.BaseMessage, reason: string): void {
    if (reason !== OfflineFailureReason.queueFull && reason !== OfflineFailureReason.byteOverflow) {
      return;
    }
    const key = localIdOf(message) || muidOf(message);
    if (key) {
      if (this.refusalNotices.has(key)) return;
      this.refusalNotices.add(key);
      if (this.refusalNotices.size > MAX_TRACKED_SENDS) {
        const oldest = this.refusalNotices.values().next().value;
        if (oldest !== undefined) this.refusalNotices.delete(oldest);
      }
    }
    this.raiseNotice({
      kind: reason === OfflineFailureReason.queueFull ? 'queue_full' : 'file_too_large_offline',
      message,
      conversationId: conversationIdOf(message),
    });
  }

  /** Raise a notice on the private channel. */
  /**
   * Count one per-message discard notice for the turn running now. The SDK
   * reports the lost sends and then the reset in the same turn, so a reset
   * that follows can see that the user has already been told.
   */
  private countDiscardNoticeThisTurn(): void {
    if (this.discardNoticesThisTurn === 0) {
      queueMicrotask(() => {
        this.discardNoticesThisTurn = 0;
      });
    }
    this.discardNoticesThisTurn++;
  }

  raiseNotice(notice: Omit<OfflineNotice, 'id' | 'gen'>): void {
    this.noticeSeq++;
    const raised: OfflineNotice = { ...notice, id: this.noticeSeq, gen: this.genValue };
    if (isSessionWideNotice(raised)) {
      // Kept across later resets (their lost messages stay lost); a logout or
      // user switch clears them (endSession).
      this.sessionNoticeBuffer = [...this.sessionNoticeBuffer, raised].slice(
        -MAX_BUFFERED_SESSION_NOTICES
      );
    }
    this.notice.emit(raised);
  }

  /**
   * Claim one session-wide notice for display. `true` for the first screen that
   * asks (it shows the notice), `false` for any other (it was shown elsewhere).
   */
  claimSessionNotice(id: number): boolean {
    const before = this.sessionNoticeBuffer.length;
    this.sessionNoticeBuffer = this.sessionNoticeBuffer.filter(n => n.id !== id);
    return this.sessionNoticeBuffer.length !== before;
  }

  /**
   * The session-wide notices raised before any screen took them (replayed to
   * the first screen that mounts in this session); they are claimed by the
   * call, so a second screen gets none.
   */
  takeSessionNotices(): OfflineNotice[] {
    const buffered = this.sessionNoticeBuffer;
    this.sessionNoticeBuffer = [];
    return buffered;
  }

  private remember<V>(map: Map<string, V>, localMessageId: string, value: V): void {
    map.delete(localMessageId);
    map.set(localMessageId, value);
    if (map.size > MAX_TRACKED_SENDS) {
      const oldest = map.keys().next().value;
      if (oldest !== undefined) map.delete(oldest);
    }
  }

  private track(localMessageId: string, state: OfflineSendState): void {
    this.lastState.delete(localMessageId);
    this.lastState.set(localMessageId, state);
    if (this.lastState.size > MAX_TRACKED_SENDS) {
      const oldest = this.lastState.keys().next().value;
      if (oldest !== undefined) this.lastState.delete(oldest);
    }
  }

  private emitPublic(
    message: CometChat.BaseMessage,
    state: OfflineSendState,
    reason?: string
  ): void {
    // A removal is not a send outcome: integrators hear about it through
    // ui:message/send-state-changed only (no ui:message/sent error for a delete).
    if (state !== 'discarded') {
      const status =
        state === 'sent'
          ? CometChatMessageStatus.success
          : state === 'sending'
            ? CometChatMessageStatus.inprogress
            : CometChatMessageStatus.error;
      this.publish({ type: 'ui:message/sent', message, status });
    }
    this.emitStateChanged(message, state, reason);
  }

  private emitStateChanged(
    message: CometChat.BaseMessage,
    state: OfflineSendState,
    reason?: string
  ): void {
    this.publish({
      type: 'ui:message/send-state-changed',
      message,
      state,
      ...(reason ? { reason } : {}),
    });
  }

  private publish(event: CometChatUIEvent): void {
    try {
      this.publicEmit?.(event);
    } catch (error) {
      CometChatLogger.error('OfflineHub', `${event.type} subscriber threw:`, error);
    }
  }

  private onOutboxPending(message: CometChat.BaseMessage): void {
    // A retry turns a failed row back into a sending one; a fresh send was
    // already announced by its composer.
    this.reportSendState(message, 'sending', {
      announced: this.lastState.get(localIdOf(message)) !== 'failed',
    });
  }

  private onOutboxFailed(message: CometChat.BaseMessage, rawReason: unknown): void {
    const reason = normalizeReason(rawReason);
    if (
      reason === OfflineFailureReason.discarded ||
      reason === OfflineFailureReason.queueOverflow
    ) {
      if (this.reportSendState(message, 'discarded', { reason })) {
        this.countDiscardNoticeThisTurn();
        this.raiseNotice({
          kind: 'unsent_message_removed',
          count: 1,
          message,
          conversationId: conversationIdOf(message),
        });
      }
      return;
    }
    const direct =
      reason === OfflineFailureReason.queueFull || reason === OfflineFailureReason.byteOverflow;
    const isNew = this.reportSendState(message, 'failed', { reason, direct });
    if (!direct) return;
    if (!isNew) {
      // The send's own onError reported the failure first; this callback is
      // the one that names the refusal for certain, so it is kept.
      this.markDirectFailed(message, reason);
      const localMessageId = localIdOf(message);
      if (localMessageId) this.remember(this.failureReasons, localMessageId, reason);
    }
    this.raiseRefusalNotice(message, reason);
  }

  // --- Sync, reset ---

  private onMessageSyncCompleted(list: unknown, outcome: unknown): void {
    this.messageSync.emit({
      gen: this.genValue,
      messages: Array.isArray(list) ? (list as CometChat.BaseMessage[]) : [],
      outcome: typeof outcome === 'string' ? outcome : '',
    });
    this.flushReadsMadeOffline();
  }

  private onCacheReset(rawReason: unknown, rawLost: unknown): void {
    const reason = typeof rawReason === 'string' ? rawReason : '';
    const lostNumber =
      typeof rawLost === 'number' ? rawLost : rawLost == null ? null : Number(rawLost);
    const pendingMessagesLost =
      lostNumber === null || !Number.isFinite(lostNumber) || lostNumber < 0 ? null : lostNumber;
    // Everything on screen came from the old cache: every list reloads.
    this.lastState.clear();
    this.failureReasons.clear();
    this.genValue++;
    this.session.emit(this.genValue);
    this.cacheReset.emit({ gen: this.genValue, reason, pendingMessagesLost });
    this.publish({ type: 'ui:offline/cache-reset', reason, pendingMessagesLost });
    if (pendingMessagesLost !== null && pendingMessagesLost > 0) {
      // A known count arrives with one DISCARDED callback per lost send, raised
      // just before the reset: the store wipe fans them through the lost-unsent
      // reporter (SDK `OfflineRuntime.ts:2199`), and an open that rebuilt the
      // store and the damage rebuild send theirs first by design
      // (`OfflineRuntime.ts:2615`, `:2727`). Each one already became a notice
      // naming the chat, so a second session-wide "N lost" notice tells the
      // user the same thing twice (D5). It is still raised when none of them
      // reached us - a wipe during the very first login can run before this
      // hub's outbox listener exists - so a loss is never announced to nobody.
      if (this.discardNoticesThisTurn === 0) {
        this.raiseNotice({ kind: 'unsent_messages_lost', count: pendingMessagesLost });
      }
    } else if (pendingMessagesLost === null && reason !== 'ENCRYPTION_CHANGED') {
      // ENCRYPTION_CHANGED already reported each lost send as DISCARDED.
      this.raiseNotice({ kind: 'unsent_messages_maybe_lost' });
    }
  }

  // --- Reads made offline (AC-7.4) ---

  /**
   * Remember a conversation whose read receipt could not reach the server, and
   * how far it was read.
   *
   * `upTo` is the newest message the list was showing when the user read it.
   * Without it the flush can only clear the WHOLE conversation, which also
   * clears whatever arrived during the outage — the user is never told about
   * those messages, here or on any other device (Aanshi N1 on #2460). With it,
   * the flush marks read up to that message and nothing after it.
   *
   * A later read of the same chat keeps the newer mark: the user read further.
   */
  rememberReadWhileOffline(
    receiverId: string,
    receiverType: string,
    upTo?: CometChat.BaseMessage
  ): void {
    if (!receiverId || !receiverType) return;
    const key = readKey(receiverId, receiverType);
    const previous = this.readWhileOffline.get(key)?.upTo;
    const mark =
      previous && (!upTo || previous.getId() >= upTo.getId()) ? previous : (upTo ?? previous);
    this.readWhileOffline.set(key, { id: receiverId, type: receiverType, upTo: mark });
  }

  /**
   * How far this device read a chat offline, when the read is still unsent. A
   * sync page whose newest message is past this mark still carries unread
   * messages, so its count must stand.
   */
  readMarkFor(receiverId: string, receiverType: string): CometChat.BaseMessage | undefined {
    return this.readWhileOffline.get(readKey(receiverId, receiverType))?.upTo;
  }

  /**
   * Is a read this device made offline still waiting to reach the server? Until
   * it does, the server's own copy of that chat still carries the count the
   * user has already cleared.
   */
  readStillUnsent(receiverId: string, receiverType: string): boolean {
    return this.readWhileOffline.has(readKey(receiverId, receiverType));
  }

  private flushReadsMadeOffline(): void {
    if (this.readWhileOffline.size === 0) return;
    const pending = Array.from(this.readWhileOffline.values());
    this.readWhileOffline.clear();
    for (const { id, type, upTo } of pending) {
      // The generation this flush belongs to, read NOW and not when the answer
      // comes back: a read that settles after a logout or a user switch must
      // not zero a badge, or re-arm itself, in the next session's list
      // (Aanshi F2 on #2460).
      const gen = this.genValue;
      try {
        // `markAsRead` marks every message up to that one; `markConversationAsRead`
        // clears the chat whole, so it is the fallback for a read with no mark.
        const sent = upTo
          ? Promise.resolve(CometChat.markAsRead(upTo))
          : CometChat.markConversationAsRead(id, type);
        // Two-argument `then`: a subscriber that throws must not be read as the
        // read having failed, which would remember it again.
        sent.then(
          () => {
            if (gen !== this.genValue) return;
            this.conversationRead.emit({ gen, id, type, upToId: upTo?.getId() });
          },
          () => {
            if (gen !== this.genValue) return;
            this.rememberReadWhileOffline(id, type, upTo);
          }
        );
      } catch {
        if (gen === this.genValue) this.rememberReadWhileOffline(id, type, upTo);
      }
    }
  }
}
