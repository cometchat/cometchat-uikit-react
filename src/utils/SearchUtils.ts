import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatUIKitConstants } from "../constants/CometChatUIKitConstants";
import { CometChatSearchFilter } from "../Enums/Enums";
import { CometChatLocalize } from "../resources/CometChatLocalize/cometchat-localize";
import { CalendarObject } from "./CalendarObject";
import { sanitizeCalendarObject } from "./util";


/**
 * Checks if two dates (timestamps) are from different months or years
 * 
 * @param firstDate - First timestamp to compare in milliseconds
 * @param secondDate - Second timestamp to compare in milliseconds
 * @param errorHandler - Optional error handler function for exception handling
 * @returns boolean indicating if the dates belong to different months or years
 */
export function isMonthDifferent(firstDate?: number, secondDate?: number, errorHandler?: (error: unknown, source?: string) => void): boolean {
  try {
    if (!firstDate || !secondDate) {
      return false;
    }
    const first = new Date(firstDate * 1000);
    const second = new Date(secondDate * 1000);

    return (
      first.getMonth() !== second.getMonth() ||
      first.getFullYear() !== second.getFullYear()
    );
  } catch (error) {
    errorHandler?.(error, "isMonthDifferent");
    return false;
  }
}

/**
 * Get common date format based on provided custom format
 * @returns CalendarObject with format specifications
 */
export function getCommonDateFormat(customFormat?: CalendarObject): CalendarObject {
  const defaultFormat = {
    today: "hh:mm A",
    yesterday: "Yesterday",
    otherDays: "DD MMM, YYYY"
  };

  const globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject);
  const componentCalendarFormat = customFormat ? sanitizeCalendarObject(customFormat) : {};

  return {
    ...defaultFormat,
    ...globalCalendarFormat,
    ...componentCalendarFormat
  };
}

/**
 * Checks if message search criteria are valid
 * Returns true if search keyword exists or if valid filters are active
 */
export function hasValidMessageSearchCriteria(searchKeyword: string, filters: CometChatSearchFilter[]): boolean {
  // Check if search keyword exists
  if (searchKeyword && searchKeyword.trim() !== "") {
    return true;
  }

  // Invalid filters are those for conversation search only
  const invalidFilters = [
    CometChatSearchFilter.Unread,
    CometChatSearchFilter.Groups,
    CometChatSearchFilter.Conversations
  ];

  // If no filters are selected, return false
  if (filters.length === 0) {
    return false;
  }

  // Check if at least one valid filter type exists
  return filters.some(filter => !invalidFilters.includes(filter));
}

/**
 * Checks if conversation search criteria are valid
 * Returns true if search keyword exists or if valid filters are active
 */
export function hasValidConversationSearchCriteria(searchKeyword: string, filters: CometChatSearchFilter[]): boolean {
  // Check if search keyword exists
  if (searchKeyword && searchKeyword.trim() !== "") {
    return true;
  }

  // Valid filters for conversations
  const validFilters = [
    CometChatSearchFilter.Unread,
    CometChatSearchFilter.Groups,
    CometChatSearchFilter.Conversations
  ];

  // If no filters are selected, return false
  if (filters.length === 0) {
    return false;
  }

  // Check if all filters are valid (in the validFilters array)
  return filters.every(filter => validFilters.includes(filter));
}

/**
 * Checks if a message has link preview metadata
 */
export function hasLink(metadata: any): boolean {
  return metadata &&
    '@injected' in metadata &&
    typeof metadata['@injected'] === 'object' &&
    metadata['@injected'] !== null &&
    'extensions' in metadata['@injected'] &&
    typeof metadata['@injected']['extensions'] === 'object' &&
    metadata['@injected']['extensions'] !== null &&
    'link-preview' in metadata['@injected']['extensions'] &&
    metadata['@injected']['extensions']['link-preview'] !== null &&
    'links' in metadata['@injected']['extensions']['link-preview'] &&
    Array.isArray(metadata['@injected']['extensions']['link-preview']['links']) &&
    metadata['@injected']['extensions']['link-preview']['links'].length > 0;
}