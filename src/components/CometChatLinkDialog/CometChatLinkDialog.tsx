import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { getLocalizedString } from "../../resources/CometChatLocalize/cometchat-localize";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";

interface LinkDialogProps {
  /** The initial URL value */
  initialUrl?: string;
  /** The initial display text value */
  initialText?: string;
  /** Whether to show the text input field (hide when text is already selected) */
  showTextInput?: boolean;
  /** Whether this is edit mode (changes title and button text) */
  isEditMode?: boolean;
  /** When true, focus the Link field on mount instead of the Text field */
  focusLinkField?: boolean;
  /** Callback when the link is submitted */
  onSubmit: (url: string, displayText?: string) => void;
  /** Callback when the dialog is cancelled */
  onCancel: () => void;
}

/**
 * CometChatLinkDialog - A dialog for adding/editing hyperlinks
 * Shows URL input and optional display text input
 */
export function CometChatLinkDialog(props: LinkDialogProps) {
  const {
    initialUrl = "",
    initialText = "",
    showTextInput = true,
    isEditMode = false,
    focusLinkField = false,
    onSubmit,
    onCancel,
  } = props;

  const [url, setUrl] = useState(initialUrl);
  const [displayText, setDisplayText] = useState(initialText);
  const [urlError, setUrlError] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Focus the appropriate input on mount
  useEffect(() => {
    if (focusLinkField || !showTextInput) {
      urlInputRef.current?.focus();
    } else {
      textInputRef.current?.focus();
    }
  }, []);

  /**
   * Check if any changes have been made (for edit mode)
   */
  const hasChanges = useMemo(() => {
    if (!isEditMode) return true; // Always allow submit in add mode
    
    const urlChanged = url.trim() !== initialUrl.trim();
    const textChanged = showTextInput && displayText.trim() !== initialText.trim();
    
    return urlChanged || textChanged;
  }, [isEditMode, url, initialUrl, displayText, initialText, showTextInput]);

  /**
   * Validate URL format
   */
  const validateUrl = useCallback((urlValue: string): boolean => {
    if (!urlValue.trim()) {
      setUrlError(getLocalizedString("link_url_required") || "URL is required");
      return false;
    }

    setUrlError("");
    return true;
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(() => {
    if (!hasChanges) return; // Don't submit if no changes in edit mode
    if (!validateUrl(url)) return;

    // Ensure URL has protocol
    let finalUrl = url.trim();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(finalUrl) && !finalUrl.startsWith("/")) {
      finalUrl = "https://" + finalUrl;
    }

    onSubmit(finalUrl, showTextInput ? displayText.trim() || undefined : undefined);
  }, [url, displayText, showTextInput, validateUrl, onSubmit, hasChanges]);

  /**
   * Handle key press events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  /**
   * Handle backdrop click to close
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  // Get localized strings based on mode
  const dialogTitle = isEditMode 
    ? (getLocalizedString("link_dialog_edit_link") || "Edit Link")
    : (getLocalizedString("link_dialog_add_link") || "Add Link");
  
  const submitButtonText = getLocalizedString("link_dialog_save") || "Save";

  return (
    <div className="cometchat-link-dialog__backdrop" onClick={handleBackdropClick}>
      <div className="cometchat cometchat-link-dialog">
        <div className="cometchat-link-dialog__header">
          <div className="cometchat-link-dialog__title">
            {dialogTitle}
          </div>
          <div
            className="cometchat-link-dialog__close-button"
            onClick={onCancel}
            role="button"
            aria-label="Close"
          />
        </div>

        <div className="cometchat-link-dialog__divider" />

        <div className="cometchat-link-dialog__content">
          {/* Text Input */}
          {showTextInput && (
            <div className="cometchat-link-dialog__field">
              <label className="cometchat-link-dialog__label">
                {getLocalizedString("link_dialog_text") || "Text"}
              </label>
              <input
                ref={textInputRef}
                type="text"
                className="cometchat-link-dialog__input"
                placeholder={getLocalizedString("link_dialog_text_placeholder") || "Enter display text"}
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Display text"
              />
            </div>
          )}

          {/* Link Input */}
          <div className="cometchat-link-dialog__field">
            <label className="cometchat-link-dialog__label">
              {getLocalizedString("link_dialog_link") || "Link"}
            </label>
            <input
              ref={urlInputRef}
              type="url"
              className={`cometchat-link-dialog__input ${urlError ? "cometchat-link-dialog__input--error" : ""}`}
              placeholder="https://www.cometchat.com/"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError("");
              }}
              onKeyDown={handleKeyDown}
              aria-label="Link URL"
              aria-invalid={!!urlError}
            />
            {urlError && (
              <span className="cometchat-link-dialog__error">{urlError}</span>
            )}
          </div>
        </div>

        <div className="cometchat-link-dialog__button-group">
          <div className="cometchat-link-dialog__button-cancel">
            <CometChatButton
              onClick={onCancel}
              text={getLocalizedString("cancel") || "Cancel"}
            />
          </div>
          <div className={`cometchat-link-dialog__button-submit ${!hasChanges ? 'cometchat-link-dialog__button-submit--disabled' : ''}`}>
            <CometChatButton
              onClick={handleSubmit}
              text={submitButtonText}
              disabled={!hasChanges}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
