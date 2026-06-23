import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatRadioButton } from '../CometChatRadioButton';

expect.extend(toHaveNoViolations);

describe('CometChatRadioButton a11y', () => {
  it('passes axe-core audit with zero violations (unchecked)', async () => {
    const { container } = render(<CometChatRadioButton label="Option" name="a11y-g" value="a" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (checked)', async () => {
    const { container } = render(
      <CometChatRadioButton label="Option" name="a11y-g" value="a" checked />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (disabled)', async () => {
    const { container } = render(
      <CometChatRadioButton label="Option" name="a11y-g" value="a" disabled />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (with label)', async () => {
    const { container } = render(
      <CometChatRadioButton label="Accept terms" name="a11y-g" value="accept" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('radio input is focusable', () => {
    render(<CometChatRadioButton label="Option" name="a11y-g" value="a" />);
    const input = screen.getByRole('radio');
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('screen reader can identify the radio button role and state', () => {
    render(<CometChatRadioButton label="Option A" name="a11y-g" value="a" checked />);
    const input = screen.getByRole('radio');
    expect(input).toBeChecked();
    expect(input).toHaveAttribute('aria-label', 'Option A');
  });
});
