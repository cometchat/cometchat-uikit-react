import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { CometChatRadioButton } from '../CometChatRadioButton';

describe('CometChatRadioButton', () => {
  it('renders a native <input type="radio"> element', () => {
    render(<CometChatRadioButton label="Option" name="g" value="a" />);
    const input = screen.getByRole('radio');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'radio');
  });

  it('defaults to unchecked when no checked or defaultChecked prop', () => {
    render(<CometChatRadioButton label="Option" name="g" value="a" />);
    expect(screen.getByRole('radio')).not.toBeChecked();
  });

  it('reflects checked prop (controlled mode)', () => {
    const { rerender } = render(
      <CometChatRadioButton label="Option" name="g" value="a" checked={false} />
    );
    expect(screen.getByRole('radio')).not.toBeChecked();

    rerender(<CometChatRadioButton label="Option" name="g" value="a" checked={true} />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('reflects defaultChecked prop (uncontrolled mode)', () => {
    render(<CometChatRadioButton label="Option" name="g" value="a" defaultChecked />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('calls onChange with { checked, label, value } when selected', () => {
    const onChange = vi.fn();
    render(
      <CometChatRadioButton
        label="Option A"
        name="g"
        value="a"
        defaultChecked={false}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ checked: true, label: 'Option A', value: 'a' })
    );
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<CometChatRadioButton label="Option" name="g" value="a" disabled onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies disabled attribute to native input when disabled', () => {
    render(<CometChatRadioButton label="Option" name="g" value="a" disabled />);
    expect(screen.getByRole('radio')).toBeDisabled();
  });

  it('renders label text when label prop is provided', () => {
    render(<CometChatRadioButton label="My label" name="g" value="a" />);
    expect(screen.getByText('My label')).toBeInTheDocument();
  });

  it('does not render label text span when label prop is omitted', () => {
    const { container } = render(<CometChatRadioButton name="g" value="a" />);
    const textSpan = container.querySelector('[class*="cometchat-radio-button__text"]');
    expect(textSpan).toBeNull();
  });

  it('sets name attribute on the input for grouping', () => {
    render(<CometChatRadioButton label="Option" name="my-group" value="a" />);
    expect(screen.getByRole('radio')).toHaveAttribute('name', 'my-group');
  });

  it('sets value attribute on the input', () => {
    render(<CometChatRadioButton label="Option" name="g" value="option-1" />);
    expect(screen.getByRole('radio')).toHaveAttribute('value', 'option-1');
  });

  it('applies custom className alongside default classes', () => {
    const { container } = render(
      <CometChatRadioButton label="Option" name="g" value="a" className="my-custom" />
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain('my-custom');
    expect(root?.className).toMatch(/cometchat-radio-button/);
  });

  it('forwards ref to the native <input> element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<CometChatRadioButton ref={ref} label="Option" name="g" value="a" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('radio');
  });

  it('applies aria-checked reflecting checked state', () => {
    const { rerender } = render(
      <CometChatRadioButton label="Option" name="g" value="a" checked={false} />
    );
    expect(screen.getByRole('radio')).not.toBeChecked();

    rerender(<CometChatRadioButton label="Option" name="g" value="a" checked={true} />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('applies aria-disabled="true" when disabled', () => {
    render(<CometChatRadioButton label="Option" name="g" value="a" disabled />);
    expect(screen.getByRole('radio')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not set aria-disabled when enabled', () => {
    render(<CometChatRadioButton label="Option" name="g" value="a" />);
    expect(screen.getByRole('radio')).not.toHaveAttribute('aria-disabled');
  });

  it('uses ariaLabel over label for aria-label when both provided', () => {
    render(<CometChatRadioButton label="Option A" ariaLabel="Custom label" name="g" value="a" />);
    expect(screen.getByRole('radio')).toHaveAttribute('aria-label', 'Custom label');
  });

  it('falls back to label for aria-label when ariaLabel not provided', () => {
    render(<CometChatRadioButton label="Option A" name="g" value="a" />);
    expect(screen.getByRole('radio')).toHaveAttribute('aria-label', 'Option A');
  });

  it('does not set aria-label when neither label nor ariaLabel provided', () => {
    render(<CometChatRadioButton name="g" value="a" />);
    expect(screen.getByRole('radio')).not.toHaveAttribute('aria-label');
  });

  it('generates unique IDs (no duplicate IDs when multiple radio buttons render)', () => {
    render(
      <>
        <CometChatRadioButton label="A" name="g" value="a" />
        <CometChatRadioButton label="B" name="g" value="b" />
      </>
    );
    const inputs = screen.getAllByRole('radio');
    const ids = inputs.map(el => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('spreads additional HTML attributes via ...rest', () => {
    render(<CometChatRadioButton label="Option" name="g" value="a" data-testid="my-radio" />);
    expect(screen.getByTestId('my-radio')).toBeInTheDocument();
  });
});
