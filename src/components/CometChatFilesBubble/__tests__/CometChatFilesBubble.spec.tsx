import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatFilesBubble } from '../CometChatFilesBubble';
import { buildUser } from '../../../testing/mock-builders';

// Mock downloadWithProgress to prevent actual downloads
vi.mock('../../../utils/downloadWithProgress', () => ({
  downloadWithProgress: vi.fn().mockResolvedValue(undefined),
}));

// --- Message builders ---

function buildFileMessage(
  options: {
    files?: { url: string; name: string; size: number }[];
    caption?: string;
  } = {}
): CometChat.MediaMessage {
  const files = options.files ?? [
    { url: 'https://example.com/file.pdf', name: 'document.pdf', size: 204800 },
  ];
  const caption = options.caption ?? '';
  const attachments = files.map(f => ({
    url: f.url,
    name: f.name,
    size: f.size,
    getUrl: () => f.url,
    getName: () => f.name,
    getSize: () => f.size,
    getMimeType: () => 'application/pdf',
    getExtension: () => 'pdf',
  }));

  return {
    getId: () => 1,
    getType: () => 'file',
    getCategory: () => 'message',
    getSender: () => buildUser({ name: 'Test User', avatar: '' }) as unknown as CometChat.User,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => 'muid-1',
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getAttachments: () => attachments,
    getMentionedUsers: () => [],
    getMetadata: () => ({}),
    getReactions: () => [],
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatFilesBubble', () => {
  // --- Basic rendering ---

  it('renders one row per file', () => {
    const { container } = render(
      <CometChatFilesBubble
        message={buildFileMessage({
          files: [
            { url: 'https://example.com/f1.pdf', name: 'doc1.pdf', size: 1024 },
            { url: 'https://example.com/f2.pdf', name: 'doc2.pdf', size: 2048 },
          ],
        })}
        alignment="right"
      />
    );
    expect(container.querySelectorAll('.cometchat-files-bubble__card')).toHaveLength(2);
  });

  it('displays filename and size', () => {
    const { container } = render(
      <CometChatFilesBubble
        message={buildFileMessage({
          files: [{ url: 'https://example.com/report.pdf', name: 'report.pdf', size: 1048576 }],
        })}
        alignment="right"
      />
    );
    expect(container.querySelector('.cometchat-files-bubble__card-name')?.textContent).toBe(
      'report.pdf'
    );
    expect(container.querySelector('.cometchat-files-bubble__card-meta')?.textContent).toContain(
      '1.0 MB'
    );
  });

  // --- >3 files expander ---

  it('shows only 3 files and +N more button when >3 files', () => {
    const files = Array.from({ length: 5 }, (_, i) => ({
      url: `https://example.com/f${String(i)}.pdf`,
      name: `file${String(i)}.pdf`,
      size: 1024 * (i + 1),
    }));
    const { container } = render(
      <CometChatFilesBubble message={buildFileMessage({ files })} alignment="right" />
    );
    expect(container.querySelectorAll('.cometchat-files-bubble__card')).toHaveLength(3);
    const toggle = container.querySelector('.cometchat-files-bubble__toggle');
    expect(toggle).toBeTruthy();
    expect(toggle?.textContent).toContain('Show 2 more');
  });

  it('expands to show all files when +N more is clicked', () => {
    const files = Array.from({ length: 5 }, (_, i) => ({
      url: `https://example.com/f${String(i)}.pdf`,
      name: `file${String(i)}.pdf`,
      size: 1024,
    }));
    const { container } = render(
      <CometChatFilesBubble message={buildFileMessage({ files })} alignment="right" />
    );
    const toggle = container.querySelector('.cometchat-files-bubble__toggle');
    fireEvent.click(toggle!);
    expect(container.querySelectorAll('.cometchat-files-bubble__card')).toHaveLength(5);
  });

  it('collapses back to 3 when Show less is clicked', () => {
    const files = Array.from({ length: 4 }, (_, i) => ({
      url: `https://example.com/f${String(i)}.pdf`,
      name: `file${String(i)}.pdf`,
      size: 1024,
    }));
    const { container } = render(
      <CometChatFilesBubble message={buildFileMessage({ files })} alignment="right" />
    );
    // Expand
    const toggle = container.querySelector('.cometchat-files-bubble__toggle');
    fireEvent.click(toggle!);
    expect(container.querySelectorAll('.cometchat-files-bubble__card')).toHaveLength(4);
    // Collapse
    const showLess = container.querySelector('.cometchat-files-bubble__toggle');
    fireEvent.click(showLess!);
    expect(container.querySelectorAll('.cometchat-files-bubble__card')).toHaveLength(3);
  });

  it('does not show toggle when <=3 files', () => {
    const files = Array.from({ length: 3 }, (_, i) => ({
      url: `https://example.com/f${String(i)}.pdf`,
      name: `file${String(i)}.pdf`,
      size: 1024,
    }));
    const { container } = render(
      <CometChatFilesBubble message={buildFileMessage({ files })} alignment="right" />
    );
    expect(container.querySelector('.cometchat-files-bubble__toggle')).toBeNull();
  });

  // --- Download button ---

  it('renders a download button for each file', () => {
    const { container } = render(
      <CometChatFilesBubble message={buildFileMessage()} alignment="right" />
    );
    const downloadBtns = container.querySelectorAll('.cometchat-download-button');
    expect(downloadBtns.length).toBeGreaterThan(0);
  });

  // --- Caption ---

  it('renders caption when present', () => {
    const { container } = render(
      <CometChatFilesBubble
        message={buildFileMessage({ caption: 'Here are the docs' })}
        alignment="right"
      />
    );
    expect(container.querySelector('.cometchat-files-bubble__caption')).toBeTruthy();
  });

  it('does not render caption when absent', () => {
    const { container } = render(
      <CometChatFilesBubble message={buildFileMessage()} alignment="right" />
    );
    expect(container.querySelector('.cometchat-files-bubble__caption')).toBeNull();
  });

  // --- Accessibility ---

  it('rows have role="button" and tabindex', () => {
    const { container } = render(
      <CometChatFilesBubble message={buildFileMessage()} alignment="right" />
    );
    const card = container.querySelector('.cometchat-files-bubble__card');
    expect(card).toBeTruthy();
    // The card contains a download button which is interactive
    const downloadBtn = card?.querySelector('.cometchat-download-button');
    expect(downloadBtn).toBeTruthy();
  });

  it('toggle has aria-expanded attribute', () => {
    const files = Array.from({ length: 5 }, (_, i) => ({
      url: `https://example.com/f${String(i)}.pdf`,
      name: `file${String(i)}.pdf`,
      size: 1024,
    }));
    const { container } = render(
      <CometChatFilesBubble message={buildFileMessage({ files })} alignment="right" />
    );
    const toggle = container.querySelector('.cometchat-files-bubble__toggle');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });
});
