import React, { forwardRef, useCallback } from 'react';
import type { CometChatSearchBarInputProps } from './CometChatSearchBar.types';
import { useCometChatSearchBarContext } from './CometChatSearchBar.context';
import './CometChatSearchBar.css';

/**
 * The search input element. Reads state from context.
 * Supports Escape key to clear, role="searchbox", and aria-label.
 * Accepts a forwarded ref to the underlying <input> element.
 * Falls back to the `inputRef` from Root's context if no direct ref is provided.
 */
export const CometChatSearchBarInput = forwardRef<HTMLInputElement, CometChatSearchBarInputProps>(
  ({ className, ...rest }, ref) => {
    const ctx = useCometChatSearchBarContext();
    const { searchText, setSearchText, clear, placeholderText, disabled, inputId } = ctx;

    // Use the directly forwarded ref if provided, otherwise fall back to context inputRef
    const resolvedRef = ref ?? ctx.inputRef ?? null;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
      },
      [setSearchText]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          clear();
        }
      },
      [clear]
    );

    const baseClass = 'cometchat-search-bar__input';
    const cls = className ? `${baseClass} ${className}` : baseClass;

    return (
      <input
        ref={resolvedRef}
        id={inputId}
        className={cls}
        type="text"
        role="searchbox"
        aria-label={placeholderText}
        placeholder={placeholderText}
        value={searchText}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  }
);

CometChatSearchBarInput.displayName = 'CometChatSearchBar.Input';
