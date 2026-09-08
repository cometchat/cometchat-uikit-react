import type { CometChatTextFormatter } from './CometChatTextFormatter';

/**
 * Run custom display formatters over already-processed preview/subtitle text.
 *
 * Used by surfaces that produce their own base string (conversation subtitle, reply/edit
 * preview, copy) and want custom-format tokens (e.g. `{color:#f00}…{/color}`) rendered on
 * top of the built-in markdown/mention handling. Formatters run in `priority` order.
 * The CALLER is responsible for sanitizing the result before injecting it as HTML.
 */
export function applyDisplayFormatters(
  text: string,
  formatters?: CometChatTextFormatter[]
): string {
  if (!text || !formatters || formatters.length === 0) return text;
  let out = text;
  for (const formatter of [...formatters].sort((a, b) => a.priority - b.priority)) {
    try {
      out = formatter.format(out);
    } catch {
      // A misbehaving formatter must not break the subtitle/preview.
    }
  }
  return out;
}
