import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { CometChatLinkDialog } from '../CometChatLinkDialog';

const defaultProps = {
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('CometChatLinkDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the dialog with title, inputs, and buttons', () => {
    render(<CometChatLinkDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Link')).toBeInTheDocument();
    expect(screen.getByLabelText('Text')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows "Add Link" title in add mode', () => {
    render(<CometChatLinkDialog {...defaultProps} mode="add" />);
    expect(screen.getByText('Add Link')).toBeInTheDocument();
  });

  it('shows "Edit Link" title in edit mode', () => {
    render(<CometChatLinkDialog {...defaultProps} mode="edit" />);
    expect(screen.getByText('Edit Link')).toBeInTheDocument();
  });

  it('pre-fills text input with selectedText in add mode', () => {
    render(<CometChatLinkDialog {...defaultProps} mode="add" selectedText="Hello" />);
    expect(screen.getByLabelText('Text')).toHaveValue('Hello');
  });

  it('pre-fills text and URL inputs in edit mode', () => {
    render(
      <CometChatLinkDialog
        {...defaultProps}
        mode="edit"
        initialText="Docs"
        initialUrl="https://example.com"
      />
    );
    expect(screen.getByLabelText('Text')).toHaveValue('Docs');
    expect(screen.getByLabelText('Link')).toHaveValue('https://example.com');
  });

  it('calls onSave with { text, url } when Save is clicked with valid data', () => {
    const onSave = vi.fn();
    render(<CometChatLinkDialog {...defaultProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'My Link' } });
    fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({ text: 'My Link', url: 'https://example.com' });
  });

  it('auto-prepends https:// to URL without protocol', () => {
    const onSave = vi.fn();
    render(<CometChatLinkDialog {...defaultProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Example' } });
    fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({ text: 'Example', url: 'https://example.com' });
  });

  it('does not prepend protocol to URLs that already have one', () => {
    const onSave = vi.fn();
    render(<CometChatLinkDialog {...defaultProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Example' } });
    fireEvent.change(screen.getByLabelText('Link'), {
      target: { value: 'http://example.com' },
    });
    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({ text: 'Example', url: 'http://example.com' });
  });

  it('shows error when URL is empty on Save', () => {
    render(<CometChatLinkDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByRole('alert')).toHaveTextContent('URL is required');
  });

  it('shows error when text is empty in add mode on Save', () => {
    render(<CometChatLinkDialog {...defaultProps} mode="add" />);
    fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'https://x.com' } });
    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByRole('alert')).toHaveTextContent('Text is required');
  });

  it('clears error when user types in the errored input', () => {
    render(<CometChatLinkDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'x' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<CometChatLinkDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel on Escape key', () => {
    const onCancel = vi.fn();
    render(<CometChatLinkDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('Enter key in input field triggers Save', () => {
    const onSave = vi.fn();
    render(<CometChatLinkDialog {...defaultProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Link' } });
    fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'https://x.com' } });
    fireEvent.keyDown(screen.getByLabelText('Link'), { key: 'Enter' });

    expect(onSave).toHaveBeenCalledOnce();
  });

  it('Save is disabled in edit mode when no changes made', () => {
    render(
      <CometChatLinkDialog
        {...defaultProps}
        mode="edit"
        initialText="Docs"
        initialUrl="https://example.com"
      />
    );
    const saveBtn = screen.getByLabelText('Save');
    expect(saveBtn).toBeDisabled();
  });

  it('Save is enabled in edit mode when text changes', () => {
    render(
      <CometChatLinkDialog
        {...defaultProps}
        mode="edit"
        initialText="Docs"
        initialUrl="https://example.com"
      />
    );
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'New Docs' } });
    const saveBtn = screen.getByLabelText('Save');
    expect(saveBtn).not.toBeDisabled();
  });

  it('auto-focuses text input in add mode with no text', () => {
    render(<CometChatLinkDialog {...defaultProps} mode="add" />);
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(document.activeElement).toBe(screen.getByLabelText('Text'));
  });

  it('auto-focuses URL input in edit mode', () => {
    render(
      <CometChatLinkDialog
        {...defaultProps}
        mode="edit"
        initialText="Docs"
        initialUrl="https://example.com"
      />
    );
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(document.activeElement).toBe(screen.getByLabelText('Link'));
  });

  it('has role="dialog" and aria-modal="true"', () => {
    render(<CometChatLinkDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the title', () => {
    render(<CometChatLinkDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const title = document.getElementById(labelledBy!);
    expect(title?.textContent).toBe('Add Link');
  });

  it('error message has role="alert"', () => {
    render(<CometChatLinkDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies custom className to root container', () => {
    render(<CometChatLinkDialog {...defaultProps} className="my-custom" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('my-custom');
    expect(dialog.className).toMatch(/cometchat-link-dialog/);
  });

  it('forwards ref to the root div element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CometChatLinkDialog {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('role')).toBe('dialog');
  });
});
