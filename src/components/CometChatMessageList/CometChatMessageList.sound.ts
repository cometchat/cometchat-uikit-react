/**
 * Sound notification adapter for the MessageList.
 *
 * Thin wrapper so the hook doesn't depend on a specific sound manager implementation.
 *
 * This adapter gracefully no-ops
 * if the sound infrastructure isn't available.
 */

const DEFAULT_INCOMING_SOUND_URL =
  'https://assets.cc-cluster-2.io/uikits/static/audio/incomingmessage.wav';

/**
 * Play the incoming message notification sound.
 *
 * @param customSoundUrl - Optional custom sound URL. Falls back to the default CometChat sound.
 */
export function playIncomingSound(customSoundUrl?: string): void {
  try {
    const url = customSoundUrl ?? DEFAULT_INCOMING_SOUND_URL;
    const audio = new Audio(url);
    audio.currentTime = 0;
    // play() returns a promise that may reject if the user hasn't interacted yet.
    // We catch silently — sound is non-critical.
    audio.play().catch(() => {
      // Autoplay blocked by browser — silently ignore
    });
  } catch {
    // Audio constructor not available (e.g., SSR) — silently ignore
  }
}
