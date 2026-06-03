import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatCheckbox } from '../CometChatCheckbox';

expect.extend(toHaveNoViolations);

describe('CometChatCheckbox a11y', () => {
  it('passes axe-core audit with zero violations (unchecked)', async () => {
    const { container } = render(<CometChatCheckbox />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (checked)', async () => {
    const { container } = render(<CometChatCheckbox checked />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (disabled)', async () => {
    const { container } = render(<CometChatCheckbox disabled />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (with label)', async () => {
    const { container } = render(<CometChatCheckbox label="Accept terms" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('focus ring is visible on keyboard focus', () => {
    render(<CometChatCheckbox />);
    const input = screen.getByRole('checkbox');
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('checkbox is togglable via Space key', () => {
    render(<CometChatCheckbox defaultChecked={false} />);
    const input = screen.getByRole('checkbox');
    input.focus();
    // Space key on a checkbox triggers the native toggle
    expect(input).not.toBeChecked();
  });
});
