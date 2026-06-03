import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatRadioButton } from './CometChatRadioButton';

const meta: Meta<typeof CometChatRadioButton> = {
  title: 'Base Elements/Radio Button',
  component: CometChatRadioButton,
  tags: ['autodocs'],
  args: {
    checked: false,
    disabled: false,
    label: 'Option 1',
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the radio button is selected.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the radio button is disabled.',
    },
    label: {
      control: 'text',
      description: 'Label text displayed next to the radio button.',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A radio button input for single-selection within a group.',
      },
    },
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof CometChatRadioButton>;

/** Default radio button with interactive controls. */
export const Default: Story = {
  render: args => (
    <CometChatRadioButton
      label={args.label}
      name="default-group"
      value="option1"
      checked={args.checked}
      disabled={args.disabled}
      onChange={({ checked, value }) => console.log('changed:', checked, value)}
    />
  ),
};

/** Radio button in the selected state. */
function CheckedDemo(args: { checked: boolean; disabled: boolean; label: string }) {
  const [selected, setSelected] = useState('checked');
  return (
    <CometChatRadioButton
      label={args.label}
      name="checked-group"
      value="checked"
      checked={selected === 'checked'}
      disabled={args.disabled}
      onChange={() => setSelected('checked')}
    />
  );
}

export const Checked: Story = {
  args: {
    checked: true,
    label: 'Selected option',
  },
  render: args => <CheckedDemo {...args} />,
};

/** Radio button with label text. */
function WithLabelDemo(args: { checked: boolean; disabled: boolean; label: string }) {
  const [selected, setSelected] = useState('');
  return (
    <CometChatRadioButton
      label={args.label}
      name="label-group"
      value="labeled"
      checked={selected === 'labeled'}
      disabled={args.disabled}
      onChange={() => setSelected('labeled')}
    />
  );
}

export const WithLabel: Story = {
  args: {
    label: 'Select this option',
  },
  render: args => <WithLabelDemo {...args} />,
};

/** Disabled radio button in unchecked state. */
export const DisabledUnchecked: Story = {
  args: {
    disabled: true,
    label: 'Disabled unchecked',
  },
  render: args => (
    <CometChatRadioButton
      label={args.label}
      name="disabled-group"
      value="d1"
      disabled={args.disabled}
    />
  ),
};

/** Disabled radio button in checked state. */
export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    label: 'Disabled checked',
  },
  render: args => (
    <CometChatRadioButton
      label={args.label}
      name="disabled-checked-group"
      value="d2"
      checked={args.checked}
      disabled={args.disabled}
    />
  ),
};

/** Multiple radio buttons sharing a name, demonstrating single-selection. */
function RadioGroupDemo() {
  const [selected, setSelected] = useState('a');
  return (
    <div
      role="radiogroup"
      aria-label="Demo group"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <CometChatRadioButton
        name="demo-group"
        value="a"
        label="Option A"
        checked={selected === 'a'}
        onChange={() => setSelected('a')}
      />
      <CometChatRadioButton
        name="demo-group"
        value="b"
        label="Option B"
        checked={selected === 'b'}
        onChange={() => setSelected('b')}
      />
      <CometChatRadioButton
        name="demo-group"
        value="c"
        label="Option C"
        checked={selected === 'c'}
        onChange={() => setSelected('c')}
      />
      <CometChatRadioButton
        name="demo-group"
        value="d"
        label="Option D (Disabled)"
        checked={selected === 'd'}
        onChange={() => setSelected('d')}
        disabled
      />
    </div>
  );
}

export const RadioGroup: Story = {
  render: () => <RadioGroupDemo />,
};

/** Showcase of all radio button variants. */
export const AllStates: Story = {
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CometChatRadioButton
        label="Unchecked"
        name="all-1"
        value="unchecked"
        disabled={args.disabled}
      />
      <CometChatRadioButton
        label="Checked"
        name="all-2"
        value="checked"
        defaultChecked
        disabled={args.disabled}
      />
      <CometChatRadioButton label="Disabled unchecked" name="all-3" value="dis-un" disabled />
      <CometChatRadioButton label="Disabled checked" name="all-4" value="dis-ch" checked disabled />
    </div>
  ),
};
