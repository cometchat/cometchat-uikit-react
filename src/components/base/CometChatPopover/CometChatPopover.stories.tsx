import React, { useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatPopover } from './CometChatPopover';
import { CometChatButton } from '../CometChatButton';

const meta: Meta = {
  title: 'Base Elements/Popover',
  tags: ['autodocs'],
  args: {
    isOpen: undefined,
    showArrow: false,
    trapFocus: false,
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the popover is open (controlled mode).',
    },
    showArrow: {
      control: 'boolean',
      description: 'Whether to show an arrow pointing to the trigger.',
    },
    trapFocus: {
      control: 'boolean',
      description: 'Whether to trap focus inside the popover when open.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A floating popover component with configurable placement, triggers, and focus management.',
      },
    },
  },
};
export default meta;

const contentStyle: React.CSSProperties = {
  padding: 16,
  minWidth: 180,
};

/** Default — bottom placement, click trigger with interactive controls. */
export const Default = {
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <CometChatPopover.Root placement="bottom" showArrow={args.showArrow} trapFocus={args.trapFocus}>
      <CometChatPopover.Trigger>
        <CometChatButton.Root variant="primary">
          <CometChatButton.Text>Click me</CometChatButton.Text>
        </CometChatButton.Root>
      </CometChatPopover.Trigger>
      <CometChatPopover.Content>
        <div style={contentStyle}>Popover content (bottom)</div>
      </CometChatPopover.Content>
    </CometChatPopover.Root>
  ),
};

/** Top placement. */
export const TopPlacement = {
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <div style={{ marginTop: 200 }}>
      <CometChatPopover.Root placement="top" showArrow={args.showArrow} trapFocus={args.trapFocus}>
        <CometChatPopover.Trigger>
          <CometChatButton.Root variant="primary">
            <CometChatButton.Text>Top popover</CometChatButton.Text>
          </CometChatButton.Root>
        </CometChatPopover.Trigger>
        <CometChatPopover.Content>
          <div style={contentStyle}>Popover content (top)</div>
        </CometChatPopover.Content>
      </CometChatPopover.Root>
    </div>
  ),
};

/** Left placement. */
export const LeftPlacement = {
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <div style={{ marginLeft: 300 }}>
      <CometChatPopover.Root placement="left" showArrow={args.showArrow} trapFocus={args.trapFocus}>
        <CometChatPopover.Trigger>
          <CometChatButton.Root variant="primary">
            <CometChatButton.Text>Left popover</CometChatButton.Text>
          </CometChatButton.Root>
        </CometChatPopover.Trigger>
        <CometChatPopover.Content>
          <div style={contentStyle}>Popover content (left)</div>
        </CometChatPopover.Content>
      </CometChatPopover.Root>
    </div>
  ),
};

/** Right placement. */
export const RightPlacement = {
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <CometChatPopover.Root placement="right" showArrow={args.showArrow} trapFocus={args.trapFocus}>
      <CometChatPopover.Trigger>
        <CometChatButton.Root variant="primary">
          <CometChatButton.Text>Right popover</CometChatButton.Text>
        </CometChatButton.Root>
      </CometChatPopover.Trigger>
      <CometChatPopover.Content>
        <div style={contentStyle}>Popover content (right)</div>
      </CometChatPopover.Content>
    </CometChatPopover.Root>
  ),
};

/** With arrow — all 4 placements. */
export const WithArrow = {
  args: {
    showArrow: true,
  },
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', padding: 100 }}>
      {(['top', 'bottom', 'left', 'right'] as const).map(p => (
        <CometChatPopover.Root
          key={p}
          placement={p}
          showArrow={args.showArrow}
          trapFocus={args.trapFocus}
        >
          <CometChatPopover.Trigger>
            <CometChatButton.Root variant="secondary">
              <CometChatButton.Text>Arrow {p}</CometChatButton.Text>
            </CometChatButton.Root>
          </CometChatPopover.Trigger>
          <CometChatPopover.Content>
            <div style={{ padding: 12 }}>Arrow ({p})</div>
          </CometChatPopover.Content>
        </CometChatPopover.Root>
      ))}
    </div>
  ),
};

/** Hover trigger. */
export const HoverTrigger = {
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <CometChatPopover.Root
      showOnHover
      debounceOnHover={300}
      showArrow={args.showArrow}
      placement="top"
      trapFocus={args.trapFocus}
    >
      <CometChatPopover.Trigger>
        <CometChatButton.Root variant="secondary">
          <CometChatButton.Text>Hover me</CometChatButton.Text>
        </CometChatButton.Root>
      </CometChatPopover.Trigger>
      <CometChatPopover.Content>
        <div style={{ padding: 8 }}>Tooltip on hover</div>
      </CometChatPopover.Content>
    </CometChatPopover.Root>
  ),
};

/** With focus trap. */
export const WithFocusTrap = {
  args: {
    trapFocus: true,
  },
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <CometChatPopover.Root
      placement="bottom"
      trapFocus={args.trapFocus}
      showArrow={args.showArrow}
      ariaLabel="Settings menu"
    >
      <CometChatPopover.Trigger>
        <CometChatButton.Root variant="primary">
          <CometChatButton.Text>Open with focus trap</CometChatButton.Text>
        </CometChatButton.Root>
      </CometChatPopover.Trigger>
      <CometChatPopover.Content>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CometChatButton.Root variant="secondary">
            <CometChatButton.Text>Option 1</CometChatButton.Text>
          </CometChatButton.Root>
          <CometChatButton.Root variant="secondary">
            <CometChatButton.Text>Option 2</CometChatButton.Text>
          </CometChatButton.Root>
          <CometChatButton.Root variant="secondary">
            <CometChatButton.Text>Option 3</CometChatButton.Text>
          </CometChatButton.Root>
        </div>
      </CometChatPopover.Content>
    </CometChatPopover.Root>
  ),
};

/** Controlled mode. */
function ControlledModeDemo(args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <CometChatPopover.Root
        isOpen={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        placement="bottom"
        showArrow={args.showArrow}
        trapFocus={args.trapFocus}
      >
        <CometChatPopover.Trigger>
          <CometChatButton.Root variant="primary">
            <CometChatButton.Text>Controlled trigger</CometChatButton.Text>
          </CometChatButton.Root>
        </CometChatPopover.Trigger>
        <CometChatPopover.Content>
          <div style={contentStyle}>
            <p style={{ margin: '0 0 8px' }}>Controlled popover</p>
            <CometChatButton.Root variant="secondary" onClick={() => setOpen(false)}>
              <CometChatButton.Text>Close</CometChatButton.Text>
            </CometChatButton.Root>
          </div>
        </CometChatPopover.Content>
      </CometChatPopover.Root>
      <span
        style={{
          font: 'var(--cometchat-font-body-regular)',
          color: 'var(--cometchat-text-color-secondary)',
        }}
      >
        isOpen: {String(open)}
      </span>
    </div>
  );
}

export const ControlledMode = {
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <ControlledModeDemo {...args} />
  ),
};

/** Nested popovers. */
export const NestedPopovers = {
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <CometChatPopover.Root placement="bottom" showArrow={args.showArrow} trapFocus={args.trapFocus}>
      <CometChatPopover.Trigger>
        <CometChatButton.Root variant="primary">
          <CometChatButton.Text>Open outer</CometChatButton.Text>
        </CometChatButton.Root>
      </CometChatPopover.Trigger>
      <CometChatPopover.Content>
        <div style={{ padding: 16 }}>
          <p style={{ margin: '0 0 8px' }}>Outer popover</p>
          <CometChatPopover.Root placement="right" showArrow={args.showArrow}>
            <CometChatPopover.Trigger>
              <CometChatButton.Root variant="secondary">
                <CometChatButton.Text>Open inner</CometChatButton.Text>
              </CometChatButton.Root>
            </CometChatPopover.Trigger>
            <CometChatPopover.Content>
              <div style={{ padding: 12 }}>Inner popover</div>
            </CometChatPopover.Content>
          </CometChatPopover.Root>
        </div>
      </CometChatPopover.Content>
    </CometChatPopover.Root>
  ),
};
/** closeOnOutsideClick disabled. */
export const NoOutsideClickClose = {
  render: (args: { isOpen?: boolean; showArrow: boolean; trapFocus: boolean }) => (
    <CometChatPopover.Root
      placement="bottom"
      closeOnOutsideClick={false}
      showArrow={args.showArrow}
      trapFocus={args.trapFocus}
    >
      <CometChatPopover.Trigger>
        <CometChatButton.Root variant="secondary">
          <CometChatButton.Text>Click (no outside close)</CometChatButton.Text>
        </CometChatButton.Root>
      </CometChatPopover.Trigger>
      <CometChatPopover.Content>
        <div style={contentStyle}>
          <p style={{ margin: '0 0 4px' }}>Click outside — I won't close.</p>
          <p style={{ margin: 0 }}>Press Escape to close.</p>
        </div>
      </CometChatPopover.Content>
    </CometChatPopover.Root>
  ),
};
