import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatStickersKeyboard } from './CometChatStickersKeyboard';
import type { CometChatStickerSet } from './CometChatStickersKeyboard.types';

const mockStickerData: CometChatStickerSet = {
  'Funny Animals': [
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/ironman.png',
      stickerSetName: 'Funny Animals',
      stickerOrder: 1,
    },
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/captainamerica.png',
      stickerSetName: 'Funny Animals',
      stickerOrder: 2,
    },
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/spiderman.png',
      stickerSetName: 'Funny Animals',
      stickerOrder: 3,
    },
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/wolverine.png',
      stickerSetName: 'Funny Animals',
      stickerOrder: 4,
    },
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/cyclops.png',
      stickerSetName: 'Funny Animals',
      stickerOrder: 5,
    },
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/ironman.png',
      stickerSetName: 'Funny Animals',
      stickerOrder: 6,
    },
  ],
  'Cool Emojis': [
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/spiderman.png',
      stickerSetName: 'Cool Emojis',
      stickerOrder: 1,
    },
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/wolverine.png',
      stickerSetName: 'Cool Emojis',
      stickerOrder: 2,
    },
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/cyclops.png',
      stickerSetName: 'Cool Emojis',
      stickerOrder: 3,
    },
  ],
  Party: [
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/captainamerica.png',
      stickerSetName: 'Party',
      stickerOrder: 1,
    },
    {
      stickerUrl: 'https://data-us.cometchat.io/assets/images/avatars/ironman.png',
      stickerSetName: 'Party',
      stickerOrder: 2,
    },
  ],
};

const meta: Meta = {
  title: 'Components/Misc/Stickers Keyboard',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A sticker picker with category tabs and sticker grid.',
      },
    },
  },
};
export default meta;

/** Default with pre-loaded data. */
export const Default = () => (
  <CometChatStickersKeyboard
    stickerData={mockStickerData}
    onStickerClick={e => console.log('Sticker clicked:', e)}
    onClose={() => console.log('Close')}
  />
);

/** Loading state. */
export const Loading = () => (
  <CometChatStickersKeyboard initialState="loading" onStickerClick={() => {}} />
);

/** Error state with retry. */
export const Error = () => (
  <CometChatStickersKeyboard
    initialState="error"
    errorStateText="Something went wrong"
    onStickerClick={() => {}}
  />
);

/** Empty state. */
export const Empty = () => (
  <CometChatStickersKeyboard
    initialState="empty"
    emptyStateText="No stickers available"
    onStickerClick={() => {}}
  />
);
