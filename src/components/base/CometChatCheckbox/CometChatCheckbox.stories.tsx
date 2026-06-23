import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatCheckbox } from './CometChatCheckbox';

interface CheckboxStoryArgs {
  checked: boolean;
  disabled: boolean;
  indeterminate: boolean;
  label: string;
}

const meta: Meta<typeof CometChatCheckbox> = {
  title: 'Base Elements/Checkbox',
  component: CometChatCheckbox,
  tags: ['autodocs'],
  args: {
    checked: false,
    disabled: false,
    indeterminate: false,
    label: 'Checkbox label',
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled.',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Whether the checkbox is in an indeterminate state.',
    },
    label: {
      control: 'text',
      description: 'Label text displayed next to the checkbox.',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A checkbox input component supporting checked, unchecked, disabled, and indeterminate states.',
      },
    },
    layout: 'centered',
  },
  decorators: [
    // White card so the checkbox (light border/background) is visible against
    // Storybook's gray canvas.
    Story => (
      <div
        style={{
          display: 'inline-flex',
          padding: 24,
          background: 'var(--cometchat-background-color-01, #fff)',
          borderRadius: 'var(--cometchat-radius-3, 12px)',
          border: '1px solid var(--cometchat-border-color-light, #f5f5f5)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CometChatCheckbox>;

function DefaultDemo(args: CheckboxStoryArgs) {
  const [checked, setChecked] = useState(args.checked);
  // Keep the local state in sync with the Controls `checked` toggle.
  useEffect(() => {
    setChecked(args.checked);
  }, [args.checked]);
  return (
    <CometChatCheckbox
      checked={checked}
      disabled={args.disabled}
      indeterminate={args.indeterminate}
      label={args.label}
      onChange={({ checked: c }) => setChecked(c)}
    />
  );
}

export const Default: Story = {
  render: (args: CheckboxStoryArgs) => <DefaultDemo {...args} />,
};

function CheckedDemo(args: CheckboxStoryArgs) {
  const [checked, setChecked] = useState(true);
  return (
    <CometChatCheckbox
      checked={checked}
      disabled={args.disabled}
      indeterminate={args.indeterminate}
      label={args.label}
      onChange={({ checked: c }) => setChecked(c)}
    />
  );
}

export const Checked: Story = {
  args: {
    checked: true,
  },
  render: (args: CheckboxStoryArgs) => <CheckedDemo {...args} />,
};

function WithLabelDemo(args: CheckboxStoryArgs) {
  const [checked, setChecked] = useState(false);
  return (
    <CometChatCheckbox
      checked={checked}
      disabled={args.disabled}
      indeterminate={args.indeterminate}
      label={args.label}
      onChange={({ checked: c }) => setChecked(c)}
    />
  );
}

export const WithLabel: Story = {
  args: {
    label: 'Select this item',
  },
  render: (args: CheckboxStoryArgs) => <WithLabelDemo {...args} />,
};

function DisabledUncheckedDemo(args: CheckboxStoryArgs) {
  return (
    <CometChatCheckbox
      disabled={args.disabled}
      label={args.label}
      indeterminate={args.indeterminate}
    />
  );
}

export const DisabledUnchecked: Story = {
  args: {
    disabled: true,
    label: 'Disabled unchecked',
  },
  render: (args: CheckboxStoryArgs) => <DisabledUncheckedDemo {...args} />,
};

function DisabledCheckedDemo(args: CheckboxStoryArgs) {
  return (
    <CometChatCheckbox
      checked={args.checked}
      disabled={args.disabled}
      indeterminate={args.indeterminate}
      label={args.label}
    />
  );
}

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
  },
  render: (args: CheckboxStoryArgs) => <DisabledCheckedDemo {...args} />,
};

function AllStatesDemo(args: CheckboxStoryArgs) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CometChatCheckbox label="Unchecked" disabled={args.disabled} />
      <CometChatCheckbox label="Checked" defaultChecked disabled={args.disabled} />
      <CometChatCheckbox label="Disabled unchecked" disabled />
      <CometChatCheckbox label="Disabled checked" checked disabled />
    </div>
  );
}

export const AllStates: Story = {
  render: (args: CheckboxStoryArgs) => <AllStatesDemo {...args} />,
};
