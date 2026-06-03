/**
 * CometChatModerationView Storybook Stories
 *
 * Demonstrates the moderation warning view shown under blocked messages:
 * - Default (with localized message)
 * - Custom message
 * - Dark theme
 * - RTL
 *
 * @module components/base/CometChatModerationView
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatModerationView } from './CometChatModerationView';

const meta: Meta = {
  title: 'Base Elements/Moderation View',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays content moderation status and actions for flagged messages.',
      },
    },
  },
};
export default meta;

/** Default — shows the default moderation message. */
export const Default = () => (
  <div style={{ width: 320 }}>
    <CometChatModerationView />
  </div>
);

/** Custom message override. */
export const CustomMessage = () => (
  <div style={{ width: 320 }}>
    <CometChatModerationView message="This message was blocked by the moderator." />
  </div>
);

/** Long custom message. */
export const LongMessage = () => (
  <div style={{ width: 320 }}>
    <CometChatModerationView message="This message has been flagged and blocked by our automated content moderation system. Please contact an admin if you believe this was a mistake." />
  </div>
);
