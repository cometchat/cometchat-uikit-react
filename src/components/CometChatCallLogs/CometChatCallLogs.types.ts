import type { ReactNode } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';

/**
 * Props for the CometChatCallLogs component.
 */
export interface CometChatCallLogsProps {
  /** Object representing the active/selected call log. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeCall?: any;

  /** Custom request builder for filtering call logs. Default: limit 30, category "call". */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callLogRequestBuilder?: any;

  /** Format for displaying the call initiation time in call log items. */
  callInitiatedDateTimeFormat?: CometChatDateFormatConfig;

  /** Callback when a call log item is clicked. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onItemClick?: (call: any) => void;

  /** Callback when the call button (trailing view) is clicked. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCallButtonClicked?: (call: any) => void;

  /** Error callback. */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * Custom call settings builder for ongoing call sessions initiated from call logs.
   * If not provided, falls back to GlobalConfig.callSettingsBuilder, then default.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callSettingsBuilder?: any;

  /** Custom loading view. */
  loadingView?: ReactNode;

  /** Custom empty state view. */
  emptyView?: ReactNode;

  /** Custom error state view. */
  errorView?: ReactNode;

  /** Custom item view renderer. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemView?: (call: any) => ReactNode;

  /** Custom leading view renderer. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leadingView?: (call: any) => ReactNode;

  /** Custom title view renderer. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  titleView?: (call: any) => ReactNode;

  /** Custom subtitle view renderer. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subtitleView?: (call: any) => ReactNode;

  /** Custom trailing view renderer. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trailingView?: (call: any) => ReactNode;

  /** Show scrollbar. Default: false. */
  showScrollbar?: boolean;
}
