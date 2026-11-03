/**
 * The public props of <CometChatOutgoingCall />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Nothing of the kit is mocked: the screen makes
 * no SDK call, and the ring tone is checked where it reaches the browser, the audio element played.
 *
 * `onError` is not claimed: the component accepts it but never calls it.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatOutgoingCall } from '../CometChatOutgoingCall';
import { buildGroup, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const DEFAULT_RING = 'https://assets.cc-cluster-2.io/uikits/static/audio/outgoingcall.wav';

// jsdom can't play audio; vitest.setup.ts stubs play/pause, and these spies record which element.
const play = vi.spyOn(HTMLMediaElement.prototype, 'play');
const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause');
const played = () => play.mock.contexts.map(audio => (audio as HTMLAudioElement).src);

const bob = buildUser({ uid: 'bob', name: 'Bob', avatar: 'https://example.com/bob.png' });
const design = buildGroup({ guid: 'design', name: 'Design', icon: 'https://example.com/design.png' });

/** The call CometChat.initiateCall returns, to a user or a group. */
function outgoing(receiver: ReturnType<typeof buildUser> | ReturnType<typeof buildGroup>, receiverType: 'user' | 'group') {
  return {
    getSessionId: () => 'session-1',
    getType: () => 'audio',
    getReceiver: () => receiver,
    getReceiverType: () => receiverType,
  } as unknown as CometChat.Call;
}

const call = outgoing(bob, 'user');

/** The ring tone starts on the tick after the screen mounts. */
const nextTick = () =>
  act(
    () =>
      new Promise<void>(resolve => {
        setTimeout(resolve, 0);
      })
  );

beforeEach(() => {
  play.mockClear();
  pause.mockClear();
});

describe('CometChatOutgoingCall props', () => {
  it("call: the screen shows who is being called, with the user's avatar or the group's icon", () => {
    covers('CometChatOutgoingCall.call', 'set');
    const { container, unmount } = render(<CometChatOutgoingCall call={call} />);
    expect(container.querySelector('.cometchat-outgoing-call__title')).toHaveTextContent('Bob');
    expect(container.querySelector('.cometchat-outgoing-call__avatar img')).toHaveAttribute('src', 'https://example.com/bob.png');
    unmount();

    const view = render(<CometChatOutgoingCall call={outgoing(design, 'group')} />);
    expect(view.container.querySelector('.cometchat-outgoing-call__title')).toHaveTextContent('Design');
    expect(view.container.querySelector('.cometchat-outgoing-call__avatar img')).toHaveAttribute(
      'src',
      'https://example.com/design.png'
    );
  });

  describe('ring tone', () => {
    it('disableSoundForCalls silences the ring tone; it rings by default', async () => {
      covers('CometChatOutgoingCall.disableSoundForCalls', 'true', 'false', 'default');
      const { unmount } = render(<CometChatOutgoingCall call={call} disableSoundForCalls />);
      await nextTick();
      expect(play).not.toHaveBeenCalled();
      unmount();

      for (const props of [{ disableSoundForCalls: false }, {}]) {
        play.mockClear();
        const view = render(<CometChatOutgoingCall call={call} {...props} />);
        await nextTick();
        expect(played()).toEqual([DEFAULT_RING]);
        expect((play.mock.contexts[0] as HTMLAudioElement).loop).toBe(true);
        view.unmount();
      }
    });

    it('customSoundForCalls is the tone that rings; by default the built-in one does', async () => {
      covers('CometChatOutgoingCall.customSoundForCalls', 'set', 'default');
      const { unmount } = render(<CometChatOutgoingCall call={call} customSoundForCalls="https://example.com/ring.mp3" />);
      await nextTick();
      expect(played()).toEqual(['https://example.com/ring.mp3']);
      unmount();

      play.mockClear();
      render(<CometChatOutgoingCall call={call} />);
      await nextTick();
      expect(played()).toEqual([DEFAULT_RING]);
    });
  });

  it('onCallCanceled fires when the end button is clicked, and the ring tone stops', async () => {
    covers('CometChatOutgoingCall.onCallCanceled', 'called');
    const onCallCanceled = vi.fn();
    render(<CometChatOutgoingCall call={call} onCallCanceled={onCallCanceled} />);
    await nextTick();
    const ringing = play.mock.contexts[0];
    expect(onCallCanceled).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'End call' }));
    expect(onCallCanceled).toHaveBeenCalledTimes(1);
    expect(onCallCanceled).toHaveBeenCalledWith();
    expect(pause.mock.contexts).toContain(ringing);
  });

  describe('views', () => {
    it("titleView replaces the receiver's name", () => {
      covers('CometChatOutgoingCall.titleView', 'custom');
      const { container } = render(<CometChatOutgoingCall call={call} titleView={<h2>Calling the Bob line</h2>} />);
      expect(screen.getByRole('heading', { name: 'Calling the Bob line' })).toBeInTheDocument();
      expect(container.querySelector('.cometchat-outgoing-call__title')).toBeNull();
      expect(screen.getByText('Outgoing Call')).toBeInTheDocument();
    });

    it('subtitleView replaces the "Outgoing Call" line', () => {
      covers('CometChatOutgoingCall.subtitleView', 'custom');
      render(<CometChatOutgoingCall call={call} subtitleView={<span>Ringing…</span>} />);
      expect(screen.getByText('Ringing…')).toBeInTheDocument();
      expect(screen.queryByText('Outgoing Call')).toBeNull();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it("avatarView replaces the receiver's avatar", () => {
      covers('CometChatOutgoingCall.avatarView', 'custom');
      const { container } = render(<CometChatOutgoingCall call={call} avatarView={<span>BOB</span>} />);
      expect(screen.getByText('BOB')).toBeInTheDocument();
      expect(container.querySelector('.cometchat-outgoing-call__avatar')).toBeNull();
      expect(container.querySelector('.cometchat-avatar')).toBeNull();
    });

    it('cancelButtonView replaces the end button', () => {
      covers('CometChatOutgoingCall.cancelButtonView', 'custom');
      render(<CometChatOutgoingCall call={call} cancelButtonView={<button type="button">Hang up</button>} />);
      expect(screen.getByRole('button', { name: 'Hang up' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'End call' })).toBeNull();
    });
  });

  it('className is added to the root; by default the root has only its own class', () => {
    covers('CometChatOutgoingCall.className', 'set', 'default');
    const { unmount } = render(<CometChatOutgoingCall call={call} className="call-sheet" />);
    expect(screen.getByRole('dialog', { name: 'Outgoing call' })).toHaveClass('cometchat-outgoing-call', 'call-sheet');
    unmount();

    render(<CometChatOutgoingCall call={call} />);
    expect(screen.getByRole('dialog', { name: 'Outgoing call' }).getAttribute('class')).toBe('cometchat-outgoing-call');
  });
});
