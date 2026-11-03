import { restBase, adminHeaders } from './pinSave';
import { PRIMARY_USER, SECONDARY_USER } from './seed';

/**
 * Throwaway fixtures for tests that must not touch the shared seed data —
 * destructive actions (delete, leave, kick, ban, block) and hostile content.
 *
 * Every group gets a `e2e-group-tmp-…` guid, so a run that dies before its own
 * cleanup is still swept by `npm run e2e:cleanup` (which removes `e2e-group-*`).
 */
export interface ThrowawayGroup {
  guid: string;
  name: string;
  /** Deletes the group. Safe to call more than once. */
  dispose: () => Promise<void>;
}

export async function createThrowawayGroup({
  name,
  owner = PRIMARY_USER,
  members = [SECONDARY_USER],
  type = 'public',
  password,
}: {
  name: string;
  owner?: string;
  members?: string[];
  type?: 'public' | 'private' | 'password';
  password?: string;
}): Promise<ThrowawayGroup> {
  const guid = `e2e-group-tmp-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const created = await fetch(`${restBase()}/groups`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ guid, name, type, owner, ...(password ? { password } : {}) }),
  });
  if (!created.ok) throw new Error(`createThrowawayGroup(${name}) failed: HTTP ${created.status} ${await created.text()}`);

  if (members.length > 0) {
    const added = await fetch(`${restBase()}/groups/${guid}/members`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ participants: members }),
    });
    if (!added.ok) throw new Error(`adding members to ${guid} failed: HTTP ${added.status}`);
  }

  let disposed = false;
  return {
    guid,
    name,
    dispose: async () => {
      if (disposed) return;
      disposed = true;
      await fetch(`${restBase()}/groups/${guid}`, { method: 'DELETE', headers: adminHeaders() });
    },
  };
}

export interface ThrowawayUser {
  uid: string;
  name: string;
  /** Deletes the user permanently. Safe to call more than once. */
  dispose: () => Promise<void>;
}

/**
 * A user that exists only for one test — for actions that must not touch the
 * shared seed users (block, report, 1:1 calls). `e2e-user-tmp-…` uids are swept
 * by `npm run e2e:cleanup` if a run dies before its own cleanup.
 */
export async function createThrowawayUser({ name }: { name: string }): Promise<ThrowawayUser> {
  const uid = `e2e-user-tmp-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const created = await fetch(`${restBase()}/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ uid, name }),
  });
  if (!created.ok) throw new Error(`createThrowawayUser(${name}) failed: HTTP ${created.status} ${await created.text()}`);

  let disposed = false;
  return {
    uid,
    name,
    dispose: async () => {
      if (disposed) return;
      disposed = true;
      await fetch(`${restBase()}/users/${uid}`, {
        method: 'DELETE',
        headers: adminHeaders(),
        body: JSON.stringify({ permanent: true }),
      });
    },
  };
}
