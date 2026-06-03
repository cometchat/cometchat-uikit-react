import React, { forwardRef, useMemo } from 'react';
import type {
  CometChatButtonRootProps,
  CometChatButtonContextValue,
} from './CometChatButton.types';
import { CometChatButtonContext } from './CometChatButton.context';
import './CometChatButton.css';

/**
 * Root button element. Provides context to child sub-components
 * and handles variant, size, loading, and disabled states.
 */
export const CometChatButtonRoot = forwardRef<HTMLButtonElement, CometChatButtonRootProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingLabel,
      hoverText,
      disabled = false,
      children,
      className,
      type = 'button',
      title,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const resolvedTitle = hoverText ?? title;

    const ctxValue = useMemo<CometChatButtonContextValue>(
      () => ({ variant, size, isLoading, disabled: isDisabled }),
      [variant, size, isLoading, isDisabled]
    );

    const baseClass = 'cometchat-button';
    const variantClass = `cometchat-button--${variant}`;
    const sizeClass = `cometchat-button--${size}`;
    const loadingClass = isLoading ? 'cometchat-button--loading' : '';
    const disabledClass = isDisabled ? 'cometchat-button--disabled' : '';

    const classes = [baseClass, variantClass, sizeClass, loadingClass, disabledClass, className]
      .filter(Boolean)
      .join(' ');

    return (
      <CometChatButtonContext.Provider value={ctxValue}>
        <button
          ref={ref}
          type={type}
          className={classes}
          disabled={isDisabled}
          title={resolvedTitle}
          aria-disabled={isDisabled || undefined}
          aria-busy={isLoading || undefined}
          aria-label={isLoading ? loadingLabel : undefined}
          {...rest}
        >
          {isLoading ? (
            <>
              <span className={'cometchat-button__spinner'} aria-hidden="true" />
              <span className={'cometchat-button__content--hidden'}>{children}</span>
            </>
          ) : (
            children
          )}
        </button>
      </CometChatButtonContext.Provider>
    );
  }
);

CometChatButtonRoot.displayName = 'CometChatButtonRoot';
