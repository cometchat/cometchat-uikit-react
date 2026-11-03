/**
 * The public props of <CometChatFilesBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. The caption is drawn by the real text bubble.
 * Only the SDK is touched: the logged-in user, which decides the side of a bubble rendered without
 * `alignment`, comes from CometChat.getLoggedinUser().
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatFilesBubble } from '../CometChatFilesBubble';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';
import pdfIcon from '../../../assets/file_type_pdf.svg';
import sheetIcon from '../../../assets/file_type_xlsx.svg';

const me = buildUser({ uid: 'me', name: 'Me' }) as unknown as CometChat.User;
let signedIn: Promise<CometChat.User>;

beforeEach(() => {
  signedIn = Promise.resolve(me);
  vi.spyOn(CometChat, 'getLoggedinUser').mockReturnValue(signedIn);
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface FilesOptions {
  from?: string;
  caption?: string;
  files?: { name: string; url: string; size: number }[];
}

const pdf = { name: 'report.pdf', url: 'https://cdn.example.com/f/report.pdf', size: 204800 };

function files({ from = 'them', caption = '', files: list = [pdf] }: FilesOptions = {}) {
  const sender = buildUser({ uid: from, name: from });
  return {
    ...buildMediaMessage({ type: 'file', sender }),
    getSender: () => sender,
    getAttachments: () =>
      list.map(f => ({
        getUrl: () => f.url,
        getName: () => f.name,
        getSize: () => f.size,
        getExtension: () => f.name.split('.').pop() ?? '',
        getMimeType: () => 'application/octet-stream',
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

const bubbles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.cometchat-files-bubble'));
const captionOf = (bubble: HTMLElement | undefined) => bubble?.querySelector('.cometchat-files-bubble__caption .cometchat-text-bubble');
const captionText = (container: HTMLElement) =>
  container.querySelector('.cometchat-files-bubble__caption .cometchat-text-bubble__text')?.textContent;

class Shout extends CometChatTextFormatter {
  readonly id = 'shout';
  override customLogicToFormatText(text: string) {
    return text.toUpperCase();
  }
}

describe('CometChatFilesBubble props', () => {
  it("message is what's listed: a card per file with its name, type, size and download, then the caption", async () => {
    covers('CometChatFilesBubble.message', 'set');
    const sheet = { name: 'budget.xlsx', url: 'https://cdn.example.com/f/budget.xlsx', size: 1048576 };
    const { container } = await show(<CometChatFilesBubble message={files({ files: [pdf, sheet], caption: 'Q3 numbers' })} />);

    const cards = Array.from(container.querySelectorAll('.cometchat-files-bubble__card'));
    expect(cards.map(card => card.querySelector('.cometchat-files-bubble__card-name')?.textContent)).toEqual(['report.pdf', 'budget.xlsx']);
    expect(cards.map(card => card.querySelector('.cometchat-files-bubble__card-meta')?.textContent)).toEqual(['PDF · 200 KB', 'XLSX · 1.0 MB']);
    expect(cards.map(card => card.querySelector('img')?.getAttribute('src'))).toEqual([pdfIcon, sheetIcon]);
    expect(screen.getByRole('button', { name: 'Download report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download budget.xlsx' })).toBeInTheDocument();
    expect(captionText(container)).toBe('Q3 numbers');
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatFilesBubble.className', 'set', 'default');
    let view = await show(<CometChatFilesBubble message={files()} className="app-files" />);
    expect(bubbles(view.container)[0]).toHaveClass('app-files', 'cometchat-files-bubble', 'cometchat-files-bubble--incoming');
    view.unmount();

    view = await show(<CometChatFilesBubble message={files()} />);
    expect(bubbles(view.container)[0]?.className).toBe('cometchat-files-bubble cometchat-files-bubble--incoming');
  });

  it('textFormatters rewrite the caption; by default it reads exactly as sent', async () => {
    covers('CometChatFilesBubble.textFormatters', 'set', 'default');
    const caption = 'See **page 2**: https://example.com/report';
    let view = await show(<CometChatFilesBubble message={files({ caption })} textFormatters={[new Shout()]} />);
    expect(captionText(view.container)).toBe('SEE **PAGE 2**: HTTPS://EXAMPLE.COM/REPORT');
    view.unmount();

    // No formatter runs by default: no bold, no link.
    view = await show(<CometChatFilesBubble message={files({ caption })} />);
    expect(captionText(view.container)).toBe(caption);
    expect(view.container.querySelector('.cometchat-files-bubble__caption strong, .cometchat-files-bubble__caption a')).toBeNull();
  });

  describe('alignment', () => {
    it('by default my files are outgoing and everyone else’s incoming, captions too', async () => {
      covers('CometChatFilesBubble.alignment', 'default');
      const { container } = await show(
        <>
          <CometChatFilesBubble message={files({ from: 'me', caption: 'mine' })} />
          <CometChatFilesBubble message={files({ from: 'them', caption: 'theirs' })} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      expect(mine).toHaveClass('cometchat-files-bubble--outgoing');
      expect(captionOf(mine)).toHaveClass('cometchat-text-bubble--outgoing');
      expect(theirs).toHaveClass('cometchat-files-bubble--incoming');
      expect(captionOf(theirs)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"left" makes even my own files incoming', async () => {
      covers('CometChatFilesBubble.alignment', 'left');
      const { container } = await show(
        <>
          <CometChatFilesBubble message={files({ from: 'me', caption: 'mine' })} />
          <CometChatFilesBubble message={files({ from: 'me', caption: 'mine' })} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      expect(derived).toHaveClass('cometchat-files-bubble--outgoing');
      expect(left).toHaveClass('cometchat-files-bubble--incoming');
      expect(left).not.toHaveClass('cometchat-files-bubble--outgoing');
      expect(captionOf(left)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"right" makes someone else’s files outgoing', async () => {
      covers('CometChatFilesBubble.alignment', 'right');
      const { container } = await show(
        <>
          <CometChatFilesBubble message={files({ from: 'them', caption: 'theirs' })} />
          <CometChatFilesBubble message={files({ from: 'them', caption: 'theirs' })} alignment="right" />
        </>
      );
      const [derived, right] = bubbles(container);
      expect(derived).toHaveClass('cometchat-files-bubble--incoming');
      expect(right).toHaveClass('cometchat-files-bubble--outgoing');
      expect(right).not.toHaveClass('cometchat-files-bubble--incoming');
      expect(captionOf(right)).toHaveClass('cometchat-text-bubble--outgoing');
    });
  });
});
