import { useState, useCallback } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatSearchBar } from './CometChatSearchBar';

interface SearchBarStoryArgs {
  disabled: boolean;
  placeholder: string;
}

const meta: Meta = {
  title: 'Base Elements/Search Bar',
  tags: ['autodocs'],
  args: {
    disabled: false,
    placeholder: 'Search...',
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the search bar is disabled.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown in the input.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A search input with icon, placeholder, clear button, and debounced onChange.',
      },
    },
  },
};
export default meta;

/** Default — icon, input, and clear button. */
function DefaultDemo(args: SearchBarStoryArgs) {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: 320 }}>
      <CometChatSearchBar.Root
        searchText={value}
        onChange={setValue}
        placeholderText={args.placeholder}
        disabled={args.disabled}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton />
      </CometChatSearchBar.Root>
    </div>
  );
}

export const Default = {
  render: (args: SearchBarStoryArgs) => <DefaultDemo {...args} />,
};

/** With custom placeholder text. */
function WithPlaceholderDemo(args: SearchBarStoryArgs) {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: 320 }}>
      <CometChatSearchBar.Root
        searchText={value}
        onChange={setValue}
        placeholderText={args.placeholder}
        disabled={args.disabled}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton />
      </CometChatSearchBar.Root>
    </div>
  );
}

export const WithPlaceholder = {
  args: {
    placeholder: 'Search users...',
  },
  render: (args: SearchBarStoryArgs) => <WithPlaceholderDemo {...args} />,
};

/** Uncontrolled mode with defaultSearchText. */
function UncontrolledDemo(args: SearchBarStoryArgs) {
  const handleChange = useCallback((val: string) => {
    console.log('Search:', val);
  }, []);
  return (
    <div style={{ width: 320 }}>
      <CometChatSearchBar.Root
        defaultSearchText="initial query"
        onChange={handleChange}
        placeholderText={args.placeholder}
        disabled={args.disabled}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton />
      </CometChatSearchBar.Root>
    </div>
  );
}

export const Uncontrolled = {
  render: (args: SearchBarStoryArgs) => <UncontrolledDemo {...args} />,
};

/** Controlled mode — external state drives the input. */
function ControlledDemo(args: SearchBarStoryArgs) {
  const [value, setValue] = useState('hello');
  return (
    <div style={{ width: 320 }}>
      <CometChatSearchBar.Root
        searchText={value}
        onChange={setValue}
        placeholderText={args.placeholder}
        disabled={args.disabled}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton />
      </CometChatSearchBar.Root>
      <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
        <button onClick={() => setValue('react')}>Set &quot;react&quot;</button>
        <button onClick={() => setValue('')}>Clear</button>
      </div>
    </div>
  );
}

export const Controlled = {
  render: (args: SearchBarStoryArgs) => <ControlledDemo {...args} />,
};

/** With debounce (300ms). */
function WithDebounceDemo(args: SearchBarStoryArgs) {
  const [debouncedValue, setDebouncedValue] = useState('');
  return (
    <div style={{ width: 320 }}>
      <CometChatSearchBar.Root
        onChange={setDebouncedValue}
        debounceMs={300}
        placeholderText={args.placeholder}
        disabled={args.disabled}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton />
      </CometChatSearchBar.Root>
      <p style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        Debounced: &quot;{debouncedValue}&quot;
      </p>
    </div>
  );
}

export const WithDebounce = {
  args: {
    placeholder: 'Type to search (300ms debounce)...',
  },
  render: (args: SearchBarStoryArgs) => <WithDebounceDemo {...args} />,
};

/** Disabled state. */
function DisabledDemo(args: SearchBarStoryArgs) {
  return (
    <div style={{ width: 320 }}>
      <CometChatSearchBar.Root
        searchText="can't edit this"
        disabled={args.disabled}
        placeholderText={args.placeholder}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton />
      </CometChatSearchBar.Root>
    </div>
  );
}

export const Disabled = {
  args: {
    disabled: true,
    placeholder: 'Disabled',
  },
  render: (args: SearchBarStoryArgs) => <DisabledDemo {...args} />,
};

/** Without clear button — minimal usage. */
function NoClearButtonDemo(args: SearchBarStoryArgs) {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: 320 }}>
      <CometChatSearchBar.Root
        searchText={value}
        onChange={setValue}
        placeholderText={args.placeholder}
        disabled={args.disabled}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
      </CometChatSearchBar.Root>
    </div>
  );
}

export const NoClearButton = {
  render: (args: SearchBarStoryArgs) => <NoClearButtonDemo {...args} />,
};

/** Custom icons. */
function CustomIconsDemo(args: SearchBarStoryArgs) {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: 320 }}>
      <CometChatSearchBar.Root
        searchText={value}
        onChange={setValue}
        placeholderText={args.placeholder}
        disabled={args.disabled}
      >
        <CometChatSearchBar.Icon icon={<span style={{ fontSize: 16 }}>🔍</span>} />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton icon={<span style={{ fontSize: 14 }}>✕</span>} />
      </CometChatSearchBar.Root>
    </div>
  );
}

export const CustomIcons = {
  args: {
    placeholder: 'Custom icons...',
  },
  render: (args: SearchBarStoryArgs) => <CustomIconsDemo {...args} />,
};
