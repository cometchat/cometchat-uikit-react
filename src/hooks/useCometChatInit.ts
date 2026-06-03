/**
 * useCometChatInit — handles CometChat SDK initialization via CometChatUIKit.
 *
 * Delegates to CometChatUIKit.init() which handles:
 * - SDK initialization with full AppSettings configuration
 * - Source/analytics metadata
 * - Plugin registry setup
 * - Locale singleton initialization
 * - Session resumption (existing logged-in user)
 * - Calls SDK initialization (if enabled)
 *
 * This hook is internal to CometChatProvider — not exported publicly.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CometChatInitState } from '../context/ChatState.types';
import type { UIKitSettings } from '../CometChatUIKit/UIKitSettings';
import { CometChatUIKit } from '../CometChatUIKit/CometChatUIKit';
import { CometChatLogger } from '../utils/CometChatLogger';

export interface UseCometChatInitOptions {
  settings: UIKitSettings;
  onError?: ((error: Error) => void) | undefined;
}

export interface UseCometChatInitResult {
  initState: CometChatInitState;
  initError: Error | null;
}

export function useCometChatInit({
  settings,
  onError,
}: UseCometChatInitOptions): UseCometChatInitResult {
  const [initState, setInitState] = useState<CometChatInitState>('idle');
  const [initError, setInitError] = useState<Error | null>(null);
  const initCalledRef = useRef(false);

  const initialize = useCallback(async () => {
    // Prevent double-init in StrictMode
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    // If already initialized (e.g., user called CometChatUIKit.init() manually before
    // rendering CometChatProvider), skip re-initialization.
    if (CometChatUIKit.isInitialized()) {
      CometChatLogger.info('useCometChatInit', 'SDK already initialized, skipping');
      setInitState('initialized');
      return;
    }

    setInitState('initializing');
    setInitError(null);

    try {
      await CometChatUIKit.init(settings);
      CometChatLogger.info('useCometChatInit', 'SDK initialized successfully via CometChatUIKit');
      setInitState('initialized');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      CometChatLogger.error('useCometChatInit', 'SDK init failed', error);
      setInitState('error');
      setInitError(error);
      onError?.(error);
    }
  }, [settings, onError]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return { initState, initError };
}
