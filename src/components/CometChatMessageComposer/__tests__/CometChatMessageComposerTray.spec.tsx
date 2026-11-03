/**
 * Unit tests for CometChatMessageComposerTray: tile rendering per kind and status,
 * rejection tooltips, remove / retry, the fullscreen viewer for uploaded media,
 * local image and video thumbnails, and the audio card's playback controls.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { TrayItem } from '../CometChatMessageComposer.types';

const mocks = vi.hoisted(() => ({
  ctx: {} as Record<string, unknown>,
  viewerProps: undefined as Record<string, unknown> | undefined,
  startPlayback: vi.fn(),
  stopPlayback: vi.fn(),
}));

vi.mock('../CometChatMessageComposer.context', () => ({
  useCometChatMessageComposerContext: () => mocks.ctx,
}));
vi.mock('../../base/CometChatTooltip', () => ({
  CometChatTooltip: ({ children }: { children: React.ReactNode }) => <div role="tooltip">{children}</div>,
}));
vi.mock('../../base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.viewerProps = props;
    return (
      <button type="button" onClick={props.onClose as () => void}>
        close viewer
      </button>
    );
  },
}));
vi.mock('../../../utils/audioPlaybackController', () => ({
  startExclusivePlayback: mocks.startPlayback,
  stopExclusivePlayback: mocks.stopPlayback,
}));

import { CometChatMessageComposerTray } from '../CometChatMessageComposerTray';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import pdfIcon from '../../../assets/file_type_pdf.svg';
import wordIcon from '../../../assets/file_type_word.svg';
import sheetIcon from '../../../assets/file_type_xlsx.svg';
import slidesIcon from '../../../assets/file_type_ppt.svg';
import textIcon from '../../../assets/file_type_txt.svg';
import zipIcon from '../../../assets/file_type_zip.svg';
import audioIcon from '../../../assets/file_type_mp3.svg';
import videoIcon from '../../../assets/file_type_mov.svg';
import imageIcon from '../../../assets/file_type_jpg.svg';
import unsupportedIcon from '../../../assets/file_type_unsupported.svg';

let nextId = 0;
function item(name: string, kind: TrayItem['kind'], status: TrayItem['status'] = 'success', extra: Partial<TrayItem> = {}): TrayItem {
  nextId += 1;
  return {
    fileId: `f${String(nextId)}`,
    file: new File(['x'], name, { type: extra.file?.type ?? '' }),
    kind,
    status,
    percent: 0,
    previewUrl: `blob:${name}`,
    ...extra,
  };
}

function renderTray(items: TrayItem[], overrides: Record<string, unknown> = {}) {
  mocks.ctx = {
    tray: { batchId: items.length ? 'b1' : null, items },
    enableMultipleAttachments: true,
    removeAttachment: vi.fn(),
    retryAttachment: vi.fn(),
    ...overrides,
  };
  return render(
    <LocaleProvider>
      <CometChatMessageComposerTray className="mine" />
    </LocaleProvider>
  );
}

const tile = (it: TrayItem) => document.querySelector<HTMLElement>(`[data-file-id="${it.fileId}"]`)!;

describe('CometChatMessageComposerTray', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.viewerProps = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when the tray is empty or multiple attachments are off', () => {
    expect(renderTray([]).container).toBeEmptyDOMElement();
    expect(renderTray([item('a.pdf', 'file')], { enableMultipleAttachments: false }).container).toBeEmptyDOMElement();
  });

  it('lists the staged items with their kind and status', () => {
    const a = item('a.pdf', 'file', 'uploading', { percent: 40 });
    const b = item('b.png', 'image');
    renderTray([a, b]);
    expect(screen.getByRole('list', { name: 'Staged attachments' }).parentElement).toHaveClass('cometchat-message-composer__tray', 'mine');
    expect(tile(a)).toHaveClass('cometchat-message-composer__tray-tile--file', 'cometchat-message-composer__tray-tile--uploading');
    expect(tile(b)).toHaveAttribute('data-status', 'success');
  });

  describe('upload status', () => {
    it('shows a determinate ring while uploading and a spinning one before progress starts', () => {
      const started = item('a.pdf', 'file', 'uploading', { percent: 42.4 });
      const queued = item('b.pdf', 'file', 'uploading', { percent: 0 });
      renderTray([started, queued]);
      const [ring, spinner] = screen.getAllByRole('progressbar', { name: 'Uploading' });
      expect(ring).toHaveAttribute('aria-valuenow', '42');
      expect(spinner).not.toHaveAttribute('aria-valuenow');
    });

    it('a failed upload offers a retry and says so on the card', () => {
      const failed = item('a.pdf', 'file', 'failed');
      renderTray([failed]);
      fireEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
      expect(mocks.ctx.retryAttachment).toHaveBeenCalledWith(failed.fileId);
      expect(tile(failed)).toHaveTextContent('Tap to retry');
    });

    it('a rejected upload shows the rejected icon and "Upload Failed"', () => {
      const rejected = item('a.pdf', 'file', 'rejected', { error: { code: 'ERR_OTHER' } });
      renderTray([rejected]);
      expect(screen.getByRole('img', { name: 'Upload rejected' })).toBeInTheDocument();
      expect(tile(rejected)).toHaveTextContent('Upload Failed');
    });

    it('removes an item from its close button', () => {
      const a = item('a.pdf', 'file');
      renderTray([a]);
      fireEvent.click(screen.getByRole('button', { name: 'Remove attachment' }));
      expect(mocks.ctx.removeAttachment).toHaveBeenCalledWith(a.fileId);
    });
  });

  describe('rejection tooltip', () => {
    const tooltipFor = (error: unknown) => {
      const rejected = item('a.pdf', 'file', 'rejected', { error });
      const { unmount } = renderTray([rejected]);
      fireEvent.mouseEnter(tile(rejected));
      const text = screen.queryByRole('tooltip')?.textContent ?? null;
      fireEvent.mouseLeave(tile(rejected));
      const closed = screen.queryByRole('tooltip') === null;
      unmount();
      return { text, closed };
    };

    it('states the size limit parsed from the SDK error', () => {
      const error = { code: 'ERR_FILE_SIZE_EXCEEDED', message: 'The file a.pdf exceeds the maximum allowed size of 26214400 bytes.' };
      expect(tooltipFor(error)).toEqual({ text: 'File exceeds the 25 MB size limit.', closed: true });
      expect(tooltipFor({ ...error, message: 'max of 1572864 bytes' }).text).toBe('File exceeds the 1.5 MB size limit.');
    });

    it('drops the number when the limit cannot be parsed', () => {
      expect(tooltipFor({ code: 'ERR_FILE_SIZE_EXCEEDED', message: 'too big' }).text).toBe('File exceeds the MB size limit.');
      expect(tooltipFor({ code: 'ERR_FILE_SIZE_EXCEEDED' }).text).toBe('File exceeds the MB size limit.');
    });

    it('explains unsupported types and invalid files, and otherwise uses the error message', () => {
      expect(tooltipFor({ code: 'ERR_PERMISSION_DENIED' }).text).toBe('File type not supported.');
      expect(tooltipFor({ code: 'ERR_BAD_REQUEST' }).text).toBe('Invalid File');
      expect(tooltipFor({ code: 'X', message: 'Server said no' }).text).toBe('Server said no');
    });

    it('shows no tooltip when there is nothing to say', () => {
      const rejected = item('a.pdf', 'file', 'rejected', { error: 'boom' });
      renderTray([rejected]);
      expect(tile(rejected)).not.toHaveClass('cometchat-message-composer__tray-tile--rejected-tooltip');
      fireEvent.mouseEnter(tile(rejected));
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('opens on keyboard focus too', () => {
      const rejected = item('a.pdf', 'file', 'rejected', { error: { code: 'ERR_BAD_REQUEST' } });
      renderTray([rejected]);
      fireEvent.focus(tile(rejected));
      expect(screen.getByRole('tooltip')).toHaveTextContent('Invalid File');
      fireEvent.blur(tile(rejected));
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  describe('file cards', () => {
    it.each([
      ['report.pdf', 'PDF', pdfIcon],
      ['notes.docx', 'DOCX', wordIcon],
      ['data.csv', 'CSV', sheetIcon],
      ['deck.pptx', 'PPTX', slidesIcon],
      ['readme.txt', 'TXT', textIcon],
      ['bundle.7z', '7Z', zipIcon],
      ['song.wav', 'WAV', audioIcon],
      ['clip.mkv', 'MKV', videoIcon],
      ['photo.heic', 'HEIC', imageIcon],
      ['blob.xyz', 'XYZ', unsupportedIcon],
      ['Makefile', 'FILE', unsupportedIcon],
    ])('%s gets the %s label and its type icon', (name, label, icon) => {
      const f = item(name, 'file');
      renderTray([f]);
      expect(tile(f).querySelector('.cometchat-message-composer__tray-card-icon--file')?.getAttribute('src')).toBe(icon);
      expect(tile(f).querySelector('.cometchat-message-composer__tray-card-meta')?.textContent).toBe(label);
      expect(tile(f).querySelector('.cometchat-message-composer__tray-filename')).toHaveAttribute('title', name);
    });
  });

  describe('media tiles', () => {
    it('only an uploaded image or video opens the viewer, by click, Enter or Space', async () => {
      const uploading = item('a.png', 'image', 'uploading');
      const img = item('b.png', 'image');
      const vid = item('c.mp4', 'video');
      renderTray([uploading, img, vid]);

      expect(tile(uploading).querySelector('[role="button"][aria-label="Open in fullscreen"]')).toBeNull();
      const [openImg, openVid] = screen.getAllByRole('button', { name: 'Open in fullscreen' });

      fireEvent.keyDown(openVid!, { key: 'a' });
      expect(screen.queryByText('close viewer')).toBeNull();
      fireEvent.keyDown(openVid!, { key: 'Enter' });
      await screen.findByText('close viewer');
      expect(mocks.viewerProps).toMatchObject({
        startIndex: 1,
        mediaType: 'video',
        attachments: [
          { url: 'blob:b.png', type: 'image', name: 'b.png' },
          { url: 'blob:c.mp4', type: 'video', name: 'c.mp4' },
        ],
      });

      fireEvent.click(screen.getByText('close viewer'));
      expect(screen.queryByText('close viewer')).toBeNull();

      fireEvent.keyDown(openImg!, { key: ' ' });
      await screen.findByText('close viewer');
      expect(mocks.viewerProps).toMatchObject({ startIndex: 0, mediaType: 'image' });
      fireEvent.click(screen.getByText('close viewer'));

      fireEvent.click(openImg!);
      await screen.findByText('close viewer');
    });

    it('creates a preview URL from the file when none was set, and blanks a tile that cannot be decoded', () => {
      const createObjectURL = vi.fn(() => 'blob:made');
      vi.stubGlobal('URL', Object.assign(URL, { createObjectURL }));
      const img = item('b.png', 'image', 'success', { previewUrl: undefined });
      renderTray([img]);
      const thumb = tile(img).querySelector('img.cometchat-message-composer__tray-thumbnail-img')!;
      expect(thumb.getAttribute('src')).toBe('blob:made');

      fireEvent.error(thumb);
      expect(tile(img).querySelector('.cometchat-message-composer__tray-thumbnail--blank')).not.toBeNull();
      expect(tile(img).querySelector('img.cometchat-message-composer__tray-thumbnail-img')).toBeNull();
      vi.unstubAllGlobals();
    });

    it('draws a square image thumbnail, keeping PNG for non-JPEG sources and JPEG for photos', () => {
      const images: { onload: (() => void) | null; src: string; naturalWidth: number; naturalHeight: number }[] = [];
      vi.stubGlobal(
        'Image',
        class {
          onload: (() => void) | null = null;
          src = '';
          naturalWidth = 400;
          naturalHeight = 200;
          constructor() {
            images.push(this);
          }
        }
      );
      const drawImage = vi.fn();
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never);
      const toDataURL = vi
        .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
        .mockImplementation((type?: string) => `data:${type ?? ''};thumb`);

      const png = item('a.png', 'image', 'success', { file: new File(['x'], 'a.png', { type: 'image/png' }) });
      const jpg = item('b.jpg', 'image', 'success', { file: new File(['x'], 'b.jpg', { type: 'image/jpeg' }) });
      renderTray([png, jpg]);
      act(() => images.forEach(i => i.onload?.()));

      // Centre crop of a 400x200 source: a 200px square starting 100px in.
      expect(drawImage.mock.calls[0]!.slice(1, 5)).toEqual([100, 0, 200, 200]);
      expect(toDataURL).toHaveBeenCalledWith('image/png');
      expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
      expect(tile(png).querySelector('img.cometchat-message-composer__tray-thumbnail-img')?.getAttribute('src')).toBe('data:image/png;thumb');
      expect(tile(jpg).querySelector('img.cometchat-message-composer__tray-thumbnail-img')?.getAttribute('src')).toBe('data:image/jpeg;thumb');
      vi.unstubAllGlobals();
    });

    it('captures a video poster from an early frame and shows its duration', () => {
      const videos: HTMLVideoElement[] = [];
      // eslint-disable-next-line @typescript-eslint/unbound-method -- re-applied below with the element as `this`
      const realAdd = EventTarget.prototype.addEventListener;
      vi.spyOn(EventTarget.prototype, 'addEventListener').mockImplementation(function (
        this: EventTarget,
        ...args: Parameters<EventTarget['addEventListener']>
      ) {
        if (this instanceof HTMLVideoElement && !videos.includes(this)) videos.push(this);
        realAdd.apply(this, args);
      });
      vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never);
      vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:poster');

      const vid = item('c.mp4', 'video', 'uploading', { percent: 10 });
      renderTray([vid]);
      const video = videos[0]!;
      Object.defineProperty(video, 'duration', { value: 75, configurable: true });
      Object.defineProperty(video, 'videoWidth', { value: 320 });
      Object.defineProperty(video, 'videoHeight', { value: 180 });

      act(() => {
        video.dispatchEvent(new Event('loadeddata'));
      });
      expect(video.currentTime).toBeCloseTo(0.1);
      act(() => {
        video.dispatchEvent(new Event('seeked'));
      });

      expect(tile(vid).querySelector('img.cometchat-message-composer__tray-thumbnail-img')?.getAttribute('src')).toBe('data:poster');
      expect(tile(vid).querySelector('.cometchat-message-composer__tray-duration')?.textContent).toBe('01:15');
      expect(tile(vid).querySelector('.cometchat-message-composer__tray-play')).not.toBeNull();
    });
  });

  describe('audio cards', () => {
    function setup(status: TrayItem['status'] = 'success') {
      const a = item('voice.m4a', 'audio', status);
      renderTray([a]);
      const audio = tile(a).querySelector('audio')!;
      let paused = true;
      Object.defineProperty(audio, 'paused', { get: () => paused, configurable: true });
      Object.defineProperty(audio, 'duration', { value: 65, configurable: true });
      vi.spyOn(audio, 'play').mockImplementation(() => {
        paused = false;
        audio.dispatchEvent(new Event('play'));
        return Promise.resolve();
      });
      vi.spyOn(audio, 'pause').mockImplementation(() => {
        paused = true;
        audio.dispatchEvent(new Event('pause'));
      });
      return { a, audio };
    }

    it('plays and pauses exclusively, showing the elapsed and total time', () => {
      const { a, audio } = setup();
      act(() => {
        audio.dispatchEvent(new Event('loadedmetadata'));
      });
      expect(tile(a)).toHaveTextContent('00:00/01:05');

      fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));
      expect(mocks.startPlayback).toHaveBeenCalled();
      const pause = screen.getByRole('button', { name: 'Pause audio' });

      audio.currentTime = 7;
      act(() => {
        audio.dispatchEvent(new Event('timeupdate'));
      });
      expect(tile(a)).toHaveTextContent('00:07/01:05');

      fireEvent.click(pause);
      expect(mocks.stopPlayback).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Play audio' })).toBeInTheDocument();
    });

    it('seeks with the slider and resets when playback ends', () => {
      const { a, audio } = setup();
      act(() => {
        audio.dispatchEvent(new Event('loadedmetadata'));
      });
      fireEvent.change(screen.getByRole('slider', { name: 'Seek audio' }), { target: { value: '30' } });
      expect(audio.currentTime).toBe(30);
      expect(tile(a)).toHaveTextContent('00:30/01:05');

      act(() => {
        audio.dispatchEvent(new Event('ended'));
      });
      expect(tile(a)).toHaveTextContent('00:00/01:05');
    });

    it('shows the status line instead of the controls while not uploaded', () => {
      const failed = item('voice.m4a', 'audio', 'failed');
      renderTray([failed]);
      expect(tile(failed)).toHaveTextContent('Tap to retry');
      expect(screen.queryByRole('slider')).toBeNull();
    });
  });
});
