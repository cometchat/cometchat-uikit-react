import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatFullScreenViewer } from '../CometChatFullScreenViewer';
import type { CometChatMediaAttachment } from '../CometChatFullScreenViewer.types';

function renderViewer(props: Partial<Parameters<typeof CometChatFullScreenViewer.Root>[0]> = {}) {
  const defaultProps = {
    onClose: vi.fn(),
    url: 'https://example.com/photo.jpg',
    mediaType: 'image' as const,
    ...props,
  };
  return render(<CometChatFullScreenViewer.Root {...defaultProps} />);
}

describe('CometChatFullScreenViewer', () => {
  it('renders the overlay when mounted', () => {
    renderViewer();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderViewer({ onClose });
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    renderViewer({ onClose });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('sets role="dialog" and aria-modal="true" on the viewer', () => {
    renderViewer();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('displays sender name and avatar in header when provided', () => {
    renderViewer({ senderName: 'John Doe', senderAvatar: 'https://example.com/avatar.jpg' });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  it('displays sender initials when avatar is not provided', () => {
    renderViewer({ senderName: 'John Doe' });
    // Initials are first letter of the first two words: "John Doe" -> "JD".
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('hides sender info when senderName and senderAvatar are not provided', () => {
    const { container } = renderViewer();
    expect(container.querySelector('[class*="sender-info"]')).toBeNull();
  });

  it('displays file name in center header', () => {
    renderViewer({ fileName: 'report.pdf', mediaType: 'file' });
    const matches = screen.getAllByText('report.pdf');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders image when mediaType is image', () => {
    renderViewer({ mediaType: 'image' });
    expect(screen.getByAltText('Full screen image')).toBeInTheDocument();
  });

  it('renders video when mediaType is video', () => {
    renderViewer({ url: 'https://example.com/video.mp4', mediaType: 'video' });
    const videos = screen.getAllByLabelText('Full screen video');
    const video = videos.find(el => el.tagName === 'VIDEO');
    expect(video).toBeDefined();
    expect(video!.tagName).toBe('VIDEO');
  });

  it('renders audio when mediaType is audio', () => {
    renderViewer({ url: 'https://example.com/audio.mp3', mediaType: 'audio' });
    const audios = screen.getAllByLabelText('Full screen audio');
    const audio = audios.find(el => el.tagName === 'AUDIO');
    expect(audio).toBeDefined();
    expect(audio!.tagName).toBe('AUDIO');
  });

  it('renders file preview when mediaType is file', () => {
    renderViewer({
      url: 'https://example.com/doc.pdf',
      mediaType: 'file',
      fileName: 'doc.pdf',
      fileSize: 1024,
    });
    const matches = screen.getAllByText('doc.pdf');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('applies custom className to root container', () => {
    renderViewer({ className: 'my-custom' });
    expect(screen.getByRole('dialog').className).toContain('my-custom');
  });

  // Gallery mode tests
  const galleryAttachments: CometChatMediaAttachment[] = [
    { url: 'https://example.com/1.jpg', type: 'image', name: 'photo-1.jpg' },
    { url: 'https://example.com/2.jpg', type: 'image', name: 'photo-2.jpg' },
    { url: 'https://example.com/3.jpg', type: 'image', name: 'photo-3.jpg' },
  ];

  it('gallery mode: renders prev/next navigation buttons', () => {
    renderViewer({ attachments: galleryAttachments, url: undefined });
    expect(screen.getByLabelText('Previous')).toBeInTheDocument();
    expect(screen.getByLabelText('Next')).toBeInTheDocument();
  });

  it('gallery mode: disables prev button at index 0', () => {
    renderViewer({ attachments: galleryAttachments, startIndex: 0, url: undefined });
    expect(screen.getByLabelText('Previous')).toBeDisabled();
  });

  it('gallery mode: disables next button at last index', () => {
    renderViewer({ attachments: galleryAttachments, startIndex: 2, url: undefined });
    expect(screen.getByLabelText('Next')).toBeDisabled();
  });

  it('gallery mode: displays index counter', () => {
    renderViewer({ attachments: galleryAttachments, startIndex: 1, url: undefined });
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });

  it('gallery mode: calls onIndexChange when navigating', () => {
    const onIndexChange = vi.fn();
    renderViewer({ attachments: galleryAttachments, startIndex: 1, onIndexChange, url: undefined });
    fireEvent.click(screen.getByLabelText('Next'));
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it('gallery mode: ArrowRight navigates to next item', () => {
    const onIndexChange = vi.fn();
    renderViewer({ attachments: galleryAttachments, startIndex: 0, onIndexChange, url: undefined });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight' });
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('gallery mode: ArrowLeft navigates to previous item', () => {
    const onIndexChange = vi.fn();
    renderViewer({ attachments: galleryAttachments, startIndex: 2, onIndexChange, url: undefined });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowLeft' });
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    renderViewer({ onDownload });
    fireEvent.click(screen.getByLabelText('Download'));
    expect(onDownload).toHaveBeenCalledWith('https://example.com/photo.jpg');
  });
});
