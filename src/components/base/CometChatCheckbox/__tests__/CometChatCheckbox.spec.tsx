import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { CometChatCheckbox } from '../CometChatCheckbox';

describe('CometChatCheckbox', () => {
  it('renders a native <input type="checkbox"> element', () => {
    render(<CometChatCheckbox />);
    const input = screen.getByRole('checkbox');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'checkbox');
  });

  it('defaults to unchecked when no checked or defaultChecked prop', () => {
    render(<CometChatCheckbox />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('reflects checked prop (controlled mode)', () => {
    const { rerender } = render(<CometChatCheckbox checked={false} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    rerender(<CometChatCheckbox checked={true} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('reflects defaultChecked prop (uncontrolled mode)', () => {
    render(<CometChatCheckbox defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange with { checked: true } when clicked while unchecked', () => {
    const onChange = vi.fn();
    render(<CometChatCheckbox defaultChecked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ checked: true }));
  });

  it('calls onChange with { checked: false } when clicked while checked', () => {
    const onChange = vi.fn();
    render(<CometChatCheckbox defaultChecked onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ checked: false }));
  });

  it('includes shiftKey: true in onChange payload when Shift is held', () => {
    const onChange = vi.fn();
    render(<CometChatCheckbox defaultChecked={false} onChange={onChange} />);
    const input = screen.getByRole('checkbox');

    // Simulate click with shiftKey
    const clickEvent = createEvent.click(input, { shiftKey: true });
    fireEvent(input, clickEvent);
    fireEvent.change(input, { target: { checked: true } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ shiftKey: true }));
  });

  it('includes metaKey: true in onChange payload when Meta/Cmd is held', () => {
    const onChange = vi.fn();
    render(<CometChatCheckbox defaultChecked={false} onChange={onChange} />);
    const input = screen.getByRole('checkbox');

    const clickEvent = createEvent.click(input, { metaKey: true });
    fireEvent(input, clickEvent);
    fireEvent.change(input, { target: { checked: true } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ metaKey: true }));
  });

  it('includes label in onChange payload when label prop is set', () => {
    const onChange = vi.fn();
    render(<CometChatCheckbox label="Select all" defaultChecked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ label: 'Select all' }));
  });

  it('does not call onChange when disabled is true', () => {
    const onChange = vi.fn();
    render(<CometChatCheckbox disabled onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies disabled attribute to native input when disabled', () => {
    render(<CometChatCheckbox disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('renders label text when label prop is provided', () => {
    render(<CometChatCheckbox label="My label" />);
    expect(screen.getByText('My label')).toBeInTheDocument();
  });

  it('does not render label text when label prop is omitted', () => {
    const { container } = render(<CometChatCheckbox />);
    const textSpan = container.querySelector('[class*="cometchat-checkbox__text"]');
    expect(textSpan).toBeNull();
  });

  it('applies custom className alongside default classes', () => {
    const { container } = render(<CometChatCheckbox className="my-custom" />);
    const root = container.firstElementChild;
    expect(root?.className).toContain('my-custom');
    expect(root?.className).toMatch(/cometchat-checkbox/);
  });

  it('forwards ref to the native <input> element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<CometChatCheckbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('checkbox');
  });

  it('generates unique IDs (no duplicate IDs when multiple checkboxes render)', () => {
    render(
      <>
        <CometChatCheckbox label="A" />
        <CometChatCheckbox label="B" />
      </>
    );
    const inputs = screen.getAllByRole('checkbox');
    const ids = inputs.map(el => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
