import type { CometChatTextFormatter } from './CometChatTextFormatter';

/**
 * Merge two formatter lists, deduped by `id`. Entries in `extra` win over `base` on an
 * id collision (so a consumer can override a built-in by reusing its id). Order is not
 * significant for display — `applyFormatters` re-sorts by `priority`.
 */
export function mergeFormatters(
  base: CometChatTextFormatter[] = [],
  extra: CometChatTextFormatter[] = []
): CometChatTextFormatter[] {
  if (extra.length === 0) return base;
  const byId = new Map<string, CometChatTextFormatter>();
  for (const f of base) byId.set(f.id, f);
  for (const f of extra) byId.set(f.id, f);
  return [...byId.values()];
}
