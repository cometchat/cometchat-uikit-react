/**
 * CometChatSoundManager
 *
 * Manages audio playback for CometChat events (message send/receive, calls).
 * Provides static methods for playing predefined sounds with optional custom URLs.
 *
 * Used by: CometChatMessageComposer (outgoing), CometChatConversations (incoming),
 * CometChatIncomingCall, CometChatCallButtons.
 *
 * SSR-safe: All Audio API usage is guarded behind typeof checks.
 */

/** Sound event types. */
export type CometChatSoundType =
  | 'incomingCall'
  | 'incomingMessage'
  | 'incomingMessageFromOther'
  | 'outgoingCall'
  | 'outgoingMessage';

/** Default sound URLs hosted on CometChat CDN. */
const DEFAULT_SOUNDS: Record<CometChatSoundType, string> = {
  incomingCall: 'https://assets.cc-cluster-2.io/uikits/static/audio/incomingcall.wav',
  incomingMessage: 'https://assets.cc-cluster-2.io/uikits/static/audio/incomingmessage.wav',
  incomingMessageFromOther:
    'https://assets.cc-cluster-2.io/uikits/static/audio/incomingothermessage.wav',
  outgoingCall: 'https://assets.cc-cluster-2.io/uikits/static/audio/outgoingcall.wav',
  outgoingMessage: 'https://assets.cc-cluster-2.io/uikits/static/audio/outgoingmessage.wav',
};

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CometChatSoundManager {
  private static currentAudio: HTMLAudioElement | null = null;

  /**
   * Play a sound for the given event type.
   *
   * @param sound - The sound event type to play.
   * @param customSoundUrl - Optional custom sound URL. If not provided, uses the default.
   *
   * @example
   * // Play default outgoing message sound
   * CometChatSoundManager.play('outgoingMessage');
   *
   * @example
   * // Play custom sound
   * CometChatSoundManager.play('incomingMessage', '/sounds/custom-notification.mp3');
   */
  static play(sound: CometChatSoundType, customSoundUrl?: string): void {
    if (!CometChatSoundManager.hasInteracted()) return;
    if (typeof Audio === 'undefined') return; // SSR guard

    const url = customSoundUrl ?? DEFAULT_SOUNDS[sound];
    const audio = new Audio(url);
    audio.currentTime = 0;

    // For call sounds, loop until explicitly paused
    if (sound === 'incomingCall' || sound === 'outgoingCall') {
      audio.loop = true;
    }

    CometChatSoundManager.currentAudio = audio;

    audio.play().catch(() => {
      // Autoplay blocked by browser — silently fail
    });
  }

  /**
   * Pause and reset the currently playing sound.
   *
   * @example
   * CometChatSoundManager.pause();
   */
  static pause(): void {
    if (CometChatSoundManager.currentAudio) {
      CometChatSoundManager.currentAudio.pause();
      CometChatSoundManager.currentAudio.currentTime = 0;
      CometChatSoundManager.currentAudio = null;
    }
  }

  // ─── Convenience Methods ───────────────────────────────────────────────

  /** Play the outgoing message sound. */
  static onOutgoingMessage(customSoundUrl?: string): void {
    CometChatSoundManager.play('outgoingMessage', customSoundUrl);
  }

  /** Play the incoming message sound. */
  static onIncomingMessage(customSoundUrl?: string): void {
    CometChatSoundManager.play('incomingMessage', customSoundUrl);
  }

  /** Play the incoming message from other conversation sound. */
  static onIncomingOtherMessage(customSoundUrl?: string): void {
    CometChatSoundManager.play('incomingMessageFromOther', customSoundUrl);
  }

  /** Play the incoming call sound (loops). */
  static onIncomingCall(customSoundUrl?: string): void {
    CometChatSoundManager.play('incomingCall', customSoundUrl);
  }

  /** Play the outgoing call sound (loops). */
  static onOutgoingCall(customSoundUrl?: string): void {
    CometChatSoundManager.play('outgoingCall', customSoundUrl);
  }

  // ─── Internal ──────────────────────────────────────────────────────────

  /**
   * Check if the user has interacted with the page.
   * Required by browser autoplay policies.
   */
  private static hasInteracted(): boolean {
    if (typeof window === 'undefined') return false; // SSR guard
    if ('userActivation' in window.navigator) {
      const activation = window.navigator.userActivation as {
        isActive?: boolean;
        hasBeenActive?: boolean;
      };
      return Boolean(activation.isActive ?? activation.hasBeenActive);
    }
    // Fallback: assume interaction happened
    return true;
  }
}
