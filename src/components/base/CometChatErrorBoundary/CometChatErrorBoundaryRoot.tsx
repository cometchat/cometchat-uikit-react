import React from 'react';
import type {
  CometChatErrorBoundaryRootProps,
  CometChatErrorBoundaryContextValue,
  CometChatErrorContext,
} from './CometChatErrorBoundary.types';
import { CometChatErrorBoundaryContext } from './CometChatErrorBoundary.context';
import { CometChatErrorBoundaryFallback } from './CometChatErrorBoundaryFallback';
import { CometChatLogger } from '../../../utils/CometChatLogger';
import './CometChatErrorBoundary.css';

interface State {
  hasError: boolean;
  errorContext: CometChatErrorContext | null;
}

/**
 * CometChatErrorBoundaryRoot — class-based React error boundary.
 *
 * Catches rendering errors in the child tree via getDerivedStateFromError
 * and componentDidCatch. Provides error state and retry via context.
 *
 * This is the only class component in the codebase — React requires
 * error boundaries to be class components.
 */
export class CometChatErrorBoundaryRoot extends React.Component<
  CometChatErrorBoundaryRootProps,
  State
> {
  constructor(props: CometChatErrorBoundaryRootProps) {
    super(props);
    this.state = { hasError: false, errorContext: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorContext: {
        error,
        componentName: 'Unknown',
        timestamp: Date.now(),
      },
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const componentName = this.props.componentName ?? 'Unknown';
    const context: CometChatErrorContext = {
      error,
      componentName,
      timestamp: Date.now(),
    };

    // Update context with the correct componentName (getDerivedStateFromError is static)
    this.setState({ errorContext: context });

    CometChatLogger.error('ErrorBoundary', `Error in ${componentName}:`, error, errorInfo);
    this.props.onError?.(context);
  }

  private retry = (): void => {
    this.setState({ hasError: false, errorContext: null });
  };

  override render(): React.ReactNode {
    const { hasError, errorContext } = this.state;
    const { fallbackView, className, children } = this.props;

    const ctxValue: CometChatErrorBoundaryContextValue = {
      hasError,
      errorContext,
      retry: this.retry,
    };

    const rootClass = `cometchat-error-boundary ${className ?? ''}`.trim();

    return (
      <CometChatErrorBoundaryContext.Provider value={ctxValue}>
        <div className={rootClass || undefined}>
          {hasError ? (
            errorContext && fallbackView ? (
              fallbackView(errorContext, this.retry)
            ) : (
              <CometChatErrorBoundaryFallback />
            )
          ) : (
            children
          )}
        </div>
      </CometChatErrorBoundaryContext.Provider>
    );
  }
}
