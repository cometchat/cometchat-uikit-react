import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatMessageComposer } from './CometChatMessageComposer';
import type { CometChatMessageComposerRootProps } from './CometChatMessageComposer.types';

// ---------------------------------------------------------------------------
// Shared wrapper styles
// ---------------------------------------------------------------------------

const CANVAS_STYLE: React.CSSProperties = {
  width: '100%',
  maxWidth: 760,
  padding: '24px 32px',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 11,
  fontWeight: 600,
  color: '#999',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
};

// ---------------------------------------------------------------------------
// Helper — composer that logs sent messages
// ---------------------------------------------------------------------------

function ComposerWithLog(props: CometChatMessageComposerRootProps) {
  const [log, setLog] = useState<string[]>([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <CometChatMessageComposer.Root
        {...props}
        onSendButtonClick={msg => {
          const text =
            (msg as unknown as { getText?: () => string }).getText?.() ?? JSON.stringify(msg);
          setLog(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev]);
        }}
      />
      {log.length > 0 && (
        <div
          style={{
            background: '#f5f5f5',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: '#555',
            maxHeight: 120,
            overflowY: 'auto',
          }}
        >
          <strong style={{ display: 'block', marginBottom: 4 }}>Sent messages:</strong>
          {log.map((entry, i) => (
            <div key={i}>{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof CometChatMessageComposer.Root> = {
  title: 'Components/Messages/CometChat Message Composer',
  component: CometChatMessageComposer.Root,
  tags: ['autodocs'],
  args: {
    layout: 'compact',
  },
  argTypes: {
    layout: {
      control: 'select',
      options: ['compact', 'multiline'],
      description: 'Layout mode — compact (single line) or multiline (expanded).',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Rich text message composer with mentions, formatting toolbar, attachments, emoji picker, and voice recording.',
      },
    },
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof CometChatMessageComposer.Root>;

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: args => (
    <div style={CANVAS_STYLE}>
      <ComposerWithLog placeholder="Type a message..." layout={args.layout} />
    </div>
  ),
};

export const MultilineLayout: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <ComposerWithLog placeholder="Type a message..." layout="multiline" />
    </div>
  ),
};

export const WithInitialText: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <ComposerWithLog initialText="Hello, world!" layout="compact" />
    </div>
  ),
};

export const NewlineBehavior: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#888' }}>
        Enter inserts a newline (enterKeyBehavior="newline")
      </p>
      <CometChatMessageComposer.Root
        placeholder="Press Enter to add a new line..."
        enterKeyBehavior="newline"
        layout="compact"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Rich text
// ---------------------------------------------------------------------------

export const RichTextEditor: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <ComposerWithLog
        placeholder="Type with rich formatting..."
        layout="compact"
        enableRichTextEditor
      />
    </div>
  ),
};

export const RichTextMultiline: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <ComposerWithLog
        placeholder="Rich text, multiline layout..."
        layout="multiline"
        enableRichTextEditor
      />
    </div>
  ),
};

export const RichTextNoToolbar: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#888' }}>
        Toolbar hidden — use Ctrl+B / Ctrl+I / Ctrl+U for formatting
      </p>
      <ComposerWithLog
        placeholder="Use keyboard shortcuts for formatting..."
        layout="compact"
        enableRichTextEditor
        hideRichTextFormattingOptions
      />
    </div>
  ),
};

export const RichTextFormattingShowcase: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <div
        style={{
          background: '#f0f4ff',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: '#444',
          lineHeight: 1.7,
          marginBottom: 16,
        }}
      >
        <strong>Try these formatting options:</strong>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          <li>
            <strong>Bold</strong> — Ctrl+B or toolbar B
          </li>
          <li>
            <em>Italic</em> — Ctrl+I or toolbar I
          </li>
          <li>
            <u>Underline</u> — Ctrl+U or toolbar U
          </li>
          <li>
            <s>Strikethrough</s> — toolbar S
          </li>
          <li>
            <code>Inline code</code> — toolbar &lt;&gt;
          </li>
          <li>Code block — toolbar &#123;&#125;</li>
          <li>Bullet list — toolbar or type "- " + Space</li>
          <li>Numbered list — toolbar or type "1. " + Space</li>
          <li>Blockquote — toolbar or type "&gt; " + Space</li>
          <li>Link — toolbar 🔗 or type [text](url)</li>
          <li>Markdown: **bold**, _italic_, ~~strike~~, `code`</li>
        </ul>
      </div>
      <CometChatMessageComposer.Root
        placeholder="Try formatting..."
        layout="compact"
        enableRichTextEditor
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Layout comparison
// ---------------------------------------------------------------------------

export const LayoutComparison: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <p style={LABEL_STYLE}>Compact (default)</p>
          <CometChatMessageComposer.Root
            placeholder="Compact layout..."
            layout="compact"
            enableRichTextEditor
          />
        </div>
        <div>
          <p style={LABEL_STYLE}>Multiline</p>
          <CometChatMessageComposer.Root
            placeholder="Multiline layout..."
            layout="multiline"
            enableRichTextEditor
          />
        </div>
      </div>
    </div>
  ),
};

export const PlainVsRichText: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <p style={LABEL_STYLE}>Plain text</p>
          <CometChatMessageComposer.Root placeholder="Plain text composer..." layout="compact" />
        </div>
        <div>
          <p style={LABEL_STYLE}>Rich text</p>
          <CometChatMessageComposer.Root
            placeholder="Rich text composer..."
            layout="compact"
            enableRichTextEditor
          />
        </div>
      </div>
    </div>
  ),
};
// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

export const MentionsDisabled: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#888' }}>
        @ will not trigger mention suggestions
      </p>
      <ComposerWithLog
        placeholder="@ won't trigger mentions..."
        layout="compact"
        enableRichTextEditor
        disableMentions
      />
    </div>
  ),
};

export const TypingEventsDisabled: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <ComposerWithLog
        placeholder="No typing indicators sent..."
        layout="compact"
        disableTypingEvents
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Compound / custom layout
// ---------------------------------------------------------------------------

export const MinimalLayout: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <p style={LABEL_STYLE}>Input + Send only</p>
      <CometChatMessageComposer.Root layout="compact">
        <CometChatMessageComposer.Input />
        <CometChatMessageComposer.SendButton />
      </CometChatMessageComposer.Root>
    </div>
  ),
};

export const InputEmojiSend: Story = {
  render: () => (
    <div style={CANVAS_STYLE}>
      <p style={LABEL_STYLE}>Input + Emoji + Send (no attachment / voice)</p>
      <CometChatMessageComposer.Root layout="compact">
        <CometChatMessageComposer.Input />
        <CometChatMessageComposer.EmojiButton />
        <CometChatMessageComposer.SendButton />
      </CometChatMessageComposer.Root>
    </div>
  ),
};
