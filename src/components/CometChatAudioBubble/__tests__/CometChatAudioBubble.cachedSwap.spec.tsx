/**
 * Offline ON, media caching AUTO: the bubble first loads the remote URL, then the SDK's cached copy
 * (an object URL) replaces it and the player is rebuilt. Destroying the first player makes its
 * pending load() reject with an AbortError; that failure must not mark the new player as failed
 * (live testing BUG-8: "Failed to load audio" on every cached voice note after a reload).
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudioBubble } from '../CometChatAudioBubble';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';

vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key, language: 'en-us' }),
}));
vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => buildUser({ uid: 'me', name: 'Me' }),
}));
vi.mock('../../CometChatTextBubble/CometChatTextBubble', () => ({
  CometChatTextBubble: () => null,
}));

interface FakePlayer {
  url: string;
  handlers: Map<string, (...args: unknown[]) => void>;
  resolveLoad: () => void;
  rejectLoad: (error: Error) => void;
  destroy: ReturnType<typeof vi.fn>;
}

const { players, cached } = vi.hoisted(() => ({
  players: [] as FakePlayer[],
  /** The object URL the "SDK cache" hands back; null = not cached (yet). */
  cached: { url: null as string | null },
}));

vi.mock('../wavesurfer', () => ({
  WaveSurfer: {
    create: () => {
      const handlers = new Map<string, (...args: unknown[]) => void>();
      const player = { handlers } as FakePlayer;
      players.push(player);
      return {
        on: (event: string, cb: (...args: unknown[]) => void) => handlers.set(event, cb),
        unAll: () => {
          handlers.clear();
        },
        load: (url: string) =>
          new Promise<void>((resolve, reject) => {
            player.url = url;
            player.resolveLoad = resolve;
            player.rejectLoad = reject;
          }),
        destroy: (player.destroy = vi.fn()),
        pause: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn(),
        seekTo: vi.fn(),
      };
    },
  },
}));

// The offline media hook, reduced to its effect on the bubble: the cached copy's URL once it exists.
vi.mock('../../../utils/offline/media', () => ({
  useCachedMedia: <T extends { url: string }>(attachments: T[]) => ({
    attachments: cached.url ? attachments.map(a => ({ ...a, url: cached.url })) : attachments,
    unavailable: false,
    download: () => undefined,
  }),
}));

function voiceNote(): CometChat.MediaMessage {
  const sender = buildUser({ uid: 'me', name: 'Me' });
  const attachments = [
    {
      name: 'voice-recording.wav',
      url: 'https://media.example.com/voice-recording.wav',
      mimeType: 'audio/wav',
      extension: 'wav',
      size: 472364,
    },
  ];
  return {
    ...buildMediaMessage({ type: 'audio', sender }),
    getSender: () => sender,
    getAttachments: () => attachments,
    getCaption: () => '',
    getData: () => ({ text: '' }),
  } as unknown as CometChat.MediaMessage;
}

function abortError(): Error {
  const error = new Error('The user aborted a request.');
  error.name = 'AbortError';
  return error;
}

describe('CometChatAudioBubble: the cached copy replaces the player', () => {
  beforeEach(() => {
    players.length = 0;
    cached.url = null;
  });

  it("ignores the replaced player's aborted load: the voice note becomes playable", async () => {
    const message = voiceNote();
    const { rerender } = render(<CometChatAudioBubble message={message} />);
    const remote = players.at(-1)!;
    expect(remote.url).toBe('https://media.example.com/voice-recording.wav');

    // The SDK's cached copy arrives: the bubble rebuilds the player on the object URL.
    cached.url = 'blob:http://localhost/cached-voice';
    rerender(<CometChatAudioBubble message={message} />);
    const local = players.at(-1)!;
    expect(local).not.toBe(remote);
    expect(local.url).toBe('blob:http://localhost/cached-voice');
    expect(remote.destroy).toHaveBeenCalled();

    // The destroyed player's fetch was aborted: its load() rejects after the new player started.
    await act(async () => {
      remote.rejectLoad(abortError());
      await Promise.resolve();
    });
    expect(screen.queryByText('Failed to load audio')).toBeNull();

    await act(async () => {
      local.handlers.get('ready')?.(14.76);
      local.resolveLoad();
      await Promise.resolve();
    });
    expect(screen.queryByText('Failed to load audio')).toBeNull();
    expect(screen.getByText('0:00 / 0:14')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'accessibility_play_audio' })).toBeEnabled();
  });

  it('offline: the remote load failed before the cached copy arrived, the cached copy still plays', async () => {
    const message = voiceNote();
    const { rerender } = render(<CometChatAudioBubble message={message} />);
    const remote = players.at(-1)!;

    // No network: the remote fetch fails at once, before the SDK's cache lookup resolves.
    await act(async () => {
      remote.rejectLoad(new TypeError('Failed to fetch'));
      await Promise.resolve();
    });
    expect(screen.getByText('Failed to load audio')).toBeInTheDocument();

    cached.url = 'blob:http://localhost/cached-voice';
    rerender(<CometChatAudioBubble message={message} />);
    const local = players.at(-1)!;
    expect(local).not.toBe(remote);
    expect(local.url).toBe('blob:http://localhost/cached-voice');

    await act(async () => {
      local.handlers.get('ready')?.(14.76);
      local.resolveLoad();
      await Promise.resolve();
    });
    expect(screen.queryByText('Failed to load audio')).toBeNull();
    expect(screen.getByText('0:00 / 0:14')).toBeInTheDocument();
  });

  it('still shows the error when the player on screen fails to load', async () => {
    cached.url = 'blob:http://localhost/revoked';
    render(<CometChatAudioBubble message={voiceNote()} />);
    const shown = players.at(-1)!;

    await act(async () => {
      shown.rejectLoad(new Error('Failed to fetch'));
      await Promise.resolve();
    });
    expect(screen.getByText('Failed to load audio')).toBeInTheDocument();
  });
});
