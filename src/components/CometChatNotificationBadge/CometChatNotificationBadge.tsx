import React from "react";
import { useNotificationUnreadCount } from "../CometChatNotificationFeed/useNotificationUnreadCount";

export interface CometChatNotificationBadgeProps {
  /** Filter count by category */
  category?: string;
  /** Maximum count to display before showing "N+". Default: 99 */
  max?: number;
  /** Style overrides */
  style?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    borderRadius?: string;
  };
}

/**
 * CometChatNotificationBadge — Displays unread notification count.
 * Subscribes to real-time updates and re-syncs on window focus.
 */
export function CometChatNotificationBadge(props: CometChatNotificationBadgeProps) {
  const { category, max = 99, style: badgeStyle } = props;

  const { count } = useNotificationUnreadCount({ category });

  if (count === 0) {
    return null;
  }

  const displayText = count > max ? `${max}+` : `${count}`;

  const defaultStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "18px",
    height: "18px",
    padding: "2px 6px",
    borderRadius: badgeStyle?.borderRadius || "9999px",
    backgroundColor: badgeStyle?.backgroundColor || "#6852D6",
    color: badgeStyle?.textColor || "#fff",
    fontSize: badgeStyle?.fontSize || "11px",
    fontWeight: 600,
    lineHeight: "1",
    whiteSpace: "nowrap",
  };

  return (
    <span
      className="cometchat-notification-badge"
      style={defaultStyle}
      aria-label={`${count} unread notifications`}
      role="status"
    >
      {displayText}
    </span>
  );
}
