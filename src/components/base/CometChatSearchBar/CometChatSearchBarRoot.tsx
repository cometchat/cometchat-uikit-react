import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import type {
  CometChatSearchBarRootProps,
  CometChatSearchBarContextValue,
} from './CometChatSearchBar.types';
import { CometChatSearchBarContext } from './CometChatSearchBar.context';
import './CometChatSearchBar.css';

/**
 * Root container for the search bar.
 * Provides context, manages controlled/uncontrolled state, optional debounce,
 * and uses useTransition to keep typing responsive during heavy downstream re-renders.
 */
export const CometChatSearchBarRoot: React.FC<CometChatSearchBarRootProps> = ({
  searchText: controlledValue,
  defaultSearchText = '',
  onChange,
  placeholderText = 'Search',
  disabled = false,
  debounceMs = 0,
  inputRef,
  children,
  className,
  style,
}) => {
  const inputId = useId();
  const isControlled = controlledValue !== undefined;
  const [isPending, startTransition] = useTransition();

  const [internalValue, setInternalValue] = useState(defaultSearchText);
  const currentValue = isControlled ? controlledValue : internalValue;

  // Debounce timer ref.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const fireOnChange = useCallback(
    (val: string) => {
      if (!onChange) return;

      if (debounceMs > 0) {
        if (debounceRef.current !== null) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          startTransition(() => {
            onChange(val);
          });
        }, debounceMs);
      } else {
        startTransition(() => {
          onChange(val);
        });
      }
    },
    [onChange, debounceMs, startTransition]
  );

  const setValue = useCallback(
    (val: string) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      fireOnChange(val);
    },
    [isControlled, fireOnChange]
  );

  const clear = useCallback(() => {
    setValue('');
  }, [setValue]);

  const ctxValue = useMemo<CometChatSearchBarContextValue>(
    () => ({
      searchText: currentValue,
      setSearchText: setValue,
      clear,
      placeholderText,
      disabled,
      inputId,
      isPending,
      inputRef,
    }),
    [currentValue, setValue, clear, placeholderText, disabled, inputId, isPending, inputRef]
  );

  const rootBase = 'cometchat-search-bar';
  const disabledClass = disabled ? 'cometchat-search-bar--disabled' : '';
  const rootClass = [rootBase, disabledClass, className].filter(Boolean).join(' ');

  return (
    <CometChatSearchBarContext.Provider value={ctxValue}>
      <div className={rootClass} style={style} role="search">
        {children}
      </div>
    </CometChatSearchBarContext.Provider>
  );
};
