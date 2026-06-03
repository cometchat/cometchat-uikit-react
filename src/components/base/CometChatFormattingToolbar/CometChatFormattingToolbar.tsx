import React, { useMemo } from 'react';
import type { CometChatFormattingToolbarProps } from './CometChatFormattingToolbar.types';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFormattingToolbar.css';

interface ToolbarButton {
  id: string;
  iconClass: string;
  labelKey: string;
  fallbackLabel: string;
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

/**
 * CometChatFormattingToolbar — rich text formatting toolbar.
 *
 * - CSS mask-image with SVG icons (format_bold.svg, etc.)
 * - Icon color inherits from button via `background: currentColor`
 * - Hover: icon-color-primary (from secondary)
 * - Active: background-color-04 + icon-color-primary
 * - Theme-aware via CSS custom properties (works in light/dark)
 */
export const CometChatFormattingToolbar: React.FC<CometChatFormattingToolbarProps> = ({
  formatState,
  inlineFormattingDisabled = false,
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onInlineCode,
  onCodeBlock,
  onBlockquote,
  onOrderedList,
  onBulletList,
  onLink,
  className,
}) => {
  const { getLocalizedString } = useLocale();

  const buttons: (ToolbarButton | 'separator')[] = useMemo(
    () => [
      {
        id: 'bold',
        iconClass: 'cometchat-formatting-toolbar__icon--bold',
        labelKey: 'formatting_toolbar_bold',
        fallbackLabel: 'Bold',
        isActive: formatState.bold,
        isDisabled: inlineFormattingDisabled,
        onClick: onBold,
      },
      {
        id: 'italic',
        iconClass: 'cometchat-formatting-toolbar__icon--italic',
        labelKey: 'formatting_toolbar_italic',
        fallbackLabel: 'Italic',
        isActive: formatState.italic,
        isDisabled: inlineFormattingDisabled,
        onClick: onItalic,
      },
      {
        id: 'underline',
        iconClass: 'cometchat-formatting-toolbar__icon--underline',
        labelKey: 'formatting_toolbar_underline',
        fallbackLabel: 'Underline',
        isActive: formatState.underline,
        isDisabled: inlineFormattingDisabled,
        onClick: onUnderline,
      },
      {
        id: 'strikethrough',
        iconClass: 'cometchat-formatting-toolbar__icon--strikethrough',
        labelKey: 'formatting_toolbar_strikethrough',
        fallbackLabel: 'Strikethrough',
        isActive: formatState.strikethrough,
        isDisabled: inlineFormattingDisabled,
        onClick: onStrikethrough,
      },
      'separator' as const,
      {
        id: 'link',
        iconClass: 'cometchat-formatting-toolbar__icon--link',
        labelKey: 'formatting_toolbar_link',
        fallbackLabel: 'Link',
        isActive: formatState.link,
        isDisabled: inlineFormattingDisabled,
        onClick: onLink,
      },
      {
        id: 'ordered-list',
        iconClass: 'cometchat-formatting-toolbar__icon--ordered-list',
        labelKey: 'formatting_toolbar_numbered_list',
        fallbackLabel: 'Numbered List',
        isActive: formatState.orderedList,
        isDisabled: false,
        onClick: onOrderedList,
      },
      {
        id: 'bullet-list',
        iconClass: 'cometchat-formatting-toolbar__icon--bullet-list',
        labelKey: 'formatting_toolbar_bulleted_list',
        fallbackLabel: 'Bulleted List',
        isActive: formatState.bulletList,
        isDisabled: false,
        onClick: onBulletList,
      },
      'separator' as const,
      {
        id: 'blockquote',
        iconClass: 'cometchat-formatting-toolbar__icon--blockquote',
        labelKey: 'formatting_toolbar_blockquote',
        fallbackLabel: 'Blockquote',
        isActive: formatState.blockquote,
        isDisabled: false,
        onClick: onBlockquote,
      },
      {
        id: 'code',
        iconClass: 'cometchat-formatting-toolbar__icon--code',
        labelKey: 'formatting_toolbar_code',
        fallbackLabel: 'Code',
        isActive: formatState.code,
        isDisabled: formatState.codeBlock,
        onClick: onInlineCode,
      },
      {
        id: 'code-block',
        iconClass: 'cometchat-formatting-toolbar__icon--code-block',
        labelKey: 'formatting_toolbar_code_block',
        fallbackLabel: 'Code Block',
        isActive: formatState.codeBlock,
        isDisabled: false,
        onClick: onCodeBlock,
      },
    ],
    [
      formatState,
      inlineFormattingDisabled,
      onBold,
      onItalic,
      onUnderline,
      onStrikethrough,
      onLink,
      onOrderedList,
      onBulletList,
      onBlockquote,
      onInlineCode,
      onCodeBlock,
    ]
  );

  const rootClass = ['cometchat-formatting-toolbar', className ?? ''].filter(Boolean).join(' ');

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={rootClass}
      role="toolbar"
      aria-label={getLocalizedString('accessibility_text_formatting')}
      onMouseDown={handleMouseDown}
    >
      {buttons.map((item, index) => {
        if (item === 'separator') {
          return (
            <div
              key={`sep-${String(index)}`}
              className={'cometchat-formatting-toolbar__separator'}
              aria-hidden="true"
            />
          );
        }

        const btn = item;
        const label =
          getLocalizedString(btn.labelKey) !== btn.labelKey
            ? getLocalizedString(btn.labelKey)
            : btn.fallbackLabel;

        const btnClass = [
          'cometchat-formatting-toolbar__button',
          btn.isActive ? 'cometchat-formatting-toolbar__button--active' : '',
          btn.isDisabled ? 'cometchat-formatting-toolbar__button--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const iconClass = ['cometchat-formatting-toolbar__icon', btn.iconClass]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={btn.id}
            type="button"
            className={btnClass}
            onClick={btn.onClick}
            disabled={btn.isDisabled}
            aria-pressed={btn.isActive}
            aria-label={label}
            title={label}
          >
            <span className={iconClass} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};

CometChatFormattingToolbar.displayName = 'CometChatFormattingToolbar';
