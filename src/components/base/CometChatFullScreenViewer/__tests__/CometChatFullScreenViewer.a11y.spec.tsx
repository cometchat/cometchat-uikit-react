import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatFullScreenViewer } from '../CometChatFullScreenViewer';
import type { CometChatMediaAttachment } from '../CometChatFullScreenViewer.types';

expect.extend(toHaveNoViolations);

function renderViewer(props: Partial<Parameters<typeof CometChatFullScreenViewer.Root>[0]> = {}) {
  const defaultProps = {
    onClose: vi.fn(),
    url: 'https://example.com/photo.jpg',
    mediaType: 'image' as const,
    ...props,
  };
  return render(<CometChatFullScreenViewer.Root {...defaultProps} />);
}

describe('CometChatFullScreenViewer a11y', () => {
  it('passes axe-core audit with zero violations (image mode)', async () => {
    const { container } = renderViewer({
      senderName: 'John',
      senderAvatar: 'https://example.com/a.jpg',
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Video mode axe test skipped in jsdom — video elements cause axe preload timeout.
  // Video a11y is verified via Playwright e2e tests instead.
  it.skip('passes axe-core audit with zero violations (video mode)', async () => {
    const { container } = renderViewer({
      url: 'https://example.com/v.mp4',
      mediaType: 'video',
      senderName: 'John',
    });
    const results = await axe(container, {
      rules: { 'video-caption': { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (file mode)', async () => {
    const { container } = renderViewer({
      url: 'https://example.com/f.pdf',
      mediaType: 'file',
      fileName: 'doc.pdf',
      senderName: 'John',
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (gallery mode)', async () => {
    const attachments: CometChatMediaAttachment[] = [
      { url: 'https://example.com/1.jpg', type: 'image' },
      { url: 'https://example.com/2.jpg', type: 'image' },
    ];
    const { container } = renderViewer({ attachments, url: undefined, senderName: 'John' });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('dialog has correct ARIA attributes', () => {
    renderViewer();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Image viewer');
  });

  it('aria-label changes based on media type', () => {
    const { rerender } = render(
      <CometChatFullScreenViewer.Root onClose={vi.fn()} url="x" mediaType="video" />
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Video viewer');

    rerender(<CometChatFullScreenViewer.Root onClose={vi.fn()} url="x" mediaType="audio" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Audio viewer');

    rerender(<CometChatFullScreenViewer.Root onClose={vi.fn()} url="x" mediaType="file" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'File viewer');
  });

  it('Escape key closes the viewer', () => {
    const onClose = vi.fn();
    renderViewer({ onClose });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('close button has aria-label', () => {
    renderViewer();
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('gallery navigation buttons have aria-labels', () => {
    const attachments: CometChatMediaAttachment[] = [
      { url: 'https://example.com/1.jpg', type: 'image' },
      { url: 'https://example.com/2.jpg', type: 'image' },
    ];
    renderViewer({ attachments, url: undefined });
    expect(screen.getByLabelText('Previous')).toBeInTheDocument();
    expect(screen.getByLabelText('Next')).toBeInTheDocument();
  });

  it('gallery index display has aria-live', () => {
    const attachments: CometChatMediaAttachment[] = [
      { url: 'https://example.com/1.jpg', type: 'image' },
      { url: 'https://example.com/2.jpg', type: 'image' },
    ];
    const { container } = renderViewer({ attachments, url: undefined });
    const indexDisplay = container.querySelector('[aria-live="polite"]');
    expect(indexDisplay).not.toBeNull();
    expect(indexDisplay?.textContent).toContain('1 of 2');
  });
});
