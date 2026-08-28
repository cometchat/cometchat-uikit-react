/**
 * URL handling for links rendered in message bubbles and built in the composer.
 *
 * Leaf module (no imports): both `utils/util.ts` and the formatters need it, and
 * `utils/util.ts` already imports the formatters barrel, so anything shared with a
 * formatter has to live outside it to avoid an import cycle.
 */

/**
 * Schemes that can execute script or read local content. Everything else - including
 * custom app schemes an integrator may deep-link to (`myapp://`) - is left alone.
 *
 * This is a denylist rather than an allowlist,
 * because an allowlist silently breaks deep links and `localhost:3000`. The schemes below
 * are the ones that can run code; anything else is at worst a navigation.
 */
const BLOCKED_SCHEMES = /^(?:javascript|data|vbscript|file):/;

/**
 * Strips the characters used to smuggle a scheme past a naive prefix test.
 *
 * Control characters and spaces cover "java\tscript:"; the zero-width and BOM range covers
 * "java\u200bscript:", which a control-character filter alone lets through.
 */
const stripUrlNoise = (url: string): string =>
  Array.from(url)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 0x20 && !(code >= 0x200b && code <= 0x200f) && code !== 0xfeff;
    })
    .join("")
    .toLowerCase();

/**
 * Normalises a URL for use in an `href`, or returns null when it must not become a link.
 *
 * Message text is untrusted - a link can come from markdown a user typed, from an
 * `<a href>` in a message sent by any platform, or from the composer's insert-link dialog.
 * Callers should render the link text as plain text when this returns null: an anchor that
 * looks clickable but is inert reads as a working link the reader cannot verify.
 *
 * A URL with no scheme gets `https://` so that `[docs](example.com)` links somewhere real
 * instead of resolving as a relative path.
 */
export const normalizeLinkUrl = (rawUrl: string | null | undefined): string | null => {
  if (!rawUrl) return null;

  const url = rawUrl.trim();
  if (!url) return null;

  if (BLOCKED_SCHEMES.test(stripUrlNoise(url))) {
    return null;
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(url);
  const isAnchorOrRelative = /^[#/?]/.test(url) || url.startsWith("./") || url.startsWith("../");

  return hasScheme || isAnchorOrRelative ? url : `https://${url}`;
};

/** Escapes a URL for use inside a double-quoted HTML attribute. */
export const encodeUrlForAttribute = (url: string): string =>
  url.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
