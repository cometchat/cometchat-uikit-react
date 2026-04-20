import React, { useState, useCallback, useRef, JSX } from 'react';
import ReactDOM from 'react-dom';
import { FormatType, createRichTextFormatter } from '../../utils/RichTextFormatting';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import { CometChatButton } from '../BaseComponents/CometChatButton/CometChatButton';
import { getLocalizedString } from '../../resources/CometChatLocalize/cometchat-localize';

// Import existing SVG icons
import FormatBoldIcon from '../../assets/format_bold.svg';
import FormatItalicIcon from '../../assets/format_italic.svg';
import FormatUnderlineIcon from '../../assets/format_underline.svg';
import FormatStrikethroughIcon from '../../assets/format_strikethrough.svg';
import LinkIcon from '../../assets/format_link.svg';

// New icons will be created in task 10 - for now we'll use placeholders
// These will be replaced with actual SVG imports once created
import FormatOrderedListIcon from '../../assets/format_ordered_list.svg';
import FormatUnorderedListIcon from '../../assets/format_unordered_list.svg';
import FormatBlockquoteIcon from '../../assets/format_blockquote.svg';
import FormatCodeIcon from '../../assets/format_code.svg';
import FormatCodeBlockIcon from '../../assets/format_code_block.svg';

export interface FormattingToolbarProps {
  /** Reference to the text input element for applying formatting */
  textInputRef: React.RefObject<HTMLDivElement>;
  
  /** Rich text formatter instance - can be null if rich text is disabled */
  richTextFormatter: ReturnType<typeof createRichTextFormatter> | null;
  
  /** Whether the toolbar is in floating mode (vs fixed) */
  isFloating?: boolean;
  
  /** Position for floating toolbar */
  position?: { top: number; left: number };
  
  /** Callback when toolbar visibility should change */
  onVisibilityChange?: (visible: boolean) => void;
  
  /** Currently active formats at caret position */
  activeFormats?: FormatType[];

  /** Callback when link button is clicked (to show link input) */
  onLinkClick?: () => void;

  /** Callback when formatting is applied - parent should update activeFormats */
  onFormatApplied?: () => void;
}

interface ToolbarButton {
  format: FormatType | 'separator';
  icon?: string;
  label: string;
  onClick?: () => void;
}

/**
 * CometChatFormattingToolbar - A formatting toolbar component
 * Provides rich text formatting options including bold, italic, underline, 
 * strikethrough, links, lists, blockquote, and code formatting.
 */
export function CometChatFormattingToolbar(props: FormattingToolbarProps): JSX.Element | null {
  const {
    textInputRef,
    richTextFormatter,
    isFloating = false,
    position,
    activeFormats = [],
    onLinkClick,
    onFormatApplied,
  } = props;

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkUrlError, setLinkUrlError] = useState('');
  
  // Ref to save selection when mousedown occurs on toolbar buttons
  const savedSelectionRef = useRef<Range | null>(null);
  
  // Get iframe context for portal rendering
  const IframeContext = useCometChatFrameContext();
  
  const getPortalContainer = useCallback(() => {
    return IframeContext?.iframeDocument?.body || document.body;
  }, [IframeContext]);

  /**
   * Prevent mousedown from stealing focus and losing selection.
   * Also save the current selection so it can be restored on click.
   */
  /**
   * Check if a Range is inside the given container element.
   * Prevents formatting from being applied to elements outside the composer
   * (e.g. message bubbles).
   */
  const isRangeInsideContainer = useCallback((range: Range, container: HTMLElement): boolean => {
    const startNode = range.startContainer;
    let node: Node | null = startNode;
    while (node) {
      if (node === container) return true;
      node = node.parentNode;
    }
    return false;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Save the current selection before the click event,
    // but only if it's inside the composer container
    if (richTextFormatter && textInputRef.current) {
      const range = richTextFormatter.saveSelection();
      const inside = range ? isRangeInsideContainer(range, textInputRef.current) : false;
      if (range && inside) {
        savedSelectionRef.current = range;
      } else {
        savedSelectionRef.current = null;
      }
    }
  }, [richTextFormatter, textInputRef, isRangeInsideContainer]);

  /**
   * Handle format button click
   */
  const handleFormatClick = useCallback((format: FormatType) => {
    const containerElement = textInputRef.current;
    if (!containerElement || !richTextFormatter) return;

    // Save selection if not already saved (fallback),
    // but only if it's inside the composer container
    if (!savedSelectionRef.current) {
      const range = richTextFormatter.saveSelection();
      const inside = range ? isRangeInsideContainer(range, containerElement) : false;
      if (range && inside) {
        savedSelectionRef.current = range;
      }
    }

    // First focus the container element
    containerElement.focus();

    // Restore the saved selection only if it was inside the composer.
    // If no valid selection was saved, the cursor will just be in the
    // focused composer at its default position — formatting will apply there.
    if (savedSelectionRef.current) {
      richTextFormatter.restoreSelection(savedSelectionRef.current);
      savedSelectionRef.current = null;
    }

    switch (format) {
      case 'bold':
        richTextFormatter.toggleBold(containerElement);
        break;
      case 'italic':
        richTextFormatter.toggleItalic(containerElement);
        break;
      case 'underline':
        richTextFormatter.toggleUnderline(containerElement);
        break;
      case 'strikethrough':
        richTextFormatter.toggleStrikethrough(containerElement);
        break;
      case 'link':
        if (onLinkClick) {
          onLinkClick();
        } else {
          setShowLinkInput(true);
        }
        return; // Don't call onFormatApplied for link - it's handled separately
      case 'orderedList':
        richTextFormatter.toggleOrderedList(containerElement);
        break;
      case 'unorderedList':
        richTextFormatter.toggleUnorderedList(containerElement);
        break;
      case 'blockquote':
        richTextFormatter.toggleBlockquote(containerElement);
        break;
      case 'codeInline':
        richTextFormatter.toggleCodeInline(containerElement);
        break;
      case 'codeBlock':
        richTextFormatter.toggleCodeBlock(containerElement);
        break;
    }

    // Notify parent to update active formats
    if (onFormatApplied) {
      onFormatApplied();
    }
  }, [textInputRef, richTextFormatter, onLinkClick, onFormatApplied]);

  /**
   * Validate URL format
   */
  const validateUrl = useCallback((url: string): boolean => {
    if (!url.trim()) {
      setLinkUrlError(getLocalizedString('link_url_required') || 'URL is required');
      return false;
    }
    
    setLinkUrlError('');
    return true;
  }, []);

  /**
   * Handle link insertion
   */
  const handleLinkInsert = useCallback((event?: CustomEvent<{ event: PointerEvent }>) => {
    if (!validateUrl(linkUrl)) return;
    
    const containerElement = textInputRef.current;
    if (!containerElement || !richTextFormatter) return;

    // Ensure URL has protocol
    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/')) {
      finalUrl = 'https://' + finalUrl;
    }

    richTextFormatter.insertLink(finalUrl, undefined, containerElement);
    setShowLinkInput(false);
    setLinkUrl('');
    setLinkUrlError('');
  }, [linkUrl, validateUrl, textInputRef, richTextFormatter]);

  /**
   * Handle link input cancel
   */
  const handleLinkCancel = useCallback((event?: CustomEvent<{ event: PointerEvent }>) => {
    setShowLinkInput(false);
    setLinkUrl('');
    setLinkUrlError('');
  }, []);

  /**
   * Handle link input key press
   */
  const handleLinkKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLinkInsert();
    } else if (e.key === 'Escape') {
      handleLinkCancel();
    }
  }, [handleLinkInsert, handleLinkCancel]);

  /**
   * Check if a format is currently active
   */
  const isFormatActive = useCallback((format: FormatType): boolean => {
    return activeFormats.includes(format);
  }, [activeFormats]);

  /**
   * Check if a button should be disabled based on current context
   * Link button is disabled when inside code block
   */
  const isButtonDisabled = useCallback((format: FormatType): boolean => {
    // Disable italic, underline, strikethrough, link, and codeInline when code block is active
    if (activeFormats.includes('codeBlock')) {
      const disabledInCodeBlock: FormatType[] = ['bold', 'italic', 'underline', 'strikethrough', 'link', 'codeInline'];
      if (disabledInCodeBlock.includes(format)) {
        return true;
      }
    }
    // Disable inline formats when inside a link
    if (activeFormats.includes('link')) {
      const disabledInLink: FormatType[] = ['bold', 'italic', 'underline', 'strikethrough'];
      if (disabledInLink.includes(format)) {
        return true;
      }
    }
    return false;
  }, [activeFormats]);

  // Early return if no formatter is provided - must be after all hooks
  if (!richTextFormatter) {
    return null;
  }

  /**
   * Toolbar buttons configuration
   */
  const toolbarButtons: ToolbarButton[] = [
    { format: 'bold', icon: FormatBoldIcon, label: getLocalizedString("formatting_toolbar_bold") || 'Bold' },
    { format: 'italic', icon: FormatItalicIcon, label: getLocalizedString("formatting_toolbar_italic") || 'Italic' },
    { format: 'underline', icon: FormatUnderlineIcon, label: getLocalizedString("formatting_toolbar_underline") || 'Underline' },
    { format: 'strikethrough', icon: FormatStrikethroughIcon, label: getLocalizedString("formatting_toolbar_strikethrough") || 'Strikethrough' },
    { format: 'separator', label: '' },
    { format: 'link', icon: LinkIcon, label: getLocalizedString("formatting_toolbar_link") || 'Link' },
    { format: 'orderedList', icon: FormatOrderedListIcon, label: getLocalizedString("formatting_toolbar_numbered_list") || 'Numbered List' },
    { format: 'unorderedList', icon: FormatUnorderedListIcon, label: getLocalizedString("formatting_toolbar_bulleted_list") || 'Bulleted List' },
    { format: 'separator', label: '' },
    { format: 'blockquote', icon: FormatBlockquoteIcon, label: getLocalizedString("formatting_toolbar_blockquote") || 'Blockquote' },
    { format: 'codeInline', icon: FormatCodeIcon, label: getLocalizedString("formatting_toolbar_code") || 'Code' },
    { format: 'codeBlock', icon: FormatCodeBlockIcon, label: getLocalizedString("formatting_toolbar_code_block") || 'Code Block' },
  ];

  const toolbarClassName = `cometchat-formatting-toolbar${isFloating ? ' cometchat-formatting-toolbar--floating' : ''}`;
  const toolbarStyle = isFloating && position ? { top: position.top, left: position.left } : undefined;

  const toolbarContent = (
    <div className={toolbarClassName} style={toolbarStyle} onMouseDown={handleMouseDown}>
      {toolbarButtons.map((button, index) => {
        if (button.format === 'separator') {
          return (
            <div 
              key={`separator-${index}`} 
              className="cometchat-formatting-toolbar__separator" 
            />
          );
        }

        const isActive = isFormatActive(button.format as FormatType);
        const isDisabled = isButtonDisabled(button.format as FormatType);
        const buttonClassName = `cometchat-formatting-toolbar__button${isActive ? ' cometchat-formatting-toolbar__button--active' : ''}${isDisabled ? ' cometchat-formatting-toolbar__button--disabled' : ''}`;

        const handleButtonClick = (event: CustomEvent<{ event: PointerEvent }>) => {
          if (!isDisabled) {
            handleFormatClick(button.format as FormatType);
          }
        };

        return (
          <div
            key={button.format}
            className={buttonClassName}
            onMouseDown={handleMouseDown}
            aria-pressed={isActive}
            aria-label={button.label}
            aria-disabled={isDisabled}
          >
            <CometChatButton
              iconURL={button.icon}
              hoverText={button.label}
              disabled={isDisabled}
              onClick={handleButtonClick}
            />
          </div>
        );
      })}

      {/* Link URL Input Popover */}
      {showLinkInput && (
        <div className="cometchat-formatting-toolbar__link-input">
          <input
            type="url"
            placeholder={getLocalizedString("formatting_toolbar_enter_url") || "Enter URL"}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyPress}
            autoFocus
            aria-label={getLocalizedString("formatting_toolbar_link_url") || "Link URL"}
            aria-invalid={!!linkUrlError}
          />
          {linkUrlError && (
            <span className="cometchat-formatting-toolbar__link-input-error">
              {linkUrlError}
            </span>
          )}
          <div className="cometchat-formatting-toolbar__link-input-actions">
            <div className="cometchat-formatting-toolbar__link-input-button cometchat-formatting-toolbar__link-input-button--primary">
              <CometChatButton
                text={getLocalizedString("formatting_toolbar_insert") || "Insert"}
                onClick={handleLinkInsert}
              />
            </div>
            <div className="cometchat-formatting-toolbar__link-input-button">
              <CometChatButton
                text={getLocalizedString("cancel") || "Cancel"}
                onClick={handleLinkCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Use portal for floating toolbar to escape overflow:hidden containers
  if (isFloating) {
    return ReactDOM.createPortal(toolbarContent, getPortalContainer());
  }

  return toolbarContent;
}


