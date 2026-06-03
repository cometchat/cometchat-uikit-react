import type { ReactNode, InputHTMLAttributes, CSSProperties, Ref } from 'react';

/** Props for CometChatSearchBarRoot. */
export interface CometChatSearchBarRootProps {
  /** Current search text (controlled mode). When provided, the component is controlled. */
  searchText?: string;
  /** Default search text (uncontrolled mode). Used as initial value when `searchText` is not provided. */
  defaultSearchText?: string;
  /** Callback fired when the search value changes. */
  onChange?: (value: string) => void;
  /** Placeholder text for the input. Defaults to localized "Search" string. */
  placeholderText?: string;
  /** Whether the search bar is disabled. */
  disabled?: boolean;
  /** Debounce delay in milliseconds for the onChange callback. 0 = no debounce. */
  debounceMs?: number;
  /** Ref forwarded to the underlying <input> element (convenience — same as using ref on Input sub-component). */
  inputRef?: Ref<HTMLInputElement>;
  /** Children (Icon, Input, ClearButton sub-components). */
  children?: ReactNode;
  /** Optional custom className for the root container. */
  className?: string;
  /** Optional custom styles for the root container. */
  style?: CSSProperties;
}

/** Props for CometChatSearchBarIcon. */
export interface CometChatSearchBarIconProps {
  /** Custom icon element. Defaults to the built-in search icon. */
  icon?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatSearchBarInput. */
export interface CometChatSearchBarInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'disabled' | 'placeholder'
> {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatSearchBarClearButton. */
export interface CometChatSearchBarClearButtonProps {
  /** Custom clear icon element. Defaults to the built-in "×" icon. */
  icon?: ReactNode;
  /** Optional custom className. */
  className?: string;
  /** aria-label for the clear button. Defaults to "Clear search". */
  'aria-label'?: string;
}

/** Context value shared between SearchBar sub-components. */
export interface CometChatSearchBarContextValue {
  /** Current search text. */
  searchText: string;
  /** Update the search text. */
  setSearchText: (value: string) => void;
  /** Clear the search text. */
  clear: () => void;
  /** Placeholder text. */
  placeholderText: string;
  /** Whether the search bar is disabled. */
  disabled: boolean;
  /** Unique ID for the input element (for aria-labelledby). */
  inputId: string;
  /** Whether a search transition is pending (from useTransition). */
  isPending: boolean;
  /** Ref forwarded to the input element (from Root's inputRef prop). */
  inputRef?: Ref<HTMLInputElement> | undefined;
}
