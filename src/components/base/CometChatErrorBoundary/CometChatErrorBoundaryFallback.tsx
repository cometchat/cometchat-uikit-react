import { useCometChatErrorBoundaryContext } from './CometChatErrorBoundary.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatErrorBoundary.css';
import type { CometChatErrorBoundaryFallbackProps } from './CometChatErrorBoundary.types';

/** Hardcoded fallbacks when translations haven't loaded yet. */
const FALLBACK_STRINGS: Record<string, string> = {
  error_boundary_something_went_wrong: 'Something went wrong',
  error_boundary_retry: 'Retry',
};

/**
 * Default fallback UI for CometChatErrorBoundary.
 *
 * Reads error state from context and renders a localized
 * "Something went wrong" message with a retry button.
 * Renders nothing when not in error state.
 */
export function CometChatErrorBoundaryFallback({ className }: CometChatErrorBoundaryFallbackProps) {
  const { hasError, retry } = useCometChatErrorBoundaryContext();
  const { getLocalizedString } = useLocale();

  if (!hasError) {
    return null;
  }

  /**
   * Translate a key, falling back to a hardcoded English string when
   * the LocaleProvider hasn't initialized yet (t returns the key as-is).
   */
  const translate = (key: string): string => {
    const result = getLocalizedString(key);
    return result === key ? (FALLBACK_STRINGS[key] ?? key) : result;
  };

  const messageText = translate('error_boundary_something_went_wrong');
  const retryText = translate('error_boundary_retry');

  const fallbackClass = `cometchat-error-boundary__fallback ${className ?? ''}`.trim();

  return (
    <div className={fallbackClass || undefined} role="alert" aria-live="assertive">
      <p className={'cometchat-error-boundary__message'}>{messageText}</p>
      <button
        className={'cometchat-error-boundary__retry'}
        onClick={retry}
        aria-label={retryText}
        type="button"
      >
        {retryText}
      </button>
    </div>
  );
}
