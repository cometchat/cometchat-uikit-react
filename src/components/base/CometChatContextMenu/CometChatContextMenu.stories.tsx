import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatContextMenu } from './CometChatContextMenu';
import type { CometChatContextMenuItemData } from './CometChatContextMenu.types';

import addReactionIcon from '../../../assets/add_reaction_icon.svg';
import replyIcon from '../../../assets/reply.svg';
import editIcon from '../../../assets/edit_icon.svg';
import deleteIcon from '../../../assets/delete.svg';
import copyIcon from '../../../assets/Copy.svg';
import infoIcon from '../../../assets/info_icon_fill.svg';
import translateIcon from '../../../assets/translate.svg';

/** 16px icon for top-row items. */
function SmallIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={16}
      height={16}
      style={{
        filter:
          'brightness(0) saturate(100%) invert(65%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)',
      }}
    />
  );
}

/** 24px icon for dropdown items. */
function DropdownIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={24}
      height={24}
      style={{
        filter:
          'brightness(0) saturate(100%) invert(65%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)',
      }}
    />
  );
}

const noop = () => {};

const sampleItems: CometChatContextMenuItemData[] = [
  { id: 'react', title: 'React', icon: <SmallIcon src={addReactionIcon} alt="" />, onClick: noop },
  { id: 'reply', title: 'Reply', icon: <SmallIcon src={replyIcon} alt="" />, onClick: noop },
  { id: 'copy', title: 'Copy', icon: <DropdownIcon src={copyIcon} alt="" />, onClick: noop },
  { id: 'edit', title: 'Edit', icon: <DropdownIcon src={editIcon} alt="" />, onClick: noop },
  { id: 'info', title: 'Info', icon: <DropdownIcon src={infoIcon} alt="" />, onClick: noop },
  { id: 'delete', title: 'Delete', icon: <DropdownIcon src={deleteIcon} alt="" />, onClick: noop },
  {
    id: 'translate',
    title: 'Translate',
    icon: <DropdownIcon src={translateIcon} alt="" />,
    onClick: noop,
  },
];

/**
 * Wrapper that centers the component without using Storybook's layout: 'centered',
 * which causes layout shifts when absolutely positioned dropdowns open.
 */
function StoryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40, minHeight: 300 }}>
      <div>{children}</div>
    </div>
  );
}

const meta: Meta = {
  title: 'Components/Misc/Context Menu',
  tags: ['autodocs'],
  args: {
    isOpen: true,
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the context menu dropdown is open by default.',
    },
  },
  parameters: {
    layout: 'none',
    docs: {
      description: {
        component: 'A right-click or hover-triggered context menu with customizable menu items.',
      },
    },
  },
};
export default meta;

export const Default = {
  render: (args: { isOpen: boolean }) => (
    <StoryWrapper>
      <CometChatContextMenu.Root
        items={sampleItems}
        topMenuSize={2}
        placement="bottom"
        defaultOpen={args.isOpen}
        onOptionClicked={item => alert(item.title)}
      />
    </StoryWrapper>
  ),
};

/** All items in top row (no dropdown). */
export const AllTopRow = {
  render: (args: { isOpen: boolean }) => (
    <StoryWrapper>
      <CometChatContextMenu.Root
        items={sampleItems.slice(0, 3)}
        topMenuSize={5}
        defaultOpen={args.isOpen}
      />
    </StoryWrapper>
  ),
};

/** All items in dropdown (topMenuSize=0). */
export const AllDropdown = {
  render: (args: { isOpen: boolean }) => (
    <StoryWrapper>
      <CometChatContextMenu.Root
        items={sampleItems}
        topMenuSize={0}
        placement="bottom"
        defaultOpen={args.isOpen}
        onOptionClicked={item => alert(item.title)}
      />
    </StoryWrapper>
  ),
};

/** With disabled items. */
function WithDisabledItemsDemo(args: { isOpen: boolean }) {
  const items: CometChatContextMenuItemData[] = [
    { ...sampleItems[0]!, id: 'react' },
    { ...sampleItems[1]!, id: 'reply', disabled: true },
    { ...sampleItems[2]!, id: 'copy' },
    { ...sampleItems[3]!, id: 'edit', disabled: true },
    { ...sampleItems[4]!, id: 'info' },
    { ...sampleItems[5]!, id: 'delete' },
    { ...sampleItems[6]!, id: 'translate' },
  ];
  return (
    <StoryWrapper>
      <CometChatContextMenu.Root
        items={items}
        topMenuSize={2}
        placement="bottom"
        defaultOpen={args.isOpen}
        onOptionClicked={item => alert(item.title)}
      />
    </StoryWrapper>
  );
}

export const WithDisabledItems = {
  render: (args: { isOpen: boolean }) => <WithDisabledItemsDemo {...args} />,
};

/** Custom positioning — all placements in one view with dropdowns open. */
export const CustomPositioning = {
  render: (args: { isOpen: boolean }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 80,
        minHeight: '100vh',
        padding: 40,
      }}
    >
      {(['top', 'bottom', 'left', 'right'] as const).map(placement => (
        <div
          key={placement}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <span
            style={{
              font: 'var(--cometchat-font-caption1-medium)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            {placement}
          </span>
          <CometChatContextMenu.Root
            items={sampleItems}
            topMenuSize={2}
            placement={placement}
            forceStaticPlacement
            defaultOpen={args.isOpen}
            onOptionClicked={item => alert(item.title)}
          />
        </div>
      ))}
    </div>
  ),
};

/** With custom trigger content. */
export const CustomTrigger = {
  render: (args: { isOpen: boolean }) => (
    <StoryWrapper>
      <CometChatContextMenu.Root placement="bottom" defaultOpen={args.isOpen}>
        <CometChatContextMenu.Item item={sampleItems[0]!} variant="icon" />
        <CometChatContextMenu.Trigger tooltip="Show more">
          <span style={{ fontSize: 14, padding: '0 4px' }}>⋯</span>
        </CometChatContextMenu.Trigger>
        <CometChatContextMenu.Dropdown>
          {sampleItems.slice(1).map(item => (
            <CometChatContextMenu.Item key={item.id} item={item} variant="full" />
          ))}
        </CometChatContextMenu.Dropdown>
      </CometChatContextMenu.Root>
    </StoryWrapper>
  ),
};

/** Many items (20+). */
export const ManyItems = {
  render: (args: { isOpen: boolean }) => (
    <StoryWrapper>
      <CometChatContextMenu.Root
        items={Array.from({ length: 20 }, (_, i) => ({
          id: `item-${String(i)}`,
          title: `Action ${String(i + 1)}`,
          icon: <DropdownIcon src={editIcon} alt="" />,
          onClick: noop,
        }))}
        topMenuSize={2}
        placement="bottom"
        defaultOpen={args.isOpen}
        onOptionClicked={item => alert(item.title)}
      />
    </StoryWrapper>
  ),
};
