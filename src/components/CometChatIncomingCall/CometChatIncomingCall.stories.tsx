/**
 * CometChatIncomingCall Storybook Stories
 *
 * Static visual previews of the incoming call notification using the
 * component's actual CSS classes. Since the real component manages visibility
 * via SDK listeners (which aren't available in Storybook), these stories
 * render the UI structure directly.
 *
 * @module components/CometChatIncomingCall
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatIncomingCall } from './CometChatIncomingCall';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import './CometChatIncomingCall.css';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<typeof CometChatIncomingCall> = {
  title: 'Components/Calls/CometChat Incoming Call',
  component: CometChatIncomingCall,
  tags: ['autodocs'],
  args: {
    disableSoundForCalls: true,
  },
  argTypes: {
    disableSoundForCalls: {
      control: 'boolean',
      description: 'Disable the ringtone sound when an incoming call is received.',
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays an incoming call notification with accept/reject actions. The component listens for SDK call events and auto-shows when a call comes in.',
      },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100vh',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

// ============================================
// Stories
// ============================================

/** Default — incoming audio call with caller details. */
export const Default = () => (
  <div
    className="cometchat-incoming-call"
    style={{ position: 'relative', top: 'auto', left: 'auto' }}
    role="alertdialog"
    aria-label="Incoming Voice call from Alice Johnson"
  >
    <div className="cometchat-incoming-call__info">
      <div className="cometchat-incoming-call__avatar">
        <CometChatAvatar.Root name="Alice Johnson" image="/avatars/nancy-grace.png" size="medium">
          <CometChatAvatar.Image />
          <CometChatAvatar.Initials />
        </CometChatAvatar.Root>
      </div>
      <div className="cometchat-incoming-call__details">
        <div className="cometchat-incoming-call__title">Alice Johnson</div>
        <div className="cometchat-incoming-call__subtitle">Incoming Voice Call</div>
      </div>
    </div>
    <div className="cometchat-incoming-call__button-group">
      <button
        type="button"
        className="cometchat-incoming-call__button-decline"
        onClick={() => console.log('Declined')}
      >
        Decline
      </button>
      <button
        type="button"
        className="cometchat-incoming-call__button-accept"
        onClick={() => console.log('Accepted')}
      >
        Accept
      </button>
    </div>
  </div>
);

/** Incoming video call notification. */
export const VideoCall = () => (
  <div
    className="cometchat-incoming-call"
    style={{ position: 'relative', top: 'auto', left: 'auto' }}
    role="alertdialog"
    aria-label="Incoming Video call from Bob Smith"
  >
    <div className="cometchat-incoming-call__info">
      <div className="cometchat-incoming-call__avatar">
        <CometChatAvatar.Root name="Bob Smith" image="/avatars/george-alan.png" size="medium">
          <CometChatAvatar.Image />
          <CometChatAvatar.Initials />
        </CometChatAvatar.Root>
      </div>
      <div className="cometchat-incoming-call__details">
        <div className="cometchat-incoming-call__title">Bob Smith</div>
        <div className="cometchat-incoming-call__subtitle">Incoming Video Call</div>
      </div>
    </div>
    <div className="cometchat-incoming-call__button-group">
      <button
        type="button"
        className="cometchat-incoming-call__button-decline"
        onClick={() => console.log('Declined')}
      >
        Decline
      </button>
      <button
        type="button"
        className="cometchat-incoming-call__button-accept"
        onClick={() => console.log('Accepted')}
      >
        Accept
      </button>
    </div>
  </div>
);

/** Audio call with a different caller. */
export const AudioCallAlternate = () => (
  <div
    className="cometchat-incoming-call"
    style={{ position: 'relative', top: 'auto', left: 'auto' }}
    role="alertdialog"
    aria-label="Incoming Voice call from Charlie Brown"
  >
    <div className="cometchat-incoming-call__info">
      <div className="cometchat-incoming-call__avatar">
        <CometChatAvatar.Root name="Charlie Brown" image="/avatars/andrew-joseph.png" size="medium">
          <CometChatAvatar.Image />
          <CometChatAvatar.Initials />
        </CometChatAvatar.Root>
      </div>
      <div className="cometchat-incoming-call__details">
        <div className="cometchat-incoming-call__title">Charlie Brown</div>
        <div className="cometchat-incoming-call__subtitle">Incoming Voice Call</div>
      </div>
    </div>
    <div className="cometchat-incoming-call__button-group">
      <button
        type="button"
        className="cometchat-incoming-call__button-decline"
        onClick={() => console.log('Declined')}
      >
        Decline
      </button>
      <button
        type="button"
        className="cometchat-incoming-call__button-accept"
        onClick={() => console.log('Accepted')}
      >
        Accept
      </button>
    </div>
  </div>
);
