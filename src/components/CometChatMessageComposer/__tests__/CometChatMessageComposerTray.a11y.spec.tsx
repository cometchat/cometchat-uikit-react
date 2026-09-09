/**
 * RTL + accessibility tests for the multi-attachment staging tray
 * (CometChatMessageComposerTray).
 *
 * Covers:
 * - a circular progress overlay is shown while an item is uploading (R2.2),
 * - the remove control is present on every tile and calls removeAttachment (R1.3),
 * - a failed tile shows a retry affordance wired to retryAttachment (R2.3),
 * - a rejected tile is non-retryable and shows remove only (R2.4),
 * - remove/retry controls are keyboard-accessible with accessible names (R10 a11y).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { TrayItem, TrayState } from '../CometChatMessageComposer.types';

// Drive the tray purely through a mocked composer context.
const mockCtx: {
  tray: TrayState;
  enableMultipleAttachments: boolean;
  removeAttachment: ReturnType<typeof vi.fn>;
  retryAttachment: ReturnType<typeof vi.fn>;
} = {
  tray: { batchId: null, items: [] },
  enableMultipleAttachments: true,
  removeAttachment: vi.fn(),
  retryAttachment: vi.fn(),
};

vi.mock('../CometChatMessageComposer.context', () => ({
  useCometChatMessageComposerContext: () => mockCtx,
}));

// The fullscreen viewer is lazy-loaded; stub it so the test never mounts it.
vi.mock('../../base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy', () => ({
  default: () => <div data-testid="fullscreen-viewer" />,
}));

import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import { CometChatMessageComposerTray } from '../CometChatMessageComposerTray';

/** Build a fake SDK Attachment exposing the getters the tray reads. */
function fakeAttachment(url: string, name: string): CometChat.Attachment {
  return {
    getUrl: () => url,
    getName: () => name,
    getSize: () => 1234,
    getMimeType: () => 'image/png',
  } as unknown as CometChat.Attachment;
}

/** Build a tray item with sensible defaults for a given status/kind. */
function makeItem(overrides: Partial<TrayItem> & Pick<TrayItem, 'fileId'>): TrayItem {
  const kind = overrides.kind ?? 'image';
  const name = overrides.file?.name ?? `${overrides.fileId}.png`;
  return {
    file: new File(['x'], name, { type: 'image/png' }),
    kind,
    status: 'uploading',
    percent: 0,
    ...overrides,
  } as TrayItem;
}

function renderTray() {
  return render(
    <LocaleProvider>
      <CometChatMessageComposerTray />
    </LocaleProvider>
  );
}

describe('CometChatMessageComposerTray — RTL + accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx.tray = { batchId: null, items: [] };
    mockCtx.enableMultipleAttachments = true;
  });

  it('renders nothing when multi-attachment is disabled', () => {
    mockCtx.enableMultipleAttachments = false;
    mockCtx.tray = {
      batchId: 'b1',
      items: [makeItem({ fileId: 'f1', status: 'uploading', percent: 20 })],
    };
    const { container } = renderTray();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the tray is empty', () => {
    const { container } = renderTray();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one tile per tray item within an accessible list', () => {
    mockCtx.tray = {
      batchId: 'b1',
      items: [
        makeItem({ fileId: 'f1', status: 'success', attachment: fakeAttachment('u1', 'a.png') }),
        makeItem({ fileId: 'f2', status: 'uploading', percent: 40 }),
      ],
    };
    renderTray();
    const list = screen.getByRole('list', { name: /staged attachments/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  describe('uploading state', () => {
    it('shows a circular progress overlay driven by percent', () => {
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'f1', status: 'uploading', percent: 65 })],
      };
      renderTray();
      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveAttribute('aria-valuenow', '65');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
    });

    it('does not show a retry control while uploading', () => {
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'f1', status: 'uploading', percent: 10 })],
      };
      renderTray();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('renders an indeterminate (no aria-valuenow) spinner for a not-yet-started upload', () => {
      // percent 0 = queued / not started → indeterminate spinning ring.
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'f1', status: 'uploading', percent: 0 })],
      };
      renderTray();
      const progress = screen.getByRole('progressbar');
      expect(progress).toBeInTheDocument();
      expect(progress).not.toHaveAttribute('aria-valuenow');
      expect(progress.className).toContain('tray-progress--indeterminate');
    });

    it('renders a determinate ring (with aria-valuenow) once progress has started', () => {
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'f1', status: 'uploading', percent: 1 })],
      };
      renderTray();
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '1');
      expect(progress.className).not.toContain('tray-progress--indeterminate');
    });
  });

  describe('remove control', () => {
    it('every tile has an accessible remove button', () => {
      mockCtx.tray = {
        batchId: 'b1',
        items: [
          makeItem({ fileId: 'f1', status: 'uploading', percent: 10 }),
          makeItem({ fileId: 'f2', status: 'failed' }),
        ],
      };
      renderTray();
      expect(screen.getAllByRole('button', { name: /remove attachment/i })).toHaveLength(2);
    });

    it('clicking remove calls removeAttachment with the fileId', async () => {
      const user = userEvent.setup();
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'file-42', status: 'uploading', percent: 10 })],
      };
      renderTray();
      await user.click(screen.getByRole('button', { name: /remove attachment/i }));
      expect(mockCtx.removeAttachment).toHaveBeenCalledWith('file-42');
    });
  });

  describe('failed state (retryable)', () => {
    beforeEach(() => {
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'f-failed', status: 'failed' })],
      };
    });

    it('shows a retry affordance', () => {
      renderTray();
      expect(screen.getByRole('button', { name: /retry upload/i })).toBeInTheDocument();
    });

    it('clicking retry calls retryAttachment with the fileId', async () => {
      const user = userEvent.setup();
      renderTray();
      await user.click(screen.getByRole('button', { name: /retry upload/i }));
      expect(mockCtx.retryAttachment).toHaveBeenCalledWith('f-failed');
    });

    it('audio: retry button is not nested inside the disabled play button (regression)', async () => {
      const user = userEvent.setup();
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'f-audio', kind: 'audio', status: 'failed' })],
      };
      renderTray();

      const retryBtn = screen.getByRole('button', { name: /retry upload/i });
      // The audio play button is `disabled` while the item isn't a success, and a
      // disabled <button> swallows clicks across its whole subtree. So the retry
      // button must NOT sit inside any <button> — otherwise audio can never retry
      expect(retryBtn.parentElement?.closest('button')).toBeNull();

      await user.click(retryBtn);
      expect(mockCtx.retryAttachment).toHaveBeenCalledWith('f-audio');
    });
  });

  describe('rejected state (non-retryable)', () => {
    beforeEach(() => {
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'f-rej', status: 'rejected' })],
      };
    });

    it('shows a remove control but NO retry affordance', () => {
      renderTray();
      expect(screen.getByRole('button', { name: /remove attachment/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('exposes a rejected status with an accessible label', () => {
      renderTray();
      expect(screen.getByRole('img', { name: /upload rejected/i })).toBeInTheDocument();
    });

    it('shows the "Invalid File" tooltip for an ERR_BAD_REQUEST rejection', async () => {
      const user = userEvent.setup();
      mockCtx.tray = {
        batchId: 'b1',
        items: [
          makeItem({
            fileId: 'f-rej',
            status: 'rejected',
            error: { code: 'ERR_BAD_REQUEST', message: 'Bad request' },
          }),
        ],
      };
      const { container } = renderTray();
      const tile = container.querySelector('[data-file-id="f-rej"]')!;
      await user.hover(tile);
      expect(await screen.findByText('Invalid File')).toBeInTheDocument();
    });

    it('falls back to the error message for an unrecognized rejection code', async () => {
      const user = userEvent.setup();
      mockCtx.tray = {
        batchId: 'b1',
        items: [
          makeItem({
            fileId: 'f-rej',
            status: 'rejected',
            error: { code: 'ERR_SOMETHING_ELSE', message: 'Upload blocked by policy' },
          }),
        ],
      };
      const { container } = renderTray();
      const tile = container.querySelector('[data-file-id="f-rej"]')!;
      await user.hover(tile);
      expect(await screen.findByText('Upload blocked by policy')).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    it('remove and retry controls are reachable and operable via the keyboard', async () => {
      const user = userEvent.setup();
      mockCtx.tray = {
        batchId: 'b1',
        items: [makeItem({ fileId: 'f-failed', status: 'failed' })],
      };
      renderTray();

      const retryBtn = screen.getByRole('button', { name: /retry upload/i });
      retryBtn.focus();
      expect(retryBtn).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(mockCtx.retryAttachment).toHaveBeenCalledWith('f-failed');

      const removeBtn = screen.getByRole('button', { name: /remove attachment/i });
      removeBtn.focus();
      expect(removeBtn).toHaveFocus();
      await user.keyboard(' ');
      expect(mockCtx.removeAttachment).toHaveBeenCalledWith('f-failed');
    });

    it('all rendered buttons have accessible names', () => {
      mockCtx.tray = {
        batchId: 'b1',
        items: [
          makeItem({ fileId: 'f1', status: 'failed' }),
          makeItem({ fileId: 'f2', status: 'rejected' }),
        ],
      };
      renderTray();
      screen.getAllByRole('button').forEach(button => {
        const hasName =
          button.hasAttribute('aria-label') ||
          button.textContent !== '' ||
          button.hasAttribute('aria-labelledby');
        expect(hasName).toBe(true);
      });
    });
  });

  describe('success media tile — fullscreen open', () => {
    it('a successful image tile is keyboard-openable and opens the fullscreen viewer', async () => {
      const user = userEvent.setup();
      mockCtx.tray = {
        batchId: 'b1',
        items: [
          makeItem({
            fileId: 'f1',
            kind: 'image',
            status: 'success',
            attachment: fakeAttachment('https://img/1.png', 'a.png'),
          }),
        ],
      };
      renderTray();
      const openBtn = screen.getByRole('button', { name: /open in fullscreen/i });
      openBtn.focus();
      await user.keyboard('{Enter}');
      expect(await screen.findByTestId('fullscreen-viewer')).toBeInTheDocument();
    });

    it('falls back to a blank tile (no broken-image glyph) when a corrupted image fails to load', () => {
      mockCtx.tray = {
        batchId: 'b1',
        items: [
          makeItem({
            fileId: 'f-img',
            kind: 'image',
            status: 'success',
            previewUrl: 'blob:corrupted',
            attachment: fakeAttachment('https://img/x.png', 'x.png'),
          }),
        ],
      };
      const { container } = renderTray();
      const img = container.querySelector('.cometchat-message-composer__tray-thumbnail-img')!;
      fireEvent.error(img);
      // The broken <img> is removed and the tile switches to the blank background.
      expect(container.querySelector('.cometchat-message-composer__tray-thumbnail-img')).toBeNull();
      expect(
        container.querySelector('.cometchat-message-composer__tray-thumbnail--blank')
      ).toBeTruthy();
    });
  });
});
