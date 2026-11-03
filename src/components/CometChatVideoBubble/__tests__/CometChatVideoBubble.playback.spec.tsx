/* eslint-disable @typescript-eslint/no-deprecated -- this file intentionally exercises the deprecated legacy bubble it covers */
// Video bubble: attachment sources, captions, fullscreen playback, multi-video tiles and the viewer.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMediaAttachment } from '../../base/CometChatFullScreenViewer/CometChatFullScreenViewer.types';
import type { CometChatVideoBubbleAttachment } from '../CometChatVideoBubble.types';
import { CometChatVideoBubble } from '../CometChatVideoBubble';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatFrameProvider } from '../../../context/CometChatFrameContext';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';

interface ViewerProps {
  onClose: () => void;
  attachments: CometChatMediaAttachment[];
  startIndex: number;
  senderName: string;
  mediaType: string;
}

const { extractOverride } = vi.hoisted(() => ({
  extractOverride: { value: null as CometChatVideoBubbleAttachment[] | null },
}));

vi.mock('../CometChatVideoBubble.utils', async importOriginal => {
  const actual = await importOriginal<typeof import('../CometChatVideoBubble.utils')>();
  return {
    ...actual,
    extractVideoAttachments: (message: CometChat.MediaMessage) =>
      extractOverride.value ?? actual.extractVideoAttachments(message),
  };
});

vi.mock('../../base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy', () => ({
  default: (props: ViewerProps) => (
    <div role="dialog" aria-label="viewer">
      <span>start:{props.startIndex}</span>
      <span>sender:{props.senderName}</span>
      <span>type:{props.mediaType}</span>
      <span>
        urls:
        {props.attachments.map(a => `${a.url}/${a.type}/${String(a.size)}`).join(',')}
      </span>
      <button type="button" onClick={props.onClose}>
        close viewer
      </button>
    </div>
  ),
}));

interface VideoMessageOptions {
  attachments?: unknown;
  caption?: string;
  data?: unknown;
  metadata?: Record<string, unknown> | null;
  senderUid?: string;
  senderName?: string;
  noSender?: boolean;
}

function videoMessage(opts: VideoMessageOptions = {}): CometChat.MediaMessage {
  const sender = buildUser({
    uid: opts.senderUid ?? 'sender',
    name: opts.senderName ?? 'Alice',
  });
  return {
    ...buildMediaMessage({ type: 'video', sender }),
    getSender: () => (opts.noSender ? undefined : sender),
    getAttachments: () =>
      opts.attachments ?? [{ url: 'https://cdn/v.mp4', thumbnail: 'https://cdn/t.jpg' }],
    getCaption: () => opts.caption ?? '',
    getData: () => opts.data ?? {},
    getMetadata: () => (opts.metadata === undefined ? {} : opts.metadata),
  } as unknown as CometChat.MediaMessage;
}

function videos(count: number): CometChatVideoBubbleAttachment[] {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://cdn/v${String(i)}.mp4`,
    ...(i % 2 === 0 ? { thumbnail: `https://cdn/t${String(i)}.jpg` } : {}),
    ...(i === 0 ? { size: 2048 } : {}),
  }));
}

function getVideo(container: HTMLElement): HTMLVideoElement {
  const video = container.querySelector('video');
  if (!video) throw new Error('video element not rendered');
  return video;
}

const PLAY_TILE = 'Play video. Press Enter to open.';

beforeEach(() => {
  extractOverride.value = null;
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'fullscreenElement');
});

describe('CometChatVideoBubble — single video sources', () => {
  it('uses the thumbnail-generation extension as poster when the attachment has none', () => {
    const { container } = render(
      <CometChatVideoBubble
        message={videoMessage({
          attachments: [
            {
              url: 'https://cdn/v.mp4',
              metadata: { duration: 3, width: 1, height: 1 },
            },
          ],
          metadata: {
            '@injected': {
              extensions: {
                'thumbnail-generation': { url_medium: 'https://cdn/gen.jpg' },
              },
            },
          },
        })}
      />
    );
    const video = getVideo(container);
    expect(video).toHaveAttribute('src', 'https://cdn/v.mp4');
    expect(video).toHaveAttribute('poster', 'https://cdn/gen.jpg');
  });

  it('renders an empty poster when no thumbnail is available anywhere', () => {
    const { container } = render(
      <CometChatVideoBubble
        message={videoMessage({
          attachments: [{ url: 'https://cdn/v.mp4' }],
          metadata: null,
        })}
      />
    );
    expect(getVideo(container)).toHaveAttribute('poster', '');
  });

  it('skips attachments without a url and uses the first playable one', () => {
    const { container } = render(
      <CometChatVideoBubble
        message={videoMessage({
          attachments: [
            null,
            { name: 'no-url' },
            { url: 'https://cdn/second.mp4', thumbnail: 'p' },
          ],
        })}
      />
    );
    expect(getVideo(container)).toHaveAttribute('src', 'https://cdn/second.mp4');
  });

  it('shows a pending upload as a control-less preview of the local file', () => {
    const createObjectURL = vi.fn(() => 'blob:local-video');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' });

    const { container } = render(
      <CometChatVideoBubble message={videoMessage({ attachments: [], metadata: { file } })} />
    );

    const video = getVideo(container);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(video).toHaveAttribute('src', 'blob:local-video');
    expect(video).not.toHaveAttribute('controls');
    expect(video).toHaveAccessibleName('Video from Alice');
  });

  it('gives a pending upload without a sender the generic label', () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: () => 'blob:local-video',
    });
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    const { container } = render(
      <CometChatVideoBubble
        message={videoMessage({
          attachments: [],
          metadata: { file },
          noSender: true,
        })}
      />
    );
    expect(getVideo(container)).toHaveAccessibleName('Video message');
  });

  it('renders nothing when the message attachments cannot be read', () => {
    const message = videoMessage();
    (message as unknown as { getAttachments: () => never }).getAttachments = () => {
      throw new Error('bad payload');
    };
    const { container } = render(<CometChatVideoBubble message={message} />);
    expect(container.querySelector('video')).toBeNull();
  });

  it('falls back to the generic label when the message has no sender', () => {
    const { container } = render(
      <CometChatVideoBubble message={videoMessage({ noSender: true })} />
    );
    expect(getVideo(container)).toHaveAccessibleName('Video message');
  });
});

describe('CometChatVideoBubble — alignment', () => {
  it('renders as outgoing when the logged-in user sent the message', () => {
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(
      buildUser({ uid: 'me' }) as unknown as CometChat.User
    );
    const { container } = render(
      <CometChatVideoBubble message={videoMessage({ senderUid: 'me' })} />
    );
    expect(container.firstElementChild).toHaveClass('cometchat-video-bubble--outgoing');
  });
});

describe('CometChatVideoBubble — caption', () => {
  it('shows the caption text', () => {
    render(<CometChatVideoBubble message={videoMessage({ caption: 'Check this out' })} />);
    expect(screen.getByText('Check this out')).toBeInTheDocument();
  });

  it('falls back to the text in the message data when the caption is blank', () => {
    render(
      <CometChatVideoBubble
        message={videoMessage({ caption: '  ', data: { text: 'From data' } })}
      />
    );
    expect(screen.getByText('From data')).toBeInTheDocument();
  });

  it('shows no caption when both caption and data text are blank', () => {
    const { container } = render(
      <CometChatVideoBubble message={videoMessage({ caption: '', data: { text: '   ' } })} />
    );
    expect(container.querySelector('.cometchat-video-bubble__caption')).toBeNull();
  });
});

describe('CometChatVideoBubble — fullscreen playback', () => {
  it('requests fullscreen when playback starts outside fullscreen', () => {
    const { container } = render(<CometChatVideoBubble message={videoMessage()} />);
    const video = getVideo(container);
    const requestFullscreen = vi.fn(() => Promise.resolve());
    video.requestFullscreen = requestFullscreen;

    fireEvent.play(video);

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('swallows a rejected fullscreen request', async () => {
    const { container } = render(<CometChatVideoBubble message={videoMessage()} />);
    const video = getVideo(container);
    const requestFullscreen = vi.fn(() => Promise.reject(new Error('denied')));
    video.requestFullscreen = requestFullscreen;

    fireEvent.play(video);
    await Promise.resolve();

    expect(requestFullscreen).toHaveBeenCalled();
  });

  it('does not request fullscreen again while already fullscreen', () => {
    const { container } = render(<CometChatVideoBubble message={videoMessage()} />);
    const video = getVideo(container);
    const requestFullscreen = vi.fn(() => Promise.resolve());
    video.requestFullscreen = requestFullscreen;
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: video,
    });

    fireEvent.play(video);

    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it('checks fullscreen state on the iframe document when rendered inside a frame', () => {
    const iframe = document.createElement('iframe');
    iframe.id = 'chat-frame';
    document.body.appendChild(iframe);
    const frameDoc = iframe.contentDocument;
    if (!frameDoc) throw new Error('iframe has no document');
    Object.defineProperty(frameDoc, 'fullscreenElement', {
      configurable: true,
      value: frameDoc.body,
    });

    const { container } = render(
      <CometChatFrameProvider iframeId="chat-frame">
        <CometChatVideoBubble message={videoMessage()} />
      </CometChatFrameProvider>
    );
    const video = getVideo(container);
    const requestFullscreen = vi.fn(() => Promise.resolve());
    video.requestFullscreen = requestFullscreen;

    fireEvent.play(video);
    expect(requestFullscreen).not.toHaveBeenCalled();

    Object.defineProperty(frameDoc, 'fullscreenElement', {
      configurable: true,
      value: null,
    });
    fireEvent.play(video);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    iframe.remove();
  });

  it('fits the video while fullscreen and restores cover sizing on exit', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
    const { container } = render(<CometChatVideoBubble message={videoMessage()} />);
    const video = getVideo(container);

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: video,
    });
    fireEvent(video, new Event('fullscreenchange'));
    expect(video.style.objectFit).toBe('contain');

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
    });
    fireEvent(video, new Event('fullscreenchange'));
    expect(video.style.objectFit).toBe('cover');
    expect(raf).toHaveBeenCalled();
    expect(video.style.display).toBe('block');
  });
});

describe('CometChatVideoBubble — multiple videos', () => {
  it.each([
    [2, 'cometchat-video-bubble__grid--two-col', 'cometchat-video-bubble--grid'],
    [3, 'cometchat-video-bubble__grid--three', 'cometchat-video-bubble--grid'],
    [4, 'cometchat-video-bubble__grid--2x2', 'cometchat-video-bubble--grid-2x2'],
  ])('lays out %i videos as playable tiles', (count, gridClass, rootClass) => {
    extractOverride.value = videos(count);
    const { container } = render(<CometChatVideoBubble message={videoMessage()} />);

    const tiles = screen.getAllByRole('button', { name: PLAY_TILE });
    expect(tiles).toHaveLength(count);
    expect(container.firstElementChild).toHaveClass(rootClass);
    expect(container.querySelector(`.${gridClass}`)).not.toBeNull();
    expect(container.querySelector('video')).toBeNull();
  });

  it('shows the thumbnail on a tile, or the video url when there is none', () => {
    extractOverride.value = videos(2);
    const { container } = render(<CometChatVideoBubble message={videoMessage()} />);
    const thumbs = Array.from(container.querySelectorAll('img')).map(img =>
      img.getAttribute('src')
    );
    expect(thumbs).toEqual(['https://cdn/t0.jpg', 'https://cdn/v1.mp4']);
  });

  it('collapses more than four videos into three tiles and a "+N" overflow tile', () => {
    extractOverride.value = videos(6);
    const { container } = render(<CometChatVideoBubble message={videoMessage()} />);

    expect(screen.getAllByRole('button', { name: PLAY_TILE })).toHaveLength(3);
    const overflow = screen.getByRole('button', {
      name: '2 more videos. Press Enter to view all.',
    });
    expect(overflow).toHaveTextContent('+2');
    expect(overflow.style.backgroundImage).toContain('https://cdn/v3.mp4');
    expect(container.firstElementChild).toHaveClass('cometchat-video-bubble--overflow');
  });

  it('opens the viewer at the clicked tile with every video and closes it again', async () => {
    extractOverride.value = videos(3);
    render(<CometChatVideoBubble message={videoMessage({ senderName: 'Bob' })} />);

    fireEvent.click(screen.getAllByRole('button', { name: PLAY_TILE })[1] ?? document.body);

    const viewer = await screen.findByRole('dialog', { name: 'viewer' });
    expect(within(viewer).getByText('start:1')).toBeInTheDocument();
    expect(within(viewer).getByText('sender:Bob')).toBeInTheDocument();
    expect(within(viewer).getByText('type:video')).toBeInTheDocument();
    expect(
      within(viewer).getByText(
        'urls:https://cdn/v0.mp4/video/2048,https://cdn/v1.mp4/video/undefined,https://cdn/v2.mp4/video/undefined'
      )
    ).toBeInTheDocument();

    fireEvent.click(within(viewer).getByRole('button', { name: 'close viewer' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the viewer from the keyboard with Enter or Space only', async () => {
    extractOverride.value = videos(2);
    render(<CometChatVideoBubble message={videoMessage()} />);
    const [first, second] = screen.getAllByRole('button', { name: PLAY_TILE });
    if (!first || !second) throw new Error('expected two tiles');

    fireEvent.keyDown(first, { key: 'a' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.keyDown(second, { key: ' ' });
    expect(within(await screen.findByRole('dialog')).getByText('start:1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close viewer' }));
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(within(await screen.findByRole('dialog')).getByText('start:0')).toBeInTheDocument();
  });

  it('opens the viewer at the fourth video from the overflow tile', async () => {
    extractOverride.value = videos(5);
    render(<CometChatVideoBubble message={videoMessage()} />);
    const overflow = screen.getByRole('button', {
      name: '1 more videos. Press Enter to view all.',
    });

    fireEvent.keyDown(overflow, { key: 'Enter' });
    expect(within(await screen.findByRole('dialog')).getByText('start:3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close viewer' }));
    fireEvent.click(overflow);
    expect(within(await screen.findByRole('dialog')).getByText('start:3')).toBeInTheDocument();
  });
});
