import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatSmartReplies } from './CometChatSmartReplies';

const meta: Meta = {
  title: 'Components/AI/Smart Replies',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'AI-powered smart reply suggestions displayed as clickable chips.',
      },
    },
  },
};
export default meta;

const mockReplies = [
  'Sounds good, let me check and get back to you.',
  'Thanks for the update!',
  'Can we schedule a call to discuss this?',
  "I agree, let's move forward with that plan.",
  'Let me review the details and follow up.',
];

const fetchSuccess = (): Promise<string[]> =>
  new Promise(resolve => setTimeout(() => resolve(mockReplies), 1000));

const fetchEmpty = (): Promise<string[]> =>
  new Promise(resolve => setTimeout(() => resolve([]), 500));

const fetchError = (): Promise<string[]> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('Network error')), 500));

const neverResolve = (): Promise<string[]> => new Promise(() => {});

/** Default — loaded state with reply suggestions. */
export const Default = () => (
  <div style={{ width: 400 }}>
    <CometChatSmartReplies.Root
      getSmartReplies={fetchSuccess}
      onSuggestionClick={reply => console.log('Selected:', reply)}
      onClose={() => console.log('Close')}
    >
      <CometChatSmartReplies.Header />
      <CometChatSmartReplies.Loading />
      <CometChatSmartReplies.Error />
      <CometChatSmartReplies.Empty />
    </CometChatSmartReplies.Root>
  </div>
);

/** Loading state — shimmer bars. */
export const Loading = () => (
  <div style={{ width: 400 }}>
    <CometChatSmartReplies.Root getSmartReplies={neverResolve} onSuggestionClick={() => {}}>
      <CometChatSmartReplies.Header />
      <CometChatSmartReplies.Loading />
    </CometChatSmartReplies.Root>
  </div>
);

/** Error state — with error message and retry. */
export const ErrorState = () => (
  <div style={{ width: 400 }}>
    <CometChatSmartReplies.Root
      getSmartReplies={fetchError}
      onSuggestionClick={() => {}}
      onClose={() => console.log('Close')}
    >
      <CometChatSmartReplies.Header />
      <CometChatSmartReplies.Loading />
      <CometChatSmartReplies.Error message="Could not load suggestions" />
    </CometChatSmartReplies.Root>
  </div>
);

/** Empty state — no suggestions returned. */
export const EmptyState = () => (
  <div style={{ width: 400 }}>
    <CometChatSmartReplies.Root
      getSmartReplies={fetchEmpty}
      onSuggestionClick={() => {}}
      onClose={() => console.log('Close')}
    >
      <CometChatSmartReplies.Header />
      <CometChatSmartReplies.Loading />
      <CometChatSmartReplies.Empty message="No suggestions available" />
    </CometChatSmartReplies.Root>
  </div>
);

/** Many replies — tests overflow/scrolling. */
export const ManyReplies = () => {
  const manyReplies = Array.from({ length: 12 }, (_, i) => `Reply suggestion ${String(i + 1)}`);
  return (
    <div style={{ width: 400 }}>
      <CometChatSmartReplies.Root
        getSmartReplies={() => Promise.resolve(manyReplies)}
        onSuggestionClick={reply => console.log('Selected:', reply)}
        onClose={() => console.log('Close')}
      >
        <CometChatSmartReplies.Header />
        <CometChatSmartReplies.Loading />
        <CometChatSmartReplies.Error />
        <CometChatSmartReplies.Empty />
      </CometChatSmartReplies.Root>
    </div>
  );
};

/** Single reply. */
export const SingleReply = () => (
  <div style={{ width: 400 }}>
    <CometChatSmartReplies.Root
      getSmartReplies={() => Promise.resolve(['Got it, thanks!'])}
      onSuggestionClick={reply => console.log('Selected:', reply)}
      onClose={() => console.log('Close')}
    >
      <CometChatSmartReplies.Header />
      <CometChatSmartReplies.Loading />
      <CometChatSmartReplies.Error />
      <CometChatSmartReplies.Empty />
    </CometChatSmartReplies.Root>
  </div>
);

/** Custom header title. */
export const CustomHeaderTitle = () => (
  <div style={{ width: 400 }}>
    <CometChatSmartReplies.Root
      getSmartReplies={fetchSuccess}
      onSuggestionClick={reply => console.log('Selected:', reply)}
      onClose={() => console.log('Close')}
    >
      <CometChatSmartReplies.Header title="AI Suggestions" />
      <CometChatSmartReplies.Loading />
      <CometChatSmartReplies.Error />
      <CometChatSmartReplies.Empty />
    </CometChatSmartReplies.Root>
  </div>
);

/** Without close button. */
export const WithoutCloseButton = () => (
  <div style={{ width: 400 }}>
    <CometChatSmartReplies.Root
      getSmartReplies={fetchSuccess}
      onSuggestionClick={reply => console.log('Selected:', reply)}
    >
      <CometChatSmartReplies.Header showCloseButton={false} />
      <CometChatSmartReplies.Loading />
      <CometChatSmartReplies.Error />
      <CometChatSmartReplies.Empty />
    </CometChatSmartReplies.Root>
  </div>
);
