import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatConversationStarter } from './CometChatConversationStarter';

const meta: Meta = {
  title: 'Components/AI/Conversation Starter',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'AI-powered conversation starter suggestions for new chats.',
      },
    },
  },
};
export default meta;

const mockSuggestions = [
  'How are you doing today?',
  'What have you been up to?',
  'Any plans for the weekend?',
  'Have you seen any good movies lately?',
  'What do you think about the weather?',
];

const fetchSuccess = (): Promise<string[]> =>
  new Promise(resolve => setTimeout(() => resolve(mockSuggestions), 1000));

const fetchEmpty = (): Promise<string[]> =>
  new Promise(resolve => setTimeout(() => resolve([]), 500));

const fetchError = (): Promise<string[]> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('Network error')), 500));

const neverResolve = (): Promise<string[]> => new Promise(() => {});

/** Default — loaded state with 5 suggestions. */
export const Default = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationStarter.Root
      getConversationStarters={fetchSuccess}
      onSuggestionClick={s => console.log('Clicked:', s)}
    >
      <CometChatConversationStarter.Loading />
      <CometChatConversationStarter.Error />
      <CometChatConversationStarter.Empty />
    </CometChatConversationStarter.Root>
  </div>
);

/** Loading state — shimmer animation. */
export const Loading = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationStarter.Root getConversationStarters={neverResolve}>
      <CometChatConversationStarter.Loading />
    </CometChatConversationStarter.Root>
  </div>
);

/** Error state — with error message and retry. */
export const ErrorState = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationStarter.Root getConversationStarters={fetchError}>
      <CometChatConversationStarter.Loading />
      <CometChatConversationStarter.Error message="Could not load suggestions" />
    </CometChatConversationStarter.Root>
  </div>
);

/** Empty state — no suggestions returned. */
export const EmptyState = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationStarter.Root getConversationStarters={fetchEmpty}>
      <CometChatConversationStarter.Loading />
      <CometChatConversationStarter.Empty message="No suggestions available" />
    </CometChatConversationStarter.Root>
  </div>
);

/** Many suggestions — tests wrapping behavior. */
export const ManySuggestions = () => {
  const fetchMany = (): Promise<string[]> =>
    Promise.resolve([
      'How are you?',
      'What is your favorite color?',
      'Tell me about your day',
      'Any recommendations?',
      'What do you think?',
      'How was your weekend?',
      'Have you tried this?',
      'What are you working on?',
      'Any exciting news?',
      'How can I help you?',
      'What is new?',
      'Tell me more',
    ]);

  return (
    <div style={{ width: 400 }}>
      <CometChatConversationStarter.Root
        getConversationStarters={fetchMany}
        onSuggestionClick={s => console.log('Clicked:', s)}
      >
        <CometChatConversationStarter.Loading />
        <CometChatConversationStarter.Error />
      </CometChatConversationStarter.Root>
    </div>
  );
};

/** With disabled items — custom item rendering. */
export const WithDisabledItems = () => {
  const suggestions = ['Enabled suggestion', 'Disabled suggestion', 'Another enabled one'];

  return (
    <div style={{ width: 400 }}>
      <CometChatConversationStarter.Root
        getConversationStarters={() => Promise.resolve(suggestions)}
      >
        <CometChatConversationStarter.Loading />
        <CometChatConversationStarter.Error />
      </CometChatConversationStarter.Root>
    </div>
  );
};
/** Custom error with retry button. */
export const CustomErrorWithRetry = () => (
  <div style={{ width: 400 }}>
    <CometChatConversationStarter.Root getConversationStarters={fetchError}>
      <CometChatConversationStarter.Loading />
      <CometChatConversationStarter.Error message="Something went wrong">
        <div style={{ textAlign: 'center', padding: 16 }}>
          <p style={{ color: 'var(--cometchat-text-color-secondary)' }}>Custom error view</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </CometChatConversationStarter.Error>
    </CometChatConversationStarter.Root>
  </div>
);
