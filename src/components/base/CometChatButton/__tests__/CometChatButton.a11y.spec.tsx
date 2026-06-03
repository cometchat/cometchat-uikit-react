import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatButton } from '../CometChatButton';

expect.extend(toHaveNoViolations);

describe('CometChatButton a11y', () => {
  it('passes axe-core audit with zero violations (primary variant)', async () => {
    const { container } = render(
      <CometChatButton.Root variant="primary">
        <CometChatButton.Text>Submit</CometChatButton.Text>
      </CometChatButton.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (secondary variant)', async () => {
    const { container } = render(
      <CometChatButton.Root variant="secondary">
        <CometChatButton.Text>Cancel</CometChatButton.Text>
      </CometChatButton.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (ghost variant)', async () => {
    const { container } = render(
      <CometChatButton.Root variant="ghost">
        <CometChatButton.Text>More</CometChatButton.Text>
      </CometChatButton.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit when disabled', async () => {
    const { container } = render(
      <CometChatButton.Root disabled>
        <CometChatButton.Text>Disabled</CometChatButton.Text>
      </CometChatButton.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit when loading', async () => {
    const { container } = render(
      <CometChatButton.Root isLoading loadingLabel="Loading...">
        <CometChatButton.Text>Send</CometChatButton.Text>
      </CometChatButton.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('icon-only button with aria-label passes axe-core audit', async () => {
    const { container } = render(
      <CometChatButton.Root variant="ghost" aria-label="Send message">
        <CometChatButton.Icon>
          <svg aria-hidden="true" />
        </CometChatButton.Icon>
      </CometChatButton.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('focus ring is visible on keyboard focus', () => {
    render(
      <CometChatButton.Root variant="primary">
        <CometChatButton.Text>Focus me</CometChatButton.Text>
      </CometChatButton.Root>
    );
    const btn = screen.getByRole('button');
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });
});
