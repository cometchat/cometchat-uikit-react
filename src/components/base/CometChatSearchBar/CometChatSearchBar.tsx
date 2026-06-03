import { CometChatSearchBarRoot } from './CometChatSearchBarRoot';
import { CometChatSearchBarIcon } from './CometChatSearchBarIcon';
import { CometChatSearchBarInput } from './CometChatSearchBarInput';
import { CometChatSearchBarClearButton } from './CometChatSearchBarClearButton';

/**
 * CometChatSearchBar — compound component.
 *
 * Usage:
 * ```tsx
 * <CometChatSearchBar.Root searchText={query} onChange={setQuery} placeholderText="Search...">
 *   <CometChatSearchBar.Icon />
 *   <CometChatSearchBar.Input />
 *   <CometChatSearchBar.ClearButton />
 * </CometChatSearchBar.Root>
 * ```
 */
export const CometChatSearchBar = {
  Root: CometChatSearchBarRoot,
  Icon: CometChatSearchBarIcon,
  Input: CometChatSearchBarInput,
  ClearButton: CometChatSearchBarClearButton,
} as const;
