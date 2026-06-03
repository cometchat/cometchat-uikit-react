import React, { useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatActionSheet } from './CometChatActionSheet';
import type { CometChatActionSheetItemData } from './CometChatActionSheet.types';

import photo from '../../../assets/photo.svg';
import videocam from '../../../assets/videocam.svg';
import playCircle from '../../../assets/play_circle.svg';
import attachFile from '../../../assets/document_icon.svg';
import collaborativeWhiteboard from '../../../assets/collaborative_whiteboard_fill.svg';
import collaborativeDocument from '../../../assets/collaborative_document_fill.svg';
import polls from '../../../assets/poll.svg';

function ActionIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={24}
      height={24}
      style={{
        filter:
          'brightness(0) saturate(100%) invert(32%) sepia(60%) saturate(2000%) hue-rotate(235deg) brightness(90%) contrast(95%)',
      }}
    />
  );
}

const noop = () => {};

const coreActions: CometChatActionSheetItemData[] = [
  { id: 'image', title: 'Attach Image', icon: <ActionIcon src={photo} alt="" />, onClick: noop },
  { id: 'video', title: 'Attach Video', icon: <ActionIcon src={videocam} alt="" />, onClick: noop },
  {
    id: 'audio',
    title: 'Attach Audio',
    icon: <ActionIcon src={playCircle} alt="" />,
    onClick: noop,
  },
  { id: 'file', title: 'Attach File', icon: <ActionIcon src={attachFile} alt="" />, onClick: noop },
];

const extensionActions: CometChatActionSheetItemData[] = [
  {
    id: 'whiteboard',
    title: 'Collaborative Whiteboard',
    icon: <ActionIcon src={collaborativeWhiteboard} alt="" />,
    onClick: noop,
  },
  {
    id: 'document',
    title: 'Collaborative Document',
    icon: <ActionIcon src={collaborativeDocument} alt="" />,
    onClick: noop,
  },
  { id: 'polls', title: 'Polls', icon: <ActionIcon src={polls} alt="" />, onClick: noop },
];

const allActions = [...coreActions, ...extensionActions];

const meta: Meta = {
  title: 'Components/Misc/Action Sheet',
  tags: ['autodocs'],
  args: {
    isOpen: true,
    closeOnOutsideClick: true,
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the action sheet is open.',
    },
    closeOnOutsideClick: {
      control: 'boolean',
      description: 'Whether clicking outside closes the action sheet.',
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A bottom sheet overlay displaying a list of actions in list or grid layout.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '100%',
          minHeight: '100vh',
          paddingTop: 40,
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

function DefaultDemo(args: { isOpen: boolean; closeOnOutsideClick: boolean }) {
  const [open, setOpen] = useState(args.isOpen);
  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Sheet</button>
      <CometChatActionSheet.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        closeOnOutsideClick={args.closeOnOutsideClick}
      >
        <CometChatActionSheet.Layout mode="list">
          {allActions.map(a => (
            <CometChatActionSheet.Item key={a.id} item={a} />
          ))}
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    </>
  );
}

export const Default = {
  render: (args: { isOpen: boolean; closeOnOutsideClick: boolean }) => <DefaultDemo {...args} />,
};

/** With cancel button at the bottom. */
function WithCancelButtonDemo(args: { isOpen: boolean; closeOnOutsideClick: boolean }) {
  const [open, setOpen] = useState(args.isOpen);
  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Sheet</button>
      <CometChatActionSheet.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        closeOnOutsideClick={args.closeOnOutsideClick}
      >
        <CometChatActionSheet.Layout mode="list">
          {allActions.map(a => (
            <CometChatActionSheet.Item key={a.id} item={a} />
          ))}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setOpen(false)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') setOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--cometchat-padding-3, 12px)',
              padding: 'var(--cometchat-padding-3, 12px) var(--cometchat-padding-4, 16px)',
              cursor: 'pointer',
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-primary, #141414)',
            }}
          >
            Cancel
          </div>
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    </>
  );
}

export const WithCancelButton = {
  render: (args: { isOpen: boolean; closeOnOutsideClick: boolean }) => (
    <WithCancelButtonDemo {...args} />
  ),
};

/** With disabled items. */
function WithDisabledItemsDemo(args: { isOpen: boolean; closeOnOutsideClick: boolean }) {
  const [open, setOpen] = useState(args.isOpen);
  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);
  const actions: CometChatActionSheetItemData[] = [
    { ...coreActions[0]!, id: 'image' },
    { ...coreActions[1]!, id: 'video', disabled: true },
    { ...coreActions[2]!, id: 'audio' },
    { ...coreActions[3]!, id: 'file', disabled: true },
  ];
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Sheet</button>
      <CometChatActionSheet.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        closeOnOutsideClick={args.closeOnOutsideClick}
      >
        <CometChatActionSheet.Layout>
          {actions.map(a => (
            <CometChatActionSheet.Item key={a.id} item={a} />
          ))}
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    </>
  );
}

export const WithDisabledItems = {
  render: (args: { isOpen: boolean; closeOnOutsideClick: boolean }) => (
    <WithDisabledItemsDemo {...args} />
  ),
};
