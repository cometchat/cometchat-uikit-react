/* eslint-disable @typescript-eslint/no-deprecated -- this file intentionally exercises the deprecated legacy bubble it covers */
/**
 * The public props of <CometChatFileBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. The caption is drawn by the real text bubble.
 * Only the SDK is touched: the logged-in user, which decides the side of a bubble rendered without
 * `alignment`, comes from CometChat.getLoggedinUser().
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatFileBubble } from '../CometChatFileBubble';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';
import pdfIcon from '../../../assets/file_type_pdf.png';

const me = buildUser({ uid: 'me', name: 'Me' }) as unknown as CometChat.User;
let signedIn: Promise<CometChat.User>;

beforeEach(() => {
  signedIn = Promise.resolve(me);
  vi.spyOn(CometChat, 'getLoggedinUser').mockReturnValue(signedIn);
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface FileOptions {
  from?: string;
  caption?: string;
  files?: { name: string; url: string; size: number; extension: string; mimeType: string }[];
}

const pdf = { name: 'report.pdf', url: 'https://cdn.example.com/f/report.pdf', size: 2457600, extension: 'pdf', mimeType: 'application/pdf' };

function file({ from = 'them', caption = '', files = [pdf] }: FileOptions = {}) {
  const sender = buildUser({ uid: from, name: from });
  return {
    ...buildMediaMessage({ type: 'file', sender }),
    getSender: () => sender,
    getAttachments: () =>
      files.map(f => ({
        getUrl: () => f.url,
        getName: () => f.name,
        getSize: () => f.size,
        getExtension: () => f.extension,
        getMimeType: () => f.mimeType,
      })),
    getCaption: () => caption,
    getData: () => ({ text: caption }),
  } as unknown as CometChat.MediaMessage;
}

/** Renders, then lets the logged-in user (an SDK promise) reach the bubbles. */
async function show(ui: React.ReactElement) {
  const view = render(ui);
  await act(() => signedIn);
  return view;
}

const bubbles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.cometchat-file-bubble'));
const captionOf = (bubble: HTMLElement | undefined) => bubble?.querySelector('.cometchat-file-bubble__caption .cometchat-text-bubble');
const captionText = (container: HTMLElement) =>
  container.querySelector('.cometchat-file-bubble__caption .cometchat-text-bubble__text')?.textContent;

class Shout extends CometChatTextFormatter {
  readonly id = 'shout';
  override customLogicToFormatText(text: string) {
    return text.toUpperCase();
  }
}

describe('CometChatFileBubble props', () => {
  it("message is the file shown: its first attachment's name, size, icon and download, then the caption", async () => {
    covers('CometChatFileBubble.message', 'set');
    const sheet = { name: 'budget.xlsx', url: 'https://cdn.example.com/f/budget.xlsx', size: 1536, extension: 'xlsx', mimeType: 'application/vnd.ms-excel' };
    const { container } = await show(<CometChatFileBubble message={file({ files: [pdf, sheet], caption: 'Q3 numbers' })} />);

    const items = container.querySelectorAll('.cometchat-file-bubble__file-item');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveAttribute('aria-label', 'report.pdf, 2.34 MB');
    expect(items[0]?.querySelector('.cometchat-file-bubble__filename')).toHaveTextContent('report.pdf');
    expect(items[0]?.querySelector('.cometchat-file-bubble__filesize')).toHaveTextContent('2.34 MB');
    expect(items[0]?.querySelector('img')).toHaveAttribute('src', pdfIcon);
    expect(screen.getByRole('button', { name: 'Download report.pdf' })).toBeInTheDocument();
    expect(screen.queryByText('budget.xlsx')).toBeNull();
    expect(captionText(container)).toBe('Q3 numbers');
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatFileBubble.className', 'set', 'default');
    let view = await show(<CometChatFileBubble message={file()} className="app-file" />);
    expect(bubbles(view.container)[0]).toHaveClass('app-file', 'cometchat-file-bubble', 'cometchat-file-bubble--receiver');
    view.unmount();

    view = await show(<CometChatFileBubble message={file()} />);
    expect(bubbles(view.container)[0]?.className).toBe('cometchat-file-bubble cometchat-file-bubble--receiver');
  });

  it('textFormatters rewrite the caption; by default it reads exactly as sent', async () => {
    covers('CometChatFileBubble.textFormatters', 'set', 'default');
    const caption = 'See **page 2**: https://example.com/report';
    let view = await show(<CometChatFileBubble message={file({ caption })} textFormatters={[new Shout()]} />);
    expect(captionText(view.container)).toBe('SEE **PAGE 2**: HTTPS://EXAMPLE.COM/REPORT');
    view.unmount();

    // No formatter runs by default: no bold, no link.
    view = await show(<CometChatFileBubble message={file({ caption })} />);
    expect(captionText(view.container)).toBe(caption);
    expect(view.container.querySelector('.cometchat-file-bubble__caption strong, .cometchat-file-bubble__caption a')).toBeNull();
  });

  describe('alignment', () => {
    it('by default my files are on the sender side and everyone else’s on the receiver side, captions too', async () => {
      covers('CometChatFileBubble.alignment', 'default');
      const { container } = await show(
        <>
          <CometChatFileBubble message={file({ from: 'me', caption: 'mine' })} />
          <CometChatFileBubble message={file({ from: 'them', caption: 'theirs' })} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      expect(mine).toHaveClass('cometchat-file-bubble--sender');
      expect(captionOf(mine)).toHaveClass('cometchat-text-bubble--outgoing');
      expect(theirs).toHaveClass('cometchat-file-bubble--receiver');
      expect(captionOf(theirs)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"left" puts even my own file on the receiver side', async () => {
      covers('CometChatFileBubble.alignment', 'left');
      const { container } = await show(
        <>
          <CometChatFileBubble message={file({ from: 'me', caption: 'mine' })} />
          <CometChatFileBubble message={file({ from: 'me', caption: 'mine' })} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      expect(derived).toHaveClass('cometchat-file-bubble--sender');
      expect(left).toHaveClass('cometchat-file-bubble--receiver');
      expect(left).not.toHaveClass('cometchat-file-bubble--sender');
      expect(captionOf(left)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"right" puts someone else’s file on the sender side', async () => {
      covers('CometChatFileBubble.alignment', 'right');
      const { container } = await show(
        <>
          <CometChatFileBubble message={file({ from: 'them', caption: 'theirs' })} />
          <CometChatFileBubble message={file({ from: 'them', caption: 'theirs' })} alignment="right" />
        </>
      );
      const [derived, right] = bubbles(container);
      expect(derived).toHaveClass('cometchat-file-bubble--receiver');
      expect(right).toHaveClass('cometchat-file-bubble--sender');
      expect(right).not.toHaveClass('cometchat-file-bubble--receiver');
      expect(captionOf(right)).toHaveClass('cometchat-text-bubble--outgoing');
    });
  });
});
