import React, { useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatEmojiKeyboard } from './CometChatEmojiKeyboard';
import type { CometChatEmojiKeyboardCategoryData } from './CometChatEmojiKeyboard.types';

const meta: Meta = {
  title: 'Components/Misc/Emoji Keyboard',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A searchable emoji picker with category tabs and skin tone selection.',
      },
    },
  },
};
export default meta;

/** Default — built-in emoji data, all categories. */
export const Default = () => {
  const [selected, setSelected] = useState('');
  return (
    <div>
      <CometChatEmojiKeyboard.Root onEmojiClick={setSelected} />
      {selected && (
        <p style={{ marginTop: 8, fontSize: 14, textAlign: 'center' }}>Selected: {selected}</p>
      )}
    </div>
  );
};

/** Custom emoji data — subset of categories. */
export const CustomEmojiData = () => {
  const customData: CometChatEmojiKeyboardCategoryData[] = [
    {
      id: 'smileys',
      name: 'Smileys',
      emojis: {
        grinning: { char: '😀', keywords: ['face', 'smile', 'happy'] },
        joy: { char: '😂', keywords: ['face', 'cry', 'tears', 'happy'] },
        heart_eyes: { char: '😍', keywords: ['face', 'love', 'heart'] },
        thinking: { char: '🤔', keywords: ['face', 'think', 'hmm'] },
        thumbsup: { char: '👍', keywords: ['thumb', 'up', 'approve'] },
        wave: { char: '👋', keywords: ['hand', 'wave', 'hello'] },
      },
    },
    {
      id: 'animals',
      name: 'Animals',
      emojis: {
        dog: { char: '🐶', keywords: ['animal', 'dog', 'puppy'] },
        cat: { char: '🐱', keywords: ['animal', 'cat', 'kitten'] },
        unicorn: { char: '🦄', keywords: ['animal', 'unicorn', 'magic'] },
      },
    },
  ];

  return <CometChatEmojiKeyboard.Root emojiData={customData} />;
};

/** Single category. */
export const SingleCategory = () => {
  const singleCategory: CometChatEmojiKeyboardCategoryData[] = [
    {
      id: 'hearts',
      name: 'Hearts',
      emojis: {
        red_heart: { char: '❤️', keywords: ['heart', 'love', 'red'] },
        orange_heart: { char: '🧡', keywords: ['heart', 'orange'] },
        yellow_heart: { char: '💛', keywords: ['heart', 'yellow'] },
        green_heart: { char: '💚', keywords: ['heart', 'green'] },
        blue_heart: { char: '💙', keywords: ['heart', 'blue'] },
        purple_heart: { char: '💜', keywords: ['heart', 'purple'] },
        sparkling_heart: { char: '💖', keywords: ['heart', 'sparkle'] },
      },
    },
  ];

  return <CometChatEmojiKeyboard.Root emojiData={singleCategory} />;
};

/** With onClose callback. */
export const WithCloseCallback = () => {
  const [closed, setClosed] = useState(false);

  if (closed) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p>Keyboard closed via Escape key</p>
        <button onClick={() => setClosed(false)}>Reopen</button>
      </div>
    );
  }

  return <CometChatEmojiKeyboard.Root onClose={() => setClosed(true)} />;
};
/** Compound composition — custom layout with children. */
export const CompoundComposition = () => {
  const [selected, setSelected] = useState('');

  return (
    <div>
      <CometChatEmojiKeyboard.Root onEmojiClick={setSelected}>
        <CometChatEmojiKeyboard.SearchBar />
        <CometChatEmojiKeyboard.CategoryTabs />
      </CometChatEmojiKeyboard.Root>
      {selected && (
        <p style={{ marginTop: 8, fontSize: 14, textAlign: 'center' }}>Selected: {selected}</p>
      )}
    </div>
  );
};
