import { CometChatErrorBoundaryRoot } from './CometChatErrorBoundaryRoot';
import { CometChatErrorBoundaryFallback } from './CometChatErrorBoundaryFallback';

/**
 * CometChatErrorBoundary — compound component for error isolation.
 *
 * Usage:
 * ```tsx
 * <CometChatErrorBoundary.Root componentName="MessageBubble">
 *   <MessageBubble message={msg} />
 * </CometChatErrorBoundary.Root>
 * ```
 */
export const CometChatErrorBoundary = {
  Root: CometChatErrorBoundaryRoot,
  Fallback: CometChatErrorBoundaryFallback,
} as const;
