/**
 * The UI Kit state contract (offline TEST-PLAN §3.3): automation identifiers
 * test runners read, shipped in every build and never read by screen readers.
 * They are `data-cc` / `data-cc-*` attributes: an element that already carries
 * an identifier (`data-testid`, `data-message-id`, `data-file-id`) keeps it.
 * No identifier carries message text; runners read the visible text.
 *
 * The attributes are the same with offline on and off (only the `state` value
 * reflects the offline send state), so an offline-off baseline and the offline
 * build expose the same identifiers.
 *
 * The frame probe (§3.3) appends the rows a list committed to a log on every
 * render. It exists only in source builds that define `__CC_FRAME_PROBE__` as
 * `true` (the sample app's E2E mode); the published build defines it `false`
 * and the bundler drops it, and it also needs a probe function the page
 * installs on `globalThis.__ccFrameProbe`.
 *
 * @internal
 */
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { getReceiptStatus } from '../MessageReceiptUtils';
import { offlineRowStateOf } from './rowState';
import { renderKey, serverIdOf } from './identity';

declare const __CC_FRAME_PROBE__: boolean | undefined;

/** A message row's state as the contract names it. */
export type ContractRowState = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/** The contract state of a message row: the offline send state first, else its receipt. */
export function contractRowStateOf(message: CometChat.BaseMessage): ContractRowState {
  const offline = offlineRowStateOf(message);
  if (offline === 'sending') return 'sending';
  if (offline === 'failed') return 'failed';
  let receipt: string;
  try {
    receipt = getReceiptStatus(message);
  } catch {
    receipt = 'sent';
  }
  switch (receipt) {
    case 'wait':
      return 'sending';
    case 'error':
      return 'failed';
    case 'delivered':
      return 'delivered';
    case 'read':
      return 'read';
    default:
      return 'sent';
  }
}

function senderUidOf(message: CometChat.BaseMessage): string {
  try {
    const sender = message.getSender() as CometChat.User | undefined;
    return sender?.getUid() ?? '';
  } catch {
    return '';
  }
}

/** One row as the frame probe and the row attributes describe it. */
export interface ContractRow {
  key: string;
  id: string;
  state: ContractRowState;
  mine: boolean;
}

export function contractRowOf(message: CometChat.BaseMessage, loggedInUid: string): ContractRow {
  const id = serverIdOf(message);
  return {
    key: renderKey(message, loggedInUid),
    id: id > 0 ? String(id) : '',
    state: contractRowStateOf(message),
    mine: senderUidOf(message) === loggedInUid,
  };
}

/** The `data-cc-*` attributes of a message row. */
export function messageRowAttributes(row: ContractRow): Record<string, string> {
  return {
    'data-cc': 'message-row',
    'data-cc-key': row.key,
    'data-cc-id': row.id,
    'data-cc-state': row.state,
    'data-cc-mine': row.mine ? 'true' : 'false',
  };
}

/** A list footer as the contract names it. */
export type ContractListFooter = 'loading' | 'connect-to-load-more' | 'end' | 'none';

type FrameProbe = (frame: { list: string; rows: unknown[] }) => void;

/**
 * Hand one committed frame to the page's probe (E2E source builds only). The
 * rows are built only when a probe is installed.
 */
export function reportFrame(list: string, buildRows: () => unknown[]): void {
  if (typeof __CC_FRAME_PROBE__ === 'undefined' || !__CC_FRAME_PROBE__) return;
  const probe = (globalThis as { __ccFrameProbe?: FrameProbe }).__ccFrameProbe;
  if (typeof probe !== 'function') return;
  try {
    probe({ list, rows: buildRows() });
  } catch {
    /* a probe's own error never breaks the list */
  }
}
