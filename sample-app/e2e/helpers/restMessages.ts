import { adminHeaders, restBase, userHeaders } from './pinSave';

/**
 * REST helpers that put any kind of message into a group as any user: media that reuses files
 * already uploaded, custom messages, read receipts and poll votes. They reach states that would
 * otherwise need a second browser session, such as an incoming voice note or a voter without an
 * avatar.
 */

/** An attachment as the API stores it on a media message. */
export interface Attachment {
  url: string;
  name: string;
  mimeType: string;
  extension: string;
  size: number;
}

export type MediaType = 'image' | 'video' | 'audio' | 'file';

interface MessageRow {
  type: string;
  data?: {
    attachments?: Attachment[];
    metadata?: { '@injected'?: { extensions?: { polls?: { id?: string; question?: string } } } };
  };
}

async function failure(res: Response, what: string): Promise<Error> {
  return new Error(`${what} failed: ${String(res.status)} ${await res.text()}`);
}

/** Send a message of any category and type to a group as `as`. Returns the new message's id. */
export async function sendToGroup(
  guid: string,
  as: string,
  message: { category: 'message' | 'custom'; type: string; data: Record<string, unknown> }
): Promise<number> {
  const res = await fetch(`${restBase()}/messages`, {
    method: 'POST',
    headers: userHeaders(as),
    body: JSON.stringify({ receiver: guid, receiverType: 'group', ...message }),
  });
  if (!res.ok) throw await failure(res, `Sending a ${message.type} message to ${guid} as ${as}`);
  const payload = (await res.json()) as { data?: { id?: string | number } };
  return Number(payload.data?.id);
}

async function groupMessages(guid: string, as: string): Promise<MessageRow[]> {
  const res = await fetch(`${restBase()}/groups/${guid}/messages?per_page=100`, { headers: userHeaders(as) });
  if (!res.ok) throw await failure(res, `Listing the messages of ${guid}`);
  return ((await res.json()) as { data?: MessageRow[] }).data ?? [];
}

/** The first attachment of each media type sent to a group so far, to send again without uploading. */
export async function groupAttachments(guid: string, as: string): Promise<Partial<Record<MediaType, Attachment>>> {
  const found: Partial<Record<MediaType, Attachment>> = {};
  for (const message of await groupMessages(guid, as)) {
    const attachment = message.data?.attachments?.[0];
    const type = message.type as MediaType;
    if (attachment && ['image', 'video', 'audio', 'file'].includes(type)) found[type] ??= attachment;
  }
  return found;
}

/** Mark every message in a group read for `as`, as if they had opened the chat. */
export async function markGroupRead(guid: string, as: string): Promise<void> {
  const res = await fetch(`${restBase()}/groups/${guid}/conversation/read`, {
    method: 'POST',
    headers: userHeaders(as),
    body: '{}',
  });
  if (!res.ok) throw await failure(res, `Marking ${guid} read for ${as}`);
}

export async function addGroupMembers(guid: string, uids: string[]): Promise<void> {
  const res = await fetch(`${restBase()}/groups/${guid}/members`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ participants: uids }),
  });
  if (!res.ok) throw await failure(res, `Adding ${uids.join(', ')} to ${guid}`);
}

/**
 * Vote for option `option` (1-based) of the poll asking `question` in a group, as `as`, through the
 * Polls extension the way the SDK calls it: with the user's auth token.
 */
export async function voteInPoll({
  guid,
  question,
  as,
  option,
}: {
  guid: string;
  question: string;
  as: string;
  option: number;
}): Promise<void> {
  const poll = (await groupMessages(guid, as))
    .map(message => message.data?.metadata?.['@injected']?.extensions?.polls)
    .find(found => found?.question === question);
  if (!poll?.id) throw new Error(`No poll asking "${question}" in ${guid}`);

  const tokenRes = await fetch(`${restBase()}/users/${as}/auth_tokens`, { method: 'POST', headers: adminHeaders(), body: '{}' });
  if (!tokenRes.ok) throw await failure(tokenRes, `Creating an auth token for ${as}`);
  const authToken = ((await tokenRes.json()) as { data?: { authToken?: string } }).data?.authToken ?? '';

  const region = process.env.COMETCHAT_REGION ?? 'us';
  const res = await fetch(`https://polls-${region}.cometchat.io/v2/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      appId: process.env.COMETCHAT_APP_ID ?? '',
      authToken,
      chatApiVersion: 'v3.0',
    },
    body: JSON.stringify({ vote: option, id: poll.id }),
  });
  if (!res.ok) throw await failure(res, `Voting in "${question}" as ${as}`);
}
