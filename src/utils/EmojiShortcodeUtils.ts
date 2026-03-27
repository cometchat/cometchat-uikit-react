import { Emojis } from '../components/BaseComponents/CometChatEmojiKeyboard/emojis';

// Build bidirectional lookup maps once at module load time
const charToShortcode = new Map<string, string>();
const shortcodeToChar = new Map<string, string>();

for (const categoryObj of Emojis) {
  for (const category of Object.values(categoryObj)) {
    const emojisMap = (category as { emojis: Record<string, { char: string }> }).emojis;
    for (const [shortcode, emojiObj] of Object.entries(emojisMap)) {
      const key = `:${shortcode}:`;
      charToShortcode.set(emojiObj.char, key);
      shortcodeToChar.set(key, emojiObj.char);
    }
  }
}

/**
 * Build a regex that matches any known emoji character sequence.
 * Sorted longest-first so multi-codepoint sequences (ZWJ, variation selectors,
 * skin tones, etc.) are matched before their constituent single codepoints.
 */
function buildEmojiRegex(): RegExp {
  const chars = Array.from(charToShortcode.keys());
  // Sort by descending length so longer sequences match first
  chars.sort((a, b) => b.length - a.length);
  // Escape each char sequence for use in a regex alternation
  const escaped = chars.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'gu');
}

const emojiRegex: RegExp = buildEmojiRegex();

/**
 * Replaces all unicode emoji characters in a string with their :shortcode: equivalents.
 * Handles multi-codepoint emoji (ZWJ sequences, variation selectors, skin tones).
 * Unknown emoji characters (not in emojis.ts) pass through unchanged.
 */
export function emojiToShortcode(text: string): string {
  if (!text) return text;
  // Reset lastIndex since the regex has the 'g' flag
  emojiRegex.lastIndex = 0;
  return text.replace(emojiRegex, (match) => charToShortcode.get(match) ?? match);
}

/**
 * Replaces all :shortcode: patterns in a string with their unicode emoji characters.
 * Unknown shortcodes pass through unchanged.
 */
export function shortcodeToEmoji(text: string): string {
  return text.replace(/:[a-zA-Z0-9_+-]+:/g, (match) => {
    return shortcodeToChar.get(match) ?? match;
  });
}
