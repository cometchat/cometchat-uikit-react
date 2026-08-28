/**
 * Placeholders that carry a message's literal characters through the render pipeline.
 *
 * Leaf module (no imports) so both `CometChatUIKitUtility` and `utils/util.ts` can use it.
 */

/** Stand-ins for characters that must survive as themselves. */
const MASKED_OPEN = "\ue010";
const MASKED_CLOSE = "\ue011";
const MASKED_AMP = "\ue012";

const PLACEHOLDERS: Record<string, string> = {
  "\ue010": "<",
  "\ue011": ">",
  "\ue012": "&",
};

const MASKED = /[\ue010-\ue012]/g;

/**
 * Neutralises a tag so it renders as visible text instead of markup.
 *
 * Escaping it to `&lt;`/`&gt;` would work too, but then the entities we just wrote are
 * indistinguishable from entities the message itself contained - and whatever decodes ours
 * back at the end also decodes the message's, so a literally typed "&gt;" turns into ">".
 * Placeholders keep the two apart.
 */
export const maskTagDelimiters = (tag: string): string =>
  tag.replace(/</g, MASKED_OPEN).replace(/>/g, MASKED_CLOSE);

/**
 * Masks `<`, `>` and `&` that are literal message content.
 *
 * Several formatters re-serialize the string through the DOM (CometChatUrlsFormatter parses
 * and re-emits it to linkify URLs), and a serializer escapes those three characters on the
 * way out. Masking them first means they come back as themselves rather than as `&lt;`.
 */
export const maskLiteralCharacters = (text: string): string =>
  text.replace(/[&<>]/g, (ch) =>
    ch === "&" ? MASKED_AMP : ch === "<" ? MASKED_OPEN : MASKED_CLOSE
  );

/** Turns every placeholder back into the character it stands for. */
export const restoreMaskedTagDelimiters = (text: string): string =>
  text.replace(MASKED, (ch) => PLACEHOLDERS[ch] ?? "");
