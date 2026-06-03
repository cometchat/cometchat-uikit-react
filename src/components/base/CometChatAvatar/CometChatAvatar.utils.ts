/**
 * Extracts initials from a name.
 * - 2+ words: first letter of first two words, uppercased
 * - 1 word: first 2 characters, uppercased
 * - Empty: returns empty string
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return `${words[0]?.charAt(0) ?? ''}${words[1]?.charAt(0) ?? ''}`.toUpperCase();
  }
  return trimmed.substring(0, 2).toUpperCase();
}
