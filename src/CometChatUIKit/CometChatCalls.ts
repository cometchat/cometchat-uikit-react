/**
 * CometChatCalls — dynamic import wrapper for the optional Calls SDK.
 *
 * The Calls SDK (`@cometchat/calls-sdk-javascript`) is an optional peer dependency.
 * This module attempts to import it. If unavailable (not installed,
 * test environment, SSR), `CometChatUIKitCalls` will be `null`.
 *
 * In ESM/Vite environments, `require()` is not available. The SDK is loaded
 * asynchronously via `loadCallsSDK()` called from `CometChatUIKit._initCalling()`
 * or `CometChatProvider`'s calling init effect.
 *
 * Usage:
 * ```typescript
 * import { CometChatUIKitCalls } from '@cometchat/chat-uikit-react';
 *
 * if (CometChatUIKitCalls) {
 *   // Initialize with plain object
 *   await CometChatUIKitCalls.init({ appId: 'APP_ID', region: 'us' });
 *
 *   // Login (after Chat SDK login)
 *   await CometChatUIKitCalls.loginWithAuthToken(authToken);
 *
 *   // Generate token and join session
 *   const { token } = await CometChatUIKitCalls.generateToken(sessionId);
 *   CometChatUIKitCalls.joinSession(token, callSettings, element);
 *
 *   // Register event listeners
 *   const unsub = CometChatUIKitCalls.addEventListener('onSessionLeft', () => { });
 *
 *   // Leave session
 *   CometChatUIKitCalls.leaveSession();
 * }
 * ```
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

/**
 * The Calls SDK reference. Starts as `null` and is populated either:
 * 1. Synchronously via `require()` in CJS/webpack environments
 * 2. Asynchronously via `loadCallsSDK()` after dynamic import in ESM/Vite environments
 */
export let CometChatUIKitCalls: any = null;

// Attempt synchronous resolution for CJS environments (webpack, Jest, Node CJS)
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const callsModule = require('@cometchat/calls-sdk-javascript');
  CometChatUIKitCalls =
    callsModule?.CometChatCalls ??
    callsModule?.default?.CometChatCalls ??
    callsModule?.default ??
    null;
} catch {
  // Expected in ESM/Vite — SDK will be loaded asynchronously via loadCallsSDK()
}

/**
 * Dynamically load the Calls SDK in ESM/Vite environments.
 *
 * Uses a literal specifier so Vite's dev server and bundler resolve it
 * correctly when the package is installed. When not installed, the
 * `optionalPeerDependency` Vite plugin (in vite.config.ts) intercepts the
 * import and returns a virtual empty module instead of throwing a build error.
 * The null-check below handles that case at runtime.
 *
 * Returns the resolved CometChatCalls object, or null if not installed.
 */
export async function loadCallsSDK(): Promise<any> {
  if (CometChatUIKitCalls) return CometChatUIKitCalls;

  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — optional peer dependency, may not be installed
    const mod = await import('@cometchat/calls-sdk-javascript');

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const sdk = mod?.CometChatCalls ?? mod?.default?.CometChatCalls ?? mod?.default ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (sdk) {
      CometChatUIKitCalls = sdk;
    }

    return CometChatUIKitCalls;
  } catch {
    // Package not installed — calls feature unavailable
    return null;
  }
}

/**
 * Initialize the Calls SDK reference.
 * Call this after the SDK is loaded asynchronously (e.g., via dynamic import).
 * The CometChatUIKit class and CometChatProvider call this during initialization.
 */
export function initCallsSDK(sdk: any): void {
  if (sdk) {
    CometChatUIKitCalls = sdk;
  }
}

/**
 * Test-only helper: inject a mock Calls SDK.
 * Pass `null` to restore the original (unavailable) state.
 */
export function _setCallsSDKForTesting(mock: any): void {
  CometChatUIKitCalls = mock;
}
