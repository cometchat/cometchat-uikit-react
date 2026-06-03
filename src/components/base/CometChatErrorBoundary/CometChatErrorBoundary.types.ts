import type { ReactNode } from 'react';

/**
 * Structured error context emitted when an error is caught.
 * Mirrors the Angular ErrorContext interface for cross-platform consistency.
 */
export interface CometChatErrorContext {
  /** The original error that was caught. */
  error: Error;
  /** Name identifying the source component. */
  componentName: string;
  /** Epoch milliseconds when the error occurred. */
  timestamp: number;
}

/** Props for CometChatErrorBoundaryRoot. */
export interface CometChatErrorBoundaryRootProps {
  /**
   * Name identifying the wrapped component, used in the emitted CometChatErrorContext.
   * Defaults to 'Unknown'.
   */
  componentName?: string;
  /**
   * Callback invoked when an error is caught.
   * Receives the structured CometChatErrorContext.
   */
  onError?: (context: CometChatErrorContext) => void;
  /**
   * Custom fallback render function. When provided, overrides the default fallback UI.
   * Receives the CometChatErrorContext and a retry function.
   */
  fallbackView?: (context: CometChatErrorContext, retry: () => void) => ReactNode;
  /** Optional custom className for the root wrapper. */
  className?: string;
  /** Child components to render (wrapped by the error boundary). */
  children: ReactNode;
}

/** Props for CometChatErrorBoundaryFallback (default fallback UI). */
export interface CometChatErrorBoundaryFallbackProps {
  /** Optional custom className. */
  className?: string;
}

/** Context value exposed by CometChatErrorBoundaryRoot. */
export interface CometChatErrorBoundaryContextValue {
  /** Whether the boundary is currently in an error state. */
  hasError: boolean;
  /** The current error context, or null if no error. */
  errorContext: CometChatErrorContext | null;
  /** Reset the error state and re-render children. */
  retry: () => void;
}
