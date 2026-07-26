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

  // --- Unsupported / no-preview state ---

  it('shows the unsupported state (with download) when an image fails to load', () => {
    const onDownload = vi.fn();
    renderViewer({ onDownload });
    fireEvent.error(screen.getByAltText('Full screen image'));
    expect(screen.getByText('No preview available')).toBeInTheDocument();
    expect(screen.getByText("This file type isn't supported for preview.")).toBeInTheDocument();
    // The unsupported state's own Download button triggers onDownload.
    fireEvent.click(screen.getByText('Download'));
    expect(onDownload).toHaveBeenCalledWith('https://example.com/photo.jpg');
  });

  it('clears the error when navigating from a broken item to a valid one', () => {
    const attachments: CometChatMediaAttachment[] = [
      { url: 'https://example.com/broken.jpg', type: 'image', name: 'a.jpg' },
      { url: 'https://example.com/good.jpg', type: 'image', name: 'b.jpg' },
    ];
    renderViewer({ attachments, url: undefined, startIndex: 0 });
    fireEvent.error(screen.getByAltText('Full screen image'));
    expect(screen.getByText('No preview available')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Next'));
    // The valid item must render normally, not inherit the previous error.
    expect(screen.queryByText('No preview available')).toBeNull();
    expect(screen.getByAltText('Full screen image')).toBeInTheDocument();
  });

  it('treats an audio-only file in a video message as unsupported and does not autoplay', () => {
    renderViewer({ url: 'https://example.com/audio-as-video.mp4', mediaType: 'video' });
    const video = screen
      .getAllByLabelText('Full screen video')
      .find(el => el.tagName === 'VIDEO') as HTMLVideoElement;
    expect(video).toBeDefined();
    // Playback is gated on a validated visual track, so autoPlay must be off.
    expect(video.hasAttribute('autoplay')).toBe(false);
    // jsdom reports videoWidth/Height of 0 → no visual track → unsupported.
    fireEvent.loadedMetadata(video);
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });

  it('keeps the video player hidden until it is confirmed to be a real video', () => {
    renderViewer({ url: 'https://example.com/clip.mp4', mediaType: 'video' });
    const video = screen
      .getAllByLabelText('Full screen video')
      .find(el => el.tagName === 'VIDEO') as HTMLVideoElement;
    // Before metadata resolves, the player is hidden so an invalid file never
    // flashes a player before the unsupported state.
    expect(video.className).toContain('cometchat-fullscreen-viewer__body-video--loading');
  });

  it('clears the unsupported state when navigating from an invalid video to the next item', () => {
    const attachments: CometChatMediaAttachment[] = [
      { url: 'https://example.com/audio-as-video.mp4', type: 'video', name: 'a.mp4' },
      { url: 'https://example.com/real-video.mp4', type: 'video', name: 'b.mp4' },
    ];
    renderViewer({ attachments, url: undefined, startIndex: 0 });
    const video = screen
      .getAllByLabelText('Full screen video')
      .find(el => el.tagName === 'VIDEO') as HTMLVideoElement;
    // jsdom reports 0×0 → the first item is unsupported.
    fireEvent.loadedMetadata(video);
    expect(screen.getByText('No preview available')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Next'));
    // The next item must re-probe, not inherit the previous unsupported state.
    expect(screen.queryByText('No preview available')).toBeNull();
    expect(screen.getAllByLabelText('Full screen video').some(el => el.tagName === 'VIDEO')).toBe(
      true
    );
  });

  it('resolves even when metadata is already loaded before listeners attach (no event fires)', () => {
    // Simulates the real bug: the bubble tile probes the same URL, so by the time
    // fullscreen opens the metadata is already available and `loadedmetadata`
    // never fires again — the view must still resolve from readyState/dimensions.
    const media = window.HTMLMediaElement.prototype;
    const video = window.HTMLVideoElement.prototype;
    const saved = {
      readyState: Object.getOwnPropertyDescriptor(media, 'readyState'),
      videoWidth: Object.getOwnPropertyDescriptor(video, 'videoWidth'),
      videoHeight: Object.getOwnPropertyDescriptor(video, 'videoHeight'),
    };
    const restore = (obj: object, key: string, desc: PropertyDescriptor | undefined) => {
      if (desc) Object.defineProperty(obj, key, desc);
    };
    // Already-loaded, audio-only (no visual track).
    Object.defineProperty(media, 'readyState', { configurable: true, get: () => 1 });
    Object.defineProperty(video, 'videoWidth', { configurable: true, get: () => 0 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, get: () => 0 });
    try {
      renderViewer({ url: 'https://example.com/audio-as-video.mp4', mediaType: 'video' });
      expect(screen.getByText('No preview available')).toBeInTheDocument();
    } finally {
      restore(media, 'readyState', saved.readyState);
      restore(video, 'videoWidth', saved.videoWidth);
      restore(video, 'videoHeight', saved.videoHeight);
    }
  });
});
