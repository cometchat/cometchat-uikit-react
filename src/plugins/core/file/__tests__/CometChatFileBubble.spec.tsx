import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatFileBubble } from '../CometChatFileBubble';
import type { CometChatFileBubbleAttachment } from '../CometChatFileBubble.types';

function makeFile(
  overrides?: Partial<CometChatFileBubbleAttachment>
): CometChatFileBubbleAttachment {
  return {
    name: 'document.pdf',
    url: 'https://example.com/document.pdf',
    extension: 'pdf',
    mimeType: 'application/pdf',
    size: 2457600,
    ...overrides,
  };
}

describe('CometChatFileBubble', () => {
  // --- Rendering ---

  it('renders single file with name and size', () => {
    render(<CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />);
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.34 MB')).toBeInTheDocument();
  });

  it('renders nothing when attachments is empty', () => {
    const { container } = render(<CometChatFileBubble attachments={[]} variant="outgoing" />);
    expect(container.querySelector('[class*="file-item"]')).toBeNull();
  });

  it('renders file type icon', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />
    );
    const icon = container.querySelector('img[class*="icon"]') as HTMLImageElement | null;
    expect(icon).toBeTruthy();
    if (icon) {
      expect(icon.src).toContain('file_type_pdf');
    }
  });

  it('renders download link', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />
    );
    const link = container.querySelector('a[class*="download"]');
    expect(link).toBeTruthy();
    if (link) {
      expect(link.getAttribute('href')).toBe('https://example.com/document.pdf');
      expect(link.getAttribute('download')).toBe('document.pdf');
    }
  });

  // --- Variants ---

  it('applies outgoing class', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />
    );
    expect(container.querySelector('[class*="sender"]')).toBeTruthy();
  });

  it('applies incoming class', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="incoming" />
    );
    expect(container.querySelector('[class*="receiver"]')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" className="my-custom" />
    );
    expect(container.firstElementChild?.className).toContain('my-custom');
  });

  // --- File size formatting ---

  it('formats bytes correctly', () => {
    render(<CometChatFileBubble attachments={[makeFile({ size: 500 })]} variant="outgoing" />);
    expect(screen.getByText('500 B')).toBeInTheDocument();
  });

  it('formats kilobytes correctly', () => {
    render(<CometChatFileBubble attachments={[makeFile({ size: 1536 })]} variant="outgoing" />);
    expect(screen.getByText('1.50 KB')).toBeInTheDocument();
  });

  it('formats megabytes correctly', () => {
    render(<CometChatFileBubble attachments={[makeFile({ size: 5242880 })]} variant="outgoing" />);
    expect(screen.getByText('5.00 MB')).toBeInTheDocument();
  });

  it('formats gigabytes correctly', () => {
    render(
      <CometChatFileBubble attachments={[makeFile({ size: 1073741824 })]} variant="outgoing" />
    );
    expect(screen.getByText('1.00 GB')).toBeInTheDocument();
  });

  it('shows unknown for zero size', () => {
    render(<CometChatFileBubble attachments={[makeFile({ size: 0 })]} variant="outgoing" />);
    expect(screen.getByText('Unknown size')).toBeInTheDocument();
  });

  // --- File type icons ---

  it('shows PDF icon for .pdf', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile({ extension: 'pdf' })]} variant="outgoing" />
    );
    const icon = container.querySelector('img[class*="icon"]') as HTMLImageElement | null;
    if (icon) expect(icon.src).toContain('file_type_pdf');
  });

  it('shows Word icon for .docx', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile({ extension: 'docx' })]} variant="outgoing" />
    );
    const icon = container.querySelector('img[class*="icon"]') as HTMLImageElement | null;
    if (icon) expect(icon.src).toContain('file_type_word');
  });

  it('shows Excel icon for .xlsx', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile({ extension: 'xlsx' })]} variant="outgoing" />
    );
    const icon = container.querySelector('img[class*="icon"]') as HTMLImageElement | null;
    if (icon) expect(icon.src).toContain('file_type_xlsx');
  });

  it('shows default icon for unknown extension', () => {
    const { container } = render(
      <CometChatFileBubble
        attachments={[makeFile({ extension: 'xyz', mimeType: 'application/octet-stream' })]}
        variant="outgoing"
      />
    );
    const icon = container.querySelector('img[class*="icon"]') as HTMLImageElement | null;
    if (icon) expect(icon.src).toContain('file_type_unsupported');
  });

  // --- Caption ---

  it('renders caption when provided', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" caption="Check this" />
    );
    expect(container.querySelector('[class*="caption"]')).toBeTruthy();
  });

  it('does not render caption when not provided', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />
    );
    expect(container.querySelector('[class*="caption"]')).toBeNull();
  });

  // --- Multi-file expand/collapse ---

  it('shows "Show more +N" for files beyond 3', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile({ name: `file-${String(i)}.pdf`, url: `#${String(i)}` })
    );
    render(<CometChatFileBubble attachments={files} variant="outgoing" />);
    expect(screen.getByText('Show more')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows 3 files in collapsed view', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile({ name: `file-${String(i)}.pdf`, url: `#${String(i)}` })
    );
    const { container } = render(<CometChatFileBubble attachments={files} variant="outgoing" />);
    const items = container.querySelectorAll('[class*="file-item"]');
    expect(items).toHaveLength(3);
  });

  it('does not show toggle for 3 or fewer files', () => {
    const files = [
      makeFile(),
      makeFile({ name: 'b.xlsx', url: '#b' }),
      makeFile({ name: 'c.pptx', url: '#c' }),
    ];
    render(<CometChatFileBubble attachments={files} variant="outgoing" />);
    expect(screen.queryByText('Show more')).toBeNull();
  });

  it('does not show toggle for single file', () => {
    render(<CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />);
    expect(screen.queryByText('Show more')).toBeNull();
  });

  it('expands to show all files on click', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile({ name: `file-${String(i)}.pdf`, url: `#${String(i)}` })
    );
    render(<CometChatFileBubble attachments={files} variant="outgoing" />);

    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('file-3.pdf')).toBeInTheDocument();
    expect(screen.getByText('file-4.pdf')).toBeInTheDocument();
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  it('collapses back on "Show less" click', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile({ name: `file-${String(i)}.pdf`, url: `#${String(i)}` })
    );
    render(<CometChatFileBubble attachments={files} variant="outgoing" />);

    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('file-4.pdf')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show less'));
    expect(screen.queryByText('file-4.pdf')).toBeNull();
  });

  // --- Accessibility ---

  it('file item has aria-label with name and size', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />
    );
    const item = container.querySelector('[class*="file-item"]');
    if (item) {
      const label = item.getAttribute('aria-label');
      expect(label).toContain('document.pdf');
      expect(label).toContain('2.34 MB');
    }
  });

  it('download link has aria-label', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />
    );
    const link = container.querySelector('a[class*="download"]');
    if (link) {
      expect(link.getAttribute('aria-label')).toContain('Download');
    }
  });

  it('expand toggle has aria-expanded="false"', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile({ name: `file-${String(i)}.pdf`, url: `#${String(i)}` })
    );
    render(<CometChatFileBubble attachments={files} variant="outgoing" />);
    const btn = screen.getByText('Show more');
    expect(btn.closest('button')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('collapse toggle has aria-expanded="true"', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile({ name: `file-${String(i)}.pdf`, url: `#${String(i)}` })
    );
    render(<CometChatFileBubble attachments={files} variant="outgoing" />);
    fireEvent.click(screen.getByText('Show more'));
    const btn = screen.getByText('Show less');
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('file icon is aria-hidden', () => {
    const { container } = render(
      <CometChatFileBubble attachments={[makeFile()]} variant="outgoing" />
    );
    const icon = container.querySelector('img[class*="icon"]');
    if (icon) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
