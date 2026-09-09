/**
 * Global single-audio playback policy.
 *
 * Only one audio may play at a time across the entire UI Kit — message audio
 * bubbles (single WaveSurfer bubble and the plural card bubble) and the
 * composer's staged-audio tray. Each player registers a lightweight handle that
 * knows how to pause itself; starting one pauses whichever was previously active.
 *
 * The handle is intentionally minimal (just a `pause` callback) so it works for
 * any backing player — a WaveSurfer instance or a raw `HTMLAudioElement` alike.
 */

export interface AudioPlaybackHandle {
  /** Pause this player and reflect the paused state in its own UI. */
  pause: () => void;
}

let activeHandle: AudioPlaybackHandle | null = null;

/**
 * Mark `handle` as the sole active player, pausing any other that was playing.
 *
 * `activeHandle` is reassigned *before* the previous player is paused so that a
 * synchronous pause (e.g. WaveSurfer) whose own listener calls
 * {@link stopExclusivePlayback} sees the new owner and no-ops instead of
 * clearing the just-started player.
 */
export function startExclusivePlayback(handle: AudioPlaybackHandle): void {
  const previous = activeHandle;
  activeHandle = handle;
  if (previous && previous !== handle) {
    previous.pause();
  }
}

/** Release `handle` if it is the active player; a no-op otherwise. */
export function stopExclusivePlayback(handle: AudioPlaybackHandle): void {
  if (activeHandle === handle) {
    activeHandle = null;
  }
}
