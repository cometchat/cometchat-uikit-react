/**
 * The one place the kit asks the Chat SDK whether offline support is on.
 *
 * Every offline-dependent decision reads {@link isOfflineOn} once, at the
 * moment of the decision (one fetch, one send, one reconnect event, one Retry
 * tap, one render), and passes the answer down that operation. Nothing caches
 * it: the SDK can switch offline off mid-session (kill switch) or on at the
 * next login, and the next operation must see the new value.
 *
 * The peer dependency stays `^4.2.0`, and SDKs before the offline release have
 * none of these symbols, so every offline SDK member is reached through
 * {@link offlineSdk} and feature-detected. On an SDK without them
 * `isOfflineOn()` answers `false` and the kit runs today's code.
 *
 * Feature detection alone is not enough for the floor: published Chat SDK 4.3.0
 * already has every offline static and listener, so the kit also checks for a
 * member only 4.3.1 has ({@link hasOfflineSdk}).
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

/** A listener object or the SDK class that wraps one. */
type ListenerCtor = new (handlers: Record<string, unknown>) => object;

/**
 * The SDK's offline surface (Chat SDK 4.3+), declared structurally so no
 * public declaration of the kit names an SDK-4.3-only type. Every member is
 * optional: an older SDK has none of them.
 *
 * @internal
 */
export interface OfflineSdkSurface {
  isOfflineEnabled?: () => boolean;
  addOfflineMessageListener?: (id: string, listener: object) => void;
  addSyncListener?: (id: string, listener: object) => void;
  addOfflineCacheResetListener?: (id: string, listener: object) => void;
  addMediaDownloadListener?: (id: string, listener: object) => void;
  retryMessage?: (localMessageId: string, listener?: object) => Promise<void>;
  discardLocalMessage?: (localMessageId: string, listener?: object) => Promise<void>;
  getCachedMediaObjectURL?: (attachment: object) => Promise<string | null>;
  getMediaCachingMode?: () => string;
  downloadMedia?: (attachment: object, callback?: object) => void;
  getConnectionStatus?: () => string;
  CONNECTION_STATUS?: { CONNECTED?: string };
  /** `SCHEMA_RESET` first ships in 4.3.1; it is the kit's SDK floor probe. */
  OfflineCacheResetReason?: { SCHEMA_RESET?: string };
  sendMessage: (message: CometChat.BaseMessage, listener?: object) => Promise<unknown>;
  sendMediaMessage: (message: CometChat.BaseMessage, listener?: object) => Promise<unknown>;
  sendCustomMessage: (message: CometChat.BaseMessage, listener?: object) => Promise<unknown>;
  sendInteractiveMessage?: (message: CometChat.BaseMessage, listener?: object) => Promise<unknown>;
  markConversationAsRead?: (id: string, type: string) => Promise<unknown>;
  MessageSentListener?: ListenerCtor;
  OfflineMessageListener?: ListenerCtor;
  SyncListener?: ListenerCtor;
  OfflineCacheResetListener?: ListenerCtor;
  MediaDownloadListener?: ListenerCtor;
  MediaCallbackListener?: ListenerCtor;
  MessageFetchListener?: ListenerCtor;
  ConversationFetchListener?: ListenerCtor;
  ConversationDetailsListener?: ListenerCtor;
  MessageDetailsListener?: ListenerCtor;
  UserFetchListener?: ListenerCtor;
  GroupFetchListener?: ListenerCtor;
  GroupMemberFetchListener?: ListenerCtor;
  BannedMemberFetchListener?: ListenerCtor;
  ReactionFetchListener?: ListenerCtor;
  NotificationFeedFetchListener?: ListenerCtor;
  ThreadFetchListener?: ListenerCtor;
}

/**
 * Untyped view of the SDK's static surface. Offline members are reached
 * through this accessor, never through typed references to 4.3 types.
 *
 * @internal
 */
export function offlineSdk(): OfflineSdkSurface {
  return CometChat as unknown as OfflineSdkSurface;
}

/** Whether the installed SDK has a static function called `name`. @internal */
export function hasSdkFunction(name: keyof OfflineSdkSurface): boolean {
  try {
    return typeof offlineSdk()[name] === 'function';
  } catch {
    return false;
  }
}

/**
 * Build an SDK listener: the SDK's class when the installed SDK has it, else
 * the plain handler object (the SDK reads handlers by property name).
 *
 * @internal
 */
export function makeSdkListener(
  className: keyof OfflineSdkSurface,
  handlers: Record<string, unknown>
): object {
  const Listener = offlineSdk()[className];
  if (typeof Listener === 'function') {
    try {
      return new (Listener as ListenerCtor)(handlers);
    } catch {
      /* fall back to the plain object */
    }
  }
  return handlers;
}

/**
 * Whether the installed SDK is one the kit runs offline on: Chat SDK 4.3.1 or
 * later. Published 4.3.0 already has `isOfflineEnabled` and the rest of the
 * offline surface, but not the 4.3.1 fixes the kit relies on (a cache write
 * from an ended session landing in the next user's cache, a catch-up page with
 * no update time wiping the cached conversations, sends stuck PENDING after a
 * short drop, `getName()` throwing on a nameless cached user), and it lacks
 * `ConversationsRequest.getPinnedBy()`, which the conversations reconcile
 * needs. So the floor also requires `OfflineCacheResetReason.SCHEMA_RESET`,
 * which first ships in 4.3.1. Below the floor the kit runs online only, exactly
 * as it does on 4.2.x.
 *
 * @internal
 */
export function hasOfflineSdk(): boolean {
  try {
    const sdk = offlineSdk();
    return (
      typeof sdk.isOfflineEnabled === 'function' &&
      sdk.OfflineCacheResetReason?.SCHEMA_RESET === 'SCHEMA_RESET'
    );
  } catch {
    return false;
  }
}

/**
 * `CometChat.isOfflineEnabled()`; `false` when the SDK is below the offline
 * floor ({@link hasOfflineSdk}) or the call throws. The only call site of
 * `isOfflineEnabled` in the kit.
 *
 * @internal
 */
export function isOfflineOn(): boolean {
  try {
    if (!hasOfflineSdk()) return false;
    return offlineSdk().isOfflineEnabled?.() === true;
  } catch {
    return false;
  }
}

/**
 * Whether the SDK's realtime connection is up; `false` when the SDK cannot say.
 *
 * @internal
 */
export function isSdkConnected(): boolean {
  try {
    const sdk = offlineSdk();
    if (typeof sdk.getConnectionStatus !== 'function') return false;
    return sdk.getConnectionStatus() === (sdk.CONNECTION_STATUS?.CONNECTED ?? 'connected');
  } catch {
    return false;
  }
}
