/**
 * CometChatStreamMessageBubble Storybook Stories
 *
 * Demonstrates the streaming AI message bubble:
 * - Thinking state (before first text chunk)
 * - Streaming content (accumulated markdown)
 * - Completed stream (final content with copy button)
 * - Error state (offline)
 * - Tool execution state
 *
 * NOTE: The real component subscribes to CometChatAIStreamingService via
 * useSyncExternalStore. These stories simulate the visual states directly
 * since we cannot trigger real streaming events in Storybook.
 *
 * @module plugins/ai/CometChatStreamMessageBubble
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import copyIcon from '../../assets/Copy.svg';

// ============================================
// Simulated UI (since the real component needs the streaming service)
// ============================================

const bubbleStyle: React.CSSProperties = {
  maxWidth: 360,
  padding: '12px 16px',
  borderRadius: '12px',
  background: 'var(--cometchat-background-color-02, #f9f9f9)',
  border: '1px solid var(--cometchat-border-color-light, #eee)',
  font: 'var(--cometchat-font-body-regular, 400 14px Roboto)',
  color: 'var(--cometchat-text-color-primary, #141414)',
  position: 'relative',
};

const thinkingStyle: React.CSSProperties = {
  ...bubbleStyle,
  color: 'var(--cometchat-text-color-secondary, #727272)',
  fontStyle: 'italic',
};

const errorStyle: React.CSSProperties = {
  ...bubbleStyle,
  color: 'var(--cometchat-error-color, #f44649)',
};

const copyButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--cometchat-background-color-03, #f0f0f0)',
  cursor: 'pointer',
  padding: 4,
};

const toolExecutionStyle: React.CSSProperties = {
  ...bubbleStyle,
  color: 'var(--cometchat-text-color-secondary, #727272)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/AI/Stream Message Bubble',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a live-streaming AI response with thinking, tool execution, and streaming text states. Subscribes to CometChatAIStreamingService for real-time content updates.',
      },
    },
    layout: 'centered',
  },
};
export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Thinking state — shown before the first text chunk arrives. */
export const Thinking: Story = {
  render: () => (
    <div style={thinkingStyle} aria-live="polite">
      <span>Thinking...</span>
    </div>
  ),
};

/** Streaming content — accumulated markdown rendered progressively. */
export const StreamingContent: Story = {
  render: () => (
    <div style={{ ...bubbleStyle, paddingRight: 40 }} aria-live="polite">
      <div>
        <p style={{ margin: '0 0 8px' }}>Here are some suggestions for your project:</p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>Refactor</strong> the authentication module for better security
          </li>
          <li>Add unit tests for the payment processing flow</li>
          <li>
            Consider using{' '}
            <code style={{ background: '#f0f0f0', padding: '2px 4px', borderRadius: 3 }}>
              React.memo
            </code>{' '}
            for the list items...
          </li>
        </ul>
      </div>
      <button type="button" style={copyButtonStyle} aria-label="Copy message" title="Copy">
        <img
          src={copyIcon}
          alt=""
          width={20}
          height={20}
          style={{ opacity: 0.6 }}
          draggable={false}
        />
      </button>
    </div>
  ),
};

/** Completed stream — final content with copy button visible. */
export const Completed: Story = {
  render: () => (
    <div style={{ ...bubbleStyle, paddingRight: 40 }}>
      <div>
        <p style={{ margin: '0 0 8px' }}>
          Based on the conversation, here&apos;s a summary of the key decisions:
        </p>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>The team will adopt TypeScript for all new modules</li>
          <li>Code reviews require at least two approvals</li>
          <li>Deploy to staging every Wednesday</li>
        </ol>
        <p style={{ margin: '8px 0 0' }}>
          Let me know if you need more details on any of these points.
        </p>
      </div>
      <button type="button" style={copyButtonStyle} aria-label="Copy message" title="Copy">
        <img
          src={copyIcon}
          alt=""
          width={20}
          height={20}
          style={{ opacity: 0.6 }}
          draggable={false}
        />
      </button>
    </div>
  ),
};

/** Error state — shown when the connection is lost during streaming. */
export const ErrorOffline: Story = {
  render: () => (
    <div style={errorStyle} aria-live="polite">
      <span>No internet connection. Please check your network and try again.</span>
    </div>
  ),
};

/** Tool execution state — shown while an AI tool is running. */
export const ToolExecution: Story = {
  render: () => (
    <div style={toolExecutionStyle} aria-live="polite">
      <span
        style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          border: '2px solid var(--cometchat-primary-color, #3399ff)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span>Executing search_documents...</span>
    </div>
  ),
};
