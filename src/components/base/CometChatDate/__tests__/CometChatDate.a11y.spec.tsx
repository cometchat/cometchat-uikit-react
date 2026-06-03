import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatDate } from '../CometChatDate';

expect.extend(toHaveNoViolations);

/** Use a real timestamp — no fake timers (axe-core needs real async). */
const TIMESTAMP = Math.floor(Date.now() / 1000) - 60;

describe('CometChatDate a11y', () => {
  it('passes axe-core audit (caption variant)', async () => {
    const { container } = render(
      <CometChatDate.Root timestamp={TIMESTAMP} variant="caption">
        <CometChatDate.Text />
      </CometChatDate.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit (body variant)', async () => {
    const { container } = render(
      <CometChatDate.Root timestamp={TIMESTAMP} variant="body">
        <CometChatDate.Text />
      </CometChatDate.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit (label variant)', async () => {
    const { container } = render(
      <CometChatDate.Root timestamp={TIMESTAMP} variant="label">
        <CometChatDate.Text />
      </CometChatDate.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('<time> element has valid datetime attribute', () => {
    const { container } = render(
      <CometChatDate.Root timestamp={TIMESTAMP}>
        <CometChatDate.Text />
      </CometChatDate.Root>
    );
    const time = container.querySelector('time');
    expect(time).not.toBeNull();
    const datetime = time?.getAttribute('datetime') ?? '';
    expect(new Date(datetime).toISOString()).toBe(datetime);
  });

  it('<time> element has aria-label with full date/time', () => {
    const { container } = render(
      <CometChatDate.Root timestamp={TIMESTAMP}>
        <CometChatDate.Text />
      </CometChatDate.Root>
    );
    const time = container.querySelector('time');
    const label = time?.getAttribute('aria-label') ?? '';
    expect(label.length).toBeGreaterThan(0);
  });
});
