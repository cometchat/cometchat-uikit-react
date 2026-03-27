import React, { useEffect, useRef, useCallback } from "react";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import { getLocalizedString } from "../../resources/CometChatLocalize/cometchat-localize";

interface LinkPopoverProps {
  /** The link text displayed */
  linkText: string;
  /** The URL of the link */
  linkUrl: string;
  /** Position of the popover */
  position: { top: number; left: number };
  /** Callback when Edit button is clicked */
  onEdit: () => void;
  /** Callback when Remove button is clicked */
  onRemove: () => void;
  /** Callback when popover should close */
  onClose: () => void;
}

/**
 * CometChatLinkPopover - A popover that appears when clicking on a link
 * Shows link text, URL (clickable), and Edit/Remove buttons
 */
const CometChatLinkPopover: React.FC<LinkPopoverProps> = (props) => {
  const { linkText, linkUrl, position, onEdit, onRemove, onClose } = props;
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add listener with a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleUrlClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    window.open(linkUrl, "_blank", "noopener,noreferrer");
  }, [linkUrl]);

  return (
    <div
      ref={popoverRef}
      className="cometchat-link-popover"
      style={{ top: position.top, left: position.left }}
    >
      <div className="cometchat-link-popover__arrow" />
      <div className="cometchat-link-popover__content">
        <button
          className="cometchat-link-popover__close"
          onClick={onClose}
          aria-label={getLocalizedString("link_popover_close") || "Close"}
        >
          ×
        </button>
        <div className="cometchat-link-popover__text">{linkText}</div>
        <a
          href={linkUrl}
          className="cometchat-link-popover__url"
          onClick={handleUrlClick}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkUrl}
        </a>
        <div className="cometchat-link-popover__actions">
          <div className="cometchat-link-popover__button-edit">
            <CometChatButton
              onClick={onEdit}
              text={getLocalizedString("link_popover_edit") || "Edit"}
            />
          </div>
          <div className="cometchat-link-popover__button-remove">
            <CometChatButton
              onClick={onRemove}
              text={getLocalizedString("link_popover_remove") || "Remove"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { CometChatLinkPopover };
