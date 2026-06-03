import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatDate } from '../CometChatDate';

vi.mock('../useCometChatDate', () => ({
  useCometChatDate: (opts: { timestamp: number; formatter?: (ts: number) => string }) => {
    const date = new Date(opts.timestamp * 1000);
    const formattedDate = opts.formatter ? opts.formatter(opts.timestamp) : '10:30 am';
    return {
      formattedDate,
      isoDate: date.toISOString(),
      fullDateLabel: 'April 16, 2026 at 10:30 am',
    };
  },
}));

function renderRoot(props: Partial<Parameters<typeof CometChatDate.Root>[0]> = {}) {
  const defaultProps = {
    timestamp: 1713200000,
    children: <CometChatDate.Text />,
    ...props,
  };
  return render(<CometChatDate.Root {...defaultProps} />);
}

describe('CometChatDateRoot', () => {
  it('renders a <time> element as the root', () => {
    const { container } = renderRoot();
    expect(container.querySelector('time')).not.toBeNull();
  });

  it('sets datetime attribute to ISO 8601 string', () => {
    const { container } = renderRoot();
    const time = container.querySelector('time');
    expect(time?.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('sets aria-label to a human-readable full date/time string', () => {
    const { container } = renderRoot();
    const time = container.querySelector('time');
    expect(time?.getAttribute('aria-label')).toBe('April 16, 2026 at 10:30 am');
  });

  it('sets title attribute for hover tooltip', () => {
    const { container } = renderRoot();
    const time = container.querySelector('time');
    expect(time?.getAttribute('title')).toBe('April 16, 2026 at 10:30 am');
  });

  it('defaults to caption variant', () => {
    const { container } = renderRoot();
    const time = container.querySelector('time');
    expect(time?.getAttribute('data-variant')).toBe('caption');
  });

  it('applies variant via data-variant attribute', () => {
    const { container } = renderRoot({ variant: 'label' });
    const time = container.querySelector('time');
    expect(time?.getAttribute('data-variant')).toBe('label');
  });

  it('applies custom className', () => {
    const { container } = renderRoot({ className: 'my-date' });
    const time = container.querySelector('time');
    expect(time?.className).toContain('my-date');
  });

  it('renders formatted date text from context', () => {
    renderRoot();
    expect(screen.getByText('10:30 am')).toBeInTheDocument();
  });

  it('uses custom formatter when provided', () => {
    renderRoot({ formatter: () => 'Custom Date' });
    expect(screen.getByText('Custom Date')).toBeInTheDocument();
  });

  it('renders default text span when no children provided', () => {
    const { container } = render(<CometChatDate.Root timestamp={1713200000} />);
    const time = container.querySelector('time');
    expect(time?.textContent).toBe('10:30 am');
  });
});
