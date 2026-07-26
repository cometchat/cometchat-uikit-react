/**
 * Send pipeline fan-out for multi-attachments.
 *
 * Groups success tray items by media kind, orders them in the fixed sequence
 * (image → video → audio → file), and creates one MediaMessage per type —
 * all sharing the same batchId.
 *
 * @module sendBatch
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { TrayItem, TrayItemKind } from './CometChatMessageComposer.types';
import { stampBatchMetadata, getBatchId } from '../../utils/CometChatMetadataUtils';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';

/** A group of tray items sharing the same media kind. */
export interface TrayItemGroup {
  kind: TrayItemKind;
  items: TrayItem[];
}

/** Mapping from TrayItemKind to the SDK message type string. */
const TYPE_MAP: Record<TrayItemKind, string> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  file: 'file',
};

/** The fixed ordering sequence for fan-out. */
const KIND_ORDER: TrayItemKind[] = ['image', 'video', 'audio', 'file'];

/**
 * Pure helper: groups success-only tray items by kind and orders the groups in
 * the fixed sequence [image, video, audio, file], filtered to only types that
 * are present.
 *
 * Exported for property testing (Properties 4, 5, 6).
 */
export function groupAndOrderTrayItems(items: TrayItem[]): TrayItemGroup[] {
  const successItems = items.filter(item => item.status === 'success');

  // Group by kind
  const groups = new Map<TrayItemKind, TrayItem[]>();
  for (const item of successItems) {
    const existing = groups.get(item.kind);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(item.kind, [item]);
    }
  }

  // Order by fixed sequence, filter to present types only
  const result: TrayItemGroup[] = [];
  for (const kind of KIND_ORDER) {
    const kindItems = groups.get(kind);
    if (kindItems && kindItems.length > 0) {
      result.push({ kind, items: kindItems });
    }
  }
  return result;
}

/** Options for the sendBatch function. */
export interface SendBatchOptions {
  /** The tray items (will be filtered to success-only internally). */
  items: TrayItem[];
  /** The batchId from the tray. */
  batchId: string;
  /** Caption text (composer text). Empty string means no caption. */
  caption: string;
  /** Receiver id (uid or guid). */
  receiverId: string;
  /** Receiver type ('user' | 'group'). */
  receiverType: string;
  /** Parent message id for threading. */
  parentMessageId?: number;
  /** Message being replied to. */
  messageToReply?: CometChat.BaseMessage | null;
  /** Publish event callback (publishes CometChat events). */
  publish: (event: Record<string, unknown>) => void;
  /** Optional onSendButtonClick callback called for each confirmed message. */
  onSendButtonClick?: (message: CometChat.BaseMessage, mode?: 'send' | 'edit') => void;
}

/**
 * Generate a unique muid (same pattern as existing composer sends).
 */
function freshMuid(): string {
  return `_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Sends all tray items as a batch: one MediaMessage per present type, ordered
 * image → video → audio → file. Each message carries the shared batchId in
 * metadata. The caption is placed on the last message only.
 *
 * Best-effort: if any sendMediaMessage throws, that message gets an error event
 * but remaining messages are still sent. The tray should be cleared after this
 * call regardless of individual failures.
 *
 * @returns Promise that resolves when all sends are complete (success or error).
 */
export async function sendBatch(options: SendBatchOptions): Promise<void> {
  const {
    items,
    batchId,
    caption,
    receiverId,
    receiverType,
    parentMessageId,
    messageToReply,
    publish,
    onSendButtonClick,
  } = options;

  const groups = groupAndOrderTrayItems(items);
  if (groups.length === 0) return;

  // Get the logged-in user once for the whole batch.
  let loggedInUser: CometChat.User | null = null;
  try {
    loggedInUser = await CometChat.getLoggedinUser();
  } catch {
    /* non-fatal */
  }

  const lastIndex = groups.length - 1;
  const nowSeconds = Math.floor(Date.now() / 1000);

  for (let p = 0; p < groups.length; p++) {
    const group = groups[p];
    if (!group) continue;
    const isFirst = p === 0;
    const isLast = p === lastIndex;

    // Create the MediaMessage with null file (attachments are pre-uploaded and set
    // via setAttachments — the SDK skips the upload step when file is null/empty and
    // sends only the attachments array).
    const msg = new CometChat.MediaMessage(receiverId, null, TYPE_MAP[group.kind], receiverType);

    // Set SDK attachments (the uploaded Attachment objects, not Files).
    const attachments = group.items
      .map(item => item.attachment)
      .filter((a): a is CometChat.Attachment => a !== undefined);
    msg.setAttachments(attachments);

    // Unique muid per message.
    msg.setMuid(freshMuid());

    // Monotonically increasing sentAt for deterministic ordering.
    msg.setSentAt(nowSeconds + p);

    // Stamp batch metadata. Audio messages do NOT get audioType (they are
    // attached audio files, not voice notes — audioType stays absent so they
    // route to AudiosBubble per R7.2).
    const captionForThisMsg = isLast && caption.trim() ? caption.trim() : undefined;
    stampBatchMetadata(msg, { batchId, caption: captionForThisMsg });

    // Threading: parentMessageId.
    if (parentMessageId) {
      msg.setParentMessageId(parentMessageId);
    }

    // Reply: quoted message + quotedMessageId on the FIRST message of the batch
    // only. When a batch splits into multiple messages (mixed attachment types),
    // quoting every message would render the reply preview on each bubble; the
    // reply belongs to the batch as a whole, so it's attached to the lead message.
    if (messageToReply && isFirst) {
      (msg as unknown as { setQuotedMessage: (m: CometChat.BaseMessage) => void }).setQuotedMessage(
        messageToReply
      );
      (msg as unknown as { setQuotedMessageId: (id: number) => void }).setQuotedMessageId(
        messageToReply.getId()
      );
    }

    // Set sender.
    if (loggedInUser) {
      msg.setSender(loggedInUser);
    }

    // Publish optimistic (inprogress).
    publish({
      type: 'ui:message/sent',
      message: msg,
      status: CometChatMessageStatus.inprogress,
    });

    // Send via SDK — best-effort, continue on failure.
    try {
      const confirmedMessage = (await CometChat.sendMediaMessage(msg)) as CometChat.MediaMessage;

      // Defensive carry-over: the pre-uploaded send path (null file + setAttachments)
      // can return a confirmed message that dropped fields we set on the optimistic
      // message. Re-apply them so the confirmed message reconciles into the right
      // list and stays grouped:
      // - parentMessageId: if lost, a threaded reply looks unthreaded and leaks into
      //   the main list (and never reconciles in the thread list) — see isMessageForConversation.
      // - batchId metadata + caption: if lost, batch grouping and the batch caption break.
      if (parentMessageId && confirmedMessage.getParentMessageId() !== parentMessageId) {
        confirmedMessage.setParentMessageId(parentMessageId);
      }
      if (getBatchId(confirmedMessage) !== batchId) {
        stampBatchMetadata(confirmedMessage, { batchId, caption: captionForThisMsg });
      } else if (captionForThisMsg !== undefined && !confirmedMessage.getCaption()) {
        confirmedMessage.setCaption(captionForThisMsg);
      }

      publish({
        type: 'ui:message/sent',
        message: confirmedMessage,
        status: CometChatMessageStatus.success,
      });

      if (messageToReply && isFirst) {
        publish({
          type: 'ui:compose/reply',
          message: confirmedMessage,
          status: CometChatMessageStatus.success,
          parentMessageId: parentMessageId ?? null,
        });
      }

      if (onSendButtonClick) {
        onSendButtonClick(confirmedMessage, 'send');
      }
    } catch (error) {
      // Attach error to the message for bubble error display.
      try {
        const existingMetadata = msg.getMetadata() as Record<string, unknown>;
        msg.setMetadata({ ...existingMetadata, error });
      } catch {
        /* non-fatal */
      }
      Object.defineProperty(msg, '_ccError', {
        value: error,
        writable: true,
        configurable: true,
      });

      publish({
        type: 'ui:message/sent',
        message: msg,
        status: CometChatMessageStatus.error,
      });
      // Best-effort: continue sending remaining messages.
    }
  }
}
