/**
 * CometChatSearchFilterUtils — Pure filter logic for CometChatSearch.
 *
 * Ported directly search-filter.utils.ts.
 * No React imports. No side effects. Fully testable.
 */

import type { CometChatSearchFilter, CometChatSearchScope } from './CometChatSearch.types';

/** Conversation-type filters */
const CONVERSATION_FILTERS: ReadonlySet<CometChatSearchFilter> = new Set([
  'conversations',
  'unread',
  'groups',
] as CometChatSearchFilter[]);

/** Message content filters */
const CONTENT_FILTERS: ReadonlySet<CometChatSearchFilter> = new Set([
  'photos',
  'videos',
  'files',
  'audio',
] as CometChatSearchFilter[]);

/** All message-scope filters */
const MESSAGE_FILTERS: ReadonlySet<CometChatSearchFilter> = new Set([
  'messages',
  'photos',
  'videos',
  'files',
  'audio',
  'links',
] as CometChatSearchFilter[]);

/** Resolve effective scopes — empty array means both. */
function resolveScopes(searchIn: CometChatSearchScope[]): CometChatSearchScope[] {
  return searchIn.length === 0 ? ['conversations', 'messages'] : searchIn;
}

/** Check if a filter belongs to the conversation category. */
export function isConversationFilter(filter: CometChatSearchFilter): boolean {
  return CONVERSATION_FILTERS.has(filter);
}

/** Check if a filter belongs to the message category. */
export function isMessageFilter(filter: CometChatSearchFilter): boolean {
  return MESSAGE_FILTERS.has(filter);
}

/**
 * Compute available filters based on the active search scopes
 * and the user-provided filter list.
 */
export function getAvailableFilters(
  searchIn: CometChatSearchScope[],
  searchFilters: CometChatSearchFilter[]
): CometChatSearchFilter[] {
  const scopes = resolveScopes(searchIn);
  const allowed = new Set<CometChatSearchFilter>();

  if (scopes.includes('conversations')) {
    CONVERSATION_FILTERS.forEach(f => allowed.add(f));
  }
  if (scopes.includes('messages')) {
    MESSAGE_FILTERS.forEach(f => allowed.add(f));
  }

  return searchFilters.filter(f => allowed.has(f));
}

/**
 * Compute which filters should be visible given the current
 * active selections, uid/guid context, and search scopes.
 */
export function getVisibleFilters(
  available: CometChatSearchFilter[],
  active: CometChatSearchFilter[],
  uid?: string,
  guid?: string,
  searchIn?: CometChatSearchScope[]
): CometChatSearchFilter[] {
  const scopes = resolveScopes(searchIn ?? []);

  // Hide conversation filters when scoped to a specific user/group
  const filtered = uid || guid ? available.filter(f => !CONVERSATION_FILTERS.has(f)) : available;

  if (active.length === 0) {
    return filtered;
  }

  const hasMessages = active.includes('messages');

  // Content filters include Links
  const contentAndLinks = new Set([...CONTENT_FILTERS, 'links' as CometChatSearchFilter]);
  const selectedContentFilters = active.filter(f => contentAndLinks.has(f));

  // Messages + content filter → show Messages + those content filters
  if (hasMessages && selectedContentFilters.length > 0) {
    return ['messages' as CometChatSearchFilter, ...selectedContentFilters].filter(f =>
      filtered.includes(f)
    );
  }

  // Messages only → show all message filters
  if (hasMessages) {
    return filtered.filter(f => MESSAGE_FILTERS.has(f));
  }

  // Content/Links filter only (no Messages) → show only those filters
  if (selectedContentFilters.length > 0) {
    return selectedContentFilters.filter(f => filtered.includes(f));
  }

  // Conversation filter active → show ALL conversation filters
  if (
    scopes.includes('conversations') &&
    !uid &&
    !guid &&
    active.some(f => CONVERSATION_FILTERS.has(f))
  ) {
    return filtered.filter(f => CONVERSATION_FILTERS.has(f));
  }

  return filtered;
}

/**
 * Toggle a filter on or off.
 */
export function toggleFilter(
  active: CometChatSearchFilter[],
  filterId: CometChatSearchFilter
): CometChatSearchFilter[] {
  if (active.includes(filterId)) {
    return active.filter(f => f !== filterId);
  }
  return [...active, filterId];
}

/**
 * Determine if the conversations result section should render.
 */
export function shouldRenderConversations(
  searchText: string,
  activeFilters: CometChatSearchFilter[],
  searchIn: CometChatSearchScope[],
  uid?: string,
  guid?: string
): boolean {
  const scopes = resolveScopes(searchIn);

  if (!scopes.includes('conversations')) return false;
  if (uid || guid) return false;
  if (searchText.trim() !== '' && activeFilters.length === 0) return true;
  if (activeFilters.length > 0) {
    return activeFilters.some(f => CONVERSATION_FILTERS.has(f));
  }
  return false;
}

/**
 * Determine if the messages result section should render.
 */
export function shouldRenderMessages(
  searchText: string,
  activeFilters: CometChatSearchFilter[],
  searchIn: CometChatSearchScope[],
  uid?: string,
  guid?: string
): boolean {
  const scopes = resolveScopes(searchIn);

  if (!scopes.includes('messages')) return false;
  if (uid || guid) return true;
  if (searchText.trim() !== '' && activeFilters.length === 0) return true;
  if (activeFilters.length > 0) {
    return !activeFilters.some(f => CONVERSATION_FILTERS.has(f));
  }
  return false;
}

/**
 * Check if search criteria are valid for conversation search.
 */
export function hasValidSearchCriteria(keyword: string, filters: CometChatSearchFilter[]): boolean {
  if (keyword.trim() !== '') return true;
  if (filters.length === 0) return false;
  return filters.every(f => CONVERSATION_FILTERS.has(f));
}

/**
 * Check if search criteria are valid for message search.
 */
export function hasValidMessageSearchCriteria(
  keyword: string,
  filters: CometChatSearchFilter[],
  uid?: string,
  guid?: string
): boolean {
  if (uid || guid) return true;
  if (keyword.trim() !== '') return true;
  if (filters.length === 0) return false;
  return filters.some(f => MESSAGE_FILTERS.has(f));
}
