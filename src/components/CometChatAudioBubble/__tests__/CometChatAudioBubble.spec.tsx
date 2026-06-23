import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudioBubble } from '../CometChatAudioBubble';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';

vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

// Logged-in user resolves to the message sender so the default alignment is "outgoing".
vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => buildUser({ uid: 'me', name: 'Me' }),
}));

// Mock WaveSurfer to avoid actual audio processing in tests
vi.mock('../wavesurfer', () => ({
  WaveSurfer: {
    create: () => ({
      on: vi.fn(),
      load: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      seekTo: vi.fn(),
      destroy: vi.fn(),
      unAll: vi.fn(),
    }),
  },
}));

// Mock downloadWithProgress
vi.mock('../../../utils/downloadWithProgress', () => ({
  downloadWithProgress: vi.fn(() => Promise.resolve()),
}));

// Mock CometChatTextBubble
vi.mock('../../CometChatTextBubble/CometChatTextBubble', () => ({
  CometChatTextBubble: ({ text }: { text: string }) => (
    <span data-testid="text-bubble">{text}</span>
  ),
}));

/**
 * Build an audio MediaMessage with N attachments and an optional caption.
 * The bubble self-extracts these via getAttachments()/getCaption().
 */
function buildAudioMessage(
  options: {
    attachmentCount?: number;
    caption?: string;
    senderUid?: string;
  } = {}
): CometChat.MediaMessage {
  const count = options.attachmentCount ?? 1;
  const sender = buildUser({ uid: options.senderUid ?? 'me', name: 'Me' });
  const attachments = Array.from({ length: count }, (_, i) => ({
    name: `audio-${String(i)}.mp3`,
    url: `https://example.com/audio-${String(i)}.mp3`,
    mimeType: 'audio/mpeg',
    extension: 'mp3',
    size: 1048576,
  }));

  const base = buildMediaMessage({ type: 'audio', sender });
  return {
    ...base,
    getSender: () => sender,
    getAttachments: () => attachments,
    getCaption: () => options.caption ?? '',
    getData: () => ({ text: options.caption ?? '' }),
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatAudioBubble', () => {
  it('renders the component with base class', () => {
    const { container } = render(<CometChatAudioBubble message={buildAudioMessage()} />);
    expect(container.firstChild).toHaveClass('cometchat-audio-bubble');
  });

  it('applies sender class for outgoing alignment', () => {
    const { container } = render(
      <CometChatAudioBubble message={buildAudioMessage()} alignment="right" />
    );
    expect(container.firstChild).toHaveClass('cometchat-audio-bubble--sender');
  });

  it('applies receiver class for incoming alignment', () => {
    const { container } = render(
      <CometChatAudioBubble message={buildAudioMessage()} alignment="left" />
    );
    expect(container.firstChild).toHaveClass('cometchat-audio-bubble--receiver');
  });

  it('derives outgoing alignment when sender is the logged-in user', () => {
    const { container } = render(
      <CometChatAudioBubble message={buildAudioMessage({ senderUid: 'me' })} />
    );
    expect(container.firstChild).toHaveClass('cometchat-audio-bubble--sender');
  });

  it('derives incoming alignment when sender is another user', () => {
    const { container } = render(
      <CometChatAudioBubble message={buildAudioMessage({ senderUid: 'other' })} />
    );
    expect(container.firstChild).toHaveClass('cometchat-audio-bubble--receiver');
  });

  it('renders play button for each audio item', () => {
    render(<CometChatAudioBubble message={buildAudioMessage()} />);
    const buttons = screen.getAllByRole('button');
    // At least play + download buttons
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders caption when provided', () => {
    render(<CometChatAudioBubble message={buildAudioMessage({ caption: 'Listen to this' })} />);
    expect(screen.getByTestId('text-bubble')).toHaveTextContent('Listen to this');
  });

  it('does not render caption when not provided', () => {
    render(<CometChatAudioBubble message={buildAudioMessage()} />);
    expect(screen.queryByTestId('text-bubble')).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatAudioBubble message={buildAudioMessage()} className="custom" />
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('shows "Show more" when more than 3 attachments', () => {
    render(<CometChatAudioBubble message={buildAudioMessage({ attachmentCount: 5 })} />);
    expect(screen.getByText(/Show more/)).toBeInTheDocument();
  });

  it('does not show "Show more" for 3 or fewer attachments', () => {
    render(<CometChatAudioBubble message={buildAudioMessage({ attachmentCount: 1 })} />);
    expect(screen.queryByText(/Show more/)).toBeNull();
  });

  it('renders only 3 items when collapsed with more than 3 attachments', () => {
    const { container } = render(
      <CometChatAudioBubble message={buildAudioMessage({ attachmentCount: 5 })} />
    );
    const items = container.querySelectorAll('.cometchat-audio-bubble__audio-item');
    expect(items.length).toBe(3);
  });
});
