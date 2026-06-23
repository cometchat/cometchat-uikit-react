import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatFormattingToolbar } from '../CometChatFormattingToolbar';

vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

const defaultFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  blockquote: false,
  codeBlock: false,
  orderedList: false,
  bulletList: false,
  link: false,
};

const noop = () => {};

const defaultProps = {
  formatState: defaultFormatState,
  onBold: noop,
  onItalic: noop,
  onUnderline: noop,
  onStrikethrough: noop,
  onInlineCode: noop,
  onCodeBlock: noop,
  onBlockquote: noop,
  onOrderedList: noop,
  onBulletList: noop,
  onLink: noop,
};

describe('CometChatFormattingToolbar', () => {
  it('renders a toolbar with role="toolbar"', () => {
    render(<CometChatFormattingToolbar {...defaultProps} />);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('has aria-label on the toolbar', () => {
    render(<CometChatFormattingToolbar {...defaultProps} />);
    expect(screen.getByRole('toolbar')).toHaveAttribute(
      'aria-label',
      'accessibility_text_formatting'
    );
  });

  it('renders all formatting buttons', () => {
    render(<CometChatFormattingToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // bold, italic, underline, strikethrough, link, ordered-list, bullet-list, blockquote, code, code-block = 10
    expect(buttons.length).toBe(10);
  });

  it('bold button calls onBold when clicked', () => {
    const onBold = vi.fn();
    render(<CometChatFormattingToolbar {...defaultProps} onBold={onBold} />);
    // Bold is the first button (uses fallback label since mock returns key)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onBold).toHaveBeenCalledOnce();
  });

  it('italic button calls onItalic when clicked', () => {
    const onItalic = vi.fn();
    render(<CometChatFormattingToolbar {...defaultProps} onItalic={onItalic} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onItalic).toHaveBeenCalledOnce();
  });

  it('sets aria-pressed="true" on active button', () => {
    render(
      <CometChatFormattingToolbar
        {...defaultProps}
        formatState={{ ...defaultFormatState, bold: true }}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets aria-pressed="false" on inactive button', () => {
    render(<CometChatFormattingToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables inline buttons when inlineFormattingDisabled is true', () => {
    render(<CometChatFormattingToolbar {...defaultProps} inlineFormattingDisabled={true} />);
    const buttons = screen.getAllByRole('button');
    // Bold (0), Italic (1), Underline (2), Strikethrough (3), Link (4) should be disabled
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
    expect(buttons[2]).toBeDisabled();
    expect(buttons[3]).toBeDisabled();
    expect(buttons[4]).toBeDisabled();
  });

  it('does not disable list/blockquote buttons when inlineFormattingDisabled is true', () => {
    render(<CometChatFormattingToolbar {...defaultProps} inlineFormattingDisabled={true} />);
    const buttons = screen.getAllByRole('button');
    // ordered-list (5), bullet-list (6), blockquote (7) should NOT be disabled
    expect(buttons[5]).not.toBeDisabled();
    expect(buttons[6]).not.toBeDisabled();
    expect(buttons[7]).not.toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatFormattingToolbar {...defaultProps} className="my-toolbar" />
    );
    expect(container.firstChild).toHaveClass('my-toolbar');
  });

  it('always includes the base class', () => {
    const { container } = render(<CometChatFormattingToolbar {...defaultProps} />);
    expect(container.firstChild).toHaveClass('cometchat-formatting-toolbar');
  });

  it('renders separators between button groups', () => {
    const { container } = render(<CometChatFormattingToolbar {...defaultProps} />);
    const separators = container.querySelectorAll('.cometchat-formatting-toolbar__separator');
    expect(separators.length).toBe(2);
  });

  it('separators have aria-hidden="true"', () => {
    const { container } = render(<CometChatFormattingToolbar {...defaultProps} />);
    const separators = container.querySelectorAll('.cometchat-formatting-toolbar__separator');
    separators.forEach(sep => {
      expect(sep).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('each button has an aria-label', () => {
    render(<CometChatFormattingToolbar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label');
      expect(btn.getAttribute('aria-label')).not.toBe('');
    });
  });

  it('prevents default on mousedown (to not blur editor)', () => {
    render(<CometChatFormattingToolbar {...defaultProps} />);
    const toolbar = screen.getByRole('toolbar');
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const prevented = !toolbar.dispatchEvent(event);
    expect(prevented).toBe(true);
  });
});
