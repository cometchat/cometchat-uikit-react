/**
 * An own image/video that is still queued (no URL yet) is shown from the file the
 * message holds, in the bubble and in the full-screen viewer; the object URL is
 * revoked when the bubble lets go. Offline off draws exactly what it did.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImagesBubble } from '../CometChatImagesBubble';
import { CometChatVideosBubble } from '../../CometChatVideosBubble/CometChatVideosBubble';
import { buildUser } from '../../../testing/mock-builders';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

const viewerSpy = vi.fn();
vi.mock('../../base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy', () => ({
  default: (props: { attachments: { url: string }[] }) => {
    viewerSpy(props);
    return <div data-testid="viewer" />;
  },
}));
vi.mock('../../../hooks/useVideoMeta', () => ({
  useVideoMeta: () => ({ duration: null, status: 'valid' }),
}));

function queuedMessage(
  type: 'image' | 'video',
  file: File,
  shape: 'metadata' | 'files',
  url = ''
): CometChat.MediaMessage {
  const attachments = shape === 'files' ? [{ getUrl: () => url, getSize: () => 0 }] : [];
  return {
    getId: () => 0,
    getType: () => type,
    getCategory: () => 'message',
    getSender: () => buildUser({ name: 'Me', avatar: '' }) as unknown as CometChat.User,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => 'muid-1',
    getCaption: () => '',
    getData: () => ({}),
    getAttachments: () => attachments,
    getMentionedUsers: () => [],
    getMetadata: () => (shape === 'metadata' ? { file } : {}),
    getReactions: () => [],
    files: shape === 'files' ? [file] : undefined,
  } as unknown as CometChat.MediaMessage;
}

describe('queued own media preview (BEH-MEDIA-18)', () => {
  let fake: OfflineSdkFake | null = null;
  let created: string[];
  let revoked: string[];
  const createSpy = vi.fn();
  const revokeSpy = vi.fn();

  beforeEach(() => {
    created = [];
    revoked = [];
    viewerSpy.mockClear();
    createSpy.mockReset();
    revokeSpy.mockReset();
    createSpy.mockImplementation(() => {
      const u = `blob:queued-${String(created.length)}`;
      created.push(u);
      return u;
    });
    revokeSpy.mockImplementation((u: string) => revoked.push(u));
    URL.createObjectURL = createSpy as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL;
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        set src(v: string) {
          if (v) this.onload?.();
        }
      }
    );
  });
  afterEach(() => {
    fake?.restore();
    fake = null;
    vi.unstubAllGlobals();
  });

  const image = () => new File(['x'], 'a.jpg', { type: 'image/jpeg' });
  const video = () => new File(['x'], 'a.mp4', { type: 'video/mp4' });

  it.each(['metadata', 'files'] as const)(
    'image bubble previews the queued file (%s) and revokes the URL on unmount',
    async shape => {
      fake = installOfflineSdk({ enabled: true });
      const { container, unmount } = render(
        <CometChatImagesBubble message={queuedMessage('image', image(), shape)} alignment="right" />
      );
      await waitFor(() =>
        expect(container.querySelector('img.cometchat-images-bubble__image')?.getAttribute('src')).toBe(
          'blob:queued-0'
        )
      );
      fireEvent.click(container.querySelector('[role="button"]')!);
      await screen.findByTestId('viewer');
      expect(viewerSpy.mock.calls.at(-1)?.[0].attachments[0].url).toBe('blob:queued-0');
      expect(revoked).toEqual([]);
      unmount();
      expect(revoked).toContain('blob:queued-0');
    }
  );

  it('video bubble previews the queued file in the tile and the viewer, then revokes', async () => {
    fake = installOfflineSdk({ enabled: true });
    const { container, unmount } = render(
      <CometChatVideosBubble message={queuedMessage('video', video(), 'files')} alignment="right" />
    );
    const tile = await waitFor(() => {
      const t = container.querySelector('.cometchat-videos-bubble__tile[tabindex="0"]');
      expect(t).toBeTruthy();
      return t!;
    });
    fireEvent.click(tile);
    await screen.findByTestId('viewer');
    expect(viewerSpy.mock.calls.at(-1)?.[0].attachments[0].url).toBe('blob:queued-0');
    unmount();
    expect(revoked).toContain('blob:queued-0');
  });

  it('a sent message (has a URL) is unchanged and creates no object URL', () => {
    fake = installOfflineSdk({ enabled: true });
    const msg = queuedMessage('image', image(), 'files', 'https://cdn.example.com/a.jpg');
    const { container } = render(<CometChatImagesBubble message={msg} alignment="right" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.com/a.jpg');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('offline OFF: the queued file is not previewed (placeholder, no object URL)', () => {
    const { container } = render(
      <CometChatImagesBubble message={queuedMessage('image', image(), 'metadata')} alignment="right" />
    );
    expect(container.querySelector('img.cometchat-images-bubble__image')).toBeNull();
    expect(createSpy).not.toHaveBeenCalled();
    const v = render(
      <CometChatVideosBubble message={queuedMessage('video', video(), 'files')} alignment="right" />
    );
    expect(v.container.querySelector('.cometchat-videos-bubble__tile[tabindex="0"]')).toBeNull();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('after a reload (no file held) keeps the placeholder and does not crash', () => {
    fake = installOfflineSdk({ enabled: true });
    const msg = queuedMessage('image', image(), 'files');
    (msg as unknown as { files?: unknown }).files = undefined;
    const { container } = render(<CometChatImagesBubble message={msg} alignment="right" />);
    expect(container.querySelector('img.cometchat-images-bubble__image')).toBeNull();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
