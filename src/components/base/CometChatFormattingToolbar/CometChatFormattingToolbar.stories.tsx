/**
 * CometChatFormattingToolbar Storybook Stories
 *
 * Interactive stories demonstrating the rich text formatting toolbar:
 * - Default (no active formats)
 * - With active formats
 * - Inline formatting disabled (e.g., inside a code block)
 * - Dark theme
 * - RTL
 *
 * @module components/base/CometChatFormattingToolbar
 */

import React, { useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatFormattingToolbar } from './CometChatFormattingToolbar';
import type { CometChatRichTextFormatState } from '../../../utils/RichTextEditor/RichTextEditor.types';

const meta: Meta<typeof CometChatFormattingToolbar> = {
  title: 'Base Elements/Formatting Toolbar',
  component: CometChatFormattingToolbar,
  tags: ['autodocs'],
  args: {
    inlineFormattingDisabled: false,
  },
  argTypes: {
    inlineFormattingDisabled: {
      control: 'boolean',
      description:
        'Disable inline formatting buttons (bold, italic, underline, strikethrough, link). Used inside code blocks.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Rich text formatting toolbar with bold, italic, underline, strikethrough, code, and list options.',
      },
    },
  },
};
export default meta;

const defaultFormatState: CometChatRichTextFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  codeBlock: false,
  blockquote: false,
  orderedList: false,
  bulletList: false,
  link: false,
};

/** Default — no active formatting. */
function DefaultDemo(args: { inlineFormattingDisabled: boolean }) {
  const [state, setState] = useState<CometChatRichTextFormatState>(defaultFormatState);

  const toggle = (key: keyof CometChatRichTextFormatState) => {
    setState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ width: 480 }}>
      <CometChatFormattingToolbar
        formatState={state}
        inlineFormattingDisabled={args.inlineFormattingDisabled}
        onBold={() => toggle('bold')}
        onItalic={() => toggle('italic')}
        onUnderline={() => toggle('underline')}
        onStrikethrough={() => toggle('strikethrough')}
        onInlineCode={() => toggle('code')}
        onCodeBlock={() => toggle('codeBlock')}
        onBlockquote={() => toggle('blockquote')}
        onOrderedList={() => toggle('orderedList')}
        onBulletList={() => toggle('bulletList')}
        onLink={() => toggle('link')}
      />
      <p style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        Active:{' '}
        {Object.entries(state)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(', ') || 'none'}
      </p>
    </div>
  );
}

export const Default = {
  render: (args: { inlineFormattingDisabled: boolean }) => <DefaultDemo {...args} />,
};

/** With active formats (bold + italic + blockquote). */
function WithActiveFormatsDemo(args: { inlineFormattingDisabled: boolean }) {
  return (
    <div style={{ width: 480 }}>
      <CometChatFormattingToolbar
        formatState={{
          ...defaultFormatState,
          bold: true,
          italic: true,
          blockquote: true,
        }}
        inlineFormattingDisabled={args.inlineFormattingDisabled}
        onBold={() => {}}
        onItalic={() => {}}
        onUnderline={() => {}}
        onStrikethrough={() => {}}
        onInlineCode={() => {}}
        onCodeBlock={() => {}}
        onBlockquote={() => {}}
        onOrderedList={() => {}}
        onBulletList={() => {}}
        onLink={() => {}}
      />
    </div>
  );
}

export const WithActiveFormats = {
  render: (args: { inlineFormattingDisabled: boolean }) => <WithActiveFormatsDemo {...args} />,
};

/** Inline formatting disabled (inside a code block). */
function InlineDisabledDemo(args: { inlineFormattingDisabled: boolean }) {
  return (
    <div style={{ width: 480 }}>
      <CometChatFormattingToolbar
        formatState={{ ...defaultFormatState, codeBlock: true }}
        inlineFormattingDisabled={args.inlineFormattingDisabled}
        onBold={() => {}}
        onItalic={() => {}}
        onUnderline={() => {}}
        onStrikethrough={() => {}}
        onInlineCode={() => {}}
        onCodeBlock={() => {}}
        onBlockquote={() => {}}
        onOrderedList={() => {}}
        onBulletList={() => {}}
        onLink={() => {}}
      />
      <p style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        Bold, italic, underline, strikethrough, and link buttons are disabled.
      </p>
    </div>
  );
}

export const InlineDisabled = {
  args: {
    inlineFormattingDisabled: true,
  },
  render: (args: { inlineFormattingDisabled: boolean }) => <InlineDisabledDemo {...args} />,
};
